import { db } from '../db';

export const SyncRepository = {
  // Deprecated Outbox pattern - now we count entities with sync_status = 'pending'
  async getPendingOps() {
    const tables = [
      'items', 'locations', 'batches', 'count_sessions',
      'ledger_entries', 'vessels', 'batch_additions',
      'batch_readings', 'packaging_runs', 'batch_locations',
      'batch_volume_adjustments'
    ];
    
    let total = 0;
    
    // We iterate sequentially to be safe, though Promise.all is faster.
    // For small data it's negligible.
    for (const table of tables) {
      if (db[table]) {
        try {
          const count = await db[table].where('sync_status').equals('pending').count();
          total += count;
        } catch (e) {
          // Ignore tables that might not exist yet or other weird Dexie errors
          console.warn(`Failed to count pending for ${table}`, e);
        }
      }
    }
    
    // Return array of dummy objects just to satisfy length check in SyncStatus.vue
    return new Array(total).fill({});
  },

  async enqueueOp() {
    // No-op: We now write directly to entities with sync_status='pending'
  },

  async markOpsSent() {
    // No-op
  }
};
