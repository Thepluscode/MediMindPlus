"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'medimind',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    mlService: {
        url: process.env.ML_SERVICE_URL || 'http://localhost:8001',
        timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '10000', 10),
    },
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.AWS_S3_BUCKET || 'medimind-storage',
    },
    analytics: {
        enableTimeSeriesForecasting: process.env.ANALYTICS_ENABLE_FORECASTING !== 'false',
        forecastingModels: (process.env.ANALYTICS_FORECASTING_MODELS || 'prophet,arima,lstm').split(','),
        enableAnomalyDetection: process.env.ANALYTICS_ENABLE_ANOMALY_DETECTION !== 'false',
        anomalyDetectionAlgorithms: (process.env.ANALYTICS_ANOMALY_ALGORITHMS || 'isolation-forest,one-class-svm,autoencoder').split(','),
        enableCircadianAnalysis: process.env.ANALYTICS_ENABLE_CIRCADIAN !== 'false',
        enablePersonalizedBaselines: process.env.ANALYTICS_ENABLE_BASELINES !== 'false',
        enablePopulationHealth: process.env.ANALYTICS_ENABLE_POPULATION_HEALTH !== 'false',
        enableClinicalDecisionSupport: process.env.ANALYTICS_ENABLE_CLINICAL_SUPPORT !== 'false',
        enableDrugInteractionChecking: process.env.ANALYTICS_ENABLE_DRUG_INTERACTION !== 'false',
        enableEvidenceBasedRecommendations: process.env.ANALYTICS_ENABLE_EVIDENCE_BASED !== 'false',
        cacheSettings: {
            forecastCacheTtl: parseInt(process.env.ANALYTICS_FORECAST_CACHE_TTL || '3600', 10), // 1 hour
            anomalyCacheTtl: parseInt(process.env.ANALYTICS_ANOMALY_CACHE_TTL || '1800', 10), // 30 minutes
            baselineCacheTtl: parseInt(process.env.ANALYTICS_BASELINE_CACHE_TTL || '7200', 10), // 2 hours
        },
        processingLimits: {
            maxDataPointsPerRequest: parseInt(process.env.ANALYTICS_MAX_DATA_POINTS || '10000', 10),
            maxForecastHorizonDays: parseInt(process.env.ANALYTICS_MAX_FORECAST_DAYS || '90', 10),
            maxConcurrentJobs: parseInt(process.env.ANALYTICS_MAX_CONCURRENT_JOBS || '10', 10),
        },
        featureEngineering: {
            enableVoiceFeatures: process.env.ANALYTICS_ENABLE_VOICE_FEATURES !== 'false',
            enableActivityFeatures: process.env.ANALYTICS_ENABLE_ACTIVITY_FEATURES !== 'false',
            enableSleepFeatures: process.env.ANALYTICS_ENABLE_SLEEP_FEATURES !== 'false',
            enableTemporalFeatures: process.env.ANALYTICS_ENABLE_TEMPORAL_FEATURES !== 'false',
        }
    },
};
exports.default = config;
