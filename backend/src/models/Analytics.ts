/**
 * Analytics Database Models for MediMind Backend
 * Mongoose schemas for analytics data storage
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  TimeSeriesForecast,
  AnomalyDetection,
  CircadianAnalysis,
  PersonalizedBaseline,
  FeatureExtractionResult,
  AnalyticsJob
} from '../types/analytics';

// Forecast Schema
interface ITimeSeriesForecast extends TimeSeriesForecast, Document {}

const ForecastPredictionSchema = new Schema({
  timestamp: { type: String, required: true },
  value: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  upperBound: { type: Number, required: true },
  lowerBound: { type: Number, required: true }
}, { _id: false });

const TimeSeriesForecastSchema = new Schema<ITimeSeriesForecast>({
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

// Anomaly Detection Schema
interface IAnomalyDetection extends AnomalyDetection, Document {}

const AnomalyDetectionSchema = new Schema<IAnomalyDetection>({
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

// Circadian Analysis Schema
interface ICircadianAnalysis extends CircadianAnalysis, Document {}

const SleepPatternSchema = new Schema({
  bedtime: { type: String, required: true },
  wakeTime: { type: String, required: true },
  sleepDuration: { type: Number, required: true },
  sleepQuality: { type: Number, required: true, min: 0, max: 1 },
  consistency: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

const ActivityPatternSchema = new Schema({
  peakActivityTime: { type: String, required: true },
  lowActivityTime: { type: String, required: true },
  activityVariability: { type: Number, required: true },
  regularityScore: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

const CircadianAnalysisSchema = new Schema<ICircadianAnalysis>({
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

// Personalized Baseline Schema
interface IPersonalizedBaseline extends PersonalizedBaseline, Document {}

const NormalRangeSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true }
}, { _id: false });

const PersonalizedBaselineSchema = new Schema<IPersonalizedBaseline>({
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

// Feature Extraction Result Schema
interface IFeatureExtractionResult extends FeatureExtractionResult, Document {}

const FeatureExtractionResultSchema = new Schema<IFeatureExtractionResult>({
  userId: { type: String, required: true, index: true },
  dataType: { type: String, required: true, index: true },
  features: { type: Schema.Types.Mixed, required: true },
  extractedAt: { type: Date, default: Date.now, index: true },
  version: { type: String, required: true }
}, {
  timestamps: false,
  collection: 'feature_extractions'
});

// Compound index for efficient queries
FeatureExtractionResultSchema.index({ userId: 1, dataType: 1, extractedAt: -1 });

// Analytics Job Schema
interface IAnalyticsJob extends AnalyticsJob, Document {}

const AnalyticsJobSchema = new Schema<IAnalyticsJob>({
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
  parameters: { type: Schema.Types.Mixed, required: true },
  result: { type: Schema.Types.Mixed },
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
const HealthDataPointSchema = new Schema({
  userId: { type: String, required: true, index: true },
  timestamp: { type: String, required: true },
  metric: { type: String, required: true, index: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  source: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'health_data_points'
});

// Compound indexes for efficient time-series queries
HealthDataPointSchema.index({ userId: 1, metric: 1, timestamp: -1 });
HealthDataPointSchema.index({ userId: 1, timestamp: -1 });

// Create models
export const TimeSeriesForecastModel: Model<ITimeSeriesForecast> = mongoose.model<ITimeSeriesForecast>('TimeSeriesForecast', TimeSeriesForecastSchema);
export const AnomalyDetectionModel: Model<IAnomalyDetection> = mongoose.model<IAnomalyDetection>('AnomalyDetection', AnomalyDetectionSchema);
export const CircadianAnalysisModel: Model<ICircadianAnalysis> = mongoose.model<ICircadianAnalysis>('CircadianAnalysis', CircadianAnalysisSchema);
export const PersonalizedBaselineModel: Model<IPersonalizedBaseline> = mongoose.model<IPersonalizedBaseline>('PersonalizedBaseline', PersonalizedBaselineSchema);
export const FeatureExtractionResultModel: Model<IFeatureExtractionResult> = mongoose.model<IFeatureExtractionResult>('FeatureExtractionResult', FeatureExtractionResultSchema);
export const AnalyticsJobModel: Model<IAnalyticsJob> = mongoose.model<IAnalyticsJob>('AnalyticsJob', AnalyticsJobSchema);
export const HealthDataPointModel = mongoose.model('HealthDataPoint', HealthDataPointSchema);

// Export interfaces for use in other files
export {
  ITimeSeriesForecast,
  IAnomalyDetection,
  ICircadianAnalysis,
  IPersonalizedBaseline,
  IFeatureExtractionResult,
  IAnalyticsJob
};

// Model utilities
export class AnalyticsModels {
  /**
   * Get all forecasts for a user
   */
  static async getUserForecasts(userId: string, limit: number = 10) {
    return TimeSeriesForecastModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get recent anomalies for a user
   */
  static async getUserAnomalies(userId: string, severity?: string, limit: number = 20) {
    const query: any = { userId };
    if (severity) {
      query.severity = severity;
    }

    return AnomalyDetectionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get latest circadian analysis for a user
   */
  static async getLatestCircadianAnalysis(userId: string) {
    return CircadianAnalysisModel
      .findOne({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get all baselines for a user
   */
  static async getUserBaselines(userId: string) {
    return PersonalizedBaselineModel
      .find({ userId })
      .sort({ lastUpdated: -1 })
      .exec();
  }

  /**
   * Get baseline for a specific metric
   */
  static async getBaselineForMetric(userId: string, metric: string) {
    return PersonalizedBaselineModel
      .findOne({ userId, metric })
      .exec();
  }

  /**
   * Get pending analytics jobs
   */
  static async getPendingJobs(limit: number = 50) {
    return AnalyticsJobModel
      .find({ status: { $in: ['queued', 'running'] } })
      .sort({ priority: -1, createdAt: 1 })
      .limit(limit)
      .exec();
  }

  /**
   * Clean up old data (for maintenance)
   */
  static async cleanupOldData(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const results = await Promise.allSettled([
      TimeSeriesForecastModel.deleteMany({ createdAt: { $lt: cutoffDate } }),
      AnomalyDetectionModel.deleteMany({ createdAt: { $lt: cutoffDate } }),
      AnalyticsJobModel.deleteMany({ 
        createdAt: { $lt: cutoffDate },
        status: { $in: ['completed', 'failed', 'cancelled'] }
      })
    ]);

    return results;
  }
}
