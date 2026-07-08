/**
 * Migration: TTB Beer Category and Finished Beer Item
 * For each org, ensure the "Finished Beer" category (system, undeletable) and
 * the single "Finished Beer" item exist. Used for beer-as-items ledger and TTB Form 5130.9.
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const BEER_CATEGORY_NAME = 'Finished Beer';

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function migrate() {
  const db = new sqlite3.Database(DB_PATH);
  try {
    const orgs = await all(db, 'SELECT id FROM orgs');
    const now = new Date().toISOString();
    for (const org of orgs) {
      const orgId = org.id;
      const catRows = await all(db, "SELECT id, data FROM categories WHERE org_id = ?", [orgId]);
      const hasBeerCategory = catRows.some(r => {
        try {
          const d = JSON.parse(r.data || '{}');
          return d.name === BEER_CATEGORY_NAME;
        } catch (e) { return false; }
      });
      if (!hasBeerCategory) {
        const beerCatId = uuidv4();
        const beerCatEntity = {
          id: beerCatId,
          name: BEER_CATEGORY_NAME,
          org_id: orgId,
          created_at: now,
          updated_at: now,
          server_updated_at: now,
          sync_status: 'synced',
          version: 1,
          is_system: true
        };
        await run(db, 'INSERT INTO categories (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
          [beerCatId, orgId, now, now, 1, JSON.stringify(beerCatEntity)]);
        console.log(`Org ${orgId}: added beer category ${BEER_CATEGORY_NAME}`);
      }
      const itemRows = await all(db, 'SELECT id, data FROM items WHERE org_id = ?', [orgId]);
      const hasBeerItem = itemRows.some(r => {
        try {
          const d = JSON.parse(r.data || '{}');
          return d.category === BEER_CATEGORY_NAME;
        } catch (e) { return false; }
      });
      if (!hasBeerItem) {
        const beerItemId = uuidv4();
        const beerItemEntity = {
          id: beerItemId,
          name: BEER_CATEGORY_NAME,
          category: BEER_CATEGORY_NAME,
          unit: 'bbl',
          org_id: orgId,
          created_at: now,
          updated_at: now,
          server_updated_at: now,
          sync_status: 'synced',
          version: 1
        };
        await run(db, 'INSERT INTO items (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
          [beerItemId, orgId, now, now, 1, JSON.stringify(beerItemEntity)]);
        console.log(`Org ${orgId}: added Finished Beer item`);
      }
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  migrate().then(() => {
    console.log('TTB beer category migration done.');
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { migrate };
