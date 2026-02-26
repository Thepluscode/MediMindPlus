import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email: any, password: any) => {
    const response = await api.post('/api/auth/login', { email, password });
    const token = response.data.token || response.data.tokens?.accessToken;
    const refreshToken = response.data.refreshToken || response.data.tokens?.refreshToken;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/api/auth/register', userData);
    const token = response.data.token || response.data.tokens?.accessToken;
    const refreshToken = response.data.refreshToken || response.data.tokens?.refreshToken;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },
  
  isAuthenticated: () => {
      return !!localStorage.getItem('token');
  }
};
