import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';

const getContext = async () => {
  const session = await AuthService.getSession();
  return {
    orgId: session ? session.orgId : null,
    now: new Date().toISOString()
  };
};

export const LedgerRepository = {
  async addEntry(entry) {
    const { orgId, now } = await getContext();
    const unitCost = entry.unit_cost != null ? Number(entry.unit_cost) : null;
    const totalCost = entry.total_cost != null
      ? Number(entry.total_cost)
      : (unitCost != null && typeof entry.quantity === 'number' ? unitCost * entry.quantity : null);
    
    // Resolve names for snapshotting (to preserve history if deleted)
    let itemName = entry.item_name;
    let locationName = entry.location_name;
    let batchName = entry.batch_name;

    if (!itemName && entry.item_id) {
      const item = await db.items.get(entry.item_id);
      if (item) itemName = item.name;
    }
    
    if (!locationName && entry.location_id) {
      const loc = await db.locations.get(entry.location_id);
      if (loc) locationName = loc.name;
    }

    if (!batchName && entry.batch_id) {
      const batch = await db.batches.get(entry.batch_id);
      if (batch) batchName = batch.name;
    }

    const newEntry = {
      ...entry,
      id: uuidv4(),
      client_request_id: uuidv4(),
      org_id: orgId,
      created_at: entry.created_at || now,
      sync_status: 'pending',
      version: 1,
      // Store snapshots
      item_name: itemName,
      location_name: locationName,
      batch_name: batchName,
      unit_cost: unitCost,
      total_cost: totalCost,
      vendor: entry.vendor || null,
      invoice_number: entry.invoice_number || null,
      qbo_bill_id: entry.qbo_bill_id || null,
      // TTB classification fields (optional, stored in entry object, synced to server data JSON)
      removal_purpose: entry.removal_purpose || null,
      tax_status: entry.tax_status || null,
      operation_type: entry.operation_type || null,
      related_brewery_id: entry.related_brewery_id || null,
      return_of_ledger_id: entry.return_of_ledger_id || null,
      // consumption_form for Line 21 column (cellar|keg|case); persisted in data for sync
      // operation_type and ttb_stage for TTB operation-driven column assignment
      data: {
        ...(entry.data || {}),
        ...(entry.consumption_form != null ? { consumption_form: entry.consumption_form } : {}),
        ...(entry.operation_type != null ? { operation_type: entry.operation_type } : {}),
        ...(entry.data?.ttb_stage != null ? { ttb_stage: entry.data.ttb_stage } : {})
      }
    };
    
    await db.transaction('rw', db.ledger_entries, db.onhand_cache, async () => {
      // 1. Add ledger entry
      await db.ledger_entries.add(newEntry);

      // 2. Update cache
      await this.updateCache(newEntry);
    });

    const item = await db.items.get(newEntry.item_id);
    if (item && !item.deleted_at && item.category === 'Finished Beer') {
      await this.cleanupBeerItemsAtZero();
    }

    return newEntry;
  },

  async transfer({ itemId, fromLocationId, toLocationId, quantity, note, operationType, batchId, created_at: createdAt }) {
    const { orgId, now } = await getContext();
    const transferGroupId = uuidv4();
    const ts = createdAt || now;

    const item = await db.items.get(itemId);
    const fromLoc = await db.locations.get(fromLocationId);
    const toLoc = await db.locations.get(toLocationId);
    const batch = batchId ? await db.batches.get(batchId) : null;

    const common = {
      item_id: itemId,
      org_id: orgId,
      created_at: ts,
      sync_status: 'pending',
      version: 1,
      transfer_group_id: transferGroupId,
      item_name: item ? item.name : undefined,
      note: note,
      operation_type: operationType || null,
      batch_id: batchId || null,
      batch_name: batch ? batch.name : undefined
    };

    const outEntry = {
      ...common,
      id: uuidv4(),
      client_request_id: uuidv4(),
      type: 'TRANSFER_OUT',
      location_id: fromLocationId,
      location_name: fromLoc ? fromLoc.name : undefined,
      quantity: -Math.abs(quantity)
    };

    const inEntry = {
      ...common,
      id: uuidv4(),
      client_request_id: uuidv4(),
      type: 'TRANSFER_IN',
      location_id: toLocationId,
      location_name: toLoc ? toLoc.name : undefined,
      quantity: Math.abs(quantity)
    };

    await db.transaction('rw', db.ledger_entries, db.onhand_cache, async () => {
      await db.ledger_entries.add(outEntry);
      await db.ledger_entries.add(inEntry);
      await this.updateCache(outEntry);
      await this.updateCache(inEntry);
    });

    if (item && !item.deleted_at && item.category === 'Finished Beer') {
      await this.cleanupBeerItemsAtZero();
    }

    return { outEntry, inEntry };
  },

  /**
   * Soft-delete Finished Beer items that have zero total on-hand across all locations.
   * Skips: (1) default "Finished Beer" item (required for TTB), (2) packaged beer items
   * (base_beer_item_id set) which are product SKUs that should persist even when sold out.
   * Preserves ledger history.
   */
  async cleanupBeerItemsAtZero() {
    const { orgId, now } = await getContext();
    const beerItems = await db.items
      .where('org_id')
      .equals(orgId)
      .filter(i => !i.deleted_at && i.category === 'Finished Beer')
      .toArray();
    for (const item of beerItems) {
      if (item.name === 'Finished Beer' && item.category === 'Finished Beer') continue;
      if (item.data?.base_beer_item_id) continue; // packaged beer (keg/case) - keep SKU
      const total = await this.getTotalOnhand(item.id);
      if (total <= 0) {
        await db.items.update(item.id, {
          deleted_at: now,
          updated_at: now,
          sync_status: 'pending',
          version: (item.version || 0) + 1
        });
      }
    }
  },

  async reverseEntry(originalEntry, reason) {
    // Prevent double reversal
    const existing = await db.ledger_entries.where('reversed_of_ledger_id').equals(originalEntry.id).first();
    if (existing) {
      throw new Error('This entry has already been reversed.');
    }

    const { orgId, now } = await getContext();
    
    const reversalEntry = {
      id: uuidv4(),
      client_request_id: uuidv4(),
      org_id: orgId,
      type: originalEntry.type, // Keep same type for simplicity, or could use REVERSAL
      // But requirement says: "reversed_of_ledger_id" identifies it.
      // Actually, standard practice is usually a new type or same type with negative qty.
      // Requirement: "Create new ledger entries that negate the quantity... reversed_of_ledger_id... nullable FK"
      
      item_id: originalEntry.item_id,
      location_id: originalEntry.location_id,
      batch_id: originalEntry.batch_id,
      quantity: -originalEntry.quantity, // Negate
      
      reversed_of_ledger_id: originalEntry.id,
      created_at: now,
      sync_status: 'pending',
      version: 1,
      unit_cost: originalEntry.unit_cost ?? null,
      total_cost: originalEntry.total_cost != null ? -originalEntry.total_cost : null,
      vendor: originalEntry.vendor || null,
      invoice_number: originalEntry.invoice_number || null,
      qbo_bill_id: null,
      
      // Snapshots
      item_name: originalEntry.item_name,
      location_name: originalEntry.location_name,
      batch_name: originalEntry.batch_name,
      
      note: `Undo: ${reason || 'Correction'}`,
      
      // Copy group IDs if we want to trace back, but usually new entry stands alone linked by reversed_of
      // If original was part of a transfer, we might want to reverse both parts.
      // But let's stick to single entry reversal for now unless it's a transfer.
    };

    await db.transaction('rw', db.ledger_entries, db.onhand_cache, async () => {
      await db.ledger_entries.add(reversalEntry);
      await this.updateCache(reversalEntry);
    });

    const revItem = await db.items.get(originalEntry.item_id);
    if (revItem && !revItem.deleted_at && revItem.category === 'Finished Beer') {
      await this.cleanupBeerItemsAtZero();
    }

    return reversalEntry;
  },

  async updateCache(entry) {
    const { item_id, location_id, quantity } = entry;
      
    const cached = await db.onhand_cache.get({ item_id, location_id });
    
    if (cached) {
      await db.onhand_cache.update(cached, {
        quantity: cached.quantity + quantity,
        updated_at: new Date().toISOString()
      });
    } else {
      await db.onhand_cache.add({
        item_id,
        location_id,
        quantity: quantity,
        updated_at: new Date().toISOString()
      });
    }
  },

  /** Batch IDs that have a RECEIVE entry with data.source === 'production_complete' (marked production complete). */
  async getProductionCompleteBatchIds() {
    const entries = await this.getEntries({ type: 'RECEIVE' });
    return [...new Set(
      entries
        .filter(e => (e.data || {}).source === 'production_complete' && e.batch_id)
        .map(e => e.batch_id)
    )];
  },

  async getEntries(filters = {}) {
    let collection = db.ledger_entries.orderBy('created_at').reverse();
    const { orgId } = await getContext();
    
    // Always filter by orgId if logged in
    let results = await collection.toArray();
    if (orgId) {
      results = results.filter(e => e.org_id === orgId);
    } else {
      results = results.filter(e => !e.org_id);
    }
    
    // Simple in-memory filtering for MVP
    if (filters.item_id) {
      results = results.filter(e => e.item_id === filters.item_id);
    } else if (filters.location_id) {
      results = results.filter(e => e.location_id === filters.location_id);
    }
    
    if (filters.type) {
      results = results.filter(e => e.type === filters.type);
    }
    if (filters.startDate) {
      results = results.filter(e => e.created_at >= filters.startDate);
    }
    if (filters.endDate) {
      results = results.filter(e => e.created_at <= filters.endDate);
    }
    if (filters.count_session_id) {
      results = results.filter(e => e.count_session_id === filters.count_session_id);
    }
    if (filters.batch_id) {
      results = results.filter(e => e.batch_id === filters.batch_id);
    }
    
    return results;
  },

  async getOnhand(itemId, locationId) {
    const cached = await db.onhand_cache.get({ item_id: itemId, location_id: locationId });
    return cached ? cached.quantity : 0;
  },
  
  async getOnhandByLocation(locationId) {
    return await db.onhand_cache.where('location_id').equals(locationId).toArray();
  },

  async getTotalOnhand(itemId) {
    const entries = await db.onhand_cache.where('item_id').equals(itemId).toArray();
    return entries.reduce((sum, entry) => sum + entry.quantity, 0);
  },
  
  async getAllOnhand() {
    return await db.onhand_cache.toArray();
  },

  async recomputeCache() {
    await db.onhand_cache.clear();
    const allEntries = await db.ledger_entries.orderBy('created_at').toArray();
    for (const entry of allEntries) {
      await this.updateCache(entry);
    }
  },

  // Set cache directly from server snapshot (for optimization)
  async setCacheFromSnapshot(snapshot) {
    // Clear existing cache first? 
    // If we rely on snapshot, we assume it's the truth + local pending.
    // However, if we have local pending entries that the server hasn't seen yet, 
    // the snapshot might be "behind" our local reality if we just queued them.
    // BUT SyncService pushes local changes BEFORE fetching updates.
    // So the server snapshot should include our pushed changes if they succeeded.
    // If they failed/offline, we wouldn't be in the fetch phase (usually).
    
    // Safety: Clear cache and populate
    await db.onhand_cache.clear();
    
    const entries = snapshot.map(s => ({
      item_id: s.item_id,
      location_id: s.location_id,
      quantity: s.quantity
    }));
    
    await db.onhand_cache.bulkPut(entries);
  },

  async applyRemoteEntry(entry) {
    const exists = await db.ledger_entries.get(entry.id);
    if (!exists) {
      await db.ledger_entries.add(entry);
      await this.updateCache(entry);
      const item = await db.items.get(entry.item_id);
      if (item && !item.deleted_at && item.category === 'Finished Beer') {
        await this.cleanupBeerItemsAtZero();
      }
    }
  }
};
