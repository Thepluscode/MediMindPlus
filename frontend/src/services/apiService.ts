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
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  async (config: AxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiService.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post<AuthResponse>(
            `${API_BASE_URL}/auth/refresh`, 
            { refreshToken }
          );

          const { token, refreshToken: newRefreshToken } = response.data;

          if (token && newRefreshToken) {
            // Update tokens in storage and store
            await AsyncStorage.setItem('authToken', token);
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
            store.dispatch(setTokens({ token, refreshToken: newRefreshToken }));

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiService(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
        // Note: In a real app, you'd handle navigation here
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
