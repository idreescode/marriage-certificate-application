const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { verifyEmailConfig } = require('./config/email');

// Routes
const applicationsRoutes = require('./routes/applications');
const applicantsRoutes = require('./routes/applicants');
const adminRoutes = require('./routes/admin');

const app = express();

/* =========================
   CORS CONFIG (TOP MOST)
========================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://hassaan.kashmirtech.dev",
  "https://www.hassaan.kashmirtech.dev",
  "https://nikahapp.jamiyat.org",
  process.env.CLIENT_URL // Allow frontend URL from env
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // allow requests like Postman / server-side
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// 🔥 MUST for cPanel / reverse proxy
app.options(/(.*)/, cors());

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* =========================
   ROUTES
========================= */

app.use('/api/applications', applicationsRoutes);
app.use('/api/applicants', applicantsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/auth', require('./routes/auth'));

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

const startServer = async () => {
  try {
    await testConnection();
    await verifyEmailConfig();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
};

startServer();
