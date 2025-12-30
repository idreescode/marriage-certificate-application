module.exports = {
    name: '016_add_document_path_columns',

    async up(connection) {
        try {
            await connection.query(`
        ALTER TABLE applications
        ADD COLUMN groom_id_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN bride_id_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN witness1_id_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN witness2_id_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN mahr_declaration_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN civil_divorce_doc_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN islamic_divorce_doc_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN groom_conversion_cert_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN bride_conversion_cert_path VARCHAR(255) DEFAULT NULL,
        ADD COLUMN statutory_declaration_path VARCHAR(255) DEFAULT NULL
      `);
            console.log('✅ Document path columns added successfully');
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
        DROP COLUMN groom_id_path,
        DROP COLUMN bride_id_path,
        DROP COLUMN witness1_id_path,
        DROP COLUMN witness2_id_path,
        DROP COLUMN mahr_declaration_path,
        DROP COLUMN civil_divorce_doc_path,
        DROP COLUMN islamic_divorce_doc_path,
        DROP COLUMN groom_conversion_cert_path,
        DROP COLUMN bride_conversion_cert_path,
        DROP COLUMN statutory_declaration_path
      `);
            console.log('✅ Document path columns removed successfully');
        } catch (error) {
            console.log('⚠️ Failed to remove columns or they do not exist');
        }
    }
};
