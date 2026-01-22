// Migration: 031_remove_unused_columns
// Removes any remaining unused columns that might still exist in database
// This is a safety migration to ensure all unused columns are removed

module.exports = {
    name: '031_remove_unused_columns',

    async up(connection) {
        const columnsToRemove = [
            // Applications table - these should have been removed by migrations 020 and 021
            { table: 'applications', column: 'groom_email' },
            { table: 'applications', column: 'bride_email' },
            { table: 'applications', column: 'groom_phone' },
            { table: 'applications', column: 'bride_phone' },
            // Witnesses table
            { table: 'witnesses', column: 'witness_email' },
            { table: 'witnesses', column: 'witness_phone' },
        ];

        for (const { table, column } of columnsToRemove) {
            try {
                await connection.query(`
                    ALTER TABLE ${table}
                    DROP COLUMN ${column}
                `);
                console.log(`✅ Removed ${column} from ${table}`);
            } catch (error) {
                if (
                    error.code === 'ER_BAD_FIELD_ERROR' ||
                    error.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
                    error.message.includes("doesn't exist") ||
                    error.message.includes("check that column/key exists")
                ) {
                    console.log(`⚠️ ${column} does not exist in ${table}, skipping`);
                } else {
                    console.error(`❌ Error removing ${column} from ${table}:`, error.message);
                    // Don't throw, continue with other columns
                }
            }
        }

        console.log('✅ Unused columns cleanup complete');
    },

    async down(connection) {
        // Re-add columns if rollback is needed (optional, for safety)
        console.log('⚠️ Rollback: Columns were removed. Re-add manually if needed.');
    }
};

