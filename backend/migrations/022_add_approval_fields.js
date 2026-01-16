// Migration: 022_add_approval_fields
// Adds approved_at and approved_by fields to track application approval

module.exports = {
  name: '022_add_approval_fields',

  async up(connection) {
    // Check if columns already exist
    const [existingColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'applications'
      AND COLUMN_NAME IN ('approved_at', 'approved_by')
    `);
    const columnNames = existingColumns.map(col => col.COLUMN_NAME);

    // Add approved_at column if it doesn't exist
    if (!columnNames.includes('approved_at')) {
      await connection.query(`
        ALTER TABLE applications 
        ADD COLUMN approved_at DATETIME NULL
      `);
      console.log('   ✓ Added approved_at column');
    } else {
      console.log('   ! approved_at column already exists, skipping');
    }

    // Add approved_by column if it doesn't exist
    if (!columnNames.includes('approved_by')) {
      await connection.query(`
        ALTER TABLE applications 
        ADD COLUMN approved_by INT NULL,
        ADD CONSTRAINT fk_applications_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
      `);
      console.log('   ✓ Added approved_by column');
    } else {
      console.log('   ! approved_by column already exists, skipping');
    }
  },

  async down(connection) {
    // Remove foreign key constraint first
    try {
      await connection.query(`
        ALTER TABLE applications 
        DROP FOREIGN KEY fk_applications_approved_by
      `);
    } catch (error) {
      // Ignore if constraint doesn't exist
    }

    // Remove columns
    await connection.query(`
      ALTER TABLE applications 
      DROP COLUMN IF EXISTS approved_at,
      DROP COLUMN IF EXISTS approved_by
    `);
    console.log('   ✓ Removed approval fields');
  }
};
