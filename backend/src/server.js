const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { verifyEmailConfig } = require('./config/email');

// Import routes
const applicationsRoutes = require('./routes/applications');
const applicantsRoutes = require('./routes/applicants');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/applications', applicationsRoutes);
app.use('/api/applicants', applicantsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', require('./routes/payment'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Marriage Certificate API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Verify email configuration
    await verifyEmailConfig();

    // Start listening
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🚀 Marriage Certificate API Server');
      console.log('='.repeat(50));
      console.log(`📡 Server running on port: ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`🔥 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
