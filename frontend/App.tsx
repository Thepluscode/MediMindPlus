import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
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
import LoadingScreen from './src/components/LoadingScreen';
import { initializeApp } from './src/services/appInitialization';


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
    initializeApp();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <ThemeProvider {...({ theme: { colors: theme.colors } } as any)}>
            <NavigationContainer>
              <StatusBar barStyle="default" />
              <AppNavigator />
            </NavigationContainer>
          </ThemeProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
