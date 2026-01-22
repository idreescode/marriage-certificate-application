// Migration: 030_add_witness_columns_to_applications
// Adds separate columns for each witness in applications table
// witness1_male, witness1_female, witness2_male, witness2_female

module.exports = {
    name: '030_add_witness_columns_to_applications',

    async up(connection) {
        try {
            // Add columns for Witness No 1 (MALE)
            await connection.query(`
                ALTER TABLE applications
                ADD COLUMN witness1_male_name VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness1_male_father_name VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness1_male_date_of_birth DATE DEFAULT NULL,
                ADD COLUMN witness1_male_place_of_birth VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness1_male_address TEXT DEFAULT NULL
            `);
            console.log('✅ Added Witness No 1 (MALE) columns');

            // Add columns for Witness No 1 (FEMALE)
            await connection.query(`
                ALTER TABLE applications
                ADD COLUMN witness1_female_name VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness1_female_father_name VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness1_female_date_of_birth DATE DEFAULT NULL,
                ADD COLUMN witness1_female_place_of_birth VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness1_female_address TEXT DEFAULT NULL
            `);
            console.log('✅ Added Witness No 1 (FEMALE) columns');

            // Add columns for Witness No 2 (MALE)
            await connection.query(`
                ALTER TABLE applications
                ADD COLUMN witness2_male_name VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_male_father_name VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_male_date_of_birth DATE DEFAULT NULL,
                ADD COLUMN witness2_male_place_of_birth VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_male_address TEXT DEFAULT NULL
            `);
            console.log('✅ Added Witness No 2 (MALE) columns');

            // Add columns for Witness No 2 (FEMALE)
            await connection.query(`
                ALTER TABLE applications
                ADD COLUMN witness2_female_name VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_female_father_name VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_female_date_of_birth DATE DEFAULT NULL,
                ADD COLUMN witness2_female_place_of_birth VARCHAR(255) DEFAULT NULL,
                ADD COLUMN witness2_female_address TEXT DEFAULT NULL
            `);
            console.log('✅ Added Witness No 2 (FEMALE) columns');

            // Migrate existing data from witnesses table to applications table
            try {
                await connection.query(`
                    UPDATE applications a
                    INNER JOIN (
                        SELECT 
                            application_id,
                            MAX(CASE WHEN witness_order = 1 THEN witness_name END) as w1_name,
                            MAX(CASE WHEN witness_order = 1 THEN witness_father_name END) as w1_father,
                            MAX(CASE WHEN witness_order = 1 THEN witness_date_of_birth END) as w1_dob,
                            MAX(CASE WHEN witness_order = 1 THEN witness_place_of_birth END) as w1_pob,
                            MAX(CASE WHEN witness_order = 1 THEN witness_address END) as w1_address,
                            MAX(CASE WHEN witness_order = 2 THEN witness_name END) as w2_name,
                            MAX(CASE WHEN witness_order = 2 THEN witness_father_name END) as w2_father,
                            MAX(CASE WHEN witness_order = 2 THEN witness_date_of_birth END) as w2_dob,
                            MAX(CASE WHEN witness_order = 2 THEN witness_place_of_birth END) as w2_pob,
                            MAX(CASE WHEN witness_order = 2 THEN witness_address END) as w2_address,
                            MAX(CASE WHEN witness_order = 3 THEN witness_name END) as w3_name,
                            MAX(CASE WHEN witness_order = 3 THEN witness_father_name END) as w3_father,
                            MAX(CASE WHEN witness_order = 3 THEN witness_date_of_birth END) as w3_dob,
                            MAX(CASE WHEN witness_order = 3 THEN witness_place_of_birth END) as w3_pob,
                            MAX(CASE WHEN witness_order = 3 THEN witness_address END) as w3_address,
                            MAX(CASE WHEN witness_order = 4 THEN witness_name END) as w4_name,
                            MAX(CASE WHEN witness_order = 4 THEN witness_father_name END) as w4_father,
                            MAX(CASE WHEN witness_order = 4 THEN witness_date_of_birth END) as w4_dob,
                            MAX(CASE WHEN witness_order = 4 THEN witness_place_of_birth END) as w4_pob,
                            MAX(CASE WHEN witness_order = 4 THEN witness_address END) as w4_address
                        FROM witnesses
                        GROUP BY application_id
                    ) w ON a.id = w.application_id
                    SET 
                        a.witness1_male_name = w.w1_name,
                        a.witness1_male_father_name = w.w1_father,
                        a.witness1_male_date_of_birth = w.w1_dob,
                        a.witness1_male_place_of_birth = w.w1_pob,
                        a.witness1_male_address = w.w1_address,
                        a.witness1_female_name = w.w2_name,
                        a.witness1_female_father_name = w.w2_father,
                        a.witness1_female_date_of_birth = w.w2_dob,
                        a.witness1_female_place_of_birth = w.w2_pob,
                        a.witness1_female_address = w.w2_address,
                        a.witness2_male_name = w.w3_name,
                        a.witness2_male_father_name = w.w3_father,
                        a.witness2_male_date_of_birth = w.w3_dob,
                        a.witness2_male_place_of_birth = w.w3_pob,
                        a.witness2_male_address = w.w3_address,
                        a.witness2_female_name = w.w4_name,
                        a.witness2_female_father_name = w.w4_father,
                        a.witness2_female_date_of_birth = w.w4_dob,
                        a.witness2_female_place_of_birth = w.w4_pob,
                        a.witness2_female_address = w.w4_address
                    WHERE w.application_id IS NOT NULL
                `);
                console.log('✅ Migrated existing witness data from witnesses table');
            } catch (migrateError) {
                console.log('⚠️ Could not migrate existing data:', migrateError.message);
            }

        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Columns already exist, skipping...');
            } else {
                throw error;
            }
        }
    },

    async down(connection) {
        try {
            await connection.query(`
                ALTER TABLE applications
                DROP COLUMN witness1_male_name,
                DROP COLUMN witness1_male_father_name,
                DROP COLUMN witness1_male_date_of_birth,
                DROP COLUMN witness1_male_place_of_birth,
                DROP COLUMN witness1_male_address,
                DROP COLUMN witness1_female_name,
                DROP COLUMN witness1_female_father_name,
                DROP COLUMN witness1_female_date_of_birth,
                DROP COLUMN witness1_female_place_of_birth,
                DROP COLUMN witness1_female_address,
                DROP COLUMN witness2_male_name,
                DROP COLUMN witness2_male_father_name,
                DROP COLUMN witness2_male_date_of_birth,
                DROP COLUMN witness2_male_place_of_birth,
                DROP COLUMN witness2_male_address,
                DROP COLUMN witness2_female_name,
                DROP COLUMN witness2_female_father_name,
                DROP COLUMN witness2_female_date_of_birth,
                DROP COLUMN witness2_female_place_of_birth,
                DROP COLUMN witness2_female_address
            `);
            console.log('✅ Removed witness columns from applications table');
        } catch (error) {
            console.log('⚠️ Failed to rollback migration:', error.message);
        }
    }
};

