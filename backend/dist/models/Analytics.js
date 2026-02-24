"use strict";
/**
 * Analytics Database Models for MediMind Backend
 * Mongoose schemas for analytics data storage
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModels = exports.HealthDataPointModel = exports.AnalyticsJobModel = exports.FeatureExtractionResultModel = exports.PersonalizedBaselineModel = exports.CircadianAnalysisModel = exports.AnomalyDetectionModel = exports.TimeSeriesForecastModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ForecastPredictionSchema = new mongoose_1.Schema({
    timestamp: { type: String, required: true },
    value: { type: Number, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    upperBound: { type: Number, required: true },
    lowerBound: { type: Number, required: true }
}, { _id: false });
const TimeSeriesForecastSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    metric: { type: String, required: true, index: true },
    predictions: [ForecastPredictionSchema],
    model: { type: String, required: true },
    accuracy: { type: Number, required: true, min: 0, max: 1 },
    horizon: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'forecasts'
});
// Compound index for efficient queries
TimeSeriesForecastSchema.index({ userId: 1, metric: 1, createdAt: -1 });
const AnomalyDetectionSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    timestamp: { type: String, required: true },
    metric: { type: String, required: true, index: true },
    value: { type: Number, required: true },
    anomalyScore: { type: Number, required: true, min: 0, max: 1 },
    isAnomaly: { type: Boolean, required: true, default: true },
    severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
        index: true
    },
    explanation: { type: String, required: true },
    algorithm: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true }
}, {
    timestamps: false,
    collection: 'anomalies'
});
// Compound indexes for efficient queries
AnomalyDetectionSchema.index({ userId: 1, severity: -1, createdAt: -1 });
AnomalyDetectionSchema.index({ userId: 1, metric: 1, createdAt: -1 });
const SleepPatternSchema = new mongoose_1.Schema({
    bedtime: { type: String, required: true },
    wakeTime: { type: String, required: true },
    sleepDuration: { type: Number, required: true },
    sleepQuality: { type: Number, required: true, min: 0, max: 1 },
    consistency: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });
const ActivityPatternSchema = new mongoose_1.Schema({
    peakActivityTime: { type: String, required: true },
    lowActivityTime: { type: String, required: true },
    activityVariability: { type: Number, required: true },
    regularityScore: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });
const CircadianAnalysisSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    sleepPattern: { type: SleepPatternSchema, required: true },
    activityPattern: { type: ActivityPatternSchema, required: true },
    recommendations: [{ type: String }],
    score: { type: Number, required: true, min: 0, max: 1 },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'circadian_analyses'
});
const NormalRangeSchema = new mongoose_1.Schema({
    min: { type: Number, required: true },
    max: { type: Number, required: true }
}, { _id: false });
const PersonalizedBaselineSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    metric: { type: String, required: true, index: true },
    baseline: { type: Number, required: true },
    normalRange: { type: NormalRangeSchema, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    sampleSize: { type: Number, required: true, min: 1 },
    lastUpdated: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: false,
    collection: 'baselines'
});
// Unique compound index to prevent duplicate baselines
PersonalizedBaselineSchema.index({ userId: 1, metric: 1 }, { unique: true });
const FeatureExtractionResultSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    dataType: { type: String, required: true, index: true },
    features: { type: mongoose_1.Schema.Types.Mixed, required: true },
    extractedAt: { type: Date, default: Date.now, index: true },
    version: { type: String, required: true }
}, {
    timestamps: false,
    collection: 'feature_extractions'
});
// Compound index for efficient queries
FeatureExtractionResultSchema.index({ userId: 1, dataType: 1, extractedAt: -1 });
const AnalyticsJobSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: ['forecast', 'anomaly_detection', 'circadian_analysis', 'baseline_update'],
        index: true
    },
    userId: { type: String, required: true, index: true },
    status: {
        type: String,
        required: true,
        enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
        default: 'queued',
        index: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        index: true
    },
    parameters: { type: mongoose_1.Schema.Types.Mixed, required: true },
    result: { type: mongoose_1.Schema.Types.Mixed },
    error: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'analytics_jobs'
});
// Compound indexes for job queue management
AnalyticsJobSchema.index({ status: 1, priority: -1, createdAt: 1 });
AnalyticsJobSchema.index({ userId: 1, type: 1, status: 1 });
// Health Data Point Schema (for analytics processing)
const HealthDataPointSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    timestamp: { type: String, required: true },
    metric: { type: String, required: true, index: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    source: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'health_data_points'
});
// Compound indexes for efficient time-series queries
HealthDataPointSchema.index({ userId: 1, metric: 1, timestamp: -1 });
HealthDataPointSchema.index({ userId: 1, timestamp: -1 });
// Create models
exports.TimeSeriesForecastModel = mongoose_1.default.model('TimeSeriesForecast', TimeSeriesForecastSchema);
exports.AnomalyDetectionModel = mongoose_1.default.model('AnomalyDetection', AnomalyDetectionSchema);
exports.CircadianAnalysisModel = mongoose_1.default.model('CircadianAnalysis', CircadianAnalysisSchema);
exports.PersonalizedBaselineModel = mongoose_1.default.model('PersonalizedBaseline', PersonalizedBaselineSchema);
exports.FeatureExtractionResultModel = mongoose_1.default.model('FeatureExtractionResult', FeatureExtractionResultSchema);
exports.AnalyticsJobModel = mongoose_1.default.model('AnalyticsJob', AnalyticsJobSchema);
exports.HealthDataPointModel = mongoose_1.default.model('HealthDataPoint', HealthDataPointSchema);
// Model utilities
class AnalyticsModels {
    /**
     * Get all forecasts for a user
     */
    static async getUserForecasts(userId, limit = 10) {
        return exports.TimeSeriesForecastModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
    /**
     * Get recent anomalies for a user
     */
    static async getUserAnomalies(userId, severity, limit = 20) {
        const query = { userId };
        if (severity) {
            query.severity = severity;
        }
        return exports.AnomalyDetectionModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
    /**
     * Get latest circadian analysis for a user
     */
    static async getLatestCircadianAnalysis(userId) {
        return exports.CircadianAnalysisModel
            .findOne({ userId })
            .sort({ createdAt: -1 })
            .exec();
    }
    /**
     * Get all baselines for a user
     */
    static async getUserBaselines(userId) {
        return exports.PersonalizedBaselineModel
            .find({ userId })
            .sort({ lastUpdated: -1 })
            .exec();
    }
    /**
     * Get baseline for a specific metric
     */
    static async getBaselineForMetric(userId, metric) {
        return exports.PersonalizedBaselineModel
            .findOne({ userId, metric })
            .exec();
    }
    /**
     * Get pending analytics jobs
     */
    static async getPendingJobs(limit = 50) {
        return exports.AnalyticsJobModel
            .find({ status: { $in: ['queued', 'running'] } })
            .sort({ priority: -1, createdAt: 1 })
            .limit(limit)
            .exec();
    }
    /**
     * Clean up old data (for maintenance)
     */
    static async cleanupOldData(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const results = await Promise.allSettled([
            exports.TimeSeriesForecastModel.deleteMany({ createdAt: { $lt: cutoffDate } }),
            exports.AnomalyDetectionModel.deleteMany({ createdAt: { $lt: cutoffDate } }),
            exports.AnalyticsJobModel.deleteMany({
                createdAt: { $lt: cutoffDate },
                status: { $in: ['completed', 'failed', 'cancelled'] }
            })
        ]);
        return results;
    }
}
exports.AnalyticsModels = AnalyticsModels;
