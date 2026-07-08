import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';
import { BatchLocationRepository } from './BatchLocationRepository';

const getContext = async () => {
  const session = await AuthService.getSession();
  return {
    orgId: session ? session.orgId : null,
    now: new Date().toISOString()
  };
};

export const BatchLocationTransferRepository = {
  async getByBatchLocationId(batchLocationId) {
    return await db.batch_location_transfers
      .where('source_batch_location_id')
      .equals(batchLocationId)
      .filter((t) => !t.deleted_at)
      .sortBy('created_at');
  },

  async getByBatchId(batchId) {
    return await db.batch_location_transfers
      .where('parent_batch_id')
      .equals(batchId)
      .filter((t) => !t.deleted_at)
      .sortBy('created_at');
  },

  async recordTransfer({
    source_batch_location_id,
    destination_batch_location_id = null,
    destination_location_id = null,
    destination_vessel_id = null,
    volume,
    transfer_type = 'transfer',
    note = null
  }) {
    const vol = Number(volume);
    if (!source_batch_location_id) throw new Error('Source batch location is required');
    if (Number.isNaN(vol) || vol <= 0) throw new Error('Volume must be greater than zero');
    const { orgId, now } = await getContext();
    const source = await BatchLocationRepository.getById(source_batch_location_id);
    if (!source) throw new Error('Source batch location not found');

    let destBatchLocationId = destination_batch_location_id || null;
    const transferId = uuidv4();

    await db.transaction('rw', [db.batch_location_transfers, db.batch_locations], async () => {
      if (!destBatchLocationId && destination_vessel_id) {
        const existing = await db.batch_locations
          .where('parent_batch_id')
          .equals(source.parent_batch_id)
          .filter((bl) => bl.vessel_id === destination_vessel_id && !bl.deleted_at)
          .first();
        if (existing) {
          destBatchLocationId = existing.id;
        } else {
          const created = await BatchLocationRepository.create({
            parent_batch_id: source.parent_batch_id,
            vessel_id: destination_vessel_id,
            current_volume: 0
          });
          destBatchLocationId = created.id;
        }
      }

      const transferRow = {
        id: transferId,
        org_id: orgId,
        parent_batch_id: source.parent_batch_id,
        source_batch_location_id,
        destination_batch_location_id: destBatchLocationId,
        destination_location_id: destination_location_id || null,
        destination_vessel_id: destination_vessel_id || null,
        volume: vol,
        transfer_type,
        note,
        created_at: now,
        updated_at: now,
        sync_status: 'pending',
        version: 1
      };

      await db.batch_location_transfers.add(transferRow);

      const newSourceVol = Math.max(0, (Number(source.current_volume) || 0) - vol);
      await BatchLocationRepository.update(source_batch_location_id, { current_volume: newSourceVol });

      if (destBatchLocationId) {
        const dest = await BatchLocationRepository.getById(destBatchLocationId);
        const destVol = (Number(dest?.current_volume) || 0) + vol;
        await BatchLocationRepository.update(destBatchLocationId, { current_volume: destVol });
      }
    });

    return await db.batch_location_transfers.get(transferId);
  },

  async applyRemoteUpsert(transfer) {
    if (transfer.deleted_at) {
      await db.batch_location_transfers.delete(transfer.id);
      return;
    }
    await db.batch_location_transfers.put(transfer);
  }
};
