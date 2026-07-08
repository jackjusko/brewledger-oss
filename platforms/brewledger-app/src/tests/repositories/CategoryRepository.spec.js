import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoryRepository } from '../../src/repositories/CategoryRepository';
import { ItemRepository } from '../../src/repositories/ItemRepository'; // Import actual repo or mock db
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('CategoryRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create and retrieve a category', async () => {
    const cat = await CategoryRepository.create({ name: 'Hops' });
    
    expect(cat.id).toBeDefined();
    expect(cat.name).toBe('Hops');
    
    const retrieved = await CategoryRepository.getById(cat.id);
    expect(retrieved.name).toBe('Hops');
  });

  it('should reassign items when deleting a category with reassign=true', async () => {
    // 1. Create category
    const cat = await CategoryRepository.create({ name: 'Old Cat' });
    
    // 2. Create item in that category
    await db.items.add({
      id: 'item-1',
      name: 'Item 1',
      category: 'Old Cat',
      org_id: 'test-org'
    });
    
    // 3. Delete category with reassign
    await CategoryRepository.delete(cat.id, 'Old Cat', true);
    
    // 4. Verify item updated
    const item = await db.items.get('item-1');
    expect(item.category).toBe('Other');
  });

  it('should check if category has items', async () => {
    await db.items.add({
      id: 'item-1',
      name: 'Item 1',
      category: 'Test Cat',
      org_id: 'test-org'
    });
    
    const hasItems = await CategoryRepository.hasItems('Test Cat');
    expect(hasItems).toBe(true);
    
    const empty = await CategoryRepository.hasItems('Empty Cat');
    expect(empty).toBe(false);
  });
});
