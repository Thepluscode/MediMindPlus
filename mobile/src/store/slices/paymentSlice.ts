/**
 * Payment Redux Slice for MediMindPlus
 * Manages payment state and Stripe payment intents
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentAPI } from '../../services/paymentAPI';
import {
  PaymentIntent,
  PaymentHistory,
  ProviderEarnings,
  PaymentState,
} from '../../types/payment.types';

// Initial state
const initialState: PaymentState = {
  paymentIntent: null,
  paymentHistory: [],
  providerEarnings: null,
  isLoading: false,
  error: null,
};

// Async thunks

/**
 * Create a Stripe Payment Intent
 */
export const createPaymentIntent = createAsyncThunk(
  'payment/createIntent',
  async (
    { consultationId, amount }: { consultationId: string; amount: number },
    { rejectWithValue }
  ) => {
    try {
      const paymentIntent = await paymentAPI.createPaymentIntent(consultationId, amount);
      return paymentIntent;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create payment intent');
    }
  }
);

/**
 * Confirm a payment
 */
export const confirmPayment = createAsyncThunk(
  'payment/confirm',
  async (
    { consultationId, paymentIntentId }: { consultationId: string; paymentIntentId: string },
    { rejectWithValue }
  ) => {
    try {
      await paymentAPI.confirmPayment(consultationId, paymentIntentId);
      return { consultationId, paymentIntentId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to confirm payment');
    }
  }
);

/**
 * Process a refund
 */
export const processRefund = createAsyncThunk(
  'payment/refund',
  async (
    { consultationId, reason }: { consultationId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      await paymentAPI.processRefund(consultationId, reason);
      return consultationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to process refund');
    }
  }
);

/**
 * Fetch payment history
 */
export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const history = await paymentAPI.getPaymentHistory();
      return history;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment history');
    }
  }
);

/**
 * Fetch provider earnings
 */
export const fetchProviderEarnings = createAsyncThunk(
  'payment/fetchEarnings',
  async (providerId: string, { rejectWithValue }) => {
    try {
      const earnings = await paymentAPI.getProviderEarnings(providerId);
      return earnings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch provider earnings');
    }
  }
);

// Slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentIntent: (state) => {
      state.paymentIntent = null;
    },
    clearPaymentError: (state) => {
      state.error = null;
    },
    resetPaymentState: (state) => {
      state.paymentIntent = null;
      state.paymentHistory = [];
      state.providerEarnings = null;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Create Payment Intent
    builder
      .addCase(createPaymentIntent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action: PayloadAction<PaymentIntent>) => {
        state.isLoading = false;
        state.paymentIntent = action.payload;
        state.error = null;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Confirm Payment
    builder
      .addCase(confirmPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // Clear payment intent after successful confirmation
        state.paymentIntent = null;
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Process Refund
    builder
      .addCase(processRefund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processRefund.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Payment History
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action: PayloadAction<PaymentHistory[]>) => {
        state.isLoading = false;
        state.paymentHistory = action.payload;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Provider Earnings
    builder
      .addCase(fetchProviderEarnings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderEarnings.fulfilled, (state, action: PayloadAction<ProviderEarnings>) => {
        state.isLoading = false;
        state.providerEarnings = action.payload;
        state.error = null;
      })
      .addCase(fetchProviderEarnings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearPaymentIntent, clearPaymentError, resetPaymentState } = paymentSlice.actions;

// Export reducer
export default paymentSlice.reducer;
