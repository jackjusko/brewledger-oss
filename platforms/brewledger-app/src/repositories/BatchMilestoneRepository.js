import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';
import { LEGACY_TYPE_TO_INDEX } from './MilestoneTemplateRepository';

const getContext = async () => {
  const session = await AuthService.getSession();
  return {
    orgId: session ? session.orgId : null,
    now: new Date().toISOString()
  };
};

export const BatchMilestoneRepository = {
  async getByBatchId(batchId) {
    const rows = await db.batch_milestones
      .where('batch_id')
      .equals(batchId)
      .toArray();
    return rows.sort((a, b) => {
      const at = a.occurred_at || '';
      const bt = b.occurred_at || '';
      return at.localeCompare(bt);
    });
  },

  getDefinitionsForBatch(batch) {
    const defs = batch?.milestone_definitions;
    if (defs && Array.isArray(defs) && defs.length > 0) {
      return [...defs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return null;
  },

  async create(milestone) {
    const { orgId, now } = await getContext();
    const newMilestone = {
      ...milestone,
      id: uuidv4(),
      org_id: orgId,
      completed: milestone.completed !== false,
      occurred_at: milestone.occurred_at || now,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };
    await db.batch_milestones.add(newMilestone);
    return newMilestone;
  },

  async update(id, updates) {
    const { now } = await getContext();
    const current = await db.batch_milestones.get(id);
    if (!current) return null;

    const updated = {
      ...updates,
      updated_at: now,
      sync_status: 'pending',
      version: (current.version || 0) + 1
    };
    await db.batch_milestones.update(id, updated);
    return await db.batch_milestones.get(id);
  },

  async ensure(batchId, milestoneDefinitionId, occurredAt = null) {
    const existing = await db.batch_milestones
      .where('batch_id')
      .equals(batchId)
      .filter(m => m.milestone_definition_id === milestoneDefinitionId)
      .first();

    if (existing) {
      if (!existing.completed) {
        return await this.update(existing.id, {
          completed: true,
          occurred_at: occurredAt || new Date().toISOString()
        });
      }
      return existing;
    }
    return await this.create({
      batch_id: batchId,
      milestone_definition_id: milestoneDefinitionId,
      occurred_at: occurredAt || new Date().toISOString(),
      completed: true
    });
  },

  async initForBatch(batchId, definitions, initialStatus, knockedOutAt = null) {
    if (!definitions || definitions.length === 0) return;

    const now = knockedOutAt || new Date().toISOString();
    const firstDef = definitions[0];

    if (initialStatus === 'BREWED' && firstDef) {
      await this.create({
        batch_id: batchId,
        milestone_definition_id: firstDef.id,
        occurred_at: now,
        completed: true
      });
    }
  },

  mapLegacyMilestoneTypeToDefinitionId(batch, legacyType) {
    const defs = this.getDefinitionsForBatch(batch);
    if (!defs) return null;
    const idx = LEGACY_TYPE_TO_INDEX[legacyType];
    if (idx == null || idx >= defs.length) return null;
    return defs[idx].id;
  },

  async applyRemoteUpsert(milestone) {
    await db.batch_milestones.put(milestone);
  }
};
