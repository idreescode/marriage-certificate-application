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
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
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

module.exports = { verifyToken, verifyAdmin, verifyApplicant };
