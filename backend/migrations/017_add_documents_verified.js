module.exports = {
    name: '017_add_documents_verified',

    async up(connection) {
        try {
            await connection.query(`
        ALTER TABLE applications
        ADD COLUMN documents_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN documents_verified_by INT DEFAULT NULL,
        ADD COLUMN documents_verified_at DATETIME DEFAULT NULL
      `);
            console.log('✅ Documents verification fields added successfully');
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
        DROP COLUMN documents_verified,
        DROP COLUMN documents_verified_by,
        DROP COLUMN documents_verified_at
      `);
            console.log('✅ Documents verification fields removed successfully');
        } catch (error) {
            console.log('⚠️ Failed to remove columns or they do not exist');
        }
    }
};

