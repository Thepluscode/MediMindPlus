/**
 * Analytics Module Index for MediMind Backend
 * Central export point for all analytics-related functionality
 */

import logger from '../utils/logger';

// Core Services
export { default as AdvancedAnalyticsService } from '../services/AdvancedAnalyticsService';
export { 
  FeatureEngineeringService,
  VoiceFeatureExtractor,
  ActivityFeatureExtractor,
  SleepFeatureExtractor,
  TemporalFeatureExtractor
} from '../services/FeatureEngineeringService';

// Service Initializer
export {
  default as analyticsInitializer,
  initializeAnalyticsServices,
  getAnalyticsService,
  getFeatureEngineeringService,
  areAnalyticsServicesInitialized,
  getAnalyticsServiceStatus,
  shutdownAnalyticsServices,
  restartAnalyticsServices,
  validateAnalyticsConfiguration,
  performAnalyticsHealthCheck
} from '../services/analyticsInitializer';

// Controllers
export { 
  AnalyticsController,
  analyticsErrorHandler 
} from '../controllers/analyticsController';

// Database Models
export {
  TimeSeriesForecastModel,
  AnomalyDetectionModel,
  CircadianAnalysisModel,
  PersonalizedBaselineModel,
  FeatureExtractionResultModel,
  AnalyticsJobModel,
  HealthDataPointModel,
  AnalyticsModels,
  // Interfaces
  ITimeSeriesForecast,
  IAnomalyDetection,
  ICircadianAnalysis,
  IPersonalizedBaseline,
  IFeatureExtractionResult,
  IAnalyticsJob
} from '../models/Analytics';

// Utilities
export {
  StatisticsUtils,
  TimeSeriesUtils,
  DataProcessingUtils,
  ValidationUtils
} from '../utils/analyticsUtils';

// Types and Interfaces
export * from '../types/analytics';

// Routes
export { default as analyticsRoutes } from '../routes/analytics';

// Re-export configuration
export { default as config } from '../config/config';

/**
 * Analytics Module Information
 */
export const ANALYTICS_MODULE_INFO = {
  name: 'MediMind Analytics Module',
  version: '1.0.0',
  description: 'Comprehensive analytics and machine learning services for health data',
  features: [
    'Time Series Forecasting',
    'Anomaly Detection',
    'Circadian Rhythm Analysis',
    'Personalized Baselines',
    'Feature Engineering',
    'Health Insights Generation',
    'Population Health Analytics',
    'Clinical Decision Support'
  ],
  supportedDataTypes: [
    'Vital Signs',
    'Activity Data',
    'Sleep Data',
    'Voice Biomarkers',
    'Temporal Patterns'
  ],
  algorithms: {
    forecasting: ['Prophet', 'ARIMA', 'LSTM'],
    anomalyDetection: ['Isolation Forest', 'One-Class SVM', 'Autoencoder'],
    featureExtraction: ['Statistical', 'Spectral', 'Temporal', 'Circadian']
  }
};

/**
 * Quick start function for analytics module
 */
export async function quickStartAnalytics(): Promise<void> {
  logger.info('Starting Analytics Module', {
    service: 'analytics',
    moduleName: ANALYTICS_MODULE_INFO.name,
    version: ANALYTICS_MODULE_INFO.version
  });

  try {
    // Validate configuration
    const validation = validateAnalyticsConfiguration();
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Initialize services
    await initializeAnalyticsServices();
    
    // Perform health check
    const healthCheck = await performAnalyticsHealthCheck();
    logger.info('Analytics Module health check complete', {
      service: 'analytics',
      status: healthCheck.status.toUpperCase()
    });

    if (healthCheck.status === 'healthy') {
      logger.info('Analytics module is ready for use', {
        service: 'analytics'
      });
    } else {
      logger.warn('Analytics module started with issues', {
        service: 'analytics',
        details: healthCheck.details
      });
    }
    
  } catch (error: any) {
    logger.error('Failed to start analytics module', {
      service: 'analytics',
      error: error.message
    });
    throw error;
  }
}

/**
 * Analytics module utilities
 */
export const analyticsUtils = {
  /**
   * Get module information
   */
  getModuleInfo: () => ANALYTICS_MODULE_INFO,
  
  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled: (feature: string): boolean => {
    const analyticsConfig = config.analytics;
    switch (feature.toLowerCase()) {
      case 'forecasting':
      case 'time_series_forecasting':
        return analyticsConfig.enableTimeSeriesForecasting;
      case 'anomaly_detection':
        return analyticsConfig.enableAnomalyDetection;
      case 'circadian_analysis':
        return analyticsConfig.enableCircadianAnalysis;
      case 'personalized_baselines':
        return analyticsConfig.enablePersonalizedBaselines;
      case 'population_health':
        return analyticsConfig.enablePopulationHealth;
      case 'clinical_decision_support':
        return analyticsConfig.enableClinicalDecisionSupport;
      case 'drug_interaction_checking':
        return analyticsConfig.enableDrugInteractionChecking;
      case 'evidence_based_recommendations':
        return analyticsConfig.enableEvidenceBasedRecommendations;
      default:
        return false;
    }
  },
  
  /**
   * Get available algorithms for a service
   */
  getAvailableAlgorithms: (service: string): string[] => {
    const analyticsConfig = config.analytics;
    switch (service.toLowerCase()) {
      case 'forecasting':
        return analyticsConfig.forecastingModels;
      case 'anomaly_detection':
        return analyticsConfig.anomalyDetectionAlgorithms;
      default:
        return [];
    }
  },
  
  /**
   * Get processing limits
   */
  getProcessingLimits: () => config.analytics.processingLimits,
  
  /**
   * Get cache settings
   */
  getCacheSettings: () => config.analytics.cacheSettings
};

// Default export with all main functionality
export default {
  // Services
  AdvancedAnalyticsService,
  FeatureEngineeringService,
  
  // Initializer
  analyticsInitializer,
  quickStartAnalytics,
  
  // Controllers
  AnalyticsController,
  
  // Models
  AnalyticsModels,
  
  // Utilities
  StatisticsUtils,
  TimeSeriesUtils,
  DataProcessingUtils,
  ValidationUtils,
  analyticsUtils,
  
  // Module info
  ANALYTICS_MODULE_INFO,
  
  // Configuration
  config
};
