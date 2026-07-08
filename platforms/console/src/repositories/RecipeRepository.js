import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';

const getContext = async () => {
  const session = await AuthService.getSession();
  return {
    orgId: session ? session.orgId : null,
    now: new Date().toISOString()
  };
};

export const RecipeRepository = {
  async getAll() {
    const { orgId } = await getContext();
    if (orgId) {
      return await db.recipes.where('org_id').equals(orgId).filter(r => !r.deleted_at).toArray();
    }
    return [];
  },

  async getById(id) {
    return await db.recipes.get(id);
  },

  async getItems(recipeId) {
    const { orgId } = await getContext();
    if (orgId) {
      return await db.recipe_items
        .where('recipe_id').equals(recipeId)
        .filter(ri => !ri.deleted_at && ri.org_id === orgId)
        .toArray();
    }
    return [];
  },

  async create(recipe, items) {
    const { orgId, now } = await getContext();
    
    const recipeId = uuidv4();
    const newRecipe = {
      ...recipe,
      id: recipeId,
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };

    const newItems = items.map(item => ({
      id: uuidv4(),
      recipe_id: recipeId,
      item_id: item.item_id,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    }));

    await db.transaction('rw', ['recipes', 'recipe_items'], async () => {
      await db.recipes.add(newRecipe);
      await db.recipe_items.bulkAdd(newItems);
    });

    return { recipe: newRecipe, items: newItems };
  },

  async update(id, recipeUpdates, items) {
    const { orgId, now } = await getContext();
    
    const currentRecipe = await this.getById(id);
    const updatedRecipe = {
      ...recipeUpdates,
      updated_at: now,
      sync_status: 'pending',
      version: (currentRecipe && currentRecipe.version ? currentRecipe.version : 0) + 1
    };

    // Prepare items
    // Strategy: Soft delete all existing items for this recipe, then add new ones
    // This is simpler than diffing for now, though slightly less efficient for sync history
    
    const existingItems = await this.getItems(id);
    const deleteUpdates = existingItems.map(item => ({
      key: item.id,
      changes: {
        deleted_at: now,
        updated_at: now,
        sync_status: 'pending',
        version: (item.version || 0) + 1
      }
    }));

    const newItems = items.map(item => ({
      id: uuidv4(),
      recipe_id: id,
      item_id: item.item_id,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    }));

    await db.transaction('rw', ['recipes', 'recipe_items'], async () => {
      await db.recipes.update(id, updatedRecipe);
      
      // Soft delete existing
      for (const update of deleteUpdates) {
        await db.recipe_items.update(update.key, update.changes);
      }

      // Add new
      await db.recipe_items.bulkAdd(newItems);
    });
  },

  async delete(id) {
    const { now } = await getContext();
    
    await db.transaction('rw', ['recipes', 'recipe_items'], async () => {
      const doc = await db.recipes.get(id);
      if (doc) {
        await db.recipes.update(id, {
          deleted_at: now,
          updated_at: now,
          sync_status: 'pending',
          version: (doc.version || 0) + 1
        });
      }

      const items = await db.recipe_items.where('recipe_id').equals(id).toArray();
      for (const item of items) {
        await db.recipe_items.update(item.id, {
          deleted_at: now,
          updated_at: now,
          sync_status: 'pending',
          version: (item.version || 0) + 1
        });
      }
    });
  },

  async applyRemoteUpsert(recipe) {
    const local = await db.recipes.get(recipe.id);
    if (!local) {
      await db.recipes.put(recipe);
    } else {
      await db.recipes.put(recipe);
    }
  }
};
