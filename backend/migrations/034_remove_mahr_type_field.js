// Migration: 034_remove_mahr_type_field
// Removes mahr_type column from applications table

module.exports = {
  name: '034_remove_mahr_type_field',

  async up(connection) {
    // Get existing columns
    const [existingColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'applications'
    `);
    const columnNames = existingColumns.map(col => col.COLUMN_NAME);

    // Remove mahr_type column if it exists
    if (columnNames.includes('mahr_type')) {
      try {
        await connection.query(`ALTER TABLE applications DROP COLUMN mahr_type`);
        console.log('   ✓ Removed column: mahr_type');
      } catch (err) {
        console.error('   ✗ Error removing mahr_type column:', err.message);
        throw err;
      }
    } else {
      console.log('   ! Column mahr_type does not exist, skipping');
    }

    console.log('   ✓ Migration 034 completed: Removed mahr_type field');
  },

  async down(connection) {
    // Add column back if migration needs to be rolled back
    try {
      await connection.query(`
        ALTER TABLE applications 
        ADD COLUMN mahr_type ENUM('deferred', 'prompt') AFTER mahr_amount
      `);
      console.log('   ✓ Rolled back: Added mahr_type column');
    } catch (err) {
      console.error('   ✗ Error rolling back mahr_type column:', err.message);
    }
  }
};

