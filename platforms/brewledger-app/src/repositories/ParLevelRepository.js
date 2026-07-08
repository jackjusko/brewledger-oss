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

/** True if par level is global (total across all locations) */
export const isGlobalParLevel = (par) => par && (par.location_id == null || par.location_id === '');

export const ParLevelRepository = {
  async setParLevel(itemId, locationId, minQty, maxQty = null) {
    if (locationId == null || locationId === '') {
      return this.setGlobalParLevel(itemId, minQty, maxQty);
    }
    const { orgId } = await getContext();

    const existing = await db.par_levels
      .filter(p => p.item_id === itemId && p.location_id === locationId)
      .first();

    if (existing) {
      const updated = {
        ...existing,
        min_qty: minQty,
        max_qty: maxQty,
        sync_status: 'pending',
        version: existing.version + 1
      };
      await db.par_levels.put(updated);
      return updated;
    } else {
      const newPar = {
        id: uuidv4(),
        item_id: itemId,
        location_id: locationId,
        min_qty: minQty,
        max_qty: maxQty,
        org_id: orgId,
        sync_status: 'pending',
        version: 1
      };
      await db.par_levels.add(newPar);
      return newPar;
    }
  },

  /** Set global par level (total on-hand across all locations) */
  async setGlobalParLevel(itemId, minQty, maxQty = null) {
    const { orgId } = await getContext();

    const existing = await db.par_levels
      .filter(p => p.item_id === itemId && (p.location_id == null || p.location_id === ''))
      .first();

    if (existing) {
      const updated = {
        ...existing,
        min_qty: minQty,
        max_qty: maxQty,
        location_id: null,
        sync_status: 'pending',
        version: existing.version + 1
      };
      await db.par_levels.put(updated);
      return updated;
    } else {
      const newPar = {
        id: uuidv4(),
        item_id: itemId,
        location_id: null,
        min_qty: minQty,
        max_qty: maxQty,
        org_id: orgId,
        sync_status: 'pending',
        version: 1
      };
      await db.par_levels.add(newPar);
      return newPar;
    }
  },

  async getAll() {
    return await db.par_levels.toArray();
  },

  async getGlobalPars() {
    return await db.par_levels.filter(p => p.location_id == null || p.location_id === '').toArray();
  },

  async getByLocation(locationId) {
    return await db.par_levels.where('location_id').equals(locationId).toArray();
  },

  async getByItem(itemId) {
    return await db.par_levels.where('item_id').equals(itemId).toArray();
  },

  async applyRemoteUpsert(parLevel) {
    await db.par_levels.put(parLevel);
  }
};
