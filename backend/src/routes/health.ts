// Health Check Routes
import { Router, Request, Response } from 'express';
import { healthCheckHandler } from '../middleware/healthCheck';
import { enhancedLogger } from '../utils/logger';
import { DatabaseManager } from '../database/DatabaseManager';
import { RedisManager } from '../cache/RedisManager';
import { MonitoringManager } from '../monitoring/MonitoringManager';

const router = Router();

// Initialize managers for health checks
const databaseManager = new DatabaseManager();
const redisManager = new RedisManager();
const monitoringManager = new MonitoringManager();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic server health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 version:
 *                   type: string
 *                   example: 2.0.0
 */
router.get('/', (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  enhancedLogger.debug('Basic health check requested', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json(healthStatus);
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns comprehensive health status including all services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 *       503:
 *         description: One or more services are unhealthy
 */
router.get('/detailed', healthCheckHandler);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    const checks = await Promise.allSettled([
      databaseManager.healthCheck(),
      redisManager.ping()
    ]);

    const failedChecks = checks.filter(check => check.status === 'rejected');

    if (failedChecks.length === 0) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: 'ready',
          redis: 'ready'
        }
      });
    } else {
      enhancedLogger.warn('Readiness check failed', {
        failedChecks: failedChecks.length,
        totalChecks: checks.length
      });

      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        services: {
          database: checks[0].status === 'fulfilled' ? 'ready' : 'not_ready',
          redis: checks[1].status === 'fulfilled' ? 'ready' : 'not_ready'
        }
      });
    }
  } catch (error) {
    enhancedLogger.error('Readiness check error', {
      error: error.message
    });

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *       503:
 *         description: Service should be restarted
 */
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: Health metrics
 *     description: Returns performance and health metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const healthSummary = monitoringManager.getHealthSummary();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      health: healthSummary
    };

    res.status(200).json(metrics);
  } catch (error) {
    enhancedLogger.error('Metrics endpoint error', {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /health/database:
 *   get:
 *     summary: Database health check
 *     description: Specific health check for database connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *       503:
 *         description: Database is unhealthy
 */
router.get('/database', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    await databaseManager.healthCheck();
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      status: 'healthy',
      service: 'database',
      responseTime,
      timestamp: new Date().toISOString(),
      poolStats: databaseManager.getPoolStats()
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    enhancedLogger.error('Database health check failed', {
      error: error.message,
      responseTime
    });

    res.status(503).json({
      status: 'unhealthy',
      service: 'database',
      responseTime,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /health/redis:
 *   get:
 *     summary: Redis health check
 *     description: Specific health check for Redis connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Redis is healthy
 *       503:
 *         description: Redis is unhealthy
 */
router.get('/redis', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const pingResult = await redisManager.ping();
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      status: 'healthy',
      service: 'redis',
      responseTime,
      timestamp: new Date().toISOString(),
      ping: pingResult
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    enhancedLogger.error('Redis health check failed', {
      error: error.message,
      responseTime
    });

    res.status(503).json({
      status: 'unhealthy',
      service: 'redis',
      responseTime,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /health/version:
 *   get:
 *     summary: Version information
 *     description: Returns version and build information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Version information
 */
router.get('/version', (req: Request, res: Response) => {
  const versionInfo = {
    version: process.env.npm_package_version || '2.0.0',
    name: 'MediMind Backend API',
    description: 'Production-ready healthcare AI platform API',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    buildDate: process.env.BUILD_DATE || new Date().toISOString(),
    gitCommit: process.env.GIT_COMMIT || 'unknown',
    gitBranch: process.env.GIT_BRANCH || 'unknown'
  };

  res.status(200).json(versionInfo);
});

export { router as healthRoutes };
export default router;
