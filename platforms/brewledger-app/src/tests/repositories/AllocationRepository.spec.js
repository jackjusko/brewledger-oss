import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AllocationRepository } from '../../src/repositories/AllocationRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('AllocationRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should allocate items', async () => {
    const alloc = await AllocationRepository.allocate('batch-1', 'item-1', 'loc-1', 100);
    
    expect(alloc.id).toBeDefined();
    expect(alloc.batch_id).toBe('batch-1');
    expect(alloc.quantity).toBe(100);
  });

  it('should retrieve allocations by batch', async () => {
    await AllocationRepository.allocate('batch-1', 'item-1', 'loc-1', 10);
    await AllocationRepository.allocate('batch-1', 'item-2', 'loc-1', 20);
    
    const batchAllocs = await AllocationRepository.getByBatchId('batch-1');
    expect(batchAllocs).toHaveLength(2);
  });
});
