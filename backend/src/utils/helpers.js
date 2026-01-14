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
  formatDate,
  formatCurrency,
  getStatusColor
};
