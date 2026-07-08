import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Set test DB path BEFORE importing app
const TEST_DB_PATH = path.resolve(__dirname, 'test_backend.sqlite');

const createApp = require('../../backend/server');
const { initDb } = require('../../backend/init_db');

describe('Backend Auth API', () => {
  let app;

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
    
    // Initialize DB schema
    await initDb(app.db);
  }, 30000); // Increase timeout for slow environments

  afterAll(async () => {
    // Close DB connection to release lock
    await new Promise((resolve) => {
      if (app && app.db) {
        app.db.close((err) => {
          if (err) console.error('Error closing app DB:', err);
          resolve();
        });
      } else {
        resolve();
      }
    });

    // Cleanup
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {
        console.error('Failed to cleanup DB:', e.message);
      }
    }
  });

  let token = '';
  let orgId = '';

  it('should register a new organization', async () => {
    const res = await request(app)
      .post('/api/auth/register-org')
      .send({
        orgName: 'Test Brewery',
        email: 'admin@test.com',
        password: 'password123',
        adminName: 'Admin User'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('orgId');
    
    token = res.body.token;
    orgId = res.body.orgId;
  });

  it('should fail to register with existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register-org')
      .send({
        orgName: 'Duplicate Brewery',
        email: 'admin@test.com',
        password: 'password123',
        adminName: 'Admin User'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.orgId).toBe(orgId);
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });

  it('should invite a user', async () => {
    const res = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'brewer@test.com',
        password: 'brewerpass',
        name: 'Brewer User'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('userId');
  });
});
