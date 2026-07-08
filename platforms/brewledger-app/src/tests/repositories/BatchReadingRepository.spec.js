import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchReadingRepository } from '../../src/repositories/BatchReadingRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('BatchReadingRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should add and retrieve readings', async () => {
    const reading = await BatchReadingRepository.add({
      batch_id: 'batch-1',
      gravity: 1.050,
      temperature: 20
    });
    
    expect(reading.id).toBeDefined();
    expect(reading.gravity).toBe(1.050);
    
    const fetched = await BatchReadingRepository.getByBatchId('batch-1');
    expect(fetched).toHaveLength(1);
    expect(fetched[0].gravity).toBe(1.050);
  });
  
  it('should sort readings by measured_at reverse', async () => {
    await BatchReadingRepository.add({ batch_id: 'batch-1', gravity: 1.010, measured_at: '2023-01-01T10:00:00Z' });
    await BatchReadingRepository.add({ batch_id: 'batch-1', gravity: 1.020, measured_at: '2023-01-02T10:00:00Z' });
    
    const fetched = await BatchReadingRepository.getByBatchId('batch-1');
    expect(fetched[0].gravity).toBe(1.020); // Newer first
    expect(fetched[1].gravity).toBe(1.010);
  });
});
