import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AdvancedAnalyticsService from '../../services/analytics/advancedAnalytics';
import type {
  TimeSeriesForecast,
  AnomalyDetection,
  CircadianAnalysis,
  PersonalizedBaseline
} from '../../services/analytics/advancedAnalytics';

// Analytics state interface
export interface AnalyticsState {
  // Forecasts
  forecasts: TimeSeriesForecast[];
  isLoadingForecasts: boolean;
  
  // Anomalies
  anomalies: AnomalyDetection[];
  isLoadingAnomalies: boolean;
  
  // Circadian analysis
  circadianAnalysis: CircadianAnalysis | null;
  isLoadingCircadian: boolean;
  
  // Personalized baselines
  personalizedBaselines: PersonalizedBaseline[];
  isLoadingBaselines: boolean;
  
  // Health insights
  insights: {
    insights: string[];
    recommendations: string[];
    riskFactors: string[];
  };
  isLoadingInsights: boolean;
  
  // Analytics summary
  summary: {
    totalForecasts: number;
    activeAnomalies: number;
    personalizedBaselines: number;
    lastAnalysisDate: string | null;
  };
  
  // General state
  isInitialized: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: AnalyticsState = {
  forecasts: [],
  isLoadingForecasts: false,
  anomalies: [],
  isLoadingAnomalies: false,
  circadianAnalysis: null,
  isLoadingCircadian: false,
  personalizedBaselines: [],
  isLoadingBaselines: false,
  insights: {
    insights: [],
    recommendations: [],
    riskFactors: []
  },
  isLoadingInsights: false,
  summary: {
    totalForecasts: 0,
    activeAnomalies: 0,
    personalizedBaselines: 0,
    lastAnalysisDate: null
  },
  isInitialized: false,
  error: null,
  lastUpdated: null
};

// Async thunks
export const generateForecast = createAsyncThunk<
  TimeSeriesForecast,
  { userId: string; metric: string; horizon: string },
  { rejectValue: string }
>(
  'analytics/generateForecast',
  async ({ userId, metric, horizon }, { rejectWithValue }) => {
    try {
      if (!AdvancedAnalyticsService.isServiceInitialized()) {
        throw new Error('Analytics service not initialized');
      }
      return await AdvancedAnalyticsService.generateForecast(userId, metric, horizon);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate forecast');
    }
  }
);

export const detectAnomalies = createAsyncThunk<
  AnomalyDetection[],
  { userId: string; data: any[] },
  { rejectValue: string }
>(
  'analytics/detectAnomalies',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      if (!AdvancedAnalyticsService.isServiceInitialized()) {
        throw new Error('Analytics service not initialized');
      }
      return await AdvancedAnalyticsService.detectAnomalies(userId, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to detect anomalies');
    }
  }
);

export const analyzeCircadianRhythms = createAsyncThunk<
  CircadianAnalysis,
  { userId: string; data: any[] },
  { rejectValue: string }
>(
  'analytics/analyzeCircadianRhythms',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      if (!AdvancedAnalyticsService.isServiceInitialized()) {
        throw new Error('Analytics service not initialized');
      }
      return await AdvancedAnalyticsService.analyzeCircadianRhythms(userId, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to analyze circadian rhythms');
    }
  }
);

export const generateHealthInsights = createAsyncThunk<
  { insights: string[]; recommendations: string[]; riskFactors: string[] },
  { userId: string; healthData: any[] },
  { rejectValue: string }
>(
  'analytics/generateHealthInsights',
  async ({ userId, healthData }, { rejectWithValue }) => {
    try {
      if (!AdvancedAnalyticsService.isServiceInitialized()) {
        throw new Error('Analytics service not initialized');
      }
      return await AdvancedAnalyticsService.generateHealthInsights(userId, healthData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate health insights');
    }
  }
);

export const getAnalyticsSummary = createAsyncThunk<
  {
    totalForecasts: number;
    activeAnomalies: number;
    personalizedBaselines: number;
    lastAnalysisDate: string | null;
  },
  { userId: string },
  { rejectValue: string }
>(
  'analytics/getAnalyticsSummary',
  async ({ userId }, { rejectWithValue }) => {
    try {
      if (!AdvancedAnalyticsService.isServiceInitialized()) {
        throw new Error('Analytics service not initialized');
      }
      return await AdvancedAnalyticsService.getAnalyticsSummary(userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get analytics summary');
    }
  }
);

export const updatePersonalizedBaseline = createAsyncThunk<
  void,
  { userId: string; metric: string; value: number },
  { rejectValue: string }
>(
  'analytics/updatePersonalizedBaseline',
  async ({ userId, metric, value }, { rejectWithValue }) => {
    try {
      if (!AdvancedAnalyticsService.isServiceInitialized()) {
        throw new Error('Analytics service not initialized');
      }
      await AdvancedAnalyticsService.updatePersonalizedBaseline(userId, metric, value);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update personalized baseline');
    }
  }
);

// Analytics slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
    setAnalyticsInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    resetAnalytics: (state) => {
      return { ...initialState };
    },
    addPersonalizedBaseline: (state, action: PayloadAction<PersonalizedBaseline>) => {
      const existingIndex = state.personalizedBaselines.findIndex(
        baseline => baseline.userId === action.payload.userId && baseline.metric === action.payload.metric
      );
      
      if (existingIndex >= 0) {
        state.personalizedBaselines[existingIndex] = action.payload;
      } else {
        state.personalizedBaselines.push(action.payload);
      }
      state.lastUpdated = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    // Generate forecast
    builder
      .addCase(generateForecast.pending, (state) => {
        state.isLoadingForecasts = true;
        state.error = null;
      })
      .addCase(generateForecast.fulfilled, (state, action) => {
        state.isLoadingForecasts = false;
        const existingIndex = state.forecasts.findIndex(f => f.metric === action.payload.metric);
        if (existingIndex >= 0) {
          state.forecasts[existingIndex] = action.payload;
        } else {
          state.forecasts.push(action.payload);
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(generateForecast.rejected, (state, action) => {
        state.isLoadingForecasts = false;
        state.error = action.payload || 'Failed to generate forecast';
      });

    // Detect anomalies
    builder
      .addCase(detectAnomalies.pending, (state) => {
        state.isLoadingAnomalies = true;
        state.error = null;
      })
      .addCase(detectAnomalies.fulfilled, (state, action) => {
        state.isLoadingAnomalies = false;
        state.anomalies = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(detectAnomalies.rejected, (state, action) => {
        state.isLoadingAnomalies = false;
        state.error = action.payload || 'Failed to detect anomalies';
      });

    // Analyze circadian rhythms
    builder
      .addCase(analyzeCircadianRhythms.pending, (state) => {
        state.isLoadingCircadian = true;
        state.error = null;
      })
      .addCase(analyzeCircadianRhythms.fulfilled, (state, action) => {
        state.isLoadingCircadian = false;
        state.circadianAnalysis = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(analyzeCircadianRhythms.rejected, (state, action) => {
        state.isLoadingCircadian = false;
        state.error = action.payload || 'Failed to analyze circadian rhythms';
      });

    // Generate health insights
    builder
      .addCase(generateHealthInsights.pending, (state) => {
        state.isLoadingInsights = true;
        state.error = null;
      })
      .addCase(generateHealthInsights.fulfilled, (state, action) => {
        state.isLoadingInsights = false;
        state.insights = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(generateHealthInsights.rejected, (state, action) => {
        state.isLoadingInsights = false;
        state.error = action.payload || 'Failed to generate health insights';
      });

    // Get analytics summary
    builder
      .addCase(getAnalyticsSummary.pending, (state) => {
        state.error = null;
      })
      .addCase(getAnalyticsSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getAnalyticsSummary.rejected, (state, action) => {
        state.error = action.payload || 'Failed to get analytics summary';
      });

    // Update personalized baseline
    builder
      .addCase(updatePersonalizedBaseline.pending, (state) => {
        state.isLoadingBaselines = true;
        state.error = null;
      })
      .addCase(updatePersonalizedBaseline.fulfilled, (state) => {
        state.isLoadingBaselines = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updatePersonalizedBaseline.rejected, (state, action) => {
        state.isLoadingBaselines = false;
        state.error = action.payload || 'Failed to update personalized baseline';
      });
  }
});

export const {
  clearAnalyticsError,
  setAnalyticsInitialized,
  resetAnalytics,
  addPersonalizedBaseline
} = analyticsSlice.actions;

// Selectors
export const selectForecasts = (state: { analytics: AnalyticsState }) => state.analytics.forecasts;
export const selectAnomalies = (state: { analytics: AnalyticsState }) => state.analytics.anomalies;
export const selectCircadianAnalysis = (state: { analytics: AnalyticsState }) => state.analytics.circadianAnalysis;
export const selectPersonalizedBaselines = (state: { analytics: AnalyticsState }) => state.analytics.personalizedBaselines;
export const selectHealthInsights = (state: { analytics: AnalyticsState }) => state.analytics.insights;
export const selectAnalyticsSummary = (state: { analytics: AnalyticsState }) => state.analytics.summary;
export const selectIsAnalyticsInitialized = (state: { analytics: AnalyticsState }) => state.analytics.isInitialized;
export const selectAnalyticsError = (state: { analytics: AnalyticsState }) => state.analytics.error;
export const selectIsLoadingForecasts = (state: { analytics: AnalyticsState }) => state.analytics.isLoadingForecasts;
export const selectIsLoadingAnomalies = (state: { analytics: AnalyticsState }) => state.analytics.isLoadingAnomalies;
export const selectIsLoadingInsights = (state: { analytics: AnalyticsState }) => state.analytics.isLoadingInsights;

export default analyticsSlice.reducer;
