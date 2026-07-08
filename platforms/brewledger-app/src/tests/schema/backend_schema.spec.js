import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { initDb } from '../../backend/init_db';

const TEST_DB_PATH = path.resolve(__dirname, 'test_schema.sqlite');
process.env.DB_PATH = TEST_DB_PATH;

describe('Backend Schema', () => {
  let db;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    await initDb();
    db = new sqlite3.Database(TEST_DB_PATH);
  });

  afterAll((done) => {
    db.close(() => {
      if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
      done();
    });
  });

  const getTables = () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => r.name));
      });
    });
  };

  const getColumns = (table) => {
    return new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${table})`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  it('should have all required tables', async () => {
    const tables = await getTables();
    const expected = [
      'orgs', 'users', 'sessions', 
      'items', 'locations', 'batches', 'count_sessions', 
      'vessels', 'categories', 'batch_additions', 'batch_readings', 
      'packaging_runs', 'variance_events', 'par_levels', 'allocations', 
      'recipes', 'recipe_items', 'batch_milestones', 'ledger_entries'
    ];
    
    expected.forEach(t => {
      expect(tables).toContain(t);
    });
  });

  it('should have correct columns in ledger_entries', async () => {
    const cols = await getColumns('ledger_entries');
    const names = cols.map(c => c.name);
    
    expect(names).toContain('id');
    expect(names).toContain('item_id');
    expect(names).toContain('quantity'); // Wait, schema uses data blob, but I added specific columns in init_db?
    // Let's check init_db.js
    // db.run(`CREATE TABLE IF NOT EXISTS ledger_entries (
    //   id TEXT PRIMARY KEY,
    //   org_id TEXT,
    //   item_id TEXT,
    //   location_id TEXT, ...
    
    // It DOES NOT have 'quantity' column directly in the CREATE TABLE statement in init_db.js?
    // Let's re-read init_db.js content I wrote.
  });
});
