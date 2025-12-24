const { pool } = require('./src/config/database');

async function fixSchema() {
  try {
    console.log('Fixing USERS table schema...');
    
    // Force reset the ENUM
    await pool.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'super_admin', 'applicant') NOT NULL DEFAULT 'applicant'
    `);
    
    console.log('✅ ALTER TABLE Success');

    // Verify
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
    console.log('New Column Definition:', cols[0].Type);

    process.exit(0);
  } catch (err) {
    console.error('❌ Schema Fix Failed:', err);
    process.exit(1);
  }
}

fixSchema();
