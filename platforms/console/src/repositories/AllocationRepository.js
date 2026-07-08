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

export const AllocationRepository = {
  async allocate(batchId, itemId, locationId, quantity) {
    const { orgId } = await getContext();
    const allocation = {
      id: uuidv4(),
      batch_id: batchId,
      item_id: itemId,
      location_id: locationId,
      quantity: quantity,
      org_id: orgId,
      sync_status: 'pending',
      version: 1
    };
    await db.allocations.add(allocation);
    return allocation;
  },

  async getAll() {
    return await db.allocations.toArray();
  },

  async getByBatchId(batchId) {
    return await db.allocations.where('batch_id').equals(batchId).toArray();
  },

  async getByItemId(itemId) {
    return await db.allocations.where('item_id').equals(itemId).toArray();
  },

  async applyRemoteUpsert(allocation) {
    const local = await db.allocations.get(allocation.id);
    if (!local) {
      await db.allocations.put(allocation);
    } else {
      await db.allocations.put(allocation);
    }
  }
};
