// Migration: 005_seed_admin_user
// Creates the default admin user

const bcrypt = require('bcryptjs');

module.exports = {
  name: '005_seed_admin_user',

  async up(connection) {
    // Check if admin already exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@jamiyat.org']
    );

    if (existing.length > 0) {
      console.log('   ℹ️  Admin user already exists, skipping');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await connection.query(
      'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)',
      ['admin@jamiyat.org', hashedPassword, 'super_admin', 'System Administrator']
    );
    
    console.log('   ✓ Default admin user created');
    console.log('   📧 Email: admin@jamiyat.org');
    console.log('   🔑 Password: Admin@123');
  },

  async down(connection) {
    await connection.query('DELETE FROM users WHERE email = ?', ['admin@jamiyat.org']);
  }
};
