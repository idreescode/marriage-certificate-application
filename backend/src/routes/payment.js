const express = require('express');
const router = express.Router();
// const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// Protect all payment routes
router.use(verifyToken);

// Online payment disabled - only bank transfer is available
router.post('/create-checkout-session', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Online payment is disabled. Please use bank transfer instead.',
  });
});

router.post('/verify-session', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Online payment is disabled. Please use bank transfer instead.',
  });
});

// Keep original routes commented for potential future use:
// router.post('/create-checkout-session', createPaymentIntent);
// router.post('/verify-session', confirmPayment);

module.exports = router;
