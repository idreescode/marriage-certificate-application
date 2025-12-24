const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const { sendReceiptUploadedNotification, sendBankDetailsRequestEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');

// Request Bank Details
const requestBankDetails = async (req, res) => {
  try {
    const applicationId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update status to indicate manual payment request? 
    // Or just send email without changing status yet?
    // User said "mail jay gi admin k pass".
    // I will log it via email.
    
    await sendBankDetailsRequestEmail(rows[0]);

    res.json({
      success: true,
      message: 'Bank details requested successfully'
    });

  } catch (error) {
    console.error('Error requesting bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request bank details',
      error: error.message
    });
  }
};


// Applicant Login
const applicantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT * FROM applications WHERE portal_email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const application = rows[0];
    const isValidPassword = await bcrypt.compare(password, application.portal_password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: application.id, 
        email: application.portal_email, 
        type: 'applicant',
        applicationNumber: application.application_number
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        applicationNumber: application.application_number,
        status: application.status
      }
    });

  } catch (error) {
    console.error('Error in applicant login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get Applicant Dashboard Data
const getDashboard = async (req, res) => {
  try {
    const applicationId = req.user.id;

    // Get application details
    const [applications] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = applications[0];

    // Get witnesses
    const [witnesses] = await pool.execute(
      'SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order',
      [applicationId]
    );

    res.json({
      success: true,
      data: {
        application: {
          ...application,
          portal_password: undefined // Don't send password
        },
        witnesses
      }
    });

  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard',
      error: error.message
    });
  }
};

// Upload Payment Receipt
const uploadReceipt = async (req, res) => {
  try {
    const applicationId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const receiptUrl = `/uploads/receipts/${req.file.filename}`;

    // Update application with receipt
    await pool.execute(
      'UPDATE applications SET payment_receipt_url = ?, payment_status = "paid", status = "payment_pending" WHERE id = ?',
      [receiptUrl, applicationId]
    );

    // Get application data for email
    const [rows] = await pool.execute(
      'SELECT * FROM applications WHERE id = ?',
      [applicationId]
    );

    // Send notification to admin
    if (rows.length > 0) {
      const app = rows[0];
      await sendReceiptUploadedNotification(app);

      // Notify Admin
      await createNotification({
        applicationId,
        role: 'admin',
        type: 'receipt_uploaded',
        title: 'Payment Receipt Uploaded',
        message: `Applicant for #${app.application_number} has uploaded a payment receipt.`
      });
    }

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: { receiptUrl }
    });

  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload receipt',
      error: error.message
    });
  }
};

// Download Certificate
const downloadCertificate = async (req, res) => {
  try {
    const applicationId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT certificate_url, status FROM applications WHERE id = ?',
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const { certificate_url, status } = rows[0];

    if (status !== 'completed' || !certificate_url) {
      return res.status(400).json({
        success: false,
        message: 'Certificate not yet available'
      });
    }

    res.json({
      success: true,
      data: {
        certificateUrl: certificate_url
      }
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download certificate',
      error: error.message
    });
  }
};

module.exports = {
  applicantLogin,
  getDashboard,
  uploadReceipt,
  downloadCertificate,
  requestBankDetails
};
