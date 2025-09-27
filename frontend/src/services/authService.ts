import apiService from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginCredentials, RegisterData, UserProfile } from '../types/models/user';

class AuthService {
  updateProfilePicture(arg0: string) {
    throw new Error('Method not implemented.');
  }
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<{ user: UserProfile; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Transform response to match frontend AuthResponse format
      const authResponse: AuthResponse = {
        user: response.data.user,
        token: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken
      };

      // Store tokens
      await this.storeAuthData(authResponse);

      return authResponse;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiService.post<{ user: UserProfile; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', userData);

      // Transform response to match frontend AuthResponse format
      const authResponse: AuthResponse = {
        user: response.data.user,
        token: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken
      };

      // Store tokens
      await this.storeAuthData(authResponse);

      return authResponse;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend to invalidate token
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if server logout fails
    } finally {
      // Clear local storage
      await this.clearAuthData();
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/refresh-token', { refreshToken });

      if (!response.data?.tokens?.accessToken) {
        throw new Error('Invalid token refresh response');
      }

      // Get the current user data to construct a complete AuthResponse
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        throw new Error('No user data available for token refresh');
      }
      const user = JSON.parse(userJson);

      // Create complete AuthResponse with user data
      const authResponse: AuthResponse = {
        user,
        token: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken || refreshToken // Use new refresh token if provided, otherwise keep the old one
      };

      await this.storeAuthData(authResponse);

      return response.data.tokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearAuthData();
      throw error;
    }
  }

  async getCurrentUser(): Promise<UserProfile> {
    try {
      // First try to get user from token if available
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token available');
      }

      // In a real app, you might want to validate the token and get user info from it
      // or implement a /me endpoint on the backend
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        throw new Error('No user data available');
      }

      return JSON.parse(userJson);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }

  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      const { token, refreshToken, user } = authData;

      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }

      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }

      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  async getStoredUser(): Promise<UserProfile | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) return null;

      return JSON.parse(userJson) as UserProfile;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }
}

export const authService = new AuthService();
