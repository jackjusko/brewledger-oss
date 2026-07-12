#!/usr/bin/env node
/**
 * Schema smoke test: initialize a temporary SQLite database and exit.
 * Not a full API suite—keeps CI honest until broader server tests exist.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { initDb, connect } = require('../init_db');

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brewledger-smoke-'));
  const dbPath = path.join(tmpDir, 'smoke.sqlite');
  process.env.DB_PATH = dbPath;

  const db = connect(dbPath);
  try {
    await initDb(db);
    const row = await new Promise((resolve, reject) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='orgs'",
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
    if (!row || row.name !== 'orgs') {
      throw new Error('Expected orgs table after initDb');
    }
    console.log('server smoke ok:', dbPath);
  } finally {
    await new Promise((resolve) => db.close(() => resolve()));
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {
      /* best-effort cleanup */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
