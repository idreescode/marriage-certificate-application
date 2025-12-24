const { pool } = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendPaymentVerifiedEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');

// Create Payment Intent
// Create Checkout Session
const createPaymentIntent = async (req, res) => {
  try {
    const applicationId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT deposit_amount, status FROM applications WHERE id = ?',
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = rows[0];

    if (!application.deposit_amount || application.deposit_amount <= 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount is not set' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'pkr', // Changed to PKR as per dashboard display, or 'usd' if Stripe requires
            product_data: {
              name: 'Marriage Certificate Deposit',
              description: `Application Ref: ${applicationId}`,
            },
            unit_amount: Math.round(application.deposit_amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/applicant/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/applicant/dashboard?payment_cancelled=true`,
      metadata: {
        applicationId: applicationId.toString(),
      },
      customer_email: req.user.email, // If we have email in user token
    });

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
};

// Verify Session / Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    const applicationId = req.user.id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not paid' });
    }

    if (session.metadata.applicationId !== applicationId.toString()) {
      return res.status(403).json({ success: false, message: 'Invalid application ID match' });
    }

    // Retrieve receipt URL if possible (payment_intent -> charge)
    let receiptUrl = null;
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      if (paymentIntent.latest_charge) {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        receiptUrl = charge.receipt_url;
      }
    }

    if (session.payment_status === 'paid') {
      await pool.execute(
        `UPDATE applications 
         SET payment_status = 'verified',
             status = 'payment_verified',
             payment_receipt_url = ?,
             payment_verified_at = NOW()
         WHERE id = ?`,
        [receiptUrl || 'stripe_checkout_paid', applicationId]
      );

      // Get application details for email/notification
      const [appRows] = await pool.execute('SELECT * FROM applications WHERE id = ?', [applicationId]);
      if(appRows.length > 0) {
         const app = appRows[0];
         await sendPaymentVerifiedEmail(app);

         // Notify Applicant
         await createNotification({
            applicationId,
            role: 'applicant',
            type: 'payment_verified',
            title: 'Payment Verified',
            message: 'Your payment has been successfully verified. Please wait for appointment scheduling.'
         });

         // Notify Admin
         await createNotification({
            applicationId,
            role: 'admin',
            type: 'payment_received',
            title: 'Payment Received',
            message: `Payment received for Application #${app.application_number}`
         });
      }
      
      return res.json({ success: true, message: 'Payment verified successfully' });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment
};
