import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { aiBlockchainService, PatientConsent } from '../../services/aiBlockchainService';
import type { RootState } from '../types';

interface ConsentState {
  consent: PatientConsent | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: ConsentState = {
  consent: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const getConsent = createAsyncThunk<
  PatientConsent,
  void,
  { rejectValue: string }
>(
  'consent/getConsent',
  async (_, { rejectWithValue }) => {
    try {
      const consent = await aiBlockchainService.getConsent();
      return consent;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get consent');
    }
  }
);

export const updateConsent = createAsyncThunk<
  PatientConsent,
  { consentGiven: boolean; consentScope: string[] },
  { rejectValue: string }
>(
  'consent/updateConsent',
  async ({ consentGiven, consentScope }, { rejectWithValue }) => {
    try {
      const consent = await aiBlockchainService.updateConsent(consentGiven, consentScope);
      return consent;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update consent');
    }
  }
);

const consentSlice = createSlice({
  name: 'consent',
  initialState,
  reducers: {
    clearConsentError: (state) => {
      state.error = null;
    },
    resetConsent: (state) => {
      state.consent = null;
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get consent
      .addCase(getConsent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getConsent.fulfilled, (state, action: PayloadAction<PatientConsent>) => {
        state.isLoading = false;
        state.consent = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getConsent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get consent';
      })
      // Update consent
      .addCase(updateConsent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateConsent.fulfilled, (state, action: PayloadAction<PatientConsent>) => {
        state.isLoading = false;
        state.consent = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateConsent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update consent';
      });
  },
});

export const {
  clearConsentError,
  resetConsent,
} = consentSlice.actions;

// Selectors
export const selectConsent = (state: RootState) => state.consent.consent;
export const selectConsentIsLoading = (state: RootState) => state.consent.isLoading;
export const selectConsentError = (state: RootState) => state.consent.error;
export const selectConsentLastUpdated = (state: RootState) => state.consent.lastUpdated;

export default consentSlice.reducer;
