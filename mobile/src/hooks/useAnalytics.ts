import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  generateForecast,
  detectAnomalies,
  analyzeCircadianRhythms,
  generateHealthInsights,
  getAnalyticsSummary,
  updatePersonalizedBaseline,
  clearAnalyticsError,
  setAnalyticsInitialized,
  selectForecasts,
  selectAnomalies,
  selectCircadianAnalysis,
  selectPersonalizedBaselines,
  selectHealthInsights,
  selectAnalyticsSummary,
  selectIsAnalyticsInitialized,
  selectAnalyticsError,
  selectIsLoadingForecasts,
  selectIsLoadingAnomalies,
  selectIsLoadingInsights
} from '../store/slices/analyticsSlice';
import AdvancedAnalyticsService from '../services/analytics/advancedAnalytics';
import type { RootState } from '../store/types';

/**
 * Custom hook for analytics functionality
 */
export const useAnalytics = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const forecasts = useAppSelector(selectForecasts);
  const anomalies = useAppSelector(selectAnomalies);
  const circadianAnalysis = useAppSelector(selectCircadianAnalysis);
  const personalizedBaselines = useAppSelector(selectPersonalizedBaselines);
  const healthInsights = useAppSelector(selectHealthInsights);
  const analyticsSummary = useAppSelector(selectAnalyticsSummary);
  const isInitialized = useAppSelector(selectIsAnalyticsInitialized);
  const error = useAppSelector(selectAnalyticsError);
  const isLoadingForecasts = useAppSelector(selectIsLoadingForecasts);
  const isLoadingAnomalies = useAppSelector(selectIsLoadingAnomalies);
  const isLoadingInsights = useAppSelector(selectIsLoadingInsights);

  // Check if analytics service is initialized
  useEffect(() => {
    const serviceInitialized = AdvancedAnalyticsService.isServiceInitialized();
    if (serviceInitialized !== isInitialized) {
      dispatch(setAnalyticsInitialized(serviceInitialized));
    }
  }, [dispatch, isInitialized]);

  // Actions
  const createForecast = useCallback(
    (userId: string, metric: string, horizon: string = '7-days') => {
      return dispatch(generateForecast({ userId, metric, horizon }));
    },
    [dispatch]
  );

  const findAnomalies = useCallback(
    (userId: string, data: any[]) => {
      return dispatch(detectAnomalies({ userId, data }));
    },
    [dispatch]
  );

  const analyzeCircadian = useCallback(
    (userId: string, data: any[]) => {
      return dispatch(analyzeCircadianRhythms({ userId, data }));
    },
    [dispatch]
  );

  const getInsights = useCallback(
    (userId: string, healthData: any[]) => {
      return dispatch(generateHealthInsights({ userId, healthData }));
    },
    [dispatch]
  );

  const getSummary = useCallback(
    (userId: string) => {
      return dispatch(getAnalyticsSummary({ userId }));
    },
    [dispatch]
  );

  const updateBaseline = useCallback(
    (userId: string, metric: string, value: number) => {
      return dispatch(updatePersonalizedBaseline({ userId, metric, value }));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearAnalyticsError());
  }, [dispatch]);

  return {
    // State
    forecasts,
    anomalies,
    circadianAnalysis,
    personalizedBaselines,
    healthInsights,
    analyticsSummary,
    isInitialized,
    error,
    isLoadingForecasts,
    isLoadingAnomalies,
    isLoadingInsights,
    
    // Actions
    createForecast,
    findAnomalies,
    analyzeCircadian,
    getInsights,
    getSummary,
    updateBaseline,
    clearError
  };
};

/**
 * Hook for health insights specifically
 */
export const useHealthInsights = (userId: string, healthData: any[] = []) => {
  const { healthInsights, isLoadingInsights, getInsights, error } = useAnalytics();

  const refreshInsights = useCallback(() => {
    if (userId && healthData.length > 0) {
      getInsights(userId, healthData);
    }
  }, [userId, healthData, getInsights]);

  useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);

  return {
    insights: healthInsights.insights,
    recommendations: healthInsights.recommendations,
    riskFactors: healthInsights.riskFactors,
    isLoading: isLoadingInsights,
    error,
    refresh: refreshInsights
  };
};

/**
 * Hook for anomaly detection
 */
export const useAnomalyDetection = (userId: string) => {
  const { anomalies, isLoadingAnomalies, findAnomalies, error } = useAnalytics();

  const detectAnomaliesInData = useCallback(
    (data: any[]) => {
      if (userId && data.length > 0) {
        return findAnomalies(userId, data);
      }
    },
    [userId, findAnomalies]
  );

  // Get critical anomalies
  const criticalAnomalies = anomalies.filter(anomaly => anomaly.severity === 'critical');
  const highAnomalies = anomalies.filter(anomaly => anomaly.severity === 'high');

  return {
    anomalies,
    criticalAnomalies,
    highAnomalies,
    isLoading: isLoadingAnomalies,
    error,
    detectAnomalies: detectAnomaliesInData
  };
};

/**
 * Hook for forecasting
 */
export const useForecasting = (userId: string) => {
  const { forecasts, isLoadingForecasts, createForecast, error } = useAnalytics();

  const generateForecastForMetric = useCallback(
    (metric: string, horizon: string = '7-days') => {
      if (userId) {
        return createForecast(userId, metric, horizon);
      }
    },
    [userId, createForecast]
  );

  // Get forecast by metric
  const getForecastByMetric = useCallback(
    (metric: string) => {
      return forecasts.find(forecast => forecast.metric === metric);
    },
    [forecasts]
  );

  return {
    forecasts,
    isLoading: isLoadingForecasts,
    error,
    generateForecast: generateForecastForMetric,
    getForecastByMetric
  };
};

/**
 * Hook for personalized baselines
 */
export const usePersonalizedBaselines = (userId: string) => {
  const { personalizedBaselines, updateBaseline } = useAnalytics();

  const getBaselineForMetric = useCallback(
    (metric: string) => {
      return personalizedBaselines.find(baseline => 
        baseline.userId === userId && baseline.metric === metric
      );
    },
    [personalizedBaselines, userId]
  );

  const updateBaselineForMetric = useCallback(
    (metric: string, value: number) => {
      if (userId) {
        return updateBaseline(userId, metric, value);
      }
    },
    [userId, updateBaseline]
  );

  return {
    baselines: personalizedBaselines.filter(baseline => baseline.userId === userId),
    getBaselineForMetric,
    updateBaseline: updateBaselineForMetric
  };
};

/**
 * Hook for analytics summary dashboard
 */
export const useAnalyticsSummary = (userId: string) => {
  const { analyticsSummary, getSummary, isInitialized } = useAnalytics();

  const refreshSummary = useCallback(() => {
    if (userId && isInitialized) {
      getSummary(userId);
    }
  }, [userId, isInitialized, getSummary]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  return {
    summary: analyticsSummary,
    refresh: refreshSummary
  };
};

export default useAnalytics;
