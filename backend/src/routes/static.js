const express = require('express');
const path = require('path');

const router = express.Router();

// Serve uploaded files (certificates, receipts, etc.)
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

module.exports = router;
