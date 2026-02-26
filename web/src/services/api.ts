import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Shared authenticated API instance
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Health Analysis
export const healthAnalysisService = {
  getMetrics: (days = 30) => api.get(`/api/health-analysis/health-metrics?days=${days}`),
  saveMetrics: (data: any) => api.post('/api/health-analysis/health-metrics', data),
};

// Analytics
export const analyticsService = {
  getInsights: () => api.get('/api/analytics/insights'),
  getSummary: () => api.get('/api/analytics/summary'),
  getForecast: (data: any) => api.post('/api/analytics/forecast', data),
  detectAnomalies: (data: any) => api.post('/api/analytics/anomaly-detection', data),
};

// Settings
export const settingsService = {
  getProfile: () => api.get('/api/settings/profile'),
  updateProfile: (data: any) => api.put('/api/settings/profile', data),
  changePassword: (data: any) => api.put('/api/settings/password', data),
  getPrivacy: () => api.get('/api/settings/privacy'),
  updatePrivacy: (data: any) => api.put('/api/settings/privacy', data),
  exportData: () => api.post('/api/settings/export-data'),
};

// Wearables / Device Integration
export const wearableService = {
  syncData: (userId: string, data: any) => api.post(`/api/wearable/${userId}/sync`, data),
  getDevices: () => api.get('/api/advanced/wearable/devices'),
  connectDevice: (deviceType: string) => api.post('/api/advanced/wearable/connect', { deviceType }),
  disconnectDevice: (deviceId: string) => api.delete(`/api/advanced/wearable/${deviceId}`),
  getBiometrics: () => api.get('/api/advanced/wearable/realtime'),
  getBiometricData: (metric: string, hours = 24) =>
    api.get(`/api/advanced/biometric/${metric}?hours=${hours}`),
};

// Consultations / Appointments
export const consultationService = {
  book: (data: any) => api.post('/api/consultations/book', data),
  getList: () => api.get('/api/consultations/patient'),
  getById: (id: string) => api.get(`/api/consultations/${id}`),
  cancel: (id: string) => api.put(`/api/consultations/${id}/cancel`),
};

// Revolutionary Features
export const revolutionaryService = {
  // Virtual Health Twin
  getTwin: () => api.get('/api/revolutionary/health-twin'),
  runSimulation: (data: any) => api.post('/api/revolutionary/health-twin/simulate', data),
  getTwinPredictions: () => api.get('/api/revolutionary/health-twin/predictions'),

  // Longevity / Biological Age
  getBiologicalAge: () => api.get('/api/revolutionary/longevity/profile'),
  getAgingHallmarks: () => api.get('/api/revolutionary/longevity/aging-hallmarks'),
  getTherapies: () => api.get('/api/revolutionary/longevity/therapies'),

  // Drug Interaction (via advanced features)
  checkDrugInteractions: (data: any) => api.post('/api/advanced/drug-interactions', data),
};

// Radiologist
export const radiologistService = {
  getMetrics: (range = 'month') => api.get(`/api/radiologist/metrics?range=${range}`),
  getWorklist: () => api.get('/api/radiologist/worklist'),
};

// Payments
export const paymentService = {
  createPaymentIntent: (consultationId: string, amount: number) =>
    api.post('/api/payments/create-intent', { consultationId, amount }),
  confirmPayment: (consultationId: string, paymentIntentId: string) =>
    api.post('/api/payments/confirm', { consultationId, paymentIntentId }),
};

// Audit Logs (admin)
export const auditService = {
  getLogs: (params?: { skip?: number; limit?: number; status?: string; action?: string }) =>
    api.get('/api/audit/logs', { params }),
  exportLogs: () => api.get('/api/audit/logs/export'),
};

// Dashboard
export const dashboardService = {
  getDashboard: () => api.get('/api/dashboard'),
  getWidgetData: (widgetId: string, timeRange?: string) =>
    api.get(`/api/dashboard/${widgetId}/data${timeRange ? `?timeRange=${timeRange}` : ''}`),
};
