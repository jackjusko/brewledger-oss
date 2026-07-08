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

export const VesselRepository = {
  async getAll() {
    const { orgId } = await getContext();
    if (orgId) {
      return await db.vessels.where('org_id').equals(orgId).toArray();
    }
    return await db.vessels.filter(v => !v.org_id).toArray();
  },

  async getById(id) {
    return await db.vessels.get(id);
  },

  async create(vessel) {
    const { orgId, now } = await getContext();
    const newVessel = {
      ...vessel,
      id: uuidv4(),
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };
    
    await db.vessels.add(newVessel);
    return newVessel;
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
    
    await db.vessels.update(id, updated);
    return await this.getById(id);
  },

  async delete(id) {
    const { now } = await getContext();
    const current = await this.getById(id);
    
    await db.vessels.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: (current && current.version ? current.version : 0) + 1
    });
  },

  async applyRemoteUpsert(vessel) {
    const local = await db.vessels.get(vessel.id);
    if (!local) {
      await db.vessels.put(vessel);
    } else {
      await db.vessels.put(vessel);
    }
  }
};
