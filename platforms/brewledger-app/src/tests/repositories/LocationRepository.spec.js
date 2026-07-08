import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocationRepository } from '../../src/repositories/LocationRepository';
import { LedgerRepository } from '../../src/repositories/LedgerRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';
import axios from 'axios';

vi.mock('axios');
vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

vi.mock('../../src/repositories/LedgerRepository', () => ({
  LedgerRepository: {
    addEntry: vi.fn()
  }
}));

describe('LocationRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create and retrieve a location (offline fallback)', async () => {
    // Simulate axios failure to force offline fallback
    axios.post.mockRejectedValue(new Error('Network Error'));

    const loc = await LocationRepository.create({ name: 'Warehouse' });
    
    expect(loc.id).toBeDefined();
    expect(loc.name).toBe('Warehouse');
    expect(loc.sync_status).toBe('pending');
  });

  it('should create location online if possible', async () => {
    axios.post.mockResolvedValue({
      data: { id: 'server-id', name: 'Warehouse', org_id: 'test-org' }
    });

    const loc = await LocationRepository.create({ name: 'Warehouse' });
    
    expect(loc.id).toBe('server-id');
    expect(loc.sync_status).toBe('synced');
  });

  it('should soft delete a location and zero out inventory', async () => {
    // Force offline creation to avoid axios call
    axios.post.mockRejectedValue(new Error('Offline'));
    const loc = await LocationRepository.create({ name: 'Pantry' });
    
    // Simulate onhand cache in this location
    await db.onhand_cache.add({
      item_id: 'item-1',
      location_id: loc.id,
      quantity: 50
    });
    
    await LocationRepository.delete(loc.id);
    
    // Verify soft delete
    const deleted = await LocationRepository.getById(loc.id);
    expect(deleted.deleted_at).toBeDefined();
    
    // Verify LedgerRepository called
    expect(LedgerRepository.addEntry).toHaveBeenCalledWith(expect.objectContaining({
      type: 'CONSUME',
      location_id: loc.id,
      quantity: -50,
      note: 'System: Location Deleted'
    }));
  });
});
