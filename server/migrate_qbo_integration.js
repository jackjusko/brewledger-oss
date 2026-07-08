const { connect } = require('./init_db');
const { v4: uuidv4 } = require('uuid');

/**
 * Migration: create QBO integration tables if they do not exist.
 * This script is idempotent and safe to run multiple times.
 */
async function migrate() {
  const db = connect();

  const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

  try {
    await run(`CREATE TABLE IF NOT EXISTS qbo_connections (
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

    await run(`CREATE TABLE IF NOT EXISTS qbo_mappings (
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

    console.log('QBO integration tables ready.');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed', e);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
