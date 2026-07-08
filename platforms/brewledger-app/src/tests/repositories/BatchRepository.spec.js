import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchRepository } from '../../src/repositories/BatchRepository';
import { BatchMilestoneRepository } from '../../src/repositories/BatchMilestoneRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('BatchRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create a batch and initialize milestones', async () => {
    const batchData = {
      name: 'Batch 1',
      brew_type: 'Ale',
      target_volume: 100
    };

    const created = await BatchRepository.create(batchData);

    expect(created.id).toBeDefined();
    expect(created.status).toBe('PLANNED');
    expect(created.org_id).toBe('test-org');

    // Check milestones using BatchMilestoneRepository directly
    const milestones = await BatchMilestoneRepository.getByBatchId(created.id);
    expect(milestones.length).toBeGreaterThan(0);
    // initForBatch creates KNOCKOUT
    expect(milestones.some(m => m.milestone_type === 'KNOCKOUT')).toBe(true);
  });

  it('should update status and trigger milestones', async () => {
    const batch = await BatchRepository.create({ name: 'Batch 2' });
    
    // Update to IN_PROGRESS
    const updated = await BatchRepository.updateStatus(batch.id, 'IN_PROGRESS');
    expect(updated.status).toBe('IN_PROGRESS');
    
    const milestones = await BatchMilestoneRepository.getByBatchId(batch.id);
    expect(milestones.length).toBeGreaterThan(0);
  });

  it('should create batch with single vessel (legacy path)', async () => {
    const { BatchLocationRepository } = await import('../../src/repositories/BatchLocationRepository');
    const batch = await BatchRepository.create({
      name: 'Batch 3',
      vessel_id: 'vessel-1',
      planned_volume: 10
    });
    expect(batch.id).toBeDefined();
    expect(batch.total_theoretical_volume).toBe(10);
    const splits = await BatchLocationRepository.getByBatchId(batch.id);
    expect(splits.length).toBe(1);
    expect(splits[0].vessel_id).toBe('vessel-1');
    expect(splits[0].current_volume).toBe(10);
  });
});
