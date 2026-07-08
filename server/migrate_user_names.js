const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Starting user name and role migration...');

db.serialize(() => {
  // First, let's examine current state
  console.log('\n=== Current Database State ===');
  
  db.all('SELECT COUNT(*) as count FROM orgs', (err, rows) => {
    if (err) console.error('Error counting orgs:', err.message);
    else console.log(`Total organizations: ${rows[0].count}`);
  });
  
  db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
    if (err) console.error('Error counting users:', err.message);
    else console.log(`Total users: ${rows[0].count}`);
  });
  
  // Check for missing columns
  console.log('\n=== Checking for missing columns ===');
  
  // Add created_by_user_id and created_by_user_name to orgs if missing
  db.run(`ALTER TABLE orgs ADD COLUMN created_by_user_id TEXT`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column created_by_user_id already exists in orgs');
      } else {
        console.error('Error adding created_by_user_id to orgs:', err.message);
      }
    } else {
      console.log('Added created_by_user_id column to orgs');
    }
  });
  
  db.run(`ALTER TABLE orgs ADD COLUMN created_by_user_name TEXT`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column created_by_user_name already exists in orgs');
      } else {
        console.error('Error adding created_by_user_name to orgs:', err.message);
      }
    } else {
      console.log('Added created_by_user_name column to orgs');
    }
  });
  
  // Add name and role to users if missing
  db.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column name already exists in users');
      } else {
        console.error('Error adding name to users:', err.message);
      }
    } else {
      console.log('Added name column to users');
    }
  });
  
  db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column role already exists in users');
      } else {
        console.error('Error adding role to users:', err.message);
      }
    } else {
      console.log('Added role column to users');
    }
  });
  
  // Wait a bit for ALTER statements to complete
  setTimeout(() => {
    console.log('\n=== Processing existing data ===');
    
    // 1. First, update organizations without created_by_user_name
    db.all(`SELECT id, name FROM orgs WHERE created_by_user_name IS NULL`, (err, orgs) => {
      if (err) {
        console.error('Error fetching orgs without created_by_user_name:', err.message);
        return;
      }
      
      console.log(`Found ${orgs.length} organizations without created_by_user_name`);
      
      orgs.forEach((org) => {
        // For each org, find the first user (oldest) and set them as admin
        db.get(`SELECT id, email FROM users WHERE org_id = ? ORDER BY created_at ASC LIMIT 1`, [org.id], (err, firstUser) => {
          if (err) {
            console.error(`Error finding first user for org ${org.id}:`, err.message);
            return;
          }
          
          if (firstUser) {
            // Generate placeholder name from email
            const email = firstUser.email;
            const placeholderName = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
            const capitalizedName = placeholderName.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            
            // Update org with created_by_user_id and created_by_user_name
            db.run(`UPDATE orgs SET created_by_user_id = ?, created_by_user_name = ? WHERE id = ?`, 
              [firstUser.id, capitalizedName, org.id], (err) => {
                if (err) {
                  console.error(`Error updating org ${org.id}:`, err.message);
                } else {
                  console.log(`Updated org ${org.name} with created_by_user_id: ${firstUser.id}, created_by_user_name: ${capitalizedName}`);
                }
              });
            
            // Update the user's name and set as admin
            db.run(`UPDATE users SET name = ?, role = 'admin' WHERE id = ?`, 
              [capitalizedName, firstUser.id], (err) => {
                if (err) {
                  console.error(`Error updating user ${firstUser.id}:`, err.message);
                } else {
                  console.log(`Updated user ${firstUser.email} with name: ${capitalizedName}, role: admin`);
                }
              });
          } else {
            console.log(`No users found for org ${org.id}, skipping`);
          }
        });
      });
    });
    
    // 2. Update all other users without names
    db.all(`SELECT id, email, role FROM users WHERE name IS NULL OR name = ''`, (err, users) => {
      if (err) {
        console.error('Error fetching users without names:', err.message);
        return;
      }
      
      console.log(`\nFound ${users.length} users without names`);
      
      users.forEach((user) => {
        // Generate placeholder name from email
        const email = user.email;
        const placeholderName = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
        const capitalizedName = placeholderName.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        // Determine if this user should be admin (single user in org)
        db.get(`SELECT COUNT(*) as userCount FROM users WHERE org_id = (SELECT org_id FROM users WHERE id = ?)`, [user.id], (err, result) => {
          if (err) {
            console.error(`Error counting users for user ${user.id}:`, err.message);
            return;
          }
          
          const userCount = result.userCount;
          const shouldBeAdmin = userCount === 1;
          const newRole = shouldBeAdmin ? 'admin' : (user.role || 'user');
          
          db.run(`UPDATE users SET name = ?, role = ? WHERE id = ?`, 
            [capitalizedName, newRole, user.id], (err) => {
              if (err) {
                console.error(`Error updating user ${user.id}:`, err.message);
              } else {
                console.log(`Updated user ${user.email} with name: ${capitalizedName}, role: ${newRole} ${shouldBeAdmin ? '(single user -> admin)' : ''}`);
              }
            });
        });
      });
    });
    
    // 3. Final verification
    setTimeout(() => {
      console.log('\n=== Final Verification ===');
      
      db.all(`SELECT COUNT(*) as count FROM users WHERE name IS NULL OR name = ''`, (err, rows) => {
        if (err) console.error('Error verifying users:', err.message);
        else console.log(`Users still without names: ${rows[0].count}`);
      });
      
      db.all(`SELECT COUNT(*) as count FROM orgs WHERE created_by_user_name IS NULL`, (err, rows) => {
        if (err) console.error('Error verifying orgs:', err.message);
        else console.log(`Orgs still without created_by_user_name: ${rows[0].count}`);
      });
      
      db.all(`SELECT COUNT(*) as adminCount FROM users WHERE role = 'admin'`, (err, rows) => {
        if (err) console.error('Error counting admins:', err.message);
        else console.log(`Total admin users: ${rows[0].adminCount}`);
      });
      
      setTimeout(() => {
        db.close((err) => {
          if (err) console.error('Error closing database:', err);
          else console.log('\nMigration complete. Database closed.');
        });
      }, 1000);
    }, 2000);
  }, 500);
});