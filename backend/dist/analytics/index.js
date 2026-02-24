"use strict";
/**
 * Analytics Module Index for MediMind Backend
 * Central export point for all analytics-related functionality
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsUtils = exports.ANALYTICS_MODULE_INFO = exports.config = exports.analyticsRoutes = exports.ValidationUtils = exports.DataProcessingUtils = exports.TimeSeriesUtils = exports.StatisticsUtils = exports.AnalyticsModels = exports.HealthDataPointModel = exports.AnalyticsJobModel = exports.FeatureExtractionResultModel = exports.PersonalizedBaselineModel = exports.CircadianAnalysisModel = exports.AnomalyDetectionModel = exports.TimeSeriesForecastModel = exports.analyticsErrorHandler = exports.AnalyticsController = exports.performAnalyticsHealthCheck = exports.validateAnalyticsConfiguration = exports.restartAnalyticsServices = exports.shutdownAnalyticsServices = exports.getAnalyticsServiceStatus = exports.areAnalyticsServicesInitialized = exports.getFeatureEngineeringService = exports.getAnalyticsService = exports.initializeAnalyticsServices = exports.analyticsInitializer = exports.TemporalFeatureExtractor = exports.SleepFeatureExtractor = exports.ActivityFeatureExtractor = exports.VoiceFeatureExtractor = exports.FeatureEngineeringService = exports.AdvancedAnalyticsService = void 0;
exports.quickStartAnalytics = quickStartAnalytics;
// Core Services
var AdvancedAnalyticsService_1 = require("../services/AdvancedAnalyticsService");
Object.defineProperty(exports, "AdvancedAnalyticsService", { enumerable: true, get: function () { return __importDefault(AdvancedAnalyticsService_1).default; } });
var FeatureEngineeringService_1 = require("../services/FeatureEngineeringService");
Object.defineProperty(exports, "FeatureEngineeringService", { enumerable: true, get: function () { return FeatureEngineeringService_1.FeatureEngineeringService; } });
Object.defineProperty(exports, "VoiceFeatureExtractor", { enumerable: true, get: function () { return FeatureEngineeringService_1.VoiceFeatureExtractor; } });
Object.defineProperty(exports, "ActivityFeatureExtractor", { enumerable: true, get: function () { return FeatureEngineeringService_1.ActivityFeatureExtractor; } });
Object.defineProperty(exports, "SleepFeatureExtractor", { enumerable: true, get: function () { return FeatureEngineeringService_1.SleepFeatureExtractor; } });
Object.defineProperty(exports, "TemporalFeatureExtractor", { enumerable: true, get: function () { return FeatureEngineeringService_1.TemporalFeatureExtractor; } });
// Service Initializer
var analyticsInitializer_1 = require("../services/analyticsInitializer");
Object.defineProperty(exports, "analyticsInitializer", { enumerable: true, get: function () { return __importDefault(analyticsInitializer_1).default; } });
Object.defineProperty(exports, "initializeAnalyticsServices", { enumerable: true, get: function () { return analyticsInitializer_1.initializeAnalyticsServices; } });
Object.defineProperty(exports, "getAnalyticsService", { enumerable: true, get: function () { return analyticsInitializer_1.getAnalyticsService; } });
Object.defineProperty(exports, "getFeatureEngineeringService", { enumerable: true, get: function () { return analyticsInitializer_1.getFeatureEngineeringService; } });
Object.defineProperty(exports, "areAnalyticsServicesInitialized", { enumerable: true, get: function () { return analyticsInitializer_1.areAnalyticsServicesInitialized; } });
Object.defineProperty(exports, "getAnalyticsServiceStatus", { enumerable: true, get: function () { return analyticsInitializer_1.getAnalyticsServiceStatus; } });
Object.defineProperty(exports, "shutdownAnalyticsServices", { enumerable: true, get: function () { return analyticsInitializer_1.shutdownAnalyticsServices; } });
Object.defineProperty(exports, "restartAnalyticsServices", { enumerable: true, get: function () { return analyticsInitializer_1.restartAnalyticsServices; } });
Object.defineProperty(exports, "validateAnalyticsConfiguration", { enumerable: true, get: function () { return analyticsInitializer_1.validateAnalyticsConfiguration; } });
Object.defineProperty(exports, "performAnalyticsHealthCheck", { enumerable: true, get: function () { return analyticsInitializer_1.performAnalyticsHealthCheck; } });
// Controllers
var analyticsController_1 = require("../controllers/analyticsController");
Object.defineProperty(exports, "AnalyticsController", { enumerable: true, get: function () { return analyticsController_1.AnalyticsController; } });
Object.defineProperty(exports, "analyticsErrorHandler", { enumerable: true, get: function () { return analyticsController_1.analyticsErrorHandler; } });
// Database Models
var Analytics_1 = require("../models/Analytics");
Object.defineProperty(exports, "TimeSeriesForecastModel", { enumerable: true, get: function () { return Analytics_1.TimeSeriesForecastModel; } });
Object.defineProperty(exports, "AnomalyDetectionModel", { enumerable: true, get: function () { return Analytics_1.AnomalyDetectionModel; } });
Object.defineProperty(exports, "CircadianAnalysisModel", { enumerable: true, get: function () { return Analytics_1.CircadianAnalysisModel; } });
Object.defineProperty(exports, "PersonalizedBaselineModel", { enumerable: true, get: function () { return Analytics_1.PersonalizedBaselineModel; } });
Object.defineProperty(exports, "FeatureExtractionResultModel", { enumerable: true, get: function () { return Analytics_1.FeatureExtractionResultModel; } });
Object.defineProperty(exports, "AnalyticsJobModel", { enumerable: true, get: function () { return Analytics_1.AnalyticsJobModel; } });
Object.defineProperty(exports, "HealthDataPointModel", { enumerable: true, get: function () { return Analytics_1.HealthDataPointModel; } });
Object.defineProperty(exports, "AnalyticsModels", { enumerable: true, get: function () { return Analytics_1.AnalyticsModels; } });
// Utilities
var analyticsUtils_1 = require("../utils/analyticsUtils");
Object.defineProperty(exports, "StatisticsUtils", { enumerable: true, get: function () { return analyticsUtils_1.StatisticsUtils; } });
Object.defineProperty(exports, "TimeSeriesUtils", { enumerable: true, get: function () { return analyticsUtils_1.TimeSeriesUtils; } });
Object.defineProperty(exports, "DataProcessingUtils", { enumerable: true, get: function () { return analyticsUtils_1.DataProcessingUtils; } });
Object.defineProperty(exports, "ValidationUtils", { enumerable: true, get: function () { return analyticsUtils_1.ValidationUtils; } });
// Types and Interfaces
__exportStar(require("../types/analytics"), exports);
// Routes
var analytics_1 = require("../routes/analytics");
Object.defineProperty(exports, "analyticsRoutes", { enumerable: true, get: function () { return __importDefault(analytics_1).default; } });
// Re-export configuration
var config_1 = require("../config/config");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return __importDefault(config_1).default; } });
/**
 * Analytics Module Information
 */
exports.ANALYTICS_MODULE_INFO = {
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
async function quickStartAnalytics() {
    console.log(`🚀 Starting ${exports.ANALYTICS_MODULE_INFO.name} v${exports.ANALYTICS_MODULE_INFO.version}`);
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
        console.log(`📊 Analytics Module Status: ${healthCheck.status.toUpperCase()}`);
        if (healthCheck.status === 'healthy') {
            console.log('✅ Analytics module is ready for use!');
        }
        else {
            console.warn('⚠️ Analytics module started with issues:', healthCheck.details);
        }
    }
    catch (error) {
        console.error('❌ Failed to start analytics module:', error);
        throw error;
    }
}
/**
 * Analytics module utilities
 */
exports.analyticsUtils = {
    /**
     * Get module information
     */
    getModuleInfo: () => exports.ANALYTICS_MODULE_INFO,
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled: (feature) => {
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
    getAvailableAlgorithms: (service) => {
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
exports.default = {
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
    analyticsUtils: exports.analyticsUtils,
    // Module info
    ANALYTICS_MODULE_INFO: exports.ANALYTICS_MODULE_INFO,
    // Configuration
    config
};
