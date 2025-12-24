const { pool } = require('./src/config/database');

async function checkFK() {
  try {
    const [rows] = await pool.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'user_id';
    `);
    console.log('Foreign Key Check:', rows);

    const [engine] = await pool.query("SHOW TABLE STATUS LIKE 'applications'");
    console.log('Engine:', engine[0].Engine);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkFK();
