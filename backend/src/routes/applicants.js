const express = require('express');
const router = express.Router();
const { verifyToken, verifyApplicant } = require('../middleware/auth');
const { uploadReceipt } = require('../middleware/upload');
const {
  getDashboard,
  uploadReceipt: uploadReceiptController,
  skipPayment,
  chooseToPay,
  downloadCertificate,
  requestBankDetails
} = require('../controllers/applicantController');

// POST /api/applicants/login - REMOVED (Use /api/auth/login)

// Protected routes (requires authentication)
router.use(verifyToken);
router.use(verifyApplicant);

// GET /api/applicants/dashboard - Get dashboard data
router.get('/dashboard', getDashboard);

// POST /api/applicants/upload-receipt - Upload payment receipt
router.post('/upload-receipt', uploadReceipt.single('receipt'), uploadReceiptController);

// POST /api/applicants/skip-payment - Skip payment
router.post('/skip-payment', skipPayment);

// POST /api/applicants/choose-to-pay - Choose to pay (set payment_choice = true)
router.post('/choose-to-pay', chooseToPay);

// POST /api/applicants/request-bank-details - Request bank transfer details
router.post('/request-bank-details', requestBankDetails);

// GET /api/applicants/certificate - Download certificate
router.get('/certificate', downloadCertificate);

// POST /api/applicants/upload-documents - REMOVED (Documents no longer required)

module.exports = router;
