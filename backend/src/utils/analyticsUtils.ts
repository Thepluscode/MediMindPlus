/**
 * Analytics Utilities for MediMind Backend
 * Helper functions for data processing, statistical calculations, and analytics operations
 */

import { HealthDataPoint, StatisticalResult, TrendAnalysis } from '../types/analytics';

/**
 * Statistical calculation utilities
 */
export class StatisticsUtils {
  /**
   * Calculate basic statistics for a dataset
   */
  static calculateBasicStats(values: number[]): StatisticalResult {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Values must be a non-empty array');
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    // Calculate variance and standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    // Calculate quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const medianIndex = Math.floor(n * 0.5);

    return {
      mean,
      std,
      min: sorted[0],
      max: sorted[n - 1],
      median: n % 2 === 0 ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2 : sorted[medianIndex],
      q25: sorted[q1Index],
      q75: sorted[q3Index]
    };
  }

  /**
   * Calculate z-scores for anomaly detection
   */
  static calculateZScores(values: number[]): number[] {
    const stats = this.calculateBasicStats(values);
    return values.map(value => Math.abs((value - stats.mean) / stats.std));
  }

  /**
   * Calculate moving average
   */
  static calculateMovingAverage(values: number[], windowSize: number): number[] {
    if (windowSize <= 0 || windowSize > values.length) {
      throw new Error('Invalid window size');
    }

    const result: number[] = [];
    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
      result.push(average);
    }

    return result;
  }

  /**
   * Calculate exponential moving average
   */
  static calculateExponentialMovingAverage(values: number[], alpha: number = 0.3): number[] {
    if (alpha <= 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 and 1');
    }

    const result: number[] = [values[0]];
    for (let i = 1; i < values.length; i++) {
      const ema = alpha * values[i] + (1 - alpha) * result[i - 1];
      result.push(ema);
    }

    return result;
  }

  /**
   * Calculate correlation coefficient between two datasets
   */
  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Arrays must have the same non-zero length');
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Perform linear regression
   */
  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Arrays must have the same non-zero length');
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);

    const r2 = 1 - (residualSumSquares / totalSumSquares);

    return { slope, intercept, r2 };
  }
}

/**
 * Time series analysis utilities
 */
export class TimeSeriesUtils {
  /**
   * Detect trend in time series data
   */
  static detectTrend(values: number[]): TrendAnalysis {
    if (values.length < 3) {
      return {
        slope: 0,
        correlation: 0,
        pValue: 1,
        trend: 'stable'
      };
    }

    const x = Array.from({ length: values.length }, (_, i) => i);
    const regression = StatisticsUtils.linearRegression(x, values);
    const correlation = StatisticsUtils.calculateCorrelation(x, values);

    // Simple p-value estimation (in production, use proper statistical tests)
    const pValue = Math.abs(correlation) > 0.5 ? 0.01 : 0.1;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (regression.slope > 0.1 && pValue < 0.05) {
      trend = 'increasing';
    } else if (regression.slope < -0.1 && pValue < 0.05) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      slope: regression.slope,
      correlation,
      pValue,
      trend
    };
  }

  /**
   * Detect seasonality in time series data
   */
  static detectSeasonality(values: number[], period: number = 7): { hasSeasonality: boolean; strength: number } {
    if (values.length < period * 2) {
      return { hasSeasonality: false, strength: 0 };
    }

    // Calculate autocorrelation at the seasonal lag
    const lag = period;
    const n = values.length - lag;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    const autocorrelation = denominator === 0 ? 0 : numerator / denominator;
    const hasSeasonality = Math.abs(autocorrelation) > 0.3;

    return {
      hasSeasonality,
      strength: Math.abs(autocorrelation)
    };
  }

  /**
   * Remove outliers using IQR method
   */
  static removeOutliers(values: number[], multiplier: number = 1.5): { cleaned: number[]; outliers: number[] } {
    const stats = StatisticsUtils.calculateBasicStats(values);
    const iqr = stats.q75 - stats.q25;
    const lowerBound = stats.q25 - multiplier * iqr;
    const upperBound = stats.q75 + multiplier * iqr;

    const cleaned: number[] = [];
    const outliers: number[] = [];

    values.forEach(value => {
      if (value >= lowerBound && value <= upperBound) {
        cleaned.push(value);
      } else {
        outliers.push(value);
      }
    });

    return { cleaned, outliers };
  }

  /**
   * Interpolate missing values
   */
  static interpolateMissingValues(values: (number | null)[]): number[] {
    const result = [...values];

    for (let i = 0; i < result.length; i++) {
      if (result[i] === null) {
        // Find previous and next non-null values
        let prevIndex = i - 1;
        let nextIndex = i + 1;

        while (prevIndex >= 0 && result[prevIndex] === null) prevIndex--;
        while (nextIndex < result.length && result[nextIndex] === null) nextIndex++;

        if (prevIndex >= 0 && nextIndex < result.length) {
          // Linear interpolation
          const prevValue = result[prevIndex] as number;
          const nextValue = result[nextIndex] as number;
          const ratio = (i - prevIndex) / (nextIndex - prevIndex);
          result[i] = prevValue + ratio * (nextValue - prevValue);
        } else if (prevIndex >= 0) {
          // Use previous value
          result[i] = result[prevIndex] as number;
        } else if (nextIndex < result.length) {
          // Use next value
          result[i] = result[nextIndex] as number;
        } else {
          // Default to 0 if no valid values found
          result[i] = 0;
        }
      }
    }

    return result as number[];
  }
}

/**
 * Data processing utilities
 */
export class DataProcessingUtils {
  /**
   * Group health data points by metric
   */
  static groupByMetric(dataPoints: HealthDataPoint[]): Map<string, HealthDataPoint[]> {
    const groups = new Map<string, HealthDataPoint[]>();

    dataPoints.forEach(point => {
      if (!groups.has(point.metric)) {
        groups.set(point.metric, []);
      }
      groups.get(point.metric)!.push(point);
    });

    // Sort each group by timestamp
    groups.forEach(points => {
      points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });

    return groups;
  }

  /**
   * Resample time series data to regular intervals
   */
  static resampleData(
    dataPoints: HealthDataPoint[],
    intervalMinutes: number = 60
  ): HealthDataPoint[] {
    if (dataPoints.length === 0) return [];

    // Sort by timestamp
    const sorted = [...dataPoints].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const result: HealthDataPoint[] = [];
    const intervalMs = intervalMinutes * 60 * 1000;
    
    const startTime = new Date(sorted[0].timestamp).getTime();
    const endTime = new Date(sorted[sorted.length - 1].timestamp).getTime();

    for (let time = startTime; time <= endTime; time += intervalMs) {
      const windowStart = time - intervalMs / 2;
      const windowEnd = time + intervalMs / 2;

      const pointsInWindow = sorted.filter(point => {
        const pointTime = new Date(point.timestamp).getTime();
        return pointTime >= windowStart && pointTime < windowEnd;
      });

      if (pointsInWindow.length > 0) {
        // Calculate average value for points in this window
        const avgValue = pointsInWindow.reduce((sum, point) => sum + point.value, 0) / pointsInWindow.length;
        
        result.push({
          ...pointsInWindow[0], // Use first point as template
          timestamp: new Date(time).toISOString(),
          value: avgValue
        });
      }
    }

    return result;
  }

  /**
   * Normalize data to 0-1 range
   */
  static normalizeData(values: number[]): number[] {
    const stats = StatisticsUtils.calculateBasicStats(values);
    const range = stats.max - stats.min;
    
    if (range === 0) return values.map(() => 0.5);
    
    return values.map(value => (value - stats.min) / range);
  }

  /**
   * Standardize data (z-score normalization)
   */
  static standardizeData(values: number[]): number[] {
    const stats = StatisticsUtils.calculateBasicStats(values);
    
    if (stats.std === 0) return values.map(() => 0);
    
    return values.map(value => (value - stats.mean) / stats.std);
  }

  /**
   * Calculate data quality score
   */
  static calculateDataQuality(dataPoints: HealthDataPoint[]): {
    completeness: number;
    consistency: number;
    accuracy: number;
    overall: number;
  } {
    if (dataPoints.length === 0) {
      return { completeness: 0, consistency: 0, accuracy: 0, overall: 0 };
    }

    // Completeness: ratio of non-null values
    const nonNullCount = dataPoints.filter(point => 
      point.value !== null && point.value !== undefined && !isNaN(point.value)
    ).length;
    const completeness = nonNullCount / dataPoints.length;

    // Consistency: check for reasonable value ranges
    const values = dataPoints.map(point => point.value).filter(val => !isNaN(val));
    const stats = StatisticsUtils.calculateBasicStats(values);
    const { outliers } = TimeSeriesUtils.removeOutliers(values);
    const consistency = 1 - (outliers.length / values.length);

    // Accuracy: simplified check for reasonable values (domain-specific)
    const accuracyScore = this.calculateAccuracyScore(dataPoints);

    // Overall score
    const overall = (completeness + consistency + accuracyScore) / 3;

    return {
      completeness,
      consistency,
      accuracy: accuracyScore,
      overall
    };
  }

  private static calculateAccuracyScore(dataPoints: HealthDataPoint[]): number {
    // Domain-specific accuracy checks
    let validCount = 0;
    let totalCount = 0;

    dataPoints.forEach(point => {
      totalCount++;
      
      // Check if values are within reasonable ranges for common metrics
      switch (point.metric.toLowerCase()) {
        case 'heart_rate':
          if (point.value >= 30 && point.value <= 220) validCount++;
          break;
        case 'blood_pressure_systolic':
          if (point.value >= 70 && point.value <= 250) validCount++;
          break;
        case 'blood_pressure_diastolic':
          if (point.value >= 40 && point.value <= 150) validCount++;
          break;
        case 'temperature':
          if (point.value >= 35 && point.value <= 42) validCount++;
          break;
        case 'steps':
          if (point.value >= 0 && point.value <= 50000) validCount++;
          break;
        case 'sleep_duration':
          if (point.value >= 0 && point.value <= 24) validCount++;
          break;
        default:
          // For unknown metrics, assume valid if it's a reasonable number
          if (point.value >= -1000 && point.value <= 1000000) validCount++;
          break;
      }
    });

    return totalCount > 0 ? validCount / totalCount : 0;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate health data point
   */
  static validateHealthDataPoint(point: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!point.userId || typeof point.userId !== 'string') {
      errors.push('userId is required and must be a string');
    }

    if (!point.timestamp || !this.isValidTimestamp(point.timestamp)) {
      errors.push('timestamp is required and must be a valid ISO 8601 date');
    }

    if (!point.metric || typeof point.metric !== 'string') {
      errors.push('metric is required and must be a string');
    }

    if (typeof point.value !== 'number' || isNaN(point.value)) {
      errors.push('value is required and must be a valid number');
    }

    if (!point.unit || typeof point.unit !== 'string') {
      errors.push('unit is required and must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate timestamp format
   */
  static isValidTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  }

  /**
   * Validate forecast horizon format
   */
  static isValidHorizon(horizon: string): boolean {
    return /^\d+-(day|week|month)s?$/.test(horizon);
  }

  /**
   * Sanitize metric name
   */
  static sanitizeMetricName(metric: string): string {
    return metric
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

// Export all utilities
export {
  StatisticsUtils,
  TimeSeriesUtils,
  DataProcessingUtils,
  ValidationUtils
};
