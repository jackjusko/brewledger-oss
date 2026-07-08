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

const assertVesselAvailable = async (vesselId, batchId, ignoreId = null) => {
  if (!vesselId || !batchId) return;
  const { orgId } = await getContext();
  const conflicts = await db.batch_locations
    .where('vessel_id').equals(vesselId)
    .filter((bl) => !bl.deleted_at && bl.parent_batch_id !== batchId && bl.id !== ignoreId && (!orgId || !bl.org_id || bl.org_id === orgId))
    .toArray();
  if (conflicts.length) {
    throw new Error('This vessel is already assigned to another batch.');
  }
};

/** Vessel-level status for a batch split (per vessel) */
export const BATCH_LOCATION_STATUS = {
  FERMENTING: 'Fermenting',
  CRASH: 'Crash',
  CONDITIONING: 'Conditioning',
  CARBONATING: 'Carbonating'
};

export const BatchLocationRepository = {
  async getById(id) {
    const row = await db.batch_locations.get(id);
    if (row?.deleted_at) return null;
    return row;
  },

  async getByBatchId(batchId) {
    return await db.batch_locations
      .where('parent_batch_id')
      .equals(batchId)
      .filter((r) => !r.deleted_at)
      .toArray();
  },

  /** Get all batch_locations for the given batch IDs (e.g. for list views). */
  async getByBatchIds(batchIds) {
    if (!batchIds?.length) return [];
    return await db.batch_locations
      .where('parent_batch_id')
      .anyOf(batchIds)
      .filter((r) => !r.deleted_at)
      .toArray();
  },

  /** Get all batch_locations for the given vessel IDs (e.g. to find occupied serving tanks). */
  async getByVesselIds(vesselIds) {
    if (!vesselIds?.length) return [];
    return await db.batch_locations
      .where('vessel_id')
      .anyOf(vesselIds)
      .filter((r) => !r.deleted_at)
      .toArray();
  },

  async create(split) {
    const vessel = await db.vessels.get(split.vessel_id);
    if (vessel?.location_id && (vessel?.type || '').toUpperCase() === 'SERVING') {
      throw new Error('Batches cannot be assigned to serving tanks. Use Mark Production Complete to send beer to a serving tank.');
    }
    await assertVesselAvailable(split.vessel_id, split.parent_batch_id);
    const { orgId, now } = await getContext();
    const newSplit = {
      ...split,
      id: uuidv4(),
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1,
      current_gravity: split.current_gravity ?? null,
      current_ph: split.current_ph ?? null,
      current_temp: split.current_temp ?? null,
      status: split.status ?? BATCH_LOCATION_STATUS.FERMENTING
    };
    await db.batch_locations.add(newSplit);
    return newSplit;
  },

  async update(id, updates) {
    const { now } = await getContext();
    const current = await this.getById(id);
    if (!current) return null;
    const updated = {
      ...updates,
      updated_at: now,
      sync_status: 'pending',
      version: (current.version || 0) + 1
    };
    await db.batch_locations.update(id, updated);
    return await this.getById(id);
  },

  async delete(id) {
    const { now } = await getContext();
    const current = await db.batch_locations.get(id);
    if (!current) return;
    await db.batch_locations.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: (current.version || 0) + 1
    });
  },

  /**
   * Set splits for a batch (upsert by vessel_id). Validates sum(current_volume) <= batch.total_theoretical_volume.
   * For each split: update existing batch_location for this batch+vessel_id, or create new.
   */
  async setSplitsForBatch(batchId, splits, totalTheoreticalVolume) {
    const sum = splits.reduce((s, sp) => s + (Number(sp.current_volume) || 0), 0);
    if (totalTheoreticalVolume != null && sum > totalTheoreticalVolume) {
      throw new Error(`Sum of vessel volumes (${sum}) cannot exceed batch total theoretical volume (${totalTheoreticalVolume}).`);
    }
    const existingList = await this.getByBatchId(batchId);
    const byVessel = new Map(existingList.map(e => [e.vessel_id, e]));
    const result = [];
    for (const sp of splits) {
      if (!sp.vessel_id || (sp.current_volume == null && sp.current_volume !== 0)) continue;
      const vol = Number(sp.current_volume) || 0;
      const existing = byVessel.get(sp.vessel_id);
      if (existing) {
        await this.update(existing.id, {
          current_volume: vol,
          ...(sp.status && { status: sp.status }),
          ...(sp.current_gravity != null && { current_gravity: sp.current_gravity }),
          ...(sp.current_ph != null && { current_ph: sp.current_ph }),
          ...(sp.current_temp != null && { current_temp: sp.current_temp })
        });
        result.push(await this.getById(existing.id));
      } else {
        await assertVesselAvailable(sp.vessel_id, batchId);
        const c = await this.create({
          parent_batch_id: batchId,
          vessel_id: sp.vessel_id,
          current_volume: vol,
          ...(sp.status && { status: sp.status }),
          ...(sp.current_gravity != null && { current_gravity: sp.current_gravity }),
          ...(sp.current_ph != null && { current_ph: sp.current_ph }),
          ...(sp.current_temp != null && { current_temp: sp.current_temp })
        });
        result.push(c);
      }
    }
    return result;
  },

  /**
   * Many-to-one combine: combine multiple source splits into one destination.
   * Reduces or deletes source splits; creates or updates destination split.
   * Optional destinationVolume: resulting volume at destination (can differ from sum of sources due to loss or addition).
   */
  async combineSplits({ sourceBatchLocationIds, destinationVesselId, destinationBatchLocationId, destinationVolume }) {
    if (!sourceBatchLocationIds || sourceBatchLocationIds.length === 0) {
      throw new Error('At least one source batch location required.');
    }
    const sources = await Promise.all(sourceBatchLocationIds.map(id => this.getById(id)));
    const validSources = sources.filter(s => s != null);
    if (validSources.length === 0) throw new Error('No valid source batch locations found.');
    const batchId = validSources[0].parent_batch_id;
    if (!validSources.every(s => s.parent_batch_id === batchId)) {
      throw new Error('All source splits must belong to the same batch.');
    }
    const totalVolume = validSources.reduce((s, src) => s + (Number(src.current_volume) || 0), 0);
    const useResultingVolume = destinationVolume != null && Number(destinationVolume) >= 0;
    const resultingVolume = useResultingVolume ? Number(destinationVolume) : null;
    let dest;
    if (destinationBatchLocationId) {
      dest = await this.getById(destinationBatchLocationId);
      if (!dest) throw new Error('Destination batch location not found.');
      await assertVesselAvailable(dest.vessel_id, batchId, dest.id);
      const newVol = resultingVolume != null ? resultingVolume : (Number(dest.current_volume) || 0) + totalVolume;
      await this.update(destinationBatchLocationId, { current_volume: newVol });
      dest = await this.getById(destinationBatchLocationId);
    } else if (destinationVesselId) {
      await assertVesselAvailable(destinationVesselId, batchId);
      const existing = await db.batch_locations
        .where('parent_batch_id').equals(batchId)
        .filter(bl => bl.vessel_id === destinationVesselId)
        .first();
      if (existing) {
        const newVol = resultingVolume != null ? resultingVolume : (Number(existing.current_volume) || 0) + totalVolume;
        await this.update(existing.id, { current_volume: newVol });
        dest = await this.getById(existing.id);
      } else {
        const vol = resultingVolume != null ? resultingVolume : totalVolume;
        dest = await this.create({
          parent_batch_id: batchId,
          vessel_id: destinationVesselId,
          current_volume: vol
        });
      }
    } else {
      throw new Error('Destination vessel_id or batch_location_id required.');
    }
    for (const src of validSources) {
      await this.delete(src.id);
    }
    return dest;
  },

  /**
   * Transfer/split: set destination splits to given resulting volumes and reduce source by sum of those volumes.
   * Volumes can change during transfer (loss or addition); user sets the resulting volume at each destination.
   * Source is reduced by sum(destinations.volume); if sum exceeds source, source goes to zero.
   */
  async transferSplit({ sourceBatchLocationId, destinations }) {
    const source = await this.getById(sourceBatchLocationId);
    if (!source) throw new Error('Source batch location not found.');
    const sourceVol = Number(source.current_volume) || 0;
    const destSum = destinations.reduce((s, d) => s + (Number(d.volume) || 0), 0);
    const batchId = source.parent_batch_id;
    const results = [];
    for (const d of destinations) {
      const vol = Number(d.volume) || 0;
      if (vol <= 0) continue;
      if (d.batch_location_id) {
        const existing = await this.getById(d.batch_location_id);
        if (existing) {
          await assertVesselAvailable(existing.vessel_id, batchId, existing.id);
          await this.update(d.batch_location_id, { current_volume: vol });
          results.push(await this.getById(d.batch_location_id));
        }
      } else if (d.vessel_id) {
        await assertVesselAvailable(d.vessel_id, batchId);
        const existing = await db.batch_locations
          .where('parent_batch_id').equals(batchId)
          .filter(bl => bl.vessel_id === d.vessel_id)
          .first();
        if (existing) {
          await this.update(existing.id, { current_volume: vol });
          results.push(await this.getById(existing.id));
        } else {
          const created = await this.create({
            parent_batch_id: batchId,
            vessel_id: d.vessel_id,
            current_volume: vol
          });
          results.push(created);
        }
      }
    }
    const newSourceVol = Math.max(0, sourceVol - destSum);
    if (newSourceVol <= 0) {
      await this.delete(sourceBatchLocationId);
    } else {
      await this.update(sourceBatchLocationId, { current_volume: newSourceVol });
    }
    return results;
  },

  async applyRemoteUpsert(split) {
    if (split.deleted_at) {
      await db.batch_locations.delete(split.id);
      return;
    }
    await db.batch_locations.put(split);
  }
};
