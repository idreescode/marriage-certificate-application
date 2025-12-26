// Migration: 010_add_extended_application_fields
// Adds new columns to applications table for extended form fields

module.exports = {
  name: '010_add_extended_application_fields',

  async up(connection) {
    await connection.query(`
      ALTER TABLE applications
      ADD COLUMN groom_father_name VARCHAR(255) AFTER groom_full_name,
      ADD COLUMN groom_place_of_birth VARCHAR(255) AFTER groom_date_of_birth,
      ADD COLUMN groom_confirm BOOLEAN DEFAULT FALSE AFTER groom_id_number,
      ADD COLUMN groom_personally BOOLEAN DEFAULT FALSE AFTER groom_confirm,
      ADD COLUMN groom_representative BOOLEAN DEFAULT FALSE AFTER groom_personally,
      ADD COLUMN groom_rep_name VARCHAR(255) AFTER groom_representative,
      ADD COLUMN groom_rep_father_name VARCHAR(255) AFTER groom_rep_name,
      ADD COLUMN groom_rep_date_of_birth DATE AFTER groom_rep_father_name,
      ADD COLUMN groom_rep_place_of_birth VARCHAR(255) AFTER groom_rep_date_of_birth,
      ADD COLUMN groom_rep_address TEXT AFTER groom_rep_place_of_birth,
      
      ADD COLUMN bride_father_name VARCHAR(255) AFTER bride_full_name,
      ADD COLUMN bride_place_of_birth VARCHAR(255) AFTER bride_date_of_birth,
      ADD COLUMN bride_confirm BOOLEAN DEFAULT FALSE AFTER bride_id_number,
      ADD COLUMN bride_personally BOOLEAN DEFAULT FALSE AFTER bride_confirm,
      ADD COLUMN bride_representative BOOLEAN DEFAULT FALSE AFTER bride_personally,
      ADD COLUMN bride_rep_name VARCHAR(255) AFTER bride_representative,
      ADD COLUMN bride_rep_father_name VARCHAR(255) AFTER bride_rep_name,
      ADD COLUMN bride_rep_date_of_birth DATE AFTER bride_rep_father_name,
      ADD COLUMN bride_rep_place_of_birth VARCHAR(255) AFTER bride_rep_date_of_birth,
      ADD COLUMN bride_rep_address TEXT AFTER bride_rep_place_of_birth,
      
      ADD COLUMN mahr_amount VARCHAR(100) AFTER special_requests,
      ADD COLUMN mahr_type ENUM('deferred', 'prompt') AFTER mahr_amount,
      ADD COLUMN solemnised_date DATE AFTER mahr_type,
      ADD COLUMN solemnised_place VARCHAR(255) AFTER solemnised_date,
      ADD COLUMN solemnised_address TEXT AFTER solemnised_place
    `);
    console.log('   ✓ Extended application fields added');
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
