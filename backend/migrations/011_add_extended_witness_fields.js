// Migration: 011_add_extended_witness_fields
// Adds new columns to witnesses table for extended witness information

module.exports = {
  name: '011_add_extended_witness_fields',

  async up(connection) {
    await connection.query(`
      ALTER TABLE witnesses
      ADD COLUMN witness_father_name VARCHAR(255) AFTER witness_name,
      ADD COLUMN witness_date_of_birth DATE AFTER witness_father_name,
      ADD COLUMN witness_place_of_birth VARCHAR(255) AFTER witness_date_of_birth,
      ADD COLUMN witness_address TEXT AFTER witness_place_of_birth
    `);
    console.log('   ✓ Extended witness fields added');
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
