/**
 * Monitoring Controller
 *
 * REST API endpoints for performance monitoring, health checks, and analytics
 */

import { Request, Response } from 'express';
import { performanceMonitor } from '../infrastructure/monitoring/PerformanceMonitor';
import logger from '../utils/logger';

export class MonitoringController {
  /**
   * GET /api/monitoring/health
   * Health check endpoint for load balancers
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = performanceMonitor.getHealthStatus();

      const statusCode = health.status === 'healthy' ? 200
        : health.status === 'degraded' ? 200
        : 503;

      res.status(statusCode).json({
        success: true,
        data: health
      });
    } catch (error: any) {
      logger.error('Health check endpoint error', {
        service: 'monitoring',
        endpoint: '/api/monitoring/health',
        error: error.message
      });
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        status: 'unhealthy'
      });
    }
  }

  /**
   * GET /api/monitoring/stats
   * Get performance statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = performanceMonitor.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Get stats endpoint error', {
        service: 'monitoring',
        endpoint: '/api/monitoring/stats',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/monitoring/requests
   * Get recent request metrics
   */
  async getRequests(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const requests = performanceMonitor.getRecentRequests(limit);

      res.json({
        success: true,
        data: requests
      });
    } catch (error: any) {
      logger.error('Get requests endpoint error', {
        service: 'monitoring',
        endpoint: '/api/monitoring/requests',
        limit: req.query.limit,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/monitoring/errors
   * Get recent error logs
   */
  async getErrors(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const errors = performanceMonitor.getRecentErrors(limit);

      res.json({
        success: true,
        data: errors
      });
    } catch (error: any) {
      logger.error('Get errors endpoint error', {
        service: 'monitoring',
        endpoint: '/api/monitoring/errors',
        limit: req.query.limit,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/monitoring/metrics/:name
   * Get specific metrics by name
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const metrics = performanceMonitor.getMetrics(name, limit);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      logger.error('Get metrics endpoint error', {
        service: 'monitoring',
        endpoint: '/api/monitoring/metrics/:name',
        metricName: req.params.name,
        limit: req.query.limit,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/monitoring/track
   * Track custom business event
   */
  async trackEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventName, value, metadata } = req.body;

      if (!eventName) {
        res.status(400).json({
          success: false,
          error: 'Event name required'
        });
        return;
      }

      performanceMonitor.trackBusinessMetric(
        eventName,
        value || 1,
        metadata
      );

      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error: any) {
      logger.error('Track event endpoint error', {
        service: 'monitoring',
        endpoint: '/api/monitoring/track',
        eventName: req.body.eventName,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/monitoring/analytics/dashboard
   * Get analytics dashboard data
   */
  async getDashboardAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const stats = performanceMonitor.getStats();
      const health = performanceMonitor.getHealthStatus();
      const recentRequests = performanceMonitor.getRecentRequests(1000);
      const recentErrors = performanceMonitor.getRecentErrors(100);

      // Calculate request distribution by path
      const pathDistribution: Record<string, number> = {};
      recentRequests.forEach(req => {
        pathDistribution[req.path] = (pathDistribution[req.path] || 0) + 1;
      });

      // Calculate response time percentiles
      const durations = recentRequests.map(r => r.duration).sort((a, b) => a - b);
      const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
      const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
      const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

      // Calculate status code distribution
      const statusDistribution: Record<string, number> = {};
      recentRequests.forEach(req => {
        const statusCategory = `${Math.floor(req.statusCode / 100)}xx`;
        statusDistribution[statusCategory] = (statusDistribution[statusCategory] || 0) + 1;
      });

      // Calculate error trends (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentErrorCount = recentErrors.filter(
        e => new Date(e.timestamp) > oneHourAgo
      ).length;

      res.json({
        success: true,
        data: {
          overview: {
            totalRequests: stats.requests.total,
            avgResponseTime: stats.requests.avgDuration,
            errorRate: stats.requests.errorRate,
            healthStatus: health.status,
            uptime: health.uptime
          },
          responseTime: {
            p50,
            p95,
            p99
          },
          statusDistribution,
          pathDistribution: Object.entries(pathDistribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
          errors: {
            total: stats.errors.total,
            recentHour: recentErrorCount,
            bySeverity: stats.errors.bySeverity
          },
          system: stats.system
        }
      });
    } catch (error: any) {
      logger.error('Dashboard analytics endpoint error', {
        service: 'monitoring',
        endpoint: '/api/monitoring/analytics/dashboard',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const monitoringController = new MonitoringController();
