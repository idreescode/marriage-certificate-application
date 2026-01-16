// Migration: 023_remove_super_admin_role
// Remove 'super_admin' role from database - convert all super_admin users to admin
// and update ENUM to only allow 'admin' and 'applicant'

module.exports = {
  name: '023_remove_super_admin_role',

  async up(connection) {
    console.log('   Starting migration: 023_remove_super_admin_role');

    // 1. Update all users with 'super_admin' role to 'admin'
    const [updateResult] = await connection.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE role = 'super_admin'
    `);
    console.log(`   ✓ Updated ${updateResult.affectedRows} user(s) from super_admin to admin`);

    // 2. Modify ENUM to remove 'super_admin' option
    // First, check current ENUM values
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM users WHERE Field = 'role'
    `);
    
    if (columns.length > 0) {
      const columnDef = columns[0].Type;
      // Update ENUM to only include 'admin' and 'applicant'
      await connection.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('admin', 'applicant') DEFAULT 'applicant'
      `);
      console.log('   ✓ Updated users table role ENUM to remove super_admin');
    }

    console.log('   ✓ Migration 023_remove_super_admin_role completed');
  },

  async down(connection) {
    console.log('   Reverting migration: 023_remove_super_admin_role');
    
    // Add back 'super_admin' to ENUM
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'super_admin', 'applicant') DEFAULT 'applicant'
    `);
    console.log('   ✓ Reverted users table role ENUM');
  }
};
