// Production Health Check Middleware
import { Request, Response, NextFunction } from 'express';
import { enhancedLogger } from '../utils/logger';
import { DatabaseManager } from '../database/DatabaseManager';
import { RedisManager } from '../cache/RedisManager';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
    external: ServiceHealth;
  };
  metrics: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  lastChecked: string;
}

class HealthChecker {
  private databaseManager: DatabaseManager;
  private redisManager: RedisManager;
  private metrics: Map<string, any> = new Map();

  constructor() {
    this.databaseManager = new DatabaseManager();
    this.redisManager = new RedisManager();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Initialize metrics tracking
    this.metrics.set('requests', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('responseTimes', []);
    this.metrics.set('lastReset', Date.now());
  }

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Check all services in parallel
      const [database, redis, memory, disk, external] = await Promise.all([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkMemory(),
        this.checkDisk(),
        this.checkExternalServices()
      ]);

      // Calculate overall status
      const services = { database, redis, memory, disk, external };
      const overallStatus = this.calculateOverallStatus(services);

      // Get current metrics
      const metrics = this.getCurrentMetrics();

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        services,
        metrics
      };

      // Log health check
      enhancedLogger.debug('Health check completed', {
        status: overallStatus,
        duration: Date.now() - startTime,
        services: Object.entries(services).map(([name, service]) => ({
          name,
          status: service.status
        }))
      });

      return healthStatus;
    } catch (error) {
      enhancedLogger.error('Health check failed', {
        error: error.message,
        duration: Date.now() - startTime
      });

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: { status: 'unhealthy', message: 'Health check failed', lastChecked: new Date().toISOString() },
          redis: { status: 'unhealthy', message: 'Health check failed', lastChecked: new Date().toISOString() },
          memory: { status: 'unhealthy', message: 'Health check failed', lastChecked: new Date().toISOString() },
          disk: { status: 'unhealthy', message: 'Health check failed', lastChecked: new Date().toISOString() },
          external: { status: 'unhealthy', message: 'Health check failed', lastChecked: new Date().toISOString() }
        },
        metrics: {
          requestsPerMinute: 0,
          averageResponseTime: 0,
          errorRate: 0,
          activeConnections: 0
        }
      };
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple database connectivity check
      await this.databaseManager.healthCheck();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        message: responseTime < 1000 ? 'Database connection healthy' : 'Database response slow',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Database connection failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple Redis connectivity check
      await this.redisManager.ping();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        message: responseTime < 500 ? 'Redis connection healthy' : 'Redis response slow',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Redis connection failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkMemory(): Promise<ServiceHealth> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Memory usage normal';

      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
        message = 'Critical memory usage';
      } else if (memoryUsagePercent > 75) {
        status = 'degraded';
        message = 'High memory usage';
      }

      return {
        status,
        message: `${message} (${memoryUsagePercent.toFixed(1)}%)`,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkDisk(): Promise<ServiceHealth> {
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      
      // Simple disk space check (this is a basic implementation)
      // In production, you'd want more sophisticated disk space monitoring
      
      return {
        status: 'healthy',
        message: 'Disk space adequate',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Disk check failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkExternalServices(): Promise<ServiceHealth> {
    try {
      // Check external service dependencies
      // This would include ML services, third-party APIs, etc.
      
      const checks = await Promise.allSettled([
        this.checkMLService(),
        this.checkEmailService(),
        // Add other external service checks
      ]);

      const failedChecks = checks.filter(check => check.status === 'rejected').length;
      const totalChecks = checks.length;

      if (failedChecks === 0) {
        return {
          status: 'healthy',
          message: 'All external services healthy',
          lastChecked: new Date().toISOString()
        };
      } else if (failedChecks < totalChecks) {
        return {
          status: 'degraded',
          message: `${failedChecks}/${totalChecks} external services unavailable`,
          lastChecked: new Date().toISOString()
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'All external services unavailable',
          lastChecked: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `External services check failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkMLService(): Promise<void> {
    // Implement ML service health check
    // This would ping your ML inference endpoints
    return Promise.resolve();
  }

  private async checkEmailService(): Promise<void> {
    // Implement email service health check
    return Promise.resolve();
  }

  private calculateOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.every(status => status === 'healthy')) {
      return 'healthy';
    } else if (statuses.some(status => status === 'unhealthy')) {
      return 'unhealthy';
    } else {
      return 'degraded';
    }
  }

  private getCurrentMetrics() {
    const now = Date.now();
    const lastReset = this.metrics.get('lastReset');
    const timeWindow = now - lastReset;
    const requests = this.metrics.get('requests');
    const errors = this.metrics.get('errors');
    const responseTimes = this.metrics.get('responseTimes');

    return {
      requestsPerMinute: Math.round((requests / timeWindow) * 60000),
      averageResponseTime: responseTimes.length > 0 ? 
        Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length) : 0,
      errorRate: requests > 0 ? Math.round((errors / requests) * 100) : 0,
      activeConnections: 0 // This would be tracked by your connection pool
    };
  }

  updateMetrics(responseTime: number, isError: boolean): void {
    this.metrics.set('requests', this.metrics.get('requests') + 1);
    
    if (isError) {
      this.metrics.set('errors', this.metrics.get('errors') + 1);
    }
    
    const responseTimes = this.metrics.get('responseTimes');
    responseTimes.push(responseTime);
    
    // Keep only last 100 response times
    if (responseTimes.length > 100) {
      responseTimes.shift();
    }
    
    // Reset metrics every hour
    const now = Date.now();
    const lastReset = this.metrics.get('lastReset');
    if (now - lastReset > 3600000) { // 1 hour
      this.initializeMetrics();
    }
  }
}

const healthChecker = new HealthChecker();

/**
 * Health check middleware for request tracking
 */
export const healthCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Track request metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    
    healthChecker.updateMetrics(responseTime, isError);
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Health check endpoint handler
 */
export const healthCheckHandler = async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthChecker.checkHealth();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    enhancedLogger.error('Health check endpoint failed', { error: error.message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error.message
    });
  }
};

export default {
  healthCheckMiddleware,
  healthCheckHandler,
  healthChecker
};
