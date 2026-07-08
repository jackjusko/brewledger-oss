/**
 * Creates a test account with realistic seed data: org, user, categories, items (heavy inventory),
 * locations (multiple stages), vessels (fermenters, brite, serving tanks), and ledger/on-hand.
 *
 * Usage: node seed_test_account.js
 *   Uses DB_PATH env or server/database.sqlite.
 *
 * Credentials (same every run):
 *   Email:    test@brewledger.local
 *   Password: TestPassword123!
 *
 * If the user already exists, seed data (items, locations, vessels, ledger) is added only when
 * the org has no locations (first-time seed). Use --force to clear and re-seed data for that org.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const TEST_EMAIL = 'test@brewledger.local';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_ORG_NAME = 'Test Brewery';
const TEST_ADMIN_NAME = 'Test Admin';

const FORCE_RESEED = process.argv.includes('--force');

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

async function ensureTestAccount(db, now) {
  let user = await get(db, 'SELECT id, org_id FROM users WHERE email = ?', [TEST_EMAIL]);
  let orgId;
  let created = false;

  if (!user) {
    orgId = uuidv4();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await run(db,
      `INSERT INTO orgs (id, name, created_at, created_by_user_id, created_by_user_name, trial_ends_at, subscription_plan, subscription_status, max_locations)
       VALUES (?, ?, ?, ?, ?, ?, 'subscription', 'trialing', 100)`,
      [orgId, TEST_ORG_NAME, now, userId, TEST_ADMIN_NAME, trialEndsAt]
    );
    await run(db,
      `INSERT INTO users (id, org_id, email, password_hash, created_at, name, role) VALUES (?, ?, ?, ?, ?, ?, 'admin')`,
      [userId, orgId, TEST_EMAIL, passwordHash, now, TEST_ADMIN_NAME]
    );

    const standards = ['Malt / Grain', 'Hops', 'Yeast', 'Adjuncts', 'Chemicals', 'Packaging', 'Merch', 'Other'];
    const BEER_CATEGORY_NAME = 'Finished Beer';

    for (const catName of standards) {
      const catId = uuidv4();
      const catEntity = { id: catId, name: catName, org_id: orgId, created_at: now, updated_at: now, server_updated_at: now, sync_status: 'synced', version: 1 };
      await run(db, `INSERT INTO categories (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)`,
        [catId, orgId, now, now, 1, JSON.stringify(catEntity)]);
    }

    const beerCatId = uuidv4();
    const beerCatEntity = { id: beerCatId, name: BEER_CATEGORY_NAME, org_id: orgId, created_at: now, updated_at: now, server_updated_at: now, sync_status: 'synced', version: 1, is_system: true };
    await run(db, `INSERT INTO categories (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)`,
      [beerCatId, orgId, now, now, 1, JSON.stringify(beerCatEntity)]);

    // No default Finished Beer item - per plan, do not add it through test seed data

    // Default milestone template for new orgs (batches need milestone_definitions)
    const defaultTemplateId = uuidv4();
    const defaultMilestones = [
      { id: uuidv4(), label: 'Knocked Out', description: 'Wort in FV', sort_order: 0 },
      { id: uuidv4(), label: 'Pitched', description: 'Yeast added', sort_order: 1 },
      { id: uuidv4(), label: 'Fermentation Started', description: 'Activity observed', sort_order: 2 },
      { id: uuidv4(), label: 'FG Confirmed', description: 'Gravity stable', sort_order: 3 },
      { id: uuidv4(), label: 'Cold Crash', description: 'Temp dropped', sort_order: 4 },
      { id: uuidv4(), label: 'Transferred', description: 'Moved vessel', sort_order: 5 },
      { id: uuidv4(), label: 'Production Complete', description: 'Beer is finished.', sort_order: 6, is_system: true }
    ];
    const defaultTemplateEntity = {
      id: defaultTemplateId,
      org_id: orgId,
      name: 'Default',
      milestones: defaultMilestones,
      is_default: true,
      updated_at: now,
      version: 1
    };
    await run(db, 'INSERT INTO milestone_templates (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
      [defaultTemplateId, orgId, now, now, 1, JSON.stringify(defaultTemplateEntity)]);

    user = { id: userId, org_id: orgId };
    created = true;
    console.log('Created test account:', TEST_EMAIL, 'org', orgId);
  } else {
    orgId = user.org_id;
    console.log('Using existing test account:', TEST_EMAIL, 'org', orgId);
  }

  return { orgId, created };
}

async function clearOrgSeedData(db, orgId) {
  // Batch-related (dependency order: children first)
  await run(db, 'DELETE FROM batch_volume_adjustments WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM batch_volume_snapshots WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM batch_location_transfers WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM batch_additions WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM batch_readings WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM packaging_runs WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM batch_milestones WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM batch_locations WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM batches WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM onhand_cache WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM ledger_entries WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM vessels WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM locations WHERE org_id = ?', [orgId]);
  await run(db, 'DELETE FROM items WHERE org_id = ?', [orgId]);
  console.log('Cleared existing seed data for org (batches, items, locations, vessels, ledger, on-hand).');
}

async function seedData(db, orgId, now) {
  const catRows = await all(db, 'SELECT id, data FROM categories WHERE org_id = ?', [orgId]);
  const categoryIdByName = {};
  for (const row of catRows) {
    try {
      const d = JSON.parse(row.data || '{}');
      if (d.name) categoryIdByName[d.name] = row.id;
    } catch (_) {}
  }

  // Do not create Finished Beer item or seed beer ledger (per plan)

  const locationsToCreate = [
    { name: 'Cold Room', stage: 'cellar' },
    { name: 'Taproom (Serving)', stage: 'serving' },
    { name: 'Brewery Cellar', stage: 'cellar' },
    { name: 'Keg Storage', stage: 'racking_keg' },
    { name: 'Case Storage', stage: 'case' },
    { name: 'Dry Storage', stage: 'cellar' },
  ];
  const locationIds = [];
  for (const loc of locationsToCreate) {
    const id = uuidv4();
    const entity = { id, name: loc.name, stage: loc.stage || 'cellar', org_id: orgId, created_at: now, updated_at: now, server_updated_at: now, sync_status: 'synced', version: 1 };
    await run(db, `INSERT INTO locations (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)`, [id, orgId, now, now, 1, JSON.stringify(entity)]);
    locationIds.push({ id, ...loc });
  }

  const locationByName = {};
  for (const loc of locationIds) {
    locationByName[loc.name] = loc;
  }

  // default_unit_cost = price per unit (USD) for realistic test data
  // distribution: [{ locationName, qty }] — inventory spread across locations
  const itemsToCreate = [
    { name: 'Pale Malt 2-Row', category: 'Malt / Grain', unit: 'lb', default_unit_cost: 0.85, distribution: [{ locationName: 'Dry Storage', qty: 3000 }, { locationName: 'Cold Room', qty: 2000 }] },
    { name: 'Munich Malt', category: 'Malt / Grain', unit: 'lb', default_unit_cost: 1.00, distribution: [{ locationName: 'Dry Storage', qty: 800 }, { locationName: 'Brewery Cellar', qty: 400 }] },
    { name: 'Carapils', category: 'Malt / Grain', unit: 'lb', default_unit_cost: 1.20, distribution: [{ locationName: 'Dry Storage', qty: 500 }] },
    { name: 'Chocolate Malt', category: 'Malt / Grain', unit: 'lb', default_unit_cost: 1.50, distribution: [{ locationName: 'Dry Storage', qty: 200 }] },
    { name: 'Cascade Hops', category: 'Hops', unit: 'lb', default_unit_cost: 12.00, distribution: [{ locationName: 'Cold Room', qty: 80 }] },
    { name: 'Centennial Hops', category: 'Hops', unit: 'lb', default_unit_cost: 14.00, distribution: [{ locationName: 'Cold Room', qty: 50 }] },
    { name: 'Citra Hops', category: 'Hops', unit: 'lb', default_unit_cost: 18.00, distribution: [{ locationName: 'Cold Room', qty: 40 }] },
    { name: 'Columbus Hops', category: 'Hops', unit: 'lb', default_unit_cost: 11.00, distribution: [{ locationName: 'Cold Room', qty: 25 }] },
    { name: 'US-05 Yeast', category: 'Yeast', unit: 'pkg', default_unit_cost: 5.00, distribution: [{ locationName: 'Cold Room', qty: 120 }, { locationName: 'Brewery Cellar', qty: 80 }] },
    { name: 'WLP001 Yeast', category: 'Yeast', unit: 'pkg', default_unit_cost: 9.00, distribution: [{ locationName: 'Cold Room', qty: 100 }] },
    { name: 'Keg 1/2 bbl', category: 'Packaging', unit: 'ea', default_unit_cost: 125.00, distribution: [{ locationName: 'Keg Storage', qty: 100 }, { locationName: 'Brewery Cellar', qty: 50 }] },
    { name: 'Keg 1/6 bbl', category: 'Packaging', unit: 'ea', default_unit_cost: 90.00, distribution: [{ locationName: 'Keg Storage', qty: 80 }] },
    { name: 'Crown Caps', category: 'Packaging', unit: 'case', default_unit_cost: 32.00, distribution: [{ locationName: 'Case Storage', qty: 100 }] },
    { name: 'Irish Moss', category: 'Adjuncts', unit: 'g', default_unit_cost: 0.03, distribution: [{ locationName: 'Cold Room', qty: 500 }] },
    { name: 'PBW', category: 'Chemicals', unit: 'lb', default_unit_cost: 10.00, distribution: [{ locationName: 'Dry Storage', qty: 40 }, { locationName: 'Brewery Cellar', qty: 20 }] },
    { name: 'Star San', category: 'Chemicals', unit: 'gal', default_unit_cost: 35.00, distribution: [{ locationName: 'Dry Storage', qty: 5 }, { locationName: 'Brewery Cellar', qty: 2 }] },
  ];

  const itemIds = [];
  for (const it of itemsToCreate) {
    const catId = categoryIdByName[it.category] || Object.values(categoryIdByName)[0];
    const id = uuidv4();
    const entity = { id, name: it.name, category: it.category, unit: it.unit, org_id: orgId, created_at: now, updated_at: now, server_updated_at: now, sync_status: 'synced', version: 1, currency: 'USD', default_unit_cost: it.default_unit_cost != null ? it.default_unit_cost : 0 };
    await run(db, `INSERT INTO items (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)`, [id, orgId, now, now, 1, JSON.stringify(entity)]);
    itemIds.push({ id, ...it });
  }

  const servingLocation = locationIds.find(l => l.stage === 'serving');

  const vesselsToCreate = [
    { name: 'FV-1', type: 'FERMENTER' },
    { name: 'FV-2', type: 'FERMENTER' },
    { name: 'FV-3', type: 'FERMENTER' },
    { name: 'BT-1', type: 'BRITE' },
    { name: 'BT-2', type: 'BRITE' },
    { name: 'Serving Tank 1', type: 'SERVING', location_id: servingLocation?.id || null },
    { name: 'Serving Tank 2', type: 'SERVING', location_id: servingLocation?.id || null },
  ];
  const vesselIdsByName = {};
  for (const v of vesselsToCreate) {
    const id = uuidv4();
    const entity = { id, name: v.name, type: v.type, org_id: orgId, created_at: now, updated_at: now, server_updated_at: now, sync_status: 'synced', version: 1 };
    if (v.type === 'SERVING' && v.location_id) entity.location_id = v.location_id;
    await run(db, `INSERT INTO vessels (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)`, [id, orgId, now, now, 1, JSON.stringify(entity)]);
    vesselIdsByName[v.name] = id;
  }

  const onhandByKey = {};
  const addOnhand = (itemId, locationId, quantity) => {
    const key = `${itemId}:${locationId}`;
    onhandByKey[key] = (onhandByKey[key] || 0) + quantity;
  };

  for (const it of itemIds) {
    for (const d of it.distribution) {
      const loc = locationByName[d.locationName];
      if (!loc) {
        console.warn(`Seed: skipping "${it.name}" at "${d.locationName}" – location not found`);
        continue;
      }
      const qty = d.qty;
      const ledgerId = uuidv4();
      const entity = { id: ledgerId, org_id: orgId, type: 'RECEIVE', item_id: it.id, location_id: loc.id, quantity: qty, created_at: now, version: 1, note: 'Seed inventory' };
      await run(db, `INSERT INTO ledger_entries (id, org_id, item_id, location_id, batch_id, transfer_group_id, reversal_group_id, reversed_of_ledger_id, client_request_id, created_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ledgerId, orgId, it.id, loc.id, null, null, null, null, null, now, now, 1, JSON.stringify(entity)]);
      addOnhand(it.id, loc.id, qty);
    }
  }

  // Ensure milestone template exists (for existing orgs that may not have one)
  let templateRows = await all(db, 'SELECT id, data FROM milestone_templates WHERE org_id = ?', [orgId]);
  let milestoneDefs = [];
  let templateId = null;
  if (templateRows.length > 0) {
    try {
      const tpl = JSON.parse(templateRows[0].data || '{}');
      templateId = templateRows[0].id;
      milestoneDefs = (tpl.milestones || []).map((m, i) => ({ id: m.id || uuidv4(), label: m.label || 'Step', description: m.description || '', sort_order: m.sort_order ?? i }));
    } catch (_) {}
  }
  if (milestoneDefs.length === 0) {
    templateId = uuidv4();
    milestoneDefs = [
      { id: uuidv4(), label: 'Knocked Out', description: 'Wort in FV', sort_order: 0 },
      { id: uuidv4(), label: 'Pitched', description: 'Yeast added', sort_order: 1 },
      { id: uuidv4(), label: 'Fermentation Started', description: 'Activity observed', sort_order: 2 },
      { id: uuidv4(), label: 'FG Confirmed', description: 'Gravity stable', sort_order: 3 },
      { id: uuidv4(), label: 'Production Complete', description: 'Beer is finished.', sort_order: 4, is_system: true }
    ];
    const tplEntity = { id: templateId, org_id: orgId, name: 'Default', milestones: milestoneDefs, is_default: true, updated_at: now, version: 1 };
    await run(db, 'INSERT INTO milestone_templates (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)', [templateId, orgId, now, now, 1, JSON.stringify(tplEntity)]);
  }

  function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  // Finished batches (production complete — no batch_locations, vessel was cleared; beer went to inventory)
  const finishedBatches = [
    { name: 'House IPA', batchDate: daysAgo(45), volume: 10, destLocationName: 'Taproom (Serving)', destStage: 'serving' },
    { name: 'Pale Ale', batchDate: daysAgo(30), volume: 12, destLocationName: 'Keg Storage', destStage: 'racking_keg' },
    { name: 'Stout', batchDate: daysAgo(25), volume: 8, destLocationName: 'Brewery Cellar', destStage: 'cellar' },
  ];

  // Active batches (still in vessels; have batch_locations)
  const activeBatches = [
    { name: 'IPA Batch 2', vesselName: 'FV-2', batchDate: daysAgo(10), volume: 10, status: 'FERMENTING' },
    { name: 'Lager', vesselName: 'FV-3', batchDate: daysAgo(5), volume: 15, status: 'FERMENTING' },
  ];

  const paleMaltItem = itemIds.find(it => it.name === 'Pale Malt 2-Row');
  const cascadeItem = itemIds.find(it => it.name === 'Cascade Hops');
  const coldRoom = locationByName['Cold Room'];

  // 1. Create finished batches (no batch_locations — they were cleared when production complete was marked)
  const finishedBatchIds = {};
  for (const b of finishedBatches) {
    const batchId = uuidv4();
    const batchEntity = {
      id: batchId,
      name: b.name,
      batch_date: b.batchDate,
      status: 'FERMENTING',
      org_id: orgId,
      created_at: now,
      updated_at: now,
      server_updated_at: now,
      sync_status: 'synced',
      version: 1,
      milestone_definitions: milestoneDefs,
      milestone_template_id: templateId,
      total_theoretical_volume: b.volume,
    };
    await run(db, 'INSERT INTO batches (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)', [batchId, orgId, now, now, 1, JSON.stringify(batchEntity)]);
    finishedBatchIds[b.name] = batchId;
  }

  // 2. Create active batches with batch_locations (beer still in fermenters)
  const batchLocationIdsByBatch = {};
  for (const b of activeBatches) {
    const vesselId = vesselIdsByName[b.vesselName];
    if (!vesselId) continue;

    const batchId = uuidv4();
    const batchEntity = {
      id: batchId,
      name: b.name,
      batch_date: b.batchDate,
      status: b.status,
      org_id: orgId,
      created_at: now,
      updated_at: now,
      server_updated_at: now,
      sync_status: 'synced',
      version: 1,
      milestone_definitions: milestoneDefs,
      milestone_template_id: templateId,
      total_theoretical_volume: b.volume,
    };
    await run(db, 'INSERT INTO batches (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)', [batchId, orgId, now, now, 1, JSON.stringify(batchEntity)]);

    const batchLocId = uuidv4();
    const batchLocEntity = {
      id: batchLocId,
      parent_batch_id: batchId,
      vessel_id: vesselId,
      current_volume: b.volume,
      status: 'Fermenting',
      org_id: orgId,
      created_at: now,
      updated_at: now,
      server_updated_at: now,
      sync_status: 'synced',
      version: 1,
    };
    await run(db, 'INSERT INTO batch_locations (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)', [batchLocId, orgId, now, now, 1, JSON.stringify(batchLocEntity)]);
    batchLocationIdsByBatch[batchId] = batchLocId;
  }

  // 3. Create beer items for finished batches + RECEIVE production_complete (beer flowed to inventory)
  const BEER_CATEGORY_NAME = 'Finished Beer';
  for (const b of finishedBatches) {
    const batchId = finishedBatchIds[b.name];
    const destLoc = locationByName[b.destLocationName];
    if (!batchId || !destLoc) continue;

    const beerItemId = uuidv4();
    const beerItemEntity = { id: beerItemId, name: b.name, category: BEER_CATEGORY_NAME, unit: 'bbl', currency: 'USD', default_unit_cost: 0, org_id: orgId, created_at: now, updated_at: now, server_updated_at: now, sync_status: 'synced', version: 1 };
    await run(db, `INSERT INTO items (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)`, [beerItemId, orgId, now, now, 1, JSON.stringify(beerItemEntity)]);

    const ledgerId = uuidv4();
    const recvEntity = { id: ledgerId, org_id: orgId, type: 'RECEIVE', item_id: beerItemId, location_id: destLoc.id, batch_id: batchId, quantity: b.volume, created_at: now, version: 1, note: `Production complete: ${b.volume} bbl`, data: { source: 'production_complete' } };
    await run(db, `INSERT INTO ledger_entries (id, org_id, item_id, location_id, batch_id, transfer_group_id, reversal_group_id, reversed_of_ledger_id, client_request_id, created_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ledgerId, orgId, beerItemId, destLoc.id, batchId, null, null, null, null, now, now, 1, JSON.stringify(recvEntity)]);
    addOnhand(beerItemId, destLoc.id, b.volume);
  }

  // 4. Batch additions for Pale Ale + CONSUME ledger (ingredients consumed during brew)
  const paleAleBatchId = finishedBatchIds['Pale Ale'];
  if (paleAleBatchId && paleMaltItem && cascadeItem && coldRoom) {
    const addedAt = daysAgo(32);
    const add1 = { id: uuidv4(), batch_id: paleAleBatchId, item_id: paleMaltItem.id, event_type: 'ADDITION', quantity: 50, location_id: coldRoom.id, org_id: orgId, added_at: addedAt, created_at: now, updated_at: now, sync_status: 'synced', version: 1 };
    const add2 = { id: uuidv4(), batch_id: paleAleBatchId, item_id: cascadeItem.id, event_type: 'ADDITION', quantity: 2, location_id: coldRoom.id, org_id: orgId, added_at: addedAt, created_at: now, updated_at: now, sync_status: 'synced', version: 1 };
    await run(db, 'INSERT INTO batch_additions (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)', [add1.id, orgId, now, now, 1, JSON.stringify(add1)]);
    await run(db, 'INSERT INTO batch_additions (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)', [add2.id, orgId, now, now, 1, JSON.stringify(add2)]);

    const consume1 = { id: uuidv4(), org_id: orgId, type: 'CONSUME', item_id: paleMaltItem.id, location_id: coldRoom.id, batch_id: paleAleBatchId, quantity: -50, created_at: addedAt, version: 1, note: 'Batch addition: Pale Malt for Pale Ale' };
    const consume2 = { id: uuidv4(), org_id: orgId, type: 'CONSUME', item_id: cascadeItem.id, location_id: coldRoom.id, batch_id: paleAleBatchId, quantity: -2, created_at: addedAt, version: 1, note: 'Batch addition: Cascade for Pale Ale' };
    await run(db, `INSERT INTO ledger_entries (id, org_id, item_id, location_id, batch_id, transfer_group_id, reversal_group_id, reversed_of_ledger_id, client_request_id, created_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [consume1.id, orgId, paleMaltItem.id, coldRoom.id, paleAleBatchId, null, null, null, null, addedAt, now, 1, JSON.stringify(consume1)]);
    await run(db, `INSERT INTO ledger_entries (id, org_id, item_id, location_id, batch_id, transfer_group_id, reversal_group_id, reversed_of_ledger_id, client_request_id, created_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [consume2.id, orgId, cascadeItem.id, coldRoom.id, paleAleBatchId, null, null, null, null, addedAt, now, 1, JSON.stringify(consume2)]);
    addOnhand(paleMaltItem.id, coldRoom.id, -50);
    addOnhand(cascadeItem.id, coldRoom.id, -2);
  }

  // 5. Recompute onhand_cache (CONSUME + beer RECEIVEs changed it)
  for (const key of Object.keys(onhandByKey)) {
    const [itemId, locationId] = key.split(':');
    const quantity = onhandByKey[key];
    await run(db, `INSERT OR REPLACE INTO onhand_cache (org_id, item_id, location_id, quantity, last_updated) VALUES (?, ?, ?, ?, ?)`, [orgId, itemId, locationId, quantity, now]);
  }

  // 6. Batch readings on an active batch (IPA Batch 2)
  const activeBatchIds = Object.keys(batchLocationIdsByBatch);
  if (activeBatchIds.length > 0) {
    const readingBatchId = activeBatchIds[0];
    const blId = batchLocationIdsByBatch[readingBatchId];
    if (blId) {
      const r1 = { id: uuidv4(), batch_id: readingBatchId, batch_location_id: blId, reading_type: 'GRAVITY', value: 1.048, org_id: orgId, measured_at: now, created_at: now, updated_at: now, sync_status: 'synced', version: 1 };
      const r2 = { id: uuidv4(), batch_id: readingBatchId, batch_location_id: blId, reading_type: 'TEMP', value: 18, org_id: orgId, measured_at: now, created_at: now, updated_at: now, sync_status: 'synced', version: 1 };
      await run(db, 'INSERT INTO batch_readings (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)', [r1.id, orgId, now, now, 1, JSON.stringify(r1)]);
      await run(db, 'INSERT INTO batch_readings (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)', [r2.id, orgId, now, now, 1, JSON.stringify(r2)]);
    }
  }

  const totalBatches = finishedBatches.length + activeBatches.length;
  console.log('Seeded:', itemIds.length + finishedBatches.length, 'items (incl.', finishedBatches.length, 'beer),', locationIds.length, 'locations,', vesselsToCreate.length, 'vessels,', totalBatches, 'batches', `(${finishedBatches.length} finished, ${activeBatches.length} active),`, 'ledger + on-hand.');
}

async function main() {
  const db = connect();
  const now = new Date().toISOString();

  try {
    const { orgId } = await ensureTestAccount(db, now);

    const locCount = await get(db, 'SELECT COUNT(*) as c FROM locations WHERE org_id = ?', [orgId]);
    const hasSeed = (locCount && locCount.c > 0) || false;

    if (FORCE_RESEED) {
      await clearOrgSeedData(db, orgId);
      await seedData(db, orgId, now);
    } else if (!hasSeed) {
      await seedData(db, orgId, now);
    } else {
      console.log('Org already has seed data. Use --force to clear and re-seed.');
    }

    console.log('');
    console.log('Test account ready.');
    console.log('  Email:   ', TEST_EMAIL);
    console.log('  Password:', TEST_PASSWORD);
    console.log('  Log in via the app; sync will pull items, locations, vessels, and inventory.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
