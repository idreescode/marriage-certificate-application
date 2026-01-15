// Migration: 021_remove_email_columns
// Removes groom_email, bride_email from applications table and witness_email from witnesses table

module.exports = {
  name: '021_remove_email_columns',

  async up(connection) {
    try {
      // Drop groom_email column from applications table
      try {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN groom_email
        `);
        console.log('   ✓ groom_email column dropped from applications');
      } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes("doesn't exist")) {
          console.log('   ! groom_email column does not exist, skipping');
        } else {
          throw error;
        }
      }

      // Drop bride_email column from applications table
      try {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN bride_email
        `);
        console.log('   ✓ bride_email column dropped from applications');
      } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes("doesn't exist")) {
          console.log('   ! bride_email column does not exist, skipping');
        } else {
          throw error;
        }
      }

      // Drop witness_email column from witnesses table
      try {
        await connection.query(`
          ALTER TABLE witnesses
          DROP COLUMN witness_email
        `);
        console.log('   ✓ witness_email column dropped from witnesses');
      } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes("doesn't exist")) {
          console.log('   ! witness_email column does not exist, skipping');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('   ✗ Error removing email columns:', error.message);
      throw error;
    }
  },

  async down(connection) {
    // Re-add the columns if rollback is needed
    try {
      await connection.query(`
        ALTER TABLE applications
        ADD COLUMN groom_email VARCHAR(191) NULL
      `);
      console.log('   ✓ groom_email column re-added to applications');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ! groom_email column already exists, skipping');
      } else {
        throw error;
      }
    }

    try {
      await connection.query(`
        ALTER TABLE applications
        ADD COLUMN bride_email VARCHAR(191) NULL
      `);
      console.log('   ✓ bride_email column re-added to applications');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ! bride_email column already exists, skipping');
      } else {
        throw error;
      }
    }

    try {
      await connection.query(`
        ALTER TABLE witnesses
        ADD COLUMN witness_email VARCHAR(191) NULL
      `);
      console.log('   ✓ witness_email column re-added to witnesses');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ! witness_email column already exists, skipping');
      } else {
        throw error;
      }
    }
  }
};
