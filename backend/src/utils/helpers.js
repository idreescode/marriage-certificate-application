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

// Normalize date from WordPress format (DD-MM-YYYY) to MySQL format (YYYY-MM-DD)
// Also handles datetime format (DD-MM-YYYY HH:MM AM/PM) for solemnised_date
// WordPress sends dates in DD-MM-YYYY format (e.g., "15-01-2024")
const normalizeDate = (dateString, includeTime = false) => {
  // Return null for falsy values
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = dateString.trim();
  
  // Return null for empty strings
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  // Handle datetime format: DD-MM-YYYY HH:MM AM/PM (e.g., "08-01-2026 12:00 PM")
  if (includeTime && /^\d{2}-\d{2}-\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$/i.test(trimmed)) {
    const parts = trimmed.split(' ');
    const datePart = parts[0]; // DD-MM-YYYY
    const timePart = parts[1]; // HH:MM
    const ampm = parts[2].toUpperCase(); // AM/PM
    
    const dateParts = datePart.split('-');
    const day = dateParts[0];
    const month = dateParts[1];
    const year = dateParts[2];
    
    const timeParts = timePart.split(':');
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    
    // Convert to 24-hour format
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const hours24 = String(hours).padStart(2, '0');
    
    // Validate date
    const date = new Date(`${year}-${month}-${day}T${hours24}:${minutes}:00`);
    if (!isNaN(date.getTime()) && 
        date.getDate() === parseInt(day) && 
        date.getMonth() === parseInt(month) - 1 && 
        date.getFullYear() === parseInt(year)) {
      return `${year}-${month}-${day} ${hours24}:${minutes}:00`;
    }
  }

  // Handle datetime-local format: YYYY-MM-DDTHH:mm (e.g., "2026-01-08T12:00")
  if (includeTime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const dateTimeParts = trimmed.split('T');
    const datePart = dateTimeParts[0]; // YYYY-MM-DD
    const timePart = dateTimeParts[1]; // HH:mm
    
    const timeParts = timePart.split(':');
    const hours = timeParts[0];
    const minutes = timeParts[1];
    
    // Validate date
    const date = new Date(`${datePart}T${hours}:${minutes}:00`);
    if (!isNaN(date.getTime())) {
      return `${datePart} ${hours}:${minutes}:00`;
    }
  }

  // Already in MySQL format (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
  if (/^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}:\d{2})?$/.test(trimmed)) {
    // Validate it's a real date
    const date = new Date(trimmed.includes(' ') ? trimmed : trimmed + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      return trimmed;
    }
  }

  // WordPress format: DD-MM-YYYY (e.g., "15-01-2024") - PRIMARY FORMAT
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    
    // Validate date
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!isNaN(date.getTime()) && 
        date.getDate() === parseInt(day) && 
        date.getMonth() === parseInt(month) - 1 && 
        date.getFullYear() === parseInt(year)) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format: DD/MM/YYYY (e.g., "15/01/2024")
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!isNaN(date.getTime()) && 
        date.getDate() === parseInt(day) && 
        date.getMonth() === parseInt(month) - 1 && 
        date.getFullYear() === parseInt(year)) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format: MM/DD/YYYY (US format, e.g., "01/15/2024")
  // Only try this if first part <= 12 (could be month)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);
    
    // If first part <= 12 and second > 12, it's likely MM/DD/YYYY
    if (first <= 12 && second > 12) {
      const month = parts[0];
      const day = parts[1];
      const year = parts[2];
      
      const date = new Date(`${year}-${month}-${day}T00:00:00`);
      if (!isNaN(date.getTime()) && 
          date.getDate() === parseInt(day) && 
          date.getMonth() === parseInt(month) - 1 && 
          date.getFullYear() === parseInt(year)) {
        return `${year}-${month}-${day}`;
      }
    }
  }

  // Format: YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!isNaN(date.getTime()) && date.toISOString().startsWith(`${year}-${month}-${day}`)) {
      return `${year}-${month}-${day}`;
    }
  }

  // Try parsing as ISO date string (handles timezone info)
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    const year = isoDate.getFullYear();
    const month = String(isoDate.getMonth() + 1).padStart(2, '0');
    const day = String(isoDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Invalid date format
  console.warn(`⚠️  Invalid date format received: "${trimmed}". Returning null.`);
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
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
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
  normalizeDate,
  formatDate,
  formatCurrency,
  getStatusColor
};
