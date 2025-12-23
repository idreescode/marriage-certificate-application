// Migration: 002_create_applications_table
// Creates the applications table for marriage certificate applications

module.exports = {
  name: '002_create_applications_table',

  async up(connection) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_number VARCHAR(50) UNIQUE NOT NULL,
        
        groom_full_name VARCHAR(255) NOT NULL,
        groom_date_of_birth DATE NOT NULL,
        groom_address TEXT NOT NULL,
        groom_phone VARCHAR(20) NOT NULL,
        groom_email VARCHAR(191) NOT NULL,
        groom_id_number VARCHAR(100) NOT NULL,
        
        bride_full_name VARCHAR(255) NOT NULL,
        bride_date_of_birth DATE NOT NULL,
        bride_address TEXT NOT NULL,
        bride_phone VARCHAR(20) NOT NULL,
        bride_email VARCHAR(191) NOT NULL,
        bride_id_number VARCHAR(100) NOT NULL,
        
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
        
        portal_email VARCHAR(191) UNIQUE,
        portal_password VARCHAR(255),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (deposit_amount_set_by) REFERENCES users(id),
        FOREIGN KEY (payment_verified_by) REFERENCES users(id)
      )
    `);
    console.log('   ✓ Applications table created');
  },

  async down(connection) {
    await connection.query('DROP TABLE IF EXISTS applications');
  }
};
