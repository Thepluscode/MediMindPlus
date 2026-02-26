import apiService from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginCredentials, RegisterData, UserProfile } from '../types/models/user';

class AuthService {
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

      // Store tokens in background - don't wait for it to prevent blocking
      this.storeAuthData(authResponse).catch(err => {
        console.warn('Failed to store auth data, but continuing:', err);
      });

      return authResponse;
    } catch (error: any) {
      console.error('Login error:', error);

      // Extract the proper error message from the backend response
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Login failed. Please try again.';

      throw new Error(errorMessage);
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('authService.register called with:', userData);
      console.log('Making POST request to /auth/register');

      const response = await apiService.post<{ user: UserProfile; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', userData);

      console.log('Registration response received:', response.status);
      console.log('Response data:', response.data);

      // Transform response to match frontend AuthResponse format
      const authResponse: AuthResponse = {
        user: response.data.user,
        token: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken
      };

      console.log('Storing auth data in background...');
      // Store tokens in background - don't wait for it to prevent blocking
      this.storeAuthData(authResponse).catch(err => {
        console.warn('Failed to store auth data, but continuing:', err);
      });

      console.log('Registration complete, returning auth response immediately');
      return authResponse;
    } catch (error: any) {
      console.error('Registration error caught in authService:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Extract the proper error message from the backend response
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Registration failed. Please try again.';

      throw new Error(errorMessage);
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

  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiService.put<{ user: UserProfile }>('/user/profile', profileData);

      // Update stored user data
      const updatedUser = response.data.user;

      // Use localStorage on web
      if (typeof (globalThis as any).window !== 'undefined') {
        (globalThis as any).localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        // Use AsyncStorage on mobile
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return updatedUser;
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Profile update failed. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async refreshToken(): Promise<string> {
    try {
      let refreshToken: string | null;
      let userJson: string | null;

      // Use localStorage on web
      if (typeof (globalThis as any).window !== 'undefined') {
        refreshToken = (globalThis as any).localStorage.getItem('refreshToken');
        userJson = (globalThis as any).localStorage.getItem('user');
      } else {
        // Use AsyncStorage on mobile
        refreshToken = await AsyncStorage.getItem('refreshToken');
        userJson = await AsyncStorage.getItem('user');
      }

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/refresh-token', { refreshToken });

      if (!response.data?.tokens?.accessToken) {
        throw new Error('Invalid token refresh response');
      }

      // Get the current user data to construct a complete AuthResponse
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
      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        const token = (globalThis as any).localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token available');
        }

        const userJson = (globalThis as any).localStorage.getItem('user');
        if (!userJson) {
          throw new Error('No user data available');
        }

        return JSON.parse(userJson);
      }

      // Use AsyncStorage for native mobile
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token available');
      }

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
    // Use localStorage on web to avoid blocking
    if (typeof (globalThis as any).window !== 'undefined') {
      const token = (globalThis as any).localStorage.getItem('authToken');
      return !!token;
    }

    // Use AsyncStorage for native mobile
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }

  private async storeAuthData(authData: AuthResponse): Promise<void> {
    // Skip AsyncStorage on web - it causes the page to freeze
    // Use localStorage instead for web
    if (typeof (globalThis as any).window !== 'undefined') {
      try {
        console.log('storeAuthData using localStorage for web');
        console.log('Auth data to store:', {
          hasToken: !!authData.token,
          hasRefreshToken: !!authData.refreshToken,
          hasUser: !!authData.user,
          tokenLength: authData.token?.length,
          refreshTokenLength: authData.refreshToken?.length
        });

        const { token, refreshToken, user } = authData;

        if (token) {
          (globalThis as any).localStorage.setItem('authToken', token);
          console.log('Stored authToken, length:', token.length);
        } else {
          console.warn('NO TOKEN TO STORE!');
        }

        if (refreshToken) {
          (globalThis as any).localStorage.setItem('refreshToken', refreshToken);
          console.log('Stored refreshToken, length:', refreshToken.length);
        } else {
          console.warn('NO REFRESH TOKEN TO STORE!');
        }

        if (user) {
          (globalThis as any).localStorage.setItem('user', JSON.stringify(user));
          console.log('Stored user:', user.email);
        } else {
          console.warn('NO USER TO STORE!');
        }

        console.log('Auth data stored in localStorage - verifying...');
        console.log('localStorage.authToken exists:', !!(globalThis as any).localStorage.getItem('authToken'));
        console.log('localStorage.refreshToken exists:', !!(globalThis as any).localStorage.getItem('refreshToken'));
        console.log('localStorage.user exists:', !!(globalThis as any).localStorage.getItem('user'));
      } catch (error) {
        console.error('localStorage FAILED:', error);
        console.warn('Continuing without persisting auth data');
      }
      return;
    }

    // Use AsyncStorage for native mobile
    try {
      console.log('storeAuthData called with:', authData);
      const { token, refreshToken, user } = authData;

      const items: [string, string][] = [];
      if (token) items.push(['authToken', token]);
      if (refreshToken) items.push(['refreshToken', refreshToken]);
      if (user) items.push(['user', JSON.stringify(user)]);

      if (items.length > 0) {
        await AsyncStorage.multiSet(items);
        console.log('All auth data stored successfully');
      }
    } catch (error) {
      console.error('Error storing auth data:', error);
      console.warn('Continuing without persisting auth data');
    }
  }

  private async clearAuthData(): Promise<void> {
    // Use localStorage on web to avoid blocking
    if (typeof (globalThis as any).window !== 'undefined') {
      try {
        (globalThis as any).localStorage.removeItem('authToken');
        (globalThis as any).localStorage.removeItem('refreshToken');
        (globalThis as any).localStorage.removeItem('user');
      } catch (error) {
        console.error('Error clearing auth data from localStorage:', error);
      }
      return;
    }

    // Use AsyncStorage for native mobile
    try {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  async getStoredUser(): Promise<UserProfile | null> {
    try {
      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        const userJson = (globalThis as any).localStorage.getItem('user');
        if (!userJson) return null;
        return JSON.parse(userJson) as UserProfile;
      }

      // Use AsyncStorage for native mobile
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) return null;

      return JSON.parse(userJson) as UserProfile;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async getAuthToken(): Promise<string | null> {
    // Use localStorage on web to avoid blocking
    if (typeof (globalThis as any).window !== 'undefined') {
      return (globalThis as any).localStorage.getItem('authToken');
    }

    // Use AsyncStorage for native mobile
    return await AsyncStorage.getItem('authToken');
  }
}

export const authService = new AuthService();
