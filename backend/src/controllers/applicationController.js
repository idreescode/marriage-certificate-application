const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");
const {
  generateApplicationNumber,
  generateSequentialRegistrationNumber,
  generatePassword,
  normalizeDate,
  normalizeTime,
} = require("../utils/helpers");
const {
  sendApplicationConfirmation,
  sendAdminNewApplicationEmail,
  sendApplicationUnderReviewEmail,
} = require("../services/emailService");
const { createNotification } = require("./notificationController");
const { body, validationResult } = require("express-validator");

// Submit New Application
const submitApplication = async (req, res) => {
  try {
    // DEBUG: See what frontend is actually sending
    console.log("===== COMPLETE REQUEST BODY =====");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("=================================");

    // Convert array format to object format
    // Frontend sends: { data: [{ name: "groomName", value: "..." }, ...] }
    // WordPress sends: { "form_data[0][name]": "groomName", "form_data[0][value]": "...", ... }
    // We need: { groomName: "...", ... }
    let formData = {};
    
    // Check if WordPress format (flat keys like form_data[0][name])
    const hasWordPressFormat = Object.keys(req.body).some(key => 
      typeof key === 'string' && key.startsWith('form_data[') && key.includes('][name]')
    );
    
    if (hasWordPressFormat) {
      // WordPress format: flat keys in req.body like "form_data[0][name]", "form_data[0][value]"
      const indices = new Set();
      
      // Collect all indices from form_data keys
      Object.keys(req.body).forEach(key => {
        const match = key.match(/form_data\[(\d+)\]\[(name|value)\]/);
        if (match) {
          indices.add(parseInt(match[1]));
        }
      });
      
      // Build formData object from form_data[index][name] and form_data[index][value]
      indices.forEach(index => {
        const nameKey = `form_data[${index}][name]`;
        const valueKey = `form_data[${index}][value]`;
        const fieldName = req.body[nameKey];
        const fieldValue = req.body[valueKey];
        
        if (fieldName) {
          // Handle duplicate fields - keep the last non-empty value
          if (fieldValue && String(fieldValue).trim() !== '') {
            formData[fieldName] = fieldValue;
          } else if (!formData[fieldName]) {
            formData[fieldName] = fieldValue || null;
          }
        }
      });
    } else if (req.body.data && Array.isArray(req.body.data)) {
      req.body.data.forEach((item) => {
        formData[item.name] = item.value || null;
      });
    } else {
      // If data is already in object format, use it directly
      formData = req.body;
    }

    console.log("===== CONVERTED FORM DATA =====");
    console.log(JSON.stringify(formData, null, 2));
    console.log("=================================");

    // Map WordPress field names to backend field names
    // Witness fields mapping
    if (formData.mawitness1Name) formData.witness1MaleName = formData.mawitness1Name;
    if (formData.mawitness1FatherName) formData.witness1MaleFatherName = formData.mawitness1FatherName;
    if (formData.mawitness1DateOfBirth) formData.witness1MaleDateOfBirth = formData.mawitness1DateOfBirth;
    if (formData.mawitness1PlaceOfBirth) formData.witness1MalePlaceOfBirth = formData.mawitness1PlaceOfBirth;
    if (formData.mawitness1Address) formData.witness1MaleAddress = formData.mawitness1Address;

    if (formData.mawitness2Name) formData.witness2MaleName = formData.mawitness2Name;
    if (formData.mawitness2FatherName) formData.witness2MaleFatherName = formData.mawitness2FatherName;
    if (formData.mawitness2DateOfBirth) formData.witness2MaleDateOfBirth = formData.mawitness2DateOfBirth;
    if (formData.mawitness2PlaceOfBirth) formData.witness2MalePlaceOfBirth = formData.mawitness2PlaceOfBirth;
    if (formData.mawitness2Address) formData.witness2MaleAddress = formData.mawitness2Address;

    if (formData.fewitness1Name) formData.witness1FemaleName = formData.fewitness1Name;
    if (formData.fewitness1FatherName) formData.witness1FemaleFatherName = formData.fewitness1FatherName;
    if (formData.fewitness1DateOfBirth) formData.witness1FemaleDateOfBirth = formData.fewitness1DateOfBirth;
    if (formData.fewitness1PlaceOfBirth) formData.witness1FemalePlaceOfBirth = formData.fewitness1PlaceOfBirth;
    if (formData.fewitness1Address) formData.witness1FemaleAddress = formData.fewitness1Address;

    if (formData.fewitness2Name) formData.witness2FemaleName = formData.fewitness2Name;
    if (formData.fewitness2FatherName) formData.witness2FemaleFatherName = formData.fewitness2FatherName;
    if (formData.fewitness2DateOfBirth) formData.witness2FemaleDateOfBirth = formData.fewitness2DateOfBirth;
    if (formData.fewitness2PlaceOfBirth) formData.witness2FemalePlaceOfBirth = formData.fewitness2PlaceOfBirth;
    if (formData.fewitness2Address) formData.witness2FemaleAddress = formData.fewitness2Address;

    // Handle groomRepresentativePersonally field
    if (formData.groomRepresentativePersonally) {
      const value = formData.groomRepresentativePersonally.toLowerCase().trim();
      if (value === 'personally') {
        formData.groomPersonally = true;
        formData.groomRepresentative = false;
      } else if (value === 'representative') {
        formData.groomPersonally = false;
        formData.groomRepresentative = true;
      }
    }

    // Handle brideRepresentativePersonally field
    if (formData.brideRepresentativePersonally) {
      const value = formData.brideRepresentativePersonally.toLowerCase().trim();
      if (value === 'personally') {
        formData.bridePersonally = true;
        formData.brideRepresentative = false;
      } else if (value === 'representative') {
        formData.bridePersonally = false;
        formData.brideRepresentative = true;
      }
    }

    // Handle groomConfirm and brideConfirm (convert "Yes" to true)
    if (formData.groomConfirm === "Yes" || formData.groomConfirm === "yes") {
      formData.groomConfirm = true;
    } else if (formData.groomConfirm === "" || !formData.groomConfirm) {
      formData.groomConfirm = false;
    }

    if (formData.brideConfirm === "Yes" || formData.brideConfirm === "yes") {
      formData.brideConfirm = true;
    } else if (formData.brideConfirm === "" || !formData.brideConfirm) {
      formData.brideConfirm = false;
    }

    // Extract data from converted formData object
    // Groom
    const groomName = formData.groomName || null;
    const groomFatherName = formData.groomFatherName || null;
    const groomDateOfBirth = normalizeDate(formData.groomDateOfBirth);
    const groomPlaceOfBirth = formData.groomPlaceOfBirth || null;
    const groomIdNumber = formData.groomIdNumber || null;
    const groomAddress = formData.groomAddress || null;
    // Normalize marital status to lowercase
    const groomMaritalStatus = formData.groomMaritalStatus 
      ? String(formData.groomMaritalStatus).toLowerCase().trim() 
      : null;
    const groomConfirm = formData.groomConfirm || false;
    const groomPersonally = formData.groomPersonally || false;
    const groomRepresentative = formData.groomRepresentative || false;

    // Groom Representative
    const groomRepName = formData.groomRepName || null;
    const groomRepFatherName = formData.groomRepFatherName || null;
    const groomRepDateOfBirth = normalizeDate(formData.groomRepDateOfBirth);
    const groomRepPlaceOfBirth = formData.groomRepPlaceOfBirth || null;
    const groomRepAddress = formData.groomRepAddress || null;

    // Bride
    const brideName = formData.brideName || null;
    const brideFatherName = formData.brideFatherName || null;
    const brideDateOfBirth = normalizeDate(formData.brideDateOfBirth);
    const bridePlaceOfBirth = formData.bridePlaceOfBirth || null;
    const brideIdNumber = formData.brideIdNumber || null;
    const brideAddress = formData.brideAddress || null;
    // Normalize marital status to lowercase
    const brideMaritalStatus = formData.brideMaritalStatus 
      ? String(formData.brideMaritalStatus).toLowerCase().trim() 
      : null;
    const brideConfirm = formData.brideConfirm || false;
    const bridePersonally = formData.bridePersonally || false;
    const brideRepresentative = formData.brideRepresentative || false;

    // Bride Representative
    const brideRepName = formData.brideRepName || null;
    const brideRepFatherName = formData.brideRepFatherName || null;
    const brideRepDateOfBirth = normalizeDate(formData.brideRepDateOfBirth);
    const brideRepPlaceOfBirth = formData.brideRepPlaceOfBirth || null;
    const brideRepAddress = formData.brideRepAddress || null;

    // Witness No 1 (MALE)
    const witness1MaleName = formData.witness1MaleName || null;
    const witness1MaleFatherName = formData.witness1MaleFatherName || null;
    const witness1MaleDateOfBirth = normalizeDate(formData.witness1MaleDateOfBirth);
    const witness1MalePlaceOfBirth = formData.witness1MalePlaceOfBirth || null;
    const witness1MaleAddress = formData.witness1MaleAddress || null;

    // Witness No 1 (FEMALE)
    const witness1FemaleName = formData.witness1FemaleName || null;
    const witness1FemaleFatherName = formData.witness1FemaleFatherName || null;
    const witness1FemaleDateOfBirth = normalizeDate(formData.witness1FemaleDateOfBirth);
    const witness1FemalePlaceOfBirth = formData.witness1FemalePlaceOfBirth || null;
    const witness1FemaleAddress = formData.witness1FemaleAddress || null;

    // Witness No 2 (MALE)
    const witness2MaleName = formData.witness2MaleName || null;
    const witness2MaleFatherName = formData.witness2MaleFatherName || null;
    const witness2MaleDateOfBirth = normalizeDate(formData.witness2MaleDateOfBirth);
    const witness2MalePlaceOfBirth = formData.witness2MalePlaceOfBirth || null;
    const witness2MaleAddress = formData.witness2MaleAddress || null;

    // Witness No 2 (FEMALE)
    const witness2FemaleName = formData.witness2FemaleName || null;
    const witness2FemaleFatherName = formData.witness2FemaleFatherName || null;
    const witness2FemaleDateOfBirth = normalizeDate(formData.witness2FemaleDateOfBirth);
    const witness2FemalePlaceOfBirth = formData.witness2FemalePlaceOfBirth || null;
    const witness2FemaleAddress = formData.witness2FemaleAddress || null;

    // Mahr
    const mahrAmount = formData.mahrAmount || null;

    // Solemnised - expect separate date and time fields
    // WordPress forms should be updated to send solemnisedDate and solemnisedTime separately
    // Handle WordPress time field name: mf-time
    const normalizedSolemnisedDate = formData.solemnisedDate 
      ? normalizeDate(formData.solemnisedDate) 
      : null;
    const normalizedSolemnisedTime = (formData.solemnisedTime || formData['mf-time']) 
      ? normalizeTime(formData.solemnisedTime || formData['mf-time']) 
      : null;
    
    // Debug logging for solemnised_time
    console.log('🔍 Solemnised Time Debug:');
    console.log('  - Raw formData.solemnisedTime:', formData.solemnisedTime);
    console.log('  - Raw formData["mf-time"]:', formData['mf-time']);
    console.log('  - Normalized solemnised_time:', normalizedSolemnisedTime);
    
    // Frontend now sends only solemnisedAddress, use it for both place and address
    const solemnisedAddress = formData.solemnisedAddress || formData.solemnisedPlace || null;
    const solemnisedPlace = formData.solemnisedPlace || formData.solemnisedAddress || null;

    // Contact Information
    const email = formData.email || null;
    const contactNumber = formData.contactnumber || null;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate contact number
    if (!contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Contact number is required",
      });
    }

    // DEBUG: Log date transformations from WordPress
    console.log("===== DATE TRANSFORMATIONS (WordPress → MySQL) =====");
    console.log("Original dates from WordPress:", {
      groomDateOfBirth: formData.groomDateOfBirth,
      groomRepDateOfBirth: formData.groomRepDateOfBirth,
      brideDateOfBirth: formData.brideDateOfBirth,
      brideRepDateOfBirth: formData.brideRepDateOfBirth,
      witness1MaleDateOfBirth: formData.witness1MaleDateOfBirth,
      witness1FemaleDateOfBirth: formData.witness1FemaleDateOfBirth,
      witness2MaleDateOfBirth: formData.witness2MaleDateOfBirth,
      witness2FemaleDateOfBirth: formData.witness2FemaleDateOfBirth,
      solemnisedDate: formData.solemnisedDate,
      solemnisedTime: formData.solemnisedTime,
    });
    console.log("Normalized dates (MySQL format YYYY-MM-DD):", {
      groomDateOfBirth,
      groomRepDateOfBirth,
      brideDateOfBirth,
      brideRepDateOfBirth,
      witness1MaleDateOfBirth,
      witness1FemaleDateOfBirth,
      witness2MaleDateOfBirth,
      witness2FemaleDateOfBirth,
      solemnisedDate: normalizedSolemnisedDate,
      solemnisedTime: normalizedSolemnisedTime,
    });
    console.log("====================================================");

    // DEBUG: Log received data
    console.log("Received form data:", {
      groomName,
      brideName,
      witness1MaleName,
      witness1FemaleName,
      witness2MaleName,
      witness2FemaleName,
      mahrAmount,
      solemnisedDate: normalizedSolemnisedDate,
      solemnisedTime: normalizedSolemnisedTime,
      email,
      contactNumber,
    });

    // GET CONNECTION FOR TRANSACTION
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
    } catch (connectionError) {
      console.error("Error acquiring connection or starting transaction:", connectionError);
      throw connectionError;
    }

    try {
      // Generate sequential registration number starting from 1000
      const applicationNumber = await generateSequentialRegistrationNumber(pool);

      // Use the email provided in the form
      const portalEmail = email;
      const portalPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(portalPassword, 10);

      // Check if email already exists
      const [existingUser] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [portalEmail]
      );

      if (existingUser.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists. Please use a different email address.",
        });
      }

      // 1. Create User (inside transaction - will be rolled back if application fails)
      console.log("Creating user with email:", portalEmail);
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, "applicant", ?)',
        [portalEmail, hashedPassword, groomName || "Applicant"]
      );
      const userId = userResult.insertId;
      console.log("User created with ID:", userId);

      // 2. Insert Application (linked to user_id)
      // If this fails, the transaction will rollback and the user will NOT be created
      console.log("Attempting to insert application for user_id:", userId);
      
      // Prepare values array - ensure all values are primitives
      const insertValues = [
        applicationNumber || null,
        userId || null,
        contactNumber || null,
        groomName || null,
        groomFatherName || null,
        groomDateOfBirth || null,
        groomPlaceOfBirth || null,
        groomIdNumber || null,
        groomAddress || null,
        groomMaritalStatus || null,
        Boolean(groomConfirm),
        Boolean(groomPersonally),
        Boolean(groomRepresentative),
        groomRepName || null,
        groomRepFatherName || null,
        groomRepDateOfBirth || null,
        groomRepPlaceOfBirth || null,
        groomRepAddress || null,
        brideName || null,
        brideFatherName || null,
        brideDateOfBirth || null,
        bridePlaceOfBirth || null,
        brideIdNumber || null,
        brideAddress || null,
        brideMaritalStatus || null,
        Boolean(brideConfirm),
        Boolean(bridePersonally),
        Boolean(brideRepresentative),
        brideRepName || null,
        brideRepFatherName || null,
        brideRepDateOfBirth || null,
        brideRepPlaceOfBirth || null,
        brideRepAddress || null,
        mahrAmount || null,
        normalizedSolemnisedDate || null,
        normalizedSolemnisedTime || null,
        solemnisedPlace || null,
        solemnisedAddress || null,
        "pending_admin_review", // payment_status default for user-submitted applications
        "admin_review", // status value
        witness1MaleName || null,
        witness1MaleFatherName || null,
        witness1MaleDateOfBirth || null,
        witness1MalePlaceOfBirth || null,
        witness1MaleAddress || null,
        witness1FemaleName || null,
        witness1FemaleFatherName || null,
        witness1FemaleDateOfBirth || null,
        witness1FemalePlaceOfBirth || null,
        witness1FemaleAddress || null,
        witness2MaleName || null,
        witness2MaleFatherName || null,
        witness2MaleDateOfBirth || null,
        witness2MalePlaceOfBirth || null,
        witness2MaleAddress || null,
        witness2FemaleName || null,
        witness2FemaleFatherName || null,
        witness2FemaleDateOfBirth || null,
        witness2FemalePlaceOfBirth || null,
        witness2FemaleAddress || null,
      ];
      
      // Ensure all values are primitives (not arrays or objects)
      const sanitizedValues = insertValues.map(val => {
        if (val === undefined) return null;
        if (Array.isArray(val)) {
          console.warn("Warning: Array value found in insertValues:", val);
          return null;
        }
        if (typeof val === 'object' && val !== null) {
          console.warn("Warning: Object value found in insertValues:", val);
          return null;
        }
        return val;
      });
      
      // Debug: Log the count and values
      console.log("Insert values count:", sanitizedValues.length);
      console.log("Expected columns: 60");
      console.log("First 10 values:", sanitizedValues.slice(0, 10));
      
      // Count placeholders in SQL
      const sqlPlaceholders = `?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?`.match(/\?/g);
      const placeholderCount = sqlPlaceholders ? sqlPlaceholders.length : 0;
      console.log("SQL placeholder count:", placeholderCount);
      
      if (sanitizedValues.length !== placeholderCount) {
        // Rollback transaction before throwing error
        await connection.rollback();
        connection.release();
        throw new Error(`Mismatch: ${sanitizedValues.length} values but ${placeholderCount} placeholders`);
      }
      
      const [result] = await connection.execute(
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
          payment_status, status,
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
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        sanitizedValues
      );

      const applicationId = result.insertId;
      console.log("Application created with ID:", applicationId);

      // Automatically calculate and set deposit amount (revenue) from default_deposit_amount setting
      try {
        const [settingRows] = await connection.execute(
          "SELECT setting_value FROM settings WHERE setting_key = 'default_deposit_amount'",
          []
        );
        
        if (settingRows.length > 0 && settingRows[0].setting_value) {
          const depositAmountStr = settingRows[0].setting_value;
          const depositAmount = parseFloat(depositAmountStr);
          
          if (!isNaN(depositAmount) && depositAmount > 0) {
            // Update deposit_amount automatically based on default_deposit_amount
            await connection.execute(
              `UPDATE applications 
               SET deposit_amount = ?,
                   deposit_amount_set_at = NOW(),
                   payment_status = 'amount_set'
               WHERE id = ?`,
              [depositAmount, applicationId]
            );
            console.log(`✅ Deposit amount calculated automatically: £${depositAmount} (from default_deposit_amount setting)`);
          } else {
            console.log("⚠️ default_deposit_amount setting exists but is not a valid positive number");
          }
        } else {
          console.log("ℹ️ default_deposit_amount setting not found, deposit_amount will be set manually by admin");
        }
      } catch (revenueError) {
        // Don't fail the transaction if revenue calculation fails
        console.error("Error calculating deposit amount automatically:", revenueError);
      }

      // Insert witnesses with extended fields
      const witnessesData = [
        {
          name: witness1MaleName,
          fatherName: witness1MaleFatherName,
          dob: witness1MaleDateOfBirth,
          pob: witness1MalePlaceOfBirth,
          address: witness1MaleAddress,
        },
        {
          name: witness1FemaleName,
          fatherName: witness1FemaleFatherName,
          dob: witness1FemaleDateOfBirth,
          pob: witness1FemalePlaceOfBirth,
          address: witness1FemaleAddress,
        },
        {
          name: witness2MaleName,
          fatherName: witness2MaleFatherName,
          dob: witness2MaleDateOfBirth,
          pob: witness2MalePlaceOfBirth,
          address: witness2MaleAddress,
        },
        {
          name: witness2FemaleName,
          fatherName: witness2FemaleFatherName,
          dob: witness2FemaleDateOfBirth,
          pob: witness2FemalePlaceOfBirth,
          address: witness2FemaleAddress,
        },
      ];

      for (let i = 0; i < witnessesData.length; i++) {
        const w = witnessesData[i];
        if (w.name) {
          // Only insert if witness name is provided
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
        }
      }

      // COMMIT TRANSACTION
      await connection.commit();
      console.log("Transaction Committed");

      // Prepare application data for emails
      const applicationData = {
        id: applicationId,
        application_number: applicationNumber,
        groom_full_name: groomName,
        bride_full_name: brideName,
        groom_marital_status: groomMaritalStatus,
        bride_marital_status: brideMaritalStatus,
        portal_email: portalEmail,
        portalPassword: portalPassword,
        isManualApplication: false, // Regular user submission
      };

      // Send emails in parallel (non-blocking)
      // 1. Send "under review" email to user (no password)
      // 2. Send notification email to admin
      Promise.all([
        sendApplicationUnderReviewEmail(applicationData),
        sendAdminNewApplicationEmail(applicationData),
      ]).catch((err) => console.error("Background Email Error:", err));

      // Create In-App Notification
      try {
        await createNotification({
          applicationId,
          role: "admin",
          type: "new_application",
          title: "New Application Received",
          message: `New marriage application #${applicationNumber} from ${groomName} & ${brideName}`,
        });
      } catch (notifErr) {
        console.error("Notification Error:", notifErr);
      }

      // DEVELOPMENT LOG - Credentials sent via email
      console.log("\n" + "=".repeat(60));
      console.log("✅ APPLICATION SUBMITTED SUCCESSFULLY");
      console.log("=".repeat(60));
      console.log("📧 Confirmation email sent to:", portalEmail);
      console.log("🔗 Application Number:", applicationNumber);
      console.log("🔐 Password sent via email");
      console.log("=".repeat(60) + "\n");

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: {
          applicationNumber,
          applicationId,
        },
      });
    } catch (transactionError) {
      // Rollback transaction - this will undo user creation if application insertion failed
      if (connection) {
        try {
          await connection.rollback();
          console.error("Transaction Rolled Back due to:", transactionError);
          console.error("User creation has been rolled back - no user was created");
        } catch (rollbackError) {
          console.error("Error during rollback:", rollbackError);
        }
      }
      throw transactionError;
    } finally {
      // Always release the connection, even if there was an error
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Error submitting application:", error);
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
      message: "Failed to submit application",
      error: error.message,
    });
  }
};

module.exports = {
  submitApplication,
};
