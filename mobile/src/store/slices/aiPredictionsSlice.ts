import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { predictionService } from '../../services/predictionService';
import { aiBlockchainService, ExplainableAIPrediction, AIModel } from '../../services/aiBlockchainService';
import { AIPrediction, VoiceAnalysisResponse, RiskPredictions, AIPredictionsState } from '../../types/models/ai';
import type { RootState } from '../types';

const initialPredictions: RiskPredictions = {
  cardiovascular_disease: 0,
  diabetes_type2: 0,
  cancer_breast: 0,
  cancer_lung: 0,
};

interface ExtendedAIPredictionsState extends AIPredictionsState {
  explainablePredictions: ExplainableAIPrediction[];
  availableModels: AIModel[];
  selectedModel: AIModel | null;
  currentPrediction: ExplainableAIPrediction | null;
  verificationStatus: { [key: string]: boolean };
}

const initialState: ExtendedAIPredictionsState = {
  predictions: { ...initialPredictions },
  voiceAnalysis: {},
  isLoading: false,
  error: null,
  lastUpdated: null,
  explainablePredictions: [],
  availableModels: [],
  selectedModel: null,
  currentPrediction: null,
  verificationStatus: {},
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

// New AI-Blockchain thunks
export const getAvailableModels = createAsyncThunk<
  AIModel[],
  void,
  { rejectValue: string }
>(
  'aiPredictions/getAvailableModels',
  async (_, { rejectWithValue }) => {
    try {
      const models = await aiBlockchainService.getAvailableModels();
      return models;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get models');
    }
  }
);

export const makeExplainablePrediction = createAsyncThunk<
  ExplainableAIPrediction,
  { modelName: string; inputData: any },
  { rejectValue: string }
>(
  'aiPredictions/makeExplainablePrediction',
  async ({ modelName, inputData }, { rejectWithValue }) => {
    try {
      const prediction = await aiBlockchainService.makeExplainablePrediction(modelName, inputData);
      return prediction;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Prediction failed');
    }
  }
);

export const getUserPredictions = createAsyncThunk<
  ExplainableAIPrediction[],
  void,
  { rejectValue: string }
>(
  'aiPredictions/getUserPredictions',
  async (_, { rejectWithValue }) => {
    try {
      const predictions = await aiBlockchainService.getUserPredictions();
      return predictions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get predictions');
    }
  }
);

export const verifyPrediction = createAsyncThunk<
  { predictionId: string; verified: boolean },
  string,
  { rejectValue: string }
>(
  'aiPredictions/verifyPrediction',
  async (predictionId, { rejectWithValue }) => {
    try {
      const result = await aiBlockchainService.verifyPrediction(predictionId);
      return { predictionId, verified: result.verified };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Verification failed');
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
      state.explainablePredictions = [];
      state.currentPrediction = null;
    },
    setSelectedModel: (state, action: PayloadAction<AIModel | null>) => {
      state.selectedModel = action.payload;
    },
    setCurrentPrediction: (state, action: PayloadAction<ExplainableAIPrediction | null>) => {
      state.currentPrediction = action.payload;
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
      })
      // Get available models
      .addCase(getAvailableModels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailableModels.fulfilled, (state, action: PayloadAction<AIModel[]>) => {
        state.isLoading = false;
        state.availableModels = action.payload;
      })
      .addCase(getAvailableModels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get models';
      })
      // Make explainable prediction
      .addCase(makeExplainablePrediction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makeExplainablePrediction.fulfilled, (state, action: PayloadAction<ExplainableAIPrediction>) => {
        state.isLoading = false;
        state.currentPrediction = action.payload;
        state.explainablePredictions.unshift(action.payload);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(makeExplainablePrediction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Prediction failed';
      })
      // Get user predictions
      .addCase(getUserPredictions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserPredictions.fulfilled, (state, action: PayloadAction<ExplainableAIPrediction[]>) => {
        state.isLoading = false;
        state.explainablePredictions = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getUserPredictions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get predictions';
      })
      // Verify prediction
      .addCase(verifyPrediction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPrediction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationStatus[action.payload.predictionId] = action.payload.verified;
      })
      .addCase(verifyPrediction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Verification failed';
      });
  },
});

export const {
  clearPredictionsError,
  resetPredictions,
  setSelectedModel,
  setCurrentPrediction,
} = aiPredictionsSlice.actions;

// Selectors
export const selectPredictions = (state: RootState) => state.aiPredictions.predictions;
export const selectVoiceAnalysis = (state: RootState) => state.aiPredictions.voiceAnalysis;
export const selectIsLoading = (state: RootState) => state.aiPredictions.isLoading;
export const selectError = (state: RootState) => state.aiPredictions.error;
export const selectLastUpdated = (state: RootState) => state.aiPredictions.lastUpdated;
export const selectExplainablePredictions = (state: RootState) => state.aiPredictions.explainablePredictions;
export const selectAvailableModels = (state: RootState) => state.aiPredictions.availableModels;
export const selectSelectedModel = (state: RootState) => state.aiPredictions.selectedModel;
export const selectCurrentPrediction = (state: RootState) => state.aiPredictions.currentPrediction;
export const selectVerificationStatus = (state: RootState) => state.aiPredictions.verificationStatus;

export default aiPredictionsSlice.reducer;
