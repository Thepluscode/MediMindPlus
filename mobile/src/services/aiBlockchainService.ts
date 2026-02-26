import { apiService } from './apiService';

// Types
export interface ExplainableAIPrediction {
  predictionId: string;
  userId: string;
  modelName: string;
  prediction: any;
  confidence: number;
  explanation: {
    features: Array<{
      name: string;
      value: any;
      importance: number;
      contribution: number;
    }>;
    reasoning: string;
    visualizations?: any[];
  };
  blockchainHash: string;
  timestamp: string;
  verifiable: boolean;
}

export interface AIModel {
  id: string;
  model_name: string;
  model_type: string;
  version: string;
  description: string;
  accuracy: number;
  status: string;
  input_schema: Record<string, string>;
  output_schema: Record<string, string>;
}

export interface AnomalyDetection {
  id: string;
  device_id: string;
  patient_did: string;
  anomaly_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sensor_data: any;
  ai_confidence: number;
  blockchain_proof: string;
  detected_at: string;
  action_taken?: string;
  resolved: boolean;
}

export interface PatientConsent {
  id: string;
  user_id: string;
  consent_given: boolean;
  consent_scope: string[];
  blockchain_hash?: string;
  given_at?: string;
  revoked_at?: string;
}

export interface FederatedLearningSession {
  session_id: string;
  model_type: string;
  participants: string[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  consensus_reached: boolean;
  created_at: string;
  completed_at?: string;
}

class AIBlockchainService {
  /**
   * Make an explainable AI prediction
   */
  async makeExplainablePrediction(
    modelName: string,
    inputData: any
  ): Promise<ExplainableAIPrediction> {
    try {
      const response = await apiService.post<{ success: boolean; data: ExplainableAIPrediction }>(
        '/ai-blockchain/predict',
        { modelName, inputData }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }

  /**
   * Get a specific prediction by ID
   */
  async getPrediction(predictionId: string): Promise<ExplainableAIPrediction> {
    try {
      const response = await apiService.get<{ success: boolean; data: ExplainableAIPrediction }>(
        `/ai-blockchain/predictions/${predictionId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error getting prediction:', error);
      throw error;
    }
  }

  /**
   * Get all predictions for current user
   */
  async getUserPredictions(): Promise<ExplainableAIPrediction[]> {
    try {
      const response = await apiService.get<{ success: boolean; data: ExplainableAIPrediction[] }>(
        '/ai-blockchain/predictions/user/me'
      );
      return response.data.data;
    } catch (error) {
      console.error('Error getting user predictions:', error);
      throw error;
    }
  }

  /**
   * Verify a prediction on blockchain
   */
  async verifyPrediction(predictionId: string): Promise<{ verified: boolean; blockchainData: any }> {
    try {
      const response = await apiService.post<{ success: boolean; data: any }>(
        `/ai-blockchain/verify/${predictionId}`,
        {}
      );
      return response.data.data;
    } catch (error) {
      console.error('Error verifying prediction:', error);
      throw error;
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<AIModel[]> {
    try {
      const response = await apiService.get<{ success: boolean; data: AIModel[] }>(
        '/ai-blockchain/models'
      );
      return response.data.data;
    } catch (error) {
      console.error('Error getting models:', error);
      throw error;
    }
  }

  /**
   * Detect IoMT device anomaly
   */
  async detectAnomaly(
    deviceId: string,
    patientDID: string,
    sensorData: any
  ): Promise<AnomalyDetection> {
    try {
      const response = await apiService.post<{ success: boolean; data: AnomalyDetection }>(
        '/ai-blockchain/iomt/detect-anomaly',
        { deviceId, patientDID, sensorData }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error detecting anomaly:', error);
      throw error;
    }
  }

  /**
   * Get anomalies for a patient
   */
  async getPatientAnomalies(patientDID: string): Promise<AnomalyDetection[]> {
    try {
      const response = await apiService.get<{ success: boolean; data: AnomalyDetection[] }>(
        `/ai-blockchain/iomt/anomalies/${patientDID}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error getting anomalies:', error);
      throw error;
    }
  }

  /**
   * Get current user's consent status
   */
  async getConsent(): Promise<PatientConsent> {
    try {
      const response = await apiService.get<{ success: boolean; data: PatientConsent }>(
        '/ai-blockchain/consent/me'
      );
      return response.data.data;
    } catch (error) {
      console.error('Error getting consent:', error);
      throw error;
    }
  }

  /**
   * Update user's AI consent
   */
  async updateConsent(
    consentGiven: boolean,
    consentScope: string[]
  ): Promise<PatientConsent> {
    try {
      const response = await apiService.post<{ success: boolean; data: PatientConsent }>(
        '/ai-blockchain/consent',
        { consentGiven, consentScope }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating consent:', error);
      throw error;
    }
  }

  /**
   * Start federated learning session
   */
  async startFederatedLearning(
    modelType: string,
    participants: string[]
  ): Promise<FederatedLearningSession> {
    try {
      const response = await apiService.post<{ success: boolean; data: FederatedLearningSession }>(
        '/ai-blockchain/federated-learning',
        { modelType, participants }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error starting federated learning:', error);
      throw error;
    }
  }

  /**
   * Get federated learning session status
   */
  async getFederatedLearningSession(sessionId: string): Promise<FederatedLearningSession> {
    try {
      const response = await apiService.get<{ success: boolean; data: FederatedLearningSession }>(
        `/ai-blockchain/federated-learning/${sessionId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error getting federated learning session:', error);
      throw error;
    }
  }
}

export const aiBlockchainService = new AIBlockchainService();
