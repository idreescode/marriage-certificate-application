// Migration: 027_add_contact_number_to_applications
// Adds contact_number column to applications table

module.exports = {
  name: '027_add_contact_number_to_applications',

  async up(connection) {
    try {
      // Check if column already exists
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications'
        AND COLUMN_NAME = 'contact_number'
      `);

      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE applications
          ADD COLUMN contact_number VARCHAR(50) NULL AFTER user_id
        `);
        console.log('   ✓ contact_number column added to applications');
      } else {
        console.log('   ! contact_number column already exists, skipping');
      }
    } catch (error) {
      console.error('   ✗ Error adding contact_number column:', error.message);
      throw error;
    }
  },

  async down(connection) {
    try {
      await connection.query(`
        ALTER TABLE applications
        DROP COLUMN contact_number
      `);
      console.log('   ✓ contact_number column removed from applications');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes("doesn't exist")) {
        console.log('   ! contact_number column does not exist, skipping');
      } else {
        throw error;
      }
    }
  }
};
