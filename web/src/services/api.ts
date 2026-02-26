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
  getMetrics: (days = 30) => api.get(`/api/health-metrics?days=${days}`),
  saveMetrics: (data: any) => api.post('/api/health-metrics', data),
};

// Analytics
export const analyticsService = {
  getSummary: () => api.get('/api/analytics/summary'),
  getForecast: (data: any) => api.post('/api/analytics/forecast', data),
  detectAnomalies: (data: any) => api.post('/api/analytics/anomalies', data),
  generateInsights: (healthData: any[]) => api.post('/api/analytics/insights', { healthData }),
};

// Settings
export const settingsService = {
  getProfile: () => api.get('/api/settings/profile'),
  updateProfile: (data: any) => api.put('/api/settings/profile', data),
  changePassword: (data: any) => api.put('/api/settings/password', data),
  getPrivacy: () => api.get('/api/settings/privacy/settings'),
  updatePrivacy: (data: any) => api.put('/api/settings/privacy/settings', data),
  exportData: () => api.get('/api/settings/privacy/export'),
};

// Wearables / Device Integration
export const wearableService = {
  syncData: (userId: string, data: any) => api.post(`/api/wearable/${userId}/sync`, data),
  getDevices: () => api.get(`/api/advanced/wearables/devices/${getUserId()}`),
  connectDevice: (deviceType: string, manufacturer = 'Unknown') =>
    api.post('/api/advanced/wearables/connect', { user_id: getUserId(), device_type: deviceType, manufacturer }),
  disconnectDevice: (deviceId: string) => api.delete(`/api/advanced/wearables/devices/${deviceId}`).catch(() =>
    api.delete(`/api/wearable/devices/${deviceId}`)),
  getBiometrics: () => api.get(`/api/advanced/wearables/realtime/${getUserId()}`),
  getBiometricData: (metric: string, hours = 24) =>
    api.get(`/api/advanced/biometric/${metric}?hours=${hours}`),
};

// Consultations / Appointments
const getUserId = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}')?.id || ''; } catch { return ''; }
};
export const consultationService = {
  book: (data: any) => api.post('/api/consultations/book', data),
  getList: () => api.get(`/api/consultations/patient/${getUserId()}`),
  getById: (id: string) => api.get(`/api/consultations/${id}`),
  cancel: (id: string) => api.put(`/api/consultations/${id}/cancel`),
};

// Revolutionary Features
export const revolutionaryService = {
  // Virtual Health Twin
  getTwin: () => { const uid = getUserId(); return api.get(`/api/v1/health-twin/${uid}`); },
  runSimulation: (data: any) => { const uid = getUserId(); return api.post(`/api/v1/health-twin/${uid}/simulate`, data); },
  getTwinPredictions: () => { const uid = getUserId(); return api.get(`/api/v1/health-twin/${uid}/predictions`); },

  // Longevity / Biological Age
  getBiologicalAge: () => { const uid = getUserId(); return api.get(`/api/v1/longevity/${uid}/biological-age`); },
  getLongevityProfile: () => { const uid = getUserId(); return api.get(`/api/v1/longevity/${uid}/profile`); },
  getAgingHallmarks: () => { const uid = getUserId(); return api.get(`/api/v1/longevity/${uid}/aging-hallmarks`); },
  getTherapies: () => { const uid = getUserId(); return api.get(`/api/v1/longevity/${uid}/therapies`); },

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

// User Preferences (notifications, language, timezone, units)
export const preferencesService = {
  get: () => api.get('/api/settings/preferences'),
  update: (data: any) => api.put('/api/settings/preferences', data),
};

// Team Management
export const teamService = {
  getMembers: () => api.get('/api/team/members'),
  updateRole: (userId: string, role: string) => api.put(`/api/team/members/${userId}/role`, { role }),
};

// Reports
export const reportsService = {
  getReports: () => api.get('/api/reports'),
};
