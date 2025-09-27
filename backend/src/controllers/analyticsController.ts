/**
 * Analytics Controller for MediMind Backend
 * Handles HTTP requests for analytics services
 */

import { Request, Response, NextFunction } from 'express';
import {
  AnalyticsResponse,
  ForecastRequest,
  AnomalyDetectionRequest,
  BaselineUpdateRequest,
  HealthDataPoint,
  AnalyticsServiceError,
  PaginationParams,
  PaginatedResponse
} from '../types/analytics';

import AdvancedAnalyticsService from '../services/AdvancedAnalyticsService';

// Initialize analytics service
const analyticsService = new AdvancedAnalyticsService();

// Request interfaces
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface ForecastRequestBody {
  metric: string;
  horizon: string;
  historicalData: HealthDataPoint[];
}

interface AnomalyDetectionRequestBody {
  data: HealthDataPoint[];
  algorithms?: string[];
  sensitivity?: 'low' | 'medium' | 'high';
}

interface BaselineUpdateRequestBody {
  metric: string;
  value: number;
  timestamp?: string;
}

export class AnalyticsController {
  /**
   * Generate time series forecast
   */
  static async generateForecast(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const { metric, horizon, historicalData }: ForecastRequestBody = req.body;

      // Validate request
      if (!metric || !horizon || !historicalData) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: metric, horizon, historicalData',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const startTime = Date.now();

      const forecastRequest: ForecastRequest = {
        userId,
        metric,
        horizon,
        historicalData
      };

      const forecast = await analyticsService.generateForecast(forecastRequest);
      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: forecast,
        timestamp: new Date(),
        processingTime
      } as AnalyticsResponse);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Detect anomalies in health data
   */
  static async detectAnomalies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const { data, algorithms, sensitivity }: AnomalyDetectionRequestBody = req.body;

      // Validate request
      if (!data || !Array.isArray(data) || data.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid or missing health data',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const startTime = Date.now();

      const anomalyRequest: AnomalyDetectionRequest = {
        userId,
        data,
        algorithms,
        sensitivity
      };

      const anomalies = await analyticsService.detectAnomalies(anomalyRequest);
      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: anomalies,
        timestamp: new Date(),
        processingTime
      } as AnalyticsResponse);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze circadian rhythms
   */
  static async analyzeCircadianRhythms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const { data }: { data: HealthDataPoint[] } = req.body;

      // Validate request
      if (!data || !Array.isArray(data) || data.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid or missing health data',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const startTime = Date.now();
      const analysis = await analyticsService.analyzeCircadianRhythms(userId, data);
      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: analysis,
        timestamp: new Date(),
        processingTime
      } as AnalyticsResponse);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update personalized baseline
   */
  static async updateBaseline(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const { metric, value, timestamp }: BaselineUpdateRequestBody = req.body;

      // Validate request
      if (!metric || typeof value !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: metric, value',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const startTime = Date.now();

      const baselineRequest: BaselineUpdateRequest = {
        userId,
        metric,
        value,
        timestamp: timestamp ? new Date(timestamp) : undefined
      };

      const baseline = await analyticsService.updatePersonalizedBaseline(baselineRequest);
      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: baseline,
        timestamp: new Date(),
        processingTime
      } as AnalyticsResponse);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate health insights
   */
  static async generateHealthInsights(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const { healthData }: { healthData: HealthDataPoint[] } = req.body;

      // Validate request
      if (!healthData || !Array.isArray(healthData)) {
        res.status(400).json({
          success: false,
          error: 'Invalid or missing health data',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const startTime = Date.now();
      const insights = await analyticsService.generateHealthInsights(userId, healthData);
      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: insights,
        timestamp: new Date(),
        processingTime
      } as AnalyticsResponse);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get analytics summary
   */
  static async getAnalyticsSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      const startTime = Date.now();
      const summary = await analyticsService.getAnalyticsSummary(userId);
      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date(),
        processingTime
      } as AnalyticsResponse);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get service status
   */
  static async getServiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isInitialized = analyticsService.isServiceInitialized();
      
      res.status(200).json({
        success: true,
        data: {
          isInitialized,
          version: '1.0.0',
          uptime: process.uptime(),
          timestamp: new Date()
        },
        timestamp: new Date()
      } as AnalyticsResponse);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Initialize analytics service
   */
  static async initializeService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = req.body;

      if (!config) {
        res.status(400).json({
          success: false,
          error: 'Analytics configuration is required',
          timestamp: new Date()
        } as AnalyticsResponse);
        return;
      }

      await analyticsService.initialize(config);

      res.status(200).json({
        success: true,
        data: { message: 'Analytics service initialized successfully' },
        timestamp: new Date()
      } as AnalyticsResponse);

    } catch (error) {
      next(error);
    }
  }
}

/**
 * Error handling middleware for analytics
 */
export const analyticsErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Analytics Error:', error);

  if (error instanceof AnalyticsServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date()
    } as AnalyticsResponse);
    return;
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date()
  } as AnalyticsResponse);
};

export default AnalyticsController;
