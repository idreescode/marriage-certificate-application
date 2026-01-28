// Migration: 036_remove_appointment_columns
// Removes appointment-related columns, preferred_date, special_requests columns, and appointment_scheduled status from applications table

module.exports = {
  name: '036_remove_appointment_columns',

  async up(connection) {
    console.log('   Starting migration: 036_remove_appointment_columns');

    try {
      // Check if columns exist before dropping
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications'
        AND COLUMN_NAME IN ('appointment_date', 'appointment_time', 'appointment_location', 'preferred_date', 'special_requests')
      `);
      const columnNames = columns.map(col => col.COLUMN_NAME);

      // Drop appointment_date column if it exists
      if (columnNames.includes('appointment_date')) {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN appointment_date
        `);
        console.log('   ✓ Removed appointment_date column');
      } else {
        console.log('   ! appointment_date column does not exist, skipping');
      }

      // Drop appointment_time column if it exists
      if (columnNames.includes('appointment_time')) {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN appointment_time
        `);
        console.log('   ✓ Removed appointment_time column');
      } else {
        console.log('   ! appointment_time column does not exist, skipping');
      }

      // Drop appointment_location column if it exists
      if (columnNames.includes('appointment_location')) {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN appointment_location
        `);
        console.log('   ✓ Removed appointment_location column');
      } else {
        console.log('   ! appointment_location column does not exist, skipping');
      }

      // Drop preferred_date column if it exists
      if (columnNames.includes('preferred_date')) {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN preferred_date
        `);
        console.log('   ✓ Removed preferred_date column');
      } else {
        console.log('   ! preferred_date column does not exist, skipping');
      }

      // Drop special_requests column if it exists
      if (columnNames.includes('special_requests')) {
        await connection.query(`
          ALTER TABLE applications
          DROP COLUMN special_requests
        `);
        console.log('   ✓ Removed special_requests column');
      } else {
        console.log('   ! special_requests column does not exist, skipping');
      }

      // Remove 'appointment_scheduled' from status ENUM
      // First, update any existing records with appointment_scheduled status to payment_verified
      await connection.query(`
        UPDATE applications
        SET status = 'payment_verified'
        WHERE status = 'appointment_scheduled'
      `);
      console.log('   ✓ Updated existing appointment_scheduled status to payment_verified');

      // Modify the ENUM to remove 'appointment_scheduled'
      // MySQL doesn't support removing ENUM values directly, so we need to recreate the column
      await connection.query(`
        ALTER TABLE applications
        MODIFY COLUMN status ENUM(
          'submitted', 
          'admin_review', 
          'payment_pending', 
          'payment_verified', 
          'completed', 
          'cancelled'
        ) DEFAULT 'submitted'
      `);
      console.log('   ✓ Removed appointment_scheduled from status ENUM');

    } catch (error) {
      console.error('   ✗ Error removing appointment columns:', error.message);
      throw error;
    }

    console.log('   ✓ Migration 036_remove_appointment_columns completed');
  },

  async down(connection) {
    console.log('   Reverting migration: 036_remove_appointment_columns');

    try {
      // Add back appointment columns, preferred_date, and special_requests
      await connection.query(`
        ALTER TABLE applications
        ADD COLUMN appointment_date DATE NULL,
        ADD COLUMN appointment_time TIME NULL,
        ADD COLUMN appointment_location VARCHAR(500) NULL,
        ADD COLUMN preferred_date DATE NULL,
        ADD COLUMN special_requests TEXT NULL
      `);
      console.log('   ✓ Added back appointment columns, preferred_date, and special_requests');

      // Add back 'appointment_scheduled' to status ENUM
      await connection.query(`
        ALTER TABLE applications
        MODIFY COLUMN status ENUM(
          'submitted', 
          'admin_review', 
          'payment_pending', 
          'payment_verified', 
          'appointment_scheduled',
          'completed', 
          'cancelled'
        ) DEFAULT 'submitted'
      `);
      console.log('   ✓ Added back appointment_scheduled to status ENUM');

    } catch (error) {
      console.error('   ✗ Error reverting appointment columns removal:', error.message);
      throw error;
    }
  }
};

