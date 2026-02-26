/**
 * Advanced Features API Service
 * MediMindPlus - Enterprise Health Platform
 *
 * Comprehensive API integration for stroke detection, BCI monitoring,
 * microbiome analysis, medical copilot, athletic performance, and wearables.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StrokeAnalysis,
  StrokeDetectionRequest,
  BCIMetrics,
  MicrobiomeData,
  MicrobiomeTestKit,
  MicrobiomeKitOrderRequest,
  ClinicalNote,
  CopilotSession,
  CopilotSessionRequest,
  AthleticMetrics,
  DecisionAnalysis,
  WearableDevice,
  RealtimeBiometricData,
  DataQuality,
  BiometricTimeSeries,
  BiometricDataQuery,
  MultiModalRiskAssessment,
  LiquidBiopsyResults,
} from '../types/models/advancedFeatures';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.medimind.ai/v1';
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Advanced Features API Client
 */
class AdvancedFeaturesAPI {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        let token: string | null;

        // Use localStorage on web to avoid blocking
        if (typeof (globalThis as any).window !== 'undefined') {
          token = (globalThis as any).localStorage.getItem('access_token');
        } else {
          // Use AsyncStorage on mobile
          token = await AsyncStorage.getItem('access_token');
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  private async refreshToken(): Promise<void> {
    try {
      let refreshToken: string | null;

      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        refreshToken = (globalThis as any).localStorage.getItem('refresh_token');
      } else {
        // Use AsyncStorage on mobile
        refreshToken = await AsyncStorage.getItem('refresh_token');
      }

      if (!refreshToken) throw new Error('No refresh token available');

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        (globalThis as any).localStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          (globalThis as any).localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      } else {
        // Use AsyncStorage on mobile
        await AsyncStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }
    } catch (error) {
      // Clear tokens and redirect to login
      if (typeof (globalThis as any).window !== 'undefined') {
        (globalThis as any).localStorage.removeItem('access_token');
        (globalThis as any).localStorage.removeItem('refresh_token');
      } else {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
      }
      throw error;
    }
  }

  // ============================================================================
  // STROKE DETECTION API
  // ============================================================================

  /**
   * Analyze brain imaging for stroke detection
   */
  async analyzeStrokeScan(request: StrokeDetectionRequest): Promise<StrokeAnalysis> {
    const formData = new FormData();
    formData.append('patient_id', request.patient_id);
    formData.append('scan_type', request.scan_type);
    formData.append('clinical_context', JSON.stringify(request.clinical_context));

    // Append DICOM files
    request.dicom_files.forEach((file, index) => {
      formData.append(`dicom_file_${index}`, file);
    });

    const response = await this.axiosInstance.post<{ results: StrokeAnalysis }>(
      '/clinical/stroke-detection',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // Extended timeout for image processing
      }
    );

    return response.data.results;
  }

  /**
   * Get stroke detection analysis by ID
   */
  async getStrokeAnalysis(analysisId: string): Promise<StrokeAnalysis> {
    const response = await this.axiosInstance.get<StrokeAnalysis>(
      `/clinical/stroke-detection/${analysisId}`
    );
    return response.data;
  }

  // ============================================================================
  // BCI MENTAL HEALTH API
  // ============================================================================

  /**
   * Get BCI mental health metrics for a user
   */
  async getBCIMetrics(userId: string): Promise<BCIMetrics> {
    const response = await this.axiosInstance.get<BCIMetrics>(`/bci/metrics/${userId}`);
    return response.data;
  }

  /**
   * Start BCI monitoring session
   */
  async startBCIMonitoring(userId: string): Promise<{ session_id: string; status: string }> {
    const response = await this.axiosInstance.post<{ session_id: string; status: string }>(
      '/bci/start-monitoring',
      { user_id: userId }
    );
    return response.data;
  }

  /**
   * Stop BCI monitoring session
   */
  async stopBCIMonitoring(sessionId: string): Promise<{ status: string }> {
    const response = await this.axiosInstance.post<{ status: string }>(
      `/bci/stop-monitoring/${sessionId}`
    );
    return response.data;
  }

  /**
   * Get real-time brainwave data
   */
  async getRealtimeBrainwaves(userId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/bci/realtime/${userId}`);
    return response.data;
  }

  // ============================================================================
  // MICROBIOME ANALYSIS API
  // ============================================================================

  /**
   * Order a microbiome test kit
   */
  async orderMicrobiomeKit(request: MicrobiomeKitOrderRequest): Promise<MicrobiomeTestKit> {
    const response = await this.axiosInstance.post<MicrobiomeTestKit>(
      '/microbiome/order-kit',
      request
    );
    return response.data;
  }

  /**
   * Get microbiome analysis results
   */
  async getMicrobiomeResults(userId: string): Promise<MicrobiomeData> {
    const response = await this.axiosInstance.get<MicrobiomeData>(
      `/microbiome/results/${userId}`
    );
    return response.data;
  }

  /**
   * Get microbiome test kit status
   */
  async getMicrobiomeKitStatus(kitId: string): Promise<MicrobiomeTestKit> {
    const response = await this.axiosInstance.get<MicrobiomeTestKit>(
      `/microbiome/kit-status/${kitId}`
    );
    return response.data;
  }

  /**
   * Order custom probiotics
   */
  async orderCustomProbiotics(
    userId: string,
    formulaId: string
  ): Promise<{ order_id: string; price: number }> {
    const response = await this.axiosInstance.post<{ order_id: string; price: number }>(
      '/microbiome/order-probiotics',
      { user_id: userId, formula_id: formulaId }
    );
    return response.data;
  }

  // ============================================================================
  // MEDICAL COPILOT API
  // ============================================================================

  /**
   * Start a medical copilot session
   */
  async startCopilotSession(request: CopilotSessionRequest): Promise<CopilotSession> {
    const response = await this.axiosInstance.post<CopilotSession>(
      '/clinical/copilot/sessions',
      request
    );
    return response.data;
  }

  /**
   * Submit audio chunk for transcription
   */
  async submitCopilotAudio(
    sessionId: string,
    audioChunk: Blob,
    chunkNumber: number,
    isFinal: boolean
  ): Promise<{ status: string }> {
    const formData = new FormData();
    formData.append('audio_chunk', audioChunk);
    formData.append('chunk_number', chunkNumber.toString());
    formData.append('is_final', isFinal.toString());

    const response = await this.axiosInstance.post<{ status: string }>(
      `/clinical/copilot/sessions/${sessionId}/audio`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  /**
   * Get clinical note for a session
   */
  async getClinicalNote(sessionId: string): Promise<ClinicalNote> {
    const response = await this.axiosInstance.get<ClinicalNote>(
      `/clinical/copilot/sessions/${sessionId}/note`
    );
    return response.data;
  }

  /**
   * Update clinical note
   */
  async updateClinicalNote(sessionId: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const response = await this.axiosInstance.patch<ClinicalNote>(
      `/clinical/copilot/sessions/${sessionId}/note`,
      updates
    );
    return response.data;
  }

  /**
   * Sign and submit clinical note to EHR
   */
  async signClinicalNote(sessionId: string): Promise<{ status: string; ehr_sync: boolean }> {
    const response = await this.axiosInstance.post<{ status: string; ehr_sync: boolean }>(
      `/clinical/copilot/sessions/${sessionId}/sign`
    );
    return response.data;
  }

  // ============================================================================
  // ATHLETIC PERFORMANCE API
  // ============================================================================

  /**
   * Get athletic performance metrics
   */
  async getAthleteMetrics(userId: string): Promise<AthleticMetrics> {
    const response = await this.axiosInstance.get<AthleticMetrics>(
      `/athletic/metrics/${userId}`
    );
    return response.data;
  }

  /**
   * Get decision-making analysis for game situation
   */
  async analyzeDecision(
    userId: string,
    situation: string,
    context: any
  ): Promise<DecisionAnalysis> {
    const response = await this.axiosInstance.post<DecisionAnalysis>(
      `/athletic/decision-analysis/${userId}`,
      { situation, context }
    );
    return response.data;
  }

  /**
   * Get injury risk prediction
   */
  async getInjuryRiskPrediction(userId: string, timeframe: string): Promise<any> {
    const response = await this.axiosInstance.get(
      `/athletic/injury-risk/${userId}`,
      { params: { timeframe } }
    );
    return response.data;
  }

  /**
   * Get recovery recommendations
   */
  async getRecoveryRecommendations(userId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/athletic/recovery/${userId}`);
    return response.data;
  }

  // ============================================================================
  // WEARABLE DEVICES API
  // ============================================================================

  /**
   * Get all connected wearable devices
   */
  async getConnectedDevices(userId: string): Promise<WearableDevice[]> {
    const response = await this.axiosInstance.get<WearableDevice[]>(
      `/wearables/devices/${userId}`
    );
    return response.data;
  }

  /**
   * Sync a specific device
   */
  async syncDevice(deviceId: string, forceSync: boolean = false): Promise<{ status: string }> {
    const response = await this.axiosInstance.post<{ status: string }>(
      `/wearables/sync/${deviceId}`,
      { force_sync: forceSync }
    );
    return response.data;
  }

  /**
   * Connect a new wearable device
   */
  async connectDevice(
    userId: string,
    deviceType: string,
    authCode: string
  ): Promise<WearableDevice> {
    const response = await this.axiosInstance.post<WearableDevice>('/wearables/connect', {
      user_id: userId,
      device_type: deviceType,
      auth_code: authCode,
    });
    return response.data;
  }

  /**
   * Disconnect a wearable device
   */
  async disconnectDevice(deviceId: string): Promise<{ status: string }> {
    const response = await this.axiosInstance.delete<{ status: string }>(
      `/wearables/devices/${deviceId}`
    );
    return response.data;
  }

  /**
   * Get real-time biometric data
   */
  async getRealtimeBiometrics(userId: string): Promise<RealtimeBiometricData> {
    const response = await this.axiosInstance.get<RealtimeBiometricData>(
      `/wearables/realtime/${userId}`
    );
    return response.data;
  }

  /**
   * Get data quality metrics
   */
  async getDataQuality(userId: string): Promise<DataQuality> {
    const response = await this.axiosInstance.get<DataQuality>(
      `/wearables/data-quality/${userId}`
    );
    return response.data;
  }

  // ============================================================================
  // BIOMETRIC DATA API
  // ============================================================================

  /**
   * Submit biometric data point
   */
  async submitBiometricData(
    userId: string,
    dataType: string,
    value: number,
    timestamp: string,
    metadata?: any
  ): Promise<{ status: string }> {
    const response = await this.axiosInstance.post<{ status: string }>(
      `/biometrics/${userId}`,
      {
        data_type: dataType,
        value,
        timestamp,
        metadata,
      }
    );
    return response.data;
  }

  /**
   * Bulk upload biometric data
   */
  async bulkUploadBiometrics(
    userId: string,
    dataPoints: any[]
  ): Promise<{ status: string; uploaded: number }> {
    const response = await this.axiosInstance.post<{ status: string; uploaded: number }>(
      `/biometrics/${userId}/bulk`,
      { data_points: dataPoints }
    );
    return response.data;
  }

  /**
   * Get biometric data time series
   */
  async getBiometricData(query: BiometricDataQuery): Promise<BiometricTimeSeries> {
    const response = await this.axiosInstance.get<BiometricTimeSeries>(
      `/biometrics/${query.user_id}`,
      { params: query }
    );
    return response.data;
  }

  /**
   * Get biometric trends
   */
  async getBiometricTrends(
    userId: string,
    metric: string,
    period: string
  ): Promise<any> {
    const response = await this.axiosInstance.get(
      `/biometrics/${userId}/trends`,
      { params: { metric, period } }
    );
    return response.data;
  }

  // ============================================================================
  // ENHANCED HEALTH PREDICTIONS API
  // ============================================================================

  /**
   * Get multi-modal risk assessment
   */
  async getMultiModalRiskAssessment(
    userId: string,
    condition: string
  ): Promise<MultiModalRiskAssessment> {
    const response = await this.axiosInstance.get<MultiModalRiskAssessment>(
      `/predictions/${userId}/multi-modal`,
      { params: { condition } }
    );
    return response.data;
  }

  /**
   * Get liquid biopsy results
   */
  async getLiquidBiopsyResults(userId: string, testId: string): Promise<LiquidBiopsyResults> {
    const response = await this.axiosInstance.get<LiquidBiopsyResults>(
      `/clinical/liquid-biopsy/${userId}/${testId}`
    );
    return response.data;
  }

  /**
   * Order liquid biopsy test
   */
  async orderLiquidBiopsy(userId: string): Promise<{ test_id: string; order_date: string }> {
    const response = await this.axiosInstance.post<{ test_id: string; order_date: string }>(
      '/clinical/liquid-biopsy/order',
      { user_id: userId }
    );
    return response.data;
  }

  // ============================================================================
  // WEBHOOKS & NOTIFICATIONS
  // ============================================================================

  /**
   * Register webhook for real-time updates
   */
  async registerWebhook(url: string, events: string[]): Promise<{ webhook_id: string }> {
    const response = await this.axiosInstance.post<{ webhook_id: string }>('/webhooks', {
      url,
      events,
    });
    return response.data;
  }

  /**
   * Unregister webhook
   */
  async unregisterWebhook(webhookId: string): Promise<{ status: string }> {
    const response = await this.axiosInstance.delete<{ status: string }>(
      `/webhooks/${webhookId}`
    );
    return response.data;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    };

    const response = await this.axiosInstance.post(endpoint, formData, config);
    return response.data;
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<{ status: string; services: any }> {
    const response = await this.axiosInstance.get<{ status: string; services: any }>('/health');
    return response.data;
  }
}

// Export singleton instance
export const advancedFeaturesAPI = new AdvancedFeaturesAPI();
export default advancedFeaturesAPI;
