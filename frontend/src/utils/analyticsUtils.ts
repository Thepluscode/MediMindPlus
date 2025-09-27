import moment from 'moment';
import type {
  TimeSeriesForecast,
  AnomalyDetection,
  CircadianAnalysis,
  PersonalizedBaseline
} from '../services/analytics/advancedAnalytics';
import type { HealthDataPoint, VitalSigns } from '../types/models/health';

/**
 * Utility functions for analytics data processing
 */

/**
 * Format forecast data for chart display
 */
export const formatForecastForChart = (forecast: TimeSeriesForecast) => {
  return {
    labels: forecast.predictions.map(p => 
      moment(p.timestamp).format('MMM DD')
    ),
    datasets: [
      {
        data: forecast.predictions.map(p => p.value),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
        label: 'Predicted Values'
      },
      {
        data: forecast.predictions.map(p => p.upperBound),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity * 0.3})`,
        strokeWidth: 1,
        withDots: false,
        label: 'Upper Bound'
      },
      {
        data: forecast.predictions.map(p => p.lowerBound),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity * 0.3})`,
        strokeWidth: 1,
        withDots: false,
        label: 'Lower Bound'
      }
    ]
  };
};

/**
 * Get anomaly severity color
 */
export const getAnomalySeverityColor = (severity: AnomalyDetection['severity']): string => {
  switch (severity) {
    case 'critical':
      return '#F44336'; // Red
    case 'high':
      return '#FF9800'; // Orange
    case 'medium':
      return '#FFC107'; // Amber
    case 'low':
      return '#4CAF50'; // Green
    default:
      return '#9E9E9E'; // Grey
  }
};

/**
 * Get anomaly severity icon
 */
export const getAnomalySeverityIcon = (severity: AnomalyDetection['severity']): string => {
  switch (severity) {
    case 'critical':
      return 'alert-circle';
    case 'high':
      return 'alert-triangle';
    case 'medium':
      return 'alert';
    case 'low':
      return 'info';
    default:
      return 'help-circle';
  }
};

/**
 * Format anomalies for display
 */
export const formatAnomaliesForDisplay = (anomalies: AnomalyDetection[]) => {
  return anomalies.map(anomaly => ({
    ...anomaly,
    color: getAnomalySeverityColor(anomaly.severity),
    icon: getAnomalySeverityIcon(anomaly.severity),
    formattedTimestamp: moment(anomaly.timestamp).format('MMM DD, YYYY HH:mm'),
    scorePercentage: Math.round(anomaly.anomalyScore * 100)
  }));
};

/**
 * Calculate health score based on baselines and current values
 */
export const calculateHealthScore = (
  baselines: PersonalizedBaseline[],
  currentValues: { [metric: string]: number }
): number => {
  if (baselines.length === 0) return 0;

  let totalScore = 0;
  let validBaselines = 0;

  baselines.forEach(baseline => {
    const currentValue = currentValues[baseline.metric];
    if (currentValue !== undefined) {
      const { min, max } = baseline.normalRange;
      let score = 100;

      if (currentValue < min) {
        score = Math.max(0, 100 - ((min - currentValue) / min) * 100);
      } else if (currentValue > max) {
        score = Math.max(0, 100 - ((currentValue - max) / max) * 100);
      }

      totalScore += score * baseline.confidence;
      validBaselines++;
    }
  });

  return validBaselines > 0 ? totalScore / validBaselines : 0;
};

/**
 * Get circadian rhythm insights
 */
export const getCircadianInsights = (analysis: CircadianAnalysis) => {
  const insights = [];
  const { sleepPattern, activityPattern } = analysis;

  // Sleep insights
  if (sleepPattern.sleepDuration < 7) {
    insights.push({
      type: 'warning',
      message: 'Your sleep duration is below the recommended 7-9 hours',
      recommendation: 'Try to establish an earlier bedtime routine'
    });
  } else if (sleepPattern.sleepDuration > 9) {
    insights.push({
      type: 'info',
      message: 'You\'re getting plenty of sleep',
      recommendation: 'Maintain your current sleep schedule'
    });
  }

  // Sleep quality insights
  if (sleepPattern.sleepQuality < 0.7) {
    insights.push({
      type: 'warning',
      message: 'Your sleep quality could be improved',
      recommendation: 'Consider reducing screen time before bed and optimizing your sleep environment'
    });
  }

  // Activity pattern insights
  if (activityPattern.activityVariability > 0.5) {
    insights.push({
      type: 'info',
      message: 'Your activity patterns show high variability',
      recommendation: 'Try to establish more consistent daily routines'
    });
  }

  return insights;
};

/**
 * Convert health data to analytics format
 */
export const convertHealthDataForAnalytics = (
  vitalSigns: VitalSigns[],
  healthDataPoints: HealthDataPoint[]
): any[] => {
  const analyticsData = [];

  // Convert vital signs
  vitalSigns.forEach(vital => {
    analyticsData.push({
      timestamp: vital.timestamp,
      metric: vital.type,
      value: vital.value,
      unit: vital.unit
    });
  });

  // Convert health data points
  healthDataPoints.forEach(point => {
    analyticsData.push({
      timestamp: point.timestamp,
      metric: point.type,
      value: point.value,
      unit: point.unit
    });
  });

  return analyticsData.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

/**
 * Get trend direction for a metric
 */
export const getTrendDirection = (values: number[]): 'up' | 'down' | 'stable' => {
  if (values.length < 2) return 'stable';

  const recent = values.slice(-3); // Last 3 values
  const older = values.slice(-6, -3); // Previous 3 values

  if (recent.length === 0 || older.length === 0) return 'stable';

  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

  const threshold = 0.05; // 5% threshold
  const percentChange = (recentAvg - olderAvg) / olderAvg;

  if (percentChange > threshold) return 'up';
  if (percentChange < -threshold) return 'down';
  return 'stable';
};

/**
 * Get trend icon based on direction
 */
export const getTrendIcon = (direction: 'up' | 'down' | 'stable'): string => {
  switch (direction) {
    case 'up':
      return 'trending-up';
    case 'down':
      return 'trending-down';
    case 'stable':
      return 'minus';
    default:
      return 'minus';
  }
};

/**
 * Get trend color based on direction and metric type
 */
export const getTrendColor = (
  direction: 'up' | 'down' | 'stable',
  metricType: string
): string => {
  // For some metrics, up is good, for others, down is good
  const upIsGood = ['steps', 'sleep_duration', 'water_intake', 'exercise_minutes'];
  const downIsGood = ['stress_level', 'blood_pressure', 'resting_heart_rate'];

  if (direction === 'stable') return '#9E9E9E'; // Grey

  if (upIsGood.includes(metricType)) {
    return direction === 'up' ? '#4CAF50' : '#F44336'; // Green for up, red for down
  }

  if (downIsGood.includes(metricType)) {
    return direction === 'down' ? '#4CAF50' : '#F44336'; // Green for down, red for up
  }

  // Default: neutral colors
  return direction === 'up' ? '#2196F3' : '#FF9800'; // Blue for up, orange for down
};

/**
 * Calculate confidence interval for predictions
 */
export const calculateConfidenceInterval = (
  values: number[],
  confidence: number = 0.95
): { lower: number; upper: number } => {
  if (values.length === 0) return { lower: 0, upper: 0 };

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Z-score for 95% confidence interval
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.64;
  const margin = zScore * stdDev / Math.sqrt(values.length);

  return {
    lower: mean - margin,
    upper: mean + margin
  };
};

/**
 * Format analytics summary for display
 */
export const formatAnalyticsSummary = (summary: {
  totalForecasts: number;
  activeAnomalies: number;
  personalizedBaselines: number;
  lastAnalysisDate: string | null;
}) => {
  return {
    ...summary,
    lastAnalysisFormatted: summary.lastAnalysisDate 
      ? moment(summary.lastAnalysisDate).fromNow()
      : 'Never',
    hasRecentAnalysis: summary.lastAnalysisDate 
      ? moment().diff(moment(summary.lastAnalysisDate), 'hours') < 24
      : false
  };
};

/**
 * Validate health data for analytics processing
 */
export const validateHealthDataForAnalytics = (data: any[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;

  return data.every(item => 
    item &&
    typeof item.timestamp === 'string' &&
    typeof item.metric === 'string' &&
    typeof item.value === 'number' &&
    !isNaN(item.value)
  );
};

export default {
  formatForecastForChart,
  getAnomalySeverityColor,
  getAnomalySeverityIcon,
  formatAnomaliesForDisplay,
  calculateHealthScore,
  getCircadianInsights,
  convertHealthDataForAnalytics,
  getTrendDirection,
  getTrendIcon,
  getTrendColor,
  calculateConfidenceInterval,
  formatAnalyticsSummary,
  validateHealthDataForAnalytics
};
