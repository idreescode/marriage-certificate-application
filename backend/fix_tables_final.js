const { pool } = require('./src/config/database');

async function fixTables() {
  try {
    console.log('Patching Database Structure (Missing user_id)...');

    // 1. Add user_id column if not exists
    try {
        await pool.query(`
            ALTER TABLE applications 
            ADD COLUMN user_id INT NULL,
            ADD INDEX (user_id)
        `);
        console.log('✅ Added user_id column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️  user_id already exists');
        else throw e;
    }

    // 2. Add Foreign Key
    try {
        // Drop if exists first (just in case of bad state)
        // await pool.query('ALTER TABLE applications DROP FOREIGN KEY fk_applications_user').catch(() => {});
        
        await pool.query(`
            ALTER TABLE applications 
            ADD CONSTRAINT fk_applications_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log('✅ FK Constraint Added');
    } catch (e) {
        if (e.code === 'ER_DUP_KEY') console.log('ℹ️  FK already exists');
        else console.error('⚠️  FK Failed:', e.message);
    }
    
    // 3. Drop legacy columns?
    // User complaint was about "create ho rha ha pr application data ni add ho rha".
    // If we drop legacy columns, the code (which now uses user_id) should work fine.
    // Let's drop them to force cleanliness as per Plan.
    try {
        await pool.query('ALTER TABLE applications DROP COLUMN portal_email');
        console.log('✅ Dropped portal_email');
    } catch (e) {}

    try {
        await pool.query('ALTER TABLE applications DROP COLUMN portal_password');
        console.log('✅ Dropped portal_password');
    } catch (e) {}

    process.exit(0);

  } catch (err) {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
  }
}

fixTables();
