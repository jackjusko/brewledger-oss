const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Migrating billing columns...');

  db.run(`ALTER TABLE orgs ADD COLUMN subscription_plan TEXT DEFAULT 'subscription'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added subscription_plan column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN trial_ends_at TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added trial_ends_at column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN stripe_customer_id TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added stripe_customer_id column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN subscription_status TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added subscription_status column');
  });

});

db.close(() => {
    console.log('Migration complete.');
});
