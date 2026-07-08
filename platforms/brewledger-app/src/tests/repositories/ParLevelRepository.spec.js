import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParLevelRepository } from '../../src/repositories/ParLevelRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

// Mock AuthService
vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('ParLevelRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org-id',
      token: 'test-token'
    });
  });

  it('should create a new par level if none exists', async () => {
    const par = await ParLevelRepository.setParLevel('item-1', 'loc-1', 10, 20);
    
    expect(par.id).toBeDefined();
    expect(par.min_qty).toBe(10);
    expect(par.max_qty).toBe(20);
    expect(par.org_id).toBe('test-org-id');
    
    const all = await ParLevelRepository.getAll();
    expect(all).toHaveLength(1);
  });

  it('should update an existing par level', async () => {
    // 1. Create initial
    await ParLevelRepository.setParLevel('item-1', 'loc-1', 10, 20);
    
    // 2. Update same item/location
    const updated = await ParLevelRepository.setParLevel('item-1', 'loc-1', 15, 25);
    
    expect(updated.min_qty).toBe(15);
    expect(updated.max_qty).toBe(25);
    
    // Verify count is still 1
    const all = await ParLevelRepository.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].min_qty).toBe(15);
  });

  it('should retrieve par levels by location', async () => {
    await ParLevelRepository.setParLevel('item-1', 'loc-A', 5);
    await ParLevelRepository.setParLevel('item-2', 'loc-A', 5);
    await ParLevelRepository.setParLevel('item-1', 'loc-B', 5);
    
    const locAPars = await ParLevelRepository.getByLocation('loc-A');
    expect(locAPars).toHaveLength(2);
    
    const locBPars = await ParLevelRepository.getByLocation('loc-B');
    expect(locBPars).toHaveLength(1);
  });

  it('should apply remote upserts correctly', async () => {
    const remotePar = {
      id: 'remote-id-123',
      item_id: 'item-R',
      location_id: 'loc-R',
      min_qty: 100,
      org_id: 'test-org-id',
      version: 5
    };

    await ParLevelRepository.applyRemoteUpsert(remotePar);
    
    const local = await db.par_levels.get('remote-id-123');
    expect(local).toBeDefined();
    expect(local.min_qty).toBe(100);
  });
});
