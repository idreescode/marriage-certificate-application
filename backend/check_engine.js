const { pool } = require('./src/config/database');

async function checkEngine() {
  try {
    const [rows] = await pool.query(`
      SELECT TABLE_NAME, ENGINE 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users', 'applications', 'witnesses')
    `);
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkEngine();
