import { mlApiService } from './apiService';
import { AIPrediction } from '../types/models/ai';

interface VoiceAnalysisRequest {
  audioUri: string;
  mimeType?: string;
  duration?: number;
  sampleRate?: number;
  metadata?: Record<string, unknown>;
}

interface VoiceAnalysisResponse {
  transcription: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  healthIndicators: {
    symptomMentions: Array<{
      symptom: string;
      context: string;
      confidence: number;
    }>;
    potentialConditions: Array<{
      condition: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  timestamp: string;
}

interface RiskFactor {
  id: string;
  name: string;
  category: 'lifestyle' | 'genetic' | 'environmental' | 'medical_history';
  description: string;
  severity: 'low' | 'medium' | 'high';
  isModifiable: boolean;
  relevanceScore: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'diet' | 'exercise' | 'lifestyle' | 'medical' | 'monitoring';
  priority: 'low' | 'medium' | 'high';
  estimatedBenefit: number;
  timeToImplement: number; // in minutes
  resources?: Array<{
    title: string;
    url: string;
    type: 'article' | 'video' | 'app' | 'professional';
  }>;
}

class PredictionService {
  /**
   * Get AI predictions based on user's health data
   */
  async getPredictions(): Promise<AIPrediction> {
    try {
      // Try to get real predictions from ML service
      const realPrediction = await this.getRealMLPredictions();
      if (realPrediction) {
        return realPrediction;
      }

      // Fallback to mock data
      const mockPrediction: AIPrediction = {
        id: 'demo-prediction-123',
        userId: 'demo-user-123',
        predictions: [
          {
            condition: 'Cardiovascular Disease',
            probability: 0.15,
            confidence: 0.85,
            riskLevel: 'low'
          },
          {
            condition: 'Diabetes Type 2',
            probability: 0.08,
            confidence: 0.78,
            riskLevel: 'low'
          },
          {
            condition: 'Hypertension',
            probability: 0.22,
            confidence: 0.82,
            riskLevel: 'medium'
          }
        ],
        riskFactors: ['age', 'lifestyle'],
        recommendations: ['Regular exercise', 'Balanced diet', 'Regular checkups'],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return mockPrediction;
    } catch (error) {
      console.error('Error getting predictions:', error);
      throw error;
    }
  }

  /**
   * Get real predictions from ML service (port 8001)
   */
  async getRealMLPredictions(): Promise<AIPrediction | null> {
    try {
      const response = await fetch('http://localhost:8001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'demo-user-123',
          age: 35,
          gender: 'male',
          symptoms: ['fatigue', 'headache'],
          vital_signs: {
            heart_rate: 72,
            blood_pressure_systolic: 120,
            blood_pressure_diastolic: 80
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Convert ML service response to AIPrediction format
        const aiPrediction: AIPrediction = {
          id: `ml-prediction-${Date.now()}`,
          userId: 'demo-user-123',
          predictions: Object.entries(data.predictions).map(([condition, score]) => ({
            condition,
            probability: score as number,
            confidence: 0.85,
            riskLevel: (score as number) > 0.5 ? 'high' : (score as number) > 0.3 ? 'medium' : 'low'
          })),
          riskFactors: data.feature_importance ? Object.keys(data.feature_importance).slice(0, 3) : [],
          recommendations: data.recommendations || ['Consult with healthcare provider'],
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return aiPrediction;
      }
      return null;
    } catch (error) {
      console.log('ML service not available, using mock data');
      return null;
    }
  }

  /**
   * Analyze voice recording for health indicators
   */
  async analyzeVoice(voiceData: VoiceAnalysisRequest): Promise<VoiceAnalysisResponse> {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: voiceData.audioUri,
        type: voiceData.mimeType || 'audio/m4a',
        name: 'voice_recording.m4a',
      } as unknown as Blob);

      if (voiceData.metadata) {
        formData.append('metadata', JSON.stringify(voiceData.metadata));
      }

      const response = await mlApiService.post<VoiceAnalysisResponse>(
        '/analyze-voice',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error analyzing voice:', error);
      throw error;
    }
  }

  /**
   * Get identified risk factors for the user
   */
  async getRiskFactors(): Promise<RiskFactor[]> {
    try {
      const response = await mlApiService.get<{ riskFactors: RiskFactor[] }>('/predict');
      return response.data.riskFactors;
    } catch (error) {
      console.error('Error getting risk factors:', error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations based on risk profile
   */
  async getRecommendations(riskProfile: Record<string, unknown>): Promise<Recommendation[]> {
    try {
      const response = await mlApiService.post<{ recommendations: Recommendation[] }>(
        '/explain',
        { riskProfile }
      );
      return response.data.recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }
}

export const predictionService = new PredictionService();

export type { 
  VoiceAnalysisRequest, 
  VoiceAnalysisResponse, 
  RiskFactor, 
  Recommendation 
};
