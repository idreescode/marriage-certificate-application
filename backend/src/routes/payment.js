const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// Protect all payment routes
router.use(verifyToken);

router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-payment', confirmPayment);

module.exports = router;
