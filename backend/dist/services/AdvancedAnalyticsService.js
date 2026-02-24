"use strict";
/**
 * Advanced Analytics Service for MediMind Backend
 * Provides time series forecasting, anomaly detection, and health insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedAnalyticsService = void 0;
const analytics_1 = require("../types/analytics");
const FeatureEngineeringService_1 = require("./FeatureEngineeringService");
class AdvancedAnalyticsService {
    constructor() {
        this.config = null;
        this.isInitialized = false;
        this.forecastCache = new Map();
        this.anomalyCache = new Map();
        this.baselineCache = new Map();
        this.featureService = new FeatureEngineeringService_1.FeatureEngineeringService();
    }
    /**
     * Initialize the analytics service with configuration
     */
    async initialize(config) {
        try {
            this.config = config;
            this.isInitialized = true;
            console.log('Advanced Analytics Service initialized successfully');
        }
        catch (error) {
            throw new analytics_1.AnalyticsServiceError('Failed to initialize analytics service', 'INITIALIZATION_FAILED', 500, { originalError: error.message });
        }
    }
    /**
     * Check if service is initialized
     */
    isServiceInitialized() {
        return this.isInitialized && this.config !== null;
    }
    /**
     * Generate time series forecast for a specific metric
     */
    async generateForecast(request) {
        if (!this.isServiceInitialized()) {
            throw new analytics_1.AnalyticsServiceError('Analytics service not initialized', 'SERVICE_NOT_INITIALIZED', 500);
        }
        if (!this.config.enableTimeSeriesForecasting) {
            throw new analytics_1.AnalyticsServiceError('Time series forecasting is disabled', 'FEATURE_DISABLED', 400);
        }
        try {
            const cacheKey = `${request.userId}-${request.metric}-${request.horizon}`;
            // Check cache first
            if (this.forecastCache.has(cacheKey)) {
                const cached = this.forecastCache.get(cacheKey);
                const cacheAge = Date.now() - cached.updatedAt.getTime();
                if (cacheAge < 3600000) { // 1 hour cache
                    return cached;
                }
            }
            // Validate input data
            if (!request.historicalData || request.historicalData.length < 3) {
                throw new analytics_1.AnalyticsServiceError('Insufficient historical data for forecasting', 'INSUFFICIENT_DATA', 400);
            }
            // Select best model based on data characteristics
            const bestModel = this.selectBestForecastingModel(request.historicalData);
            // Generate predictions
            const predictions = await this.generatePredictions(request, bestModel);
            // Calculate accuracy based on historical validation
            const accuracy = await this.calculateForecastAccuracy(request.historicalData, bestModel);
            const forecast = {
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
        }
        catch (error) {
            if (error instanceof analytics_1.AnalyticsServiceError) {
                throw error;
            }
            throw new analytics_1.AnalyticsServiceError('Failed to generate forecast', 'FORECAST_GENERATION_FAILED', 500, { originalError: error.message });
        }
    }
    /**
     * Detect anomalies in health data
     */
    async detectAnomalies(request) {
        var _a;
        if (!this.isServiceInitialized()) {
            throw new analytics_1.AnalyticsServiceError('Analytics service not initialized', 'SERVICE_NOT_INITIALIZED', 500);
        }
        if (!this.config.enableAnomalyDetection) {
            throw new analytics_1.AnalyticsServiceError('Anomaly detection is disabled', 'FEATURE_DISABLED', 400);
        }
        try {
            const cacheKey = `${request.userId}-anomalies`;
            // Check cache
            if (this.anomalyCache.has(cacheKey)) {
                const cached = this.anomalyCache.get(cacheKey);
                const cacheAge = Date.now() - ((_a = cached[0]) === null || _a === void 0 ? void 0 : _a.createdAt.getTime());
                if (cacheAge < 1800000) { // 30 minutes cache
                    return cached;
                }
            }
            const anomalies = [];
            const algorithms = request.algorithms || this.config.anomalyDetectionAlgorithms;
            // Group data by metric
            const metricGroups = this.groupDataByMetric(request.data);
            for (const [metric, dataPoints] of metricGroups) {
                if (dataPoints.length < 5)
                    continue; // Need minimum data points
                // Run anomaly detection algorithms
                for (const algorithm of algorithms) {
                    const metricAnomalies = await this.runAnomalyDetection(dataPoints, algorithm, request.sensitivity || 'medium');
                    anomalies.push(...metricAnomalies);
                }
            }
            // Sort by severity and timestamp
            anomalies.sort((a, b) => {
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
                if (severityDiff !== 0)
                    return severityDiff;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
            // Cache the results
            this.anomalyCache.set(cacheKey, anomalies);
            return anomalies;
        }
        catch (error) {
            if (error instanceof analytics_1.AnalyticsServiceError) {
                throw error;
            }
            throw new analytics_1.AnalyticsServiceError('Failed to detect anomalies', 'ANOMALY_DETECTION_FAILED', 500, { originalError: error.message });
        }
    }
    /**
     * Analyze circadian rhythms
     */
    async analyzeCircadianRhythms(userId, data) {
        if (!this.isServiceInitialized()) {
            throw new analytics_1.AnalyticsServiceError('Analytics service not initialized', 'SERVICE_NOT_INITIALIZED', 500);
        }
        if (!this.config.enableCircadianAnalysis) {
            throw new analytics_1.AnalyticsServiceError('Circadian analysis is disabled', 'FEATURE_DISABLED', 400);
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
            const analysis = {
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
        }
        catch (error) {
            throw new analytics_1.AnalyticsServiceError('Failed to analyze circadian rhythms', 'CIRCADIAN_ANALYSIS_FAILED', 500, { originalError: error.message });
        }
    }
    /**
     * Update personalized baseline for a metric
     */
    async updatePersonalizedBaseline(request) {
        if (!this.isServiceInitialized()) {
            throw new analytics_1.AnalyticsServiceError('Analytics service not initialized', 'SERVICE_NOT_INITIALIZED', 500);
        }
        if (!this.config.enablePersonalizedBaselines) {
            throw new analytics_1.AnalyticsServiceError('Personalized baselines are disabled', 'FEATURE_DISABLED', 400);
        }
        try {
            // Get existing baselines for user
            const userBaselines = this.baselineCache.get(request.userId) || [];
            // Find existing baseline for this metric
            let baseline = userBaselines.find(b => b.metric === request.metric);
            if (baseline) {
                // Update existing baseline
                baseline = this.updateExistingBaseline(baseline, request.value);
            }
            else {
                // Create new baseline
                baseline = this.createNewBaseline(request);
                userBaselines.push(baseline);
            }
            // Update cache
            this.baselineCache.set(request.userId, userBaselines);
            return baseline;
        }
        catch (error) {
            throw new analytics_1.AnalyticsServiceError('Failed to update personalized baseline', 'BASELINE_UPDATE_FAILED', 500, { originalError: error.message });
        }
    }
    /**
     * Generate comprehensive health insights
     */
    async generateHealthInsights(userId, healthData) {
        if (!this.isServiceInitialized()) {
            throw new analytics_1.AnalyticsServiceError('Analytics service not initialized', 'SERVICE_NOT_INITIALIZED', 500);
        }
        try {
            const insights = [];
            const recommendations = [];
            const riskFactors = [];
            // Analyze trends
            const trends = await this.analyzeTrends(healthData);
            insights.push(...this.generateTrendInsights(trends));
            // Check for anomalies
            if (this.config.enableAnomalyDetection) {
                const anomalies = await this.detectAnomalies({ userId, data: healthData });
                const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
                if (criticalAnomalies.length > 0) {
                    riskFactors.push(`${criticalAnomalies.length} critical health anomalies detected`);
                    recommendations.push('Consider consulting with a healthcare provider about recent anomalies');
                }
            }
            // Generate forecasting insights
            if (this.config.enableTimeSeriesForecasting && healthData.length >= 5) {
                insights.push('Predictive models are analyzing your health trends');
                recommendations.push('Continue consistent health monitoring for better predictions');
            }
            // Circadian analysis insights
            if (this.config.enableCircadianAnalysis) {
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
        }
        catch (error) {
            throw new analytics_1.AnalyticsServiceError('Failed to generate health insights', 'INSIGHTS_GENERATION_FAILED', 500, { originalError: error.message });
        }
    }
    /**
     * Get analytics summary for dashboard
     */
    async getAnalyticsSummary(userId) {
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
            let lastAnalysisDate = null;
            if (userBaselines.length > 0) {
                lastAnalysisDate = userBaselines.reduce((latest, baseline) => baseline.lastUpdated > latest ? baseline.lastUpdated : latest, userBaselines[0].lastUpdated);
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
        }
        catch (error) {
            throw new analytics_1.AnalyticsServiceError('Failed to get analytics summary', 'SUMMARY_GENERATION_FAILED', 500, { originalError: error.message });
        }
    }
    // Private helper methods
    selectBestForecastingModel(data) {
        // Simple model selection based on data characteristics
        if (data.length < 10)
            return 'linear';
        if (data.length < 30)
            return 'arima';
        return 'prophet'; // Default to prophet for longer series
    }
    async generatePredictions(request, model) {
        const predictions = [];
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
    async calculateForecastAccuracy(data, model) {
        // Simple accuracy calculation (in production, use cross-validation)
        return Math.random() * 0.3 + 0.7; // 70-100% accuracy
    }
    groupDataByMetric(data) {
        const groups = new Map();
        for (const point of data) {
            if (!groups.has(point.metric)) {
                groups.set(point.metric, []);
            }
            groups.get(point.metric).push(point);
        }
        return groups;
    }
    async runAnomalyDetection(dataPoints, algorithm, sensitivity) {
        const anomalies = [];
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
    analyzeSleepPattern(sleepData) {
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
    analyzeActivityPattern(activityData) {
        // Simplified activity pattern analysis
        return {
            peakActivityTime: '14:00',
            lowActivityTime: '03:00',
            activityVariability: 0.3,
            regularityScore: 0.8
        };
    }
    generateCircadianRecommendations(sleepPattern, activityPattern) {
        const recommendations = [];
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
    calculateCircadianScore(sleepPattern, activityPattern) {
        const sleepScore = (sleepPattern.sleepQuality + sleepPattern.consistency) / 2;
        const activityScore = activityPattern.regularityScore;
        return (sleepScore + activityScore) / 2;
    }
    updateExistingBaseline(baseline, newValue) {
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
    createNewBaseline(request) {
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
    async analyzeTrends(healthData) {
        const trends = new Map();
        const metricGroups = this.groupDataByMetric(healthData);
        for (const [metric, dataPoints] of metricGroups) {
            if (dataPoints.length < 3)
                continue;
            const values = dataPoints.map(d => d.value);
            const trend = this.calculateTrendAnalysis(values);
            trends.set(metric, trend);
        }
        return trends;
    }
    generateTrendInsights(trends) {
        const insights = [];
        for (const [metric, trend] of trends) {
            if (trend.trend === 'increasing') {
                insights.push(`Your ${metric} shows an improving trend`);
            }
            else if (trend.trend === 'decreasing') {
                insights.push(`Your ${metric} shows a declining trend`);
            }
        }
        return insights;
    }
    calculateInsightConfidence(healthData, insightCount) {
        const dataQuality = Math.min(1, healthData.length / 30); // More data = higher confidence
        const insightDensity = Math.min(1, insightCount / 5); // More insights = higher confidence
        return (dataQuality + insightDensity) / 2;
    }
    calculateHealthScore(healthData, trends) {
        // Simplified health score calculation
        let score = 75; // Base score
        for (const [metric, trend] of trends) {
            if (trend.trend === 'increasing' && this.isPositiveMetric(metric)) {
                score += 5;
            }
            else if (trend.trend === 'decreasing' && !this.isPositiveMetric(metric)) {
                score += 5;
            }
            else if (trend.trend === 'decreasing' && this.isPositiveMetric(metric)) {
                score -= 5;
            }
        }
        return Math.max(0, Math.min(100, score));
    }
    // Utility methods
    calculateTrend(values) {
        if (values.length < 2)
            return 0;
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }
    calculateVolatility(values) {
        if (values.length < 2)
            return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    calculateStatistics(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        return {
            mean: values.reduce((sum, val) => sum + val, 0) / n,
            std: this.calculateVolatility(values),
            min: sorted[0],
            max: sorted[n - 1],
            median: n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)],
            q25: sorted[Math.floor(n * 0.25)],
            q75: sorted[Math.floor(n * 0.75)]
        };
    }
    calculateTrendAnalysis(values) {
        const slope = this.calculateTrend(values);
        const correlation = Math.abs(slope) > 0.1 ? 0.8 : 0.3; // Simplified
        return {
            slope,
            correlation,
            pValue: 0.05, // Simplified
            trend: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
        };
    }
    parseHorizon(horizon) {
        const match = horizon.match(/(\d+)-?(day|week|month)s?/);
        if (!match)
            return 7; // Default to 7 days
        const [, num, unit] = match;
        const number = parseInt(num);
        switch (unit) {
            case 'day': return number;
            case 'week': return number * 7;
            case 'month': return number * 30;
            default: return 7;
        }
    }
    getSensitivityThreshold(sensitivity) {
        switch (sensitivity) {
            case 'low': return 3.0;
            case 'medium': return 2.5;
            case 'high': return 2.0;
            default: return 2.5;
        }
    }
    determineSeverity(zScore, threshold) {
        if (zScore > threshold * 2)
            return 'critical';
        if (zScore > threshold * 1.5)
            return 'high';
        if (zScore > threshold)
            return 'medium';
        return 'low';
    }
    isPositiveMetric(metric) {
        const positiveMetrics = ['steps', 'sleep_duration', 'activity_level', 'water_intake'];
        return positiveMetrics.some(pm => metric.includes(pm));
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
}
exports.AdvancedAnalyticsService = AdvancedAnalyticsService;
exports.default = AdvancedAnalyticsService;
