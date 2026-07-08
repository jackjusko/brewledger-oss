import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemRepository } from '../../src/repositories/ItemRepository';
import { LedgerRepository } from '../../src/repositories/LedgerRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

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

describe('ItemRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create and retrieve an item', async () => {
    const item = await ItemRepository.create({ name: 'Malt' });
    
    expect(item.id).toBeDefined();
    expect(item.name).toBe('Malt');
    expect(item.org_id).toBe('test-org');
    
    const retrieved = await ItemRepository.getById(item.id);
    expect(retrieved.name).toBe('Malt');
  });

  it('should update an item', async () => {
    const item = await ItemRepository.create({ name: 'Malt' });
    const updated = await ItemRepository.update(item.id, { name: 'Pale Ale Malt' });
    
    expect(updated.name).toBe('Pale Ale Malt');
    expect(updated.version).toBeGreaterThan(item.version);
  });

  it('should soft delete an item and zero out inventory', async () => {
    const item = await ItemRepository.create({ name: 'Hops' });
    
    // Simulate onhand cache
    await db.onhand_cache.add({
      item_id: item.id,
      location_id: 'loc-1',
      quantity: 10
    });
    
    await ItemRepository.delete(item.id);
    
    // Verify soft delete
    const deleted = await ItemRepository.getById(item.id);
    expect(deleted.deleted_at).toBeDefined();
    
    // Verify LedgerRepository called to consume stock
    expect(LedgerRepository.addEntry).toHaveBeenCalledWith(expect.objectContaining({
      type: 'CONSUME',
      item_id: item.id,
      quantity: -10,
      note: 'System: Item Deleted'
    }));
  });
});
