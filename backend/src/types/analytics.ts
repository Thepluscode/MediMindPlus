/**
 * Analytics Types and Interfaces for MediMind Backend
 * Comprehensive type definitions for analytics services, data structures, and API responses
 */

// Base Analytics Configuration
export interface AnalyticsConfig {
  enableTimeSeriesForecasting: boolean;
  forecastingModels: string[];
  enableAnomalyDetection: boolean;
  anomalyDetectionAlgorithms: string[];
  enableCircadianAnalysis: boolean;
  enablePersonalizedBaselines: boolean;
  enablePopulationHealth: boolean;
  enableClinicalDecisionSupport: boolean;
  enableDrugInteractionChecking: boolean;
  enableEvidenceBasedRecommendations: boolean;
}

// Time Series Forecasting Types
export interface TimeSeriesForecast {
  id: string;
  userId: string;
  metric: string;
  predictions: ForecastPrediction[];
  model: string;
  accuracy: number;
  horizon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForecastPrediction {
  timestamp: string;
  value: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface ForecastRequest {
  userId: string;
  metric: string;
  horizon: string;
  historicalData: HealthDataPoint[];
}

// Anomaly Detection Types
export interface AnomalyDetection {
  id: string;
  userId: string;
  timestamp: string;
  metric: string;
  value: number;
  anomalyScore: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  algorithm: string;
  createdAt: Date;
}

export interface AnomalyDetectionRequest {
  userId: string;
  data: HealthDataPoint[];
  algorithms?: string[];
  sensitivity?: 'low' | 'medium' | 'high';
}

// Circadian Analysis Types
export interface CircadianAnalysis {
  id: string;
  userId: string;
  sleepPattern: SleepPattern;
  activityPattern: ActivityPattern;
  recommendations: string[];
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SleepPattern {
  bedtime: string;
  wakeTime: string;
  sleepDuration: number;
  sleepQuality: number;
  consistency: number;
}

export interface ActivityPattern {
  peakActivityTime: string;
  lowActivityTime: string;
  activityVariability: number;
  regularityScore: number;
}

// Personalized Baselines Types
export interface PersonalizedBaseline {
  id: string;
  userId: string;
  metric: string;
  baseline: number;
  normalRange: {
    min: number;
    max: number;
  };
  confidence: number;
  sampleSize: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface BaselineUpdateRequest {
  userId: string;
  metric: string;
  value: number;
  timestamp?: Date;
}

// Health Data Types
export interface HealthDataPoint {
  id?: string;
  userId: string;
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface VitalSigns {
  id?: string;
  userId: string;
  timestamp: string;
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
}

export interface ActivityData {
  id?: string;
  userId: string;
  timestamp: string;
  steps?: number;
  distance?: number;
  calories?: number;
  activeMinutes?: number;
  sedentaryMinutes?: number;
  heartRateZones?: {
    fat_burn: number;
    cardio: number;
    peak: number;
  };
}

export interface SleepData {
  id?: string;
  userId: string;
  timestamp: string;
  duration: number;
  quality: number;
  efficiency: number;
  stages: {
    light: number;
    deep: number;
    rem: number;
    awake: number;
  };
  bedtime: string;
  wakeTime: string;
}

// Feature Engineering Types
export interface FeatureExtractionResult {
  userId: string;
  dataType: string;
  features: Record<string, number>;
  extractedAt: Date;
  version: string;
}

export interface VoiceFeatures {
  f0_mean: number;
  f0_std: number;
  f0_range: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  spectral_centroid: number;
  spectral_bandwidth: number;
  mfcc_1: number;
  mfcc_2: number;
  mfcc_3: number;
  speaking_rate: number;
  pause_ratio: number;
  breathiness: number;
  roughness: number;
  valence: number;
  arousal: number;
  stress_level: number;
}

export interface ActivityFeatures {
  daily_steps: number;
  step_consistency: number;
  sedentary_time: number;
  light_activity_time: number;
  moderate_activity_time: number;
  vigorous_activity_time: number;
  resting_hr: number;
  max_hr: number;
  hr_variability: number;
  gait_speed: number;
  gait_variability: number;
  balance_score: number;
  activity_regularity: number;
  weekend_activity_ratio: number;
  total_calories: number;
  active_calories: number;
  calories_per_step: number;
}

export interface SleepFeatures {
  sleep_duration: number;
  bedtime_hour: number;
  wake_time_hour: number;
  sleep_efficiency: number;
  sleep_latency: number;
  wake_after_sleep_onset: number;
  light_sleep_percentage: number;
  deep_sleep_percentage: number;
  rem_sleep_percentage: number;
  bedtime_consistency: number;
  sleep_duration_consistency: number;
  awakenings_count: number;
  longest_wake_period: number;
  sleep_hr_mean: number;
  sleep_hr_variability: number;
  sleep_respiratory_rate: number;
  respiratory_disturbance_index: number;
  sleep_movement_index: number;
  position_changes: number;
  room_temperature: number;
  ambient_light: number;
  noise_level: number;
}

// Analytics Response Types
export interface AnalyticsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  processingTime?: number;
}

export interface HealthInsightsResponse {
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
  score: number;
  confidence: number;
}

export interface AnalyticsSummaryResponse {
  totalForecasts: number;
  activeAnomalies: number;
  personalizedBaselines: number;
  lastAnalysisDate: Date | null;
  healthScore: number;
  trendsAnalysis: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
}

// Drug Interaction Types
export interface DrugInteraction {
  id: string;
  drugs: string[];
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  recommendation: string;
  evidence: string;
  sources: string[];
}

export interface DrugInteractionRequest {
  medications: string[];
  patientConditions?: string[];
  allergies?: string[];
}

// Clinical Decision Support Types
export interface ClinicalRecommendation {
  id: string;
  type: 'diagnostic' | 'therapeutic' | 'preventive' | 'monitoring';
  title: string;
  description: string;
  evidence: string;
  strength: 'strong' | 'moderate' | 'weak';
  quality: 'high' | 'moderate' | 'low' | 'very_low';
  applicability: number; // 0-1 score
  sources: string[];
}

// Population Health Types
export interface PopulationHealthMetrics {
  totalPatients: number;
  averageAge: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  commonConditions: Array<{
    condition: string;
    prevalence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  outcomeMetrics: {
    readmissionRate: number;
    mortalityRate: number;
    qualityOfLifeScore: number;
  };
}

// Analytics Job Types
export interface AnalyticsJob {
  id: string;
  type: 'forecast' | 'anomaly_detection' | 'circadian_analysis' | 'baseline_update';
  userId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Database Entity Types
export interface AnalyticsEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface AnalyticsError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, any>;
}

export class AnalyticsServiceError extends Error implements AnalyticsError {
  code: string;
  statusCode: number;
  details?: Record<string, any>;

  constructor(message: string, code: string, statusCode: number = 500, details?: Record<string, any>) {
    super(message);
    this.name = 'AnalyticsServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
