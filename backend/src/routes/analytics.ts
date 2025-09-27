/**
 * Analytics Routes for MediMind Backend
 * Defines API endpoints for analytics services
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import { AnalyticsController, analyticsErrorHandler } from '../controllers/analyticsController';

const router = Router();

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date()
    });
  }
  next();
};

// Authentication middleware (placeholder - implement based on your auth system)
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement actual authentication logic
  // For now, we'll add a mock user
  (req as any).user = {
    id: req.headers['user-id'] || 'demo-user',
    email: 'demo@example.com',
    role: 'user'
  };
  next();
};

// Rate limiting middleware (placeholder)
const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement rate limiting
  next();
};

/**
 * @route POST /api/analytics/forecast
 * @desc Generate time series forecast for health metrics
 * @access Private
 */
router.post('/forecast',
  requireAuth,
  rateLimit,
  [
    body('metric')
      .notEmpty()
      .withMessage('Metric is required')
      .isString()
      .withMessage('Metric must be a string'),
    body('horizon')
      .notEmpty()
      .withMessage('Horizon is required')
      .matches(/^\d+-(day|week|month)s?$/)
      .withMessage('Horizon must be in format: "7-days", "2-weeks", "1-month"'),
    body('historicalData')
      .isArray({ min: 3 })
      .withMessage('Historical data must be an array with at least 3 data points'),
    body('historicalData.*.userId')
      .notEmpty()
      .withMessage('Each data point must have a userId'),
    body('historicalData.*.timestamp')
      .isISO8601()
      .withMessage('Each data point must have a valid timestamp'),
    body('historicalData.*.metric')
      .notEmpty()
      .withMessage('Each data point must have a metric'),
    body('historicalData.*.value')
      .isNumeric()
      .withMessage('Each data point must have a numeric value'),
    body('historicalData.*.unit')
      .notEmpty()
      .withMessage('Each data point must have a unit')
  ],
  validateRequest,
  AnalyticsController.generateForecast
);

/**
 * @route POST /api/analytics/anomalies
 * @desc Detect anomalies in health data
 * @access Private
 */
router.post('/anomalies',
  requireAuth,
  rateLimit,
  [
    body('data')
      .isArray({ min: 5 })
      .withMessage('Data must be an array with at least 5 data points'),
    body('data.*.userId')
      .notEmpty()
      .withMessage('Each data point must have a userId'),
    body('data.*.timestamp')
      .isISO8601()
      .withMessage('Each data point must have a valid timestamp'),
    body('data.*.metric')
      .notEmpty()
      .withMessage('Each data point must have a metric'),
    body('data.*.value')
      .isNumeric()
      .withMessage('Each data point must have a numeric value'),
    body('algorithms')
      .optional()
      .isArray()
      .withMessage('Algorithms must be an array'),
    body('sensitivity')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Sensitivity must be low, medium, or high')
  ],
  validateRequest,
  AnalyticsController.detectAnomalies
);

/**
 * @route POST /api/analytics/circadian
 * @desc Analyze circadian rhythms
 * @access Private
 */
router.post('/circadian',
  requireAuth,
  rateLimit,
  [
    body('data')
      .isArray({ min: 1 })
      .withMessage('Data must be an array with at least 1 data point'),
    body('data.*.userId')
      .notEmpty()
      .withMessage('Each data point must have a userId'),
    body('data.*.timestamp')
      .isISO8601()
      .withMessage('Each data point must have a valid timestamp'),
    body('data.*.metric')
      .notEmpty()
      .withMessage('Each data point must have a metric'),
    body('data.*.value')
      .isNumeric()
      .withMessage('Each data point must have a numeric value')
  ],
  validateRequest,
  AnalyticsController.analyzeCircadianRhythms
);

/**
 * @route POST /api/analytics/baseline
 * @desc Update personalized baseline for a metric
 * @access Private
 */
router.post('/baseline',
  requireAuth,
  rateLimit,
  [
    body('metric')
      .notEmpty()
      .withMessage('Metric is required')
      .isString()
      .withMessage('Metric must be a string'),
    body('value')
      .isNumeric()
      .withMessage('Value must be a number'),
    body('timestamp')
      .optional()
      .isISO8601()
      .withMessage('Timestamp must be a valid ISO 8601 date')
  ],
  validateRequest,
  AnalyticsController.updateBaseline
);

/**
 * @route POST /api/analytics/insights
 * @desc Generate comprehensive health insights
 * @access Private
 */
router.post('/insights',
  requireAuth,
  rateLimit,
  [
    body('healthData')
      .isArray({ min: 1 })
      .withMessage('Health data must be an array with at least 1 data point'),
    body('healthData.*.userId')
      .notEmpty()
      .withMessage('Each data point must have a userId'),
    body('healthData.*.timestamp')
      .isISO8601()
      .withMessage('Each data point must have a valid timestamp'),
    body('healthData.*.metric')
      .notEmpty()
      .withMessage('Each data point must have a metric'),
    body('healthData.*.value')
      .isNumeric()
      .withMessage('Each data point must have a numeric value')
  ],
  validateRequest,
  AnalyticsController.generateHealthInsights
);

/**
 * @route GET /api/analytics/summary
 * @desc Get analytics summary for dashboard
 * @access Private
 */
router.get('/summary',
  requireAuth,
  rateLimit,
  AnalyticsController.getAnalyticsSummary
);

/**
 * @route GET /api/analytics/status
 * @desc Get analytics service status
 * @access Public
 */
router.get('/status',
  rateLimit,
  AnalyticsController.getServiceStatus
);

/**
 * @route POST /api/analytics/initialize
 * @desc Initialize analytics service with configuration
 * @access Admin only
 */
router.post('/initialize',
  requireAuth,
  rateLimit,
  [
    body('enableTimeSeriesForecasting')
      .isBoolean()
      .withMessage('enableTimeSeriesForecasting must be a boolean'),
    body('forecastingModels')
      .isArray()
      .withMessage('forecastingModels must be an array'),
    body('enableAnomalyDetection')
      .isBoolean()
      .withMessage('enableAnomalyDetection must be a boolean'),
    body('anomalyDetectionAlgorithms')
      .isArray()
      .withMessage('anomalyDetectionAlgorithms must be an array'),
    body('enableCircadianAnalysis')
      .isBoolean()
      .withMessage('enableCircadianAnalysis must be a boolean'),
    body('enablePersonalizedBaselines')
      .isBoolean()
      .withMessage('enablePersonalizedBaselines must be a boolean'),
    body('enablePopulationHealth')
      .isBoolean()
      .withMessage('enablePopulationHealth must be a boolean'),
    body('enableClinicalDecisionSupport')
      .isBoolean()
      .withMessage('enableClinicalDecisionSupport must be a boolean'),
    body('enableDrugInteractionChecking')
      .isBoolean()
      .withMessage('enableDrugInteractionChecking must be a boolean'),
    body('enableEvidenceBasedRecommendations')
      .isBoolean()
      .withMessage('enableEvidenceBasedRecommendations must be a boolean')
  ],
  validateRequest,
  AnalyticsController.initializeService
);

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'analytics',
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime()
    },
    timestamp: new Date()
  });
});

// Apply error handling middleware
router.use(analyticsErrorHandler);

export default router;
