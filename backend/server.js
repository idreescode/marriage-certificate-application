const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// âœ… FIXED PATHS (because server.js is now in backend root)
const { testConnection } = require('./src/config/database');
const { verifyEmailConfig } = require('./src/config/email');

// Routes
const applicationsRoutes = require('./src/routes/applications');
const applicantsRoutes = require('./src/routes/applicants');
const adminRoutes = require('./src/routes/admin');

const app = express();

/* =========================
   CORS CONFIG
========================= */

const allowedOrigins = [
  'https://nikahapp.jamiyat.org',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Manual CORS middleware (works better with cPanel/Apache reverse proxy)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (!origin || allowedOrigins.includes(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-API-Token');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight request from:', origin);
    return res.status(204).end();
  }
  
  console.log('📨 Request:', req.method, req.path, 'from:', origin);
  next();
});

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads (adjust if uploads folder location differs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   ROUTES
========================= */

app.use('/api/applications', applicationsRoutes);
app.use('/api/applicants', applicantsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/payment', require('./src/routes/payment'));
app.use('/api/auth', require('./src/routes/auth'));

/* =========================
   HEALTH CHECK
========================= */

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    time: new Date().toISOString()
  });
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Test database connection
  await testConnection();
  
  // Verify email configuration
  await verifyEmailConfig();
});
