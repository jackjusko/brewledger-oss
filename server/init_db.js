const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function connect(dbPath) {
  const finalPath = dbPath || process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
  return new sqlite3.Database(finalPath);
}

function initDb(db) {
  return new Promise((resolve, reject) => {
    // If no db provided, we create a temporary connection just for init, 
    // but ideally the caller provides the connection they want to initialize.
    const localDb = db || connect();
    const shouldClose = !db;

    localDb.serialize(() => {
      // Auth Tables
      localDb.run(`CREATE TABLE IF NOT EXISTS orgs (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at TEXT,
        created_by_user_id TEXT,
        created_by_user_name TEXT,
        max_locations INTEGER DEFAULT 100,
        subscription_plan TEXT DEFAULT 'subscription',
        trial_ends_at TEXT,
        stripe_customer_id TEXT,
        subscription_status TEXT,
        brewery_ein TEXT,
        ttb_brewery_number TEXT,
        brewery_address_street TEXT,
        brewery_address_city TEXT,
        brewery_address_county TEXT,
        brewery_address_state TEXT,
        brewery_address_zip TEXT,
        brewery_phone TEXT
      )`);

      localDb.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        org_id TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        created_at TEXT,
        name TEXT,
        role TEXT DEFAULT 'user',
        FOREIGN KEY(org_id) REFERENCES orgs(id)
      )`);

      localDb.run(`CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT,
        org_id TEXT,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      localDb.run(`CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Add missing columns to existing tables (idempotent)
      localDb.run(`ALTER TABLE orgs ADD COLUMN created_by_user_id TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN created_by_user_name TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN max_locations INTEGER DEFAULT 100`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE users ADD COLUMN deleted INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN stripe_subscription_id TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      // TTB Brewery Information columns
      localDb.run(`ALTER TABLE orgs ADD COLUMN brewery_ein TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN ttb_brewery_number TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN brewery_address_street TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN brewery_address_city TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN brewery_address_county TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN brewery_address_state TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN brewery_address_zip TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`ALTER TABLE orgs ADD COLUMN brewery_phone TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });

      // Entity Tables (data TEXT = JSON blob: category name/is_system, item name/category/unit, location name/stage, ledger type/quantity/data.source).
      // TTB beer ledger: "Finished Beer" category and item are created per-org at registration (server.js register-org) and for existing orgs by migrate_ttb_beer_category.js.
      const createEntityTable = (tableName) => {
        localDb.run(`CREATE TABLE IF NOT EXISTS ${tableName} (
          id TEXT PRIMARY KEY,
          org_id TEXT,
          updated_at TEXT,
          server_updated_at TEXT,
          version INTEGER,
          data TEXT,
          FOREIGN KEY(org_id) REFERENCES orgs(id)
        )`);
      };

      createEntityTable('items');
      createEntityTable('locations');
      createEntityTable('batches');
      createEntityTable('count_sessions');
      createEntityTable('vessels');
      createEntityTable('categories');
      createEntityTable('batch_additions');
      createEntityTable('batch_readings');
      createEntityTable('packaging_runs');
      createEntityTable('variance_events');
      createEntityTable('par_levels');
      createEntityTable('allocations');
      createEntityTable('recipes');
      createEntityTable('recipe_items');
      createEntityTable('milestone_templates');
      createEntityTable('batch_milestones');
      createEntityTable('batch_locations');
      createEntityTable('batch_volume_adjustments');
      createEntityTable('batch_volume_snapshots');
      createEntityTable('batch_location_transfers');

      // Ledger
      localDb.run(`CREATE TABLE IF NOT EXISTS ledger_entries (
        id TEXT PRIMARY KEY,
        org_id TEXT,
        item_id TEXT,
        location_id TEXT,
        batch_id TEXT,
        transfer_group_id TEXT,
        reversal_group_id TEXT,
        reversed_of_ledger_id TEXT,
        client_request_id TEXT,
        created_at TEXT,
        server_updated_at TEXT,
        version INTEGER,
        data TEXT,
        FOREIGN KEY(org_id) REFERENCES orgs(id)
      )`);

      // Idempotency columns (idempotent ALTERs)
      localDb.run(`ALTER TABLE ledger_entries ADD COLUMN client_request_id TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_client_request ON ledger_entries(client_request_id)`, (err) => {
        if (err && !err.message.includes('already exists')) console.error(err);
      });
      localDb.run(`ALTER TABLE batch_volume_adjustments ADD COLUMN client_request_id TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
      });
      localDb.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_bva_client_request ON batch_volume_adjustments(client_request_id)`, (err) => {
        if (err && !err.message.includes('already exists')) console.error(err);
      });

      // Server-side On-hand Cache (for performance)
      localDb.run(`CREATE TABLE IF NOT EXISTS onhand_cache (
        org_id TEXT,
        item_id TEXT,
        location_id TEXT,
        quantity REAL,
        last_updated TEXT,
        PRIMARY KEY (org_id, item_id, location_id),
        FOREIGN KEY(org_id) REFERENCES orgs(id)
      )`, (err) => {
        if (shouldClose) {
            localDb.close();
        }
        if (err) reject(err);
        else resolve();
      });

      // QuickBooks Online OAuth connections (server-side only, not synced)
      localDb.run(`CREATE TABLE IF NOT EXISTS qbo_connections (
        id TEXT PRIMARY KEY,
        org_id TEXT UNIQUE,
        realm_id TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_type TEXT,
        expires_at TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY(org_id) REFERENCES orgs(id)
      )`);

      // Mapping table between BrewLedger items/accounts and QBO references
      localDb.run(`CREATE TABLE IF NOT EXISTS qbo_mappings (
        id TEXT PRIMARY KEY,
        org_id TEXT,
        brew_item_id TEXT,
        qbo_item_id TEXT,
        qbo_vendor_id TEXT,
        qbo_account_asset_id TEXT,
        qbo_account_cogs_id TEXT,
        qbo_account_income_id TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY(org_id) REFERENCES orgs(id)
      )`);
    });
  });
}

if (require.main === module) {
  initDb().then(() => {
    console.log('Database initialized');
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { initDb, connect };
