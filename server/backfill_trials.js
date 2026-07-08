const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Backfilling trial data...');
  
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

  db.run(`UPDATE orgs 
          SET trial_ends_at = ?, subscription_status = 'trialing', subscription_plan = 'subscription' 
          WHERE trial_ends_at IS NULL OR subscription_status IS NULL`, [trialEnd], function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Updated ${this.changes} organizations with new trial period.`);
    }
  });
});

db.close(() => {
    console.log('Backfill complete.');
});
