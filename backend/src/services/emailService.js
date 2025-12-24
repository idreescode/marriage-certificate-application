const { transporter } = require('../config/email');
const { pool } = require('../config/database');
const { formatDate, formatCurrency } = require('../utils/helpers');

// Log email to database
const logEmail = async (applicationId, emailType, recipient, subject, status = 'sent') => {
  try {
    await pool.execute(
      'INSERT INTO email_logs (application_id, email_type, recipient, subject, status) VALUES (?, ?, ?, ?, ?)',
      [applicationId, emailType, recipient, subject, status]
    );
  } catch (error) {
    console.error('Error logging email:', error);
  }
};

// 1. Application Confirmation Email
const sendApplicationConfirmation = async (applicationData) => {
  const { application_number, groom_full_name, bride_full_name, portal_email, portalPassword, id } = applicationData;

  const mailOptions = {
    from: `"Jamiyat.org Marriage Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Application Received - #${application_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #22c55e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">✅ Application Received</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Assalamu Alaikum,</p>
          
          <p>Your marriage certificate application has been successfully received.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">Application Details</h3>
            <p><strong>Application Number:</strong> ${application_number}</p>
            <p><strong>Groom:</strong> ${groom_full_name}</p>
            <p><strong>Bride:</strong> ${bride_full_name}</p>
            <p><strong>Status:</strong> Under Admin Review</p>
          </div>
          
          <div style="background-color: #fffbeb; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #d97706;">Portal Access</h3>
            <p><strong>Email:</strong> ${portal_email}</p>
            <p><strong>Password:</strong> ${portalPassword}</p>
            <p style="font-size: 14px; color: #92400e;">Please save these credentials to access your application portal.</p>
          </div>
          
          <h3 style="color: #16a34a;">Next Steps:</h3>
          <ol style="color: #374151;">
            <li>Our admin team will review your application</li>
            <li>You will receive an email when the payment amount is set</li>
            <li>Log into your portal to track your application status</li>
          </ol>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/applicant/login" 
               style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Access Your Portal
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            If you have any questions, please contact us at ${process.env.EMAIL_USER}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2024 Jamiyat.org | Marriage Certificate Services</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(id, 'application_confirmation', portal_email, mailOptions.subject, 'sent');
    console.log('✅ Application confirmation email sent to:', portal_email);
  } catch (error) {
    await logEmail(id, 'application_confirmation', portal_email, mailOptions.subject, 'failed');
    console.error('❌ Error sending email:', error);
  }
};

// 2. Deposit Amount Set Email
const sendDepositAmountEmail = async (applicationData) => {
  const { application_number, groom_full_name, bride_full_name, portal_email, deposit_amount, id } = applicationData;

  const mailOptions = {
    from: `"Jamiyat.org Marriage Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Payment Amount Set - #${application_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #f59e0b; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">💰 Payment Amount Set</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Assalamu Alaikum ${groom_full_name} & ${bride_full_name},</p>
          
          <p>Your application has been reviewed and the payment amount has been set by our admin team.</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0; color: #1e40af; font-size: 32px;">${formatCurrency(deposit_amount)}</h2>
            <p style="color: #64748b; margin: 5px 0;">Deposit Amount</p>
          </div>
          
          <h3 style="color: #16a34a;">Payment Instructions:</h3>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Bank Transfer Details:</h4>
            <p><strong>Bank Name:</strong> Meezan Bank</p>
            <p><strong>Account Title:</strong> Jamiyat Organization</p>
            <p><strong>Account Number:</strong> 0123456789012</p>
            <p><strong>IBAN:</strong> PK12MEZN0000000123456789</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">After Making Payment:</h4>
            <ol style="color: #374151;">
              <li>Take a screenshot or photo of your payment receipt</li>
              <li>Log into your applicant portal</li>
              <li>Upload the receipt for verification</li>
              <li>Wait for admin verification (1-2 business days)</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/applicant/login" 
               style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Upload Receipt Now
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2024 Jamiyat.org | Marriage Certificate Services</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(id, 'deposit_amount_set', portal_email, mailOptions.subject, 'sent');
    console.log('✅ Deposit amount email sent to:', portal_email);
  } catch (error) {
    await logEmail(id, 'deposit_amount_set', portal_email, mailOptions.subject, 'failed');
    console.error('❌ Error sending email:', error);
  }
};

// 3. Payment Receipt Uploaded (to Admin)
const sendReceiptUploadedNotification = async (applicationData, adminEmail = 'admin@jamiyat.org') => {
  const { application_number, groom_full_name, bride_full_name, id } = applicationData;

  const mailOptions = {
    from: `"Jamiyat.org System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `Payment Receipt Received - #${application_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a;">📄 New Payment Receipt Uploaded</h2>
        <p><strong>Application:</strong> ${application_number}</p>
        <p><strong>Applicant:</strong> ${groom_full_name} & ${bride_full_name}</p>
        <p>A payment receipt has been uploaded and is pending your verification.</p>
        <a href="${process.env.FRONTEND_URL}/admin/applications/${id}" 
           style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
          Review Receipt
        </a>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent');
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }
};

// 4. Payment Verified Email
const sendPaymentVerifiedEmail = async (applicationData) => {
  const { application_number, groom_full_name, portal_email, id } = applicationData;

  const mailOptions = {
    from: `"Jamiyat.org Marriage Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Payment Verified - #${application_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #22c55e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">✅ Payment Verified!</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Assalamu Alaikum ${groom_full_name},</p>
          
          <p>Great news! Your payment has been verified successfully.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0;">
            <p>✅ Payment confirmed</p>
            <p>📅 Your appointment will be scheduled soon</p>
            <p>📧 You'll receive appointment details via email</p>
          </div>
          
          <p>Thank you for your patience. We will contact you shortly with your nikah ceremony appointment details.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(id, 'payment_verified', portal_email, mailOptions.subject, 'sent');
    console.log('✅ Payment verified email sent');
  } catch (error) {
    await logEmail(id, 'payment_verified', portal_email, mailOptions.subject, 'failed');
    console.error('❌ Error sending email:', error);
  }
};

// 5. Appointment Scheduled Email
const sendAppointmentEmail = async (applicationData) => {
  const { application_number, groom_full_name, portal_email, appointment_date, appointment_time, appointment_location, id } = applicationData;

  const mailOptions = {
    from: `"Jamiyat.org Marriage Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Your Nikah Appointment - ${formatDate(appointment_date)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #8b5cf6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">📅 Appointment Scheduled</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Assalamu Alaikum ${groom_full_name},</p>
          
          <p>Your nikah ceremony has been scheduled! Please find the details below:</p>
          
          <div style="background-color: #f5f3ff; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #6b21a8;">Appointment Details</h3>
            <p><strong>📅 Date:</strong> ${formatDate(appointment_date)}</p>
            <p><strong>🕐 Time:</strong> ${appointment_time}</p>
            <p><strong>📍 Location:</strong> ${appointment_location}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">What to Bring:</h4>
            <ul style="color: #374151;">
              <li>Original CNIC/ID cards (Bride & Groom)</li>
              <li>Two witnesses with their CNICs</li>
              <li>Passport size photographs</li>
              <li>Any other documents requested</li>
            </ul>
            <p style="color: #dc2626; font-weight: bold;">⏰ Please arrive 15 minutes early</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(id, 'appointment_scheduled', portal_email, mailOptions.subject, 'sent');
    console.log('✅ Appointment email sent');
  } catch (error) {
    await logEmail(id, 'appointment_scheduled', portal_email, mailOptions.subject, 'failed');
    console.error('❌ Error sending email:', error);
  }
};

// 6. Certificate Ready Email
const sendCertificateReadyEmail = async (applicationData) => {
  const { application_number, groom_full_name, portal_email, id } = applicationData;

  const mailOptions = {
    from: `"Jamiyat.org Marriage Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Your Marriage Certificate is Ready! - #${application_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #16a34a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Certificate Ready!</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Assalamu Alaikum ${groom_full_name},</p>
          
          <p>Congratulations! Your Marriage Certificate has been generated and is ready for download.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0; text-align: center;">
            <h3 style="color: #16a34a; margin-top: 0;">✅ Application Completed</h3>
            <p>Application Number: <strong>${application_number}</strong></p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/applicant/certificate" 
               style="background-color: #22c55e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
              📄 Download Certificate
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            You can download your certificate anytime by logging into your applicant portal.
          </p>
          
          <p style="margin-top: 20px;">Thank you for using our services. May Allah bless your marriage!</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(id, 'certificate_ready', portal_email, mailOptions.subject, 'sent');
    console.log('✅ Certificate ready email sent');
  } catch (error) {
    await logEmail(id, 'certificate_ready', portal_email, mailOptions.subject, 'failed');
    console.error('❌ Error sending email:', error);
  }
};

// 7. Send Bank Details Request Notification to Admin
const sendBankDetailsRequestEmail = async (applicationData, adminEmail = 'admin@jamiyat.org') => {
  const { application_number, groom_full_name, bride_full_name, id } = applicationData;

  const mailOptions = {
    from: `"Jamiyat.org System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `Bank Details Requested - #${application_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">🏦 Bank Details Requested</h2>
        <p><strong>Application:</strong> ${application_number}</p>
        <p><strong>Applicant:</strong> ${groom_full_name} & ${bride_full_name}</p>
        <p>The applicant has requested to pay via Bank Transfer. Please send them the bank details.</p>
        <a href="${process.env.FRONTEND_URL}/admin/applications/${id}" 
           style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
          View Application
        </a>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(id, 'bank_details_requested', adminEmail, mailOptions.subject, 'sent');
    console.log('✅ Bank details request sent to admin');
  } catch (error) {
    console.error('❌ Error sending bank details request:', error);
  }
};

// 8. Admin New Application Notification
const sendAdminNewApplicationEmail = async (applicationData, adminEmail = 'admin@jamiyat.org') => {
  const { application_number, groom_full_name, bride_full_name, id } = applicationData;

  const mailOptions = {
    from: `"Jamiyat.org System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `New Application Received - #${application_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #3b82f6; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: white; margin: 0;">🆕 New Application</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Application:</strong> ${application_number}</p>
          <p><strong>Applicants:</strong> ${groom_full_name} & ${bride_full_name}</p>
          <p>A new marriage certificate application has been submitted.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/admin/applications/${id}" 
               style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Application
            </a>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent for new application');
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }
};

// 9. Password Reset Email
const sendPasswordResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: `"Jamiyat.org Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reset Your Password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Reset Your Password</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">This link will expire in 1 hour.</p>
        <p style="font-size: 14px; color: #6b7280;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
  }
};

module.exports = {
  sendApplicationConfirmation,
  sendDepositAmountEmail,
  sendReceiptUploadedNotification,
  sendPaymentVerifiedEmail,
  sendAppointmentEmail,
  sendCertificateReadyEmail,
  sendBankDetailsRequestEmail,
  sendAdminNewApplicationEmail,
  sendPasswordResetEmail
};
