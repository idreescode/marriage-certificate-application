const { pool } = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendPaymentVerifiedEmail } = require('../services/emailService');

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    const applicationId = req.user.id; // From auth middleware

    // Get application details
    const [rows] = await pool.execute(
      'SELECT deposit_amount, status FROM applications WHERE id = ?',
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = rows[0];

    // Check if deposit amount is set
    if (!application.deposit_amount || application.deposit_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount is not set for this application'
      });
    }

    // Create PaymentIntent
    // Stripe expects amount in cents (integers)
    const amountInCents = Math.round(application.deposit_amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd', // Assuming USD, change as needed
      metadata: {
        applicationId: applicationId.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
};

// Confirm Payment (called after frontend confirmation)
const confirmPayment = async (req, res) => {
  try {
    const applicationId = req.user.id;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required'
      });
    }

    // Verify payment status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Check if metadata matches (security check)
    if (paymentIntent.metadata.applicationId !== applicationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Payment does not belong to this application'
      });
    }

    // Get Receipt URL if available from latest charge
    let receiptUrl = null;
    if (paymentIntent.latest_charge) {
      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
      receiptUrl = charge.receipt_url;
    }

    // Update Application
    // We update payment_status to 'verified' directly or 'paid' waiting for admin?
    // User requested "replacing the current manual payment system".
    // Usually online payments are auto-verified.
    // So distinct from 'manual verification' needed for uploads.
    // I'll set it to 'verified' or 'paid' and status to 'payment_verified'.
    // And store receipt URL.
    
    await pool.execute(
      `UPDATE applications 
       SET payment_status = 'paid',
           status = 'payment_verified',
           payment_receipt_url = ?
       WHERE id = ?`,
      [receiptUrl || 'stripe_online_payment', applicationId]
    );

    // Send email
    // We need logic to send email. adminController uses sendPaymentVerifiedEmail.
    // We should probably reuse that or a new one.
    // fetch app details for email
    const [appRows] = await pool.execute(
       'SELECT * FROM applications WHERE id = ?',
       [applicationId]
    );
    
    if (appRows.length > 0) {
      // Notify Admin? Notify User?
      // `sendPaymentVerifiedEmail` seems to be for User, sent BY Admin.
      // If payment is auto-verified, we should send it.
      await sendPaymentVerifiedEmail(appRows[0]);
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment
};
