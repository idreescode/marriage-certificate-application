const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  console.log('📧 Testing Email Configuration...');
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`User: ${process.env.EMAIL_USER}`);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    console.log('🔄 Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection confirmed!');

    console.log('🔄 Sending test email...');
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Test Email from Marriage System',
      text: 'If you receive this, your email configuration is working correctly! 🎉'
    });
    console.log('✅ Test email sent successfully!');
    
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    console.log('');
    console.log('👉 Tips:');
    console.log('1. Are you using Gmail? You MUST use an "App Password", not your login password.');
    console.log('2. Go to: Google Account > Security > 2-Step Verification > App Passwords');
    console.log('3. Create new app password and paste it in backend/.env');
  }
};

testEmail();
