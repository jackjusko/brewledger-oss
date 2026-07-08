const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Migrating all orgs to max_locations = 100...');

db.run('UPDATE orgs SET max_locations = 100', function (err) {
  if (err) {
    console.error('Migration failed:', err.message);
  } else {
    console.log(`Updated ${this.changes} org(s) to max_locations = 100`);
  }
  db.close((closeErr) => {
    if (closeErr) console.error('Error closing database:', closeErr);
    else console.log('Migration complete.');
  });
});
