const fs = require('fs');
const path = require('path');
const { transporter } = require('../config/email');
const { pool } = require('../config/database');
const { formatDate, formatCurrency } = require('../utils/helpers');

// Get logo URL - uses frontend URL where logo (2).png is hosted
const getLogoUrl = () => {
  let frontendUrl;
  if (process.env.FRONTEND_URL) {
    frontendUrl = process.env.FRONTEND_URL;
  } else if (process.env.NODE_ENV === "development") {
    frontendUrl = "http://localhost:5173";
  } else {
    frontendUrl = "https://nikahapp.jamiyat.org";
  }
  // Remove trailing slash to prevent double slashes
  frontendUrl = frontendUrl.replace(/\/+$/, "");
  // URL encode the filename to handle spaces
  return `${frontendUrl}/logo%20(2).png`;
};

// Template helper function
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates/email', templateName);
  return fs.readFileSync(templatePath, 'utf8');
};

const renderTemplate = (templateName, data) => {
  let template = loadTemplate(templateName);
  // Always include logo_url in the data
  const templateData = {
    logo_url: getLogoUrl(),
    ...data
  };
  // Replace all placeholders {{key}} with values from data object
  Object.keys(templateData).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, templateData[key] || '');
  });
  return template;
};

// Get admin emails from database (with fallback to environment variable)
const getAdminEmails = async () => {
  try {
    // Try to get from database first
    const [rows] = await pool.execute(
      "SELECT setting_value FROM settings WHERE setting_key = 'admin_emails'"
    );
    
    if (rows.length > 0 && rows[0].setting_value) {
      const adminEmails = rows[0].setting_value;
      // Split by comma, trim whitespace, and filter out empty strings
      return adminEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);
    }
  } catch (error) {
    console.error('Error getting admin emails from database:', error);
  }
  
  // Fallback to environment variable
  const adminEmails = process.env.ADMIN_EMAILS || 'admin@jamiyat.org';
  // Split by comma, trim whitespace, and filter out empty strings
  return adminEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);
};

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
  console.log("📧 sendApplicationConfirmation called with data:", {
    id: applicationData?.id,
    application_number: applicationData?.application_number,
    portal_email: applicationData?.portal_email,
    has_portalPassword: !!applicationData?.portalPassword,
  });

  const {
    application_number,
    groom_full_name,
    bride_full_name,
    portal_email,
    portalPassword,
    id,
  } = applicationData;

  // Validate required fields
  if (!portal_email) {
    const error = new Error(
      "portal_email is required for sending application confirmation email"
    );
    console.error("❌ Email validation error:", error.message);
    throw error;
  }

  if (!application_number) {
    const error = new Error(
      "application_number is required for sending application confirmation email"
    );
    console.error("❌ Email validation error:", error.message);
    throw error;
  }

  if (!process.env.EMAIL_USER) {
    const error = new Error("EMAIL_USER environment variable is not set");
    console.error("❌ Email configuration error:", error.message);
    throw error;
  }

  console.log("📧 Preparing email template...");
  const isManualApplication = applicationData.isManualApplication || false;

  // Different email content based on application type
  let templateData;

  if (isManualApplication) {
    // Admin manually created - Application is already complete
    templateData = {
      application_number,
      groom_full_name: groom_full_name || "N/A",
      bride_full_name: bride_full_name || "N/A",
      portal_email,
      portalPassword: portalPassword || "",
      frontend_url: process.env.FRONTEND_URL || "",
      email_user: process.env.EMAIL_USER,
      application_status: "Completed",
      status_bg_color: "#d1fae5", // Green background
      status_text_color: "#065f46", // Dark green text
      main_message:
        "Your nikah certificate application has been successfully received and is now complete.",
      password_display: portalPassword
        ? portalPassword
        : "Use your existing password",
      show_password_row: portalPassword ? "true" : "false",
      next_steps_section:
        '<h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Application Complete</h3><p style="font-size: 15px; color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">Your nikah certificate application has been processed and is now complete. You can log into your portal to view your certificate and application details.</p>',
    };
  } else {
    // User submitted - Application is under review
    templateData = {
      application_number,
      groom_full_name: groom_full_name || "N/A",
      bride_full_name: bride_full_name || "N/A",
      portal_email,
      portalPassword: portalPassword || "",
      frontend_url: process.env.FRONTEND_URL || "",
      email_user: process.env.EMAIL_USER,
      application_status: "Under Review",
      status_bg_color: "#fff7ed", // Orange/amber background
      status_text_color: "#c2410c", // Dark orange text
      main_message:
        "Your nikah certificate application has been successfully received. Our team will review your application and verify your documents.",
      password_display: portalPassword
        ? portalPassword
        : "Use your existing password",
      show_password_row: portalPassword ? "true" : "false",
      next_steps_section:
        '<h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Next Steps</h3><p style="font-size: 15px; color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">Please upload all required documents through your portal. Once your documents are verified, you will be notified to proceed with payment. After payment verification, your nikah date will be scheduled.</p>',
    };
  }

  const html = renderTemplate("application-confirmation.html", templateData);

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Application Received - #${application_number}`,
    html,
  };

  console.log("📧 Sending email to:", portal_email);
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully, result:", result.messageId);
    if (id) {
      await logEmail(
        id,
        "application_confirmation",
        portal_email,
        mailOptions.subject,
        "sent"
      );
    }
    console.log("✅ Application confirmation email sent to:", portal_email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    if (id) {
      await logEmail(
        id,
        "application_confirmation",
        portal_email,
        mailOptions.subject,
        "failed"
      );
    }
    // Re-throw the error so the caller knows it failed
    throw error;
  }
};

// 2. Deposit Amount Set Email
const sendDepositAmountEmail = async (applicationData) => {
  const { application_number, groom_full_name, bride_full_name, portal_email, deposit_amount, id } = applicationData;

  const html = renderTemplate('deposit-amount.html', {
    application_number,
    groom_full_name,
    bride_full_name,
    deposit_amount: formatCurrency(deposit_amount),
    frontend_url: process.env.FRONTEND_URL
  });

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Payment Required - #${application_number}`,
    html
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
const sendReceiptUploadedNotification = async (applicationData) => {
  const { application_number, groom_full_name, bride_full_name, id } = applicationData;
  const adminEmails = await getAdminEmails();

  const html = renderTemplate('admin-payment-receipt.html', {
    application_number,
    groom_full_name,
    bride_full_name,
    application_id: id,
    frontend_url: process.env.FRONTEND_URL
  });

  const mailOptions = {
    from: `"Jamiyat.org System" <${process.env.EMAIL_USER}>`,
    to: adminEmails.join(', '),
    subject: `Payment Receipt Received - #${application_number}`,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent to:', adminEmails.join(', '));
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }
};

// 4. Payment Verified Email
const sendPaymentVerifiedEmail = async (applicationData) => {
  const { application_number, groom_full_name, portal_email, id } = applicationData;

  const html = renderTemplate('payment-verified.html', {
    application_number,
    groom_full_name
  });

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Payment Verified - #${application_number}`,
    html
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

  const html = renderTemplate('appointment-scheduled.html', {
    application_number,
    groom_full_name,
    appointment_date: formatDate(appointment_date),
    appointment_time,
    appointment_location
  });

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Your Nikah Appointment - ${formatDate(appointment_date)}`,
    html
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

  const html = renderTemplate('certificate-ready.html', {
    application_number,
    groom_full_name,
    frontend_url: process.env.FRONTEND_URL
  });

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Your Nikah Certificate is Ready - #${application_number}`,
    html
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
const sendBankDetailsRequestEmail = async (applicationData) => {
  const { application_number, groom_full_name, bride_full_name, id } = applicationData;
  const adminEmails = await getAdminEmails();

  const html = renderTemplate('admin-bank-details.html', {
    application_number,
    groom_full_name,
    bride_full_name,
    application_id: id,
    frontend_url: process.env.FRONTEND_URL
  });

  const mailOptions = {
    from: `"Jamiyat.org System" <${process.env.EMAIL_USER}>`,
    to: adminEmails.join(', '),
    subject: `Bank Details Requested - #${application_number}`,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    // Log for each admin email
    for (const email of adminEmails) {
      await logEmail(id, 'bank_details_requested', email, mailOptions.subject, 'sent');
    }
    console.log('✅ Bank details request sent to:', adminEmails.join(', '));
  } catch (error) {
    console.error('❌ Error sending bank details request:', error);
  }
};

// 8. Admin New Application Notification
const sendAdminNewApplicationEmail = async (applicationData) => {
  const { id } = applicationData;
  const adminEmails = await getAdminEmails();

  // Fetch full application data from database
  const [applications] = await pool.execute(
    'SELECT * FROM applications WHERE id = ?',
    [id]
  );

  if (applications.length === 0) {
    console.error('Application not found for email:', id);
    return;
  }

  const application = applications[0];

  // Fetch witnesses
  const [witnesses] = await pool.execute(
    'SELECT * FROM witnesses WHERE application_id = ? ORDER BY witness_order',
    [id]
  );

  // Format dates
  const formatDateForEmail = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return date;
    }
  };

    const html = renderTemplate('admin-new-application.html', {
    application_number: application.application_number,
    groom_full_name: application.groom_full_name || 'N/A',
    groom_father_name: application.groom_father_name || 'N/A',
    groom_date_of_birth: formatDateForEmail(application.groom_date_of_birth),
    groom_place_of_birth: application.groom_place_of_birth || 'N/A',
    groom_id_number: application.groom_id_number || 'N/A',
    groom_address: application.groom_address || 'N/A',
    groom_confirm: application.groom_confirm ? 'Yes' : 'No',
    groom_personally: application.groom_personally ? 'Yes' : 'No',
    groom_representative: application.groom_representative ? 'Yes' : 'No',
    groom_rep_name: application.groom_rep_name || 'N/A',
    groom_rep_father_name: application.groom_rep_father_name || 'N/A',
    groom_rep_date_of_birth: formatDateForEmail(application.groom_rep_date_of_birth),
    groom_rep_place_of_birth: application.groom_rep_place_of_birth || 'N/A',
    groom_rep_address: application.groom_rep_address || 'N/A',
    bride_full_name: application.bride_full_name || 'N/A',
    bride_father_name: application.bride_father_name || 'N/A',
    bride_date_of_birth: formatDateForEmail(application.bride_date_of_birth),
    bride_place_of_birth: application.bride_place_of_birth || 'N/A',
    bride_id_number: application.bride_id_number || 'N/A',
    bride_address: application.bride_address || 'N/A',
    bride_confirm: application.bride_confirm ? 'Yes' : 'No',
    bride_personally: application.bride_personally ? 'Yes' : 'No',
    bride_representative: application.bride_representative ? 'Yes' : 'No',
    bride_rep_name: application.bride_rep_name || 'N/A',
    bride_rep_father_name: application.bride_rep_father_name || 'N/A',
    bride_rep_date_of_birth: formatDateForEmail(application.bride_rep_date_of_birth),
    bride_rep_place_of_birth: application.bride_rep_place_of_birth || 'N/A',
    bride_rep_address: application.bride_rep_address || 'N/A',
    mahr_amount: application.mahr_amount || 'N/A',
    mahr_type: application.mahr_type || 'N/A',
    solemnised_date: formatDateForEmail(application.solemnised_date),
    solemnised_place: application.solemnised_place || 'N/A',
    solemnised_address: application.solemnised_address || 'N/A',
    witness1_name: witnesses[0]?.witness_name || 'N/A',
    witness1_father_name: witnesses[0]?.witness_father_name || 'N/A',
    witness1_date_of_birth: formatDateForEmail(witnesses[0]?.witness_date_of_birth),
    witness1_place_of_birth: witnesses[0]?.witness_place_of_birth || 'N/A',
    witness1_address: witnesses[0]?.witness_address || 'N/A',
    witness2_name: witnesses[1]?.witness_name || 'N/A',
    witness2_father_name: witnesses[1]?.witness_father_name || 'N/A',
    witness2_date_of_birth: formatDateForEmail(witnesses[1]?.witness_date_of_birth),
    witness2_place_of_birth: witnesses[1]?.witness_place_of_birth || 'N/A',
    witness2_address: witnesses[1]?.witness_address || 'N/A',
    application_id: id,
    frontend_url: process.env.FRONTEND_URL
  });

  const mailOptions = {
    from: `"Jamiyat.org System" <${process.env.EMAIL_USER}>`,
    to: adminEmails.join(', '),
    subject: `New Application Received - #${application.application_number}`,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent for new application to:', adminEmails.join(', '));
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }
};

// 9. Password Reset Email
const sendPasswordResetEmail = async (email, resetLink) => {
  const html = renderTemplate('password-reset.html', {
    reset_link: resetLink
  });

  const mailOptions = {
    from: `"Jamiyat.org Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reset Your Password`,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
  }
};

// 10. Application Under Review Email (to user - no password)
const sendApplicationUnderReviewEmail = async (applicationData) => {
  const {
    application_number,
    groom_full_name,
    bride_full_name,
    portal_email,
    id,
  } = applicationData;

  if (!portal_email) {
    console.error("portal_email is required for sending application under review email");
    return;
  }

  if (!application_number) {
    console.error("application_number is required for sending application under review email");
    return;
  }

  const html = renderTemplate('application-under-review.html', {
    application_number,
    groom_full_name: groom_full_name || "N/A",
    bride_full_name: bride_full_name || "N/A",
    portal_email,
    frontend_url: process.env.FRONTEND_URL || "",
    email_user: process.env.EMAIL_USER,
  });

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Application Under Review - #${application_number}`,
    html,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    if (id) {
      await logEmail(
        id,
        "application_under_review",
        portal_email,
        mailOptions.subject,
        "sent"
      );
    }
    console.log('✅ Application under review email sent to:', portal_email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending application under review email:', error);
    if (id) {
      await logEmail(
        id,
        "application_under_review",
        portal_email,
        mailOptions.subject,
        "failed"
      );
    }
    throw error;
  }
};

// 11. Application Approved Email (to user - with password)
const sendApplicationApprovedEmail = async (applicationData) => {
  const {
    application_number,
    groom_full_name,
    bride_full_name,
    portal_email,
    portalPassword,
    id,
  } = applicationData;

  if (!portal_email) {
    console.error("portal_email is required for sending application approved email");
    return;
  }

  if (!application_number) {
    console.error("application_number is required for sending application approved email");
    return;
  }

  if (!portalPassword) {
    console.error("portalPassword is required for sending application approved email");
    return;
  }

  const html = renderTemplate('application-approved.html', {
    application_number,
    groom_full_name: groom_full_name || "N/A",
    bride_full_name: bride_full_name || "N/A",
    portal_email,
    portalPassword,
    frontend_url: process.env.FRONTEND_URL || "",
    email_user: process.env.EMAIL_USER,
  });

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: portal_email,
    subject: `Application Approved - #${application_number}`,
    html,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    if (id) {
      await logEmail(
        id,
        "application_approved",
        portal_email,
        mailOptions.subject,
        "sent"
      );
    }
    console.log('✅ Application approved email sent to:', portal_email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending application approved email:', error);
    if (id) {
      await logEmail(
        id,
        "application_approved",
        portal_email,
        mailOptions.subject,
        "failed"
      );
    }
    throw error;
  }
};

// 12. Admin Credentials Email
const sendAdminCredentialsEmail = async (adminData) => {
  const {
    email,
    full_name,
    password,
  } = adminData;

  if (!email) {
    console.error("email is required for sending admin credentials email");
    throw new Error("email is required");
  }

  if (!full_name) {
    console.error("full_name is required for sending admin credentials email");
    throw new Error("full_name is required");
  }

  if (!password) {
    console.error("password is required for sending admin credentials email");
    throw new Error("password is required");
  }

  const html = renderTemplate('admin-credentials.html', {
    email,
    full_name,
    password,
    frontend_url: process.env.FRONTEND_URL || "",
    email_user: process.env.EMAIL_USER,
  });

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Admin Account Created - Welcome to Jamiyat Admin Portal`,
    html,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Admin credentials email sent to:', email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending admin credentials email:', error);
    throw error;
  }
};

// 13. User Updated Email
const sendUserUpdatedEmail = async (userData) => {
  const {
    email,
    full_name,
    password_changed,
    new_password,
    email_changed,
    new_email,
    name_changed,
    new_full_name,
    role_changed,
    new_role,
  } = userData;

  if (!email) {
    console.error("email is required for sending user updated email");
    throw new Error("email is required");
  }

  if (!full_name) {
    console.error("full_name is required for sending user updated email");
    throw new Error("full_name is required");
  }

  // Build updated fields HTML
  let updatedFields = "";
  if (email_changed && new_email) {
    updatedFields += `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Email:</td>
        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500; word-break: break-all;">${new_email}</td>
      </tr>
    `;
  }
  if (password_changed && new_password) {
    updatedFields += `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">New Password:</td>
        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">${new_password}</td>
      </tr>
    `;
  }
  if (name_changed && new_full_name) {
    updatedFields += `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Full Name:</td>
        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${new_full_name}</td>
      </tr>
    `;
  }
  if (role_changed && new_role) {
    updatedFields += `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Role:</td>
        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${new_role}</td>
      </tr>
    `;
  }

  // Build security notices HTML
  let securityNotices = "";
  if (password_changed && new_password) {
    securityNotices += `
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 25px;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.6;">
              <strong>Security Notice:</strong> Your password has been changed. Please save this new password securely. We recommend changing it after your next login for security purposes.
            </p>
          </td>
        </tr>
      </table>
    `;
  }
  if (email_changed && new_email) {
    securityNotices += `
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 25px;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.6;">
              <strong>Email Change:</strong> Your login email has been updated. Please use your new email address (${new_email}) to log in to your account.
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  const html = renderTemplate('user-updated.html', {
    email: email_changed ? new_email : email,
    full_name: name_changed ? new_full_name : full_name,
    updated_fields: updatedFields || '<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">No specific changes listed.</td></tr>',
    security_notices: securityNotices,
    frontend_url: process.env.FRONTEND_URL || "",
    email_user: process.env.EMAIL_USER,
  });

  const mailOptions = {
    from: `"Jamiyat.org Nikah Services" <${process.env.EMAIL_USER}>`,
    to: email_changed ? new_email : email, // Send to new email if changed, otherwise old email
    subject: `Account Updated - Jamiyat Admin Portal`,
    html,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ User updated email sent to:', email_changed ? new_email : email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending user updated email:', error);
    throw error;
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
  sendPasswordResetEmail,
  sendApplicationUnderReviewEmail,
  sendApplicationApprovedEmail,
  sendAdminCredentialsEmail,
  sendUserUpdatedEmail
};
