const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized - Invalid token' 
    });
  }
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied - Admin role required' 
    });
  }
  next();
};

// Middleware to verify applicant
const verifyApplicant = (req, res, next) => {
  if (!req.user || req.user.role !== 'applicant') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied - Applicant access only' 
    });
  }
  next();
};

// Middleware to verify API token (for public endpoints like application submission)
const verifyApiToken = (req, res, next) => {
  // Check for token in X-API-Token header or Authorization header
  const apiToken = req.headers['x-api-token'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiToken) {
    return res.status(401).json({ 
      success: false, 
      message: 'API token required. Please provide X-API-Token header.' 
    });
  }

  // Get the expected API token from environment variable
  const expectedToken = process.env.API_TOKEN;

  if (!expectedToken) {
    console.error('⚠️  API_TOKEN not configured in environment variables');
    return res.status(500).json({ 
      success: false, 
      message: 'Server configuration error' 
    });
  }

  // Validate the token
  if (apiToken !== expectedToken) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid API token' 
    });
  }

  // Token is valid, proceed
  next();
};

module.exports = { verifyToken, verifyAdmin, verifyApplicant, verifyApiToken };
