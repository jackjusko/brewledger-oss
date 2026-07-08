import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VarianceEventRepository } from '../../src/repositories/VarianceEventRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('VarianceEventRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create and retrieve variance events', async () => {
    const event = await VarianceEventRepository.create({
      item_id: 'i1',
      expected_qty: 10,
      actual_qty: 8,
      count_session_id: 'session-1'
    });
    
    expect(event.id).toBeDefined();
    expect(event.actual_qty).toBe(8);
    
    const fetched = await VarianceEventRepository.getBySessionId('session-1');
    expect(fetched).toHaveLength(1);
    expect(fetched[0].id).toBe(event.id);
  });
});
