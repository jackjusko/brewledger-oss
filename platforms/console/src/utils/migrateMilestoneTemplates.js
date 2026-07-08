import { db } from '../db';
import { AuthService } from '../services/AuthService';
import { MilestoneTemplateRepository, LEGACY_TYPE_TO_INDEX } from '../repositories/MilestoneTemplateRepository';

function snapshotMilestonesFromTemplate(template) {
  const milestones = template?.milestones || [];
  return milestones.map((m, i) => ({
    id: m.id, label: m.label || 'Milestone', description: m.description || '', sort_order: m.sort_order ?? i
  }));
}

export async function migrateBatchIfNeeded(batch) {
  const defs = batch?.milestone_definitions;
  if (defs && Array.isArray(defs) && defs.length > 0) return batch;

  const session = await AuthService.getSession();
  if (!session || !session.orgId) return batch;

  await MilestoneTemplateRepository.ensureDefaultTemplate(session.orgId);
  const defaultTemplate = (await MilestoneTemplateRepository.getAll()).find(t => t.name === 'Default')
    || (await MilestoneTemplateRepository.getAll())[0];
  if (!defaultTemplate) return batch;

  const milestoneDefinitions = snapshotMilestonesFromTemplate(defaultTemplate);
  await db.batches.update(batch.id, {
    milestone_definitions: milestoneDefinitions,
    milestone_template_id: defaultTemplate.id,
    sync_status: 'pending'
  });

  const milestones = await db.batch_milestones.where('batch_id').equals(batch.id).toArray();
  for (const m of milestones) {
    if (m.milestone_definition_id) continue;
    const legacyType = m.milestone_type;
    if (!legacyType) continue;
    const idx = LEGACY_TYPE_TO_INDEX[legacyType];
    if (idx == null || idx >= milestoneDefinitions.length) continue;
    const defId = milestoneDefinitions[idx].id;
    await db.batch_milestones.update(m.id, { milestone_definition_id: defId, sync_status: 'pending' });
  }
  return await db.batches.get(batch.id);
}

export async function runMilestoneTemplatesMigration() {
  const session = await AuthService.getSession();
  if (!session || !session.orgId) return;

  const orgId = session.orgId;

  await MilestoneTemplateRepository.ensureDefaultTemplate(orgId);
  const defaultTemplate = (await MilestoneTemplateRepository.getAll()).find(t => t.name === 'Default')
    || (await MilestoneTemplateRepository.getAll())[0];
  if (!defaultTemplate) return;

  const defaultDefinitions = snapshotMilestonesFromTemplate(defaultTemplate);

  const batches = await db.batches.where('org_id').equals(orgId).toArray();
  for (const batch of batches) {
    const defs = batch.milestone_definitions;
    if (defs && Array.isArray(defs) && defs.length > 0) continue;

    const milestoneDefinitions = [...defaultDefinitions];
    await db.batches.update(batch.id, {
      milestone_definitions: milestoneDefinitions,
      milestone_template_id: defaultTemplate.id,
      sync_status: 'pending'
    });

    const milestones = await db.batch_milestones.where('batch_id').equals(batch.id).toArray();
    for (const m of milestones) {
      if (m.milestone_definition_id) continue;
      const legacyType = m.milestone_type;
      if (!legacyType) continue;

      const idx = LEGACY_TYPE_TO_INDEX[legacyType];
      if (idx == null || idx >= milestoneDefinitions.length) continue;

      const defId = milestoneDefinitions[idx].id;
      await db.batch_milestones.update(m.id, {
        milestone_definition_id: defId,
        sync_status: 'pending'
      });
    }
  }
}
