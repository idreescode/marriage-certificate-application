const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  adminLogin,
  getAllApplications,
  getApplicationById,
  approveApplication,
  verifyDocuments,
  setDepositAmount,
  verifyPayment,
  scheduleAppointment,
  markComplete,
  generateCertificate,
  updateApplicationNumber,
  deleteApplication,
  createManualApplication,
  updateApplication,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdmin
} = require('../controllers/adminController');
const { uploadDocuments } = require('../middleware/upload');

// POST /api/admin/login - Admin login
router.post('/login', adminLogin);

// Protected routes (requires admin authentication)
router.use(verifyToken);
router.use(verifyAdmin);

// GET /api/admin/applications - Get all applications with filters
router.get('/applications', getAllApplications);

// GET /api/admin/applications/:id - Get application by ID
router.get('/applications/:id', getApplicationById);

// PUT /api/admin/applications/:id/approve - Approve application
router.put('/applications/:id/approve', approveApplication);

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

// PUT /api/admin/applications/:id/application-number - Update application number
router.put('/applications/:id/application-number', updateApplicationNumber);

// PUT /api/admin/applications/:id - Update application
router.put('/applications/:id', 
  uploadDocuments.fields([
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
  ]),
  updateApplication
);

// DELETE /api/admin/applications/:id - Delete application
router.delete('/applications/:id', deleteApplication);

// POST /api/admin/applications/manual - Create application manually (admin only)
router.post('/applications/manual', 
  uploadDocuments.fields([
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
  ]),
  createManualApplication
);

// User Management Routes
// GET /api/admin/users - Get all users
router.get('/users', getAllUsers);

// GET /api/admin/users/:id - Get user by ID
router.get('/users/:id', getUserById);

// POST /api/admin/users - Create new admin user
router.post('/users', createAdmin);

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', deleteUser);

module.exports = router;
