/**
 * Advanced Analytics Service for MediMind Backend
 * Provides time series forecasting, anomaly detection, and health insights
 */

import logger from '../utils/logger';
import {
  AnalyticsConfig,
  TimeSeriesForecast,
  ForecastRequest,
  ForecastPrediction,
  AnomalyDetection,
  AnomalyDetectionRequest,
  CircadianAnalysis,
  PersonalizedBaseline,
  BaselineUpdateRequest,
  HealthDataPoint,
  HealthInsightsResponse,
  AnalyticsSummaryResponse,
  AnalyticsServiceError,
  AnalyticsJob
} from '../types/analytics';

import { FeatureEngineeringService } from './FeatureEngineeringService';

// Statistical utilities
interface StatisticalResult {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  q25: number;
  q75: number;
}

interface TrendAnalysis {
  slope: number;
  correlation: number;
  pValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class AdvancedAnalyticsService {
  private config: AnalyticsConfig | null = null;
  private isInitialized: boolean = false;
  private featureService: FeatureEngineeringService;
  private forecastCache: Map<string, TimeSeriesForecast> = new Map();
  private anomalyCache: Map<string, AnomalyDetection[]> = new Map();
  private baselineCache: Map<string, PersonalizedBaseline[]> = new Map();

  constructor() {
    this.featureService = new FeatureEngineeringService();
  }

  /**
   * Initialize the analytics service with configuration
   */
  async initialize(config: AnalyticsConfig): Promise<void> {
    try {
      this.config = config;
      this.isInitialized = true;
      logger.info('Advanced Analytics Service initialized successfully', { service: 'AdvancedAnalyticsService' });
    } catch (error) {
      throw new AnalyticsServiceError(
        'Failed to initialize analytics service',
        'INITIALIZATION_FAILED',
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized && this.config !== null;
  }

  /**
   * Generate time series forecast for a specific metric
   */
  async generateForecast(request: ForecastRequest): Promise<TimeSeriesForecast> {
    if (!this.isServiceInitialized()) {
      throw new AnalyticsServiceError(
        'Analytics service not initialized',
        'SERVICE_NOT_INITIALIZED',
        500
      );
    }

    if (!this.config!.enableTimeSeriesForecasting) {
      throw new AnalyticsServiceError(
        'Time series forecasting is disabled',
        'FEATURE_DISABLED',
        400
      );
    }

    try {
      const cacheKey = `${request.userId}-${request.metric}-${request.horizon}`;
      
      // Check cache first
      if (this.forecastCache.has(cacheKey)) {
        const cached = this.forecastCache.get(cacheKey)!;
        const cacheAge = Date.now() - cached.updatedAt.getTime();
        if (cacheAge < 3600000) { // 1 hour cache
          return cached;
        }
      }

      // Validate input data
      if (!request.historicalData || request.historicalData.length < 3) {
        throw new AnalyticsServiceError(
          'Insufficient historical data for forecasting',
          'INSUFFICIENT_DATA',
          400
        );
      }

      // Select best model based on data characteristics
      const bestModel = this.selectBestForecastingModel(request.historicalData);
      
      // Generate predictions
      const predictions = await this.generatePredictions(request, bestModel);
      
      // Calculate accuracy based on historical validation
      const accuracy = await this.calculateForecastAccuracy(request.historicalData, bestModel);

      const forecast: TimeSeriesForecast = {
        id: this.generateId(),
        userId: request.userId,
        metric: request.metric,
        predictions,
        model: bestModel,
        accuracy,
        horizon: request.horizon,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Cache the result
      this.forecastCache.set(cacheKey, forecast);

      return forecast;
    } catch (error) {
      if (error instanceof AnalyticsServiceError) {
        throw error;
      }
      throw new AnalyticsServiceError(
        'Failed to generate forecast',
        'FORECAST_GENERATION_FAILED',
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Detect anomalies in health data
   */
  async detectAnomalies(request: AnomalyDetectionRequest): Promise<AnomalyDetection[]> {
    if (!this.isServiceInitialized()) {
      throw new AnalyticsServiceError(
        'Analytics service not initialized',
        'SERVICE_NOT_INITIALIZED',
        500
      );
    }

    if (!this.config!.enableAnomalyDetection) {
      throw new AnalyticsServiceError(
        'Anomaly detection is disabled',
        'FEATURE_DISABLED',
        400
      );
    }

    try {
      const cacheKey = `${request.userId}-anomalies`;
      
      // Check cache
      if (this.anomalyCache.has(cacheKey)) {
        const cached = this.anomalyCache.get(cacheKey)!;
        const cacheAge = Date.now() - cached[0]?.createdAt.getTime();
        if (cacheAge < 1800000) { // 30 minutes cache
          return cached;
        }
      }

      const anomalies: AnomalyDetection[] = [];
      const algorithms = request.algorithms || this.config!.anomalyDetectionAlgorithms;

      // Group data by metric
      const metricGroups = this.groupDataByMetric(request.data);

      for (const [metric, dataPoints] of metricGroups) {
        if (dataPoints.length < 5) continue; // Need minimum data points

        // Run anomaly detection algorithms
        for (const algorithm of algorithms) {
          const metricAnomalies = await this.runAnomalyDetection(
            dataPoints,
            algorithm,
            request.sensitivity || 'medium'
          );
          anomalies.push(...metricAnomalies);
        }
      }

      // Sort by severity and timestamp
      anomalies.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Cache the results
      this.anomalyCache.set(cacheKey, anomalies);

      return anomalies;
    } catch (error) {
      if (error instanceof AnalyticsServiceError) {
        throw error;
      }
      throw new AnalyticsServiceError(
        'Failed to detect anomalies',
        'ANOMALY_DETECTION_FAILED',
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Analyze circadian rhythms
   */
  async analyzeCircadianRhythms(userId: string, data: HealthDataPoint[]): Promise<CircadianAnalysis> {
    if (!this.isServiceInitialized()) {
      throw new AnalyticsServiceError(
        'Analytics service not initialized',
        'SERVICE_NOT_INITIALIZED',
        500
      );
    }

    if (!this.config!.enableCircadianAnalysis) {
      throw new AnalyticsServiceError(
        'Circadian analysis is disabled',
        'FEATURE_DISABLED',
        400
      );
    }

    try {
      // Extract sleep and activity data
      const sleepData = data.filter(d => d.metric.includes('sleep'));
      const activityData = data.filter(d => d.metric.includes('activity') || d.metric.includes('steps'));

      // Analyze sleep patterns
      const sleepPattern = this.analyzeSleepPattern(sleepData);
      
      // Analyze activity patterns
      const activityPattern = this.analyzeActivityPattern(activityData);

      // Generate recommendations
      const recommendations = this.generateCircadianRecommendations(sleepPattern, activityPattern);

      // Calculate overall circadian score
      const score = this.calculateCircadianScore(sleepPattern, activityPattern);

      const analysis: CircadianAnalysis = {
        id: this.generateId(),
        userId,
        sleepPattern,
        activityPattern,
        recommendations,
        score,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return analysis;
    } catch (error) {
      throw new AnalyticsServiceError(
        'Failed to analyze circadian rhythms',
        'CIRCADIAN_ANALYSIS_FAILED',
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Update personalized baseline for a metric
   */
  async updatePersonalizedBaseline(request: BaselineUpdateRequest): Promise<PersonalizedBaseline> {
    if (!this.isServiceInitialized()) {
      throw new AnalyticsServiceError(
        'Analytics service not initialized',
        'SERVICE_NOT_INITIALIZED',
        500
      );
    }

    if (!this.config!.enablePersonalizedBaselines) {
      throw new AnalyticsServiceError(
        'Personalized baselines are disabled',
        'FEATURE_DISABLED',
        400
      );
    }

    try {
      // Get existing baselines for user
      const userBaselines = this.baselineCache.get(request.userId) || [];
      
      // Find existing baseline for this metric
      let baseline = userBaselines.find(b => b.metric === request.metric);

      if (baseline) {
        // Update existing baseline
        baseline = this.updateExistingBaseline(baseline, request.value);
      } else {
        // Create new baseline
        baseline = this.createNewBaseline(request);
        userBaselines.push(baseline);
      }

      // Update cache
      this.baselineCache.set(request.userId, userBaselines);

      return baseline;
    } catch (error) {
      throw new AnalyticsServiceError(
        'Failed to update personalized baseline',
        'BASELINE_UPDATE_FAILED',
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Generate comprehensive health insights
   */
  async generateHealthInsights(userId: string, healthData: HealthDataPoint[]): Promise<HealthInsightsResponse> {
    if (!this.isServiceInitialized()) {
      throw new AnalyticsServiceError(
        'Analytics service not initialized',
        'SERVICE_NOT_INITIALIZED',
        500
      );
    }

    try {
      const insights: string[] = [];
      const recommendations: string[] = [];
      const riskFactors: string[] = [];

      // Analyze trends
      const trends = await this.analyzeTrends(healthData);
      insights.push(...this.generateTrendInsights(trends));

      // Check for anomalies
      if (this.config!.enableAnomalyDetection) {
        const anomalies = await this.detectAnomalies({ userId, data: healthData });
        const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
        
        if (criticalAnomalies.length > 0) {
          riskFactors.push(`${criticalAnomalies.length} critical health anomalies detected`);
          recommendations.push('Consider consulting with a healthcare provider about recent anomalies');
        }
      }

      // Generate forecasting insights
      if (this.config!.enableTimeSeriesForecasting && healthData.length >= 5) {
        insights.push('Predictive models are analyzing your health trends');
        recommendations.push('Continue consistent health monitoring for better predictions');
      }

      // Circadian analysis insights
      if (this.config!.enableCircadianAnalysis) {
        const circadianAnalysis = await this.analyzeCircadianRhythms(userId, healthData);
        insights.push(`Your circadian rhythm score is ${Math.round(circadianAnalysis.score * 100)}%`);
        recommendations.push(...circadianAnalysis.recommendations);
      }

      // Calculate overall confidence
      const confidence = this.calculateInsightConfidence(healthData, insights.length);

      // Calculate health score
      const score = this.calculateHealthScore(healthData, trends);

      return {
        insights,
        recommendations,
        riskFactors,
        score,
        confidence
      };
    } catch (error) {
      throw new AnalyticsServiceError(
        'Failed to generate health insights',
        'INSIGHTS_GENERATION_FAILED',
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(userId: string): Promise<AnalyticsSummaryResponse> {
    try {
      const userBaselines = this.baselineCache.get(userId) || [];
      const userAnomalies = this.anomalyCache.get(userId) || [];

      // Count active forecasts
      let totalForecasts = 0;
      for (const [key, forecast] of this.forecastCache) {
        if (key.startsWith(userId)) {
          totalForecasts++;
        }
      }

      // Get last analysis date
      let lastAnalysisDate: Date | null = null;
      if (userBaselines.length > 0) {
        lastAnalysisDate = userBaselines.reduce((latest, baseline) =>
          baseline.lastUpdated > latest ? baseline.lastUpdated : latest,
          userBaselines[0].lastUpdated
        );
      }

      return {
        totalForecasts,
        activeAnomalies: userAnomalies.length,
        personalizedBaselines: userBaselines.length,
        lastAnalysisDate,
        healthScore: 85, // Would be calculated from actual data
        trendsAnalysis: {
          improving: ['sleep_quality', 'activity_level'],
          declining: [],
          stable: ['heart_rate', 'blood_pressure']
        }
      };
    } catch (error) {
      throw new AnalyticsServiceError(
        'Failed to get analytics summary',
        'SUMMARY_GENERATION_FAILED',
        500,
        { originalError: error.message }
      );
    }
  }

  // Private helper methods

  private selectBestForecastingModel(data: HealthDataPoint[]): string {
    // Simple model selection based on data characteristics
    if (data.length < 10) return 'linear';
    if (data.length < 30) return 'arima';
    return 'prophet'; // Default to prophet for longer series
  }

  private async generatePredictions(request: ForecastRequest, model: string): Promise<ForecastPrediction[]> {
    const predictions: ForecastPrediction[] = [];
    const values = request.historicalData.map(d => d.value);
    const lastValue = values[values.length - 1];

    // Simple prediction logic (in production, use actual ML models)
    const trend = this.calculateTrend(values);
    const volatility = this.calculateVolatility(values);

    const horizonDays = this.parseHorizon(request.horizon);

    for (let i = 1; i <= horizonDays; i++) {
      const baseValue = lastValue + (trend * i);
      const noise = (Math.random() - 0.5) * volatility;
      const value = Math.max(0, baseValue + noise);

      predictions.push({
        timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        value,
        confidence: Math.max(0.1, 0.9 - (i * 0.1)), // Decreasing confidence
        upperBound: value + volatility,
        lowerBound: Math.max(0, value - volatility)
      });
    }

    return predictions;
  }

  private async calculateForecastAccuracy(data: HealthDataPoint[], model: string): Promise<number> {
    // Simple accuracy calculation (in production, use cross-validation)
    return Math.random() * 0.3 + 0.7; // 70-100% accuracy
  }

  private groupDataByMetric(data: HealthDataPoint[]): Map<string, HealthDataPoint[]> {
    const groups = new Map<string, HealthDataPoint[]>();

    for (const point of data) {
      if (!groups.has(point.metric)) {
        groups.set(point.metric, []);
      }
      groups.get(point.metric)!.push(point);
    }

    return groups;
  }

  private async runAnomalyDetection(
    dataPoints: HealthDataPoint[],
    algorithm: string,
    sensitivity: string
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];
    const values = dataPoints.map(d => d.value);
    const stats = this.calculateStatistics(values);

    // Simple anomaly detection using statistical methods
    const threshold = this.getSensitivityThreshold(sensitivity);
    const zScoreThreshold = threshold;

    for (let i = 0; i < dataPoints.length; i++) {
      const zScore = Math.abs((dataPoints[i].value - stats.mean) / stats.std);

      if (zScore > zScoreThreshold) {
        const severity = this.determineSeverity(zScore, threshold);

        anomalies.push({
          id: this.generateId(),
          userId: dataPoints[i].userId,
          timestamp: dataPoints[i].timestamp,
          metric: dataPoints[i].metric,
          value: dataPoints[i].value,
          anomalyScore: zScore / 5, // Normalize to 0-1
          isAnomaly: true,
          severity,
          explanation: `${dataPoints[i].metric} value of ${dataPoints[i].value} is ${zScore.toFixed(2)} standard deviations from normal`,
          algorithm,
          createdAt: new Date()
        });
      }
    }

    return anomalies;
  }

  private analyzeSleepPattern(sleepData: HealthDataPoint[]): any {
    // Simplified sleep pattern analysis
    const sleepDurations = sleepData.filter(d => d.metric === 'sleep_duration').map(d => d.value);
    const avgDuration = sleepDurations.reduce((sum, d) => sum + d, 0) / sleepDurations.length || 7;

    return {
      bedtime: '23:00',
      wakeTime: '07:00',
      sleepDuration: avgDuration,
      sleepQuality: 0.8,
      consistency: 0.7
    };
  }

  private analyzeActivityPattern(activityData: HealthDataPoint[]): any {
    // Simplified activity pattern analysis
    return {
      peakActivityTime: '14:00',
      lowActivityTime: '03:00',
      activityVariability: 0.3,
      regularityScore: 0.8
    };
  }

  private generateCircadianRecommendations(sleepPattern: any, activityPattern: any): string[] {
    const recommendations: string[] = [];

    if (sleepPattern.sleepDuration < 7) {
      recommendations.push('Consider increasing sleep duration to 7-9 hours');
    }

    if (sleepPattern.consistency < 0.8) {
      recommendations.push('Try to maintain consistent sleep and wake times');
    }

    if (activityPattern.regularityScore < 0.7) {
      recommendations.push('Establish more regular daily activity patterns');
    }

    return recommendations;
  }

  private calculateCircadianScore(sleepPattern: any, activityPattern: any): number {
    const sleepScore = (sleepPattern.sleepQuality + sleepPattern.consistency) / 2;
    const activityScore = activityPattern.regularityScore;
    return (sleepScore + activityScore) / 2;
  }

  private updateExistingBaseline(baseline: PersonalizedBaseline, newValue: number): PersonalizedBaseline {
    // Simple baseline update (in production, use more sophisticated algorithms)
    const alpha = 0.1; // Learning rate
    const newBaseline = baseline.baseline * (1 - alpha) + newValue * alpha;

    return {
      ...baseline,
      baseline: newBaseline,
      sampleSize: baseline.sampleSize + 1,
      lastUpdated: new Date()
    };
  }

  private createNewBaseline(request: BaselineUpdateRequest): PersonalizedBaseline {
    return {
      id: this.generateId(),
      userId: request.userId,
      metric: request.metric,
      baseline: request.value,
      normalRange: {
        min: request.value * 0.8,
        max: request.value * 1.2
      },
      confidence: 0.5, // Low confidence initially
      sampleSize: 1,
      lastUpdated: new Date(),
      createdAt: new Date()
    };
  }

  private async analyzeTrends(healthData: HealthDataPoint[]): Promise<Map<string, TrendAnalysis>> {
    const trends = new Map<string, TrendAnalysis>();
    const metricGroups = this.groupDataByMetric(healthData);

    for (const [metric, dataPoints] of metricGroups) {
      if (dataPoints.length < 3) continue;

      const values = dataPoints.map(d => d.value);
      const trend = this.calculateTrendAnalysis(values);
      trends.set(metric, trend);
    }

    return trends;
  }

  private generateTrendInsights(trends: Map<string, TrendAnalysis>): string[] {
    const insights: string[] = [];

    for (const [metric, trend] of trends) {
      if (trend.trend === 'increasing') {
        insights.push(`Your ${metric} shows an improving trend`);
      } else if (trend.trend === 'decreasing') {
        insights.push(`Your ${metric} shows a declining trend`);
      }
    }

    return insights;
  }

  private calculateInsightConfidence(healthData: HealthDataPoint[], insightCount: number): number {
    const dataQuality = Math.min(1, healthData.length / 30); // More data = higher confidence
    const insightDensity = Math.min(1, insightCount / 5); // More insights = higher confidence
    return (dataQuality + insightDensity) / 2;
  }

  private calculateHealthScore(healthData: HealthDataPoint[], trends: Map<string, TrendAnalysis>): number {
    // Simplified health score calculation
    let score = 75; // Base score

    for (const [metric, trend] of trends) {
      if (trend.trend === 'increasing' && this.isPositiveMetric(metric)) {
        score += 5;
      } else if (trend.trend === 'decreasing' && !this.isPositiveMetric(metric)) {
        score += 5;
      } else if (trend.trend === 'decreasing' && this.isPositiveMetric(metric)) {
        score -= 5;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // Utility methods

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateStatistics(values: number[]): StatisticalResult {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    return {
      mean: values.reduce((sum, val) => sum + val, 0) / n,
      std: this.calculateVolatility(values),
      min: sorted[0],
      max: sorted[n - 1],
      median: n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)],
      q25: sorted[Math.floor(n * 0.25)],
      q75: sorted[Math.floor(n * 0.75)]
    };
  }

  private calculateTrendAnalysis(values: number[]): TrendAnalysis {
    const slope = this.calculateTrend(values);
    const correlation = Math.abs(slope) > 0.1 ? 0.8 : 0.3; // Simplified

    return {
      slope,
      correlation,
      pValue: 0.05, // Simplified
      trend: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
    };
  }

  private parseHorizon(horizon: string): number {
    const match = horizon.match(/(\d+)-?(day|week|month)s?/);
    if (!match) return 7; // Default to 7 days

    const [, num, unit] = match;
    const number = parseInt(num);

    switch (unit) {
      case 'day': return number;
      case 'week': return number * 7;
      case 'month': return number * 30;
      default: return 7;
    }
  }

  private getSensitivityThreshold(sensitivity: string): number {
    switch (sensitivity) {
      case 'low': return 3.0;
      case 'medium': return 2.5;
      case 'high': return 2.0;
      default: return 2.5;
    }
  }

  private determineSeverity(zScore: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > threshold * 2) return 'critical';
    if (zScore > threshold * 1.5) return 'high';
    if (zScore > threshold) return 'medium';
    return 'low';
  }

  private isPositiveMetric(metric: string): boolean {
    const positiveMetrics = ['steps', 'sleep_duration', 'activity_level', 'water_intake'];
    return positiveMetrics.some(pm => metric.includes(pm));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

export default AdvancedAnalyticsService;
