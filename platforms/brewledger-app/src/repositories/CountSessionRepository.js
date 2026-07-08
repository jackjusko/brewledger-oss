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

export const CountSessionRepository = {
  async create(session) {
    const { orgId, now } = await getContext();
    const newSession = {
      ...session,
      id: uuidv4(),
      status: 'OPEN',
      started_at: now,
      closed_counts: [],
      org_id: orgId,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };
    
    await db.count_sessions.add(newSession);
    return newSession;
  },

  async getById(id) {
    return await db.count_sessions.get(id);
  },

  async getOpenSession(locationId) {
    return await db.count_sessions
      .where('location_id').equals(locationId)
      .filter(s => s.status === 'OPEN')
      .first();
  },

  async close(id, closedCounts) {
    const { now } = await getContext();
    const current = await db.count_sessions.get(id);
    
    await db.count_sessions.update(id, {
      status: 'CLOSED',
      ended_at: now,
      closed_counts: closedCounts,
      updated_at: now,
      sync_status: 'pending',
      version: (current && current.version ? current.version : 0) + 1
    });
  },

  async delete(id) {
    const { now } = await getContext();
    const current = await db.count_sessions.get(id);
    
    await db.count_sessions.update(id, {
      status: 'CANCELLED',
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: (current && current.version ? current.version : 0) + 1
    });
  },

  async applyRemoteUpsert(session) {
    const local = await db.count_sessions.get(session.id);
    if (!local) {
      await db.count_sessions.put(session);
    } else {
      await db.count_sessions.put(session);
    }
  }
};
