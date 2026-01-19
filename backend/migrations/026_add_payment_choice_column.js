// Migration: 026_add_payment_choice_column
// Adds payment_choice column to track user's payment decision (true = wants to pay, false = skip, NULL = not decided)

module.exports = {
  name: '026_add_payment_choice_column',

  async up(connection) {
    await connection.query(`
      ALTER TABLE applications
      ADD COLUMN payment_choice BOOLEAN NULL AFTER payment_status
    `);
    console.log('   ✓ Added payment_choice column to applications table');
  },

  async down(connection) {
    await connection.query(`
      ALTER TABLE applications
      DROP COLUMN payment_choice
    `);
  }
};

