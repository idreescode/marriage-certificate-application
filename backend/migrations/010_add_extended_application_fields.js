// Migration: 010_add_extended_application_fields
// Adds new columns to applications table for extended form fields

module.exports = {
  name: '010_add_extended_application_fields',

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

    // Add columns one by one
    await addColumnIfNotExists('ADD COLUMN groom_father_name VARCHAR(255) AFTER groom_full_name', 'groom_father_name');
    await addColumnIfNotExists('ADD COLUMN groom_place_of_birth VARCHAR(255) AFTER groom_date_of_birth', 'groom_place_of_birth');
    await addColumnIfNotExists('ADD COLUMN groom_confirm BOOLEAN DEFAULT FALSE AFTER groom_id_number', 'groom_confirm');
    await addColumnIfNotExists('ADD COLUMN groom_personally BOOLEAN DEFAULT FALSE AFTER groom_confirm', 'groom_personally');
    await addColumnIfNotExists('ADD COLUMN groom_representative BOOLEAN DEFAULT FALSE AFTER groom_personally', 'groom_representative');
    await addColumnIfNotExists('ADD COLUMN groom_rep_name VARCHAR(255) AFTER groom_representative', 'groom_rep_name');
    await addColumnIfNotExists('ADD COLUMN groom_rep_father_name VARCHAR(255) AFTER groom_rep_name', 'groom_rep_father_name');
    await addColumnIfNotExists('ADD COLUMN groom_rep_date_of_birth DATE AFTER groom_rep_father_name', 'groom_rep_date_of_birth');
    await addColumnIfNotExists('ADD COLUMN groom_rep_place_of_birth VARCHAR(255) AFTER groom_rep_date_of_birth', 'groom_rep_place_of_birth');
    await addColumnIfNotExists('ADD COLUMN groom_rep_address TEXT AFTER groom_rep_place_of_birth', 'groom_rep_address');
    
    await addColumnIfNotExists('ADD COLUMN bride_father_name VARCHAR(255) AFTER bride_full_name', 'bride_father_name');
    await addColumnIfNotExists('ADD COLUMN bride_place_of_birth VARCHAR(255) AFTER bride_date_of_birth', 'bride_place_of_birth');
    await addColumnIfNotExists('ADD COLUMN bride_confirm BOOLEAN DEFAULT FALSE AFTER bride_id_number', 'bride_confirm');
    await addColumnIfNotExists('ADD COLUMN bride_personally BOOLEAN DEFAULT FALSE AFTER bride_confirm', 'bride_personally');
    await addColumnIfNotExists('ADD COLUMN bride_representative BOOLEAN DEFAULT FALSE AFTER bride_personally', 'bride_representative');
    await addColumnIfNotExists('ADD COLUMN bride_rep_name VARCHAR(255) AFTER bride_representative', 'bride_rep_name');
    await addColumnIfNotExists('ADD COLUMN bride_rep_father_name VARCHAR(255) AFTER bride_rep_name', 'bride_rep_father_name');
    await addColumnIfNotExists('ADD COLUMN bride_rep_date_of_birth DATE AFTER bride_rep_father_name', 'bride_rep_date_of_birth');
    await addColumnIfNotExists('ADD COLUMN bride_rep_place_of_birth VARCHAR(255) AFTER bride_rep_date_of_birth', 'bride_rep_place_of_birth');
    await addColumnIfNotExists('ADD COLUMN bride_rep_address TEXT AFTER bride_rep_place_of_birth', 'bride_rep_address');
    
    await addColumnIfNotExists('ADD COLUMN mahr_amount VARCHAR(100) AFTER special_requests', 'mahr_amount');
    await addColumnIfNotExists('ADD COLUMN mahr_type ENUM(\'deferred\', \'prompt\') AFTER mahr_amount', 'mahr_type');
    await addColumnIfNotExists('ADD COLUMN solemnised_date DATE AFTER mahr_type', 'solemnised_date');
    await addColumnIfNotExists('ADD COLUMN solemnised_place VARCHAR(255) AFTER solemnised_date', 'solemnised_place');
    await addColumnIfNotExists('ADD COLUMN solemnised_address TEXT AFTER solemnised_place', 'solemnised_address');
    
    console.log('   ✓ Extended application fields migration complete');
  },

  async down(connection) {
    await connection.query(`
      ALTER TABLE applications
      DROP COLUMN groom_father_name,
      DROP COLUMN groom_place_of_birth,
      DROP COLUMN groom_confirm,
      DROP COLUMN groom_personally,
      DROP COLUMN groom_representative,
      DROP COLUMN groom_rep_name,
      DROP COLUMN groom_rep_father_name,
      DROP COLUMN groom_rep_date_of_birth,
      DROP COLUMN groom_rep_place_of_birth,
      DROP COLUMN groom_rep_address,
      DROP COLUMN bride_father_name,
      DROP COLUMN bride_place_of_birth,
      DROP COLUMN bride_confirm,
      DROP COLUMN bride_personally,
      DROP COLUMN bride_representative,
      DROP COLUMN bride_rep_name,
      DROP COLUMN bride_rep_father_name,
      DROP COLUMN bride_rep_date_of_birth,
      DROP COLUMN bride_rep_place_of_birth,
      DROP COLUMN bride_rep_address,
      DROP COLUMN mahr_amount,
      DROP COLUMN mahr_type,
      DROP COLUMN solemnised_date,
      DROP COLUMN solemnised_place,
      DROP COLUMN solemnised_address
    `);
  }
};
