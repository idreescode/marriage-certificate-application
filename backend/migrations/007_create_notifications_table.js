const { pool } = require('../src/config/database');

// Migration: Create Notifications Table
const up = async () => {
  try {
    console.log('Migrating: Creating notifications table...');
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        application_id INT DEFAULT NULL,
        role ENUM('admin', 'applicant') NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Notifications table created successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

up();
