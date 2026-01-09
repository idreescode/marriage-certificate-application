const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { 
  sendDepositAmountEmail, 
  sendPaymentVerifiedEmail, 
  sendAppointmentEmail,
  sendCertificateReadyEmail
} = require('../services/emailService');

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        type: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get All Applications (with filters)
const getAllApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM applications WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (application_number LIKE ? OR groom_full_name LIKE ? OR bride_full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    // params for limit/offset removed because they are now injected
    // params.push(parseInt(limit), parseInt(offset));

    const [applications] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM applications WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (search) {
      countQuery += ' AND (application_number LIKE ? OR groom_full_name LIKE ? OR bride_full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// Get Single Application Details
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [applications] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get witnesses
    const [witnesses] = await pool.execute(
      'SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order',
      [id]
    );

    res.json({
      success: true,
      data: {
        application: applications[0],
        witnesses
      }
    });

  } catch (error) {
    console.error('Error getting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Verify Documents
const verifyDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get application to check if documents exist
    const [appRows] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const app = appRows[0];

    // Check if required documents are uploaded
    if (!app.groom_id_path || !app.bride_id_path) {
      return res.status(400).json({
        success: false,
        message: 'Required documents are not uploaded yet'
      });
    }

    // Update application - mark documents as verified
    await pool.execute(
      `UPDATE applications 
       SET documents_verified = TRUE, 
           documents_verified_by = ?, 
           documents_verified_at = NOW()
       WHERE id = ?`,
      [adminId, id]
    );

    res.json({
      success: true,
      message: 'Documents verified successfully'
    });

  } catch (error) {
    console.error('Error verifying documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify documents',
      error: error.message
    });
  }
};

// Set Deposit Amount
const setDepositAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { depositAmount } = req.body;
    const adminId = req.user.id;

    if (!depositAmount || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deposit amount'
      });
    }

    // Update application
    await pool.execute(
      `UPDATE applications 
       SET deposit_amount = ?, 
           deposit_amount_set_by = ?, 
           deposit_amount_set_at = NOW(),
           payment_status = 'amount_set',
           status = 'payment_pending'
       WHERE id = ?`,
      [depositAmount, adminId, id]
    );

    // Get application data
    const [rows] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    // Send email to applicant
    if (rows.length > 0) {
      await sendDepositAmountEmail(rows[0]);
    }

    res.json({
      success: true,
      message: 'Deposit amount set successfully'
    });

  } catch (error) {
    console.error('Error setting deposit amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set deposit amount',
      error: error.message
    });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Update application
    await pool.execute(
      `UPDATE applications 
       SET payment_status = 'verified',
           payment_verified_by = ?,
           payment_verified_at = NOW(),
           status = 'payment_verified'
       WHERE id = ?`,
      [adminId, id]
    );

    // Get application data
    const [rows] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    // Send email to applicant
    if (rows.length > 0) {
      await sendPaymentVerifiedEmail(rows[0]);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

// Schedule Appointment
const scheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, appointmentLocation } = req.body;

    // Update application
    await pool.execute(
      `UPDATE applications 
       SET appointment_date = ?, 
           appointment_time = ?, 
           appointment_location = ?,
           status = 'appointment_scheduled'
       WHERE id = ?`,
      [appointmentDate, appointmentTime, appointmentLocation, id]
    );

    // Get application data
    const [rows] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    // Send email to applicant
    if (rows.length > 0) {
      await sendAppointmentEmail(rows[0]);
    }

    res.json({
      success: true,
      message: 'Appointment scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment',
      error: error.message
    });
  }
};

// Mark Application Complete
const markComplete = async (req, res) => {
  try {
    const { id } = req.params;

    // Update application
    await pool.execute(
      'UPDATE applications SET status = "completed" WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Application marked as completed'
    });

  } catch (error) {
    console.error('Error marking complete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark application as complete',
      error: error.message
    });
  }
};

// Generate Certificate
const generateCertificate = async (req, res) => {
  const { generateCertificatePDF } = require('../services/certificateService');
  
  try {
    const { id } = req.params;

    // Get application data
    const [appRows] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = appRows[0];

    // Check if appointment was completed
    if (!application.appointment_date) {
      return res.status(400).json({
        success: false,
        message: 'Appointment must be scheduled before generating certificate'
      });
    }

    // Get witnesses
    const [witnesses] = await pool.execute(
      'SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order',
      [id]
    );

    // Generate PDF Certificate
    const certificateUrl = await generateCertificatePDF(application, witnesses);

    // Update application
    await pool.execute(
      `UPDATE applications 
       SET certificate_url = ?, 
           certificate_generated_at = NOW(),
           status = 'completed'
       WHERE id = ?`,
      [certificateUrl, id]
    );

    // Send email to applicant
    const [updatedRows] = await pool.execute(
      `SELECT a.*, u.email 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    if (updatedRows.length > 0) {
      await sendCertificateReadyEmail(updatedRows[0]);
    }

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      data: { certificateUrl }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: error.message
    });
  }
};

module.exports = {
  adminLogin,
  getAllApplications,
  getApplicationById,
  verifyDocuments,
  setDepositAmount,
  verifyPayment,
  scheduleAppointment,
  markComplete,
  generateCertificate
};
