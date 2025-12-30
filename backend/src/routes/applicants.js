const express = require('express');
const router = express.Router();
const { verifyToken, verifyApplicant } = require('../middleware/auth');
const { uploadReceipt, uploadDocuments } = require('../middleware/upload');
const {
  getDashboard,
  uploadReceipt: uploadReceiptController,
  downloadCertificate,
  requestBankDetails,
  uploadDocuments: uploadDocumentsController
} = require('../controllers/applicantController');

// POST /api/applicants/login - REMOVED (Use /api/auth/login)

// Protected routes (requires authentication)
router.use(verifyToken);
router.use(verifyApplicant);

// GET /api/applicants/dashboard - Get dashboard data
router.get('/dashboard', getDashboard);

// POST /api/applicants/upload-receipt - Upload payment receipt
router.post('/upload-receipt', uploadReceipt.single('receipt'), uploadReceiptController);

// POST /api/applicants/request-bank-details - Request bank transfer details
router.post('/request-bank-details', requestBankDetails);

// GET /api/applicants/certificate - Download certificate
router.get('/certificate', downloadCertificate);

// POST /api/applicants/upload-documents - Upload application documents
router.post('/upload-documents', uploadDocuments.fields([
  { name: 'groomId', maxCount: 1 },
  { name: 'brideId', maxCount: 1 },
  { name: 'witness1Id', maxCount: 1 },
  { name: 'witness2Id', maxCount: 1 },
  { name: 'mahrDeclaration', maxCount: 1 },
  { name: 'civilDivorceDoc', maxCount: 1 },
  { name: 'islamicDivorceDoc', maxCount: 1 },
  { name: 'groomConversionCert', maxCount: 1 },
  { name: 'brideConversionCert', maxCount: 1 },
  { name: 'statutoryDeclaration', maxCount: 1 }
]), uploadDocumentsController);

module.exports = router;
