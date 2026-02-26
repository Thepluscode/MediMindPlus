import apiService from './apiService';
import { 
  VitalSigns, 
  HealthMetrics, 
  HealthDataPoint, 
  BloodPressureReading, 
  SleepData, 
  ActivityData, 
  VoiceData 
} from '../types/models/health';

type MeasurementSource = 'manual' | 'device' | 'app';

interface HealthMetricsOptions {
  startDate: string;
  endDate: string;
  interval?: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
}

interface VoiceAnalysisResponse {
  id: string;
  userId: string;
  recordingId: string;
  analysisDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: {
    emotion: {
      primary: string;
      confidence: number;
      allEmotions: Array<{
        emotion: string;
        score: number;
      }>;
    };
    speechPatterns: {
      speakingRate: number;
      pauseFrequency: number;
      pitch: {
        mean: number;
        stdDev: number;
      };
      intensity: {
        mean: number;
        max: number;
        min: number;
      };
    };
    healthIndicators: {
      stressLevel: number;
      fatigueLevel: number;
      respiratoryHealth: {
        score: number;
        indicators: string[];
      };
    };
    transcript: string;
    keywords: Array<{
      text: string;
      relevance: number;
      category?: string;
    }>;
  };
  confidenceScores: {
    overall: number;
    emotion: number;
    speechPatterns: number;
    healthIndicators: number;
  };
  metadata: {
    recordingDuration: number;
    language: string;
    modelVersion: string;
  };
  createdAt: string;
  updatedAt: string;
}

class HealthDataService {
  // Vital Signs
  async getVitalSigns(options: { startDate: string; endDate: string; limit?: number }): Promise<VitalSigns[]> {
    try {
      // Return mock data for demo mode
      const mockVitalSigns: VitalSigns[] = [
        {
          id: '1',
          userId: 'demo-user-123',
          heartRate: 72,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          temperature: 98.6,
          oxygenSaturation: 98,
          respiratoryRate: 16,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          userId: 'demo-user-123',
          heartRate: 75,
          bloodPressureSystolic: 118,
          bloodPressureDiastolic: 78,
          temperature: 98.4,
          oxygenSaturation: 99,
          respiratoryRate: 15,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          userId: 'demo-user-123',
          heartRate: 68,
          bloodPressureSystolic: 115,
          bloodPressureDiastolic: 75,
          temperature: 98.2,
          oxygenSaturation: 97,
          respiratoryRate: 14,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }
      ];
      return mockVitalSigns;
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      throw error;
    }
  }

  async addVitalSigns(data: Omit<VitalSigns, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<VitalSigns> {
    try {
      const response = await apiService.post<VitalSigns>('/api/vital-signs', data);
      return response.data;
    } catch (error) {
      console.error('Error adding vital signs:', error);
      throw error;
    }
  }

  // Health Metrics
  async getHealthMetrics(options: HealthMetricsOptions): Promise<HealthMetrics[]> {
    try {
      // Return mock health metrics for demo mode
      const mockHealthMetrics: HealthMetrics[] = [
        {
          id: '1',
          userId: 'demo-user-123',
          type: 'steps',
          value: 8500,
          unit: 'steps',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          userId: 'demo-user-123',
          type: 'calories',
          value: 2200,
          unit: 'kcal',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          userId: 'demo-user-123',
          type: 'sleep',
          value: 7.5,
          unit: 'hours',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      return mockHealthMetrics;
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      throw error;
    }
  }

  // Voice Analysis
  async uploadVoiceRecording(recordingUri: string): Promise<VoiceAnalysisResponse> {
    try {
      const formData = new FormData();
      // @ts-ignore - FormData type definition doesn't include the full API
      formData.append('audio', {
        uri: recordingUri,
        type: 'audio/m4a',
        name: 'voice_recording.m4a',
      });

      const response = await apiService.post<VoiceAnalysisResponse>('/api/ml/analyze-voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading voice recording:', error);
      throw error;
    }
  }

  // Analyze health data with ML
  async analyzeHealthData(data: {
    userId: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    bmi: number;
    // Add other health parameters as needed
  }): Promise<any> {
    try {
      const response = await apiService.post('/api/ml/analyze', data);
      return response.data;
    } catch (error) {
      console.error('Error analyzing health data:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const healthDataService = new HealthDataService();

export type { HealthMetricsOptions, VoiceAnalysisResponse, MeasurementSource };
