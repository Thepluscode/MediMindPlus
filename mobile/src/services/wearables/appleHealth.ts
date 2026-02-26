/**
 * Apple Health Integration Service
 * Syncs health data from HealthKit to MediMindPlus backend
 */

import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Health data types we want to read from HealthKit
const HEALTH_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Height,
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
      AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
      AppleHealthKit.Constants.Permissions.BloodGlucose,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
      AppleHealthKit.Constants.Permissions.BodyTemperature,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
      AppleHealthKit.Constants.Permissions.BodyMassIndex,
    ],
    write: [], // We don't write data to HealthKit
  },
};

export interface VitalSigns {
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodGlucose?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  bodyTemperature?: number;
  timestamp: Date;
}

export interface ActivityData {
  steps: number;
  distance: number; // in meters
  activeEnergyBurned: number; // in calories
  timestamp: Date;
}

export interface BodyMetrics {
  weight?: number; // in kg
  height?: number; // in cm
  bmi?: number;
  timestamp: Date;
}

export interface SleepData {
  duration: number; // in hours
  quality: 'AWAKE' | 'ASLEEP' | 'INBED';
  startDate: Date;
  endDate: Date;
}

export class AppleHealthService {
  private isAvailable = false;
  private isInitialized = false;

  constructor() {
    // Apple Health is only available on iOS
    this.isAvailable = Platform.OS === 'ios';
  }

  /**
   * Initialize HealthKit and request permissions
   */
  async initialize(): Promise<boolean> {
    if (!this.isAvailable) {
      console.log('Apple Health not available on this platform');
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS, (error: string) => {
        if (error) {
          console.error('Error initializing HealthKit:', error);
          this.isInitialized = false;
          resolve(false);
        } else {
          console.log('HealthKit initialized successfully');
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  /**
   * Check if HealthKit is available and initialized
   */
  isReady(): boolean {
    return this.isAvailable && this.isInitialized;
  }

  /**
   * Get step count for a date range
   */
  async getStepCount(startDate: Date, endDate: Date): Promise<number> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getStepCount(
        options,
        (err: Object, results: HealthValue) => {
          if (err) {
            reject(err);
          } else {
            resolve(results.value || 0);
          }
        }
      );
    });
  }

  /**
   * Get heart rate samples
   */
  async getHeartRateSamples(startDate: Date, endDate: Date): Promise<number[]> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      };

      AppleHealthKit.getHeartRateSamples(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err) {
            reject(err);
          } else {
            const heartRates = results.map((sample) => sample.value);
            resolve(heartRates);
          }
        }
      );
    });
  }

  /**
   * Get average heart rate for a date range
   */
  async getAverageHeartRate(startDate: Date, endDate: Date): Promise<number> {
    const samples = await this.getHeartRateSamples(startDate, endDate);
    if (samples.length === 0) return 0;

    const sum = samples.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / samples.length);
  }

  /**
   * Get blood pressure readings
   */
  async getBloodPressure(
    startDate: Date,
    endDate: Date
  ): Promise<{ systolic: number; diastolic: number } | null> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1, // Get most recent
      };

      AppleHealthKit.getBloodPressureSamples(
        options,
        (err: Object, results: any[]) => {
          if (err) {
            reject(err);
          } else if (results.length > 0) {
            const latest = results[0];
            resolve({
              systolic: latest.bloodPressureSystolicValue,
              diastolic: latest.bloodPressureDiastolicValue,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Get blood glucose readings
   */
  async getBloodGlucose(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1,
      };

      AppleHealthKit.getBloodGlucoseSamples(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err) {
            reject(err);
          } else if (results.length > 0) {
            resolve(results[0].value);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Get current weight
   */
  async getWeight(): Promise<number | null> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      AppleHealthKit.getLatestWeight(
        {},
        (err: Object, results: HealthValue) => {
          if (err) {
            reject(err);
          } else {
            resolve(results?.value || null);
          }
        }
      );
    });
  }

  /**
   * Get current height
   */
  async getHeight(): Promise<number | null> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      AppleHealthKit.getLatestHeight(
        {},
        (err: Object, results: HealthValue) => {
          if (err) {
            reject(err);
          } else {
            resolve(results?.value || null);
          }
        }
      );
    });
  }

  /**
   * Get BMI
   */
  async getBMI(): Promise<number | null> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      AppleHealthKit.getLatestBmi(
        {},
        (err: Object, results: HealthValue) => {
          if (err) {
            reject(err);
          } else {
            resolve(results?.value || null);
          }
        }
      );
    });
  }

  /**
   * Get sleep analysis
   */
  async getSleepAnalysis(startDate: Date, endDate: Date): Promise<SleepData[]> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getSleepSamples(
        options,
        (err: Object, results: any[]) => {
          if (err) {
            reject(err);
          } else {
            const sleepData: SleepData[] = results.map((sample) => ({
              duration:
                (new Date(sample.endDate).getTime() -
                  new Date(sample.startDate).getTime()) /
                (1000 * 60 * 60), // Convert to hours
              quality: sample.value as 'AWAKE' | 'ASLEEP' | 'INBED',
              startDate: new Date(sample.startDate),
              endDate: new Date(sample.endDate),
            }));
            resolve(sleepData);
          }
        }
      );
    });
  }

  /**
   * Get distance walked/run
   */
  async getDistance(startDate: Date, endDate: Date): Promise<number> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getDistanceWalkingRunning(
        options,
        (err: Object, results: HealthValue) => {
          if (err) {
            reject(err);
          } else {
            resolve(results.value || 0);
          }
        }
      );
    });
  }

  /**
   * Get active energy burned
   */
  async getActiveEnergyBurned(startDate: Date, endDate: Date): Promise<number> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getActiveEnergyBurned(
        options,
        (err: Object, results: HealthValue) => {
          if (err) {
            reject(err);
          } else {
            resolve(results.value || 0);
          }
        }
      );
    });
  }

  /**
   * Collect all vital signs for the last 24 hours
   */
  async collectVitalSigns(): Promise<VitalSigns> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [heartRate, bloodPressure, bloodGlucose] = await Promise.all([
      this.getAverageHeartRate(yesterday, now),
      this.getBloodPressure(yesterday, now),
      this.getBloodGlucose(yesterday, now),
    ]);

    return {
      heartRate: heartRate || undefined,
      bloodPressure: bloodPressure || undefined,
      bloodGlucose: bloodGlucose || undefined,
      timestamp: new Date(),
    };
  }

  /**
   * Collect activity data for the last 24 hours
   */
  async collectActivityData(): Promise<ActivityData> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [steps, distance, activeEnergyBurned] = await Promise.all([
      this.getStepCount(yesterday, now),
      this.getDistance(yesterday, now),
      this.getActiveEnergyBurned(yesterday, now),
    ]);

    return {
      steps,
      distance,
      activeEnergyBurned,
      timestamp: new Date(),
    };
  }

  /**
   * Collect body metrics
   */
  async collectBodyMetrics(): Promise<BodyMetrics> {
    const [weight, height, bmi] = await Promise.all([
      this.getWeight(),
      this.getHeight(),
      this.getBMI(),
    ]);

    return {
      weight: weight || undefined,
      height: height || undefined,
      bmi: bmi || undefined,
      timestamp: new Date(),
    };
  }

  /**
   * Sync all health data to backend
   */
  async syncToBackend(userId: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Apple Health not initialized');
    }

    try {
      // Collect all data in parallel
      const [vitals, activity, bodyMetrics, sleepData] = await Promise.all([
        this.collectVitalSigns(),
        this.collectActivityData(),
        this.collectBodyMetrics(),
        this.getSleepAnalysis(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date()
        ),
      ]);

      // Calculate total sleep hours
      const totalSleepHours = sleepData
        .filter((sleep) => sleep.quality === 'ASLEEP')
        .reduce((sum, sleep) => sum + sleep.duration, 0);

      // Prepare payload
      const payload = {
        source: 'APPLE_HEALTH',
        vitals,
        activity,
        bodyMetrics,
        sleepHours: totalSleepHours,
        syncedAt: new Date().toISOString(),
      };

      // Send to backend
      const token = await AsyncStorage.getItem('accessToken');
      await axios.post(`${API_URL}/wearable/${userId}/sync`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Save last sync time
      await AsyncStorage.setItem(
        'lastAppleHealthSync',
        new Date().toISOString()
      );

      console.log('Apple Health data synced successfully');
    } catch (error) {
      console.error('Error syncing Apple Health data:', error);
      throw error;
    }
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<Date | null> {
    const lastSync = await AsyncStorage.getItem('lastAppleHealthSync');
    return lastSync ? new Date(lastSync) : null;
  }

  /**
   * Setup automatic background sync (every 6 hours)
   */
  async setupAutoSync(userId: string): Promise<void> {
    // In production, this would use BackgroundFetch or similar
    // For now, we'll just provide the structure
    console.log('Auto-sync setup for user:', userId);

    // Store user ID for background tasks
    await AsyncStorage.setItem('autoSyncUserId', userId);

    // TODO: Implement BackgroundFetch task
    // BackgroundFetch.registerTaskAsync('health-data-sync', {
    //   minimumInterval: 6 * 60 * 60, // 6 hours
    //   stopOnTerminate: false,
    //   startOnBoot: true,
    // });
  }
}

export default new AppleHealthService();
