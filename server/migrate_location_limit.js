const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Starting location limit migration...');

db.serialize(() => {
  // First, let's examine current state
  console.log('\n=== Current Database State ===');
  
  db.all('SELECT COUNT(*) as count FROM orgs', (err, rows) => {
    if (err) console.error('Error counting orgs:', err.message);
    else console.log(`Total organizations: ${rows[0].count}`);
  });
  
  // Check for missing column max_locations
  console.log('\n=== Adding max_locations column if missing ===');
  
  db.run(`ALTER TABLE orgs ADD COLUMN max_locations INTEGER DEFAULT 10`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column max_locations already exists in orgs');
      } else {
        console.error('Error adding max_locations to orgs:', err.message);
      }
    } else {
      console.log('Added max_locations column to orgs with default value 10');
    }
  });
  
  // Wait a bit for ALTER statement to complete
  setTimeout(() => {
    console.log('\n=== Verifying migration ===');
    
    db.all('SELECT id, name, max_locations FROM orgs', (err, rows) => {
      if (err) {
        console.error('Error fetching orgs:', err.message);
      } else {
        console.log(`Found ${rows.length} organizations:`);
        rows.forEach(org => {
          console.log(`  - ${org.name} (${org.id}): max_locations = ${org.max_locations}`);
        });
      }
    });
    
    setTimeout(() => {
      db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('\nMigration complete. Database closed.');
      });
    }, 1000);
  }, 500);
});