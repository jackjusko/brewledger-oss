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

export const BatchReadingRepository = {
  async getByBatchId(batchId) {
    return await db.batch_readings.where('batch_id').equals(batchId).reverse().sortBy('measured_at');
  },

  async add(reading) {
    const { orgId, now } = await getContext();
    
    const newReading = {
      ...reading,
      id: uuidv4(),
      org_id: orgId,
      measured_at: reading.measured_at || now,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
      version: 1
    };
    
    // Fix DataCloneError
    const readingPlain = JSON.parse(JSON.stringify(newReading));
    
    await db.batch_readings.add(readingPlain);
    return newReading;
  },

  async applyRemoteUpsert(reading) {
    const local = await db.batch_readings.get(reading.id);
    if (!local) {
      await db.batch_readings.put(reading);
    } else {
      await db.batch_readings.put(reading);
    }
  }
};
