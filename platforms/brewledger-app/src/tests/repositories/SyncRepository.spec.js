import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncRepository } from '../../src/repositories/SyncRepository';
import { db } from '../../src/db';

describe('SyncRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should count pending operations across tables', async () => {
    // 1. Add pending items
    await db.items.add({ id: 'i1', name: 'Item 1', sync_status: 'pending' });
    await db.items.add({ id: 'i2', name: 'Item 2', sync_status: 'synced' });
    
    // 2. Add pending locations
    await db.locations.add({ id: 'l1', name: 'Loc 1', sync_status: 'pending' });
    
    // 3. Count
    const pending = await SyncRepository.getPendingOps();
    
    // Should be 2 (1 item + 1 location)
    expect(pending.length).toBe(2);
  });
});
