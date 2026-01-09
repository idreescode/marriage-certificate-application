// Migration: 011_add_extended_witness_fields
// Adds new columns to witnesses table for extended witness information

module.exports = {
  name: '011_add_extended_witness_fields',

  async up(connection) {
    // Get existing columns
    const [existingColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'witnesses'
    `);
    const columnNames = existingColumns.map(col => col.COLUMN_NAME);

    // Helper function to add column if it doesn't exist
    const addColumnIfNotExists = async (columnDef, columnName) => {
      if (!columnNames.includes(columnName)) {
        try {
          await connection.query(`ALTER TABLE witnesses ${columnDef}`);
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

    await addColumnIfNotExists('ADD COLUMN witness_father_name VARCHAR(255) AFTER witness_name', 'witness_father_name');
    await addColumnIfNotExists('ADD COLUMN witness_date_of_birth DATE AFTER witness_father_name', 'witness_date_of_birth');
    await addColumnIfNotExists('ADD COLUMN witness_place_of_birth VARCHAR(255) AFTER witness_date_of_birth', 'witness_place_of_birth');
    await addColumnIfNotExists('ADD COLUMN witness_address TEXT AFTER witness_place_of_birth', 'witness_address');
    
    console.log('   ✓ Extended witness fields migration complete');
  },

  async down(connection) {
    await connection.query(`
      ALTER TABLE witnesses
      DROP COLUMN witness_father_name,
      DROP COLUMN witness_date_of_birth,
      DROP COLUMN witness_place_of_birth,
      DROP COLUMN witness_address
    `);
  }
};
