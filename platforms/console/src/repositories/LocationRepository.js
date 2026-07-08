import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/AuthService';
import axios from 'axios';
import { API_BASE_URL } from '../config';

import { LedgerRepository } from './LedgerRepository';

const getContext = async () => {
  const session = await AuthService.getSession();
  return {
    orgId: session ? session.orgId : null,
    now: new Date().toISOString(),
    token: session ? session.token : null
  };
};

/** TTB Form 5130.9 column staging: cellar, serving (maps to cellar), racking_keg, bottling_bulk, case */
export const LOCATION_STAGES = ['cellar', 'serving', 'racking_keg', 'bottling_bulk', 'case'];
export const DEFAULT_STAGE = 'cellar';
export const LOCATION_STAGE_LABELS = {
  cellar: 'Cellar (bulk)',
  serving: 'Serving (taproom bulk)',
  racking_keg: 'Racking keg',
  bottling_bulk: 'Bottling bulk',
  case: 'Case'
};

export const LocationRepository = {
  async getAll() {
    const { orgId } = await getContext();
    let list;
    if (orgId) {
      list = await db.locations.where('org_id').equals(orgId).filter(l => !l.deleted_at).toArray();
    } else {
      list = await db.locations.filter(l => !l.org_id && !l.deleted_at).toArray();
    }
    return list.map(l => ({ ...l, stage: LOCATION_STAGES.includes(l.stage) ? l.stage : DEFAULT_STAGE }));
  },

  async getById(id) {
    return await db.locations.get(id);
  },

  async create(location) {
    const { orgId, now, token } = await getContext();
    const tempId = uuidv4();
    
    // Attempt online creation first
    if (token) {
      try {
        const response = await axios.post(`${API_BASE_URL}/locations`, {
          name: location.name,
          stage: location.stage || DEFAULT_STAGE
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Server creation successful
        const serverLocation = response.data;
        serverLocation.sync_status = 'synced';
        if (serverLocation.stage === undefined) serverLocation.stage = location.stage || DEFAULT_STAGE;
        
        // Save to local DB
        await db.locations.add(serverLocation);
        return serverLocation;
        
      } catch (e) {
        // If limit reached, rethrow error to stop UI
        if (e.response && (e.response.status === 400 || e.response.status === 403)) {
          throw new Error(e.response.data.error || 'Failed to create location');
        }
        // For other errors (network), fall through to offline creation
        console.warn('Online creation failed, falling back to offline mode', e);
      }
    }

    // Offline Fallback
    const newLocation = {
      ...location,
      id: tempId,
      org_id: orgId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1,
      stage: location.stage || DEFAULT_STAGE
    };
    
    await db.locations.add(newLocation);
    return newLocation;
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
    
    await db.locations.update(id, updated);
    return await this.getById(id);
  },

  async delete(id) {
    const { now } = await getContext();
    
    // 1. Zero out inventory (Create CONSUME entries for any positive onhand in this location)
    const cacheEntries = await db.onhand_cache.where('location_id').equals(id).toArray();
    
    for (const entry of cacheEntries) {
      if (entry.quantity > 0) {
        await LedgerRepository.addEntry({
          type: 'CONSUME',
          item_id: entry.item_id,
          location_id: id,
          quantity: -entry.quantity,
          note: 'System: Location Deleted'
        });
      }
    }

    const doc = await db.locations.get(id);
    if (!doc) return;

    await db.locations.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: (doc.version || 0) + 1
    });
  },
  
  async applyRemoteUpsert(location) {
    const local = await db.locations.get(location.id);
    if (!local) {
      await db.locations.put(location);
    } else {
      await db.locations.put(location);
    }
  }
};
