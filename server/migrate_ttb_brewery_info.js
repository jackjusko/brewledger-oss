const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Migrating TTB brewery information columns...');

  db.run(`ALTER TABLE orgs ADD COLUMN brewery_ein TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added brewery_ein column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN ttb_brewery_number TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added ttb_brewery_number column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN brewery_address_street TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added brewery_address_street column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN brewery_address_city TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added brewery_address_city column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN brewery_address_county TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added brewery_address_county column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN brewery_address_state TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added brewery_address_state column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN brewery_address_zip TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added brewery_address_zip column');
  });

  db.run(`ALTER TABLE orgs ADD COLUMN brewery_phone TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added brewery_phone column');
  });

});

db.close(() => {
    console.log('TTB brewery info migration complete.');
});
