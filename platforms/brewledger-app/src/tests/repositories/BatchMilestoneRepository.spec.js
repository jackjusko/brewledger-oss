import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchMilestoneRepository } from '../../src/repositories/BatchMilestoneRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('BatchMilestoneRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create and retrieve milestones', async () => {
    const milestone = await BatchMilestoneRepository.create({
      batch_id: 'batch-1',
      milestone_type: 'KNOCKOUT',
      completed: true
    });
    
    expect(milestone.id).toBeDefined();
    expect(milestone.milestone_type).toBe('KNOCKOUT');
    
    const fetched = await BatchMilestoneRepository.getByBatchId('batch-1');
    expect(fetched).toHaveLength(1);
    expect(fetched[0].id).toBe(milestone.id);
  });

  it('should ensure a milestone exists (create if missing)', async () => {
    // 1. Ensure new
    const m1 = await BatchMilestoneRepository.ensure('batch-1', 'PITCHED');
    expect(m1.id).toBeDefined();
    expect(m1.milestone_type).toBe('PITCHED');
    expect(m1.completed).toBe(true);
    
    // 2. Ensure existing (should return same)
    const m2 = await BatchMilestoneRepository.ensure('batch-1', 'PITCHED');
    expect(m2.id).toBe(m1.id);
  });

  it('should update incomplete milestone when ensured', async () => {
    // 1. Create incomplete
    const m1 = await BatchMilestoneRepository.create({
      batch_id: 'batch-1',
      milestone_type: 'PITCHED',
      completed: false
    });
    
    // 2. Ensure
    const m2 = await BatchMilestoneRepository.ensure('batch-1', 'PITCHED');
    
    // 3. Verify updated
    expect(m2.id).toBe(m1.id);
    expect(m2.completed).toBe(true);
    expect(m2.occurred_at).toBeDefined();
  });
  
  it('should initialize milestones for a batch', async () => {
    await BatchMilestoneRepository.initForBatch('batch-init');
    const milestones = await BatchMilestoneRepository.getByBatchId('batch-init');
    
    expect(milestones.some(m => m.milestone_type === 'KNOCKOUT')).toBe(true);
  });
});
