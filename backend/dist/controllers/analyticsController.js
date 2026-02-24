"use strict";
/**
 * Analytics Controller for MediMind Backend
 * Handles HTTP requests for analytics services
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsErrorHandler = exports.AnalyticsController = void 0;
const analytics_1 = require("../types/analytics");
const AdvancedAnalyticsService_1 = __importDefault(require("../services/AdvancedAnalyticsService"));
// Initialize analytics service
const analyticsService = new AdvancedAnalyticsService_1.default();
class AnalyticsController {
    /**
     * Generate time series forecast
     */
    static async generateForecast(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated',
                    timestamp: new Date()
                });
                return;
            }
            const { metric, horizon, historicalData } = req.body;
            // Validate request
            if (!metric || !horizon || !historicalData) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: metric, horizon, historicalData',
                    timestamp: new Date()
                });
                return;
            }
            const startTime = Date.now();
            const forecastRequest = {
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
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Detect anomalies in health data
     */
    static async detectAnomalies(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated',
                    timestamp: new Date()
                });
                return;
            }
            const { data, algorithms, sensitivity } = req.body;
            // Validate request
            if (!data || !Array.isArray(data) || data.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid or missing health data',
                    timestamp: new Date()
                });
                return;
            }
            const startTime = Date.now();
            const anomalyRequest = {
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
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Analyze circadian rhythms
     */
    static async analyzeCircadianRhythms(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated',
                    timestamp: new Date()
                });
                return;
            }
            const { data } = req.body;
            // Validate request
            if (!data || !Array.isArray(data) || data.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid or missing health data',
                    timestamp: new Date()
                });
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
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update personalized baseline
     */
    static async updateBaseline(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated',
                    timestamp: new Date()
                });
                return;
            }
            const { metric, value, timestamp } = req.body;
            // Validate request
            if (!metric || typeof value !== 'number') {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: metric, value',
                    timestamp: new Date()
                });
                return;
            }
            const startTime = Date.now();
            const baselineRequest = {
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
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate health insights
     */
    static async generateHealthInsights(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated',
                    timestamp: new Date()
                });
                return;
            }
            const { healthData } = req.body;
            // Validate request
            if (!healthData || !Array.isArray(healthData)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid or missing health data',
                    timestamp: new Date()
                });
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
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get analytics summary
     */
    static async getAnalyticsSummary(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated',
                    timestamp: new Date()
                });
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
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get service status
     */
    static async getServiceStatus(req, res, next) {
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
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Initialize analytics service
     */
    static async initializeService(req, res, next) {
        try {
            const config = req.body;
            if (!config) {
                res.status(400).json({
                    success: false,
                    error: 'Analytics configuration is required',
                    timestamp: new Date()
                });
                return;
            }
            await analyticsService.initialize(config);
            res.status(200).json({
                success: true,
                data: { message: 'Analytics service initialized successfully' },
                timestamp: new Date()
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
/**
 * Error handling middleware for analytics
 */
const analyticsErrorHandler = (error, req, res, next) => {
    console.error('Analytics Error:', error);
    if (error instanceof analytics_1.AnalyticsServiceError) {
        res.status(error.statusCode).json({
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
            timestamp: new Date()
        });
        return;
    }
    // Generic error
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date()
    });
};
exports.analyticsErrorHandler = analyticsErrorHandler;
exports.default = AnalyticsController;
