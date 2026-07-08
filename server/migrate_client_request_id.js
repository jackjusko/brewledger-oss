const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Starting client_request_id migration...');

  const alters = [
    `ALTER TABLE ledger_entries ADD COLUMN client_request_id TEXT`,
    `ALTER TABLE batch_volume_adjustments ADD COLUMN client_request_id TEXT`
  ];

  alters.forEach((sql) => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Error running "${sql}":`, err.message);
      } else if (!err) {
        console.log(`Executed: ${sql}`);
      }
    });
  });

  const indexes = [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_client_request ON ledger_entries(client_request_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_bva_client_request ON batch_volume_adjustments(client_request_id)`
  ];

  indexes.forEach((sql) => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error(`Error running "${sql}":`, err.message);
      } else if (!err) {
        console.log(`Executed: ${sql}`);
      }
    });
  });
});

db.close((err) => {
  if (err) console.error(err);
  else console.log('Migration complete.');
});
