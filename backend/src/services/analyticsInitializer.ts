/**
 * Analytics Service Initializer for MediMind Backend
 * Handles initialization and setup of analytics services
 */

import config from '../config/config';
import AdvancedAnalyticsService from './AdvancedAnalyticsService';
import { FeatureEngineeringService } from './FeatureEngineeringService';
import { AnalyticsConfig, AnalyticsServiceError } from '../types/analytics';
import logger from '../utils/logger';

// Global analytics service instances
let analyticsService: AdvancedAnalyticsService | null = null;
let featureService: FeatureEngineeringService | null = null;
let isInitialized = false;

/**
 * Initialize all analytics services
 */
export async function initializeAnalyticsServices(): Promise<void> {
  try {
    logger.info('Initializing Analytics Services', {
      service: 'analytics'
    });

    // Create analytics configuration from app config
    const analyticsConfig: AnalyticsConfig = {
      enableTimeSeriesForecasting: config.analytics.enableTimeSeriesForecasting,
      forecastingModels: config.analytics.forecastingModels,
      enableAnomalyDetection: config.analytics.enableAnomalyDetection,
      anomalyDetectionAlgorithms: config.analytics.anomalyDetectionAlgorithms,
      enableCircadianAnalysis: config.analytics.enableCircadianAnalysis,
      enablePersonalizedBaselines: config.analytics.enablePersonalizedBaselines,
      enablePopulationHealth: config.analytics.enablePopulationHealth,
      enableClinicalDecisionSupport: config.analytics.enableClinicalDecisionSupport,
      enableDrugInteractionChecking: config.analytics.enableDrugInteractionChecking,
      enableEvidenceBasedRecommendations: config.analytics.enableEvidenceBasedRecommendations
    };

    // Initialize Advanced Analytics Service
    analyticsService = new AdvancedAnalyticsService();
    await analyticsService.initialize(analyticsConfig);
    logger.info('Advanced Analytics Service initialized', {
      service: 'analytics'
    });

    // Initialize Feature Engineering Service
    featureService = new FeatureEngineeringService();
    logger.info('Feature Engineering Service initialized', {
      service: 'analytics'
    });

    // Set initialization flag
    isInitialized = true;

    logger.info('All Analytics Services initialized successfully', {
      service: 'analytics',
      config: {
        timeSeriesForecasting: analyticsConfig.enableTimeSeriesForecasting,
        anomalyDetection: analyticsConfig.enableAnomalyDetection,
        circadianAnalysis: analyticsConfig.enableCircadianAnalysis,
        personalizedBaselines: analyticsConfig.enablePersonalizedBaselines,
        populationHealth: analyticsConfig.enablePopulationHealth,
        clinicalDecisionSupport: analyticsConfig.enableClinicalDecisionSupport
      }
    });

    // Log configuration summary
    logConfigurationSummary(analyticsConfig);

  } catch (error) {
    logger.error('Failed to initialize Analytics Services', {
      service: 'analytics',
      error: error.message
    });
    throw new AnalyticsServiceError(
      'Analytics services initialization failed',
      'INITIALIZATION_FAILED',
      500,
      { originalError: error.message }
    );
  }
}

/**
 * Get the initialized analytics service instance
 */
export function getAnalyticsService(): AdvancedAnalyticsService {
  if (!analyticsService || !isInitialized) {
    throw new AnalyticsServiceError(
      'Analytics service not initialized. Call initializeAnalyticsServices() first.',
      'SERVICE_NOT_INITIALIZED',
      500
    );
  }
  return analyticsService;
}

/**
 * Get the initialized feature engineering service instance
 */
export function getFeatureEngineeringService(): FeatureEngineeringService {
  if (!featureService || !isInitialized) {
    throw new AnalyticsServiceError(
      'Feature engineering service not initialized. Call initializeAnalyticsServices() first.',
      'SERVICE_NOT_INITIALIZED',
      500
    );
  }
  return featureService;
}

/**
 * Check if analytics services are initialized
 */
export function areAnalyticsServicesInitialized(): boolean {
  return isInitialized && analyticsService !== null && featureService !== null;
}

/**
 * Get analytics service status
 */
export function getAnalyticsServiceStatus(): {
  isInitialized: boolean;
  services: {
    analytics: boolean;
    featureEngineering: boolean;
  };
  configuration: {
    timeSeriesForecasting: boolean;
    anomalyDetection: boolean;
    circadianAnalysis: boolean;
    personalizedBaselines: boolean;
    populationHealth: boolean;
    clinicalDecisionSupport: boolean;
  };
  uptime: number;
} {
  return {
    isInitialized,
    services: {
      analytics: analyticsService !== null && analyticsService.isServiceInitialized(),
      featureEngineering: featureService !== null
    },
    configuration: {
      timeSeriesForecasting: config.analytics.enableTimeSeriesForecasting,
      anomalyDetection: config.analytics.enableAnomalyDetection,
      circadianAnalysis: config.analytics.enableCircadianAnalysis,
      personalizedBaselines: config.analytics.enablePersonalizedBaselines,
      populationHealth: config.analytics.enablePopulationHealth,
      clinicalDecisionSupport: config.analytics.enableClinicalDecisionSupport
    },
    uptime: process.uptime()
  };
}

/**
 * Shutdown analytics services gracefully
 */
export async function shutdownAnalyticsServices(): Promise<void> {
  try {
    logger.info('Shutting down Analytics Services', {
      service: 'analytics'
    });

    // Reset service instances
    analyticsService = null;
    featureService = null;
    isInitialized = false;

    logger.info('Analytics Services shut down successfully', {
      service: 'analytics'
    });
  } catch (error) {
    logger.error('Error during Analytics Services shutdown', {
      service: 'analytics',
      error: error.message
    });
    throw error;
  }
}

/**
 * Restart analytics services
 */
export async function restartAnalyticsServices(): Promise<void> {
  logger.info('Restarting Analytics Services', {
    service: 'analytics'
  });

  await shutdownAnalyticsServices();
  await initializeAnalyticsServices();

  logger.info('Analytics Services restarted successfully', {
    service: 'analytics'
  });
}

/**
 * Validate analytics configuration
 */
export function validateAnalyticsConfiguration(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required configuration
  if (!config.analytics) {
    errors.push('Analytics configuration is missing');
    return { isValid: false, errors };
  }

  // Validate forecasting models
  if (config.analytics.enableTimeSeriesForecasting) {
    if (!config.analytics.forecastingModels || config.analytics.forecastingModels.length === 0) {
      errors.push('Forecasting models must be specified when time series forecasting is enabled');
    }
  }

  // Validate anomaly detection algorithms
  if (config.analytics.enableAnomalyDetection) {
    if (!config.analytics.anomalyDetectionAlgorithms || config.analytics.anomalyDetectionAlgorithms.length === 0) {
      errors.push('Anomaly detection algorithms must be specified when anomaly detection is enabled');
    }
  }

  // Validate cache settings
  if (config.analytics.cacheSettings) {
    const { forecastCacheTtl, anomalyCacheTtl, baselineCacheTtl } = config.analytics.cacheSettings;
    
    if (forecastCacheTtl <= 0) {
      errors.push('Forecast cache TTL must be positive');
    }
    
    if (anomalyCacheTtl <= 0) {
      errors.push('Anomaly cache TTL must be positive');
    }
    
    if (baselineCacheTtl <= 0) {
      errors.push('Baseline cache TTL must be positive');
    }
  }

  // Validate processing limits
  if (config.analytics.processingLimits) {
    const { maxDataPointsPerRequest, maxForecastHorizonDays, maxConcurrentJobs } = config.analytics.processingLimits;
    
    if (maxDataPointsPerRequest <= 0) {
      errors.push('Max data points per request must be positive');
    }
    
    if (maxForecastHorizonDays <= 0) {
      errors.push('Max forecast horizon days must be positive');
    }
    
    if (maxConcurrentJobs <= 0) {
      errors.push('Max concurrent jobs must be positive');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log configuration summary
 */
function logConfigurationSummary(config: AnalyticsConfig): void {
  logger.info('Analytics Configuration Summary', {
    service: 'analytics',
    configuration: {
      timeSeriesForecasting: {
        enabled: config.enableTimeSeriesForecasting,
        models: config.forecastingModels
      },
      anomalyDetection: {
        enabled: config.enableAnomalyDetection,
        algorithms: config.anomalyDetectionAlgorithms
      },
      circadianAnalysis: config.enableCircadianAnalysis,
      personalizedBaselines: config.enablePersonalizedBaselines,
      populationHealth: config.enablePopulationHealth,
      clinicalDecisionSupport: config.enableClinicalDecisionSupport,
      drugInteractionChecking: config.enableDrugInteractionChecking,
      evidenceBasedRecommendations: config.enableEvidenceBasedRecommendations
    }
  });
}

/**
 * Health check for analytics services
 */
export async function performAnalyticsHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    initialization: boolean;
    analyticsService: boolean;
    featureEngineering: boolean;
    configuration: boolean;
  };
  details: string[];
}> {
  const checks = {
    initialization: isInitialized,
    analyticsService: analyticsService !== null && analyticsService.isServiceInitialized(),
    featureEngineering: featureService !== null,
    configuration: validateAnalyticsConfiguration().isValid
  };

  const details: string[] = [];
  let healthyCount = 0;

  Object.entries(checks).forEach(([check, isHealthy]) => {
    if (isHealthy) {
      healthyCount++;
      details.push(`✅ ${check}: healthy`);
    } else {
      details.push(`❌ ${check}: unhealthy`);
    }
  });

  let status: 'healthy' | 'unhealthy' | 'degraded';
  if (healthyCount === Object.keys(checks).length) {
    status = 'healthy';
  } else if (healthyCount === 0) {
    status = 'unhealthy';
  } else {
    status = 'degraded';
  }

  return {
    status,
    checks,
    details
  };
}

// Export service instances for direct access (use with caution)
export { analyticsService, featureService };

// Default export
export default {
  initializeAnalyticsServices,
  getAnalyticsService,
  getFeatureEngineeringService,
  areAnalyticsServicesInitialized,
  getAnalyticsServiceStatus,
  shutdownAnalyticsServices,
  restartAnalyticsServices,
  validateAnalyticsConfiguration,
  performAnalyticsHealthCheck
};
