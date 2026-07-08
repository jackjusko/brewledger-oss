/**
 * Database connection and helpers for SQLite.
 * Used by server.js and route modules via ctx.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Connect to SQLite database
 * @param {string} dbPath - Path to database file
 * @returns {import('sqlite3').Database}
 */
function connect(dbPath) {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Could not connect to database', err);
    }
  });
}

/**
 * Run a SQL statement (INSERT, UPDATE, DELETE)
 * @param {import('sqlite3').Database} db
 * @returns {(sql: string, params?: any[]) => Promise<import('sqlite3').RunResult>}
 */
function createRun(db) {
  return (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };
}

/**
 * Execute a SQL query and return first row
 * @param {import('sqlite3').Database} db
 * @returns {(sql: string, params?: any[]) => Promise<any>}
 */
function createGet(db) {
  return (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

/**
 * Execute a SQL query and return all rows
 * @param {import('sqlite3').Database} db
 * @returns {(sql: string, params?: any[]) => Promise<any[]>}
 */
function createAll(db) {
  return (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };
}

/**
 * Get max_locations for an org (default 100)
 * @param {(sql: string, params?: any[]) => Promise<any>} get
 * @returns {(orgId: string) => Promise<number>}
 */
async function getOrgMaxLocations(get, orgId) {
  const org = await get('SELECT max_locations FROM orgs WHERE id = ?', [orgId]);
  return org != null && org.max_locations != null ? org.max_locations : 100;
}

/**
 * Count active (non-deleted) locations for an org
 * @param {(sql: string, params?: any[]) => Promise<any[]>} all
 * @param {string} orgId
 * @returns {Promise<number>}
 */
async function countActiveLocations(all, orgId) {
  const rows = await all('SELECT data FROM locations WHERE org_id = ?', [orgId]);
  let count = 0;
  for (const row of rows) {
    try {
      const entity = JSON.parse(row.data);
      if (!entity.deleted_at) {
        count++;
      }
    } catch (e) {
      // ignore parse errors
    }
  }
  return count;
}

module.exports = {
  connect,
  createRun,
  createGet,
  createAll,
  getOrgMaxLocations,
  countActiveLocations,
};
