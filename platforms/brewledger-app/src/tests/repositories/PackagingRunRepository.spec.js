import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PackagingRunRepository } from '../../src/repositories/PackagingRunRepository';
import { BatchMilestoneRepository } from '../../src/repositories/BatchMilestoneRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

vi.mock('../../src/repositories/BatchMilestoneRepository', () => ({
  BatchMilestoneRepository: {
    ensure: vi.fn()
  }
}));

describe('PackagingRunRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create packaging run and consume supplies', async () => {
    // 1. Setup inventory
    await db.onhand_cache.add({ item_id: 'cans', location_id: 'wh-1', quantity: 1000 });
    
    const run = await PackagingRunRepository.create({
      batch_id: 'batch-1',
      total_units: 100,
      format: 'Cans'
    }, [
      { item_id: 'cans', location_id: 'wh-1', quantity: 100 }
    ]);
    
    expect(run.id).toBeDefined();
    expect(run.total_units).toBe(100);
    
    // 2. Verify Ledger Consumption
    const ledger = await db.ledger_entries.where('item_id').equals('cans').first();
    expect(ledger.type).toBe('CONSUME');
    expect(ledger.quantity).toBe(-100);
    
    // 3. Verify Cache Update
    const cached = await db.onhand_cache.get({ item_id: 'cans', location_id: 'wh-1' });
    expect(cached.quantity).toBe(900);
  });

  it('should trigger PACKAGING_START milestone', async () => {
    await PackagingRunRepository.create({
      batch_id: 'batch-1',
      total_units: 50
    });
    
    expect(BatchMilestoneRepository.ensure).toHaveBeenCalledWith('batch-1', 'PACKAGING_START', expect.any(String));
  });
});
