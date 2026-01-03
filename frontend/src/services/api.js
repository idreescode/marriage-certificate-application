import axios from 'axios';

// Prioritize VITE_API_URL, fallback to REACT_APP_API_URL for compatibility
// Use VITE_API_URL from environment
const ENV_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${ENV_API_URL}/api`;

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // If path already starts with /api, prevent double /api/api
  const cleanBase = ENV_API_URL.endsWith('/') ? ENV_API_URL.slice(0, -1) : ENV_API_URL;
  return `${cleanBase}${path}`;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if 401 AND not on a login request
    const isLoginRequest = error.config?.url?.includes('/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

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
export const setDepositAmount = (id, data) => api.put(`/admin/applications/${id}/set-deposit`, data);
export const verifyPayment = (id) => api.put(`/admin/applications/${id}/verify-payment`);
export const scheduleAppointment = (id, data) => api.put(`/admin/applications/${id}/schedule-appointment`, data);
export const markComplete = (id) => api.put(`/admin/applications/${id}/complete`);
export const generateCertificate = (id) => api.post(`/admin/applications/${id}/generate-certificate`);

// Payment APIs
export const createCheckoutSession = () => api.post('/payment/create-checkout-session');

export const verifySession = (sessionId) => api.post('/payment/verify-session', { sessionId });
export const createPaymentIntent = () => api.post('/payment/create-payment-intent');
export const confirmPayment = (data) => api.post('/payment/confirm-payment', data);

// Notification APIs
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');

export default api;
