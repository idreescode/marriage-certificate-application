// Migration: 006_add_reset_token_columns
// Adds reset_token and reset_token_expiry to users and applications

module.exports = {
  name: '006_add_reset_token_columns',

  async up(connection) {
    // Add columns to users table
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
        ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL
      `);
      console.log('   ✓ Added reset_token columns to users');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('   ! reset_token columns already exist in users');
      } else {
        throw e;
      }
    }

    // Add columns to applications table
    try {
      await connection.query(`
        ALTER TABLE applications 
        ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
        ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL
      `);
      console.log('   ✓ Added reset_token columns to applications');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('   ! reset_token columns already exist in applications');
      } else {
        throw e;
      }
    }
  },

  async down(connection) {
    try {
      await connection.query('ALTER TABLE users DROP COLUMN reset_token, DROP COLUMN reset_token_expiry');
      await connection.query('ALTER TABLE applications DROP COLUMN reset_token, DROP COLUMN reset_token_expiry');
    } catch (e) {
      // Ignore drop errors
    }
  }
};
