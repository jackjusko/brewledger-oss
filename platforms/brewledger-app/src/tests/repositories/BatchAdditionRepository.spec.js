import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchAdditionRepository } from '../../src/repositories/BatchAdditionRepository';
import { BatchMilestoneRepository } from '../../src/repositories/BatchMilestoneRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

// We mock BatchMilestoneRepository because it is called by BatchAdditionRepository
vi.mock('../../src/repositories/BatchMilestoneRepository', () => ({
  BatchMilestoneRepository: {
    ensure: vi.fn()
  }
}));

describe('BatchAdditionRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should add an addition and update inventory', async () => {
    // 1. Setup inventory
    await db.onhand_cache.add({ item_id: 'yeast-1', location_id: 'fridge-1', quantity: 10 });
    
    const addition = await BatchAdditionRepository.add({
      batch_id: 'batch-1',
      item_id: 'yeast-1',
      location_id: 'fridge-1',
      quantity: 1,
      event_type: 'Yeast'
    });
    
    expect(addition.id).toBeDefined();
    
    // 2. Verify Ledger Entry
    const entries = await db.ledger_entries.where('item_id').equals('yeast-1').toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('CONSUME');
    expect(entries[0].quantity).toBe(-1);
    
    // 3. Verify Cache Update
    const cached = await db.onhand_cache.get({ item_id: 'yeast-1', location_id: 'fridge-1' });
    expect(cached.quantity).toBe(9); // 10 - 1
  });

  it('should trigger PITCHED milestone when adding Yeast', async () => {
    await BatchAdditionRepository.add({
      batch_id: 'batch-1',
      event_type: 'Yeast',
      item_id: 'yeast-1',
      location_id: 'fridge-1',
      quantity: 1
    });
    
    expect(BatchMilestoneRepository.ensure).toHaveBeenCalledWith('batch-1', 'PITCHED', expect.any(String));
  });
});
