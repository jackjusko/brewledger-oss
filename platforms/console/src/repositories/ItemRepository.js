import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';

import { LedgerRepository } from './LedgerRepository';

const getContext = async () => {
  const session = await AuthService.getSession();
  return {
    orgId: session ? session.orgId : null,
    now: new Date().toISOString()
  };
};

export const ItemRepository = {
  // Helper exposed for views if needed
  async getContext() {
    return await getContext();
  },

  async getAll() {
    const { orgId } = await getContext();
    if (orgId) {
      return await db.items.where('org_id').equals(orgId).filter(i => !i.deleted_at).toArray();
    }
    return await db.items.filter(i => !i.org_id && !i.deleted_at).toArray();
  },

  async getById(id) {
    return await db.items.get(id);
  },

  async create(item) {
    const { orgId, now } = await getContext();
    const defaultUnitCost = typeof item.default_unit_cost === 'number' ? item.default_unit_cost : 0;
    const currency = item.currency || 'USD';
    const data = { ...(item.data || {}) };
    if (item.volume_per_unit != null && typeof item.volume_per_unit === 'number' && item.volume_per_unit > 0) {
      data.volume_per_unit = item.volume_per_unit;
    }
    if (item.base_beer_item_id) data.base_beer_item_id = item.base_beer_item_id;
    const newItem = {
      ...item,
      data: Object.keys(data).length ? data : undefined,
      default_unit_cost: defaultUnitCost,
      currency,
      id: uuidv4(),
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };
    delete newItem.volume_per_unit;
    delete newItem.base_beer_item_id;
    await db.items.add(newItem);
    return newItem;
  },

  async update(id, updates) {
    const { now } = await getContext();
    const current = await this.getById(id);
    const data = { ...(current?.data || {}), ...(updates.data || {}) };
    if (updates.volume_per_unit !== undefined) {
      if (updates.volume_per_unit != null && typeof updates.volume_per_unit === 'number' && updates.volume_per_unit > 0) {
        data.volume_per_unit = updates.volume_per_unit;
      } else {
        delete data.volume_per_unit;
      }
    }
    if (updates.base_beer_item_id !== undefined) {
      if (updates.base_beer_item_id) data.base_beer_item_id = updates.base_beer_item_id;
      else delete data.base_beer_item_id;
    }
    const updated = {
      ...updates,
      data: Object.keys(data).length ? data : (current?.data || undefined),
      default_unit_cost: updates.default_unit_cost !== undefined ? updates.default_unit_cost : (current?.default_unit_cost ?? 0),
      currency: updates.currency || current?.currency || 'USD',
      updated_at: now,
      sync_status: 'pending',
      version: (current && current.version ? current.version : 0) + 1
    };
    delete updated.volume_per_unit;
    delete updated.base_beer_item_id;
    await db.items.update(id, updated);
    return await this.getById(id);
  },

  async delete(id) {
    const { now } = await getContext();

    const doc = await db.items.get(id);
    if (!doc) return;

    // The default "Finished Beer" item (created by TTB migration) cannot be deleted
    if (doc.category === 'Finished Beer' && doc.name === 'Finished Beer') {
      throw new Error('The default Finished Beer item cannot be deleted. It is required for TTB reporting and production tracking.');
    }

    // 1. Zero out inventory (Create CONSUME entries for any positive onhand)
    const cacheEntries = await db.onhand_cache.where('item_id').equals(id).toArray();
    for (const entry of cacheEntries) {
      if (entry.quantity > 0) {
        await LedgerRepository.addEntry({
          type: 'CONSUME',
          item_id: id,
          location_id: entry.location_id,
          quantity: -entry.quantity,
          note: 'System: Item Deleted'
        });
      }
    }

    // Soft delete + pending sync
    await db.items.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: (doc.version || 0) + 1
    });
  },

  async applyRemoteUpsert(item) {
    const local = await db.items.get(item.id);
    if (!local) {
      await db.items.put(item);
    } else {
      // If remote is newer, overwrite.
      // If we have local changes pending, we might have a conflict.
      // Simple rule: Server wins. Overwrite.
      // (Advanced: compare timestamps, but user asked for "Server Authoritative")
      await db.items.put(item);
    }
  },

  /**
   * Items in the beer category (Finished Beer) for TTB and production complete.
   * @param {{ includeDeleted?: boolean }} [options] - If includeDeleted is true, soft-deleted beer items are included (for TTB reporting so historical ledger entries count).
   */
  async getBeerItems(options = {}) {
    const { includeDeleted = false } = options;
    const { orgId } = await getContext();
    if (!orgId) return [];
    return await db.items
      .where('org_id')
      .equals(orgId)
      .filter(i => i.category === 'Finished Beer' && (includeDeleted || !i.deleted_at))
      .toArray();
  },

  /**
   * Items in the Packaging category (empty kegs, cans, caps, carriers, etc.).
   */
  async getPackagingItems() {
    const { orgId } = await getContext();
    if (!orgId) return [];
    return await db.items
      .where('org_id')
      .equals(orgId)
      .filter(i => i.category === 'Packaging' && !i.deleted_at)
      .toArray();
  },

  /**
   * Normalize batch/beer name for comparison: trim, collapse whitespace, lower-case.
   */
  normalizeBeerName(name) {
    if (name == null || typeof name !== 'string') return '';
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  },

  /**
   * Resolve or create the Finished Beer item for a batch when marking production complete.
   * - If batch has recipe_id: use the beer item linked to that recipe (same product as other batches from that recipe).
   * - Else: use beer item with exact same normalized name (two batches with same name = same beer).
   * - If none found: create a new beer item (category Finished Beer, unit bbl, optional recipe_id).
   * Never returns or overwrites the default "Finished Beer" item for a named batch.
   */
  async getOrCreateBeerItemForBatch(batch) {
    const { orgId } = await getContext();
    if (!orgId) throw new Error('Not authenticated');
    const beerItems = await this.getBeerItems();

    if (batch.recipe_id) {
      const byRecipe = beerItems.find(i => i.recipe_id === batch.recipe_id);
      if (byRecipe) return byRecipe;
    }

    const batchName = (batch.name != null && String(batch.name).trim()) ? String(batch.name).trim() : null;
    const normalizedBatch = this.normalizeBeerName(batchName || '');

    if (normalizedBatch) {
      const byName = beerItems.find(i => this.normalizeBeerName(i.name) === normalizedBatch);
      if (byName) return byName;
    }

    const newItem = await this.create({
      name: batchName || 'Finished Beer',
      category: 'Finished Beer',
      unit: 'bbl',
      recipe_id: batch.recipe_id || undefined
    });
    return newItem;
  },

  /**
   * Resolve or create a packaged beer item (keg/case format).
   * @param {Object} baseBeerItem - The bulk beer item (e.g. House IPA)
   * @param {string} formatKey - e.g. '1/6 bbl', '1/2 bbl', '12pk'
   * @param {number} volumePerUnit - bbl per ea
   * @returns {Promise<Object>} Packaged beer item
   */
  async getOrCreatePackagedBeerItem(baseBeerItem, formatKey, volumePerUnit) {
    const { orgId } = await getContext();
    if (!orgId) throw new Error('Not authenticated');
    const beerItems = await this.getBeerItems();
    const baseName = (baseBeerItem.name || '').trim();
    const targetName = `${baseName} ${formatKey}`.trim();
    const normalizedTarget = this.normalizeBeerName(targetName);
    const byName = beerItems.find(
      (i) => (i.unit === 'ea' || i.unit === 'each') &&
        (this.normalizeBeerName(i.name) === normalizedTarget ||
          (i.data?.base_beer_item_id === baseBeerItem.id && i.name?.includes(formatKey)))
    );
    if (byName) return byName;
    const newItem = await this.create({
      name: targetName || `${baseName} ${formatKey}`,
      category: 'Finished Beer',
      unit: 'ea',
      volume_per_unit: volumePerUnit,
      base_beer_item_id: baseBeerItem.id
    });
    return newItem;
  }
};
