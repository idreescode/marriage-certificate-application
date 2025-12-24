const { pool } = require('./src/config/database');

async function checkSchema() {
  try {
    console.log('\n--- USERS TABLE SCHEMA ---');
    const [usersCols] = await pool.query('SHOW COLUMNS FROM users');
    usersCols.forEach(col => console.log(`${col.Field}: ${col.Type}`));

    console.log('\n--- APPLICATIONS TABLE SCHEMA ---');
    const [appCols] = await pool.query('SHOW COLUMNS FROM applications');
    appCols.forEach(col => console.log(`${col.Field}: ${col.Type}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
