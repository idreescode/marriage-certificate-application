const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { sendReceiptUploadedNotification, sendBankDetailsRequestEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');






// Get Applicant Dashboard Data
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // This is now the USER ID from users table

    // Get application details by user_id (exclude deleted)
    const [applications] = await pool.execute(
      'SELECT * FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)',
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

    // Find application first (exclude deleted)
    const [rows] = await pool.execute(
      'SELECT id, application_number FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = rows[0];
    const applicationId = app.id;
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;

    // Update application with receipt
    // Set payment_choice = true to indicate user chose to pay
    // Payment is optional, so only change status to payment_pending if not already in a later stage
    await pool.execute(
      `UPDATE applications 
       SET payment_receipt_url = ?, 
           payment_status = "paid",
           payment_choice = TRUE,
           status = CASE 
             WHEN status IN ('appointment_scheduled', 'completed') THEN status
             ELSE 'payment_pending'
           END
       WHERE id = ?`,
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

// Skip Payment
const skipPayment = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find application first (exclude deleted)
    const [rows] = await pool.execute(
      'SELECT id, application_number FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const applicationId = rows[0].id;

    // Update application to mark payment as skipped
    // Set payment_choice = false to indicate user chose to skip payment
    // Update status appropriately based on current status
    await pool.execute(
      `UPDATE applications 
       SET payment_status = 'skipped',
           payment_choice = FALSE,
           status = CASE 
             WHEN status = 'payment_pending' THEN 'admin_review'
             WHEN status = 'admin_review' THEN 'admin_review'  -- Keep admin_review, ready for appointment/certificate
             WHEN status IN ('submitted', 'pending_admin_review') THEN 'admin_review'
             ELSE status
           END
       WHERE id = ?`,
      [applicationId]
    );

    res.json({
      success: true,
      message: 'Payment skipped successfully. Your application will proceed.',
    });

  } catch (error) {
    console.error('Error skipping payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip payment',
      error: error.message
    });
  }
};

// Download Certificate
const downloadCertificate = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT certificate_url, status, application_number FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const { certificate_url, status, application_number } = rows[0];

    if (status !== 'completed' || !certificate_url) {
      return res.status(400).json({
        success: false,
        message: 'Certificate not yet available'
      });
    }

    // Construct the full file path
    // certificate_url is stored as /uploads/certificates/cert-{id}-{timestamp}.pdf
    const filePath = path.join(__dirname, '../../', certificate_url);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Certificate file not found'
      });
    }

    // Set headers for file download
    const fileName = `marriage-certificate-${application_number || 'certificate'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Send the file
    res.sendFile(path.resolve(filePath));

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
    // Fetch application by user_id to confirm existence (exclude deleted)
    const [rows] = await pool.execute(
      'SELECT * FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)', 
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });

    await sendBankDetailsRequestEmail(rows[0]);
    res.json({ success: true, message: 'Bank details requested successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to request details' });
  }
};



// Upload Documents
const uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Find application first (exclude deleted)
    const [rows] = await pool.execute(
      'SELECT id FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const applicationId = rows[0].id;

    // Prepare update query dynamically based on uploaded files
    const fileFields = {
      groomId: 'groom_id_path',
      brideId: 'bride_id_path',
      witness1Id: 'witness1_id_path',
      witness2Id: 'witness2_id_path',
      mahrDeclaration: 'mahr_declaration_path',
      civilDivorceDoc: 'civil_divorce_doc_path',
      islamicDivorceDoc: 'islamic_divorce_doc_path',
      groomConversionCert: 'groom_conversion_cert_path',
      brideConversionCert: 'bride_conversion_cert_path',
      statutoryDeclaration: 'statutory_declaration_path'
    };

    let updateFields = [];
    let queryParams = [];

    for (const [fieldName, dbColumn] of Object.entries(fileFields)) {
      if (files[fieldName] && files[fieldName][0]) {
        updateFields.push(`${dbColumn} = ?`);
        // Store relative path
        queryParams.push(`/uploads/documents/${files[fieldName][0].filename}`);
      }
    }

    if (updateFields.length === 0) {
      return res.json({ success: true, message: 'No valid document fields to update' });
    }

    queryParams.push(applicationId);

    const query = `UPDATE applications SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, queryParams);

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      uploadedFiles: Object.keys(files)
    });

  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
};

// Choose to Pay (Set payment_choice = true)
const chooseToPay = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find application first (exclude deleted)
    const [rows] = await pool.execute(
      'SELECT id, application_number FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const applicationId = rows[0].id;

    // Update application to mark that user chose to pay
    // Set payment_choice = true to indicate user chose to pay
    await pool.execute(
      `UPDATE applications 
       SET payment_choice = TRUE
       WHERE id = ?`,
      [applicationId]
    );

    res.json({
      success: true,
      message: 'Payment choice recorded. Please proceed with bank transfer and upload receipt.',
    });

  } catch (error) {
    console.error('Error choosing to pay:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment choice',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  uploadReceipt,
  skipPayment,
  chooseToPay,
  downloadCertificate,
  requestBankDetails,
  uploadDocuments
};
