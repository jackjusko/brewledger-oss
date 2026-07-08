import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEST_DB_PATH = path.resolve(__dirname, 'test_backend_sync.sqlite');

const createApp = require('../../backend/server');
const { initDb } = require('../../backend/init_db');

describe('Backend Sync API', () => {
  let app;
  let token;
  let orgId;

  beforeAll(async () => {
    // Cleanup previous run BEFORE app require opens connection
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {
        console.log('Could not cleanup previous DB (might be locked or not exist):', e.message);
      }
    }

    // Create app with specific DB path
    app = createApp({ dbPath: TEST_DB_PATH });
    
    // Initialize DB schema using the app's connection
    await initDb(app.db);

    // Register
    const res = await request(app)
      .post('/api/auth/register-org')
      .send({ orgName: 'Sync Test Org', email: 'sync@test.com', password: 'password', adminName: 'Sync Admin' });
    token = res.body.token;
    orgId = res.body.orgId;
  }, 30000); // Increase timeout for slow environments

  afterAll(async () => {
    // Close DB connection to release lock
    await new Promise((resolve) => {
      if (app && app.db) {
        app.db.close((err) => {
          if (err) console.error('Error closing DB:', err);
          resolve();
        });
      } else {
        resolve();
      }
    });

    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {
        console.error('Failed to cleanup DB:', e.message);
      }
    }
  });

  it('should sync new items', async () => {
    const item = {
      id: uuidv4(),
      name: 'Test Item',
      category: 'Malt',
      unit: 'kg',
      updated_at: new Date().toISOString(),
      version: 1
    };

    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        changes: {
          items: [item]
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.serverTimestamp).toBeDefined();
    
    // Verify item is returned in next sync
    const res2 = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({});
      
    const syncedItem = res2.body.updates.items.find(i => i.id === item.id);
    expect(syncedItem).toBeDefined();
    expect(syncedItem.name).toBe('Test Item');
  });

  it('should reject invalid entities', async () => {
    const invalidItem = {
      id: uuidv4(),
      // name missing
      updated_at: new Date().toISOString(),
      version: 1
    };

    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        changes: {
          items: [invalidItem]
        }
      });

    expect(res.status).toBe(200); // Sync shouldn't crash, just ignore
    
    // Check it wasn't saved
    const res2 = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({});
      
    const syncedItem = res2.body.updates.items.find(i => i.id === invalidItem.id);
    expect(syncedItem).toBeUndefined();
  });

  it('should handle batch milestones', async () => {
    const milestone = {
      id: uuidv4(),
      batch_id: uuidv4(),
      milestone_type: 'KNOCKOUT',
      completed: true,
      occurred_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };

    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        changes: {
          batch_milestones: [milestone]
        }
      });

    expect(res.status).toBe(200);
    
    // Verify sync back
    const res2 = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({});
      
    const synced = res2.body.updates.batch_milestones.find(m => m.id === milestone.id);
    expect(synced).toBeDefined();
    expect(synced.milestone_type).toBe('KNOCKOUT');
  });
});
