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

export const CategoryRepository = {
  async getAll() {
    const { orgId } = await getContext();
    if (orgId) {
      return await db.categories.where('org_id').equals(orgId).filter(c => !c.deleted_at).toArray();
    }
    return [];
  },

  async getById(id) {
    return await db.categories.get(id);
  },

  async create(category) {
    const { orgId, now } = await getContext();
    const newCategory = {
      ...category,
      id: uuidv4(),
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };
    
    // Ensure plain object
    const categoryPlain = JSON.parse(JSON.stringify(newCategory));
    
    await db.categories.add(categoryPlain);
    return newCategory;
  },

  async update(id, updates) {
    const { now } = await getContext();
    const current = await this.getById(id);
    const updated = {
      ...updates,
      updated_at: now,
      sync_status: 'pending',
      version: (current && current.version ? current.version : 0) + 1
    };
    
    await db.categories.update(id, updated);
    return await this.getById(id);
  },

  async delete(id, name = null, reassign = false) {
    const { now, orgId } = await getContext();
    const doc = await this.getById(id);
    if (doc && (doc.name === 'Finished Beer' || doc.is_system === true)) {
      throw new Error('The Finished Beer category is required for TTB reporting and cannot be deleted.');
    }

    if (reassign && name) {
      // Find all items with this category name and update them to "Other"
      // Note: This relies on items using the category NAME string.
      // We should ideally use ID, but the current schema uses string.
      
      const itemsToUpdate = await db.items.where('org_id').equals(orgId)
        .filter(i => i.category === name && !i.deleted_at).toArray();
        
      for (const item of itemsToUpdate) {
        // Update item category to 'Other'
        // We use db.items.update to trigger the sync logic if we were using a repository method,
        // but since we are doing batch, we need to be careful.
        // Let's manually update to ensure version bump.
        await db.items.update(item.id, {
           category: 'Other',
           updated_at: now,
           sync_status: 'pending',
           version: (item.version || 0) + 1
        });
      }
    }

    if (!doc) return;

    await db.categories.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: (doc.version || 0) + 1
    });
  },

  async hasItems(categoryName) {
    const { orgId } = await getContext();
    if (!orgId) return false;
    
    const count = await db.items.where('org_id').equals(orgId)
      .filter(i => i.category === categoryName && !i.deleted_at)
      .count();
      
    return count > 0;
  },

  async applyRemoteUpsert(category) {
    const local = await db.categories.get(category.id);
    if (!local) {
      await db.categories.put(category);
    } else {
      await db.categories.put(category);
    }
  },
  
  // Helper to ensure standard categories exist
  // Now mostly redundant as server seeds them, but kept for offline demo fallback
  async ensureStandardCategories() {
    const standards = [
      'Malt / Grain',
      'Hops',
      'Yeast',
      'Adjuncts',
      'Chemicals',
      'Packaging',
      'Merch',
      'Other'
    ];
    
    // Only run if we are in demo mode (no orgId) or specifically need local seed
    const { orgId } = await getContext();
    if (orgId) return; // Server handles seeding for real orgs now

    const existing = await this.getAll();
    if (existing.length === 0) {
      console.log('Seeding standard categories (Demo)...');
      for (const name of standards) {
        await this.create({ name });
      }
    }
  }
};
