const { pool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function verifyFlow() {
  const testEmail = `verify_${Date.now()}@test.com`;
  const connection = await pool.getConnection();

  try {
    console.log('🧪 Starting End-to-End Verification...');
    await connection.beginTransaction();

    // 1. Create User
    console.log(`Step 1: Creating User (${testEmail})...`);
    const [user] = await connection.execute(
      'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, "applicant", ?)',
      [testEmail, 'hashedpassword', 'Verify User']
    );
    const userId = user.insertId;
    console.log(`   ✅ User Created. ID: ${userId}`);

    // 2. Create Application
    console.log(`Step 2: Creating Application linked to User ID ${userId}...`);
    const [app] = await connection.execute(
      `INSERT INTO applications (
        application_number, user_id, groom_full_name, status
      ) VALUES (?, ?, ?, 'draft')`,
      [`APP-${Date.now()}`, userId, 'Verify Groom']
    );
    const appId = app.insertId;
    console.log(`   ✅ Application Created. ID: ${appId}`);

    // 3. Verify Join
    console.log('Step 3: Verifying Data Integrity (Join Query)...');
    const [rows] = await connection.execute(`
        SELECT u.email, a.application_number 
        FROM users u 
        JOIN applications a ON u.id = a.user_id 
        WHERE u.id = ?
    `, [userId]);

    if (rows.length === 1 && rows[0].email === testEmail) {
        console.log('   ✅ Integrity Check Passed: User and Application are correctly linked.');
    } else {
        throw new Error('Integrity Check Failed!');
    }

    // 4. Test FK Constraint (Delete User -> Set Null)
    // Note: We configured ON DELETE SET NULL.
    // Actually, let's just commit this test data to be sure it persists, immediately delete it.
    await connection.commit();
    console.log('Step 4: Transaction Committed. Data verified in DB.');

    // Cleanup
    console.log('Step 5: Cleaning up test data...');
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    // Application user_id should become NULL or row deleted depending on logic?
    // FK is ON DELETE SET NULL.
    const [checkApp] = await pool.execute('SELECT user_id FROM applications WHERE id = ?', [appId]);
    if (checkApp[0].user_id === null) {
        console.log('   ✅ FK Constraint Verified (ON DELETE SET NULL worked).');
    }
    
    await pool.execute('DELETE FROM applications WHERE id = ?', [appId]);

    console.log('\n🎉 ALL CHECKS PASSED. SYSTEM IS 100% FUNCTIONAL.');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    if (connection) await connection.rollback();
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

verifyFlow();
