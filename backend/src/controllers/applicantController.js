const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const { sendReceiptUploadedNotification, sendBankDetailsRequestEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');






// Get Applicant Dashboard Data
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // This is now the USER ID from users table

    // Get application details by user_id
    const [applications] = await pool.execute(
      'SELECT * FROM applications WHERE user_id = ?',
      [userId]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this account'
      });
    }

    const application = applications[0];

    // Get witnesses
    const [witnesses] = await pool.execute(
      'SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order',
      [application.id]
    );

    res.json({
      success: true,
      data: {
        application: application,
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
    const userId = req.user.id; // User ID

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find application first
    const [rows] = await pool.execute(
      'SELECT id, application_number FROM applications WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = rows[0];
    const applicationId = app.id;
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;

    // Update application with receipt
    await pool.execute(
      'UPDATE applications SET payment_receipt_url = ?, payment_status = "paid", status = "payment_pending" WHERE id = ?',
      [receiptUrl, applicationId]
    );

    // Send notification
    await sendReceiptUploadedNotification(app);

    await createNotification({
      applicationId,
      role: 'admin',
      type: 'receipt_uploaded',
      title: 'Payment Receipt Uploaded',
      message: `Applicant for #${app.application_number} has uploaded a payment receipt.`
    });

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
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT certificate_url, status FROM applications WHERE user_id = ?',
      [userId]
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

// Request Bank Details (Placeholder logic)
const requestBankDetails = async (req, res) => {
    try {
      const userId = req.user.id;
      // Fetch application by user_id to confirm existence
      const [rows] = await pool.execute('SELECT * FROM applications WHERE user_id = ?', [userId]);

      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });
      
      await sendBankDetailsRequestEmail(rows[0]);
      res.json({ success: true, message: 'Bank details requested successfully' });
    } catch (error) {
       console.error(error);
       res.status(500).json({ success: false, message: 'Failed to request details' });
    }
};

module.exports = {
  getDashboard,
  uploadReceipt,
  downloadCertificate,
  requestBankDetails
};
