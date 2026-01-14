const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateApplicationNumber, generatePassword, convertDateToMySQL } = require('../utils/helpers');
const { sendApplicationConfirmation, sendAdminNewApplicationEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');
const { body, validationResult } = require('express-validator');

// Submit New Application
const submitApplication = async (req, res) => {
  try {
    // DEBUG: See what frontend is actually sending
    console.log('===== COMPLETE REQUEST BODY =====');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('=================================');

    // Convert array format to object format
    // Frontend sends: { data: [{ name: "groomName", value: "..." }, ...] }
    // We need: { groomName: "...", ... }
    let formData = {};
    if (req.body.data && Array.isArray(req.body.data)) {
      req.body.data.forEach(item => {
        formData[item.name] = item.value || null;
      });
    } else {
      // If data is already in object format, use it directly
      formData = req.body;
    }

    console.log('===== CONVERTED FORM DATA =====');
    console.log(JSON.stringify(formData, null, 2));
    console.log('=================================');

    // Extract data from converted formData object
    // Groom
    const groomName = formData.groomName || null;
    const groomFatherName = formData.groomFatherName || null;
    const groomDateOfBirth = convertDateToMySQL(formData.groomDateOfBirth);
    const groomPlaceOfBirth = formData.groomPlaceOfBirth || null;
    const groomIdNumber = formData.groomIdNumber || null;
    const groomAddress = formData.groomAddress || null;
    const groomConfirm = formData.groomConfirm || false;
    const groomPersonally = formData.groomPersonally || false;
    const groomRepresentative = formData.groomRepresentative || false;

    // Groom Representative
    const groomRepName = formData.groomRepName || null;
    const groomRepFatherName = formData.groomRepFatherName || null;
    const groomRepDateOfBirth = convertDateToMySQL(formData.groomRepDateOfBirth);
    const groomRepPlaceOfBirth = formData.groomRepPlaceOfBirth || null;
    const groomRepAddress = formData.groomRepAddress || null;

    // Bride
    const brideName = formData.brideName || null;
    const brideFatherName = formData.brideFatherName || null;
    const brideDateOfBirth = convertDateToMySQL(formData.brideDateOfBirth);
    const bridePlaceOfBirth = formData.bridePlaceOfBirth || null;
    const brideIdNumber = formData.brideIdNumber || null;
    const brideAddress = formData.brideAddress || null;
    const brideConfirm = formData.brideConfirm || false;
    const bridePersonally = formData.bridePersonally || false;
    const brideRepresentative = formData.brideRepresentative || false;

    // Bride Representative
    const brideRepName = formData.brideRepName || null;
    const brideRepFatherName = formData.brideRepFatherName || null;
    const brideRepDateOfBirth = convertDateToMySQL(formData.brideRepDateOfBirth);
    const brideRepPlaceOfBirth = formData.brideRepPlaceOfBirth || null;
    const brideRepAddress = formData.brideRepAddress || null;

    // Witness 1
    const witness1Name = formData.witness1Name || null;
    const witness1FatherName = formData.witness1FatherName || null;
    const witness1DateOfBirth = convertDateToMySQL(formData.witness1DateOfBirth);
    const witness1PlaceOfBirth = formData.witness1PlaceOfBirth || null;
    const witness1Address = formData.witness1Address || null;

    // Witness 2
    const witness2Name = formData.witness2Name || null;
    const witness2FatherName = formData.witness2FatherName || null;
    const witness2DateOfBirth = convertDateToMySQL(formData.witness2DateOfBirth);
    const witness2PlaceOfBirth = formData.witness2PlaceOfBirth || null;
    const witness2Address = formData.witness2Address || null;

    // Mahr
    const mahrAmount = formData.mahrAmount || null;
    const mahrType = formData.mahrType || null;

    // Solemnised
    const solemnisedDate = convertDateToMySQL(formData.solemnisedDate);
    const solemnisedPlace = formData.solemnisedPlace || null;
    const solemnisedAddress = formData.solemnisedAddress || null;

    // Contact Information
    const email = formData.email || null;
    const contactNumber = formData.contactnumber || null;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate contact number
    if (!contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Contact number is required'
      });
    }

    // DEBUG: Log received data
    console.log('Received form data:', {
      groomName,
      brideName,
      witness1Name,
      witness2Name,
      mahrAmount,
      solemnisedDate,
      email,
      contactNumber
    });

    // Generate unique application number
    const applicationNumber = generateApplicationNumber();

    // Use the email provided in the form
    const portalEmail = email;
    const portalPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(portalPassword, 10);

    // GET CONNECTION FOR TRANSACTION
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if email already exists
      const [existingUser] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [portalEmail]
      );

      if (existingUser.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please use a different email address.'
        });
      }

      // 1. Create User
      console.log('Creating user with email:', portalEmail);
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, "applicant", ?)',
        [portalEmail, hashedPassword, groomName || 'Applicant']
      );
      const userId = userResult.insertId;
      console.log('User created with ID:', userId);

      // 2. Insert Application (linked to user_id)
      console.log('Attempting to insert application for user_id:', userId);
      const [result] = await connection.execute(
        `INSERT INTO applications (
          application_number, user_id,
          groom_full_name, groom_father_name, groom_date_of_birth, groom_place_of_birth, 
          groom_id_number, groom_address, groom_email, groom_phone,
          groom_confirm, groom_personally, groom_representative,
          groom_rep_name, groom_rep_father_name, groom_rep_date_of_birth, 
          groom_rep_place_of_birth, groom_rep_address,
          bride_full_name, bride_father_name, bride_date_of_birth, bride_place_of_birth,
          bride_id_number, bride_address, bride_email, bride_phone,
          bride_confirm, bride_personally, bride_representative,
          bride_rep_name, bride_rep_father_name, bride_rep_date_of_birth,
          bride_rep_place_of_birth, bride_rep_address,
          mahr_amount, mahr_type,
          solemnised_date, solemnised_place, solemnised_address,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applicationNumber, userId,
          groomName || null, groomFatherName || null, groomDateOfBirth || null, groomPlaceOfBirth || null,
          groomIdNumber || null, groomAddress || null, portalEmail, contactNumber,
          groomConfirm || false, groomPersonally || false, groomRepresentative || false,
          groomRepName || null, groomRepFatherName || null, groomRepDateOfBirth || null,
          groomRepPlaceOfBirth || null, groomRepAddress || null,
          brideName || null, brideFatherName || null, brideDateOfBirth || null, bridePlaceOfBirth || null,
          brideIdNumber || null, brideAddress || null, portalEmail, contactNumber,
          brideConfirm || false, bridePersonally || false, brideRepresentative || false,
          brideRepName || null, brideRepFatherName || null, brideRepDateOfBirth || null,
          brideRepPlaceOfBirth || null, brideRepAddress || null,
          mahrAmount || null, mahrType || null,
          solemnisedDate || null, solemnisedPlace || null, solemnisedAddress || null,
          'admin_review'  // status value
        ]
      );

      const applicationId = result.insertId;
      console.log('Application created with ID:', applicationId);

      // Insert witnesses with extended fields
      const witnessesData = [
        { name: witness1Name, fatherName: witness1FatherName, dob: witness1DateOfBirth, pob: witness1PlaceOfBirth, address: witness1Address },
        { name: witness2Name, fatherName: witness2FatherName, dob: witness2DateOfBirth, pob: witness2PlaceOfBirth, address: witness2Address }
      ];

      for (let i = 0; i < witnessesData.length; i++) {
        const w = witnessesData[i];
        if (w.name) { // Only insert if witness name is provided
          await connection.execute(
            `INSERT INTO witnesses (
              application_id, witness_name, witness_father_name, 
              witness_date_of_birth, witness_place_of_birth, witness_address, 
              witness_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [applicationId, w.name, w.fatherName, w.dob, w.pob, w.address, i + 1]
          );
        }
      }

      // COMMIT TRANSACTION
      await connection.commit();
      console.log('Transaction Committed');

      // Send confirmation email with credentials
      const applicationData = {
        id: applicationId,
        application_number: applicationNumber,
        groom_full_name: groomName,
        bride_full_name: brideName,
        portal_email: portalEmail,
        portalPassword: portalPassword
      };
      
      // Send emails in parallel (non-blocking)
      Promise.all([
        sendApplicationConfirmation(applicationData),
        sendAdminNewApplicationEmail(applicationData)
      ]).catch(err => console.error('Background Email Error:', err));

      // Create In-App Notification
      try {
        await createNotification({
          applicationId,
          role: 'admin',
          type: 'new_application',
          title: 'New Application Received',
          message: `New marriage application #${applicationNumber} from ${groomName} & ${brideName}`
        });
      } catch (notifErr) {
        console.error('Notification Error:', notifErr);
      }

      // DEVELOPMENT LOG - Credentials sent via email
      console.log('\n' + '='.repeat(60));
      console.log('✅ APPLICATION SUBMITTED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log('📧 Confirmation email sent to:', portalEmail);
      console.log('🔗 Application Number:', applicationNumber);
      console.log('🔐 Password sent via email');
      console.log('='.repeat(60) + '\n');

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationNumber,
          applicationId
        }
      });

    } catch (transactionError) {
      await connection.rollback();
      console.error('Transaction Rolled Back due to:', transactionError);
      throw transactionError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error submitting application:', error);
    console.error('Stack:', error.stack);

    // Handle MySQL Duplicate Entry Error
    if (error.code === 'ER_DUP_ENTRY') {
      let message = 'Duplicate entry found.';
      if (error.message.includes('groom_email')) message = 'This Groom Email is already registered.';
      if (error.message.includes('bride_email')) message = 'This Bride Email is already registered.';
      if (error.message.includes('application_number')) message = 'Application number collision, please try again.';
      if (error.message.includes('portal_email')) message = 'An account with this email already exists.';

      return res.status(409).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};



module.exports = {
  submitApplication
};
