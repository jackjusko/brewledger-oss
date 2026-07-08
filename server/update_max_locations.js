const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Starting max_locations update...');

db.serialize(() => {
  // Update all orgs to have max_locations = 3
  db.run(`UPDATE orgs SET max_locations = 3`, (err) => {
    if (err) {
      console.error('Error updating max_locations:', err.message);
    } else {
      console.log('Successfully updated max_locations to 3 for all organizations');
    }
  });
  
  // Verify the update
  setTimeout(() => {
    db.all('SELECT id, name, max_locations FROM orgs', (err, rows) => {
      if (err) {
        console.error('Error fetching orgs:', err.message);
      } else {
        console.log('\n=== Verification ===');
        rows.forEach(org => {
          console.log(`- ${org.name}: max_locations = ${org.max_locations}`);
        });
      }
      
      db.close();
    });
  }, 1000);
});