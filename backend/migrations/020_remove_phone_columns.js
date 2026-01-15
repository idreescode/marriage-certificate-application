// Migration: 020_remove_phone_columns
// Removes groom_phone, bride_phone from applications table and witness_phone from witnesses table

module.exports = {
  name: '020_remove_phone_columns',

  async up(connection) {
    try {
      // Drop groom_phone column from applications table
      try {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN groom_phone
        `);
        console.log('   ✓ groom_phone column dropped from applications');
      } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes("doesn't exist")) {
          console.log('   ! groom_phone column does not exist, skipping');
        } else {
          throw error;
        }
      }

      // Drop bride_phone column from applications table
      try {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN bride_phone
        `);
        console.log('   ✓ bride_phone column dropped from applications');
      } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes("doesn't exist")) {
          console.log('   ! bride_phone column does not exist, skipping');
        } else {
          throw error;
        }
      }

      // Drop witness_phone column from witnesses table
      try {
        await connection.query(`
          ALTER TABLE witnesses
          DROP COLUMN witness_phone
        `);
        console.log('   ✓ witness_phone column dropped from witnesses');
      } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes("doesn't exist")) {
          console.log('   ! witness_phone column does not exist, skipping');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('   ✗ Error removing phone columns:', error.message);
      throw error;
    }
  },

  async down(connection) {
    // Re-add the columns if rollback is needed
    try {
      await connection.query(`
        ALTER TABLE applications
        ADD COLUMN groom_phone VARCHAR(20) NULL
      `);
      console.log('   ✓ groom_phone column re-added to applications');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ! groom_phone column already exists, skipping');
      } else {
        throw error;
      }
    }

    try {
      await connection.query(`
        ALTER TABLE applications
        ADD COLUMN bride_phone VARCHAR(20) NULL
      `);
      console.log('   ✓ bride_phone column re-added to applications');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ! bride_phone column already exists, skipping');
      } else {
        throw error;
      }
    }

    try {
      await connection.query(`
        ALTER TABLE witnesses
        ADD COLUMN witness_phone VARCHAR(20) NULL
      `);
      console.log('   ✓ witness_phone column re-added to witnesses');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ! witness_phone column already exists, skipping');
      } else {
        throw error;
      }
    }
  }
};
