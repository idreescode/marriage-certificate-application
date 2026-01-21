// Migration: 028_add_total_fee_setting
// Add total_fee setting to the settings table

module.exports = {
  name: '028_add_total_fee_setting',

  async up(connection) {
    console.log('   Starting migration: 028_add_total_fee_setting');

    try {
      // Check if total_fee setting already exists
      const [rows] = await connection.query(
        `SELECT setting_key FROM settings WHERE setting_key = 'total_fee'`
      );

      if (rows.length === 0) {
        // Insert total_fee setting
        await connection.query(`
          INSERT INTO settings (setting_key, setting_value, description) 
          VALUES ('total_fee', '', 'Total fee amount that will be displayed in approval emails')
        `);
        console.log('   ✓ Added total_fee setting to settings table');
      } else {
        console.log('   ! total_fee setting already exists, skipping');
      }
    } catch (error) {
      console.error('   ✗ Error adding total_fee setting:', error.message);
      throw error;
    }

    console.log('   ✓ Migration 028_add_total_fee_setting completed');
  },

  async down(connection) {
    console.log('   Reverting migration: 028_add_total_fee_setting');
    
    try {
      await connection.query(`DELETE FROM settings WHERE setting_key = 'total_fee'`);
      console.log('   ✓ Removed total_fee setting from settings table');
    } catch (error) {
      console.error('   ✗ Error removing total_fee setting:', error.message);
      throw error;
    }
  }
};
