// Migration: 024_create_settings_table
// Create settings table to store admin-configurable settings like admin emails and default deposit amount

module.exports = {
  name: '024_create_settings_table',

  async up(connection) {
    console.log('   Starting migration: 024_create_settings_table');

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description VARCHAR(500),
        updated_by INT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Add foreign key constraint separately if users table exists
    try {
      const [tables] = await connection.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users'
      `);
      
      if (tables.length > 0) {
        // Check if foreign key already exists
        const [fks] = await connection.query(`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'settings' 
          AND COLUMN_NAME = 'updated_by' 
          AND REFERENCED_TABLE_NAME = 'users'
        `);
        
        if (fks.length === 0) {
          await connection.query(`
            ALTER TABLE settings 
            ADD CONSTRAINT fk_settings_updated_by 
            FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
          `);
        }
      }
    } catch (error) {
      // If foreign key creation fails, continue without it
      console.log('   ⚠ Could not add foreign key constraint (non-critical)');
    }
    console.log('   ✓ Created settings table');

    // Insert default settings
    // Get admin emails from environment variable if available
    const adminEmails = process.env.ADMIN_EMAILS || 'admin@jamiyat.org';
    
    await connection.query(`
      INSERT INTO settings (setting_key, setting_value, description) VALUES
      ('admin_emails', ?, 'Comma-separated list of admin email addresses that receive notifications'),
      ('default_deposit_amount', '200', 'Default deposit amount set when approving applications')
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [adminEmails]);
    console.log('   ✓ Inserted default settings');

    console.log('   ✓ Migration 024_create_settings_table completed');
  },

  async down(connection) {
    console.log('   Reverting migration: 024_create_settings_table');
    
    await connection.query(`DROP TABLE IF EXISTS settings`);
    console.log('   ✓ Dropped settings table');
  }
};
