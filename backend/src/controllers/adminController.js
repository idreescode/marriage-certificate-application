const { pool } = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  generatePassword,
  generateApplicationNumber,
  generateSequentialRegistrationNumber,
  normalizeDate,
  normalizeTime,
} = require("../utils/helpers");
const {
  sendDepositAmountEmail,
  sendPaymentVerifiedEmail,
  sendAppointmentEmail,
  sendCertificateReadyEmail,
  sendApplicationConfirmation,
  sendApplicationApprovedEmail,
  sendAdminCredentialsEmail,
  sendUserUpdatedEmail,
} = require("../services/emailService");

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email.toLowerCase(),
    ]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Get All Applications (with filters)
const getAllApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Join with users table to get portal_email from users.email
    let query =
      `SELECT a.*, u.email as portal_email
       FROM applications a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE (a.is_deleted = FALSE OR a.is_deleted IS NULL)`;
    const params = [];

    if (status) {
      query += " AND a.status = ?";
      params.push(status);
    }

    if (search) {
      query +=
        " AND (a.application_number LIKE ? OR a.groom_full_name LIKE ? OR a.bride_full_name LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ${parseInt(
      limit
    )} OFFSET ${parseInt(offset)}`;
    // params for limit/offset removed because they are now injected
    // params.push(parseInt(limit), parseInt(offset));

    const [applications] = await pool.execute(query, params);

    // Get total count
    let countQuery =
      "SELECT COUNT(*) as total FROM applications WHERE is_deleted = FALSE OR is_deleted IS NULL";
    const countParams = [];

    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }

    if (search) {
      countQuery +=
        " AND (application_number LIKE ? OR groom_full_name LIKE ? OR bride_full_name LIKE ?)";
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
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

// Get Single Application Details
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Join with users table to get portal_email from users.email
    const [applications] = await pool.execute(
      `SELECT a.*, u.email as portal_email
       FROM applications a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = ? AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)`,
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Get witnesses
    const [witnesses] = await pool.execute(
      "SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order",
      [id]
    );

    res.json({
      success: true,
      data: {
        application: applications[0],
        witnesses,
      },
    });
  } catch (error) {
    console.error("Error getting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message,
    });
  }
};

// Get Settings
const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_key, setting_value, description, updated_at FROM settings"
    );

    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = {
        value: row.setting_value,
        description: row.description,
        updated_at: row.updated_at,
      };
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get settings",
      error: error.message,
    });
  }
};

// Update Settings
const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const adminId = req.user.id;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid settings data",
      });
    }

    // Validate and update each setting
    for (const [key, value] of Object.entries(settings)) {
      // Validate admin_emails
      if (key === "admin_emails") {
        const emails = value.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
        if (emails.length === 0) {
          return res.status(400).json({
            success: false,
            message: "At least one admin email is required",
          });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const email of emails) {
          if (!emailRegex.test(email)) {
            return res.status(400).json({
              success: false,
              message: `Invalid email format: ${email}`,
            });
          }
        }
      }

      // Validate default_deposit_amount
      if (key === "default_deposit_amount") {
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
          return res.status(400).json({
            success: false,
            message: "Default deposit amount must be a positive number",
          });
        }
      }

      // Validate total_fee
      if (key === "total_fee") {
        if (value && value.trim() !== "") {
          const totalFee = parseFloat(value);
          if (isNaN(totalFee) || totalFee <= 0) {
            return res.status(400).json({
              success: false,
              message: "Total fee must be a positive number",
            });
          }
        }
      }

      // Update or insert setting
      await pool.execute(
        `INSERT INTO settings (setting_key, setting_value, updated_by) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value),
         updated_by = VALUES(updated_by),
         updated_at = NOW()`,
        [key, String(value), adminId]
      );
    }

    res.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

// Helper function to get setting value from database
const getSettingValue = async (key, defaultValue = null) => {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM settings WHERE setting_key = ?",
      [key]
    );
    return rows.length > 0 ? rows[0].setting_value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

// Approve Application
const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    
    // Get default deposit amount from settings, fallback to 200
    const defaultDepositStr = await getSettingValue("default_deposit_amount", "200");
    const DEFAULT_DEPOSIT_AMOUNT = parseFloat(defaultDepositStr) || 200;

    // Get total fee from settings
    const totalFeeStr = await getSettingValue("total_fee", "");
    const TOTAL_FEE = totalFeeStr ? parseFloat(totalFeeStr) : null;

    // Get application data
    const [appRows] = await pool.execute(
      `SELECT a.*, u.email as portal_email 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ? AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)`,
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const app = appRows[0];

    // Check if application is already approved or beyond
    if (app.status !== "admin_review") {
      return res.status(400).json({
        success: false,
        message:
          "Application is not in review status or has already been processed",
      });
    }

    // Generate a new password for the user
    const portalPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(portalPassword, 10);

    // Update user password
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      app.user_id,
    ]);

    // Mark application as approved and payment pending
    // - Set deposit amount when application is approved
    // - Set payment_status to 'amount_set' (awaiting payment)
    // - Set status to 'payment_pending' so applicant must pay before proceeding
    await pool.execute(
      `UPDATE applications 
       SET approved_at = NOW(),
           approved_by = ?,
           deposit_amount = ?,
           deposit_amount_set_by = ?,
           deposit_amount_set_at = NOW(),
           payment_status = 'amount_set',
           status = 'payment_pending'
       WHERE id = ?`,
      [adminId, DEFAULT_DEPOSIT_AMOUNT, adminId, id]
    );

    // Send approval email with password
    const applicationData = {
      id: app.id,
      application_number: app.application_number,
      groom_full_name: app.groom_full_name,
      bride_full_name: app.bride_full_name,
      portal_email: app.portal_email,
      portalPassword: portalPassword,
      total_fee: TOTAL_FEE,
      default_deposit_amount: DEFAULT_DEPOSIT_AMOUNT,
    };

    await sendApplicationApprovedEmail(applicationData);

    res.json({
      success: true,
      message:
        "Application approved successfully. Deposit amount set and payment is now pending. Portal credentials sent to applicant.",
    });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve application",
      error: error.message,
    });
  }
};

// Verify Documents (Deprecated - Documents are no longer required, but kept for backward compatibility)
// This function now just allows progression without requiring documents
const verifyDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get application (exclude deleted)
    const [appRows] = await pool.execute(
      "SELECT * FROM applications WHERE id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)",
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const app = appRows[0];

    // Check if deposit amount has been set (should be set when application is approved)
    if (!app.deposit_amount || app.deposit_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount must be set before proceeding. Please approve the application first.",
      });
    }

    // Update application - mark as ready for appointment scheduling (skip payment_pending)
    // Documents are no longer required, so we can proceed directly
    await pool.execute(
      `UPDATE applications 
       SET documents_verified = TRUE, 
           documents_verified_by = ?, 
           documents_verified_at = NOW(),
           payment_status = 'amount_set',
           status = 'admin_review'
       WHERE id = ?`,
      [adminId, id]
    );

    // Get application data with user email for sending deposit amount email
    const [rows] = await pool.execute(
      `SELECT a.*, u.email as portal_email 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    // Send email to applicant with deposit amount (non-blocking - don't wait for it)
    if (rows.length > 0) {
      sendDepositAmountEmail(rows[0]).catch((error) => {
        console.error(
          "Error sending deposit amount email (non-blocking):",
          error
        );
        // Email failure doesn't affect the verification success
      });
    }

    res.json({
      success: true,
      message: "Application ready for appointment scheduling. Deposit amount email sent to applicant.",
    });
  } catch (error) {
    console.error("Error processing application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process application",
      error: error.message,
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
        message: "Invalid deposit amount",
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

    // Get application data with user email
    const [rows] = await pool.execute(
      `SELECT a.*, u.email as portal_email 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    // Send email to applicant
    if (rows.length > 0) {
      await sendDepositAmountEmail(rows[0]);
    }

    res.json({
      success: true,
      message: "Deposit amount set successfully",
    });
  } catch (error) {
    console.error("Error setting deposit amount:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set deposit amount",
      error: error.message,
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

    // Get application data with user email
    const [rows] = await pool.execute(
      `SELECT a.*, u.email as portal_email 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    // Send email to applicant
    if (rows.length > 0) {
      await sendPaymentVerifiedEmail(rows[0]);
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// Schedule Appointment
const scheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, appointmentLocation } = req.body;

    // Get application to check status and payment status
    const [appRows] = await pool.execute(
      "SELECT status, payment_status FROM applications WHERE id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)",
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const app = appRows[0];

    // Require payment to be verified before scheduling appointment
    if (app.payment_status !== "verified" || app.status !== "payment_verified") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot schedule appointment until payment has been verified.",
      });
    }

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

    // Get application data with user email
    const [rows] = await pool.execute(
      `SELECT a.*, u.email as portal_email 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    // Send email to applicant
    if (rows.length > 0) {
      await sendAppointmentEmail(rows[0]);
    }

    res.json({
      success: true,
      message: "Appointment scheduled successfully",
    });
  } catch (error) {
    console.error("Error scheduling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule appointment",
      error: error.message,
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
      message: "Application marked as completed",
    });
  } catch (error) {
    console.error("Error marking complete:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark application as complete",
      error: error.message,
    });
  }
};

// Generate Certificate
// Certificate generation is enabled only when admin prints the application
const generateCertificate = async (req, res) => {
  const { generateCertificatePDF } = require("../services/certificateService");

  try {
    const { id } = req.params;
    // Check if email notification should be sent (default: false for print)
    // When printing, notify=false is passed to skip sending email to applicant
    const shouldNotify = req.query.notify === "true";

    // Get application data (exclude deleted)
    const [appRows] = await pool.execute(
      "SELECT * FROM applications WHERE id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)",
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const application = appRows[0];

    // Delete old certificate file if it exists
    if (application.certificate_url) {
      try {
        const fs = require("fs");
        const path = require("path");
        // Convert relative path to absolute path
        const oldCertificatePath = path.join(
          __dirname,
          "../../",
          application.certificate_url
        );

        if (fs.existsSync(oldCertificatePath)) {
          fs.unlinkSync(oldCertificatePath);
          console.log(`✅ Deleted old certificate: ${oldCertificatePath}`);
        }
      } catch (deleteError) {
        // Log error but don't fail the certificate generation
        console.error(
          "⚠️ Error deleting old certificate:",
          deleteError.message
        );
      }
    }

    // Get witnesses
    const [witnesses] = await pool.execute(
      "SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order",
      [id]
    );

    // Generate PDF Certificate
    const certificateUrl = await generateCertificatePDF(application, witnesses);

    // Update application with certificate URL (don't automatically change status)
    await pool.execute(
      `UPDATE applications 
       SET certificate_url = ?, 
           certificate_generated_at = NOW()
       WHERE id = ?`,
      [certificateUrl, id]
    );

    // Send email to applicant only if notify is true (default behavior)
    if (shouldNotify) {
      const [updatedRows] = await pool.execute(
        `SELECT a.*, u.email as portal_email 
         FROM applications a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.id = ?`,
        [id]
      );

      if (updatedRows.length > 0) {
        await sendCertificateReadyEmail(updatedRows[0]);
      }
    }

    res.json({
      success: true,
      message: shouldNotify
        ? "Certificate generated successfully"
        : "Certificate generated successfully (no notification sent)",
      data: { certificateUrl },
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to generate certificate",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Update Application Number
const updateApplicationNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { applicationNumber } = req.body;

    if (!applicationNumber || !applicationNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Application number is required",
      });
    }

    const trimmedNumber = applicationNumber.trim();

    // Validate length
    if (trimmedNumber.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Application number must be 50 characters or less",
      });
    }

    // Check if application exists
    const [appRows] = await pool.execute(
      "SELECT * FROM applications WHERE id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)",
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if the new application number already exists (excluding current application)
    const [existingApp] = await pool.execute(
      "SELECT id FROM applications WHERE application_number = ? AND id != ?",
      [trimmedNumber, id]
    );

    if (existingApp.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This application number already exists. Please use a different number.",
      });
    }

    // Update application number
    await pool.execute(
      "UPDATE applications SET application_number = ? WHERE id = ?",
      [trimmedNumber, id]
    );

    res.json({
      success: true,
      message: "Application number updated successfully",
      data: {
        applicationNumber: trimmedNumber,
      },
    });
  } catch (error) {
    console.error("Error updating application number:", error);

    // Handle MySQL Duplicate Entry Error
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "This application number already exists. Please use a different number.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update application number",
      error: error.message,
    });
  }
};

// Delete Application (Soft Delete)
// IMPORTANT: This function performs a SOFT DELETE only.
// Records remain in the database permanently for audit purposes.
// Only the is_deleted flag is set to TRUE, which:
// - Hides the application from all queries
// - Prevents applicant login
// - Preserves all data (application, witnesses, notifications) in the database
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Get application data first to check if it exists
    const [appRows] = await pool.execute(
      "SELECT * FROM applications WHERE id = ?",
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const application = appRows[0];

    // Check if already deleted
    if (application.is_deleted) {
      return res.status(400).json({
        success: false,
        message: "Application is already deleted",
      });
    }

    // SOFT DELETE: Only set is_deleted flag to TRUE
    // All records (application, witnesses, notifications) remain in database
    // Files are also preserved for audit purposes
    await pool.execute(
      "UPDATE applications SET is_deleted = TRUE WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message:
        "Application deleted successfully (soft delete - record preserved in database)",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: error.message,
    });
  }
};

// Create Manual Application (Admin Only)
const createManualApplication = async (req, res) => {
  try {
    const adminId = req.user.id;
    const files = req.files || {};

    // Extract all form data (from req.body for text fields, req.files for files)
    const {
      // Application Number
      applicationNumber: providedApplicationNumber,
      // Groom Information
      groomName,
      groomFatherName,
      groomDateOfBirth,
      groomPlaceOfBirth,
      groomAddress,
      groomIdNumber,
      groomMaritalStatus,
      groomConfirm,
      groomPersonally,
      groomRepresentative,
      // Groom Representative
      groomRepName,
      groomRepFatherName,
      groomRepDateOfBirth,
      groomRepPlaceOfBirth,
      groomRepAddress,
      // Bride Information
      brideName,
      brideFatherName,
      brideDateOfBirth,
      bridePlaceOfBirth,
      brideAddress,
      brideIdNumber,
      brideMaritalStatus,
      brideConfirm,
      bridePersonally,
      brideRepresentative,
      // Bride Representative
      brideRepName,
      brideRepFatherName,
      brideRepDateOfBirth,
      brideRepPlaceOfBirth,
      brideRepAddress,
      // Witnesses
      // Witness No 1 (MALE)
      witness1MaleName,
      witness1MaleFatherName,
      witness1MaleDateOfBirth,
      witness1MalePlaceOfBirth,
      witness1MaleAddress,
      // Witness No 1 (FEMALE)
      witness1FemaleName,
      witness1FemaleFatherName,
      witness1FemaleDateOfBirth,
      witness1FemalePlaceOfBirth,
      witness1FemaleAddress,
      // Witness No 2 (MALE)
      witness2MaleName,
      witness2MaleFatherName,
      witness2MaleDateOfBirth,
      witness2MalePlaceOfBirth,
      witness2MaleAddress,
      // Witness No 2 (FEMALE)
      witness2FemaleName,
      witness2FemaleFatherName,
      witness2FemaleDateOfBirth,
      witness2FemalePlaceOfBirth,
      witness2FemaleAddress,
      // Mahr
      mahrAmount,
      // Solemnisation
      solemnisedDate,
      solemnisedTime,
      solemnisedPlace,
      solemnisedAddress,
      // Contact & Status
      email,
      contactNumber,
      status = "completed", // Default to completed for old data
      depositAmount,
      paymentStatus,
      appointmentDate,
      appointmentTime,
      appointmentLocation,
    } = req.body;

    // Validate required fields
    if (!groomName || !brideName) {
      return res.status(400).json({
        success: false,
        message: "Groom and Bride names are required",
      });
    }


    // Email validation (only if email is provided)
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }
    }

    // Use the email provided in the form (if provided)
    const portalEmail = email && email.trim() ? email.toLowerCase() : null;
    let portalPassword = null;
    let hashedPassword = null;

    if (portalEmail) {
      portalPassword = generatePassword();
      hashedPassword = await bcrypt.hash(portalPassword, 10);
    }

    // GET CONNECTION FOR TRANSACTION
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Use provided application number or generate sequential one starting from 1000
      let applicationNumber =
        providedApplicationNumber && providedApplicationNumber.trim()
          ? providedApplicationNumber.trim()
          : await generateSequentialRegistrationNumber(pool);

      // Check if application number already exists (within transaction)
      const [existingApp] = await connection.execute(
        "SELECT id FROM applications WHERE application_number = ?",
        [applicationNumber]
      );

      if (existingApp.length > 0) {
        // If user provided the number, return error
        if (providedApplicationNumber && providedApplicationNumber.trim()) {
          await connection.rollback();
          connection.release();
          return res.status(409).json({
            success: false,
            message:
              "This application number already exists. Please use a different number.",
          });
        }
        // If auto-generated, try generating a new one (max 5 attempts)
        let attempts = 0;
        let foundUnique = false;
        while (!foundUnique && attempts < 5) {
          applicationNumber = generateApplicationNumber();
          const [checkApp] = await connection.execute(
            "SELECT id FROM applications WHERE application_number = ?",
            [applicationNumber]
          );
          if (checkApp.length === 0) {
            foundUnique = true;
            break;
          }
          attempts++;
        }
        if (!foundUnique) {
          await connection.rollback();
          connection.release();
          return res.status(500).json({
            success: false,
            message:
              "Unable to generate unique application number. Please try again.",
          });
        }
      }
      let userId = null;
      let isNewUser = false;

      // Only create/lookup user if email is provided
      if (portalEmail) {
        // Check if email already exists
        const [existingUser] = await connection.execute(
          "SELECT id FROM users WHERE email = ?",
          [portalEmail]
        );

        if (existingUser.length > 0) {
          userId = existingUser[0].id;
          // Using existing user
        } else {
          // Create User (inside transaction - will be rolled back if application fails)
          const [userResult] = await connection.execute(
            'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, "applicant", ?)',
            [portalEmail, hashedPassword, groomName || "Applicant"]
          );
          userId = userResult.insertId;
          isNewUser = true;
        }
      }

      // Normalize dates
      const normalizedGroomDob = normalizeDate(groomDateOfBirth);
      const normalizedBrideDob = normalizeDate(brideDateOfBirth);
      const normalizedGroomRepDob = normalizeDate(groomRepDateOfBirth);
      const normalizedBrideRepDob = normalizeDate(brideRepDateOfBirth);
      const normalizedWitness1MaleDob = normalizeDate(witness1MaleDateOfBirth);
      const normalizedWitness1FemaleDob = normalizeDate(witness1FemaleDateOfBirth);
      const normalizedWitness2MaleDob = normalizeDate(witness2MaleDateOfBirth);
      const normalizedWitness2FemaleDob = normalizeDate(witness2FemaleDateOfBirth);
      const normalizedSolemnisedDate = normalizeDate(solemnisedDate); // Date only, no time
      const normalizedSolemnisedTime = normalizeTime(solemnisedTime);
      
      // Frontend now sends only solemnisedAddress, use it for both place and address
      const finalSolemnisedAddress = solemnisedAddress || solemnisedPlace || null;
      const finalSolemnisedPlace = solemnisedPlace || solemnisedAddress || null; // Time only

      // Handle file uploads - prepare document paths
      const fileFields = {
        groomId: "groom_id_path",
        brideId: "bride_id_path",
        witness1MaleId: "witness1_male_id_path",
        witness1FemaleId: "witness1_female_id_path",
        witness2MaleId: "witness2_male_id_path",
        witness2FemaleId: "witness2_female_id_path",
        mahrDeclaration: "mahr_declaration_path",
        civilDivorceDoc: "civil_divorce_doc_path",
        islamicDivorceDoc: "islamic_divorce_doc_path",
        groomConversionCert: "groom_conversion_cert_path",
        brideConversionCert: "bride_conversion_cert_path",
        statutoryDeclaration: "statutory_declaration_path",
      };

      // Initialize documentPaths - all documents are optional
      const documentPaths = {};
      if (files && typeof files === 'object') {
        for (const [fieldName, dbColumn] of Object.entries(fileFields)) {
          if (files[fieldName] && Array.isArray(files[fieldName]) && files[fieldName][0]) {
            documentPaths[dbColumn] = `/uploads/documents/${files[fieldName][0].filename}`;
          }
        }
      }
      console.log("Document paths provided:", Object.keys(documentPaths).length, "documents");

      // Insert Application with retry logic for collision
      let insertResult;
      let insertAttempts = 0;
      let finalApplicationNumber = applicationNumber;
      let insertSuccess = false;

      while (!insertSuccess && insertAttempts < 3) {
        try {
          // Prepare values array - ensure all values are primitives
          const insertValues = [
            finalApplicationNumber || null,
            userId || null,
            contactNumber || null,
            groomName || null,
            groomFatherName || null,
            normalizedGroomDob || null,
            groomPlaceOfBirth || null,
            groomIdNumber || null,
            groomAddress || null,
            groomMaritalStatus ? String(groomMaritalStatus).toLowerCase().trim() : null,
            // Convert FormData string booleans properly
            groomConfirm === 'true' || groomConfirm === true || groomConfirm === '1' || groomConfirm === 1,
            groomPersonally === 'true' || groomPersonally === true || groomPersonally === '1' || groomPersonally === 1,
            groomRepresentative === 'true' || groomRepresentative === true || groomRepresentative === '1' || groomRepresentative === 1,
            groomRepName || null,
            groomRepFatherName || null,
            normalizedGroomRepDob || null,
            groomRepPlaceOfBirth || null,
            groomRepAddress || null,
            brideName || null,
            brideFatherName || null,
            normalizedBrideDob || null,
            bridePlaceOfBirth || null,
            brideIdNumber || null,
            brideAddress || null,
            brideMaritalStatus ? String(brideMaritalStatus).toLowerCase().trim() : null,
            // Convert FormData string booleans properly
            brideConfirm === 'true' || brideConfirm === true || brideConfirm === '1' || brideConfirm === 1,
            bridePersonally === 'true' || bridePersonally === true || bridePersonally === '1' || bridePersonally === 1,
            brideRepresentative === 'true' || brideRepresentative === true || brideRepresentative === '1' || brideRepresentative === 1,
            brideRepName || null,
            brideRepFatherName || null,
            normalizedBrideRepDob || null,
            brideRepPlaceOfBirth || null,
            brideRepAddress || null,
            // Convert mahrAmount to number if provided (FormData sends as string)
            mahrAmount && mahrAmount !== '' && mahrAmount !== 'null' 
              ? (typeof mahrAmount === 'string' ? (isNaN(parseFloat(mahrAmount)) ? null : parseFloat(mahrAmount)) : (isNaN(Number(mahrAmount)) ? null : Number(mahrAmount)))
              : null,
            normalizedSolemnisedDate || null,
            normalizedSolemnisedTime || null,
            finalSolemnisedPlace || null,
            finalSolemnisedAddress || null,
            // Convert depositAmount to number (FormData sends as string)
            depositAmount && depositAmount !== '' && depositAmount !== 'null'
              ? (typeof depositAmount === 'string' ? (isNaN(parseFloat(depositAmount)) ? 200 : parseFloat(depositAmount)) : (isNaN(Number(depositAmount)) ? 200 : Number(depositAmount)))
              : 200,
            adminId || null,
            paymentStatus || "amount_set",
            status || "completed",
            documentPaths?.groom_id_path || null,
            documentPaths?.bride_id_path || null,
            documentPaths?.witness1_male_id_path || null,
            documentPaths?.witness1_female_id_path || null,
            documentPaths?.witness2_male_id_path || null,
            documentPaths?.witness2_female_id_path || null,
            documentPaths?.mahr_declaration_path || null,
            documentPaths?.civil_divorce_doc_path || null,
            documentPaths?.islamic_divorce_doc_path || null,
            documentPaths?.groom_conversion_cert_path || null,
            documentPaths?.bride_conversion_cert_path || null,
            documentPaths?.statutory_declaration_path || null,
            witness1MaleName || null,
            witness1MaleFatherName || null,
            normalizedWitness1MaleDob || null,
            witness1MalePlaceOfBirth || null,
            witness1MaleAddress || null,
            witness1FemaleName || null,
            witness1FemaleFatherName || null,
            normalizedWitness1FemaleDob || null,
            witness1FemalePlaceOfBirth || null,
            witness1FemaleAddress || null,
            witness2MaleName || null,
            witness2MaleFatherName || null,
            normalizedWitness2MaleDob || null,
            witness2MalePlaceOfBirth || null,
            witness2MaleAddress || null,
            witness2FemaleName || null,
            witness2FemaleFatherName || null,
            normalizedWitness2FemaleDob || null,
            witness2FemalePlaceOfBirth || null,
            witness2FemaleAddress || null,
          ];
          
          // Ensure all values are primitives (not arrays or objects)
          const sanitizedValues = insertValues.map(val => {
            if (val === undefined) return null;
            if (Array.isArray(val)) {
              return null;
            }
            if (typeof val === 'object' && val !== null) {
              return null;
            }
            return val;
          });
          
          // Validate count matches
          // Count: 3 (app info) + 10 (groom) + 5 (groom rep) + 10 (bride) + 5 (bride rep) + 1 (mahr) + 4 (solemnised) + 4 (deposit/payment/status) + 12 (documents) + 20 (witnesses) = 74
          const expectedCount = 74;
          if (sanitizedValues.length !== expectedCount) {
            console.error(`Value count mismatch: Expected ${expectedCount} values, got ${sanitizedValues.length}`);
            console.error('Values:', sanitizedValues);
            throw new Error(`Value count mismatch: Expected ${expectedCount} values, got ${sanitizedValues.length}`);
          }
          
          [insertResult] = await connection.execute(
            `INSERT INTO applications (
          application_number, user_id, contact_number,
          groom_full_name, groom_father_name, groom_date_of_birth, groom_place_of_birth, 
          groom_id_number, groom_address, groom_marital_status,
          groom_confirm, groom_personally, groom_representative,
          groom_rep_name, groom_rep_father_name, groom_rep_date_of_birth, 
          groom_rep_place_of_birth, groom_rep_address,
          bride_full_name, bride_father_name, bride_date_of_birth, bride_place_of_birth,
          bride_id_number, bride_address, bride_marital_status,
          bride_confirm, bride_personally, bride_representative,
          bride_rep_name, bride_rep_father_name, bride_rep_date_of_birth,
          bride_rep_place_of_birth, bride_rep_address,
          mahr_amount,
          solemnised_date, solemnised_time, solemnised_place, solemnised_address,
          deposit_amount, deposit_amount_set_by, payment_status,
          status,
          groom_id_path, bride_id_path, witness1_male_id_path, witness1_female_id_path, witness2_male_id_path, witness2_female_id_path,
          mahr_declaration_path, civil_divorce_doc_path, islamic_divorce_doc_path,
          groom_conversion_cert_path, bride_conversion_cert_path, statutory_declaration_path,
          witness1_male_name, witness1_male_father_name, witness1_male_date_of_birth, witness1_male_place_of_birth, witness1_male_address,
          witness1_female_name, witness1_female_father_name, witness1_female_date_of_birth, witness1_female_place_of_birth, witness1_female_address,
          witness2_male_name, witness2_male_father_name, witness2_male_date_of_birth, witness2_male_place_of_birth, witness2_male_address,
          witness2_female_name, witness2_female_father_name, witness2_female_date_of_birth, witness2_female_place_of_birth, witness2_female_address
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
            sanitizedValues
          );
          insertSuccess = true;
          break; // Success, exit loop
        } catch (insertError) {
          // Handle duplicate entry error
          if (
            insertError.code === "ER_DUP_ENTRY" &&
            insertError.message.includes("application_number")
          ) {
            // If user provided the number, return error
            if (providedApplicationNumber && providedApplicationNumber.trim()) {
              await connection.rollback();
              connection.release();
              return res.status(409).json({
                success: false,
                message:
                  "This application number already exists. Please use a different number.",
              });
            }
            // If auto-generated, try a new number
            insertAttempts++;
            if (insertAttempts < 3) {
              finalApplicationNumber = generateApplicationNumber();
              // Update applicationNumber in the VALUES array for next retry
              // The VALUES array will use finalApplicationNumber on next iteration
              continue; // Retry with new number
            } else {
              await connection.rollback();
              connection.release();
              return res.status(500).json({
                success: false,
                message:
                  "Unable to generate unique application number after multiple attempts. Please try again.",
              });
            }
            } else {
            // Other database errors - throw to outer catch
            throw insertError;
          }
        }
      }

      if (!insertSuccess) {
        await connection.rollback();
        connection.release();
        return res.status(500).json({
          success: false,
          message: "Failed to insert application. Please try again.",
        });
      }

      const applicationId = insertResult.insertId;

      // Insert witnesses with extended fields
      // Ensure all values are null instead of undefined
      const witnessesData = [
        {
          name: witness1MaleName || null,
          fatherName: witness1MaleFatherName || null,
          dob: normalizedWitness1MaleDob || null,
          pob: witness1MalePlaceOfBirth || null,
          address: witness1MaleAddress || null,
        },
        {
          name: witness1FemaleName || null,
          fatherName: witness1FemaleFatherName || null,
          dob: normalizedWitness1FemaleDob || null,
          pob: witness1FemalePlaceOfBirth || null,
          address: witness1FemaleAddress || null,
        },
        {
          name: witness2MaleName || null,
          fatherName: witness2MaleFatherName || null,
          dob: normalizedWitness2MaleDob || null,
          pob: witness2MalePlaceOfBirth || null,
          address: witness2MaleAddress || null,
        },
        {
          name: witness2FemaleName || null,
          fatherName: witness2FemaleFatherName || null,
          dob: normalizedWitness2FemaleDob || null,
          pob: witness2FemalePlaceOfBirth || null,
          address: witness2FemaleAddress || null,
        },
      ];

      for (let i = 0; i < witnessesData.length; i++) {
        const w = witnessesData[i];
        if (w.name) {
          // Only insert if witness name is provided
          try {
            await connection.execute(
              `INSERT INTO witnesses (
                application_id, witness_name, witness_father_name, 
                witness_date_of_birth, witness_place_of_birth, witness_address, 
                witness_order
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                applicationId,
                w.name || null,
                w.fatherName || null,
                w.dob || null,
                w.pob || null,
                w.address || null,
                i + 1,
              ]
            );
          } catch (witnessError) {
            // If witness insertion fails, rollback and return error
            await connection.rollback();
            connection.release();
            return res.status(500).json({
              success: false,
              message: `Failed to insert witness ${i + 1}: ${
                witnessError.message
              }`,
            });
          }
        }
      }

      // COMMIT TRANSACTION - Only commit if everything succeeded
      try {
        await connection.commit();

        // Send success response AFTER successful commit
        const responseData = {
          success: true,
          message: "Application created successfully",
          data: {
            applicationNumber: finalApplicationNumber,
            applicationId,
            portalEmail: portalEmail || null,
            portalPassword: isNewUser ? portalPassword : undefined,
          },
        };

        // Release connection before sending response
        connection.release();

        // Update deposit_amount_set_at timestamp (using separate query)
        await pool.execute(
          `UPDATE applications 
           SET deposit_amount_set_at = NOW()
           WHERE id = ? AND deposit_amount_set_at IS NULL`,
          [applicationId]
        );

        // Certificate generation disabled - commented out per user request
        /* DISABLED: Certificate generation is disabled
        try {
          const {
            generateCertificatePDF,
          } = require("../services/certificateService");

          // Fetch application data with witnesses for certificate generation
          const [appData] = await pool.execute(
            `SELECT * FROM applications WHERE id = ?`,
            [applicationId]
          );

          if (appData.length > 0) {
            const [witnessesData] = await pool.execute(
              "SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order",
              [applicationId]
            );

            // Delete old certificate file if it exists (for manual applications that might be recreated)
            if (appData[0].certificate_url) {
              try {
                const fs = require("fs");
                const path = require("path");
                const oldCertificatePath = path.join(
                  __dirname,
                  "../../",
                  appData[0].certificate_url
                );

                if (fs.existsSync(oldCertificatePath)) {
                  fs.unlinkSync(oldCertificatePath);
                  console.log(
                    `✅ Deleted old certificate: ${oldCertificatePath}`
                  );
                }
              } catch (deleteError) {
                console.error(
                  "⚠️ Error deleting old certificate:",
                  deleteError.message
                );
              }
            }

            // Generate certificate
            const certificateUrl = await generateCertificatePDF(
              appData[0],
              witnessesData
            );

            // Update application with certificate URL
            await pool.execute(
              `UPDATE applications 
               SET certificate_url = ?, 
                   certificate_generated_at = NOW(),
                   status = 'completed'
               WHERE id = ?`,
              [certificateUrl, applicationId]
            );

            console.log(
              "✅ Certificate generated for manual application:",
              applicationId
            );
          }
        } catch (certError) {
          // Don't fail the request if certificate generation fails, just log it
          console.error("❌ Error generating certificate:", certError);
        }
        */

        // Send confirmation email if email is provided
        if (portalEmail && portalEmail.trim()) {
          try {
            // Fetch application data for email
            const [appData] = await pool.execute(
              `SELECT id, application_number, groom_full_name, bride_full_name, 
                      groom_marital_status, bride_marital_status
               FROM applications WHERE id = ?`,
              [applicationId]
            );

            if (appData.length > 0) {
              const emailData = {
                id: appData[0].id,
                application_number: appData[0].application_number,
                groom_full_name: appData[0].groom_full_name,
                bride_full_name: appData[0].bride_full_name,
                groom_marital_status: appData[0].groom_marital_status,
                bride_marital_status: appData[0].bride_marital_status,
                portal_email: portalEmail.trim(),
                portalPassword: isNewUser ? portalPassword : "", // Empty string for existing users (they use their existing password)
                isManualApplication: true, // Flag to indicate this is a manual application
              };

              await sendApplicationConfirmation(emailData);
            }
          } catch (emailError) {
            // Don't fail the request if email fails, just log it
            console.error("Error sending confirmation email:", emailError);
          }
        }

        return res.status(201).json(responseData);
      } catch (commitError) {
        // If commit fails, rollback
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Error during rollback:", rollbackError);
        }
        connection.release();
        throw commitError;
      }
    } catch (transactionError) {
      // Rollback transaction if any error occurred
      // This will undo user creation if application insertion failed
      try {
        // Check if connection is still active before rollback
        if (connection && !connection._fatalError) {
          await connection.rollback();
        }
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
      // Release connection
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError);
        }
      }
      throw transactionError;
    }
  } catch (error) {
    console.error("Error creating manual application:", error);

    // Handle MySQL Duplicate Entry Error
    if (error.code === "ER_DUP_ENTRY") {
      let message = "Duplicate entry found.";
      if (error.message.includes("application_number"))
        message = "Application number collision, please try again.";
      if (error.message.includes("portal_email"))
        message = "An account with this email already exists.";

      return res.status(409).json({
        success: false,
        message: message,
      });
    }

    // Always include error details in response for debugging
    res.status(500).json({
      success: false,
      message: "Failed to create application",
      error: error.message || error.sqlMessage || "Unknown error occurred",
      errorCode: error.code,
      errorDetails: {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  }
};

// Update Application (Admin Only)
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files || {};
    const adminId = req.user.id;

    // Extract all form data
    const {
      // Application Number
      applicationNumber,
      // Groom Information
      groomName,
      groomFatherName,
      groomDateOfBirth,
      groomPlaceOfBirth,
      groomAddress,
      groomIdNumber,
      groomMaritalStatus,
      groomConfirm,
      groomPersonally,
      groomRepresentative,
      // Groom Representative
      groomRepName,
      groomRepFatherName,
      groomRepDateOfBirth,
      groomRepPlaceOfBirth,
      groomRepAddress,
      // Bride Information
      brideName,
      brideFatherName,
      brideDateOfBirth,
      bridePlaceOfBirth,
      brideAddress,
      brideIdNumber,
      brideMaritalStatus,
      brideConfirm,
      bridePersonally,
      brideRepresentative,
      // Bride Representative
      brideRepName,
      brideRepFatherName,
      brideRepDateOfBirth,
      brideRepPlaceOfBirth,
      brideRepAddress,
      // Witnesses
      // Witness No 1 (MALE)
      witness1MaleName,
      witness1MaleFatherName,
      witness1MaleDateOfBirth,
      witness1MalePlaceOfBirth,
      witness1MaleAddress,
      // Witness No 1 (FEMALE)
      witness1FemaleName,
      witness1FemaleFatherName,
      witness1FemaleDateOfBirth,
      witness1FemalePlaceOfBirth,
      witness1FemaleAddress,
      // Witness No 2 (MALE)
      witness2MaleName,
      witness2MaleFatherName,
      witness2MaleDateOfBirth,
      witness2MalePlaceOfBirth,
      witness2MaleAddress,
      // Witness No 2 (FEMALE)
      witness2FemaleName,
      witness2FemaleFatherName,
      witness2FemaleDateOfBirth,
      witness2FemalePlaceOfBirth,
      witness2FemaleAddress,
      // Mahr
      mahrAmount,
      // Solemnisation
      solemnisedDate,
      solemnisedTime,
      solemnisedPlace,
      solemnisedAddress,
      // Contact & Status
      email,
      contactNumber,
      status,
      depositAmount,
      paymentStatus,
    } = req.body;

    // Check if application exists
    const [existingApp] = await pool.execute(
      "SELECT * FROM applications WHERE id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)",
      [id]
    );

    if (existingApp.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const application = existingApp[0];

    // Validate required fields
    if (groomName !== undefined && !groomName) {
      return res.status(400).json({
        success: false,
        message: "Groom name is required",
      });
    }

    if (brideName !== undefined && !brideName) {
      return res.status(400).json({
        success: false,
        message: "Bride name is required",
      });
    }

    // Check application number uniqueness if changed
    if (
      applicationNumber &&
      applicationNumber !== application.application_number
    ) {
      const [existingNumber] = await pool.execute(
        "SELECT id FROM applications WHERE application_number = ? AND id != ?",
        [applicationNumber, id]
      );
      if (existingNumber.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Application number already exists",
        });
      }
    }

    // Normalize dates
    const normalizedGroomDob = groomDateOfBirth
      ? normalizeDate(groomDateOfBirth)
      : null;
    const normalizedBrideDob = brideDateOfBirth
      ? normalizeDate(brideDateOfBirth)
      : null;
    const normalizedGroomRepDob = groomRepDateOfBirth
      ? normalizeDate(groomRepDateOfBirth)
      : null;
    const normalizedBrideRepDob = brideRepDateOfBirth
      ? normalizeDate(brideRepDateOfBirth)
      : null;
    const normalizedWitness1MaleDob = witness1MaleDateOfBirth
      ? normalizeDate(witness1MaleDateOfBirth)
      : null;
    const normalizedWitness1FemaleDob = witness1FemaleDateOfBirth
      ? normalizeDate(witness1FemaleDateOfBirth)
      : null;
    const normalizedWitness2MaleDob = witness2MaleDateOfBirth
      ? normalizeDate(witness2MaleDateOfBirth)
      : null;
    const normalizedWitness2FemaleDob = witness2FemaleDateOfBirth
      ? normalizeDate(witness2FemaleDateOfBirth)
      : null;
    const normalizedSolemnisedDate = solemnisedDate
      ? normalizeDate(solemnisedDate) // Date only, no time
      : null;
    const normalizedSolemnisedTime = solemnisedTime
      ? normalizeTime(solemnisedTime) // Time only
      : null;

    // Handle file uploads - only update if new files are provided
    const fileFields = {
      groomId: "groom_id_path",
      brideId: "bride_id_path",
      witness1MaleId: "witness1_male_id_path",
      witness1FemaleId: "witness1_female_id_path",
      witness2MaleId: "witness2_male_id_path",
      witness2FemaleId: "witness2_female_id_path",
      mahrDeclaration: "mahr_declaration_path",
      civilDivorceDoc: "civil_divorce_doc_path",
      islamicDivorceDoc: "islamic_divorce_doc_path",
      groomConversionCert: "groom_conversion_cert_path",
      brideConversionCert: "bride_conversion_cert_path",
      statutoryDeclaration: "statutory_declaration_path",
    };

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    // Application number
    if (applicationNumber !== undefined) {
      updateFields.push("application_number = ?");
      updateValues.push(applicationNumber);
    }

    // Groom fields
    if (groomName !== undefined) {
      updateFields.push("groom_full_name = ?");
      updateValues.push(groomName);
    }
    if (groomFatherName !== undefined) {
      updateFields.push("groom_father_name = ?");
      updateValues.push(groomFatherName || null);
    }
    if (normalizedGroomDob !== undefined) {
      updateFields.push("groom_date_of_birth = ?");
      updateValues.push(normalizedGroomDob);
    }
    if (groomPlaceOfBirth !== undefined) {
      updateFields.push("groom_place_of_birth = ?");
      updateValues.push(groomPlaceOfBirth || null);
    }
    if (groomAddress !== undefined) {
      updateFields.push("groom_address = ?");
      updateValues.push(groomAddress);
    }
    if (groomIdNumber !== undefined) {
      updateFields.push("groom_id_number = ?");
      updateValues.push(groomIdNumber);
    }
    if (groomMaritalStatus !== undefined) {
      updateFields.push("groom_marital_status = ?");
      updateValues.push(groomMaritalStatus ? String(groomMaritalStatus).toLowerCase().trim() : null);
    }
    if (groomConfirm !== undefined) {
      updateFields.push("groom_confirm = ?");
      updateValues.push(groomConfirm);
    }
    if (groomPersonally !== undefined) {
      updateFields.push("groom_personally = ?");
      updateValues.push(groomPersonally);
    }
    if (groomRepresentative !== undefined) {
      updateFields.push("groom_representative = ?");
      updateValues.push(groomRepresentative);
    }

    // Groom Representative
    if (groomRepName !== undefined) {
      updateFields.push("groom_rep_name = ?");
      updateValues.push(groomRepName || null);
    }
    if (groomRepFatherName !== undefined) {
      updateFields.push("groom_rep_father_name = ?");
      updateValues.push(groomRepFatherName || null);
    }
    if (normalizedGroomRepDob !== undefined) {
      updateFields.push("groom_rep_date_of_birth = ?");
      updateValues.push(normalizedGroomRepDob);
    }
    if (groomRepPlaceOfBirth !== undefined) {
      updateFields.push("groom_rep_place_of_birth = ?");
      updateValues.push(groomRepPlaceOfBirth || null);
    }
    if (groomRepAddress !== undefined) {
      updateFields.push("groom_rep_address = ?");
      updateValues.push(groomRepAddress || null);
    }

    // Bride fields
    if (brideName !== undefined) {
      updateFields.push("bride_full_name = ?");
      updateValues.push(brideName);
    }
    if (brideFatherName !== undefined) {
      updateFields.push("bride_father_name = ?");
      updateValues.push(brideFatherName || null);
    }
    if (normalizedBrideDob !== undefined) {
      updateFields.push("bride_date_of_birth = ?");
      updateValues.push(normalizedBrideDob);
    }
    if (bridePlaceOfBirth !== undefined) {
      updateFields.push("bride_place_of_birth = ?");
      updateValues.push(bridePlaceOfBirth || null);
    }
    if (brideAddress !== undefined) {
      updateFields.push("bride_address = ?");
      updateValues.push(brideAddress);
    }
    if (brideIdNumber !== undefined) {
      updateFields.push("bride_id_number = ?");
      updateValues.push(brideIdNumber);
    }
    if (brideMaritalStatus !== undefined) {
      updateFields.push("bride_marital_status = ?");
      updateValues.push(brideMaritalStatus ? String(brideMaritalStatus).toLowerCase().trim() : null);
    }
    if (brideConfirm !== undefined) {
      updateFields.push("bride_confirm = ?");
      updateValues.push(brideConfirm);
    }
    if (bridePersonally !== undefined) {
      updateFields.push("bride_personally = ?");
      updateValues.push(bridePersonally);
    }
    if (brideRepresentative !== undefined) {
      updateFields.push("bride_representative = ?");
      updateValues.push(brideRepresentative);
    }

    // Bride Representative
    if (brideRepName !== undefined) {
      updateFields.push("bride_rep_name = ?");
      updateValues.push(brideRepName || null);
    }
    if (brideRepFatherName !== undefined) {
      updateFields.push("bride_rep_father_name = ?");
      updateValues.push(brideRepFatherName || null);
    }
    if (normalizedBrideRepDob !== undefined) {
      updateFields.push("bride_rep_date_of_birth = ?");
      updateValues.push(normalizedBrideRepDob);
    }
    if (brideRepPlaceOfBirth !== undefined) {
      updateFields.push("bride_rep_place_of_birth = ?");
      updateValues.push(brideRepPlaceOfBirth || null);
    }
    if (brideRepAddress !== undefined) {
      updateFields.push("bride_rep_address = ?");
      updateValues.push(brideRepAddress || null);
    }

    // Mahr
    if (mahrAmount !== undefined) {
      updateFields.push("mahr_amount = ?");
      updateValues.push(mahrAmount || null);
    }

    // Solemnisation
    if (normalizedSolemnisedDate !== undefined) {
      updateFields.push("solemnised_date = ?");
      updateValues.push(normalizedSolemnisedDate);
    }
    if (normalizedSolemnisedTime !== undefined) {
      updateFields.push("solemnised_time = ?");
      updateValues.push(normalizedSolemnisedTime);
    }
    if (solemnisedPlace !== undefined) {
      updateFields.push("solemnised_place = ?");
      updateValues.push(solemnisedPlace || null);
    }
    if (solemnisedAddress !== undefined) {
      updateFields.push("solemnised_address = ?");
      updateValues.push(solemnisedAddress || null);
    }

    // Contact & Status
    // Note: email is stored in users table, not applications table
    // We'll update it separately after updating the application
    if (contactNumber !== undefined) {
      // This might map to a contact field, adjust as needed
    }
    if (status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }
    if (depositAmount !== undefined) {
      updateFields.push("deposit_amount = ?");
      updateValues.push(depositAmount || null);
    }
    if (paymentStatus !== undefined) {
      updateFields.push("payment_status = ?");
      updateValues.push(paymentStatus);
    }

    // Witness fields
    // Witness No 1 (MALE)
    if (witness1MaleName !== undefined) {
      updateFields.push("witness1_male_name = ?");
      updateValues.push(witness1MaleName || null);
    }
    if (witness1MaleFatherName !== undefined) {
      updateFields.push("witness1_male_father_name = ?");
      updateValues.push(witness1MaleFatherName || null);
    }
    if (normalizedWitness1MaleDob !== undefined) {
      updateFields.push("witness1_male_date_of_birth = ?");
      updateValues.push(normalizedWitness1MaleDob);
    }
    if (witness1MalePlaceOfBirth !== undefined) {
      updateFields.push("witness1_male_place_of_birth = ?");
      updateValues.push(witness1MalePlaceOfBirth || null);
    }
    if (witness1MaleAddress !== undefined) {
      updateFields.push("witness1_male_address = ?");
      updateValues.push(witness1MaleAddress || null);
    }

    // Witness No 1 (FEMALE)
    if (witness1FemaleName !== undefined) {
      updateFields.push("witness1_female_name = ?");
      updateValues.push(witness1FemaleName || null);
    }
    if (witness1FemaleFatherName !== undefined) {
      updateFields.push("witness1_female_father_name = ?");
      updateValues.push(witness1FemaleFatherName || null);
    }
    if (normalizedWitness1FemaleDob !== undefined) {
      updateFields.push("witness1_female_date_of_birth = ?");
      updateValues.push(normalizedWitness1FemaleDob);
    }
    if (witness1FemalePlaceOfBirth !== undefined) {
      updateFields.push("witness1_female_place_of_birth = ?");
      updateValues.push(witness1FemalePlaceOfBirth || null);
    }
    if (witness1FemaleAddress !== undefined) {
      updateFields.push("witness1_female_address = ?");
      updateValues.push(witness1FemaleAddress || null);
    }

    // Witness No 2 (MALE)
    if (witness2MaleName !== undefined) {
      updateFields.push("witness2_male_name = ?");
      updateValues.push(witness2MaleName || null);
    }
    if (witness2MaleFatherName !== undefined) {
      updateFields.push("witness2_male_father_name = ?");
      updateValues.push(witness2MaleFatherName || null);
    }
    if (normalizedWitness2MaleDob !== undefined) {
      updateFields.push("witness2_male_date_of_birth = ?");
      updateValues.push(normalizedWitness2MaleDob);
    }
    if (witness2MalePlaceOfBirth !== undefined) {
      updateFields.push("witness2_male_place_of_birth = ?");
      updateValues.push(witness2MalePlaceOfBirth || null);
    }
    if (witness2MaleAddress !== undefined) {
      updateFields.push("witness2_male_address = ?");
      updateValues.push(witness2MaleAddress || null);
    }

    // Witness No 2 (FEMALE)
    if (witness2FemaleName !== undefined) {
      updateFields.push("witness2_female_name = ?");
      updateValues.push(witness2FemaleName || null);
    }
    if (witness2FemaleFatherName !== undefined) {
      updateFields.push("witness2_female_father_name = ?");
      updateValues.push(witness2FemaleFatherName || null);
    }
    if (normalizedWitness2FemaleDob !== undefined) {
      updateFields.push("witness2_female_date_of_birth = ?");
      updateValues.push(normalizedWitness2FemaleDob);
    }
    if (witness2FemalePlaceOfBirth !== undefined) {
      updateFields.push("witness2_female_place_of_birth = ?");
      updateValues.push(witness2FemalePlaceOfBirth || null);
    }
    if (witness2FemaleAddress !== undefined) {
      updateFields.push("witness2_female_address = ?");
      updateValues.push(witness2FemaleAddress || null);
    }

    // Handle file uploads
    for (const [fieldName, dbColumn] of Object.entries(fileFields)) {
      if (files[fieldName] && files[fieldName][0]) {
        updateFields.push(`${dbColumn} = ?`);
        updateValues.push(`/uploads/documents/${files[fieldName][0].filename}`);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // Add id to updateValues for WHERE clause
    updateValues.push(id);

    // Update application
    const updateQuery = `UPDATE applications SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    await pool.execute(updateQuery, updateValues);

    // Update email in users table if provided
    if (email !== undefined && application.user_id) {
      try {
        // Check if email is already in use by another user
        const [existingUser] = await pool.execute(
          "SELECT id FROM users WHERE email = ? AND id != ?",
          [email, application.user_id]
        );
        if (existingUser.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Email already in use by another user",
          });
        }
        // Update the email in users table
        await pool.execute("UPDATE users SET email = ? WHERE id = ?", [
          email,
          application.user_id,
        ]);
      } catch (error) {
        console.error("Error updating user email:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to update email",
          error: error.message,
        });
      }
    }

    // Update witnesses if provided
    if (witness1MaleName !== undefined || witness1FemaleName !== undefined || 
        witness2MaleName !== undefined || witness2FemaleName !== undefined) {
      // Get existing witnesses sorted by witness_order
      const [existingWitnesses] = await pool.execute(
        "SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order, id",
        [id]
      );

      // Witness No 1 (MALE) - order 1
      if (witness1MaleName !== undefined) {
        if (existingWitnesses[0] && existingWitnesses[0].witness_order === 1) {
          await pool.execute(
            `UPDATE witnesses SET 
              witness_name = ?, witness_father_name = ?, witness_date_of_birth = ?, 
              witness_place_of_birth = ?, witness_address = ?
            WHERE id = ?`,
            [
              witness1MaleName || null,
              witness1MaleFatherName || null,
              normalizedWitness1MaleDob,
              witness1MalePlaceOfBirth || null,
              witness1MaleAddress || null,
              existingWitnesses[0].id,
            ]
          );
        } else {
          await pool.execute(
            `INSERT INTO witnesses (application_id, witness_name, witness_father_name, witness_date_of_birth, witness_place_of_birth, witness_address, witness_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              witness1MaleName || null,
              witness1MaleFatherName || null,
              normalizedWitness1MaleDob,
              witness1MalePlaceOfBirth || null,
              witness1MaleAddress || null,
              1,
            ]
          );
        }
      }

      // Witness No 1 (FEMALE) - order 2
      if (witness1FemaleName !== undefined) {
        if (existingWitnesses[1] && existingWitnesses[1].witness_order === 2) {
          await pool.execute(
            `UPDATE witnesses SET 
              witness_name = ?, witness_father_name = ?, witness_date_of_birth = ?, 
              witness_place_of_birth = ?, witness_address = ?
            WHERE id = ?`,
            [
              witness1FemaleName || null,
              witness1FemaleFatherName || null,
              normalizedWitness1FemaleDob,
              witness1FemalePlaceOfBirth || null,
              witness1FemaleAddress || null,
              existingWitnesses[1].id,
            ]
          );
        } else {
          await pool.execute(
            `INSERT INTO witnesses (application_id, witness_name, witness_father_name, witness_date_of_birth, witness_place_of_birth, witness_address, witness_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              witness1FemaleName || null,
              witness1FemaleFatherName || null,
              normalizedWitness1FemaleDob,
              witness1FemalePlaceOfBirth || null,
              witness1FemaleAddress || null,
              2,
            ]
          );
        }
      }

      // Witness No 2 (MALE) - order 3
      if (witness2MaleName !== undefined) {
        if (existingWitnesses[2] && existingWitnesses[2].witness_order === 3) {
          await pool.execute(
            `UPDATE witnesses SET 
              witness_name = ?, witness_father_name = ?, witness_date_of_birth = ?, 
              witness_place_of_birth = ?, witness_address = ?
            WHERE id = ?`,
            [
              witness2MaleName || null,
              witness2MaleFatherName || null,
              normalizedWitness2MaleDob,
              witness2MalePlaceOfBirth || null,
              witness2MaleAddress || null,
              existingWitnesses[2].id,
            ]
          );
        } else {
          await pool.execute(
            `INSERT INTO witnesses (application_id, witness_name, witness_father_name, witness_date_of_birth, witness_place_of_birth, witness_address, witness_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              witness2MaleName || null,
              witness2MaleFatherName || null,
              normalizedWitness2MaleDob,
              witness2MalePlaceOfBirth || null,
              witness2MaleAddress || null,
              3,
            ]
          );
        }
      }

      // Witness No 2 (FEMALE) - order 4
      if (witness2FemaleName !== undefined) {
        if (existingWitnesses[3] && existingWitnesses[3].witness_order === 4) {
          await pool.execute(
            `UPDATE witnesses SET 
              witness_name = ?, witness_father_name = ?, witness_date_of_birth = ?, 
              witness_place_of_birth = ?, witness_address = ?
            WHERE id = ?`,
            [
              witness2FemaleName || null,
              witness2FemaleFatherName || null,
              normalizedWitness2FemaleDob,
              witness2FemalePlaceOfBirth || null,
              witness2FemaleAddress || null,
              existingWitnesses[3].id,
            ]
          );
        } else {
          await pool.execute(
            `INSERT INTO witnesses (application_id, witness_name, witness_father_name, witness_date_of_birth, witness_place_of_birth, witness_address, witness_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              witness2FemaleName || null,
              witness2FemaleFatherName || null,
              normalizedWitness2FemaleDob,
              witness2FemalePlaceOfBirth || null,
              witness2FemaleAddress || null,
              4,
            ]
          );
        }
      }
    }

    // Fetch updated application
    const [updatedApp] = await pool.execute(
      "SELECT * FROM applications WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Application updated successfully",
      data: {
        application: updatedApp[0],
      },
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application",
      error: error.message,
    });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query =
      "SELECT id, email, role, full_name, created_at, updated_at FROM users WHERE 1=1";
    const params = [];

    if (role) {
      query += " AND role = ?";
      params.push(role);
    }

    if (search) {
      query += " AND (email LIKE ? OR full_name LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY created_at DESC LIMIT ${parseInt(
      limit
    )} OFFSET ${parseInt(offset)}`;

    const [users] = await pool.execute(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM users WHERE 1=1";
    const countParams = [];

    if (role) {
      countQuery += " AND role = ?";
      countParams.push(role);
    }

    if (search) {
      countQuery += " AND (email LIKE ? OR full_name LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Get User By ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      "SELECT id, email, role, full_name, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user: users[0],
      },
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, role, password } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingUser = existingUsers[0];

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (email !== undefined) {
      // Check if email is already in use by another user
      const [emailCheck] = await pool.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email.toLowerCase(), id]
      );
      if (emailCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already in use by another user",
        });
      }
      updateFields.push("email = ?");
      updateValues.push(email.toLowerCase());
    }

    if (full_name !== undefined) {
      updateFields.push("full_name = ?");
      updateValues.push(full_name);
    }

    if (role !== undefined) {
      // Validate role
      if (!["admin", "applicant"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be 'admin' or 'applicant'",
        });
      }
      updateFields.push("role = ?");
      updateValues.push(role);
    }

    if (password !== undefined && password.trim() !== "") {
      // Validate password strength (minimum 6 characters)
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }
      // Hash new password
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateValues.push(id);

    // Update user
    const updateQuery = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    await pool.execute(updateQuery, updateValues);

    // Fetch updated user
    const [updatedUsers] = await pool.execute(
      "SELECT id, email, role, full_name, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );

    const updatedUser = updatedUsers[0];

    // Track what changed for email notification
    const changes = {
      email_changed:
        email !== undefined &&
        email.toLowerCase() !== existingUser.email.toLowerCase(),
      password_changed: password !== undefined && password.trim() !== "",
      name_changed:
        full_name !== undefined && full_name !== existingUser.full_name,
      role_changed: role !== undefined && role !== existingUser.role,
    };

    // Send email notification if any changes were made
    if (
      changes.email_changed ||
      changes.password_changed ||
      changes.name_changed ||
      changes.role_changed
    ) {
      try {
        // Determine recipient email: if email changed, send to new email; otherwise send to current email
        const recipientEmail = changes.email_changed
          ? updatedUser.email
          : existingUser.email;

        const emailData = {
          email: recipientEmail,
          full_name: updatedUser.full_name, // Use updated name for greeting
          password_changed: changes.password_changed,
          new_password: changes.password_changed ? password.trim() : null,
          email_changed: changes.email_changed,
          new_email: changes.email_changed ? updatedUser.email : null,
          name_changed: changes.name_changed,
          new_full_name: changes.name_changed ? updatedUser.full_name : null,
          role_changed: changes.role_changed,
          new_role: changes.role_changed ? updatedUser.role : null,
        };

        await sendUserUpdatedEmail(emailData);

        // If email was changed, also send notification to old email for security
        if (changes.email_changed) {
          try {
            const oldEmailData = {
              email: existingUser.email,
              full_name: existingUser.full_name,
              password_changed: false,
              new_password: null,
              email_changed: true,
              new_email: updatedUser.email,
              name_changed: false,
              new_full_name: null,
              role_changed: false,
              new_role: null,
            };
            await sendUserUpdatedEmail(oldEmailData);
          } catch (oldEmailError) {
            console.error(
              "Error sending notification to old email:",
              oldEmailError
            );
            // Continue even if old email fails
          }
        }
      } catch (emailError) {
        console.error("Error sending user updated email:", emailError);
        // Don't fail the request if email fails, just log it
        // User is still updated successfully
      }
    }

    res.json({
      success: true,
      message:
        "User updated successfully" +
        (changes.password_changed ||
        changes.email_changed ||
        changes.name_changed ||
        changes.role_changed
          ? ". User has been notified via email."
          : ""),
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// Create Admin User
const createAdmin = async (req, res) => {
  try {
    const { email, full_name, password } = req.body;

    // Validate required fields
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password strength (minimum 6 characters)
    if (password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Create admin user
    const [result] = await pool.execute(
      "INSERT INTO users (email, password, role, full_name) VALUES (?, ?, 'admin', ?)",
      [normalizedEmail, hashedPassword, full_name.trim()]
    );

    const userId = result.insertId;

    // Send email with credentials
    try {
      await sendAdminCredentialsEmail({
        email: normalizedEmail,
        full_name: full_name.trim(),
        password: password.trim(), // Send plain password in email
      });
    } catch (emailError) {
      console.error("Error sending admin credentials email:", emailError);
      // Don't fail the request if email fails, just log it
      // User is still created successfully
    }

    // Fetch created user (without password)
    const [newUsers] = await pool.execute(
      "SELECT id, email, role, full_name, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    res.status(201).json({
      success: true,
      message: "Admin user created successfully. Credentials have been sent via email.",
      data: {
        user: newUsers[0],
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin user",
      error: error.message,
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Prevent self-deletion
    if (parseInt(id) === parseInt(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Check if user exists
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = existingUsers[0];

    // Check if user has applications
    const [applications] = await pool.execute(
      "SELECT COUNT(*) as count FROM applications WHERE user_id = ?",
      [id]
    );

    if (applications[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete user with existing applications. Please delete or reassign applications first.",
      });
    }

    // Delete user
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

module.exports = {
  adminLogin,
  getAllApplications,
  getApplicationById,
  approveApplication,
  verifyDocuments,
  setDepositAmount,
  verifyPayment,
  scheduleAppointment,
  markComplete,
  generateCertificate,
  updateApplicationNumber,
  deleteApplication,
  createManualApplication,
  updateApplication,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdmin,
  getSettings,
  updateSettings,
  getSettingValue,
};
