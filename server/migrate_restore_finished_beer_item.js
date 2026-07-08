/**
 * One-off: Restore the "Finished Beer" item to any org that doesn't have it.
 * Use after orgs may have deleted it (e.g. before delete protection was added).
 * Idempotent: only inserts the item when category === 'Finished Beer' is missing.
 *
 * Usage: node server/migrate_restore_finished_beer_item.js
 *        DB_PATH=/path/to/database.sqlite node server/migrate_restore_finished_beer_item.js
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
  let restored = 0;
  try {
    const orgs = await all(db, 'SELECT id FROM orgs');
    const now = new Date().toISOString();

    for (const org of orgs) {
      const orgId = org.id;
      const itemRows = await all(db, 'SELECT id, data FROM items WHERE org_id = ?', [orgId]);
      const hasBeerItem = itemRows.some(r => {
        try {
          const d = JSON.parse(r.data || '{}');
          return d.category === BEER_CATEGORY_NAME;
        } catch (e) { return false; }
      });

      if (hasBeerItem) continue;

      // Ensure Finished Beer category exists (item references it by name)
      const catRows = await all(db, 'SELECT id, data FROM categories WHERE org_id = ?', [orgId]);
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
        console.log(`Org ${orgId}: added missing category "${BEER_CATEGORY_NAME}"`);
      }

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
      console.log(`Org ${orgId}: restored Finished Beer item`);
      restored++;
    }

    console.log(`Done. Restored Finished Beer item for ${restored} org(s).`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { migrate };
