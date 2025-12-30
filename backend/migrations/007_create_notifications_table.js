// Migration: 007_create_notifications_table
// Creates the notifications table

module.exports = {
  name: '007_create_notifications_table',

  async up(connection) {
    console.log('   Starting migration: 007_create_notifications_table');

    // Note: MigrationRunner passes a promise-based connection
    await connection.query(`
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
    console.log('   ✓ Notifications table created');
  },

  async down(connection) {
    await connection.query('DROP TABLE IF EXISTS notifications');
  }
};
