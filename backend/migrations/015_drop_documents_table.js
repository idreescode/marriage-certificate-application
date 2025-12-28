// Migration: 015_drop_documents_table
// Removes the application_documents table and documents_status column

module.exports = {
  name: '015_drop_documents_table',

  async up(connection) {
    console.log('   Starting migration: 015_drop_documents_table');

    // 1. Drop the table
    await connection.query('DROP TABLE IF EXISTS application_documents');
    console.log('   ✓ Dropped application_documents table');

    // 2. Drop the status column from applications
    // Check if column exists first to avoid errors
    try {
      await connection.query('ALTER TABLE applications DROP COLUMN documents_status');
      console.log('   ✓ Dropped documents_status column from applications');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('   ! documents_status column did not exist');
      } else {
        throw error;
      }
    }
  },

  async down(connection) {
    console.log('   Reverting migration: 015_drop_documents_table');
    // We cannot easily restore data, but we can restore the schema
    
    // 1. Restore column
    await connection.query(`
      ALTER TABLE applications 
      ADD COLUMN documents_status ENUM('pending', 'uploaded', 'verified', 'rejected') DEFAULT 'pending'
    `);

    // 2. Restore table
    await connection.query(`
      CREATE TABLE application_documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        mime_type VARCHAR(100),
        size INT,
        status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);
  }
};
