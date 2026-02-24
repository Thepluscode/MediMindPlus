/**
 * Performance Monitoring Service
 *
 * Comprehensive monitoring for MediMindPlus backend
 * Tracks: API performance, database queries, errors, custom metrics
 *
 * Integrations:
 * - Datadog (production monitoring)
 * - New Relic (alternative)
 * - Custom metrics dashboard
 * - Error tracking (Sentry)
 *
 * Features:
 * - Request/Response tracking
 * - Database query performance
 * - Memory & CPU monitoring
 * - Error rates & alerting
 * - Custom business metrics (AI analyses, appointments, etc.)
 */

import { Request, Response, NextFunction } from 'express';
import os from 'os';
import logger from '../../utils/logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number; // milliseconds
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

interface ErrorLog {
  errorId: string;
  message: string;
  stack?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  requestPath?: string;
  context?: Record<string, any>;
}

interface SystemMetrics {
  cpuUsage: number; // percentage
  memoryUsage: number; // bytes
  freeMemory: number; // bytes
  totalMemory: number; // bytes
  uptime: number; // seconds
  timestamp: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private requestMetrics: RequestMetrics[] = [];
  private errorLogs: ErrorLog[] = [];
  private systemMetricsInterval: NodeJS.Timeout | null = null;

  // Datadog/New Relic client (mock for now)
  private ddClient: any = null;
  private sentryClient: any = null;

  constructor() {
    this.initializeIntegrations();
    this.startSystemMetricsCollection();
  }

  /**
   * Initialize third-party monitoring integrations
   */
  private initializeIntegrations(): void {
    // Datadog initialization (if API key provided)
    if (process.env.DATADOG_API_KEY) {
      logger.info('Datadog integration initialized', {
        service: 'monitoring'
      });
      // In production: const dogapi = require('dogapi'); dogapi.initialize({ api_key: ... });
      this.ddClient = {
        metric: {
          send: (name: string, value: number, tags: Record<string, string>) => {
            logger.info('Datadog metric sent', {
              service: 'monitoring',
              metricName: name,
              value,
              tags
            });
          }
        },
        event: {
          create: (title: string, text: string, options: any) => {
            logger.info('Datadog event created', {
              service: 'monitoring',
              eventTitle: title,
              text
            });
          }
        }
      };
    }

    // Sentry initialization (for error tracking)
    if (process.env.SENTRY_DSN) {
      logger.info('Sentry integration initialized', {
        service: 'monitoring'
      });
      // In production: Sentry.init({ dsn: process.env.SENTRY_DSN });
      this.sentryClient = {
        captureException: (error: Error, context?: any) => {
          logger.info('Sentry error captured', {
            service: 'monitoring',
            error: error.message,
            context
          });
        }
      };
    }
  }

  /**
   * Start collecting system metrics every 30 seconds
   */
  private startSystemMetricsCollection(): void {
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds

    logger.info('System metrics collection started', {
      service: 'monitoring',
      interval: '30s'
    });
  }

  /**
   * Stop metrics collection (for graceful shutdown)
   */
  stop(): void {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
      this.systemMetricsInterval = null;
      logger.info('Monitoring stopped', {
        service: 'monitoring'
      });
    }
  }

  /**
   * Express middleware for request/response tracking
   */
  requestTrackingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();

      // Attach request ID to request object
      (req as any).requestId = requestId;

      // Intercept response to capture metrics
      const originalSend = res.send;
      res.send = function (data: any) {
        const duration = Date.now() - startTime;

        // Record metrics
        performanceMonitor.recordRequestMetrics({
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date(),
          userId: (req as any).user?.id,
          userAgent: req.get('user-agent'),
          ip: req.ip
        });

        // Send metric to Datadog
        performanceMonitor.sendMetric('http.request.duration', duration, {
          method: req.method,
          path: req.path,
          status: res.statusCode.toString()
        });

        // Alert on slow requests (> 3 seconds)
        if (duration > 3000) {
          logger.warn('Slow request detected', {
            service: 'monitoring',
            method: req.method,
            path: req.path,
            duration
          });
          performanceMonitor.sendMetric('http.request.slow', 1, {
            method: req.method,
            path: req.path
          });
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Error handling middleware
   */
  errorTrackingMiddleware() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
      const errorLog: ErrorLog = {
        errorId: this.generateErrorId(),
        message: err.message,
        stack: err.stack,
        timestamp: new Date(),
        severity: this.determineSeverity(err),
        userId: (req as any).user?.id,
        requestPath: req.path,
        context: {
          method: req.method,
          query: req.query,
          body: req.body
        }
      };

      this.recordError(errorLog);

      // Send to Sentry
      if (this.sentryClient) {
        this.sentryClient.captureException(err, {
          user: { id: (req as any).user?.id },
          tags: { path: req.path }
        });
      }

      // Send metric to Datadog
      this.sendMetric('errors.count', 1, {
        severity: errorLog.severity,
        path: req.path
      });

      next(err);
    };
  }

  /**
   * Record custom metric
   */
  sendMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit: '',
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);

    // Keep only last 10,000 metrics in memory
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }

    // Send to Datadog
    if (this.ddClient) {
      this.ddClient.metric.send(name, value, tags);
    }

    logger.info('Performance metric recorded', {
      service: 'monitoring',
      metricName: name,
      value,
      tags
    });
  }

  /**
   * Record request metrics
   */
  private recordRequestMetrics(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics);

    // Keep only last 5,000 requests in memory
    if (this.requestMetrics.length > 5000) {
      this.requestMetrics = this.requestMetrics.slice(-5000);
    }
  }

  /**
   * Record error
   */
  private recordError(errorLog: ErrorLog): void {
    this.errorLogs.push(errorLog);

    // Keep only last 1,000 errors in memory
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000);
    }

    // Log critical errors immediately
    if (errorLog.severity === 'critical') {
      logger.error('Critical error detected', {
        service: 'monitoring',
        errorId: errorLog.errorId,
        message: errorLog.message,
        severity: errorLog.severity,
        userId: errorLog.userId,
        requestPath: errorLog.requestPath
      });
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsage = ((1 - idle / total) * 100).toFixed(2);

    const systemMetrics: SystemMetrics = {
      cpuUsage: parseFloat(cpuUsage),
      memoryUsage: process.memoryUsage().heapUsed,
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      uptime: process.uptime(),
      timestamp: new Date()
    };

    // Send to monitoring service
    this.sendMetric('system.cpu_usage', systemMetrics.cpuUsage, { unit: 'percent' });
    this.sendMetric('system.memory_usage', systemMetrics.memoryUsage, { unit: 'bytes' });
    this.sendMetric('system.free_memory', systemMetrics.freeMemory, { unit: 'bytes' });

    // Alert on high CPU usage
    if (systemMetrics.cpuUsage > 80) {
      logger.warn('High CPU usage detected', {
        service: 'monitoring',
        cpuUsage: systemMetrics.cpuUsage,
        threshold: 80
      });
    }

    // Alert on low memory
    const memoryPercentage = (systemMetrics.freeMemory / systemMetrics.totalMemory) * 100;
    if (memoryPercentage < 10) {
      logger.warn('Low memory detected', {
        service: 'monitoring',
        freeMemoryPercentage: memoryPercentage.toFixed(2),
        threshold: 10
      });
    }
  }

  /**
   * Track business metrics (custom events)
   */
  trackBusinessMetric(
    eventName: string,
    value: number = 1,
    metadata?: Record<string, any>
  ): void {
    this.sendMetric(`business.${eventName}`, value, metadata || {});

    // Log significant business events
    logger.info('Business metric tracked', {
      service: 'monitoring',
      eventName,
      value,
      metadata
    });
  }

  /**
   * Track AI analysis performance
   */
  trackAIAnalysis(
    analysisType: string,
    duration: number,
    success: boolean,
    userId?: string
  ): void {
    this.sendMetric('ai.analysis.duration', duration, {
      type: analysisType,
      success: success.toString(),
      userId: userId || 'unknown'
    });

    this.sendMetric('ai.analysis.count', 1, {
      type: analysisType,
      success: success.toString()
    });

    if (!success) {
      logger.warn('AI analysis failed', {
        service: 'monitoring',
        analysisType,
        userId
      });
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(
    queryType: string,
    duration: number,
    tableName?: string
  ): void {
    this.sendMetric('database.query.duration', duration, {
      type: queryType,
      table: tableName || 'unknown'
    });

    // Alert on slow queries
    if (duration > 1000) {
      logger.warn('Slow database query detected', {
        service: 'monitoring',
        queryType,
        tableName,
        duration,
        threshold: 1000
      });
      this.sendMetric('database.query.slow', 1, {
        type: queryType,
        table: tableName || 'unknown'
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    requests: { total: number; avgDuration: number; errorRate: number };
    errors: { total: number; bySeverity: Record<string, number> };
    system: { cpuUsage: number; memoryUsage: number };
  } {
    const totalRequests = this.requestMetrics.length;
    const avgDuration = totalRequests > 0
      ? this.requestMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
      : 0;
    const errorRequests = this.requestMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;

    const errorsBySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    this.errorLogs.forEach(err => {
      errorsBySeverity[err.severity]++;
    });

    const recentCpuMetric = this.metrics
      .filter(m => m.name === 'system.cpu_usage')
      .slice(-1)[0];
    const recentMemoryMetric = this.metrics
      .filter(m => m.name === 'system.memory_usage')
      .slice(-1)[0];

    return {
      requests: {
        total: totalRequests,
        avgDuration: Math.round(avgDuration),
        errorRate: Math.round(errorRate * 100) / 100
      },
      errors: {
        total: this.errorLogs.length,
        bySeverity: errorsBySeverity
      },
      system: {
        cpuUsage: recentCpuMetric?.value || 0,
        memoryUsage: recentMemoryMetric?.value || 0
      }
    };
  }

  /**
   * Get recent request metrics
   */
  getRecentRequests(limit: number = 100): RequestMetrics[] {
    return this.requestMetrics.slice(-limit);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorLog[] {
    return this.errorLogs.slice(-limit);
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string, limit: number = 100): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.name === name)
      .slice(-limit);
  }

  /**
   * Health check endpoint data
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    timestamp: Date;
    checks: Record<string, boolean>;
  } {
    const stats = this.getStats();
    const uptime = process.uptime();

    // Health checks
    const checks = {
      cpuHealthy: stats.system.cpuUsage < 90,
      memoryHealthy: (os.freemem() / os.totalmem()) > 0.05, // More than 5% free
      errorRateHealthy: stats.requests.errorRate < 0.05, // Less than 5% error rate
      avgResponseTimeHealthy: stats.requests.avgDuration < 2000 // Less than 2 seconds
    };

    const allHealthy = Object.values(checks).every(v => v);
    const anyUnhealthy = Object.values(checks).some(v => !v);

    return {
      status: allHealthy ? 'healthy' : anyUnhealthy ? 'degraded' : 'unhealthy',
      uptime: Math.round(uptime),
      timestamp: new Date(),
      checks
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): ErrorLog['severity'] {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    } else if (message.includes('database') || message.includes('connection')) {
      return 'high';
    } else if (message.includes('timeout') || message.includes('validation')) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Performance monitor shutting down', {
    service: 'monitoring',
    signal: 'SIGTERM'
  });
  performanceMonitor.stop();
});

process.on('SIGINT', () => {
  logger.info('Performance monitor shutting down', {
    service: 'monitoring',
    signal: 'SIGINT'
  });
  performanceMonitor.stop();
});

/**
 * Helper functions for common tracking scenarios
 */

export const trackAPICall = (
  endpoint: string,
  duration: number,
  success: boolean
) => {
  performanceMonitor.sendMetric('api.call.duration', duration, {
    endpoint,
    success: success.toString()
  });
};

export const trackUserAction = (
  action: string,
  userId: string,
  metadata?: Record<string, any>
) => {
  performanceMonitor.trackBusinessMetric(`user.${action}`, 1, {
    userId,
    ...metadata
  });
};

export const trackFeatureUsage = (
  featureName: string,
  userId?: string
) => {
  performanceMonitor.trackBusinessMetric('feature.usage', 1, {
    feature: featureName,
    userId: userId || 'anonymous'
  });
};
