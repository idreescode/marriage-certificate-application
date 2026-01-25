// Migration: 032_split_solemnised_datetime
// Splits solemnised_date DATETIME into separate solemnised_date DATE and solemnised_time TIME columns

module.exports = {
  name: '032_split_solemnised_datetime',

  async up(connection) {
    // First, add the new solemnised_time column
    await connection.query(`
      ALTER TABLE applications
      ADD COLUMN solemnised_time TIME NULL AFTER solemnised_date
    `);
    console.log('   ✓ Added solemnised_time column');

    // Migrate existing data: extract time from DATETIME and update both columns
    await connection.query(`
      UPDATE applications
      SET 
        solemnised_time = TIME(solemnised_date),
        solemnised_date = DATE(solemnised_date)
      WHERE solemnised_date IS NOT NULL
    `);
    console.log('   ✓ Migrated existing datetime data to separate date and time');

    // Change solemnised_date back to DATE type
    await connection.query(`
      ALTER TABLE applications
      MODIFY COLUMN solemnised_date DATE NULL
    `);
    console.log('   ✓ Changed solemnised_date from DATETIME to DATE');
  },

  async down(connection) {
    // Combine date and time back into DATETIME
    await connection.query(`
      UPDATE applications
      SET solemnised_date = CONCAT(DATE(solemnised_date), ' ', TIME(solemnised_time))
      WHERE solemnised_date IS NOT NULL AND solemnised_time IS NOT NULL
    `);

    // Change back to DATETIME
    await connection.query(`
      ALTER TABLE applications
      MODIFY COLUMN solemnised_date DATETIME NULL
    `);

    // Drop the time column
    await connection.query(`
      ALTER TABLE applications
      DROP COLUMN solemnised_time
    `);
  }
};

