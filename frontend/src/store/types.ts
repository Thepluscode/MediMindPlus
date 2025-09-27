import { AIPredictionsState } from '../types/models/ai';
import { HealthDataState } from './slices/healthDataSlice';

// Temporary types for missing imports
interface AuthState {
  user: any;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AnalyticsState {
  insights: any[];
  isLoading: boolean;
  error: string | null;
}

interface SettingsState {
  notifications: any;
  privacy: any;
  isLoading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  user: any;
  healthData: HealthDataState;
  aiPredictions: AIPredictionsState;
  analytics: AnalyticsState;
  settings: SettingsState;
}
