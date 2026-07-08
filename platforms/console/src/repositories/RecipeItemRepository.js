import { db } from '../db';

export const RecipeItemRepository = {
  async applyRemoteUpsert(item) {
    const local = await db.recipe_items.get(item.id);
    if (!local) {
      await db.recipe_items.put(item);
    } else {
      await db.recipe_items.put(item);
    }
  }
};
