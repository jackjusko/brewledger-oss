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

export const BatchVolumeAdjustmentRepository = {
  async getById(id) {
    return await db.batch_volume_adjustments.get(id);
  },

  async getByBatchLocationId(batchLocationId) {
    return await db.batch_volume_adjustments
      .where('batch_location_id')
      .equals(batchLocationId)
      .filter((r) => !r.deleted_at)
      .sortBy('created_at');
  },

  async create(adjustment) {
    const { orgId, now } = await getContext();
    const newAdjustment = {
      ...adjustment,
      id: uuidv4(),
      client_request_id: uuidv4(),
      org_id: orgId,
      created_at: adjustment.created_at || now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };
    await db.batch_volume_adjustments.add(newAdjustment);
    return newAdjustment;
  },

  async markDeleted(ids) {
    if (!ids?.length) return;
    const { now } = await getContext();
    await db.batch_volume_adjustments
      .where('id')
      .anyOf(ids)
      .modify((row) => {
        row.deleted_at = now;
        row.updated_at = now;
        row.sync_status = 'pending';
        row.version = (row.version || 0) + 1;
      });
  },

  async applyRemoteUpsert(adjustment) {
    if (adjustment.deleted_at) {
      await db.batch_volume_adjustments.delete(adjustment.id);
      return;
    }
    await db.batch_volume_adjustments.put(adjustment);
  }
};
