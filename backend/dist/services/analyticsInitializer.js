"use strict";
/**
 * Analytics Service Initializer for MediMind Backend
 * Handles initialization and setup of analytics services
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureService = exports.analyticsService = void 0;
exports.initializeAnalyticsServices = initializeAnalyticsServices;
exports.getAnalyticsService = getAnalyticsService;
exports.getFeatureEngineeringService = getFeatureEngineeringService;
exports.areAnalyticsServicesInitialized = areAnalyticsServicesInitialized;
exports.getAnalyticsServiceStatus = getAnalyticsServiceStatus;
exports.shutdownAnalyticsServices = shutdownAnalyticsServices;
exports.restartAnalyticsServices = restartAnalyticsServices;
exports.validateAnalyticsConfiguration = validateAnalyticsConfiguration;
exports.performAnalyticsHealthCheck = performAnalyticsHealthCheck;
const config_1 = __importDefault(require("../config/config"));
const AdvancedAnalyticsService_1 = __importDefault(require("./AdvancedAnalyticsService"));
const FeatureEngineeringService_1 = require("./FeatureEngineeringService");
const analytics_1 = require("../types/analytics");
// Global analytics service instances
let analyticsService = null;
exports.analyticsService = analyticsService;
let featureService = null;
exports.featureService = featureService;
let isInitialized = false;
/**
 * Initialize all analytics services
 */
async function initializeAnalyticsServices() {
    try {
        console.log('🔧 Initializing Analytics Services...');
        // Create analytics configuration from app config
        const analyticsConfig = {
            enableTimeSeriesForecasting: config_1.default.analytics.enableTimeSeriesForecasting,
            forecastingModels: config_1.default.analytics.forecastingModels,
            enableAnomalyDetection: config_1.default.analytics.enableAnomalyDetection,
            anomalyDetectionAlgorithms: config_1.default.analytics.anomalyDetectionAlgorithms,
            enableCircadianAnalysis: config_1.default.analytics.enableCircadianAnalysis,
            enablePersonalizedBaselines: config_1.default.analytics.enablePersonalizedBaselines,
            enablePopulationHealth: config_1.default.analytics.enablePopulationHealth,
            enableClinicalDecisionSupport: config_1.default.analytics.enableClinicalDecisionSupport,
            enableDrugInteractionChecking: config_1.default.analytics.enableDrugInteractionChecking,
            enableEvidenceBasedRecommendations: config_1.default.analytics.enableEvidenceBasedRecommendations
        };
        // Initialize Advanced Analytics Service
        exports.analyticsService = analyticsService = new AdvancedAnalyticsService_1.default();
        await analyticsService.initialize(analyticsConfig);
        console.log('✅ Advanced Analytics Service initialized');
        // Initialize Feature Engineering Service
        exports.featureService = featureService = new FeatureEngineeringService_1.FeatureEngineeringService();
        console.log('✅ Feature Engineering Service initialized');
        // Set initialization flag
        isInitialized = true;
        console.log('🎉 All Analytics Services initialized successfully');
        // Log configuration summary
        logConfigurationSummary(analyticsConfig);
    }
    catch (error) {
        console.error('❌ Failed to initialize Analytics Services:', error);
        throw new analytics_1.AnalyticsServiceError('Analytics services initialization failed', 'INITIALIZATION_FAILED', 500, { originalError: error.message });
    }
}
/**
 * Get the initialized analytics service instance
 */
function getAnalyticsService() {
    if (!analyticsService || !isInitialized) {
        throw new analytics_1.AnalyticsServiceError('Analytics service not initialized. Call initializeAnalyticsServices() first.', 'SERVICE_NOT_INITIALIZED', 500);
    }
    return analyticsService;
}
/**
 * Get the initialized feature engineering service instance
 */
function getFeatureEngineeringService() {
    if (!featureService || !isInitialized) {
        throw new analytics_1.AnalyticsServiceError('Feature engineering service not initialized. Call initializeAnalyticsServices() first.', 'SERVICE_NOT_INITIALIZED', 500);
    }
    return featureService;
}
/**
 * Check if analytics services are initialized
 */
function areAnalyticsServicesInitialized() {
    return isInitialized && analyticsService !== null && featureService !== null;
}
/**
 * Get analytics service status
 */
function getAnalyticsServiceStatus() {
    return {
        isInitialized,
        services: {
            analytics: analyticsService !== null && analyticsService.isServiceInitialized(),
            featureEngineering: featureService !== null
        },
        configuration: {
            timeSeriesForecasting: config_1.default.analytics.enableTimeSeriesForecasting,
            anomalyDetection: config_1.default.analytics.enableAnomalyDetection,
            circadianAnalysis: config_1.default.analytics.enableCircadianAnalysis,
            personalizedBaselines: config_1.default.analytics.enablePersonalizedBaselines,
            populationHealth: config_1.default.analytics.enablePopulationHealth,
            clinicalDecisionSupport: config_1.default.analytics.enableClinicalDecisionSupport
        },
        uptime: process.uptime()
    };
}
/**
 * Shutdown analytics services gracefully
 */
async function shutdownAnalyticsServices() {
    try {
        console.log('🔄 Shutting down Analytics Services...');
        // Reset service instances
        exports.analyticsService = analyticsService = null;
        exports.featureService = featureService = null;
        isInitialized = false;
        console.log('✅ Analytics Services shut down successfully');
    }
    catch (error) {
        console.error('❌ Error during Analytics Services shutdown:', error);
        throw error;
    }
}
/**
 * Restart analytics services
 */
async function restartAnalyticsServices() {
    console.log('🔄 Restarting Analytics Services...');
    await shutdownAnalyticsServices();
    await initializeAnalyticsServices();
    console.log('✅ Analytics Services restarted successfully');
}
/**
 * Validate analytics configuration
 */
function validateAnalyticsConfiguration() {
    const errors = [];
    // Check required configuration
    if (!config_1.default.analytics) {
        errors.push('Analytics configuration is missing');
        return { isValid: false, errors };
    }
    // Validate forecasting models
    if (config_1.default.analytics.enableTimeSeriesForecasting) {
        if (!config_1.default.analytics.forecastingModels || config_1.default.analytics.forecastingModels.length === 0) {
            errors.push('Forecasting models must be specified when time series forecasting is enabled');
        }
    }
    // Validate anomaly detection algorithms
    if (config_1.default.analytics.enableAnomalyDetection) {
        if (!config_1.default.analytics.anomalyDetectionAlgorithms || config_1.default.analytics.anomalyDetectionAlgorithms.length === 0) {
            errors.push('Anomaly detection algorithms must be specified when anomaly detection is enabled');
        }
    }
    // Validate cache settings
    if (config_1.default.analytics.cacheSettings) {
        const { forecastCacheTtl, anomalyCacheTtl, baselineCacheTtl } = config_1.default.analytics.cacheSettings;
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
    if (config_1.default.analytics.processingLimits) {
        const { maxDataPointsPerRequest, maxForecastHorizonDays, maxConcurrentJobs } = config_1.default.analytics.processingLimits;
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
function logConfigurationSummary(config) {
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
async function performAnalyticsHealthCheck() {
    const checks = {
        initialization: isInitialized,
        analyticsService: analyticsService !== null && analyticsService.isServiceInitialized(),
        featureEngineering: featureService !== null,
        configuration: validateAnalyticsConfiguration().isValid
    };
    const details = [];
    let healthyCount = 0;
    Object.entries(checks).forEach(([check, isHealthy]) => {
        if (isHealthy) {
            healthyCount++;
            details.push(`✅ ${check}: healthy`);
        }
        else {
            details.push(`❌ ${check}: unhealthy`);
        }
    });
    let status;
    if (healthyCount === Object.keys(checks).length) {
        status = 'healthy';
    }
    else if (healthyCount === 0) {
        status = 'unhealthy';
    }
    else {
        status = 'degraded';
    }
    return {
        status,
        checks,
        details
    };
}
// Default export
exports.default = {
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
