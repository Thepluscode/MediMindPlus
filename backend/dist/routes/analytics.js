"use strict";
/**
 * Analytics Routes for MediMind Backend
 * Defines API endpoints for analytics services
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const analyticsController_1 = require("../controllers/analyticsController");
const router = (0, express_1.Router)();
// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
const requireAuth = (req, res, next) => {
    // TODO: Implement actual authentication logic
    // For now, we'll add a mock user
    req.user = {
        id: req.headers['user-id'] || 'demo-user',
        email: 'demo@example.com',
        role: 'user'
    };
    next();
};
// Rate limiting middleware (placeholder)
const rateLimit = (req, res, next) => {
    // TODO: Implement rate limiting
    next();
};
/**
 * @route POST /api/analytics/forecast
 * @desc Generate time series forecast for health metrics
 * @access Private
 */
router.post('/forecast', requireAuth, rateLimit, [
    (0, express_validator_1.body)('metric')
        .notEmpty()
        .withMessage('Metric is required')
        .isString()
        .withMessage('Metric must be a string'),
    (0, express_validator_1.body)('horizon')
        .notEmpty()
        .withMessage('Horizon is required')
        .matches(/^\d+-(day|week|month)s?$/)
        .withMessage('Horizon must be in format: "7-days", "2-weeks", "1-month"'),
    (0, express_validator_1.body)('historicalData')
        .isArray({ min: 3 })
        .withMessage('Historical data must be an array with at least 3 data points'),
    (0, express_validator_1.body)('historicalData.*.userId')
        .notEmpty()
        .withMessage('Each data point must have a userId'),
    (0, express_validator_1.body)('historicalData.*.timestamp')
        .isISO8601()
        .withMessage('Each data point must have a valid timestamp'),
    (0, express_validator_1.body)('historicalData.*.metric')
        .notEmpty()
        .withMessage('Each data point must have a metric'),
    (0, express_validator_1.body)('historicalData.*.value')
        .isNumeric()
        .withMessage('Each data point must have a numeric value'),
    (0, express_validator_1.body)('historicalData.*.unit')
        .notEmpty()
        .withMessage('Each data point must have a unit')
], validateRequest, analyticsController_1.AnalyticsController.generateForecast);
/**
 * @route POST /api/analytics/anomalies
 * @desc Detect anomalies in health data
 * @access Private
 */
router.post('/anomalies', requireAuth, rateLimit, [
    (0, express_validator_1.body)('data')
        .isArray({ min: 5 })
        .withMessage('Data must be an array with at least 5 data points'),
    (0, express_validator_1.body)('data.*.userId')
        .notEmpty()
        .withMessage('Each data point must have a userId'),
    (0, express_validator_1.body)('data.*.timestamp')
        .isISO8601()
        .withMessage('Each data point must have a valid timestamp'),
    (0, express_validator_1.body)('data.*.metric')
        .notEmpty()
        .withMessage('Each data point must have a metric'),
    (0, express_validator_1.body)('data.*.value')
        .isNumeric()
        .withMessage('Each data point must have a numeric value'),
    (0, express_validator_1.body)('algorithms')
        .optional()
        .isArray()
        .withMessage('Algorithms must be an array'),
    (0, express_validator_1.body)('sensitivity')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Sensitivity must be low, medium, or high')
], validateRequest, analyticsController_1.AnalyticsController.detectAnomalies);
/**
 * @route POST /api/analytics/circadian
 * @desc Analyze circadian rhythms
 * @access Private
 */
router.post('/circadian', requireAuth, rateLimit, [
    (0, express_validator_1.body)('data')
        .isArray({ min: 1 })
        .withMessage('Data must be an array with at least 1 data point'),
    (0, express_validator_1.body)('data.*.userId')
        .notEmpty()
        .withMessage('Each data point must have a userId'),
    (0, express_validator_1.body)('data.*.timestamp')
        .isISO8601()
        .withMessage('Each data point must have a valid timestamp'),
    (0, express_validator_1.body)('data.*.metric')
        .notEmpty()
        .withMessage('Each data point must have a metric'),
    (0, express_validator_1.body)('data.*.value')
        .isNumeric()
        .withMessage('Each data point must have a numeric value')
], validateRequest, analyticsController_1.AnalyticsController.analyzeCircadianRhythms);
/**
 * @route POST /api/analytics/baseline
 * @desc Update personalized baseline for a metric
 * @access Private
 */
router.post('/baseline', requireAuth, rateLimit, [
    (0, express_validator_1.body)('metric')
        .notEmpty()
        .withMessage('Metric is required')
        .isString()
        .withMessage('Metric must be a string'),
    (0, express_validator_1.body)('value')
        .isNumeric()
        .withMessage('Value must be a number'),
    (0, express_validator_1.body)('timestamp')
        .optional()
        .isISO8601()
        .withMessage('Timestamp must be a valid ISO 8601 date')
], validateRequest, analyticsController_1.AnalyticsController.updateBaseline);
/**
 * @route POST /api/analytics/insights
 * @desc Generate comprehensive health insights
 * @access Private
 */
router.post('/insights', requireAuth, rateLimit, [
    (0, express_validator_1.body)('healthData')
        .isArray({ min: 1 })
        .withMessage('Health data must be an array with at least 1 data point'),
    (0, express_validator_1.body)('healthData.*.userId')
        .notEmpty()
        .withMessage('Each data point must have a userId'),
    (0, express_validator_1.body)('healthData.*.timestamp')
        .isISO8601()
        .withMessage('Each data point must have a valid timestamp'),
    (0, express_validator_1.body)('healthData.*.metric')
        .notEmpty()
        .withMessage('Each data point must have a metric'),
    (0, express_validator_1.body)('healthData.*.value')
        .isNumeric()
        .withMessage('Each data point must have a numeric value')
], validateRequest, analyticsController_1.AnalyticsController.generateHealthInsights);
/**
 * @route GET /api/analytics/summary
 * @desc Get analytics summary for dashboard
 * @access Private
 */
router.get('/summary', requireAuth, rateLimit, analyticsController_1.AnalyticsController.getAnalyticsSummary);
/**
 * @route GET /api/analytics/status
 * @desc Get analytics service status
 * @access Public
 */
router.get('/status', rateLimit, analyticsController_1.AnalyticsController.getServiceStatus);
/**
 * @route POST /api/analytics/initialize
 * @desc Initialize analytics service with configuration
 * @access Admin only
 */
router.post('/initialize', requireAuth, rateLimit, [
    (0, express_validator_1.body)('enableTimeSeriesForecasting')
        .isBoolean()
        .withMessage('enableTimeSeriesForecasting must be a boolean'),
    (0, express_validator_1.body)('forecastingModels')
        .isArray()
        .withMessage('forecastingModels must be an array'),
    (0, express_validator_1.body)('enableAnomalyDetection')
        .isBoolean()
        .withMessage('enableAnomalyDetection must be a boolean'),
    (0, express_validator_1.body)('anomalyDetectionAlgorithms')
        .isArray()
        .withMessage('anomalyDetectionAlgorithms must be an array'),
    (0, express_validator_1.body)('enableCircadianAnalysis')
        .isBoolean()
        .withMessage('enableCircadianAnalysis must be a boolean'),
    (0, express_validator_1.body)('enablePersonalizedBaselines')
        .isBoolean()
        .withMessage('enablePersonalizedBaselines must be a boolean'),
    (0, express_validator_1.body)('enablePopulationHealth')
        .isBoolean()
        .withMessage('enablePopulationHealth must be a boolean'),
    (0, express_validator_1.body)('enableClinicalDecisionSupport')
        .isBoolean()
        .withMessage('enableClinicalDecisionSupport must be a boolean'),
    (0, express_validator_1.body)('enableDrugInteractionChecking')
        .isBoolean()
        .withMessage('enableDrugInteractionChecking must be a boolean'),
    (0, express_validator_1.body)('enableEvidenceBasedRecommendations')
        .isBoolean()
        .withMessage('enableEvidenceBasedRecommendations must be a boolean')
], validateRequest, analyticsController_1.AnalyticsController.initializeService);
// Health check endpoint
router.get('/health', (req, res) => {
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
router.use(analyticsController_1.analyticsErrorHandler);
exports.default = router;
