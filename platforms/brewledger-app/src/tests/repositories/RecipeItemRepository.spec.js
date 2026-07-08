import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeItemRepository } from '../../src/repositories/RecipeItemRepository';
import { db } from '../../src/db';

describe('RecipeItemRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should apply remote upsert', async () => {
    const item = { id: 'ri-1', recipe_id: 'r-1', item_id: 'i-1', quantity: 10 };
    await RecipeItemRepository.applyRemoteUpsert(item);
    
    const fetched = await db.recipe_items.get('ri-1');
    expect(fetched.quantity).toBe(10);
  });
});
