import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { aiBlockchainService, AnomalyDetection } from '../../services/aiBlockchainService';
import type { RootState } from '../types';

interface AnomalyState {
  anomalies: AnomalyDetection[];
  unresolvedCount: number;
  criticalCount: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: AnomalyState = {
  anomalies: [],
  unresolvedCount: 0,
  criticalCount: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const getPatientAnomalies = createAsyncThunk<
  AnomalyDetection[],
  string, // patientDID
  { rejectValue: string }
>(
  'anomaly/getPatientAnomalies',
  async (patientDID, { rejectWithValue }) => {
    try {
      const anomalies = await aiBlockchainService.getPatientAnomalies(patientDID);
      return anomalies;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get anomalies');
    }
  }
);

export const detectAnomaly = createAsyncThunk<
  AnomalyDetection,
  { deviceId: string; patientDID: string; sensorData: any },
  { rejectValue: string }
>(
  'anomaly/detectAnomaly',
  async ({ deviceId, patientDID, sensorData }, { rejectWithValue }) => {
    try {
      const anomaly = await aiBlockchainService.detectAnomaly(deviceId, patientDID, sensorData);
      return anomaly;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to detect anomaly');
    }
  }
);

const anomalySlice = createSlice({
  name: 'anomaly',
  initialState,
  reducers: {
    clearAnomalyError: (state) => {
      state.error = null;
    },
    resetAnomalies: (state) => {
      state.anomalies = [];
      state.unresolvedCount = 0;
      state.criticalCount = 0;
      state.error = null;
      state.lastUpdated = null;
    },
    updateAnomalyCounts: (state) => {
      state.unresolvedCount = state.anomalies.filter(a => !a.resolved).length;
      state.criticalCount = state.anomalies.filter(a => a.severity === 'critical' && !a.resolved).length;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get patient anomalies
      .addCase(getPatientAnomalies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPatientAnomalies.fulfilled, (state, action: PayloadAction<AnomalyDetection[]>) => {
        state.isLoading = false;
        state.anomalies = action.payload;
        state.unresolvedCount = action.payload.filter(a => !a.resolved).length;
        state.criticalCount = action.payload.filter(a => a.severity === 'critical' && !a.resolved).length;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getPatientAnomalies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get anomalies';
      })
      // Detect anomaly
      .addCase(detectAnomaly.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(detectAnomaly.fulfilled, (state, action: PayloadAction<AnomalyDetection>) => {
        state.isLoading = false;
        state.anomalies.unshift(action.payload);
        state.unresolvedCount = state.anomalies.filter(a => !a.resolved).length;
        state.criticalCount = state.anomalies.filter(a => a.severity === 'critical' && !a.resolved).length;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(detectAnomaly.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to detect anomaly';
      });
  },
});

export const {
  clearAnomalyError,
  resetAnomalies,
  updateAnomalyCounts,
} = anomalySlice.actions;

// Selectors
export const selectAnomalies = (state: RootState) => state.anomaly.anomalies;
export const selectUnresolvedCount = (state: RootState) => state.anomaly.unresolvedCount;
export const selectCriticalCount = (state: RootState) => state.anomaly.criticalCount;
export const selectAnomalyIsLoading = (state: RootState) => state.anomaly.isLoading;
export const selectAnomalyError = (state: RootState) => state.anomaly.error;
export const selectAnomalyLastUpdated = (state: RootState) => state.anomaly.lastUpdated;

export default anomalySlice.reducer;
