const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const recoverLatestUser = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Get latest application
    const [rows] = await connection.query('SELECT id, groom_full_name, portal_email FROM applications ORDER BY id DESC LIMIT 1');
    
    if (rows.length === 0) {
      console.log('❌ No applications found in database.');
      return;
    }

    const user = rows[0];
    const newPassword = 'User@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.query('UPDATE applications SET portal_password = ? WHERE id = ?', [hashedPassword, user.id]);

    console.log('✅ Latest Applicant Recovery Successful');
    console.log('----------------------------------------');
    console.log(`👤 Name:     ${user.groom_full_name}`);
    console.log(`📧 Email:    ${user.portal_email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log('----------------------------------------');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
};

recoverLatestUser();
