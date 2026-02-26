import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import { setTokens } from '../store/slices/authSlice';
import { AuthResponse } from '../types/models/user';

// ML Pipeline API (direct connection for health predictions)
export const ML_API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://ml.medimind.app';

// Backend API (for user management, data storage)
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.medimind.app/api';

// Extend AxiosRequestConfig to include _retry flag
declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// Create axios instance for backend API
const apiService: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('[apiService] Initialized with base URL:', API_BASE_URL);

// Create axios instance for ML Pipeline API
export const mlApiService: AxiosInstance = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: 60000, // Longer timeout for ML operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiService.interceptors.request.use(
  async (config: any) => {
    console.log('[apiService] Outgoing request:', config.method?.toUpperCase(), config.url);
    // Skip token for registration and login endpoints
    if (config.url?.includes('/auth/register') || config.url?.includes('/auth/login')) {
      console.log('[apiService] Skipping auth token for public endpoint');
      return config;
    }

    try {
      let token: string | null;

      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        token = (globalThis as any).localStorage.getItem('authToken');
      } else {
        // Use AsyncStorage on mobile with timeout protection
        token = await Promise.race([
          AsyncStorage.getItem('authToken'),
          new Promise<string | null>((_, reject) => setTimeout(() => reject(new Error('AsyncStorage timeout')), 1000))
        ]);
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[apiService] Failed to get auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[apiService] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiService.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[apiService] Response received:', response.status, response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    console.error('[apiService] Response error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url
    });
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        let refreshToken: string | null;

        // Use localStorage on web to avoid blocking
        if (typeof (globalThis as any).window !== 'undefined') {
          refreshToken = (globalThis as any).localStorage.getItem('refreshToken');
        } else {
          // Use AsyncStorage on mobile
          refreshToken = await AsyncStorage.getItem('refreshToken');
        }

        if (refreshToken) {
          const response = await axios.post<AuthResponse>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const { token, refreshToken: newRefreshToken } = response.data;

          if (token && newRefreshToken) {
            // Update tokens in storage and store
            if (typeof (globalThis as any).window !== 'undefined') {
              // Use localStorage on web
              (globalThis as any).localStorage.setItem('authToken', token);
              (globalThis as any).localStorage.setItem('refreshToken', newRefreshToken);
            } else {
              // Use AsyncStorage on mobile
              await AsyncStorage.setItem('authToken', token);
              await AsyncStorage.setItem('refreshToken', newRefreshToken);
            }

            store.dispatch(setTokens({ token, refreshToken: newRefreshToken }));

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiService(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        if (typeof (globalThis as any).window !== 'undefined') {
          // Use localStorage on web
          (globalThis as any).localStorage.removeItem('authToken');
          (globalThis as any).localStorage.removeItem('refreshToken');
          (globalThis as any).localStorage.removeItem('user');
        } else {
          // Use AsyncStorage on mobile
          await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
        }
        console.log('Session expired, please log in again');
      }
    }

    return Promise.reject(error);
  }
);

// Add type-safe request methods
const typedApiService = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    apiService.get<T>(url, config),
  
  post: <T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => 
    apiService.post<T>(url, data, config),
  
  put: <T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => 
    apiService.put<T>(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    apiService.delete<T>(url, config),
  
  patch: <T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => 
    apiService.patch<T>(url, data, config),
};

export default typedApiService;
