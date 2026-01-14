const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  adminLogin,
  getAllApplications,
  getApplicationById,
  verifyDocuments,
  setDepositAmount,
  verifyPayment,
  scheduleAppointment,
  markComplete,
  generateCertificate,
  deleteApplication
} = require('../controllers/adminController');

// POST /api/admin/login - Admin login
router.post('/login', adminLogin);

// Protected routes (requires admin authentication)
router.use(verifyToken);
router.use(verifyAdmin);

// GET /api/admin/applications - Get all applications with filters
router.get('/applications', getAllApplications);

// GET /api/admin/applications/:id - Get application by ID
router.get('/applications/:id', getApplicationById);

// PUT /api/admin/applications/:id/verify-documents - Verify uploaded documents
router.put('/applications/:id/verify-documents', verifyDocuments);

// PUT /api/admin/applications/:id/set-deposit - Set deposit amount
router.put('/applications/:id/set-deposit', setDepositAmount);

// PUT /api/admin/applications/:id/verify-payment - Verify payment
router.put('/applications/:id/verify-payment', verifyPayment);

// PUT /api/admin/applications/:id/schedule-appointment - Schedule appointment
router.put('/applications/:id/schedule-appointment', scheduleAppointment);

// PUT /api/admin/applications/:id/complete - Mark application complete
router.put('/applications/:id/complete', markComplete);

// POST /api/admin/applications/:id/generate-certificate - Generate certificate
router.post('/applications/:id/generate-certificate', generateCertificate);

// DELETE /api/admin/applications/:id - Delete application
router.delete('/applications/:id', deleteApplication);

module.exports = router;
