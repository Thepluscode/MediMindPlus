import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import healthDataReducer from './slices/healthDataSlice';
import aiPredictionsReducer from './slices/aiPredictionsSlice';
import analyticsReducer from './slices/analyticsSlice';
import settingsReducer from './slices/settingsSlice';
import paymentReducer from './slices/paymentSlice';
import consultationReducer from './slices/consultationSlice';
import consentReducer from './slices/consentSlice';
import anomalyReducer from './slices/anomalySlice';

// ============================================================================
// REDUX PERSIST CONFIGURATION
// ============================================================================
// Only persist critical user data that should survive app restarts
// Exclude large/frequently-changing data to avoid performance issues
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Whitelist: ONLY persist these slices
  whitelist: ['auth', 'user', 'settings'],
  // All other slices (healthData, analytics, etc.) will NOT be persisted
  // This prevents infinite loops from large datasets
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  healthData: healthDataReducer,
  aiPredictions: aiPredictionsReducer,
  analytics: analyticsReducer,
  settings: settingsReducer,
  payment: paymentReducer,
  consultation: consultationReducer,
  consent: consentReducer,
  anomaly: anomalyReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Create and export the persistor
export const persistor = persistStore(store);
