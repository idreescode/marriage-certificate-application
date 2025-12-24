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
    const portalPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(portalPassword, 10);

    // Insert application
    const [result] = await pool.execute(
      `INSERT INTO applications (
        application_number, 
        groom_full_name, groom_date_of_birth, groom_address, groom_phone, groom_email, groom_id_number,
        bride_full_name, bride_date_of_birth, bride_address, bride_phone, bride_email, bride_id_number,
        preferred_date, special_requests, portal_email, portal_password, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin_review')`,
      [
        applicationNumber,
        groomFullName, groomDateOfBirth, groomAddress, groomPhone, groomEmail, groomIdNumber,
        brideFullName, brideDateOfBirth, brideAddress, bridePhone, brideEmail, brideIdNumber,
        preferredDate, specialRequests, portalEmail, hashedPassword
      ]
    );

    const applicationId = result.insertId;

    // Insert witnesses
    if (witnesses && witnesses.length > 0) {
      for (let i = 0; i < witnesses.length; i++) {
        const witness = witnesses[i];
        await pool.execute(
          'INSERT INTO witnesses (application_id, witness_name, witness_phone, witness_email, witness_order) VALUES (?, ?, ?, ?, ?)',
          [applicationId, witness.name, witness.phone, witness.email, i + 1]
        );
      }
    }

    // Send confirmation email
    const applicationData = {
      id: applicationId,
      application_number: applicationNumber,
      groom_full_name: groomFullName,
      bride_full_name: brideFullName,
      portal_email: portalEmail,
      portalPassword: portalPassword
    };
    
    // Send emails in parallel
    await Promise.all([
      sendApplicationConfirmation(applicationData),
      sendAdminNewApplicationEmail(applicationData)
    ]);

    // Create In-App Notification for Admin
    await createNotification({
      applicationId,
      role: 'admin',
      type: 'new_application',
      title: 'New Application Received',
      message: `New marriage application #${applicationNumber} from ${groomFullName} & ${brideFullName}`
    });
    
    // -----------------------------------------------------
    // DEVELOPMENT LOG: Credentials for testing since email might fail
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

  } catch (error) {
    console.error('Error submitting application:', error);
    
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
