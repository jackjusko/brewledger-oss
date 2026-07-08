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

export const VarianceEventRepository = {
  async create(event) {
    const { orgId } = await getContext();
    
    // Determine variance_type from delta_qty if not provided
    let varianceType = event.variance_type
    if (!varianceType && event.delta_qty != null) {
      varianceType = event.delta_qty > 0 ? 'overage' : 'shortage'
    }
    
    const newEvent = {
      ...event,
      id: uuidv4(),
      org_id: orgId,
      sync_status: 'pending',
      version: 1,
      // TTB classification fields
      variance_type: varianceType || null, // 'overage' or 'shortage'
      loss_type: event.loss_type || null // 'theft', 'spoilage', 'breakage', 'other' (for losses)
    };
    await db.variance_events.add(newEvent);
    return newEvent;
  },

  async getAll() {
    return await db.variance_events.toArray();
  },

  async getBySessionId(sessionId) {
    return await db.variance_events.where('count_session_id').equals(sessionId).toArray();
  },

  async applyRemoteUpsert(event) {
    const local = await db.variance_events.get(event.id);
    if (!local) {
      await db.variance_events.put(event);
    } else {
      await db.variance_events.put(event);
    }
  }
};
