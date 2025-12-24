const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'applicant' or 'admin'

    let table = 'applications';
    let emailField = 'portal_email';
    
    if (type === 'admin') {
      table = 'users';
      emailField = 'email';
    }

    const [rows] = await pool.execute(
      `SELECT * FROM ${table} WHERE ${emailField} = ?`,
      [email]
    );

    if (rows.length === 0) {
      // Return success even if email not found to prevent enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    const user = rows[0];
    
    // Generate Reset Token (Random Bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save hash of token to DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await pool.execute(
      `UPDATE ${table} SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
      [hashedToken, resetTokenExpiry, user.id]
    );

    // Send Email with UNHASHED token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // User type in link path if needed, or query param
    const userTypePath = type === 'admin' ? '/admin' : '/applicant';
    const resetLink = `${frontendUrl}${userTypePath}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(email, resetLink);

    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.'
    });

  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, type } = req.body;

    let table = 'applications';
    let passwordField = 'portal_password';
    
    if (type === 'admin') {
      table = 'users';
      passwordField = 'password';
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [rows] = await pool.execute(
      `SELECT * FROM ${table} WHERE reset_token = ? AND reset_token_expiry > NOW()`,
      [hashedToken]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const user = rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await pool.execute(
      `UPDATE ${table} SET ${passwordField} = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword
};
