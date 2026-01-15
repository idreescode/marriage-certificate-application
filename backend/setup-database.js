const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const setupDatabase = async () => {
  let connection;

  try {
    console.log('🔄 Connecting to MySQL server...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to MySQL server');

    // Create database
    console.log(`🔄 Creating database: ${process.env.DB_NAME}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log('✅ Database created/exists');

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Create users table
    console.log('🔄 Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'super_admin') DEFAULT 'admin',
        full_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create applications table
    console.log('🔄 Creating applications table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_number VARCHAR(50) UNIQUE NOT NULL,
        
        groom_full_name VARCHAR(255) NOT NULL,
        groom_date_of_birth DATE NOT NULL,
        groom_address TEXT NOT NULL,
        groom_id_number VARCHAR(100) NOT NULL,
        
        bride_full_name VARCHAR(255) NOT NULL,
        bride_date_of_birth DATE NOT NULL,
        bride_address TEXT NOT NULL,
        bride_id_number VARCHAR(100) NOT NULL,
        
        preferred_date DATE,
        special_requests TEXT,
        
        deposit_amount DECIMAL(10, 2) DEFAULT NULL,
        deposit_amount_set_by INT,
        deposit_amount_set_at DATETIME,
        payment_status ENUM('pending_admin_review', 'amount_set', 'paid', 'verified') DEFAULT 'pending_admin_review',
        payment_receipt_url VARCHAR(500),
        payment_verified_by INT,
        payment_verified_at DATETIME,
        
        appointment_date DATE,
        appointment_time TIME,
        appointment_location VARCHAR(500),
        
        status ENUM('submitted', 'admin_review', 'payment_pending', 'payment_verified', 
                    'appointment_scheduled', 'completed', 'cancelled') DEFAULT 'submitted',
        
        certificate_url VARCHAR(500),
        certificate_generated_at DATETIME,
        
        portal_email VARCHAR(255) UNIQUE,
        portal_password VARCHAR(255),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (deposit_amount_set_by) REFERENCES users(id),
        FOREIGN KEY (payment_verified_by) REFERENCES users(id)
      )
    `);
    console.log('✅ Applications table created');

    // Create witnesses table
    console.log('🔄 Creating witnesses table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS witnesses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        witness_name VARCHAR(255) NOT NULL,
        witness_order TINYINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Witnesses table created');

    // Create email_logs table
    console.log('🔄 Creating email_logs table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        email_type VARCHAR(100) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('sent', 'failed') DEFAULT 'sent',
        
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Email logs table created');

    // Check if admin user exists
    const [adminRows] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@jamiyat.org']);

    if (adminRows.length === 0) {
      console.log('🔄 Creating default admin user...');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await connection.query(
        'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)',
        ['admin@jamiyat.org', hashedPassword, 'super_admin', 'System Administrator']
      );
      console.log('✅ Default admin user created');
      console.log('');
      console.log('📧 Admin Credentials:');
      console.log('   Email: admin@jamiyat.org');
      console.log('   Password: Admin@123');
      console.log('');
      console.log('⚠️  IMPORTANT: Change this password after first login!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('');
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run setup
setupDatabase();
