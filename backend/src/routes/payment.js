const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
} = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// Protect all payment routes
router.use(verifyToken);

// Online payment via Stripe Checkout
router.post('/create-checkout-session', createPaymentIntent);
router.post('/verify-session', confirmPayment);

module.exports = router;
