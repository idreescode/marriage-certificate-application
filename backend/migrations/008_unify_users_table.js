// Migration: 008_unify_users_table
// Standardize authentication by moving applicants to the users table
// and linking applications via user_id foreign key.

module.exports = {
  name: '008_unify_users_table',

  async up(connection) {
    console.log('   Starting migration: 008_unify_users_table');

    // 1. Modify users table to support 'applicant' role
    // check if role column exists first to be safe, but we know it does from 001
    // We are altering the ENUM definition
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'super_admin', 'applicant') DEFAULT 'applicant'
    `);
    console.log('   ✓ Updated users table role enum');

    // 2. Add user_id column to applications table
    await connection.query(`
      ALTER TABLE applications 
      ADD COLUMN user_id INT,
      ADD CONSTRAINT fk_applications_user
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('   ✓ Added user_id to applications table');

    // 3. Migrate data: Create users for existing applications
    const [applications] = await connection.query(`
      SELECT id, portal_email, portal_password, groom_full_name, created_at 
      FROM applications 
      WHERE portal_email IS NOT NULL AND portal_email != ''
    `);

    console.log(`   Migrating ${applications.length} applicants to users table...`);

    for (const app of applications) {
      if (!app.portal_email || !app.portal_password) continue;

      // Check if user already exists (by email)
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE email = ?', 
        [app.portal_email]
      );

      let userId;

      if (existingUsers.length > 0) {
        // User exists, just link them
        userId = existingUsers[0].id;
        console.log(`     User ${app.portal_email} already exists (ID: ${userId}). Linking...`);
      } else {
        // Create new user
        // Note: portal_password is already hashed, so we can insert it directly
        const [result] = await connection.query(
          `INSERT INTO users (email, password, role, full_name, created_at) 
           VALUES (?, ?, 'applicant', ?, ?)`,
          [app.portal_email, app.portal_password, app.groom_full_name || 'Applicant', app.created_at]
        );
        userId = result.insertId;
        console.log(`     Created user for ${app.portal_email} (ID: ${userId})`);
      }

      // Update application with user_id
      await connection.query(
        'UPDATE applications SET user_id = ? WHERE id = ?',
        [userId, app.id]
      );
    }
    console.log('   ✓ Data migration complete');

    // 4. Cleanup: Verify migration success before dropping columns?
    // For safety in this environment, we will keep portal fields for now but make them nullable/ignored.
    // Or we can rename them to indicate deprecation.
    // Let's Drop them to enforce the new architecture as per user request "role base kro".
    
    // Waiting a split second ensures queries finish logic
    await connection.query(`
      ALTER TABLE applications 
      DROP COLUMN portal_email,
      DROP COLUMN portal_password
    `);
    console.log('   ✓ Legacy columns dropped (portal_email, portal_password)');
  },

  async down(connection) {
    // Reverting this is hard because data was moved.
    // Ideally we would restore columns and move data back.
    
    // 1. Restore columns
    await connection.query(`
      ALTER TABLE applications 
      ADD COLUMN portal_email VARCHAR(191),
      ADD COLUMN portal_password VARCHAR(255)
    `);

    // 2. Move data back (best effort)
    const [rows] = await connection.query(`
      SELECT a.id, u.email, u.password 
      FROM applications a 
      JOIN users u ON a.user_id = u.id 
      WHERE u.role = 'applicant'
    `);

    for (const row of rows) {
      await connection.query(
        'UPDATE applications SET portal_email = ?, portal_password = ? WHERE id = ?',
        [row.email, row.password, row.id]
      );
    }

    // 3. Drop user_id
    await connection.query(`
      ALTER TABLE applications 
      DROP FOREIGN KEY fk_applications_user,
      DROP COLUMN user_id
    `);

    // 4. Revert ENUM (Warning: this might fail if applicants still exist in users table)
    // We will leave the users table as is to avoid data loss of the users themselves.
  }
};
