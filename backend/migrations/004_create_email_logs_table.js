// Migration: 004_create_email_logs_table
// Creates the email_logs table for tracking sent emails

module.exports = {
  name: '004_create_email_logs_table',

  async up(connection) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        email_type VARCHAR(100) NOT NULL,
        recipient VARCHAR(191) NOT NULL,
        subject VARCHAR(191) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('sent', 'failed') DEFAULT 'sent',
        
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✓ Email logs table created');
  },

  async down(connection) {
    await connection.query('DROP TABLE IF EXISTS email_logs');
  }
};
