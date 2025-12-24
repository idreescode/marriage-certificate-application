const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// Protect all payment routes
router.use(verifyToken);

router.post('/create-checkout-session', createPaymentIntent); // Controller function name is still createPaymentIntent (refactored internally) or I should have renamed it.
// Actually I should check if I renamed the controller export or just the internal function. 
// In the previous step I kept `const createPaymentIntent = async ...` so the export is `createPaymentIntent`.
// But semantically it creates a session now.
router.post('/verify-session', confirmPayment);

module.exports = router;
