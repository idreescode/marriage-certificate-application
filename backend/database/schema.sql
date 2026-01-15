-- Marriage Certificate Application Database Schema
-- Run this SQL in your MySQL server

CREATE DATABASE IF NOT EXISTS marriage_cert_db;
USE marriage_cert_db;

-- Table: users (Admin users)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'super_admin') DEFAULT 'admin',
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: applications
CREATE TABLE applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  application_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Groom Information
  groom_full_name VARCHAR(255) NOT NULL,
  groom_date_of_birth DATE NOT NULL,
  groom_address TEXT NOT NULL,
  groom_id_number VARCHAR(100) NOT NULL,
  
  -- Bride Information
  bride_full_name VARCHAR(255) NOT NULL,
  bride_date_of_birth DATE NOT NULL,
  bride_address TEXT NOT NULL,
  bride_email VARCHAR(255) NOT NULL,
  bride_id_number VARCHAR(100) NOT NULL,
  
  -- Application Details
  preferred_date DATE,
  special_requests TEXT,
  
  -- Payment Information (Admin Sets Amount)
  deposit_amount DECIMAL(10, 2) DEFAULT NULL,
  deposit_amount_set_by INT,
  deposit_amount_set_at DATETIME,
  payment_status ENUM('pending_admin_review', 'amount_set', 'paid', 'verified') DEFAULT 'pending_admin_review',
  payment_receipt_url VARCHAR(500),
  payment_verified_by INT,
  payment_verified_at DATETIME,
  
  -- Appointment Information
  appointment_date DATE,
  appointment_time TIME,
  appointment_location VARCHAR(500),
  
  -- Status Tracking
  status ENUM('submitted', 'admin_review', 'payment_pending', 'payment_verified', 
              'appointment_scheduled', 'completed', 'cancelled') DEFAULT 'submitted',
  
  -- Certificate
  certificate_url VARCHAR(500),
  certificate_generated_at DATETIME,
  
  -- Portal Access
  portal_email VARCHAR(255) UNIQUE,
  portal_password VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (deposit_amount_set_by) REFERENCES users(id),
  FOREIGN KEY (payment_verified_by) REFERENCES users(id)
);

-- Table: witnesses
CREATE TABLE witnesses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT NOT NULL,
  witness_name VARCHAR(255) NOT NULL,
  witness_order TINYINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Table: email_logs
CREATE TABLE email_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT NOT NULL,
  email_type VARCHAR(100) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent', 'failed') DEFAULT 'sent',
  
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Insert default admin user (password: Admin@123)
-- Password hash for 'Admin@123'
INSERT INTO users (email, password, role, full_name) VALUES
('admin@jamiyat.org', '$2a$10$YourHashedPasswordHere', 'super_admin', 'System Administrator');

-- Note: You'll need to hash the password using bcrypt before inserting
-- Run this in Node.js to generate hash:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('Admin@123', 10);
