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

export const PackagingRunRepository = {
  async getByBatchId(batchId) {
    return await db.packaging_runs.where('batch_id').equals(batchId).reverse().sortBy('packaged_at');
  },

  async create(run, suppliesUsed = []) {
    const { orgId, now } = await getContext();
    const id = uuidv4();
    
    const newRun = {
      ...run,
      id,
      org_id: orgId,
      packaged_at: run.packaged_at || now,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };

    // Fix DataCloneError by ensuring plain objects (no Proxies)
    const runPlain = JSON.parse(JSON.stringify(newRun));
    
    await db.transaction('rw', [db.packaging_runs, db.ledger_entries, db.onhand_cache], async () => {
      // 1. Create Packaging Run
      await db.packaging_runs.add(runPlain);

      // 2. Consume Supplies (if any)
      for (const supply of suppliesUsed) {
        if (supply.item_id && supply.quantity && supply.location_id) {
          const unitCost = supply.unit_cost != null ? Number(supply.unit_cost) : await resolveUnitCost(supply.item_id);
          const totalCost = unitCost != null ? unitCost * -Math.abs(supply.quantity) : null;
          // Note: Calling LedgerRepository.addEntry inside this transaction might fail 
          // if it tries to open a new transaction or access auth_state. 
          // Ideally we inline logic or use a transaction-aware repo.
          // For MVP safety, we'll inline minimal logic or rely on Dexie's auto-transaction handling 
          // if LedgerRepository uses `db.ledger_entries.add` directly without `db.transaction`.
          // But LedgerRepository.addEntry DOES use `db.transaction`. 
          // So we should inline the ledger logic here too, similar to BatchAdditionRepository.
          
          const ledgerId = uuidv4();
          const ledgerEntry = {
            id: ledgerId,
            type: 'CONSUME',
            item_id: supply.item_id,
            location_id: supply.location_id,
            batch_id: run.batch_id,
            quantity: -Math.abs(supply.quantity),
            created_at: newRun.packaged_at,
            org_id: orgId,
            sync_status: 'pending',
            version: 1,
            operation_type: 'packaging_supply',
            unit_cost: unitCost,
            total_cost: totalCost
          };
          
          await db.ledger_entries.add(ledgerEntry);
          
          // Update Cache
          const cached = await db.onhand_cache.get({ item_id: supply.item_id, location_id: supply.location_id });
          if (cached) {
            await db.onhand_cache.update(cached, { quantity: cached.quantity + ledgerEntry.quantity });
          } else {
            await db.onhand_cache.add({
               item_id: supply.item_id,
               location_id: supply.location_id,
               quantity: ledgerEntry.quantity
            });
          }
        }
      }
    });

    // Milestone Auto-creation
    await BatchMilestoneRepository.ensure(run.batch_id, 'PACKAGING_START', newRun.packaged_at);
    await BatchCostService.computeAndStore(run.batch_id);

    return newRun;
  },

  async applyRemoteUpsert(run) {
    const local = await db.packaging_runs.get(run.id);
    if (!local) {
      await db.packaging_runs.put(run);
    } else {
      await db.packaging_runs.put(run);
    }
  }
};
