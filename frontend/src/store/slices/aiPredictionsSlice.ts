import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { predictionService } from '../../services/predictionService';
import { AIPrediction, VoiceAnalysisResponse, RiskPredictions, AIPredictionsState } from '../../types/models/ai';
import type { RootState } from '../types';

const initialPredictions: RiskPredictions = {
  cardiovascular_disease: 0,
  diabetes_type2: 0,
  cancer_breast: 0,
  cancer_lung: 0,
};

const initialState: AIPredictionsState = {
  predictions: { ...initialPredictions },
  voiceAnalysis: {},
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const getRiskPredictions = createAsyncThunk<
  RiskPredictions,
  void,
  { rejectValue: string }
>(
  'aiPredictions/getRiskPredictions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await predictionService.getPredictions();
      return response as unknown as RiskPredictions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get predictions');
    }
  }
);

export const analyzeVoiceData = createAsyncThunk<
  VoiceAnalysisResponse,
  string, // audioUri
  { rejectValue: string }
>(
  'aiPredictions/analyzeVoiceData',
  async (audioUri, { rejectWithValue }) => {
    try {
      const response = await predictionService.analyzeVoice({ 
        audioUri,
        mimeType: 'audio/m4a' 
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Voice analysis failed');
    }
  }
);

const aiPredictionsSlice = createSlice({
  name: 'aiPredictions',
  initialState,
  reducers: {
    clearPredictionsError: (state) => {
      state.error = null;
    },
    resetPredictions: (state) => {
      state.predictions = { ...initialPredictions };
      state.voiceAnalysis = {};
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get risk predictions
      .addCase(getRiskPredictions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRiskPredictions.fulfilled, (state, action: PayloadAction<RiskPredictions>) => {
        state.isLoading = false;
        state.predictions = { ...state.predictions, ...action.payload };
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getRiskPredictions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get predictions';
      })
      // Analyze voice data
      .addCase(analyzeVoiceData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(analyzeVoiceData.fulfilled, (state, action: PayloadAction<VoiceAnalysisResponse>) => {
        state.isLoading = false;
        state.voiceAnalysis = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(analyzeVoiceData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Voice analysis failed';
      });
  },
});

export const {
  clearPredictionsError,
  resetPredictions
} = aiPredictionsSlice.actions;

// Selectors
export const selectPredictions = (state: RootState) => state.aiPredictions.predictions;
export const selectVoiceAnalysis = (state: RootState) => state.aiPredictions.voiceAnalysis;
export const selectIsLoading = (state: RootState) => state.aiPredictions.isLoading;
export const selectError = (state: RootState) => state.aiPredictions.error;
export const selectLastUpdated = (state: RootState) => state.aiPredictions.lastUpdated;

export default aiPredictionsSlice.reducer;
