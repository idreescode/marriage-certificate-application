import axios from 'axios';

// -----------------------------------------------------------------------------
// API CONFIGURATION
// -----------------------------------------------------------------------------

// 1. Get the base URL from environment variables
const RAW_API_URL = import.meta.env.VITE_API_URL;

// 2. Fallback for local development if env var is missing (Safety net)
//    NOTE: It is best practice to always have .env.development set.
const DEFAULT_API_URL = 'http://localhost:5000';

// 3. Construct the final Base URL
//    Logic: Take the env URL (or default), strip any trailing slash, and append '/api'
//    Result: "https://api.example.com/api" or "http://localhost:5000/api"
const getBaseUrl = () => {
  let url = RAW_API_URL || DEFAULT_API_URL;

  // Remove trailing slash if present to avoid double slashes
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  // Ensure we don't accidentally append /api if it's already there (e.g. user error in env var)
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }

  return url;
};

const API_BASE_URL = getBaseUrl();

// Debug helper to ensure we know what's happening in production
console.log(`%c API Config: ${API_BASE_URL}`, 'background: #222; color: #bada55');

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  // For static files, we likely want the ROOT application URL, not the /api path.
  // Assuming uploads are served from http://localhost:5000/uploads (not /api/uploads)
  const rootUrl = API_BASE_URL.replace(/\/api$/, '');

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${rootUrl}${cleanPath}`;
};

// 4. Create the global Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // CRITICAL: Ensures cookies are sent/received (Connect.sid)
});

// -----------------------------------------------------------------------------
// INTERCEPTORS
// -----------------------------------------------------------------------------

// Add auth token and API token to requests
api.interceptors.request.use((config) => {
  // Add JWT token for authenticated requests
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add API token for application submission endpoint
  const apiToken = import.meta.env.VITE_API_TOKEN;
  if (apiToken && config.url?.includes('/applications') && config.method === 'post') {
    config.headers['X-API-Token'] = apiToken;
  }
  
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if 401 AND not on a login request
    // Prevents infinite redirect loops if login fails
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      console.warn('Session expired or unauthorized. Redirecting to login.');
      localStorage.removeItem('token');
      // Use window.location carefully: 
      // specific redirecting might be better handled by React Router in components, 
      // but this is a fail-safe global handler.
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// -----------------------------------------------------------------------------
// API METHODS
// -----------------------------------------------------------------------------

// Application APIs
export const submitApplication = (data) => api.post('/applications', data);

// Auth APIs
export const login = (credentials) => api.post('/auth/login', credentials);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// Applicant APIs
// export const applicantLogin = (credentials) => api.post('/applicants/login', credentials); // DEPRECATED
export const getApplicantDashboard = () => api.get('/applicants/dashboard');

export const uploadReceipt = (formData) => api.post('/applicants/upload-receipt', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const requestBankDetails = () => api.post('/applicants/request-bank-details');
export const getCertificate = () => api.get('/applicants/certificate');
export const uploadDocuments = (formData) => api.post('/applicants/upload-documents', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Admin APIs
// export const adminLogin = (credentials) => api.post('/admin/login', credentials); // DEPRECATED
export const getAllApplications = (params) => api.get('/admin/applications', { params });
export const getApplicationById = (id) => api.get(`/admin/applications/${id}`);
export const approveApplication = (id) => api.put(`/admin/applications/${id}/approve`);
export const verifyDocuments = (id) => api.put(`/admin/applications/${id}/verify-documents`);
export const setDepositAmount = (id, data) => api.put(`/admin/applications/${id}/set-deposit`, data);
export const verifyPayment = (id) => api.put(`/admin/applications/${id}/verify-payment`);
export const scheduleAppointment = (id, data) => api.put(`/admin/applications/${id}/schedule-appointment`, data);
export const markComplete = (id) => api.put(`/admin/applications/${id}/complete`);
export const generateCertificate = (id, notify = true) => {
  const url = `/admin/applications/${id}/generate-certificate${notify ? '' : '?notify=false'}`;
  return api.post(url);
};
export const updateApplicationNumber = (id, applicationNumber) => 
  api.put(`/admin/applications/${id}/application-number`, { applicationNumber });
export const updateApplication = (id, data) => {
  // Check if data is FormData (for file uploads)
  if (data instanceof FormData) {
    return api.put(`/admin/applications/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
  return api.put(`/admin/applications/${id}`, data);
};
export const deleteApplication = (id) => api.delete(`/admin/applications/${id}`);
export const createManualApplication = (data) => {
  // Check if data is FormData (for file uploads)
  if (data instanceof FormData) {
    return api.post('/admin/applications/manual', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
  return api.post('/admin/applications/manual', data);
};

// Payment APIs - Online payment disabled, only bank transfer is available
// export const createCheckoutSession = () => api.post('/payment/create-checkout-session');
// export const verifySession = (sessionId) => api.post('/payment/verify-session', { sessionId });
// export const createPaymentIntent = () => api.post('/payment/create-payment-intent');
// export const confirmPayment = (data) => api.post('/payment/confirm-payment', data);

// Notification APIs
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');

export default api;
