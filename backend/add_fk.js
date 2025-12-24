const { pool } = require('./src/config/database');

async function addFK() {
  try {
    console.log('Adding Foreign Key Constraint...');
    
    // Check if user_id exists first (it should)
    // Check if there are orphan records that would violate the FK
    // (i.e. applications with user_id that doesn't exist in users)
    const [orphans] = await pool.query(`
      SELECT a.id, a.user_id 
      FROM applications a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE u.id IS NULL AND a.user_id IS NOT NULL
    `);

    if (orphans.length > 0) {
      console.log(`Found ${orphans.length} orphan applications. Cleaning them up (setting user_id NULL)...`);
      await pool.query(`
        UPDATE applications a 
        LEFT JOIN users u ON a.user_id = u.id 
        SET a.user_id = NULL 
        WHERE u.id IS NULL
      `);
    }

    // Add constraint
    await pool.query(`
      ALTER TABLE applications 
      ADD CONSTRAINT fk_applications_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    console.log('✅ Foreign Key Constraint Added Successfully');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_KEY') { // Or constraint already exists (mysql error specific)
        console.log('Constraint likely already exists (Error: ' + err.code + ')');
    } else {
        console.error('❌ Failed to add FK:', err);
    }
    process.exit(1);
  }
}

addFK();
