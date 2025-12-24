const { pool } = require('../src/config/database');
require('dotenv').config();

async function fixDatabase() {
  console.log('🔧 Starting Database Repair...');

  try {
    // 1. Check and fix 'applications' table
    console.log('Checking applications table...');
    try {
      await pool.query('SELECT reset_token FROM applications LIMIT 1');
      console.log('✅ applications table already has reset_token');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ reset_token missing in applications. Adding columns...');
        await pool.query(`
          ALTER TABLE applications 
          ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
          ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL
        `);
        console.log('✅ fixed applications table');
      } else {
        throw error;
      }
    }

    // 2. Check and fix 'users' table
    console.log('Checking users table...');
    try {
      await pool.query('SELECT reset_token FROM users LIMIT 1');
      console.log('✅ users table already has reset_token');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ reset_token missing in users. Adding columns...');
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
          ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL
        `);
        console.log('✅ fixed users table');
      } else {
        throw error;
      }
    }

    console.log('🎉 Database repair completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Repair failed:', error);
    process.exit(1);
  }
}

fixDatabase();
