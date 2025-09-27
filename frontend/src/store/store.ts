import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import healthDataReducer from './slices/healthDataSlice';
import aiPredictionsReducer from './slices/aiPredictionsSlice';
import analyticsReducer from './slices/analyticsSlice';
import settingsReducer from './slices/settingsSlice';
import { RootState as RootStateType } from './types';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'settings'],
  blacklist: ['healthData', 'aiPredictions', 'analytics'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  healthData: healthDataReducer,
  aiPredictions: aiPredictionsReducer,
  analytics: analyticsReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer<RootStateType>(persistConfig, rootReducer as any);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
