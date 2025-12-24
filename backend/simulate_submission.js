const { pool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function simulate() {
  const email = `test_${Date.now()}@example.com`;
  const connection = await pool.getConnection();

  try {
    console.log('Testing Transaction Rollback...');
    await connection.beginTransaction();

    // 1. Insert User
    console.log('Inserting User:', email);
    const [user] = await connection.execute(
      'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, "applicant", ?)',
      [email, 'hashedpass', 'Test User']
    );
    console.log('User ID:', user.insertId);

    // 2. Fail Application intentionally via invalid SQL
    console.log('Attempting Invalid Application Insert...');
    await connection.execute('INSERT INTO applications (invalid_col) VALUES (1)');

    await connection.commit();
  } catch (err) {
    console.log('Error caught! Rolling back...');
    await connection.rollback();
  } finally {
    connection.release();
  }

  // 3. Verify
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    console.log('✅ PASS: User does not exist (Rollback worked)');
  } else {
    console.log('❌ FAIL: User exists (Rollback failed)');
    console.log('Engine check:');
    const [eng] = await pool.query("SHOW TABLE STATUS LIKE 'users'");
    console.log('Engine:', eng[0].Engine);
  }
  process.exit(0);
}

simulate();
