import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

// Create axios instance with cookie support
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Send cookies with every request
  withCredentials: true,
  xsrfCookieName: false,
  xsrfHeaderName: false
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/signup') ||
        error.config?.url?.includes('/auth/me'); // Don't redirect on check-me

      const isLoginPage = window.location.pathname === '/login' ||
        window.location.pathname === '/signup' ||
        window.location.pathname === '/onboarding';

      if (!isAuthRequest && !isLoginPage) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // Don't log 404s for optional endpoints (notifications, etc.)
    if (error.response?.status === 404) {
      const optionalEndpoints = ['/notifications/', '/api/v1/notifications'];
      const isOptional = optionalEndpoints.some(ep => error.config?.url?.includes(ep));
      
      if (isOptional) {
        // Return a successful response with fallback data
        return Promise.resolve({
          data: { success: false, warning: 'Endpoint not available' }
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/api/v1/auth/signup', data),
  login: (data) => api.post('/api/v1/auth/login', data),
  logout: () => api.post('/api/v1/auth/logout'),
  me: () => api.get('/api/v1/auth/me'),
  googleUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `${API_URL}/auth/google${query ? `?${query}` : ''}`;
  },
  // Email verification
  resendVerification: (email) => api.post('/api/v1/resend_verification', { email }),
  verifyEmail: (token) => api.post('/api/v1/verify_email', { token }),
  getVerificationStatus: () => api.get('/api/v1/verification_status'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/api/v1/users/me'),
  updateProfile: (data) => api.put('/api/v1/users/me', data),
  deleteAccount: () => api.delete('/api/v1/users/me'),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/api/v1/invoices', { params }),
  getById: (id) => api.get(`/api/v1/invoices/${id}`),
  create: (formData) =>
    api.post('/api/v1/invoices', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) => api.put(`/api/v1/invoices/${id}`, data),
  delete: (id) => api.delete(`/api/v1/invoices/${id}`),
  download: (id) => api.get(`/api/v1/invoices/${id}/download`, { responseType: 'blob' }),
  preview: (id) => api.get(`/api/v1/invoices/${id}/preview`, { responseType: 'blob' }),
  getStats: () => api.get('/api/v1/invoices/stats'),
  getDashboard: () => api.get('/api/v1/invoices/dashboard'),
  getOcrStatus: (id) => api.get(`/api/v1/invoices/${id}/ocr_status`),
  retryOcr: (id) => api.post(`/api/v1/invoices/${id}/retry_ocr`),
};

// Workflow API
export const workflowAPI = {
  uploadAndProcess: (formData) =>
    api.post('/api/v1/invoices_workflow/upload_and_process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  manualEntry: (data) => api.post('/api/v1/invoices_workflow/manual_entry', data),
  getStatus: (invoiceId) => api.get(`/api/v1/invoices_workflow/status?invoice_id=${invoiceId}`),
  retryOcr: (invoiceId) => api.post(`/api/v1/invoices_workflow/retry_ocr`, { invoice_id: invoiceId }),
  refreshProduct: (invoiceId) => api.post(`/api/v1/invoices_workflow/refresh_product`, { invoice_id: invoiceId }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/api/v1/notifications', { params }),
  getUnreadCount: () => api.get('/api/v1/notifications/unread_count'),
  markAsRead: (id) => api.put(`/api/v1/notifications/${id}/mark_as_read`),
  markAllAsRead: () => api.put('/api/v1/notifications/mark_all_as_read'),
  delete: (id) => api.delete(`/api/v1/notifications/${id}`),
  clearAll: () => api.delete('/api/v1/notifications/clear_all'),
};

// Gmail API
export const gmailAPI = {
  getConnection: () => api.get('/api/v1/gmail/connection'),
  connect: () => api.post('/api/v1/gmail/connect'),
  sync: () => api.post('/api/v1/gmail/sync'),
  disconnect: () => api.delete('/api/v1/gmail/disconnect'),
  getSuggestions: () => api.get('/api/v1/gmail/suggestions'),
};

export default api;
