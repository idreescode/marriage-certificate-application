// Migration: 025_change_solemnised_date_to_datetime
// Changes solemnised_date from DATE to DATETIME to support date with time

module.exports = {
  name: '025_change_solemnised_date_to_datetime',

  async up(connection) {
    await connection.query(`
      ALTER TABLE applications
      MODIFY COLUMN solemnised_date DATETIME NULL
    `);
    console.log('   ✓ Changed solemnised_date from DATE to DATETIME');
  },

  async down(connection) {
    await connection.query(`
      ALTER TABLE applications
      MODIFY COLUMN solemnised_date DATE NULL
    `);
  }
};

