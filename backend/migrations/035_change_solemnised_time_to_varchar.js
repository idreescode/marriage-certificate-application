// Migration: 035_change_solemnised_time_to_varchar
// Changes solemnised_time column from TIME to VARCHAR to store time as string

module.exports = {
  name: '035_change_solemnised_time_to_varchar',

  async up(connection) {
    // Add a temporary column to store the string value
    await connection.query(`
      ALTER TABLE applications
      ADD COLUMN solemnised_time_temp VARCHAR(20) NULL AFTER solemnised_time
    `);
    console.log('   ✓ Added temporary column');

    // Convert existing TIME values to VARCHAR format (HH:MM:SS) in the temp column
    await connection.query(`
      UPDATE applications
      SET solemnised_time_temp = TIME_FORMAT(solemnised_time, '%H:%i:%s')
      WHERE solemnised_time IS NOT NULL
    `);
    console.log('   ✓ Converted existing TIME values to string format');

    // Drop the old TIME column
    await connection.query(`
      ALTER TABLE applications
      DROP COLUMN solemnised_time
    `);
    console.log('   ✓ Dropped old TIME column');

    // Rename the temp column to the original name
    await connection.query(`
      ALTER TABLE applications
      CHANGE COLUMN solemnised_time_temp solemnised_time VARCHAR(20) NULL
    `);
    console.log('   ✓ Renamed temporary column to solemnised_time');
    console.log('   ✓ Changed solemnised_time from TIME to VARCHAR(20)');
  },

  async down(connection) {
    // Add a temporary column to store the TIME value
    await connection.query(`
      ALTER TABLE applications
      ADD COLUMN solemnised_time_temp TIME NULL AFTER solemnised_time
    `);
    console.log('   ✓ Added temporary TIME column');

    // Convert string values back to TIME format
    // This assumes the string is in HH:MM:SS or HH:MM format
    await connection.query(`
      UPDATE applications
      SET solemnised_time_temp = CASE
        WHEN solemnised_time IS NULL THEN NULL
        WHEN solemnised_time REGEXP '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' THEN TIME(solemnised_time)
        ELSE NULL
      END
      WHERE solemnised_time IS NOT NULL
    `);
    console.log('   ✓ Converted string values back to TIME format');

    // Drop the VARCHAR column
    await connection.query(`
      ALTER TABLE applications
      DROP COLUMN solemnised_time
    `);
    console.log('   ✓ Dropped VARCHAR column');

    // Rename the temp column to the original name
    await connection.query(`
      ALTER TABLE applications
      CHANGE COLUMN solemnised_time_temp solemnised_time TIME NULL
    `);
    console.log('   ✓ Changed solemnised_time back to TIME');
  }
};
