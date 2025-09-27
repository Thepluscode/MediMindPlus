import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { healthDataService } from '../../services/healthDataService';
import { 
  HealthDataPoint, 
  BloodPressureReading, 
  SleepData, 
  ActivityData, 
  VoiceData,
  VitalSigns,
  HealthMetrics,
  HealthSummary,
  HealthDataState as IHealthDataState
} from '../../types/models/health';

interface HealthDataState extends IHealthDataState {
  // Current session data (not persisted to backend)
  currentData: {
    heartRate: HealthDataPoint[];
    bloodPressure: BloodPressureReading[];
    sleepData: Partial<SleepData>;
    activityData: Partial<ActivityData>;
    voiceData: Partial<VoiceData>;
  };
  // UI state
  isUploading: boolean;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: string | null;
}

const initialState: HealthDataState = {
  currentData: {
    heartRate: [],
    bloodPressure: [],
    sleepData: {},
    activityData: {},
    voiceData: {},
  },
  // From IHealthDataState
  vitalSigns: [],
  bloodPressureReadings: [],
  sleepData: [],
  activityData: [],
  voiceRecordings: [],
  healthMetrics: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  // Local UI state
  isUploading: false,
  lastSyncTime: null,
};

// Async thunks
export const fetchVitalSigns = createAsyncThunk<
  VitalSigns[],
  { startDate: string; endDate: string; limit?: number },
  { rejectValue: string }
>(
  'healthData/fetchVitalSigns',
  async ({ startDate, endDate, limit }, { rejectWithValue }) => {
    try {
      const response = await healthDataService.getVitalSigns({ startDate, endDate, limit });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vital signs');
    }
  }
);

export const addVitalSigns = createAsyncThunk<
  VitalSigns,
  Omit<VitalSigns, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  { rejectValue: string }
>(
  'healthData/addVitalSigns',
  async (vitalSignsData, { rejectWithValue }) => {
    try {
      const response = await healthDataService.addVitalSigns(vitalSignsData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add vital signs');
    }
  }
);

export const fetchHealthMetrics = createAsyncThunk<
  HealthMetrics[],
  { startDate: string; endDate: string; interval?: 'hour' | 'day' | 'week' | 'month' },
  { rejectValue: string }
>(
  'healthData/fetchHealthMetrics',
  async ({ startDate, endDate, interval }, { rejectWithValue }) => {
    try {
      const response = await healthDataService.getHealthMetrics({
        startDate,
        endDate,
        interval: interval || 'day'
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch health metrics');
    }
  }
);



const healthDataSlice = createSlice({
  name: 'healthData',
  initialState,
  reducers: {
    // Add data to current session
    addHeartRateData: (state, action: PayloadAction<HealthDataPoint>) => {
      state.currentData.heartRate.push(action.payload);
    },
    
    addBloodPressureData: (state, action: PayloadAction<BloodPressureReading>) => {
      state.currentData.bloodPressure.push(action.payload);
    },
    
    updateSleepData: (state, action: PayloadAction<Partial<SleepData>>) => {
      state.currentData.sleepData = { 
        ...state.currentData.sleepData, 
        ...action.payload 
      };
    },
    
    updateActivityData: (state, action: PayloadAction<Partial<ActivityData>>) => {
      state.currentData.activityData = { 
        ...state.currentData.activityData, 
        ...action.payload 
      };
    },
    
    updateVoiceData: (state, action: PayloadAction<Partial<VoiceData>>) => {
      state.currentData.voiceData = { 
        ...state.currentData.voiceData, 
        ...action.payload 
      };
    },
    
    clearCurrentData: (state) => {
      state.currentData = {
        heartRate: [],
        bloodPressure: [],
        sleepData: {},
        activityData: {},
        voiceData: {},
      };
    },
    
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Vital Signs
    builder
      .addCase(fetchVitalSigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVitalSigns.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.vitalSigns = payload;
        state.lastSyncTime = new Date().toISOString();
      })
      .addCase(fetchVitalSigns.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload || 'Failed to fetch vital signs';
      })
      
      // Add Vital Signs
      .addCase(addVitalSigns.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(addVitalSigns.fulfilled, (state, { payload }) => {
        state.isUploading = false;
        state.vitalSigns = [payload, ...state.vitalSigns];
        state.lastSyncTime = new Date().toISOString();
      })
      .addCase(addVitalSigns.rejected, (state, { payload }) => {
        state.isUploading = false;
        state.error = payload || 'Failed to add vital signs';
      })
      
      // Fetch Health Metrics
      .addCase(fetchHealthMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHealthMetrics.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.healthMetrics = payload;
        state.lastSyncTime = new Date().toISOString();
      })
      .addCase(fetchHealthMetrics.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload || 'Failed to fetch health metrics';
      });
  },
});

// Export actions
export const {
  addHeartRateData,
  addBloodPressureData,
  updateSleepData,
  updateActivityData,
  updateVoiceData,
  clearCurrentData,
  setLastSyncTime,
  clearError,
} = healthDataSlice.actions;

// Export async thunk creators
export const fetchVitalSignsAsync = fetchVitalSigns;
export const fetchHealthMetricsAsync = fetchHealthMetrics;
export const addVitalSignsAsync = addVitalSigns;

// Export selectors
export const selectVitalSigns = (state: { healthData: HealthDataState }) => state.healthData.vitalSigns;
export const selectBloodPressureReadings = (state: { healthData: HealthDataState }) => state.healthData.bloodPressureReadings;
export const selectSleepData = (state: { healthData: HealthDataState }) => state.healthData.sleepData;
export const selectActivityData = (state: { healthData: HealthDataState }) => state.healthData.activityData;
export const selectVoiceRecordings = (state: { healthData: HealthDataState }) => state.healthData.voiceRecordings;
export const selectHealthMetrics = (state: { healthData: HealthDataState }) => state.healthData.healthMetrics;

export const selectCurrentSession = (state: { healthData: HealthDataState }) => state.healthData.currentData;
export const selectIsLoading = (state: { healthData: HealthDataState }) => state.healthData.isLoading;
export const selectIsUploading = (state: { healthData: HealthDataState }) => state.healthData.isUploading;
export const selectError = (state: { healthData: HealthDataState }) => state.healthData.error;
export const selectLastSyncTime = (state: { healthData: HealthDataState }) => state.healthData.lastSyncTime;
export const selectLastUpdated = (state: { healthData: HealthDataState }) => state.healthData.lastUpdated;

// Export types
export type { HealthDataState };

export default healthDataSlice.reducer;
