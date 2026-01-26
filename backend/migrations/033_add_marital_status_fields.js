// Migration: 033_add_marital_status_fields
// Adds marital status columns to applications table

module.exports = {
  name: '033_add_marital_status_fields',

  async up(connection) {
    // Get existing columns
    const [existingColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'applications'
    `);
    const columnNames = existingColumns.map(col => col.COLUMN_NAME);

    // Helper function to add column if it doesn't exist
    const addColumnIfNotExists = async (columnDef, columnName) => {
      if (!columnNames.includes(columnName)) {
        try {
          await connection.query(`ALTER TABLE applications ${columnDef}`);
          console.log(`   ✓ Added column: ${columnName}`);
        } catch (err) {
          if (!err.message.includes('Duplicate column')) {
            throw err;
          }
        }
      } else {
        console.log(`   ! Column ${columnName} already exists, skipping`);
      }
    };

    // Add marital status columns
    await addColumnIfNotExists(
      'ADD COLUMN groom_marital_status ENUM("single", "divorced", "widowed") AFTER groom_address',
      'groom_marital_status'
    );
    
    await addColumnIfNotExists(
      'ADD COLUMN bride_marital_status ENUM("single", "divorced", "widowed") AFTER bride_address',
      'bride_marital_status'
    );

    console.log('   ✓ Migration 033 completed: Added marital status fields');
  },

  async down(connection) {
    // Remove columns if migration needs to be rolled back
    try {
      await connection.query(`
        ALTER TABLE applications 
        DROP COLUMN IF EXISTS groom_marital_status,
        DROP COLUMN IF EXISTS bride_marital_status
      `);
      console.log('   ✓ Rolled back marital status columns');
    } catch (err) {
      console.error('   ✗ Error rolling back marital status columns:', err.message);
    }
  }
};

