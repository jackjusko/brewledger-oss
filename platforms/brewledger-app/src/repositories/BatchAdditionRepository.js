import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';
import { LedgerRepository } from './LedgerRepository';
import { BatchMilestoneRepository } from './BatchMilestoneRepository';
import { BatchCostService } from '../services/BatchCostService';

const getContext = async () => {
  const session = await AuthService.getSession();
  return {
    orgId: session ? session.orgId : null,
    now: new Date().toISOString()
  };
};

const resolveUnitCost = async (itemId) => {
  if (!itemId) return null;
  const entries = await db.ledger_entries.where('item_id').equals(itemId).toArray();
  entries.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const latestReceive = entries.find(e => e.type === 'RECEIVE' && e.unit_cost != null);
  if (latestReceive && latestReceive.unit_cost != null) return latestReceive.unit_cost;
  const item = await db.items.get(itemId);
  return item?.default_unit_cost ?? null;
};

export const BatchAdditionRepository = {
  async getByBatchId(batchId) {
    return await db.batch_additions.where('batch_id').equals(batchId).toArray();
  },

  async add(addition) {
    const { orgId, now } = await getContext();
    const id = uuidv4();
    const unitCost = addition.unit_cost != null ? Number(addition.unit_cost) : await resolveUnitCost(addition.item_id);
    const totalCost = unitCost != null && addition.quantity ? unitCost * -Math.abs(addition.quantity) : null;
    
    const newAddition = {
      ...addition,
      id,
      org_id: orgId,
      added_at: addition.added_at || now,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1,
      unit_cost: unitCost,
      total_cost: totalCost
    };

    // Fix DataCloneError by ensuring plain objects (no Proxies)
    const additionPlain = JSON.parse(JSON.stringify(newAddition));
    
    await db.transaction('rw', ['batch_additions', 'ledger_entries', 'onhand_cache', 'batch_milestones'], async () => {
      // 1. Create Addition Record
      await db.batch_additions.add(additionPlain);
        
      // 2. Create Ledger CONSUME Entry
      if (addition.item_id && addition.quantity && addition.location_id) {
        // ... (existing ledger logic)
        const consumeEntry = {
          type: 'CONSUME',
          item_id: addition.item_id,
          location_id: addition.location_id,
          batch_id: addition.batch_id,
          quantity: -Math.abs(addition.quantity), // Ensure negative
          created_at: newAddition.added_at,
          unit_cost: unitCost,
          total_cost: totalCost
        };
        
        const ledgerId = uuidv4();
        
        const finalLedgerEntry = {
          ...consumeEntry,
          id: ledgerId,
          org_id: orgId, // Reusing orgId from outer scope
          created_at: consumeEntry.created_at || now, // Reusing now from outer scope
          sync_status: 'pending',
          version: 1
        };

        // Add to ledger
        await db.ledger_entries.add(finalLedgerEntry);

        // Update Cache (Inline logic from LedgerRepository.updateCache)
        const { item_id, location_id, quantity } = finalLedgerEntry;
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
      }
    });

    // Milestone Check (Outside transaction to avoid complexity with MilestoneRepo, or simplistic check)
    if (addition.event_type === 'Yeast') {
       await BatchMilestoneRepository.ensure(addition.batch_id, 'PITCHED', newAddition.added_at);
    }

    // Update batch cost snapshot
    await BatchCostService.computeAndStore(addition.batch_id);

    return newAddition;
  },

  async applyRemoteUpsert(addition) {
    const local = await db.batch_additions.get(addition.id);
    if (!local) {
      await db.batch_additions.put(addition);
    } else {
      await db.batch_additions.put(addition);
    }
  }
};
