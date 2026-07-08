import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CountSessionRepository } from '../../src/repositories/CountSessionRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('CountSessionRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create a count session', async () => {
    const session = await CountSessionRepository.create({
      location_id: 'loc-1',
      name: 'Monthly Audit'
    });
    
    expect(session.id).toBeDefined();
    expect(session.status).toBe('OPEN');
    expect(session.location_id).toBe('loc-1');
  });

  it('should retrieve open session by location', async () => {
    await CountSessionRepository.create({ location_id: 'loc-1' });
    
    const open = await CountSessionRepository.getOpenSession('loc-1');
    expect(open).toBeDefined();
    
    const none = await CountSessionRepository.getOpenSession('loc-2');
    expect(none).toBeUndefined();
  });

  it('should close a session with counts', async () => {
    const session = await CountSessionRepository.create({ location_id: 'loc-1' });
    const counts = [{ item_id: 'i1', quantity: 10 }];
    
    await CountSessionRepository.close(session.id, counts);
    
    const closed = await CountSessionRepository.getById(session.id);
    expect(closed.status).toBe('CLOSED');
    expect(closed.closed_counts).toEqual(counts);
    expect(closed.ended_at).toBeDefined();
  });

  it('should cancel (delete) a session', async () => {
    const session = await CountSessionRepository.create({ location_id: 'loc-1' });
    await CountSessionRepository.delete(session.id);
    
    const deleted = await CountSessionRepository.getById(session.id);
    expect(deleted.status).toBe('CANCELLED');
    expect(deleted.deleted_at).toBeDefined();
  });
});
