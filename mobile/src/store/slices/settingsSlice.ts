import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationSettings {
  enabled: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  healthAlerts: boolean;
  weeklyReports: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface PrivacySettings {
  dataSharing: boolean;
  anonymousAnalytics: boolean;
  locationTracking: boolean;
  biometricAuth: boolean;
}

interface SyncSettings {
  autoSync: boolean;
  wifiOnly: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
}

interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

interface SettingsState {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  sync: SyncSettings;
  theme: ThemeSettings;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  notifications: {
    enabled: true,
    medicationReminders: true,
    appointmentReminders: true,
    healthAlerts: true,
    weeklyReports: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  },
  privacy: {
    dataSharing: false,
    anonymousAnalytics: true,
    locationTracking: false,
    biometricAuth: false,
  },
  sync: {
    autoSync: true,
    wifiOnly: false,
    syncFrequency: 'hourly',
  },
  theme: {
    mode: 'auto',
    primaryColor: '#007AFF',
    fontSize: 'medium',
  },
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updatePrivacySettings: (state, action: PayloadAction<Partial<PrivacySettings>>) => {
      state.privacy = { ...state.privacy, ...action.payload };
    },
    updateSyncSettings: (state, action: PayloadAction<Partial<SyncSettings>>) => {
      state.sync = { ...state.sync, ...action.payload };
    },
    updateThemeSettings: (state, action: PayloadAction<Partial<ThemeSettings>>) => {
      state.theme = { ...state.theme, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  updateSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  updateSyncSettings,
  updateThemeSettings,
  setLoading,
  setError,
  clearError,
} = settingsSlice.actions;

export default settingsSlice.reducer;
