// Migration: 012_make_date_fields_nullable
// Makes date fields and other optional fields nullable in applications table

module.exports = {
  name: '012_make_date_fields_nullable',

  async up(connection) {
    await connection.query(`
      ALTER TABLE applications
      MODIFY COLUMN groom_date_of_birth DATE NULL,
      MODIFY COLUMN groom_phone VARCHAR(20) NULL,
      MODIFY COLUMN groom_email VARCHAR(191) NULL,
      MODIFY COLUMN groom_id_number VARCHAR(100) NULL,
      MODIFY COLUMN groom_rep_date_of_birth DATE NULL,
      
      MODIFY COLUMN bride_date_of_birth DATE NULL,
      MODIFY COLUMN bride_phone VARCHAR(20) NULL,
      MODIFY COLUMN bride_email VARCHAR(191) NULL,
      MODIFY COLUMN bride_id_number VARCHAR(100) NULL,
      MODIFY COLUMN bride_rep_date_of_birth DATE NULL,
      
      MODIFY COLUMN solemnised_date DATE NULL
    `);
    console.log('   ✓ Date and optional fields made nullable');
  },

  async down(connection) {
    await connection.query(`
      ALTER TABLE applications
      MODIFY COLUMN groom_date_of_birth DATE NOT NULL,
      MODIFY COLUMN groom_phone VARCHAR(20) NOT NULL,
      MODIFY COLUMN groom_email VARCHAR(191) NOT NULL,
      MODIFY COLUMN groom_id_number VARCHAR(100) NOT NULL,
      MODIFY COLUMN groom_rep_date_of_birth DATE NOT NULL,
      
      MODIFY COLUMN bride_date_of_birth DATE NOT NULL,
      MODIFY COLUMN bride_phone VARCHAR(20) NOT NULL,
      MODIFY COLUMN bride_email VARCHAR(191) NOT NULL,
      MODIFY COLUMN bride_id_number VARCHAR(100) NOT NULL,
      MODIFY COLUMN bride_rep_date_of_birth DATE NOT NULL,
      
      MODIFY COLUMN solemnised_date DATE NOT NULL
    `);
  }
};
