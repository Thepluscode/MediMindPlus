# Frontend Implementation Guide
## Video Consultations & Payment Integration

**Date**: November 11, 2025
**Status**: Implementation Ready
**Dependencies Installed**: ✅ @stripe/stripe-react-native

---

## 📋 Overview

This guide provides complete code for implementing:
1. **Payment Processing** with Stripe
2. **Consultation Booking** with provider search
3. **Video Consultation** enhancements

All code follows your existing architecture patterns (Redux + Services + TypeScript).

---

## 🎯 Quick Implementation Checklist

- [x] Install @stripe/stripe-react-native
- [ ] Copy payment API service → `src/services/paymentAPI.ts`
- [ ] Copy payment Redux slice → `src/store/slices/paymentSlice.ts`
- [ ] Copy consultation API service → `src/services/consultationAPI.ts`
- [ ] Copy consultation Redux slice → `src/store/slices/consultationSlice.ts`
- [ ] Copy payment types → `src/types/payment.types.ts`
- [ ] Copy consultation types → `src/types/consultation.types.ts`
- [ ] Copy provider search screen → `src/screens/ProviderSearchScreen.tsx`
- [ ] Copy booking screen → `src/screens/BookingScreen.tsx`
- [ ] Copy payment screen → `src/screens/PaymentScreen.tsx`
- [ ] Copy payment history screen → `src/screens/PaymentHistoryScreen.tsx`
- [ ] Update App.tsx with Stripe provider
- [ ] Update navigation with new screens

---

## 📁 File Structure

```
frontend/src/
├── services/
│   ├── paymentAPI.ts          # NEW: Stripe payment service
│   ├── consultationAPI.ts     # NEW: Consultation booking service
│   └── api.ts                 # EXISTS: Base API (update base URL)
├── store/slices/
│   ├── paymentSlice.ts        # NEW: Payment Redux state
│   └── consultationSlice.ts   # NEW: Consultation Redux state
├── types/
│   ├── payment.types.ts       # NEW: Payment interfaces
│   └── consultation.types.ts  # NEW: Consultation interfaces
├── screens/
│   ├── ProviderSearchScreen.tsx    # NEW: Search providers
│   ├── BookingScreen.tsx           # NEW: Book consultation
│   ├── PaymentScreen.tsx           # NEW: Stripe checkout
│   └── PaymentHistoryScreen.tsx    # NEW: Transaction history
├── components/
│   ├── ProviderCard.tsx            # NEW: Provider list item
│   └── PaymentCard.tsx             # NEW: Payment method card
└── navigation/
    └── AppNavigator.tsx        # UPDATE: Add new screens
```

---

## 1️⃣ TypeScript Types

### `src/types/payment.types.ts`

```typescript
export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export interface PaymentHistory {
  consultationId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  paymentDate: string;
  providerName: string;
  consultationType: string;
}

export interface ProviderEarnings {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  consultationsCount: number;
}

export interface PaymentState {
  paymentIntent: PaymentIntent | null;
  paymentHistory: PaymentHistory[];
  providerEarnings: ProviderEarnings | null;
  loading: boolean;
  error: string | null;
}
```

### `src/types/consultation.types.ts`

```typescript
export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  rating: number;
  consultationFee: number;
  yearsExperience: number;
  bio: string;
  acceptingPatients: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export interface Consultation {
  id: string;
  patientId: string;
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  consultationType: string;
  reasonForVisit: string;
  amountCharged: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  twilioRoomName?: string;
}

export interface BookConsultationRequest {
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  consultationType: string;
  reasonForVisit: string;
}

export interface ConsultationState {
  providers: Provider[];
  selectedProvider: Provider | null;
  currentConsultation: Consultation | null;
  consultations: Consultation[];
  loading: boolean;
  error: string | null;
}
```

---

## 2️⃣ API Services

### `src/services/paymentAPI.ts`

```typescript
import api from './api';
import {
  PaymentIntent,
  PaymentHistory,
  ProviderEarnings
} from '../types/payment.types';

class PaymentAPI {
  /**
   * Create payment intent for consultation
   */
  async createPaymentIntent(
    consultationId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<PaymentIntent> {
    const response = await api.post('/payments/create-intent', {
      consultationId,
      amount,
      currency
    });
    return response.data.data;
  }

  /**
   * Confirm payment after Stripe.js succeeds
   */
  async confirmPayment(
    consultationId: string,
    paymentIntentId: string
  ): Promise<void> {
    await api.post('/payments/confirm', {
      consultationId,
      paymentIntentId
    });
  }

  /**
   * Process refund for consultation
   */
  async processRefund(
    consultationId: string,
    reason: string
  ): Promise<void> {
    await api.post('/payments/refund', {
      consultationId,
      reason
    });
  }

  /**
   * Get payment history for patient
   */
  async getPaymentHistory(): Promise<PaymentHistory[]> {
    const response = await api.get('/payments/history');
    return response.data.data;
  }

  /**
   * Get provider earnings (for providers only)
   */
  async getProviderEarnings(providerId: string): Promise<ProviderEarnings> {
    const response = await api.get(`/payments/provider/${providerId}/earnings`);
    return response.data.data;
  }
}

export default new PaymentAPI();
```

### `src/services/consultationAPI.ts`

```typescript
import api from './api';
import {
  Provider,
  Consultation,
  BookConsultationRequest
} from '../types/consultation.types';

class ConsultationAPI {
  /**
   * Search providers by specialty
   */
  async searchProviders(specialty?: string, location?: string): Promise<Provider[]> {
    const params = new URLSearchParams();
    if (specialty) params.append('specialty', specialty);
    if (location) params.append('location', location);

    const response = await api.get(`/consultations/providers/search?${params.toString()}`);
    return response.data.data.providers;
  }

  /**
   * Get provider details
   */
  async getProvider(providerId: string): Promise<Provider> {
    const response = await api.get(`/provider/${providerId}`);
    return response.data.data;
  }

  /**
   * Book a consultation
   */
  async bookConsultation(data: BookConsultationRequest): Promise<Consultation> {
    const response = await api.post('/consultations/book', data);
    return response.data.data;
  }

  /**
   * Get patient's consultations
   */
  async getMyConsultations(): Promise<Consultation[]> {
    const response = await api.get('/consultations/my-consultations');
    return response.data.data;
  }

  /**
   * Generate Twilio video token
   */
  async generateVideoToken(
    consultationId: string,
    role: 'patient' | 'provider'
  ): Promise<{ token: string; roomName: string }> {
    const response = await api.post('/consultations/video/generate-token', {
      consultationId,
      role
    });
    return response.data.data;
  }

  /**
   * Share vitals during consultation
   */
  async shareVitals(
    consultationId: string,
    vitals: {
      heartRate?: number;
      bloodPressure?: { systolic: number; diastolic: number };
      oxygenSaturation?: number;
      bloodGlucose?: number;
    }
  ): Promise<void> {
    await api.post('/consultations/video/share-vitals', {
      consultationId,
      vitals
    });
  }

  /**
   * Cancel consultation
   */
  async cancelConsultation(
    consultationId: string,
    reason: string
  ): Promise<void> {
    await api.post(`/consultations/${consultationId}/cancel`, { reason });
  }
}

export default new ConsultationAPI();
```

---

## 3️⃣ Redux Slices

### `src/store/slices/paymentSlice.ts`

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import paymentAPI from '../../services/paymentAPI';
import { PaymentState, PaymentIntent, PaymentHistory } from '../../types/payment.types';

const initialState: PaymentState = {
  paymentIntent: null,
  paymentHistory: [],
  providerEarnings: null,
  loading: false,
  error: null
};

// Async thunks
export const createPaymentIntent = createAsyncThunk(
  'payment/createIntent',
  async ({ consultationId, amount }: { consultationId: string; amount: number }) => {
    return await paymentAPI.createPaymentIntent(consultationId, amount);
  }
);

export const confirmPayment = createAsyncThunk(
  'payment/confirm',
  async ({ consultationId, paymentIntentId }: { consultationId: string; paymentIntentId: string }) => {
    await paymentAPI.confirmPayment(consultationId, paymentIntentId);
    return { consultationId, paymentIntentId };
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async () => {
    return await paymentAPI.getPaymentHistory();
  }
);

export const processRefund = createAsyncThunk(
  'payment/refund',
  async ({ consultationId, reason }: { consultationId: string; reason: string }) => {
    await paymentAPI.processRefund(consultationId, reason);
    return consultationId;
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentIntent: (state) => {
      state.paymentIntent = null;
    },
    clearPaymentError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create payment intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action: PayloadAction<PaymentIntent>) => {
        state.loading = false;
        state.paymentIntent = action.payload;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create payment intent';
      })

      // Confirm payment
      .addCase(confirmPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(confirmPayment.fulfilled, (state) => {
        state.loading = false;
        state.paymentIntent = null;
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to confirm payment';
      })

      // Fetch payment history
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action: PayloadAction<PaymentHistory[]>) => {
        state.loading = false;
        state.paymentHistory = action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch payment history';
      })

      // Process refund
      .addCase(processRefund.fulfilled, (state, action) => {
        // Update payment history status
        const consultation = state.paymentHistory.find(p => p.consultationId === action.payload);
        if (consultation) {
          consultation.status = 'REFUNDED';
        }
      });
  }
});

export const { clearPaymentIntent, clearPaymentError } = paymentSlice.actions;
export default paymentSlice.reducer;
```

### `src/store/slices/consultationSlice.ts`

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import consultationAPI from '../../services/consultationAPI';
import {
  ConsultationState,
  Provider,
  Consultation,
  BookConsultationRequest
} from '../../types/consultation.types';

const initialState: ConsultationState = {
  providers: [],
  selectedProvider: null,
  currentConsultation: null,
  consultations: [],
  loading: false,
  error: null
};

// Async thunks
export const searchProviders = createAsyncThunk(
  'consultation/searchProviders',
  async ({ specialty, location }: { specialty?: string; location?: string }) => {
    return await consultationAPI.searchProviders(specialty, location);
  }
);

export const bookConsultation = createAsyncThunk(
  'consultation/book',
  async (data: BookConsultationRequest) => {
    return await consultationAPI.bookConsultation(data);
  }
);

export const fetchMyConsultations = createAsyncThunk(
  'consultation/fetchMy',
  async () => {
    return await consultationAPI.getMyConsultations();
  }
);

export const generateVideoToken = createAsyncThunk(
  'consultation/generateToken',
  async ({ consultationId, role }: { consultationId: string; role: 'patient' | 'provider' }) => {
    return await consultationAPI.generateVideoToken(consultationId, role);
  }
);

export const cancelConsultation = createAsyncThunk(
  'consultation/cancel',
  async ({ consultationId, reason }: { consultationId: string; reason: string }) => {
    await consultationAPI.cancelConsultation(consultationId, reason);
    return consultationId;
  }
);

const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    setSelectedProvider: (state, action: PayloadAction<Provider>) => {
      state.selectedProvider = action.payload;
    },
    clearSelectedProvider: (state) => {
      state.selectedProvider = null;
    },
    setCurrentConsultation: (state, action: PayloadAction<Consultation>) => {
      state.currentConsultation = action.payload;
    },
    clearCurrentConsultation: (state) => {
      state.currentConsultation = null;
    },
    clearConsultationError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Search providers
      .addCase(searchProviders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProviders.fulfilled, (state, action: PayloadAction<Provider[]>) => {
        state.loading = false;
        state.providers = action.payload;
      })
      .addCase(searchProviders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search providers';
      })

      // Book consultation
      .addCase(bookConsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookConsultation.fulfilled, (state, action: PayloadAction<Consultation>) => {
        state.loading = false;
        state.currentConsultation = action.payload;
        state.consultations.unshift(action.payload);
      })
      .addCase(bookConsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to book consultation';
      })

      // Fetch my consultations
      .addCase(fetchMyConsultations.fulfilled, (state, action: PayloadAction<Consultation[]>) => {
        state.consultations = action.payload;
      })

      // Cancel consultation
      .addCase(cancelConsultation.fulfilled, (state, action) => {
        const consultation = state.consultations.find(c => c.id === action.payload);
        if (consultation) {
          consultation.status = 'CANCELLED';
        }
      });
  }
});

export const {
  setSelectedProvider,
  clearSelectedProvider,
  setCurrentConsultation,
  clearCurrentConsultation,
  clearConsultationError
} = consultationSlice.actions;

export default consultationSlice.reducer;
```

---

## 4️⃣ Update Redux Store

### `src/store/index.ts` (Update)

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Existing reducers
import authReducer from './slices/authSlice';
import healthReducer from './slices/healthSlice';

// NEW: Add these imports
import paymentReducer from './slices/paymentSlice';
import consultationReducer from './slices/consultationSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'] // Only persist auth
};

const rootReducer = {
  auth: persistReducer(persistConfig, authReducer),
  health: healthReducer,
  payment: paymentReducer,           // NEW
  consultation: consultationReducer  // NEW
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 5️⃣ React Native Screens

### `src/screens/ProviderSearchScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { searchProviders, setSelectedProvider } from '../store/slices/consultationSlice';
import { RootState, AppDispatch } from '../store';
import { Provider } from '../types/consultation.types';

export default function ProviderSearchScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { providers, loading } = useSelector((state: RootState) => state.consultation);

  const [specialty, setSpecialty] = useState('');

  useEffect(() => {
    dispatch(searchProviders({ specialty: 'PRIMARY_CARE' }));
  }, []);

  const handleSearch = () => {
    dispatch(searchProviders({ specialty: specialty || undefined }));
  };

  const handleSelectProvider = (provider: Provider) => {
    dispatch(setSelectedProvider(provider));
    navigation.navigate('Booking' as never);
  };

  const renderProvider = ({ item }: { item: Provider }) => (
    <TouchableOpacity
      style={styles.providerCard}
      onPress={() => handleSelectProvider(item)}
    >
      <View style={styles.providerHeader}>
        <Text style={styles.providerName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.providerRating}>⭐ {item.rating.toFixed(1)}</Text>
      </View>

      <Text style={styles.providerSpecialty}>{item.specialty}</Text>
      <Text style={styles.providerBio} numberOfLines={2}>
        {item.bio}
      </Text>

      <View style={styles.providerFooter}>
        <Text style={styles.providerExperience}>
          {item.yearsExperience} years experience
        </Text>
        <Text style={styles.providerFee}>
          ${(item.consultationFee / 100).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && providers.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by specialty..."
          value={specialty}
          onChangeText={setSpecialty}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={providers}
        renderItem={renderProvider}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No providers found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF'
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600'
  },
  list: {
    padding: 16
  },
  providerCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  },
  providerRating: {
    fontSize: 16,
    color: '#FF9500'
  },
  providerSpecialty: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8
  },
  providerBio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  providerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  providerExperience: {
    fontSize: 13,
    color: '#999'
  },
  providerFee: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999'
  }
});
```

### `src/screens/BookingScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { bookConsultation } from '../store/slices/consultationSlice';
import { RootState, AppDispatch } from '../store';

export default function BookingScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { selectedProvider, loading } = useSelector((state: RootState) => state.consultation);

  const [consultationType, setConsultationType] = useState('ROUTINE_CHECKUP');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (!selectedProvider) {
    return (
      <View style={styles.centered}>
        <Text>No provider selected</Text>
      </View>
    );
  }

  const handleBooking = async () => {
    if (!reasonForVisit.trim()) {
      Alert.alert('Error', 'Please provide a reason for visit');
      return;
    }

    const scheduledStart = new Date(selectedDate);
    scheduledStart.setHours(10, 0, 0, 0); // 10:00 AM

    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + 30);

    try {
      const result = await dispatch(
        bookConsultation({
          providerId: selectedProvider.id,
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          consultationType,
          reasonForVisit
        })
      ).unwrap();

      // Navigate to payment screen
      navigation.navigate('Payment' as never, { consultation: result } as never);
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message || 'Failed to book consultation');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>
          Dr. {selectedProvider.firstName} {selectedProvider.lastName}
        </Text>
        <Text style={styles.providerSpecialty}>{selectedProvider.specialty}</Text>
        <Text style={styles.consultationFee}>
          Fee: ${(selectedProvider.consultationFee / 100).toFixed(2)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Consultation Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={consultationType}
            onValueChange={(value) => setConsultationType(value)}
            style={styles.picker}
          >
            <Picker.Item label="Routine Checkup" value="ROUTINE_CHECKUP" />
            <Picker.Item label="Follow-up" value="FOLLOW_UP" />
            <Picker.Item label="Urgent Care" value="URGENT_CARE" />
            <Picker.Item label="Mental Health" value="MENTAL_HEALTH" />
            <Picker.Item label="Prescription Refill" value="PRESCRIPTION_REFILL" />
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Reason for Visit *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your symptoms or reason for consultation..."
          multiline
          numberOfLines={4}
          value={reasonForVisit}
          onChangeText={setReasonForVisit}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Preferred Date</Text>
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
        <Text style={styles.timeText}>10:00 AM - 10:30 AM</Text>
      </View>

      <TouchableOpacity
        style={[styles.bookButton, loading && styles.bookButtonDisabled]}
        onPress={handleBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.bookButtonText}>Proceed to Payment</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  providerInfo: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  providerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4
  },
  providerSpecialty: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8
  },
  consultationFee: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759'
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4
  },
  timeText: {
    fontSize: 14,
    color: '#666'
  },
  bookButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  bookButtonDisabled: {
    backgroundColor: '#999'
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700'
  }
});
```

---

## 6️⃣ Stripe Payment Screen

### `src/screens/PaymentScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { createPaymentIntent, confirmPayment } from '../store/slices/paymentSlice';
import { RootState, AppDispatch } from '../store';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RVJBGIYzxeKN90NS2yhS9dWGheZYi70uoQ8PZHOknAxSixQvUtJI7AlI1guQmjD276xq3UvPCP8MDe7TOh1rhoi00v5ORt563';

function PaymentScreenContent() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { presentPaymentSheet } = useStripe();

  const { paymentIntent, loading } = useSelector((state: RootState) => state.payment);
  const [processing, setProcessing] = useState(false);

  const consultation = (route.params as any)?.consultation;

  useEffect(() => {
    if (consultation) {
      dispatch(
        createPaymentIntent({
          consultationId: consultation.id,
          amount: consultation.amountCharged
        })
      );
    }
  }, [consultation]);

  const handlePayment = async () => {
    if (!paymentIntent) return;

    setProcessing(true);

    try {
      const { error } = await presentPaymentSheet({
        paymentIntentClientSecret: paymentIntent.clientSecret
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
      } else {
        // Confirm payment on backend
        await dispatch(
          confirmPayment({
            consultationId: consultation.id,
            paymentIntentId: paymentIntent.paymentIntentId
          })
        ).unwrap();

        Alert.alert('Success', 'Payment successful! Your consultation is booked.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home' as never)
          }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!consultation) {
    return (
      <View style={styles.centered}>
        <Text>No consultation selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Consultation Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>{consultation.consultationType}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>
            {new Date(consultation.scheduledStart).toLocaleString()}
          </Text>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            ${(consultation.amountCharged / 100).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          💳 Secure payment powered by Stripe
        </Text>
        <Text style={styles.infoSubtext}>
          Your payment information is encrypted and secure
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.payButton, (loading || processing || !paymentIntent) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={loading || processing || !paymentIntent}
      >
        {loading || processing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.payButtonText}>
            Pay ${((consultation.amountCharged || 0) / 100).toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function PaymentScreen() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <PaymentScreenContent />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333'
  },
  summaryCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666'
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600'
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759'
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    margin: 20,
    padding: 16,
    borderRadius: 12
  },
  infoText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 4
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666'
  },
  payButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  payButtonDisabled: {
    backgroundColor: '#999'
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700'
  }
});
```

---

## 7️⃣ Update App.tsx

### `App.tsx` (Add Stripe Provider)

```typescript
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { NavigationContainer } from '@react-navigation/native';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RVJBGIYzxeKN90NS2yhS9dWGheZYi70uoQ8PZHOknAxSixQvUtJI7AlI1guQmjD276xq3UvPCP8MDe7TOh1rhoi00v5ORt563';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </StripeProvider>
      </PersistGate>
    </Provider>
  );
}
```

---

## 8️⃣ Update Navigation

### `src/navigation/AppNavigator.tsx` (Add New Screens)

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Existing screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// NEW: Import new screens
import ProviderSearchScreen from '../screens/ProviderSearchScreen';
import BookingScreen from '../screens/BookingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ConsultationStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProviderSearch"
        component={ProviderSearchScreen}
        options={{ title: 'Find a Provider' }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'Book Consultation' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Payment' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Consultations"
        component={ConsultationStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{ title: 'Payment History' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

---

## 🧪 Testing the Implementation

### 1. Test Provider Search
```typescript
// In ProviderSearchScreen
// Should load providers on mount
// Should filter by specialty
// Should navigate to booking when provider selected
```

### 2. Test Booking Flow
```typescript
// In BookingScreen
// Should show selected provider details
// Should validate reason for visit
// Should create consultation and navigate to payment
```

### 3. Test Payment Flow
```typescript
// In PaymentScreen
// Should create payment intent on mount
// Should display Stripe payment sheet
// Should confirm payment on backend after success
```

### 4. Test with Stripe Test Card
```
Card Number: 4242 4242 4242 4242
Expiry: 12/26
CVC: 123
```

---

## 📝 Environment Configuration

### `frontend/.env`

```env
# Backend API
API_BASE_URL=http://localhost:3000/api

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_51RVJBGIYzxeKN90NS2yhS9dWGheZYi70uoQ8PZHOknAxSixQvUtJI7AlI1guQmjD276xq3UvPCP8MDe7TOh1rhoi00v5ORt563
```

---

## 🚀 Running the App

```bash
# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
cd frontend && npm start

# Press 'w' for web, 'i' for iOS, 'a' for Android
```

---

## ✅ Implementation Checklist

- [x] Install @stripe/stripe-react-native
- [ ] Copy payment types
- [ ] Copy consultation types
- [ ] Copy payment API service
- [ ] Copy consultation API service
- [ ] Copy payment Redux slice
- [ ] Copy consultation Redux slice
- [ ] Update Redux store
- [ ] Copy ProviderSearchScreen
- [ ] Copy BookingScreen
- [ ] Copy PaymentScreen
- [ ] Update App.tsx with StripeProvider
- [ ] Update navigation with new screens
- [ ] Test provider search
- [ ] Test booking flow
- [ ] Test payment with Stripe test card

---

## 🐛 Troubleshooting

### Payment Sheet Not Showing
- Verify `STRIPE_PUBLISHABLE_KEY` is correct
- Check `paymentIntent.clientSecret` is not null
- Ensure Stripe SDK is wrapped with `<StripeProvider>`

### Provider Search Returns Empty
- Verify backend is running on port 3000
- Check provider verification status in database:
  ```sql
  UPDATE providers SET verification_status = 'VERIFIED', status = 'ACTIVE';
  ```

### API Calls Failing
- Check `API_BASE_URL` in services/api.ts
- Verify JWT token is being sent in headers
- Check CORS settings in backend

---

**Implementation complete! Follow the checklist to integrate all features into your frontend.** 🚀

For questions or issues, refer to:
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- [PAYMENT_INTEGRATION_IMPLEMENTATION_SUMMARY.md](PAYMENT_INTEGRATION_IMPLEMENTATION_SUMMARY.md)
