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

export const PRODUCTION_COMPLETE_LABEL = 'Production Complete';
export const FORCED_LAST_MILESTONE = {
  label: PRODUCTION_COMPLETE_LABEL,
  description: 'Beer is finished and ready for the cellar or packaging.',
  is_system: true
};

function isForcedMilestone(m) {
  return m && (m.label === PRODUCTION_COMPLETE_LABEL || m.is_system === true);
}

function ensureForcedLastMilestone(milestones) {
  if (!Array.isArray(milestones)) return [Object.assign({ id: uuidv4(), sort_order: 0 }, FORCED_LAST_MILESTONE)];
  const userMilestones = milestones.filter(m => !isForcedMilestone(m));
  const maxOrder = userMilestones.length ? Math.max(...userMilestones.map(m => m.sort_order ?? 0)) : -1;
  return [
    ...userMilestones,
    { id: uuidv4(), label: PRODUCTION_COMPLETE_LABEL, description: FORCED_LAST_MILESTONE.description, sort_order: maxOrder + 1, is_system: true }
  ];
}

const DEFAULT_MILESTONES = [
  { id: uuidv4(), label: 'Knocked Out', description: 'Wort in FV', sort_order: 0 },
  { id: uuidv4(), label: 'Pitched', description: 'Yeast added', sort_order: 1 },
  { id: uuidv4(), label: 'Fermentation Started', description: 'Activity observed', sort_order: 2 },
  { id: uuidv4(), label: 'FG Confirmed', description: 'Gravity stable', sort_order: 3 },
  { id: uuidv4(), label: 'Cold Crash', description: 'Temp dropped', sort_order: 4 },
  { id: uuidv4(), label: 'Transferred', description: 'Moved vessel', sort_order: 5 },
  { id: uuidv4(), label: 'Serving', description: 'Beer served on tap', sort_order: 6 },
  { id: uuidv4(), label: 'Packaging Started', description: 'First package run', sort_order: 7 },
  { id: uuidv4(), label: 'Packaging Completed', description: 'All volume packed', sort_order: 8 },
  { id: uuidv4(), label: 'Released', description: 'Available for sale', sort_order: 9 },
  { id: uuidv4(), label: 'Batch Closed', description: 'End of life', sort_order: 10 }
];

export const LEGACY_TYPE_TO_INDEX = {
  KNOCKOUT: 0, PITCHED: 1, FERMENTATION_START: 2, FG_CONFIRMED: 3, COLD_CRASH: 4,
  TRANSFERRED: 5, SERVING: 6, PACKAGING_START: 7, PACKAGING_COMPLETE: 8, RELEASED: 9, CLOSED: 10
};

export const MilestoneTemplateRepository = {
  DEFAULT_MILESTONES,
  FORCED_LAST_MILESTONE,
  async getAll() {
    const { orgId } = await getContext();
    if (!orgId) return [];
    return await db.milestone_templates.where('org_id').equals(orgId).sortBy('updated_at').then(arr => arr.reverse());
  },
  async getById(id) { return await db.milestone_templates.get(id); },
  async create(template) {
    const { orgId, now } = await getContext();
    let milestones = (template.milestones || []).map((m, i) => ({
      id: m.id || uuidv4(), label: m.label || 'Milestone', description: m.description || '', sort_order: m.sort_order ?? i, is_system: m.is_system || false
    }));
    milestones = ensureForcedLastMilestone(milestones);
    const newTemplate = {
      id: template.id || uuidv4(), org_id: orgId, name: template.name || 'Untitled', milestones,
      is_default: false, updated_at: now, sync_status: 'pending', version: 1
    };
    await db.milestone_templates.add(newTemplate);
    return newTemplate;
  },
  async update(id, updates) {
    const { now } = await getContext();
    const current = await db.milestone_templates.get(id);
    if (!current) return null;
    let milestones = updates.milestones !== undefined
      ? updates.milestones.map((m, i) => ({ id: m.id || uuidv4(), label: m.label || 'Milestone', description: m.description || '', sort_order: m.sort_order ?? i, is_system: m.is_system || false }))
      : current.milestones;
    milestones = ensureForcedLastMilestone(milestones);
    const updated = { ...current, ...updates, milestones, updated_at: now, sync_status: 'pending', version: (current.version || 0) + 1 };
    await db.milestone_templates.update(id, updated);
    return await db.milestone_templates.get(id);
  },
  async delete(id) { await db.milestone_templates.delete(id); },
  async ensureDefaultTemplate(orgId) {
    const all = await db.milestone_templates.where('org_id').equals(orgId).toArray();
    if (all.length === 0) {
      // Server creates default for new orgs; rely on sync to populate. Do not create locally.
      return null;
    }
    const hasDefault = all.some(t => t.is_default);
    if (!hasDefault) {
      const defaultTpl = all.find(t => t.name === 'Default') || all[0];
      if (defaultTpl) {
        await db.milestone_templates.update(defaultTpl.id, { is_default: true, sync_status: 'pending' });
      }
    }
    return await db.milestone_templates.get(all[0].id);
  },
  async setAsDefault(templateId) {
    const { orgId, now } = await getContext();
    if (!orgId) return;
    const templates = await db.milestone_templates.where('org_id').equals(orgId).toArray();
    for (const t of templates) {
      const isDefault = t.id === templateId;
      if (t.is_default !== isDefault) {
        await db.milestone_templates.update(t.id, {
          is_default: isDefault,
          updated_at: now,
          sync_status: 'pending',
          version: (t.version || 0) + 1
        });
      }
    }
  },
  async applyRemoteUpsert(template) { await db.milestone_templates.put(template); }
};
