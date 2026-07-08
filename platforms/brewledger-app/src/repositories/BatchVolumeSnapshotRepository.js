import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';
import { BatchVolumeAdjustmentRepository } from './BatchVolumeAdjustmentRepository';
import { BatchLocationRepository } from './BatchLocationRepository';

const getContext = async () => {
  const session = await AuthService.getSession();
  return {
    orgId: session ? session.orgId : null,
    userName: session ? session.userName || session.name || null : null,
    now: new Date().toISOString()
  };
};

async function getSortedSnapshots(batchLocationId) {
  return await db.batch_volume_snapshots
    .where('batch_location_id')
    .equals(batchLocationId)
    .filter((s) => !s.deleted_at)
    .sortBy('measured_at');
}

async function rebuildDerivedAdjustments(batchLocationId, userName) {
  const snapshots = await getSortedSnapshots(batchLocationId);
  const derived = await db.batch_volume_adjustments
    .where('batch_location_id')
    .equals(batchLocationId)
    .filter((r) => r.derived_from_snapshot_id && !r.deleted_at)
    .primaryKeys();
  if (derived.length) {
    await BatchVolumeAdjustmentRepository.markDeleted(derived);
  }

  for (let i = 1; i < snapshots.length; i += 1) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    const delta = Number(curr.measured_volume) - Number(prev.measured_volume);
    if (!delta) continue;
    await BatchVolumeAdjustmentRepository.create({
      batch_location_id: batchLocationId,
      volume_change: delta,
      reason: curr.note || 'Snapshot delta',
      derived_from_snapshot_id: curr.id,
      snapshot_measured_at: curr.measured_at,
      recorded_by: userName || curr.recorded_by || null,
      created_at: curr.measured_at
    });
  }

  if (snapshots.length > 0) {
    const latest = snapshots[snapshots.length - 1];
    await BatchLocationRepository.update(batchLocationId, {
      current_volume: Number(latest.measured_volume) || 0
    });
  }
}

export const BatchVolumeSnapshotRepository = {
  async getByBatchLocationId(batchLocationId) {
    return await getSortedSnapshots(batchLocationId);
  },

  async recordSnapshot({ batch_location_id, measured_volume, measured_at, method, note }) {
    if (!batch_location_id) throw new Error('batch_location_id is required');
    const vol = Number(measured_volume);
    if (Number.isNaN(vol)) throw new Error('Measured volume must be a number');
    if (vol < 0) throw new Error('Measured volume cannot be negative');
    const { orgId, userName, now } = await getContext();
    const measuredAtIso = measured_at ? new Date(measured_at).toISOString() : now;
    const snapshot = {
      id: uuidv4(),
      org_id: orgId,
      batch_location_id,
      measured_volume: vol,
      measured_at: measuredAtIso,
      method: method || null,
      note: note || null,
      recorded_by: userName || null,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };

    await db.batch_volume_snapshots.add(snapshot);
    await rebuildDerivedAdjustments(batch_location_id, userName);
    return snapshot;
  },

  async applyRemoteUpsert(snapshot) {
    if (snapshot.deleted_at) {
      await db.batch_volume_snapshots.delete(snapshot.id);
      return;
    }
    await db.batch_volume_snapshots.put(snapshot);
  }
};
