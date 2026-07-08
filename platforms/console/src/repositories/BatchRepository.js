import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';
import { BatchMilestoneRepository } from './BatchMilestoneRepository';
import { BatchLocationRepository } from './BatchLocationRepository';
import { MilestoneTemplateRepository } from './MilestoneTemplateRepository';

const getContext = async () => {
  const session = await AuthService.getSession();
  return { orgId: session ? session.orgId : null, now: new Date().toISOString() };
};

function snapshotMilestonesFromTemplate(template) {
  return (template?.milestones || []).map((m, i) => ({
    id: m.id || uuidv4(), label: m.label || 'Milestone', description: m.description || '', sort_order: m.sort_order ?? i
  }));
}

export const BatchRepository = {
  async getAll() {
    const { orgId } = await getContext();
    if (orgId) return await db.batches.where('org_id').equals(orgId).reverse().sortBy('batch_date');
    return await db.batches.orderBy('batch_date').reverse().toArray();
  },
  async getById(id) { return await db.batches.get(id); },
  async create(batch) {
    const { orgId, now } = await getContext();
    let milestoneDefinitions = batch.milestone_definitions;
    let milestoneTemplateId = batch.milestone_template_id || null;
    if (!milestoneDefinitions || milestoneDefinitions.length === 0) {
      const templateId = milestoneTemplateId || (await this.getDefaultTemplateId());
      const template = templateId ? await MilestoneTemplateRepository.getById(templateId) : null;
      if (!template) {
        await MilestoneTemplateRepository.ensureDefaultTemplate(orgId);
        const defaultTemplate = (await MilestoneTemplateRepository.getAll())[0];
        if (defaultTemplate) { template = defaultTemplate; milestoneTemplateId = template.id; }
      }
      if (template) {
        milestoneDefinitions = snapshotMilestonesFromTemplate(template);
        milestoneTemplateId = milestoneTemplateId || template.id;
      } else {
        milestoneDefinitions = MilestoneTemplateRepository.DEFAULT_MILESTONES.map(m => ({ ...m, id: uuidv4() }));
      }
    }

    const splits = batch.splits || [];
    const totalTheoreticalVolume = batch.total_theoretical_volume != null
      ? batch.total_theoretical_volume
      : (splits.length
          ? splits.reduce((s, sp) => s + (Number(sp.current_volume) || 0), 0)
          : (batch.vessel_id && (batch.planned_volume != null || batch.current_volume != null)
              ? (Number(batch.planned_volume) || Number(batch.current_volume) || 0)
              : null));

    const newBatch = {
      ...batch,
      milestone_definitions: milestoneDefinitions,
      milestone_template_id: milestoneTemplateId,
      total_theoretical_volume: totalTheoreticalVolume,
      status: batch.status || 'PLANNED',
      id: uuidv4(),
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };
    delete newBatch.splits;
    delete newBatch.vessel_id;
    delete newBatch.current_volume;
    newBatch.milestone_template_id = milestoneTemplateId;
    await db.batches.add(newBatch);

    try {
      if (splits.length > 0) {
        await BatchLocationRepository.setSplitsForBatch(newBatch.id, splits, totalTheoreticalVolume);
      } else if (batch.vessel_id && (batch.planned_volume != null || batch.current_volume != null)) {
        await BatchLocationRepository.create({
          parent_batch_id: newBatch.id,
          vessel_id: batch.vessel_id,
          current_volume: Number(batch.planned_volume) ?? Number(batch.current_volume) ?? 0
        });
      }

      await BatchMilestoneRepository.initForBatch(newBatch.id, milestoneDefinitions, newBatch.status, newBatch.batch_date);
      return newBatch;
    } catch (err) {
      await db.batches.delete(newBatch.id);
      throw err;
    }
  },
  async getDefaultTemplateId() {
    const { orgId } = await getContext();
    if (!orgId) return null;
    await MilestoneTemplateRepository.ensureDefaultTemplate(orgId);
    const templates = await MilestoneTemplateRepository.getAll();
    const defaultTpl = templates.find(t => t.is_default) || templates.find(t => t.name === 'Default') || templates[0];
    return defaultTpl?.id || null;
  },
  async update(id, updates) {
    const { now } = await getContext();
    const current = await this.getById(id);
    const updated = { ...updates, updated_at: now, sync_status: 'pending', version: (current && current.version ? current.version : 0) + 1 };
    await db.batches.update(id, updated);
    return await this.getById(id);
  },
  async updateStatus(id, status, timestampField = null) {
    const updates = { status };
    if (timestampField) updates[timestampField] = new Date().toISOString();
    return await this.update(id, updates);
  },
  async applyRemoteUpsert(batch) { await db.batches.put(batch); }
};
