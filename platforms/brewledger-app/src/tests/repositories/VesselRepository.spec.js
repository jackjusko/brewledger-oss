import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VesselRepository } from '../../src/repositories/VesselRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('VesselRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create and retrieve a vessel', async () => {
    const vessel = await VesselRepository.create({ name: 'FV-1', capacity: 100 });
    
    expect(vessel.id).toBeDefined();
    expect(vessel.name).toBe('FV-1');
    expect(vessel.capacity).toBe(100);
    
    const retrieved = await VesselRepository.getById(vessel.id);
    expect(retrieved.name).toBe('FV-1');
  });

  it('should update a vessel', async () => {
    const vessel = await VesselRepository.create({ name: 'FV-1' });
    const updated = await VesselRepository.update(vessel.id, { name: 'FV-01' });
    
    expect(updated.name).toBe('FV-01');
    expect(updated.version).toBeGreaterThan(vessel.version);
  });

  it('should soft delete a vessel', async () => {
    const vessel = await VesselRepository.create({ name: 'FV-2' });
    await VesselRepository.delete(vessel.id);
    
    const deleted = await VesselRepository.getById(vessel.id);
    expect(deleted.deleted_at).toBeDefined();
  });
});
