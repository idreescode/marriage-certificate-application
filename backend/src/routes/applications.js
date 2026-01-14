const express = require('express');
const router = express.Router();
const { submitApplication } = require('../controllers/applicationController');
const { pool } = require('../config/database');
const { verifyApiToken } = require('../middleware/auth');

// POST /api/applications - Submit new application (requires API token)
router.post('/', verifyApiToken, submitApplication);

//GET /api/applications/:id/status - Get application status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const [applications] = await pool.execute(
      'SELECT id, application_number, payment_completed, status FROM applications WHERE id = ?',
      [id]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    res.json({ success: true, data: applications[0] });
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status' });
  }
});

module.exports = router;
