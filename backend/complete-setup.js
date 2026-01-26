// Complete database setup with all extended fields
const { pool } = require('./src/config/database');

async function setupComplete() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Setting up complete database schema...\n');
    
    // Drop existing tables to start fresh
    console.log('Dropping existing tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS witnesses');
    await connection.query('DROP TABLE IF EXISTS applications');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('DROP TABLE IF EXISTS notifications');
    await connection.query('DROP TABLE IF EXISTS email_logs');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Tables dropped\n');
    
    // Create users table
    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'applicant') DEFAULT 'applicant',
        full_name VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created\n');
    
    // Create applications table with ALL fields
    console.log('Creating applications table with extended fields...');
    await connection.query(`
      CREATE TABLE applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        
        groom_full_name VARCHAR(255) NOT NULL,
        groom_father_name VARCHAR(255),
        groom_date_of_birth DATE NOT NULL,
        groom_place_of_birth VARCHAR(255),
        groom_address TEXT NOT NULL,
        groom_id_number VARCHAR(100) NOT NULL,
        groom_confirm BOOLEAN DEFAULT FALSE,
        groom_personally BOOLEAN DEFAULT FALSE,
        groom_representative BOOLEAN DEFAULT FALSE,
        
        groom_rep_name VARCHAR(255),
        groom_rep_father_name VARCHAR(255),
        groom_rep_date_of_birth DATE,
        groom_rep_place_of_birth VARCHAR(255),
        groom_rep_address TEXT,
        
        bride_full_name VARCHAR(255) NOT NULL,
        bride_father_name VARCHAR(255),
        bride_date_of_birth DATE NOT NULL,
        bride_place_of_birth VARCHAR(255),
        bride_address TEXT NOT NULL,
        bride_email VARCHAR(191) NOT NULL,
        bride_id_number VARCHAR(100) NOT NULL,
        bride_confirm BOOLEAN DEFAULT FALSE,
        bride_personally BOOLEAN DEFAULT FALSE,
        bride_representative BOOLEAN DEFAULT FALSE,
        
        bride_rep_name VARCHAR(255),
        bride_rep_father_name VARCHAR(255),
        bride_rep_date_of_birth DATE,
        bride_rep_place_of_birth VARCHAR(255),
        bride_rep_address TEXT,
        
        mahr_amount VARCHAR(100),
        
        solemnised_date DATE,
        solemnised_place VARCHAR(255),
        solemnised_address TEXT,
        
        preferred_date DATE,
        special_requests TEXT,
        
        deposit_amount DECIMAL(10, 2) DEFAULT NULL,
        deposit_amount_set_by INT,
        deposit_amount_set_at DATETIME,
        payment_status ENUM('pending_admin_review', 'amount_set', 'paid', 'verified') DEFAULT 'pending_admin_review',
        payment_receipt_url VARCHAR(255),
        payment_verified_by INT,
        payment_verified_at DATETIME,
        
        appointment_date DATE,
        appointment_time TIME,
        appointment_location VARCHAR(255),
        
        status ENUM('submitted', 'admin_review', 'payment_pending', 'payment_verified', 
                    'appointment_scheduled', 'completed', 'cancelled') DEFAULT 'submitted',
        
        certificate_url VARCHAR(255),
        certificate_generated_at DATETIME,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (deposit_amount_set_by) REFERENCES users(id),
        FOREIGN KEY (payment_verified_by) REFERENCES users(id)
      )
    `);
    console.log('✓ Applications table created\n');
    
    // Create witnesses table with extended fields
    console.log('Creating witnesses table with extended fields...');
    await connection.query(`
      CREATE TABLE witnesses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        witness_name VARCHAR(255) NOT NULL,
        witness_father_name VARCHAR(255),
        witness_date_of_birth DATE,
        witness_place_of_birth VARCHAR(255),
        witness_address TEXT,
        witness_order INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Witnesses table created\n');
    
    // Create notifications table
    console.log('Creating notifications table...');
    await connection.query(`
      CREATE TABLE notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT,
        user_id INT,
        role VARCHAR(50),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Notifications table created\n');
    
    // Create email_logs table
    console.log('Creating email_logs table...');
    await connection.query(`
      CREATE TABLE email_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        recipient_email VARCHAR(191) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT,
        status ENUM('sent', 'failed') NOT NULL,
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Email logs table created\n');
    
    // Create admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)',
      ['admin@marriage-cert.com', adminPassword, 'admin', 'Admin User']
    );
    console.log('✓ Admin user created (admin@marriage-cert.com / admin123)\n');
    
    console.log('✅ Complete database setup finished successfully!');
    console.log('\nDatabase is ready to accept form submissions with all extended fields.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
  } finally {
    connection.release();
    await pool.end();
  }
}

setupComplete();
