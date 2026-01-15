const { pool } = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  generatePassword,
  generateApplicationNumber,
  normalizeDate,
} = require("../utils/helpers");
const {
  sendDepositAmountEmail,
  sendPaymentVerifiedEmail,
  sendAppointmentEmail,
  sendCertificateReadyEmail,
  sendApplicationConfirmation,
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

    let query =
      "SELECT * FROM applications WHERE is_deleted = FALSE OR is_deleted IS NULL";
    const params = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    if (search) {
      query +=
        " AND (application_number LIKE ? OR groom_full_name LIKE ? OR bride_full_name LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY created_at DESC LIMIT ${parseInt(
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

// Verify Documents
const verifyDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const DEFAULT_DEPOSIT_AMOUNT = 200;

    // Get application to check if documents exist (exclude deleted)
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

    // Check if required documents are uploaded
    if (!app.groom_id_path || !app.bride_id_path) {
      return res.status(400).json({
        success: false,
        message: "Required documents are not uploaded yet",
      });
    }

    // Update application - mark documents as verified AND automatically set deposit amount to 200
    await pool.execute(
      `UPDATE applications 
       SET documents_verified = TRUE, 
           documents_verified_by = ?, 
           documents_verified_at = NOW(),
           deposit_amount = ?,
           deposit_amount_set_by = ?,
           deposit_amount_set_at = NOW(),
           payment_status = 'amount_set',
           status = 'payment_pending'
       WHERE id = ?`,
      [adminId, DEFAULT_DEPOSIT_AMOUNT, adminId, id]
    );

    // Get application data with user email for sending deposit amount email
    const [rows] = await pool.execute(
      `SELECT a.*, u.email as portal_email 
       FROM applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    // Send email to applicant with deposit amount
    if (rows.length > 0) {
      await sendDepositAmountEmail(rows[0]);
    }

    res.json({
      success: true,
      message: "Documents verified successfully and deposit amount set to £200",
    });
  } catch (error) {
    console.error("Error verifying documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify documents",
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
const generateCertificate = async (req, res) => {
  const { generateCertificatePDF } = require("../services/certificateService");

  try {
    const { id } = req.params;
    // Check if email notification should be sent (default: true)
    // If notify=false is passed, skip sending email (e.g., when admin just wants to print)
    const shouldNotify = req.query.notify !== "false";

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

    // Get witnesses
    const [witnesses] = await pool.execute(
      "SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order",
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
    res.status(500).json({
      success: false,
      message: "Failed to generate certificate",
      error: error.message,
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
      groomEmail,
      groomIdNumber,
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
      brideEmail,
      brideIdNumber,
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
      witness1Name,
      witness1FatherName,
      witness1DateOfBirth,
      witness1PlaceOfBirth,
      witness1Address,
      witness2Name,
      witness2FatherName,
      witness2DateOfBirth,
      witness2PlaceOfBirth,
      witness2Address,
      // Mahr
      mahrAmount,
      mahrType,
      // Solemnisation
      solemnisedDate,
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
      preferredDate,
      specialRequests,
    } = req.body;

    // Validate required fields
    if (!groomName || !brideName) {
      return res.status(400).json({
        success: false,
        message: "Groom and Bride names are required",
      });
    }

    if (!groomDateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Groom date of birth is required",
      });
    }

    if (!groomPlaceOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Groom place of birth is required",
      });
    }

    if (!brideDateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Bride date of birth is required",
      });
    }

    if (!bridePlaceOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Bride place of birth is required",
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

    // Use provided application number or generate one
    let applicationNumber =
      providedApplicationNumber && providedApplicationNumber.trim()
        ? providedApplicationNumber.trim()
        : generateApplicationNumber();

    // GET CONNECTION FOR TRANSACTION
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
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
          console.log("Using existing user with ID:", userId);
        } else {
          // Create User
          console.log("Creating user with email:", portalEmail);
          const [userResult] = await connection.execute(
            'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, "applicant", ?)',
            [portalEmail, hashedPassword, groomName || "Applicant"]
          );
          userId = userResult.insertId;
          isNewUser = true;
          console.log("User created with ID:", userId);
        }
      } else {
        console.log("No email provided, skipping user creation");
      }

      // Normalize dates
      const normalizedGroomDob = normalizeDate(groomDateOfBirth);
      const normalizedBrideDob = normalizeDate(brideDateOfBirth);
      const normalizedGroomRepDob = normalizeDate(groomRepDateOfBirth);
      const normalizedBrideRepDob = normalizeDate(brideRepDateOfBirth);
      const normalizedWitness1Dob = normalizeDate(witness1DateOfBirth);
      const normalizedWitness2Dob = normalizeDate(witness2DateOfBirth);
      const normalizedSolemnisedDate = normalizeDate(solemnisedDate);
      const normalizedPreferredDate = normalizeDate(preferredDate);
      const normalizedAppointmentDate = normalizeDate(appointmentDate);

      // Handle file uploads - prepare document paths
      const fileFields = {
        groomId: "groom_id_path",
        brideId: "bride_id_path",
        witness1Id: "witness1_id_path",
        witness2Id: "witness2_id_path",
        mahrDeclaration: "mahr_declaration_path",
        civilDivorceDoc: "civil_divorce_doc_path",
        islamicDivorceDoc: "islamic_divorce_doc_path",
        groomConversionCert: "groom_conversion_cert_path",
        brideConversionCert: "bride_conversion_cert_path",
        statutoryDeclaration: "statutory_declaration_path",
      };

      const documentPaths = {};
      for (const [fieldName, dbColumn] of Object.entries(fileFields)) {
        if (files[fieldName] && files[fieldName][0]) {
          documentPaths[
            dbColumn
          ] = `/uploads/documents/${files[fieldName][0].filename}`;
        }
      }

      // Insert Application with retry logic for collision
      console.log("Attempting to insert application for user_id:", userId);
      let insertResult;
      let insertAttempts = 0;
      let finalApplicationNumber = applicationNumber;
      let insertSuccess = false;

      while (!insertSuccess && insertAttempts < 3) {
        try {
          [insertResult] = await connection.execute(
            `INSERT INTO applications (
          application_number, user_id,
          groom_full_name, groom_father_name, groom_date_of_birth, groom_place_of_birth, 
          groom_id_number, groom_address,
          groom_confirm, groom_personally, groom_representative,
          groom_rep_name, groom_rep_father_name, groom_rep_date_of_birth, 
          groom_rep_place_of_birth, groom_rep_address,
          bride_full_name, bride_father_name, bride_date_of_birth, bride_place_of_birth,
          bride_id_number, bride_address,
          bride_confirm, bride_personally, bride_representative,
          bride_rep_name, bride_rep_father_name, bride_rep_date_of_birth,
          bride_rep_place_of_birth, bride_rep_address,
          mahr_amount, mahr_type,
          solemnised_date, solemnised_place, solemnised_address,
          preferred_date, special_requests,
          deposit_amount, deposit_amount_set_by, payment_status,
          appointment_date, appointment_time, appointment_location,
          status,
          groom_id_path, bride_id_path, witness1_id_path, witness2_id_path,
          mahr_declaration_path, civil_divorce_doc_path, islamic_divorce_doc_path,
          groom_conversion_cert_path, bride_conversion_cert_path, statutory_declaration_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              finalApplicationNumber,
              userId,
              groomName || null,
              groomFatherName || null,
              normalizedGroomDob,
              groomPlaceOfBirth || null,
              groomIdNumber || null,
              groomAddress || null,
              groomEmail || portalEmail || null,
              groomConfirm || false,
              groomPersonally || false,
              groomRepresentative || false,
              groomRepName || null,
              groomRepFatherName || null,
              normalizedGroomRepDob,
              groomRepPlaceOfBirth || null,
              groomRepAddress || null,
              brideName || null,
              brideFatherName || null,
              normalizedBrideDob,
              bridePlaceOfBirth || null,
              brideIdNumber || null,
              brideAddress || null,
              brideConfirm || false,
              bridePersonally || false,
              brideRepresentative || false,
              brideRepName || null,
              brideRepFatherName || null,
              normalizedBrideRepDob,
              brideRepPlaceOfBirth || null,
              brideRepAddress || null,
              mahrAmount || null,
              mahrType || null,
              normalizedSolemnisedDate,
              solemnisedPlace || null,
              solemnisedAddress || null,
              normalizedPreferredDate,
              specialRequests || null,
              depositAmount || 200,
              adminId,
              paymentStatus || "amount_set",
              normalizedAppointmentDate,
              appointmentTime || null,
              appointmentLocation || null,
              status || "completed",
              documentPaths.groom_id_path || null,
              documentPaths.bride_id_path || null,
              documentPaths.witness1_id_path || null,
              documentPaths.witness2_id_path || null,
              documentPaths.mahr_declaration_path || null,
              documentPaths.civil_divorce_doc_path || null,
              documentPaths.islamic_divorce_doc_path || null,
              documentPaths.groom_conversion_cert_path || null,
              documentPaths.bride_conversion_cert_path || null,
              documentPaths.statutory_declaration_path || null,
            ]
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
            // Other database errors, throw to outer catch
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
      console.log("Application created with ID:", applicationId);

      // Insert witnesses with extended fields
      const witnessesData = [
        {
          name: witness1Name,
          fatherName: witness1FatherName,
          dob: normalizedWitness1Dob,
          pob: witness1PlaceOfBirth,
          address: witness1Address,
        },
        {
          name: witness2Name,
          fatherName: witness2FatherName,
          dob: normalizedWitness2Dob,
          pob: witness2PlaceOfBirth,
          address: witness2Address,
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
                w.name,
                w.fatherName,
                w.dob,
                w.pob,
                w.address,
                i + 1,
              ]
            );
          } catch (witnessError) {
            // If witness insertion fails, rollback and return error
            await connection.rollback();
            connection.release();
            console.error("Error inserting witness:", witnessError);
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
        console.log("Transaction Committed");

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

        // For manual applications: Generate certificate automatically
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

        // Send confirmation email if email is provided
        console.log("📧 ========== EMAIL SENDING PROCESS START ==========");
        console.log(
          "📧 Email sending check - portalEmail:",
          portalEmail,
          "isNewUser:",
          isNewUser,
          "applicationId:",
          applicationId
        );

        if (portalEmail && portalEmail.trim()) {
          try {
            console.log("📧 Email is provided, fetching application data...");
            // Fetch application data for email
            const [appData] = await pool.execute(
              `SELECT id, application_number, groom_full_name, bride_full_name 
               FROM applications WHERE id = ?`,
              [applicationId]
            );

            console.log(
              "📧 Application data fetched:",
              appData.length > 0 ? "Found" : "Not found"
            );
            if (appData.length > 0) {
              console.log("📧 Application data:", {
                id: appData[0].id,
                application_number: appData[0].application_number,
                groom_full_name: appData[0].groom_full_name,
                bride_full_name: appData[0].bride_full_name,
              });
            }

            if (appData.length > 0) {
              const emailData = {
                id: appData[0].id,
                application_number: appData[0].application_number,
                groom_full_name: appData[0].groom_full_name,
                bride_full_name: appData[0].bride_full_name,
                portal_email: portalEmail.trim(),
                portalPassword: isNewUser ? portalPassword : "", // Empty string for existing users (they use their existing password)
                isManualApplication: true, // Flag to indicate this is a manual application
              };

              console.log("📧 Calling sendApplicationConfirmation with data:", {
                id: emailData.id,
                application_number: emailData.application_number,
                portal_email: emailData.portal_email,
                has_portalPassword: !!emailData.portalPassword,
              });

              const emailResult = await sendApplicationConfirmation(emailData);
              console.log(
                "✅ Application confirmation email sent successfully:",
                emailResult
              );
              console.log("✅ Email sent to:", portalEmail);
            } else {
              console.error(
                "❌ Application data not found for email sending, applicationId:",
                applicationId
              );
            }
          } catch (emailError) {
            // Don't fail the request if email fails, just log it
            console.error("❌ ========== EMAIL SENDING FAILED ==========");
            console.error("❌ Error sending confirmation email:", emailError);
            console.error("❌ Error name:", emailError.name);
            console.error("❌ Error message:", emailError.message);
            console.error("❌ Error code:", emailError.code);
            console.error("❌ Error stack:", emailError.stack);
            console.error("❌ Email error details:", {
              message: emailError.message,
              code: emailError.code,
              command: emailError.command,
              response: emailError.response,
              portalEmail: portalEmail,
              applicationId: applicationId,
            });
            console.error("❌ ==========================================");
          }
        } else {
          console.log(
            "⚠️ No email provided or email is empty, skipping email notification"
          );
          console.log("⚠️ portalEmail value:", portalEmail);
        }
        console.log("📧 ========== EMAIL SENDING PROCESS END ==========");

        return res.status(201).json(responseData);
      } catch (commitError) {
        // If commit fails, rollback
        try {
          await connection.rollback();
          console.error(
            "Transaction Rolled Back due to commit error:",
            commitError
          );
        } catch (rollbackError) {
          console.error("Error during rollback:", rollbackError);
        }
        connection.release();
        throw commitError;
      }
    } catch (transactionError) {
      // Rollback transaction if any error occurred
      try {
        // Check if connection is still active before rollback
        if (connection && !connection._fatalError) {
          await connection.rollback();
          console.error("Transaction Rolled Back due to:", transactionError);
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
    console.error("Stack:", error.stack);

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

    res.status(500).json({
      success: false,
      message: "Failed to create application",
      error: error.message,
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
      groomEmail,
      groomIdNumber,
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
      brideEmail,
      brideIdNumber,
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
      witness1Name,
      witness1FatherName,
      witness1DateOfBirth,
      witness1PlaceOfBirth,
      witness1Address,
      witness2Name,
      witness2FatherName,
      witness2DateOfBirth,
      witness2PlaceOfBirth,
      witness2Address,
      // Mahr
      mahrAmount,
      mahrType,
      // Solemnisation
      solemnisedDate,
      solemnisedPlace,
      solemnisedAddress,
      // Contact & Status
      email,
      contactNumber,
      status,
      depositAmount,
      paymentStatus,
      appointmentDate,
      appointmentTime,
      appointmentLocation,
      preferredDate,
      specialRequests,
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
    if (applicationNumber && applicationNumber !== application.application_number) {
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
    const normalizedGroomDob = groomDateOfBirth ? normalizeDate(groomDateOfBirth) : null;
    const normalizedBrideDob = brideDateOfBirth ? normalizeDate(brideDateOfBirth) : null;
    const normalizedGroomRepDob = groomRepDateOfBirth ? normalizeDate(groomRepDateOfBirth) : null;
    const normalizedBrideRepDob = brideRepDateOfBirth ? normalizeDate(brideRepDateOfBirth) : null;
    const normalizedWitness1Dob = witness1DateOfBirth ? normalizeDate(witness1DateOfBirth) : null;
    const normalizedWitness2Dob = witness2DateOfBirth ? normalizeDate(witness2DateOfBirth) : null;
    const normalizedSolemnisedDate = solemnisedDate ? normalizeDate(solemnisedDate) : null;
    const normalizedPreferredDate = preferredDate ? normalizeDate(preferredDate) : null;
    const normalizedAppointmentDate = appointmentDate ? normalizeDate(appointmentDate) : null;

    // Handle file uploads - only update if new files are provided
    const fileFields = {
      groomId: "groom_id_path",
      brideId: "bride_id_path",
      witness1Id: "witness1_id_path",
      witness2Id: "witness2_id_path",
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
    if (mahrType !== undefined) {
      updateFields.push("mahr_type = ?");
      updateValues.push(mahrType || null);
    }

    // Solemnisation
    if (normalizedSolemnisedDate !== undefined) {
      updateFields.push("solemnised_date = ?");
      updateValues.push(normalizedSolemnisedDate);
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
    if (normalizedAppointmentDate !== undefined) {
      updateFields.push("appointment_date = ?");
      updateValues.push(normalizedAppointmentDate);
    }
    if (appointmentTime !== undefined) {
      updateFields.push("appointment_time = ?");
      updateValues.push(appointmentTime || null);
    }
    if (appointmentLocation !== undefined) {
      updateFields.push("appointment_location = ?");
      updateValues.push(appointmentLocation || null);
    }
    if (normalizedPreferredDate !== undefined) {
      updateFields.push("preferred_date = ?");
      updateValues.push(normalizedPreferredDate);
    }
    if (specialRequests !== undefined) {
      updateFields.push("special_requests = ?");
      updateValues.push(specialRequests || null);
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
    const updateQuery = `UPDATE applications SET ${updateFields.join(", ")} WHERE id = ?`;
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
        await pool.execute(
          "UPDATE users SET email = ? WHERE id = ?",
          [email, application.user_id]
        );
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
    if (witness1Name !== undefined || witness2Name !== undefined) {
      // Get existing witnesses
      const [existingWitnesses] = await pool.execute(
        "SELECT * FROM witnesses WHERE application_id = ? ORDER BY id",
        [id]
      );

      // Update or insert witness 1
      if (witness1Name !== undefined) {
        if (existingWitnesses[0]) {
          await pool.execute(
            `UPDATE witnesses SET 
              witness_name = ?, witness_father_name = ?, witness_date_of_birth = ?, 
              witness_place_of_birth = ?, witness_address = ?
            WHERE id = ?`,
            [
              witness1Name || null,
              witness1FatherName || null,
              normalizedWitness1Dob,
              witness1PlaceOfBirth || null,
              witness1Address || null,
              existingWitnesses[0].id,
            ]
          );
        } else {
          await pool.execute(
            `INSERT INTO witnesses (application_id, witness_name, witness_father_name, witness_date_of_birth, witness_place_of_birth, witness_address, witness_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              witness1Name || null,
              witness1FatherName || null,
              normalizedWitness1Dob,
              witness1PlaceOfBirth || null,
              witness1Address || null,
              1,
            ]
          );
        }
      }

      // Update or insert witness 2
      if (witness2Name !== undefined) {
        if (existingWitnesses[1]) {
          await pool.execute(
            `UPDATE witnesses SET 
              witness_name = ?, witness_father_name = ?, witness_date_of_birth = ?, 
              witness_place_of_birth = ?, witness_address = ?
            WHERE id = ?`,
            [
              witness2Name || null,
              witness2FatherName || null,
              normalizedWitness2Dob,
              witness2PlaceOfBirth || null,
              witness2Address || null,
              existingWitnesses[1].id,
            ]
          );
        } else {
          await pool.execute(
            `INSERT INTO witnesses (application_id, witness_name, witness_father_name, witness_date_of_birth, witness_place_of_birth, witness_address, witness_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              witness2Name || null,
              witness2FatherName || null,
              normalizedWitness2Dob,
              witness2PlaceOfBirth || null,
              witness2Address || null,
              2,
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

module.exports = {
  adminLogin,
  getAllApplications,
  getApplicationById,
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
};
