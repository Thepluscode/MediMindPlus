/**
 * Consultation Redux Slice for MediMindPlus
 * Manages video consultation booking and provider search
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { consultationAPI } from '../../services/consultationAPI';
import {
  Consultation,
  Provider,
  BookConsultationRequest,
  SearchProvidersRequest,
  VideoTokenResponse,
  ShareVitalsRequest,
  ConsultationState,
} from '../../types/consultation.types';

// Initial state
const initialState: ConsultationState = {
  consultations: [],
  currentConsultation: null,
  providers: [],
  selectedProvider: null,
  videoToken: null,
  isLoading: false,
  error: null,
};

// Async thunks

/**
 * Search for providers
 */
export const searchProviders = createAsyncThunk(
  'consultation/searchProviders',
  async (filters: SearchProvidersRequest, { rejectWithValue }) => {
    try {
      const result = await consultationAPI.searchProviders(filters);
      return result.providers;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search providers');
    }
  }
);

/**
 * Get provider details
 */
export const getProviderDetails = createAsyncThunk(
  'consultation/getProviderDetails',
  async (providerId: string, { rejectWithValue }) => {
    try {
      const provider = await consultationAPI.getProviderDetails(providerId);
      return provider;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch provider details');
    }
  }
);

/**
 * Book a consultation
 */
export const bookConsultation = createAsyncThunk(
  'consultation/book',
  async (request: BookConsultationRequest, { rejectWithValue }) => {
    try {
      const consultation = await consultationAPI.bookConsultation(request);
      return consultation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to book consultation');
    }
  }
);

/**
 * Fetch user's consultations
 */
export const fetchConsultations = createAsyncThunk(
  'consultation/fetchConsultations',
  async (_, { rejectWithValue }) => {
    try {
      const consultations = await consultationAPI.getConsultations();
      return consultations;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch consultations');
    }
  }
);

/**
 * Get a specific consultation
 */
export const getConsultationById = createAsyncThunk(
  'consultation/getById',
  async (consultationId: string, { rejectWithValue }) => {
    try {
      const consultation = await consultationAPI.getConsultationById(consultationId);
      return consultation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch consultation');
    }
  }
);

/**
 * Cancel a consultation
 */
export const cancelConsultation = createAsyncThunk(
  'consultation/cancel',
  async (
    { consultationId, reason }: { consultationId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      await consultationAPI.cancelConsultation(consultationId, reason);
      return consultationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel consultation');
    }
  }
);

/**
 * Generate video token
 */
export const generateVideoToken = createAsyncThunk(
  'consultation/generateVideoToken',
  async (
    { consultationId, role }: { consultationId: string; role: 'patient' | 'provider' },
    { rejectWithValue }
  ) => {
    try {
      const token = await consultationAPI.generateVideoToken(consultationId, role);
      return token;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate video token');
    }
  }
);

/**
 * Join video call
 */
export const joinVideoCall = createAsyncThunk(
  'consultation/joinVideoCall',
  async (consultationId: string, { rejectWithValue }) => {
    try {
      await consultationAPI.joinVideoCall(consultationId);
      return consultationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to join video call');
    }
  }
);

/**
 * End video call
 */
export const endVideoCall = createAsyncThunk(
  'consultation/endVideoCall',
  async (consultationId: string, { rejectWithValue }) => {
    try {
      await consultationAPI.endVideoCall(consultationId);
      return consultationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to end video call');
    }
  }
);

/**
 * Share patient vitals
 */
export const shareVitals = createAsyncThunk(
  'consultation/shareVitals',
  async (request: ShareVitalsRequest, { rejectWithValue }) => {
    try {
      await consultationAPI.shareVitals(request);
      return request;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to share vitals');
    }
  }
);

// Slice
const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    setSelectedProvider: (state, action: PayloadAction<Provider | null>) => {
      state.selectedProvider = action.payload;
    },
    setCurrentConsultation: (state, action: PayloadAction<Consultation | null>) => {
      state.currentConsultation = action.payload;
    },
    clearVideoToken: (state) => {
      state.videoToken = null;
    },
    clearConsultationError: (state) => {
      state.error = null;
    },
    resetConsultationState: (state) => {
      state.consultations = [];
      state.currentConsultation = null;
      state.providers = [];
      state.selectedProvider = null;
      state.videoToken = null;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Search Providers
    builder
      .addCase(searchProviders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchProviders.fulfilled, (state, action: PayloadAction<Provider[]>) => {
        state.isLoading = false;
        state.providers = action.payload;
        state.error = null;
      })
      .addCase(searchProviders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get Provider Details
    builder
      .addCase(getProviderDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProviderDetails.fulfilled, (state, action: PayloadAction<Provider>) => {
        state.isLoading = false;
        state.selectedProvider = action.payload;
        state.error = null;
      })
      .addCase(getProviderDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Book Consultation
    builder
      .addCase(bookConsultation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bookConsultation.fulfilled, (state, action: PayloadAction<Consultation>) => {
        state.isLoading = false;
        state.currentConsultation = action.payload;
        state.consultations.unshift(action.payload); // Add to beginning
        state.error = null;
      })
      .addCase(bookConsultation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Consultations
    builder
      .addCase(fetchConsultations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConsultations.fulfilled, (state, action: PayloadAction<Consultation[]>) => {
        state.isLoading = false;
        state.consultations = action.payload;
        state.error = null;
      })
      .addCase(fetchConsultations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get Consultation By ID
    builder
      .addCase(getConsultationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getConsultationById.fulfilled, (state, action: PayloadAction<Consultation>) => {
        state.isLoading = false;
        state.currentConsultation = action.payload;
        state.error = null;
      })
      .addCase(getConsultationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel Consultation
    builder
      .addCase(cancelConsultation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelConsultation.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        // Update consultation status in the list
        const index = state.consultations.findIndex(c => c.id === action.payload);
        if (index !== -1) {
          state.consultations[index].status = 'CANCELLED';
        }
        if (state.currentConsultation?.id === action.payload) {
          state.currentConsultation.status = 'CANCELLED';
        }
        state.error = null;
      })
      .addCase(cancelConsultation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Generate Video Token
    builder
      .addCase(generateVideoToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateVideoToken.fulfilled, (state, action: PayloadAction<VideoTokenResponse>) => {
        state.isLoading = false;
        state.videoToken = action.payload;
        state.error = null;
      })
      .addCase(generateVideoToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Join Video Call
    builder
      .addCase(joinVideoCall.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinVideoCall.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(joinVideoCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // End Video Call
    builder
      .addCase(endVideoCall.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(endVideoCall.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        // Update consultation status
        const index = state.consultations.findIndex(c => c.id === action.payload);
        if (index !== -1) {
          state.consultations[index].status = 'COMPLETED';
        }
        if (state.currentConsultation?.id === action.payload) {
          state.currentConsultation.status = 'COMPLETED';
        }
        state.videoToken = null; // Clear video token after ending call
        state.error = null;
      })
      .addCase(endVideoCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Share Vitals
    builder
      .addCase(shareVitals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(shareVitals.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(shareVitals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setSelectedProvider,
  setCurrentConsultation,
  clearVideoToken,
  clearConsultationError,
  resetConsultationState,
} = consultationSlice.actions;

// Export reducer
export default consultationSlice.reducer;
