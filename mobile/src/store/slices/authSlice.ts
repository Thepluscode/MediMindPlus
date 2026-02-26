import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { AuthState, LoginCredentials, RegisterData, AuthResponse } from '../../types/models/user';

// Define the initial state using the AuthState type
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login({ email, password });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterData,
  { rejectValue: string }
>(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('authSlice registerUser thunk called with:', userData);
      const response = await authService.register(userData);
      console.log('authSlice received response from authService:', response);
      return response;
    } catch (error: any) {
      console.error('authSlice registerUser error:', error);
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error: any) {
      // Even if logout fails, we still want to clear the local state
      console.error('Logout error:', error);
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    },
    resetAuthState: (state) => {
      // Force reset to initial state values
      state.isLoading = false;
      state.error = null;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.user = payload.user;
        state.token = payload.token;
        state.refreshToken = payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload as string || 'Login failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        console.log('authSlice: registerUser.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        console.log('authSlice: registerUser.fulfilled with payload:', payload);
        state.isLoading = false;
        state.user = payload.user;
        state.token = payload.token;
        state.refreshToken = payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        console.log('authSlice: isAuthenticated set to true');
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        console.log('authSlice: registerUser.rejected with error:', payload);
        state.isLoading = false;
        state.error = payload as string || 'Registration failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.user = { ...state.user, ...payload };
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload as string || 'Profile update failed';
      });
  },
});

export const { clearError, setTokens, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
