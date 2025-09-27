/**
 * Analytics Service Initializer for MediMind Backend
 * Handles initialization and setup of analytics services
 */

import config from '../config/config';
import AdvancedAnalyticsService from './AdvancedAnalyticsService';
import { FeatureEngineeringService } from './FeatureEngineeringService';
import { AnalyticsConfig, AnalyticsServiceError } from '../types/analytics';

// Global analytics service instances
let analyticsService: AdvancedAnalyticsService | null = null;
let featureService: FeatureEngineeringService | null = null;
let isInitialized = false;

/**
 * Initialize all analytics services
 */
export async function initializeAnalyticsServices(): Promise<void> {
  try {
    console.log('🔧 Initializing Analytics Services...');

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
    console.log('✅ Advanced Analytics Service initialized');

    // Initialize Feature Engineering Service
    featureService = new FeatureEngineeringService();
    console.log('✅ Feature Engineering Service initialized');

    // Set initialization flag
    isInitialized = true;

    console.log('🎉 All Analytics Services initialized successfully');
    
    // Log configuration summary
    logConfigurationSummary(analyticsConfig);

  } catch (error) {
    console.error('❌ Failed to initialize Analytics Services:', error);
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
    console.log('🔄 Shutting down Analytics Services...');

    // Reset service instances
    analyticsService = null;
    featureService = null;
    isInitialized = false;

    console.log('✅ Analytics Services shut down successfully');
  } catch (error) {
    console.error('❌ Error during Analytics Services shutdown:', error);
    throw error;
  }
}

/**
 * Restart analytics services
 */
export async function restartAnalyticsServices(): Promise<void> {
  console.log('🔄 Restarting Analytics Services...');
  
  await shutdownAnalyticsServices();
  await initializeAnalyticsServices();
  
  console.log('✅ Analytics Services restarted successfully');
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
  console.log('\n📊 Analytics Configuration Summary:');
  console.log(`├── Time Series Forecasting: ${config.enableTimeSeriesForecasting ? '✅' : '❌'}`);
  if (config.enableTimeSeriesForecasting) {
    console.log(`│   └── Models: ${config.forecastingModels.join(', ')}`);
  }
  console.log(`├── Anomaly Detection: ${config.enableAnomalyDetection ? '✅' : '❌'}`);
  if (config.enableAnomalyDetection) {
    console.log(`│   └── Algorithms: ${config.anomalyDetectionAlgorithms.join(', ')}`);
  }
  console.log(`├── Circadian Analysis: ${config.enableCircadianAnalysis ? '✅' : '❌'}`);
  console.log(`├── Personalized Baselines: ${config.enablePersonalizedBaselines ? '✅' : '❌'}`);
  console.log(`├── Population Health: ${config.enablePopulationHealth ? '✅' : '❌'}`);
  console.log(`├── Clinical Decision Support: ${config.enableClinicalDecisionSupport ? '✅' : '❌'}`);
  console.log(`├── Drug Interaction Checking: ${config.enableDrugInteractionChecking ? '✅' : '❌'}`);
  console.log(`└── Evidence-Based Recommendations: ${config.enableEvidenceBasedRecommendations ? '✅' : '❌'}`);
  console.log('');
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
