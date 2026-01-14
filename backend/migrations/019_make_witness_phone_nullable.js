// Migration: 019_make_witness_phone_nullable
// Makes witness_phone nullable since it's not collected in the application form

module.exports = {
  name: '019_make_witness_phone_nullable',

  async up(connection) {
    try {
      await connection.query(`
        ALTER TABLE witnesses
        MODIFY COLUMN witness_phone VARCHAR(20) NULL
      `);
      console.log('   ✓ witness_phone made nullable');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate')) {
        console.log('   ! Column already modified, skipping');
      } else {
        throw error;
      }
    }
  },

  async down(connection) {
    await connection.query(`
      ALTER TABLE witnesses
      MODIFY COLUMN witness_phone VARCHAR(20) NOT NULL
    `);
  }
};
