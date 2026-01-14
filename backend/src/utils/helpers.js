// Generate unique application number
const generateApplicationNumber = () => {
  const prefix = 'JAM';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Generate random password for portal access
const generatePassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Convert date from MM-DD-YYYY to YYYY-MM-DD format (MySQL format)
const convertDateToMySQL = (dateString) => {
  if (!dateString) return null;
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Try to parse MM-DD-YYYY format
  const mmddyyyyMatch = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse other common formats
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // If parsing fails, return null
  console.warn(`Warning: Could not parse date: ${dateString}`);
  return null;
};

// Format date for display
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-PK', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR'
  }).format(amount);
};

// Get status badge color
const getStatusColor = (status) => {
  const colors = {
    submitted: '#3b82f6',
    admin_review: '#f59e0b',
    payment_pending: '#f97316',
    payment_verified: '#22c55e',
    appointment_scheduled: '#8b5cf6',
    completed: '#16a34a',
    cancelled: '#ef4444'
  };
  return colors[status] || '#6b7280';
};

module.exports = {
  generateApplicationNumber,
  generatePassword,
  convertDateToMySQL,
  formatDate,
  formatCurrency,
  getStatusColor
};
