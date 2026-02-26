import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axios from 'axios';

// Only import native health modules on native platforms
let AppleHealthKit: any = null;
let GoogleFit: any = null;
let HealthKitPermissions: any = {};
let HealthValue: any = {};
let Scopes: any = {};

// Only load native modules if not on web
if (Platform.OS !== 'web') {
  try {
    if (Platform.OS === 'ios') {
      const healthModule = require('react-native-health');
      AppleHealthKit = healthModule.default || healthModule;
      HealthValue = healthModule.HealthValue;
      HealthKitPermissions = healthModule.HealthKitPermissions;
    }

    if (Platform.OS === 'android') {
      const googleFitModule = require('react-native-google-fit');
      GoogleFit = googleFitModule.default || googleFitModule;
      Scopes = googleFitModule.Scopes;
    }
  } catch (error) {
    console.warn('Health modules not available:', error);
  }
}

// Health Data Types
export interface HealthMetrics {
  heartRate?: number;
  heartRateVariability?: number;
  steps?: number;
  activeEnergyBurned?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodGlucose?: number;
  bodyTemperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  sleepAnalysis?: {
    asleep: number;
    awake: number;
    inBed: number;
  };
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface HealthDataContextType {
  healthData: HealthMetrics;
  loading: boolean;
  error: string | null;
  isAuthorized: boolean;
  requestAuthorization: () => Promise<void>;
  syncHealthData: () => Promise<void>;
  getMetric: (metricType: keyof HealthMetrics) => any;
  updateMetric: (metricType: keyof HealthMetrics, value: any) => Promise<void>;
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

const STORAGE_KEY = '@MediMindPlus:health_data';
const AUTH_KEY = '@MediMindPlus:health_auth';

// HealthKit permissions for iOS - only define if AppleHealthKit is available
const getHealthKitPermissions = (): any => {
  if (!AppleHealthKit || !AppleHealthKit.Constants) {
    return { permissions: { read: [], write: [] } };
  }

  return {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.HeartRateVariability,
        AppleHealthKit.Constants.Permissions.Steps,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
        AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
        AppleHealthKit.Constants.Permissions.BloodGlucose,
        AppleHealthKit.Constants.Permissions.BodyTemperature,
        AppleHealthKit.Constants.Permissions.OxygenSaturation,
        AppleHealthKit.Constants.Permissions.RespiratoryRate,
        AppleHealthKit.Constants.Permissions.SleepAnalysis,
        AppleHealthKit.Constants.Permissions.Weight,
        AppleHealthKit.Constants.Permissions.Height,
        AppleHealthKit.Constants.Permissions.BodyMassIndex,
      ],
      write: [],
    },
  };
};

// Google Fit scopes for Android - only define if Scopes is available
const getGoogleFitScopes = (): any[] => {
  if (!Scopes || !Scopes.FITNESS_ACTIVITY_READ) {
    return [];
  }

  return [
    Scopes.FITNESS_ACTIVITY_READ,
    Scopes.FITNESS_BODY_READ,
    Scopes.FITNESS_BLOOD_PRESSURE_READ,
    Scopes.FITNESS_BLOOD_GLUCOSE_READ,
    Scopes.FITNESS_HEART_RATE_READ,
    Scopes.FITNESS_BODY_TEMPERATURE_READ,
    Scopes.FITNESS_OXYGEN_SATURATION_READ,
    Scopes.FITNESS_SLEEP_READ,
  ];
};

export const HealthDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [healthData, setHealthData] = useState<HealthMetrics>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // Load cached health data on mount - DEFERRED to prevent blocking navigation
  useEffect(() => {
    console.log('[HealthDataProvider] Mounted - deferring initialization');
    const timeoutId = setTimeout(() => {
      console.log('[HealthDataProvider] Starting deferred initialization');
      loadCachedData();
      checkAuthorization();
    }, 500); // 500ms delay to let navigation complete

    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-sync every 5 minutes if authorized
  useEffect(() => {
    if (isAuthorized) {
      const interval = setInterval(() => {
        syncHealthData();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  const loadCachedData = async () => {
    try {
      let cached: string | null;

      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        cached = (globalThis as any).localStorage.getItem(STORAGE_KEY);
      } else {
        // Use AsyncStorage on mobile
        cached = await AsyncStorage.getItem(STORAGE_KEY);
      }

      if (cached) {
        setHealthData(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Failed to load cached health data:', err);
    }
  };

  const checkAuthorization = async () => {
    try {
      let authStatus: string | null;

      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        authStatus = (globalThis as any).localStorage.getItem(AUTH_KEY);
      } else {
        // Use AsyncStorage on mobile
        authStatus = await AsyncStorage.getItem(AUTH_KEY);
      }

      setIsAuthorized(authStatus === 'true');
    } catch (err) {
      console.error('Failed to check authorization:', err);
    }
  };

  const requestAuthorization = async () => {
    setLoading(true);
    setError(null);

    try {
      if (Platform.OS === 'ios') {
        // Request HealthKit authorization
        AppleHealthKit.initHealthKit(getHealthKitPermissions(), (err) => {
          if (err) {
            setError('Failed to authorize HealthKit: ' + err);
            setLoading(false);
            return;
          }
          setIsAuthorized(true);
          // Use localStorage on web
          if (typeof (globalThis as any).window !== 'undefined') {
            (globalThis as any).localStorage.setItem(AUTH_KEY, 'true');
          } else {
            AsyncStorage.setItem(AUTH_KEY, 'true');
          }
          syncHealthData();
        });
      } else if (Platform.OS === 'android') {
        // Request Google Fit authorization
        const options = {
          scopes: getGoogleFitScopes(),
        };
        GoogleFit.authorize(options)
          .then((authResult) => {
            if (authResult.success) {
              setIsAuthorized(true);
              // Use localStorage on web
              if (typeof (globalThis as any).window !== 'undefined') {
                (globalThis as any).localStorage.setItem(AUTH_KEY, 'true');
              } else {
                AsyncStorage.setItem(AUTH_KEY, 'true');
              }
              syncHealthData();
            } else {
              setError('Failed to authorize Google Fit');
            }
            setLoading(false);
          })
          .catch((err) => {
            setError('Google Fit authorization error: ' + err);
            setLoading(false);
          });
      }
    } catch (err) {
      setError('Authorization failed: ' + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const syncHealthData = async () => {
    if (!isAuthorized) {
      setError('Not authorized. Please request authorization first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newHealthData: HealthMetrics = {};
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      if (Platform.OS === 'ios') {
        // Fetch HealthKit data
        await fetchAppleHealthData(newHealthData, startDate, now);
      } else if (Platform.OS === 'android') {
        // Fetch Google Fit data
        await fetchGoogleFitData(newHealthData, startDate, now);
      }

      // Update state and cache
      setHealthData(newHealthData);

      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        (globalThis as any).localStorage.setItem(STORAGE_KEY, JSON.stringify(newHealthData));
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHealthData));
      }

      // Sync to backend
      await syncToBackend(newHealthData);

      setLoading(false);
    } catch (err) {
      setError('Failed to sync health data: ' + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const fetchAppleHealthData = async (data: HealthMetrics, startDate: Date, endDate: Date) => {
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    // Heart Rate
    await new Promise<void>((resolve) => {
      AppleHealthKit.getHeartRateSamples(options, (err: string, results: HealthValue[]) => {
        if (!err && results.length > 0) {
          data.heartRate = results[results.length - 1].value;
        }
        resolve();
      });
    });

    // Heart Rate Variability
    await new Promise<void>((resolve) => {
      AppleHealthKit.getHeartRateVariabilitySamples(options, (err: string, results: HealthValue[]) => {
        if (!err && results.length > 0) {
          data.heartRateVariability = results[results.length - 1].value;
        }
        resolve();
      });
    });

    // Steps
    await new Promise<void>((resolve) => {
      AppleHealthKit.getStepCount(options, (err: string, results: HealthValue) => {
        if (!err) {
          data.steps = results.value;
        }
        resolve();
      });
    });

    // Active Energy Burned
    await new Promise<void>((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(options, (err: string, results: HealthValue[]) => {
        if (!err && results.length > 0) {
          const total = results.reduce((sum, item) => sum + item.value, 0);
          data.activeEnergyBurned = total;
        }
        resolve();
      });
    });

    // Blood Pressure
    await new Promise<void>((resolve) => {
      AppleHealthKit.getBloodPressureSamples(options, (err: string, results: any[]) => {
        if (!err && results.length > 0) {
          const latest = results[results.length - 1];
          data.bloodPressure = {
            systolic: latest.bloodPressureSystolicValue,
            diastolic: latest.bloodPressureDiastolicValue,
          };
        }
        resolve();
      });
    });

    // Blood Glucose
    await new Promise<void>((resolve) => {
      AppleHealthKit.getBloodGlucoseSamples(options, (err: string, results: HealthValue[]) => {
        if (!err && results.length > 0) {
          data.bloodGlucose = results[results.length - 1].value;
        }
        resolve();
      });
    });

    // Body Temperature
    await new Promise<void>((resolve) => {
      AppleHealthKit.getBodyTemperatureSamples(options, (err: string, results: HealthValue[]) => {
        if (!err && results.length > 0) {
          data.bodyTemperature = results[results.length - 1].value;
        }
        resolve();
      });
    });

    // Oxygen Saturation
    await new Promise<void>((resolve) => {
      AppleHealthKit.getOxygenSaturationSamples(options, (err: string, results: HealthValue[]) => {
        if (!err && results.length > 0) {
          data.oxygenSaturation = results[results.length - 1].value;
        }
        resolve();
      });
    });

    // Respiratory Rate
    await new Promise<void>((resolve) => {
      AppleHealthKit.getRespiratoryRateSamples(options, (err: string, results: HealthValue[]) => {
        if (!err && results.length > 0) {
          data.respiratoryRate = results[results.length - 1].value;
        }
        resolve();
      });
    });

    // Sleep Analysis
    await new Promise<void>((resolve) => {
      AppleHealthKit.getSleepSamples(options, (err: string, results: any[]) => {
        if (!err && results.length > 0) {
          const asleep = results.filter(s => s.value === 'ASLEEP').reduce((sum, s) => sum + (s.endDate - s.startDate), 0) / (1000 * 60 * 60);
          const awake = results.filter(s => s.value === 'AWAKE').reduce((sum, s) => sum + (s.endDate - s.startDate), 0) / (1000 * 60 * 60);
          const inBed = results.filter(s => s.value === 'INBED').reduce((sum, s) => sum + (s.endDate - s.startDate), 0) / (1000 * 60 * 60);

          data.sleepAnalysis = { asleep, awake, inBed };
        }
        resolve();
      });
    });

    // Weight
    await new Promise<void>((resolve) => {
      AppleHealthKit.getLatestWeight(null, (err: string, results: HealthValue) => {
        if (!err) {
          data.weight = results.value;
        }
        resolve();
      });
    });

    // Height
    await new Promise<void>((resolve) => {
      AppleHealthKit.getLatestHeight(null, (err: string, results: HealthValue) => {
        if (!err) {
          data.height = results.value;
        }
        resolve();
      });
    });

    // BMI
    await new Promise<void>((resolve) => {
      AppleHealthKit.getLatestBmi(null, (err: string, results: HealthValue) => {
        if (!err) {
          data.bmi = results.value;
        }
        resolve();
      });
    });
  };

  const fetchGoogleFitData = async (data: HealthMetrics, startDate: Date, endDate: Date) => {
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    // Steps
    const stepsData = await GoogleFit.getDailyStepCountSamples(options);
    if (stepsData.length > 0) {
      data.steps = stepsData[0].steps.reduce((sum: number, item: any) => sum + item.value, 0);
    }

    // Heart Rate
    const heartRateData = await GoogleFit.getHeartRateSamples(options);
    if (heartRateData.length > 0) {
      data.heartRate = heartRateData[heartRateData.length - 1].value;
    }

    // Calories
    const caloriesData = await GoogleFit.getDailyCalorieSamples(options);
    if (caloriesData.length > 0) {
      data.activeEnergyBurned = caloriesData[0].calorie;
    }

    // Weight
    const weightData = await GoogleFit.getWeightSamples(options);
    if (weightData.length > 0) {
      data.weight = weightData[weightData.length - 1].value;
    }

    // Height
    const heightData = await GoogleFit.getHeightSamples(options);
    if (heightData.length > 0) {
      data.height = heightData[heightData.length - 1].value;
    }

    // Sleep
    const sleepData = await GoogleFit.getSleepSamples(options);
    if (sleepData.length > 0) {
      const totalSleep = sleepData.reduce((sum: number, item: any) => {
        return sum + (new Date(item.endDate).getTime() - new Date(item.startDate).getTime());
      }, 0) / (1000 * 60 * 60);

      data.sleepAnalysis = {
        asleep: totalSleep,
        awake: 0,
        inBed: totalSleep,
      };
    }
  };

  const syncToBackend = async (data: HealthMetrics) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/health-metrics`, {
        metrics: data,
        timestamp: new Date().toISOString(),
        source: Platform.OS === 'ios' ? 'apple_health' : 'google_fit',
      });
    } catch (err) {
      console.error('Failed to sync to backend:', err);
      // Don't throw - allow offline usage
    }
  };

  const getMetric = (metricType: keyof HealthMetrics) => {
    return healthData[metricType];
  };

  const updateMetric = async (metricType: keyof HealthMetrics, value: any) => {
    const updatedData = {
      ...healthData,
      [metricType]: value,
    };

    setHealthData(updatedData);

    // Use localStorage on web to avoid blocking
    if (typeof (globalThis as any).window !== 'undefined') {
      (globalThis as any).localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    }

    await syncToBackend(updatedData);
  };

  const contextValue: HealthDataContextType = {
    healthData,
    loading,
    error,
    isAuthorized,
    requestAuthorization,
    syncHealthData,
    getMetric,
    updateMetric,
  };

  return (
    <HealthDataContext.Provider value={contextValue}>
      {children}
    </HealthDataContext.Provider>
  );
};

// Custom hook to use health data context
export const useHealthData = (): HealthDataContextType => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within HealthDataProvider');
  }
  return context;
};
