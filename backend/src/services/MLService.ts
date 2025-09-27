import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import config from '../config/config';
import logger from '../utils/logger';

export interface PatientMLInput {
  user_id: string;
  age: number;
  gender: string;
  bmi: number;
  heart_rate: number[];
  blood_pressure: Array<{ systolic: number; diastolic: number }>;
  sleep_data: Record<string, number>;
  activity_data: Record<string, number>;
  voice_features: Record<string, number>;
  genetic_markers: Record<string, number>;
  lab_results: Record<string, number>;
}

export interface RiskPredictionOutput {
  user_id: string;
  disease_risks: Record<string, number>;
  overall_risk_score: number;
  confidence_level: number;
  risk_factors: string[];
  recommendations: string[];
  prediction_timestamp: string;
  model_version: string;
}

export class MLService {
  private static instance: MLService;
  private client: AxiosInstance;
  private logger: typeof logger;

  constructor(client?: AxiosInstance) {
    // Handle singleton pattern
    if (MLService.instance && !client) {
      return MLService.instance;
    }

    // Initialize client with provided instance or create new one
    this.client = client || axios.create({
      baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8001',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Initialize logger
    this.logger = logger.child({ service: 'MLService' });
    
    // Set up request/response interceptors
    this.setupInterceptors();
    
    // Update singleton instance if needed
    if (!MLService.instance || client) {
      MLService.instance = this;
    }
  }

  /**
   * Set up Axios interceptors for request/response handling
   */
  private setupInterceptors(): void {
    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        this.logger.info(`ML Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: AxiosError) => {
        this.logger.error('ML Service Request Error:', {
          message: error.message,
          url: error.config?.url,
          method: error.config?.method,
        });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.logger.error('ML Service Response Error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  public async getHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('Error checking ML service health:', error);
      return false;
    }
  }

  public async analyzePatient(patientData: PatientMLInput): Promise<RiskPredictionOutput> {
    try {
      const response = await this.client.post<RiskPredictionOutput>('/predict', patientData);
      return response.data;
    } catch (error) {
      logger.error('Error analyzing patient with ML service:', error);
      throw new Error('Failed to analyze patient data with ML service');
    }
  }

  public async analyzeVoice(audioData: any): Promise<any> {
    try {
      const response = await this.client.post('/analyze-voice', audioData);
      return response.data;
    } catch (error) {
      logger.error('Error analyzing voice with ML service:', error);
      throw new Error('Failed to analyze voice data');
    }
  }
}

export default MLService.getInstance();
