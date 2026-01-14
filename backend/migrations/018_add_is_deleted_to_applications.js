module.exports = {
    name: '018_add_is_deleted_to_applications',

    async up(connection) {
        try {
            await connection.query(`
                ALTER TABLE applications
                ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ is_deleted column added to applications table');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Column already exists, skipping...');
            } else {
                throw error;
            }
        }
    },

    async down(connection) {
        try {
            await connection.query(`
                ALTER TABLE applications
                DROP COLUMN is_deleted
            `);
            console.log('✅ is_deleted column removed from applications table');
        } catch (error) {
            console.log('⚠️ Failed to remove column or it does not exist');
        }
    }
};
