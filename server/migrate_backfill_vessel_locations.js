/**
 * Backfill locations for vessels that don't have an associated location.
 * Creates a new location per vessel (name = vessel name, stage = serving for SERVING,
 * cellar for FERMENTER/BRITE/UNITANK/BARREL/OTHER) and links the vessel to it.
 *
 * Phase 2: Create default packaging items ("Empty 1/6th bbl keg", "Empty 1/2 bbl keg")
 * for all existing organizations that don't have them.
 *
 * Idempotent: skips vessels that already have location_id; skips orgs that already have default items.
 *
 * Usage: node server/migrate_backfill_vessel_locations.js
 *        DB_PATH=/path/to/database.sqlite node server/migrate_backfill_vessel_locations.js
 *
 * Dry run: DRY_RUN=1 node server/migrate_backfill_vessel_locations.js
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

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

function getStageForVesselType(type) {
  const t = (type || '').toUpperCase();
  return t === 'SERVING' ? 'serving' : 'cellar';
}

async function migrate() {
  const db = new sqlite3.Database(DB_PATH);
  let created = 0;
  let updated = 0;
  try {
    const vesselRows = await all(db, 'SELECT id, org_id, updated_at, server_updated_at, version, data FROM vessels');

    const runInTransaction = (fn) => new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) return reject(err);
          fn()
            .then((result) => {
              db.run('COMMIT', (commitErr) => {
                if (commitErr) reject(commitErr);
                else resolve(result);
              });
            })
            .catch((e) => {
              db.run('ROLLBACK', () => reject(e));
            });
        });
      });
    });

    const processVessels = async () => {
      for (const row of vesselRows) {
        let entity;
        try {
          entity = JSON.parse(row.data || '{}');
        } catch (e) {
          console.warn(`Skipping vessel ${row.id}: invalid JSON in data`);
          continue;
        }

        if (entity.deleted_at) continue;
        if (entity.location_id != null && entity.location_id !== '') continue;

        const vesselName = (entity.name || '').trim() || `Vessel ${entity.id}`;
        const stage = getStageForVesselType(entity.type);
        const locationId = uuidv4();
        const now = new Date().toISOString();

        const orgId = row.org_id || entity.org_id;
        const locationEntity = {
          id: locationId,
          name: vesselName,
          stage,
          org_id: orgId,
          created_at: now,
          updated_at: now,
          server_updated_at: now,
          sync_status: 'synced',
          version: 1
        };

        if (!DRY_RUN) {
          await run(db, 'INSERT INTO locations (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
            [locationId, orgId, now, now, 1, JSON.stringify(locationEntity)]);
        }
        created++;

        const updatedVesselEntity = {
          ...entity,
          location_id: locationId,
          updated_at: now,
          server_updated_at: now,
          version: (entity.version || 1) + 1
        };

        if (!DRY_RUN) {
          await run(db, 'UPDATE vessels SET updated_at = ?, server_updated_at = ?, version = ?, data = ? WHERE id = ?',
            [now, now, updatedVesselEntity.version, JSON.stringify(updatedVesselEntity), row.id]);
        }
        updated++;

        console.log(`${DRY_RUN ? '[DRY RUN] Would ' : ''}Backfill: vessel "${vesselName}" (${entity.type || 'unknown'}) → location "${vesselName}" (${stage})`);
      }
    };

    if (DRY_RUN) {
      await processVessels();
    } else {
      await runInTransaction(processVessels);
    }

    console.log(`\nPhase 1 done. ${DRY_RUN ? 'Would create ' : 'Created '}${created} location(s), ${DRY_RUN ? 'would update ' : 'updated '}${updated} vessel(s).`);

    // Phase 2: Default packaging items for existing orgs
    const DEFAULT_PACKAGING_ITEMS = [
      { name: 'Empty 1/6th bbl keg', category: 'Packaging', unit: 'ea' },
      { name: 'Empty 1/2 bbl keg', category: 'Packaging', unit: 'ea' }
    ];
    const orgRows = await all(db, 'SELECT id FROM orgs');
    let itemsCreated = 0;

    const migrateDefaultPackagingItems = async () => {
      for (const orgRow of orgRows) {
        const orgId = orgRow.id;
        const catRows = await all(db, 'SELECT id, data FROM categories WHERE org_id = ?', [orgId]);
        const packagingCatId = catRows.find(r => {
          try {
            const d = JSON.parse(r.data || '{}');
            return d.name === 'Packaging';
          } catch (_) { return false; }
        })?.id;
        if (!packagingCatId) continue;

        const itemRows = await all(db, 'SELECT data FROM items WHERE org_id = ?', [orgId]);
        const existingNames = new Set();
        for (const r of itemRows) {
          try {
            const d = JSON.parse(r.data || '{}');
            if (d.name && !d.deleted_at) existingNames.add(d.name);
          } catch (_) {}
        }

        for (const it of DEFAULT_PACKAGING_ITEMS) {
          if (existingNames.has(it.name)) continue;
          const itemId = uuidv4();
          const now = new Date().toISOString();
          const itemEntity = {
            id: itemId,
            name: it.name,
            category: it.category,
            unit: it.unit,
            org_id: orgId,
            created_at: now,
            updated_at: now,
            server_updated_at: now,
            sync_status: 'synced',
            version: 1,
            currency: 'USD'
          };
          if (!DRY_RUN) {
            await run(db, 'INSERT INTO items (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
              [itemId, orgId, now, now, 1, JSON.stringify(itemEntity)]);
          }
          itemsCreated++;
          existingNames.add(it.name);
          console.log(`${DRY_RUN ? '[DRY RUN] Would add ' : 'Added '}default item "${it.name}" for org ${orgId}`);
        }
      }
    };

    if (DRY_RUN) {
      await migrateDefaultPackagingItems();
    } else {
      await runInTransaction(migrateDefaultPackagingItems);
    }

    console.log(`\nPhase 2 done. ${DRY_RUN ? 'Would create ' : 'Created '}${itemsCreated} default packaging item(s).`);
    console.log(`\nDone. ${DRY_RUN ? 'Would create ' : 'Created '}${created} location(s), ${DRY_RUN ? 'would update ' : 'updated '}${updated} vessel(s), ${itemsCreated} default item(s).`);
    if (DRY_RUN && (created > 0 || updated > 0 || itemsCreated > 0)) {
      console.log('Run without DRY_RUN=1 to apply changes.');
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { migrate };
