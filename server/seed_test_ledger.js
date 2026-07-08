/**
 * Seed test ledger entries for an account identified by email.
 * Usage: node seed_test_ledger.js [email]
 * Default email: test@brewledger.local
 *
 * Requires the account to exist and to have at least one item and one location
 * (e.g. after registration + sync, or run migrate_ttb_beer_category.js for Finished Beer).
 * Inserts a variety of RECEIVE, CONSUME, and TRANSFER entries over the last 90 days.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const EMAIL = process.argv[2] || 'test@brewledger.local';

function connect() {
  return new sqlite3.Database(DB_PATH);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
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

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function main() {
  const db = connect();

  try {
    const user = await get(db, 'SELECT id, org_id FROM users WHERE email = ?', [EMAIL]);
    if (!user) {
      console.error(`No user found with email "${EMAIL}". Register first or use a different email.`);
      process.exit(1);
    }

    const orgId = user.org_id;
    console.log(`Found org ${orgId} for ${EMAIL}`);

    const itemRows = await all(db, 'SELECT id, data FROM items WHERE org_id = ?', [orgId]);
    const locationRows = await all(db, 'SELECT id, data FROM locations WHERE org_id = ?', [orgId]);

    let beerItemId = null;
    const items = [];
    for (const row of itemRows) {
      try {
        const data = JSON.parse(row.data || '{}');
        if (!data.deleted_at) {
          items.push({ id: row.id, name: data.name, category: data.category });
          if (data.category === 'Finished Beer') beerItemId = row.id;
        }
      } catch (_) {}
    }
    const locationIds = [];
    for (const row of locationRows) {
      try {
        const data = JSON.parse(row.data || '{}');
        if (!data.deleted_at) locationIds.push(row.id);
      } catch (_) {}
    }

    const itemId = beerItemId || (items[0] && items[0].id);
    if (!itemId || locationIds.length === 0) {
      console.error('This org has no items or no locations. Add at least one item and one location (e.g. sync after registration or run migrate_ttb_beer_category.js).');
      process.exit(1);
    }

    const loc1 = locationIds[0];
    const loc2 = locationIds[1] || locationIds[0];
    const now = new Date().toISOString();

    const entries = [];

    // --- RECEIVEs (additions) ---
    for (let i = 0; i < 8; i++) {
      const created_at = daysAgo(randomInRange(1, 90));
      const qty = Math.round(randomInRange(1, 15) * 10) / 10;
      const id = uuidv4();
      const entity = {
        id,
        org_id: orgId,
        type: 'RECEIVE',
        item_id: itemId,
        location_id: loc1,
        quantity: qty,
        created_at,
        version: 1,
        item_name: items.find(x => x.id === itemId)?.name || 'Item',
        location_name: 'Cellar',
      };
      entries.push({ entity, id });
    }

    // --- RECEIVE production_complete (beer produced) - a few in last 30 days ---
    if (beerItemId) {
      for (let i = 0; i < 3; i++) {
        const created_at = daysAgo(randomInRange(5, 30));
        const qty = Math.round(randomInRange(2, 10) * 10) / 10;
        const id = uuidv4();
        const entity = {
          id,
          org_id: orgId,
          type: 'RECEIVE',
          item_id: beerItemId,
          location_id: loc1,
          quantity: qty,
          data: { source: 'production_complete' },
          created_at,
          version: 1,
          item_name: 'Finished Beer',
          location_name: 'Cellar',
        };
        entries.push({ entity, id });
      }
    }

    // --- CONSUME (removals: sale, sample, etc.) ---
    const purposes = ['sale', 'sale', 'sale', 'consumption', 'sample', 'destruction'];
    for (let i = 0; i < 6; i++) {
      const created_at = daysAgo(randomInRange(1, 60));
      const qty = Math.round(randomInRange(0.5, 5) * 10) / 10;
      const id = uuidv4();
      const entity = {
        id,
        org_id: orgId,
        type: 'CONSUME',
        item_id: beerItemId || itemId,
        location_id: loc1,
        quantity: -qty,
        created_at,
        version: 1,
        removal_purpose: purposes[i],
        item_name: 'Finished Beer',
        location_name: 'Cellar',
      };
      entries.push({ entity, id });
    }

    // --- TRANSFER pairs (racking: out from loc1, in to loc2) ---
    for (let i = 0; i < 4; i++) {
      const created_at = daysAgo(randomInRange(3, 45));
      const qty = Math.round(randomInRange(1, 4) * 10) / 10;
      const groupId = uuidv4();
      const outId = uuidv4();
      const inId = uuidv4();
      const outEntity = {
        id: outId,
        org_id: orgId,
        type: 'TRANSFER_OUT',
        item_id: beerItemId || itemId,
        location_id: loc1,
        quantity: -qty,
        created_at,
        version: 1,
        transfer_group_id: groupId,
        operation_type: 'racking',
        item_name: 'Finished Beer',
        location_name: 'Cellar',
      };
      const inEntity = {
        id: inId,
        org_id: orgId,
        type: 'TRANSFER_IN',
        item_id: beerItemId || itemId,
        location_id: loc2,
        quantity: qty,
        created_at,
        version: 1,
        transfer_group_id: groupId,
        operation_type: 'racking',
        item_name: 'Finished Beer',
        location_name: 'Racking',
      };
      entries.push({ entity: outEntity, id: outId });
      entries.push({ entity: inEntity, id: inId });
    }

    // Insert ledger rows and update onhand_cache (only when row is actually inserted)
    let inserted = 0;
    for (const { entity, id } of entries) {
      const existing = await get(db, 'SELECT id FROM ledger_entries WHERE id = ?', [id]);
      if (existing) continue;

      const dataJson = JSON.stringify(entity);
      await run(db,
        `INSERT INTO ledger_entries (id, org_id, item_id, location_id, batch_id, transfer_group_id, reversal_group_id, reversed_of_ledger_id, created_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          orgId,
          entity.item_id,
          entity.location_id || null,
          entity.batch_id || null,
          entity.transfer_group_id || null,
          entity.reversal_group_id || null,
          entity.reversed_of_ledger_id || null,
          entity.created_at,
          now,
          entity.version || 1,
          dataJson,
        ]
      );
      if (entity.item_id && entity.location_id && typeof entity.quantity === 'number') {
        const cur = await get(db, 'SELECT quantity FROM onhand_cache WHERE org_id = ? AND item_id = ? AND location_id = ?', [orgId, entity.item_id, entity.location_id]);
        const prev = cur ? cur.quantity : 0;
        const newQty = prev + entity.quantity;
        await run(db,
          'INSERT OR REPLACE INTO onhand_cache (org_id, item_id, location_id, quantity, last_updated) VALUES (?, ?, ?, ?, ?)',
          [orgId, entity.item_id, entity.location_id, newQty, now]
        );
      }
      inserted++;
    }

    console.log(`Inserted ${inserted} ledger entries for ${EMAIL}. Sync the console/mobile app to see them.`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
