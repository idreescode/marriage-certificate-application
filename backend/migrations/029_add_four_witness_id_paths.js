// Migration: 029_add_four_witness_id_paths
// Adds columns for 4 witness ID paths (witness1_male, witness1_female, witness2_male, witness2_female)
// and removes old witness1_id_path and witness2_id_path columns

module.exports = {
    name: '029_add_four_witness_id_paths',

    async up(connection) {
        try {
            // First, add the new columns
            await connection.query(`
                ALTER TABLE applications
                ADD COLUMN witness1_male_id_path VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness1_female_id_path VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_male_id_path VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_female_id_path VARCHAR(255) DEFAULT NULL
            `);
            console.log('✅ Added new witness ID path columns');

            // Migrate existing data if old columns exist
            try {
                await connection.query(`
                    UPDATE applications
                    SET witness1_male_id_path = witness1_id_path
                    WHERE witness1_id_path IS NOT NULL AND witness1_male_id_path IS NULL
                `);
                await connection.query(`
                    UPDATE applications
                    SET witness2_male_id_path = witness2_id_path
                    WHERE witness2_id_path IS NOT NULL AND witness2_male_id_path IS NULL
                `);
                console.log('✅ Migrated existing witness ID paths');
            } catch (migrateError) {
                console.log('⚠️ Could not migrate existing data (columns may not exist):', migrateError.message);
            }

            // Drop old columns if they exist
            try {
                await connection.query(`
                    ALTER TABLE applications
                    DROP COLUMN witness1_id_path,
                    DROP COLUMN witness2_id_path
                `);
                console.log('✅ Removed old witness ID path columns');
            } catch (dropError) {
                if (dropError.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log('⚠️ Old witness ID path columns do not exist, skipping...');
                } else {
                    throw dropError;
                }
            }
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ New columns already exist, skipping...');
            } else {
                throw error;
            }
        }
    },

    async down(connection) {
        try {
            // Add back old columns
            await connection.query(`
                ALTER TABLE applications
                ADD COLUMN witness1_id_path VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_id_path VARCHAR(255) DEFAULT NULL
            `);
            console.log('✅ Restored old witness ID path columns');

            // Migrate data back
            await connection.query(`
                UPDATE applications
                SET witness1_id_path = witness1_male_id_path
                WHERE witness1_male_id_path IS NOT NULL
            `);
            await connection.query(`
                UPDATE applications
                SET witness2_id_path = witness2_male_id_path
                WHERE witness2_male_id_path IS NOT NULL
            `);
            console.log('✅ Migrated data back to old columns');

            // Drop new columns
            await connection.query(`
                ALTER TABLE applications
                DROP COLUMN witness1_male_id_path,
                DROP COLUMN witness1_female_id_path,
                DROP COLUMN witness2_male_id_path,
                DROP COLUMN witness2_female_id_path
            `);
            console.log('✅ Removed new witness ID path columns');
        } catch (error) {
            console.log('⚠️ Failed to rollback migration:', error.message);
        }
    }
};

