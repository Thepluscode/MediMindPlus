import { Accelerometer, Gyroscope, Magnetometer, AccelerometerMeasurement, GyroscopeMeasurement, MagnetometerMeasurement } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import { Audio } from 'expo-av';
import { Subscription } from 'expo-modules-core';
import { store } from '../store/store';
import { addHeartRateData, updateActivityData, updateVoiceData } from '../store/slices/healthDataSlice';

interface SensorDataPoint<T> {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

type SensorType = 'accelerometer' | 'gyroscope' | 'magnetometer' | 'location';

interface SensorData {
  accelerometer: SensorDataPoint<AccelerometerMeasurement>[];
  gyroscope: SensorDataPoint<GyroscopeMeasurement>[];
  magnetometer: SensorDataPoint<MagnetometerMeasurement>[];
  location: Array<Location.LocationObject & { timestamp: number }>;
}

interface SensorSubscriptions {
  accelerometer: Subscription | null;
  gyroscope: Subscription | null;
  magnetometer: Subscription | null;
  location: Subscription | null;
}

interface Recording {
  id: string;
  startTime: number;
  endTime: number | null;
  type: 'walking' | 'running' | 'standing' | 'custom';
  data: {
    [key in SensorType]?: any[];
  };
}

class SensorService {
  private isMonitoring: boolean = false;
  private sensors: SensorSubscriptions = {
    accelerometer: null,
    gyroscope: null,
    magnetometer: null,
    location: null,
  };
  private sensorData: SensorData = {
    accelerometer: [],
    gyroscope: [],
    magnetometer: [],
    location: [],
  };
  private recording: Recording | null = null;
  private static readonly SENSOR_DATA_LIMIT = 1000;
  private static readonly MAGNETOMETER_DATA_LIMIT = 100;
  private static readonly UPDATE_INTERVAL_MS = 100; // 10Hz

  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (audioStatus !== 'granted' || locationStatus !== 'granted') {
        console.warn('Required permissions not granted');
        return false;
      }

      // Set sensor update intervals
      Accelerometer.setUpdateInterval(SensorService.UPDATE_INTERVAL_MS);
      Gyroscope.setUpdateInterval(SensorService.UPDATE_INTERVAL_MS);
      Magnetometer.setUpdateInterval(1000); // 1Hz

      return true;
    } catch (error) {
      console.error('Sensor initialization failed:', error);
      return false;
    }
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    try {
      this.isMonitoring = true;

      // Start accelerometer monitoring
      this.sensors.accelerometer = Accelerometer.addListener(
        (data: AccelerometerMeasurement) => {
          const dataPoint: SensorDataPoint<AccelerometerMeasurement> = {
            ...data,
            timestamp: Date.now(),
          };
          
          this.sensorData.accelerometer.push(dataPoint);
          
          // Keep only last SENSOR_DATA_LIMIT readings
          if (this.sensorData.accelerometer.length > SensorService.SENSOR_DATA_LIMIT) {
            this.sensorData.accelerometer.shift();
          }

          // Process gait data every 100 readings
          if (this.sensorData.accelerometer.length % 100 === 0) {
            this.processGaitData();
          }
        }
      );

      // Start gyroscope monitoring
      this.sensors.gyroscope = Gyroscope.addListener(
        (data: GyroscopeMeasurement) => {
          this.sensorData.gyroscope.push({
            ...data,
            timestamp: Date.now(),
          });
          
          if (this.sensorData.gyroscope.length > SensorService.SENSOR_DATA_LIMIT) {
            this.sensorData.gyroscope.shift();
          }
        }
      );

      // Start magnetometer monitoring
      this.sensors.magnetometer = Magnetometer.addListener(
        (data: MagnetometerMeasurement) => {
          this.sensorData.magnetometer.push({
            ...data,
            timestamp: Date.now(),
          });
          
          if (this.sensorData.magnetometer.length > SensorService.MAGNETOMETER_DATA_LIMIT) {
            this.sensorData.magnetometer.shift();
          }
        }
      );

      // Start location monitoring
      this.sensors.location = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 10, // 10 meters
        },
        (location: Location.LocationObject) => {
          this.sensorData.location.push({
            ...location,
            timestamp: Date.now(),
          });
          
          if (this.sensorData.location.length > 100) {
            this.sensorData.location.shift();
          }
        }
      );

    } catch (error) {
      console.error('Failed to start sensor monitoring:', error);
      this.stopMonitoring();
      throw error;
    }
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    // Remove all listeners
    Object.values(this.sensors).forEach(sensor => {
      if (sensor && 'remove' in sensor) {
        sensor.remove();
      }
    });

    // Reset state
    this.sensors = {
      accelerometer: null,
      gyroscope: null,
      magnetometer: null,
      location: null,
    };
    
    this.isMonitoring = false;
  }

  startRecording(type: Recording['type'] = 'custom'): string {
    if (this.recording) {
      throw new Error('A recording is already in progress');
    }

    const recordingId = `rec_${Date.now()}`;
    this.recording = {
      id: recordingId,
      startTime: Date.now(),
      endTime: null,
      type,
      data: {},
    };

    return recordingId;
  }

  stopRecording(): Recording | null {
    if (!this.recording) return null;

    const recording = {
      ...this.recording,
      endTime: Date.now(),
      data: { ...this.sensorData },
    };

    this.recording = null;
    return recording;
  }

  getSensorData(): SensorData {
    return { ...this.sensorData };
  }

  clearSensorData(): void {
    this.sensorData = {
      accelerometer: [],
      gyroscope: [],
      magnetometer: [],
      location: [],
    };
  }

  private processGaitData(): void {
    const { accelerometer } = this.sensorData;
    if (accelerometer.length < 10) return;

    // Simple step detection based on accelerometer data
    const lastReading = accelerometer[accelerometer.length - 1];
    const prevReading = accelerometer[Math.max(0, accelerometer.length - 10)];
    
    const deltaX = Math.abs(lastReading.x - prevReading.x);
    const deltaY = Math.abs(lastReading.y - prevReading.y);
    const deltaZ = Math.abs(lastReading.z - prevReading.z);
    
    const totalAcceleration = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);
    
    // Threshold for step detection (adjust based on testing)
    if (totalAcceleration > 1.5) {
      // Dispatch step count update to Redux store
      store.dispatch(updateActivityData({
        steps: 1, // Increment step count
        timestamp: new Date().toISOString(),
      }));
    }
  }

  // Add any additional sensor processing methods here
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }
}

export const sensorService = new SensorService();

export type { SensorData, SensorDataPoint, Recording };
