import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeRepository } from '../../src/repositories/RecipeRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('RecipeRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should create a recipe with items', async () => {
    const recipeData = { name: 'IPA', style: 'West Coast' };
    const itemsData = [
      { item_id: 'malt-1', quantity: 5, unit: 'kg' },
      { item_id: 'hops-1', quantity: 100, unit: 'g' }
    ];

    const { recipe, items } = await RecipeRepository.create(recipeData, itemsData);
    
    expect(recipe.id).toBeDefined();
    expect(recipe.name).toBe('IPA');
    expect(items).toHaveLength(2);
    expect(items[0].recipe_id).toBe(recipe.id);
  });

  it('should retrieve recipe items', async () => {
    const { recipe } = await RecipeRepository.create({ name: 'Stout' }, [
      { item_id: 'barley', quantity: 10, unit: 'kg' }
    ]);
    
    const items = await RecipeRepository.getItems(recipe.id);
    expect(items).toHaveLength(1);
    expect(items[0].item_id).toBe('barley');
  });

  it('should update recipe and replace items', async () => {
    // 1. Create
    const { recipe } = await RecipeRepository.create({ name: 'Pale Ale' }, [
      { item_id: 'old-malt', quantity: 1, unit: 'kg' }
    ]);
    
    // 2. Update
    const newItems = [{ item_id: 'new-malt', quantity: 2, unit: 'kg' }];
    await RecipeRepository.update(recipe.id, { name: 'Pale Ale V2' }, newItems);
    
    // 3. Verify Recipe Updated
    const updatedRecipe = await RecipeRepository.getById(recipe.id);
    expect(updatedRecipe.name).toBe('Pale Ale V2');
    
    // 4. Verify Items Replaced
    // The "old-malt" should be soft deleted
    const allItems = await db.recipe_items.where('recipe_id').equals(recipe.id).toArray();
    const activeItems = await RecipeRepository.getItems(recipe.id);
    
    expect(activeItems).toHaveLength(1);
    expect(activeItems[0].item_id).toBe('new-malt');
    
    // Check total items (1 soft deleted + 1 new)
    expect(allItems).toHaveLength(2);
    const deletedItem = allItems.find(i => i.item_id === 'old-malt');
    expect(deletedItem.deleted_at).toBeDefined();
  });

  it('should soft delete recipe and its items', async () => {
    const { recipe } = await RecipeRepository.create({ name: 'Lager' }, [
      { item_id: 'corn', quantity: 5, unit: 'kg' }
    ]);
    
    await RecipeRepository.delete(recipe.id);
    
    const deletedRecipe = await RecipeRepository.getById(recipe.id);
    expect(deletedRecipe.deleted_at).toBeDefined();
    
    const items = await db.recipe_items.where('recipe_id').equals(recipe.id).toArray();
    expect(items[0].deleted_at).toBeDefined();
  });
});
