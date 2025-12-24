const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateApplicationNumber, generatePassword } = require('../utils/helpers');
const { sendApplicationConfirmation, sendAdminNewApplicationEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');
const { body, validationResult } = require('express-validator');

// Submit New Application
const submitApplication = async (req, res) => {
  try {
    const {
      groomFullName, groomDateOfBirth, groomAddress, groomPhone, groomEmail, groomIdNumber,
      brideFullName, brideDateOfBirth, brideAddress, bridePhone, brideEmail, brideIdNumber,
      witnesses, preferredDate, specialRequests
    } = req.body;

    // Generate unique application number
    const applicationNumber = generateApplicationNumber();
    
    // Generate portal credentials
    const portalEmail = groomEmail.toLowerCase();
    
    // Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [portalEmail]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please login to apply.'
      });
    }

    const portalPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(portalPassword, 10);

    // GET CONNECTION FOR TRANSACTION
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Create User
      console.log('Attempting to create user:', portalEmail);
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, "applicant", ?)',
        [portalEmail, hashedPassword, groomFullName]
      );
      const userId = userResult.insertId;
      console.log('User created with ID:', userId);

      // 2. Insert Application (linked to user_id)
      console.log('Attempting to insert application for user_id:', userId);
      const [result] = await connection.execute(
        `INSERT INTO applications (
          application_number, user_id,
          groom_full_name, groom_date_of_birth, groom_address, groom_phone, groom_email, groom_id_number,
          bride_full_name, bride_date_of_birth, bride_address, bride_phone, bride_email, bride_id_number,
          preferred_date, special_requests, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin_review')`,
        [
          applicationNumber, userId,
          groomFullName, groomDateOfBirth, groomAddress, groomPhone, groomEmail, groomIdNumber,
          brideFullName, brideDateOfBirth, brideAddress, bridePhone, brideEmail, brideIdNumber,
          preferredDate, specialRequests
        ]
      );

      const applicationId = result.insertId;
      console.log('Application created with ID:', applicationId);

      // Insert witnesses
      if (witnesses && witnesses.length > 0) {
        for (let i = 0; i < witnesses.length; i++) {
          const witness = witnesses[i];
          await connection.execute(
            'INSERT INTO witnesses (application_id, witness_name, witness_phone, witness_email, witness_order) VALUES (?, ?, ?, ?, ?)',
            [applicationId, witness.name, witness.phone, witness.email, i + 1]
          );
        }
      }
      
      // COMMIT TRANSACTION
      await connection.commit();
      console.log('Transaction Committed');

      // Send confirmation email (Outside transaction so it doesn't block or rollback DB if email fails)
      // Note: If email fails, the application is still saved. This is preferred.
      const applicationData = {
        id: applicationId,
        application_number: applicationNumber,
        groom_full_name: groomFullName,
        bride_full_name: brideFullName,
        portal_email: portalEmail,
        portalPassword: portalPassword
      };
      
      // Send emails in parallel
      Promise.all([
        sendApplicationConfirmation(applicationData),
        sendAdminNewApplicationEmail(applicationData)
      ]).catch(err => console.error('Background Email Error:', err)); // Don't crash request

      // Create In-App Notification (Also outside strict transaction or inside? Better inside, but keeping it simple for now)
      // Actually notifications should probably be in transaction logs? 
      // Let's call it here.
      try {
        await createNotification({
            applicationId,
            role: 'admin',
            type: 'new_application',
            title: 'New Application Received',
            message: `New marriage application #${applicationNumber} from ${groomFullName} & ${brideFullName}`
        });
      } catch (notifErr) {
        console.error('Notification Error:', notifErr);
      }

      // -----------------------------------------------------
      // DEVELOPMENT LOG
      console.log('\nExample Credentials for Last Submission:');
      console.log('Email:', portalEmail);
      console.log('Password:', portalPassword);
      console.log('-----------------------------------------------------\n');
      // -----------------------------------------------------

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationNumber,
          portalEmail,
          applicationId
        }
      });

    } catch (transactionError) {
      await connection.rollback();
      console.error('Transaction Rolled Back due to:', transactionError);
      throw transactionError; // Re-throw to be caught by outer catch
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
