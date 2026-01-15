const { pool } = require("../config/database");
// Initialize Stripe only if a valid key is provided
let stripe = null;
if (
  process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes("placeholder")
) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}
const { sendPaymentVerifiedEmail } = require("../services/emailService");
const { createNotification } = require("./notificationController");

// Helper function to get frontend URL based on environment
const getFrontendUrl = () => {
  let url;
  // If FRONTEND_URL is explicitly set, use it
  if (process.env.FRONTEND_URL) {
    url = process.env.FRONTEND_URL;
  } else if (process.env.NODE_ENV === "development") {
    // Otherwise, determine based on NODE_ENV
    url = "http://localhost:5173";
  } else {
    // Default to production URL
    url = "https://nikahapp.jamiyat.org";
  }
  // Remove trailing slash to prevent double slashes in URL construction
  return url.replace(/\/+$/, "");
};

// Create Payment Intent
// Create Checkout Session
const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message:
          "Payment system is not configured. Please contact administrator.",
      });
    }
    const userId = req.user.id; // Correct: users.id

    const [rows] = await pool.execute(
      "SELECT id, deposit_amount, status FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)",
      [userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    const application = rows[0];
    const applicationId = application.id;

    if (!application.deposit_amount || application.deposit_amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Deposit amount is not set" });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp", // Using GBP (British Pounds) as per requirements
            product_data: {
              name: "Marriage Certificate Deposit",
              description: `Application Ref: ${applicationId}`,
            },
            unit_amount: Math.round(application.deposit_amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${getFrontendUrl()}/applicant/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getFrontendUrl()}/applicant/dashboard?payment_cancelled=true`,
      metadata: {
        applicationId: applicationId.toString(),
      },
      customer_email: req.user.email, // If we have email in user token
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

// Verify Session / Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message:
          "Payment system is not configured. Please contact administrator.",
      });
    }
    const userId = req.user.id;
    // We need key application details to verify ownership?
    // Actually, we can just get the application ID from the user's record to compare.
    const [appRows] = await pool.execute(
      "SELECT id FROM applications WHERE user_id = ? AND (is_deleted = FALSE OR is_deleted IS NULL)",
      [userId]
    );

    if (appRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }
    const applicationId = appRows[0].id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not paid" });
    }

    if (session.metadata.applicationId !== applicationId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid application ID match" });
    }

    // Retrieve receipt URL if possible (payment_intent -> charge)
    let receiptUrl = null;
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent
      );
      if (paymentIntent.latest_charge) {
        const charge = await stripe.charges.retrieve(
          paymentIntent.latest_charge
        );
        receiptUrl = charge.receipt_url;
      }
    }

    if (session.payment_status === "paid") {
      await pool.execute(
        `UPDATE applications 
         SET payment_status = 'verified',
             status = 'payment_verified',
             payment_receipt_url = ?,
             payment_verified_at = NOW()
         WHERE id = ?`,
        [receiptUrl || "stripe_checkout_paid", applicationId]
      );

      // Get application details for email/notification
      const [appRows] = await pool.execute(
        `SELECT a.*, u.email as portal_email 
         FROM applications a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.id = ? AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)`,
        [applicationId]
      );
      if (appRows.length > 0) {
        const app = appRows[0];
        await sendPaymentVerifiedEmail(app);

        // Notify Applicant
        await createNotification({
          applicationId,
          role: "applicant",
          type: "payment_verified",
          title: "Payment Verified",
          message:
            "Your payment has been successfully verified. Please wait for appointment scheduling.",
        });

        // Notify Admin
        await createNotification({
          applicationId,
          role: "admin",
          type: "payment_received",
          title: "Payment Received",
          message: `Payment received for Application #${app.application_number}`,
        });
      }

      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
};
