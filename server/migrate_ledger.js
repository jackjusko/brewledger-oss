const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const columnsToAdd = [
  'transfer_group_id TEXT',
  'reversal_group_id TEXT',
  'reversed_of_ledger_id TEXT'
];

db.serialize(() => {
  console.log('Starting migration...');
  
  columnsToAdd.forEach(colDef => {
    // Extract column name to check existence (simple check, or just try/catch ADD COLUMN)
    // SQLite supports ADD COLUMN. If it exists it will fail, which we can catch.
    const sql = `ALTER TABLE ledger_entries ADD COLUMN ${colDef}`;
    
    db.run(sql, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`Column already exists: ${colDef.split(' ')[0]}`);
        } else {
          console.error(`Error adding column ${colDef}:`, err.message);
        }
      } else {
        console.log(`Added column: ${colDef}`);
      }
    });
  });
});

db.close((err) => {
  if (err) console.error(err);
  else console.log('Migration complete.');
});
