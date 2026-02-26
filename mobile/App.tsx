import React, { useEffect } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'react-native-elements';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { store, persistor } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';
import { initializeApp } from './src/services/appInitialization';
import ErrorBoundary from './src/components/ErrorBoundary';


// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background task for health monitoring
const HEALTH_MONITORING_TASK = 'health-monitoring';

type TaskData = {
  success: boolean;
  error?: string;
};

TaskManager.defineTask<TaskData>(HEALTH_MONITORING_TASK, async () => {
  try {
    // Collect sensor data in background
    const { collectBackgroundData } = require('./src/services/sensorService');
    await collectBackgroundData();
    return { success: true };
  } catch (error) {
    console.error('Background health monitoring failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
});

const App: React.FC = () => {
  useEffect(() => {
    // Defer initialization to prevent blocking navigation
    // Use setTimeout to move initialization off the critical path
    const timeoutId = setTimeout(() => {
      console.log('[App] Starting deferred initialization...');
      initializeApp().catch(error => {
        console.error('[App] Initialization failed:', error);
      });
    }, 100); // 100ms delay to let navigation complete first

    return () => clearTimeout(timeoutId);
  }, []);

  // Loading component for PersistGate
  const LoadingView = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#667eea" />
    </View>
  );

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingView />} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider {...({ theme: { colors: theme.colors } } as any)}>
              <NavigationContainer>
                <StatusBar barStyle="default" />
                {/* MOVED HealthDataProvider INSIDE AppNavigator to prevent blocking navigation */}
                <AppNavigator />
              </NavigationContainer>
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
