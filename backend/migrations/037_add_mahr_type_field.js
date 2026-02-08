// Migration: 037_add_mahr_type_field
// Adds mahr_type column back to applications table to handle Deffered_Prompt field from WordPress

module.exports = {
  name: '037_add_mahr_type_field',

  async up(connection) {
    // Get existing columns
    const [existingColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'applications'
    `);
    const columnNames = existingColumns.map(col => col.COLUMN_NAME);

    // Add mahr_type column if it doesn't exist
    if (!columnNames.includes('mahr_type')) {
      try {
        await connection.query(`
          ALTER TABLE applications 
          ADD COLUMN mahr_type ENUM('deferred', 'prompt') AFTER mahr_amount
        `);
        console.log('   ✓ Added column: mahr_type');
      } catch (err) {
        console.error('   ✗ Error adding mahr_type column:', err.message);
        throw err;
      }
    } else {
      console.log('   ! Column mahr_type already exists, skipping');
    }

    console.log('   ✓ Migration 037 completed: Added mahr_type field');
  },

  async down(connection) {
    // Remove column if migration needs to be rolled back
    try {
      await connection.query(`
        ALTER TABLE applications 
        DROP COLUMN mahr_type
      `);
      console.log('   ✓ Rolled back: Removed mahr_type column');
    } catch (err) {
      console.error('   ✗ Error rolling back mahr_type column:', err.message);
    }
  }
};

