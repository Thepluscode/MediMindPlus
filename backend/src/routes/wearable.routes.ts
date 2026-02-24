/**
 * Wearable Device Data API Routes
 * Endpoints for syncing and retrieving wearable device health data
 */

import { Router, Request, Response } from 'express';
import WearableDataService from '../services/wearable/WearableDataService';
import { authenticate } from '../middleware/authorization';
import { logger } from '../utils/logger';

const router = Router();
const wearableService = new WearableDataService();

/**
 * POST /wearable/:userId/sync
 * Sync wearable data from device to backend
 */
router.post(
  '/:userId/sync',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify user has permission to sync data
      if (req.user?.id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: Cannot sync data for another user',
        });
      }

      const payload = req.body;

      // Validate payload
      if (!payload.source) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: source',
        });
      }

      const result = await wearableService.syncWearableData(userId, payload);

      logger.info(`Wearable data synced for user ${userId}`, {
        source: payload.source,
        recordsCreated: result.recordsCreated,
      });

      res.json({
        success: true,
        message: 'Wearable data synced successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Wearable sync error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to sync wearable data',
      });
    }
  }
);

/**
 * GET /wearable/:userId/dashboard
 * Get comprehensive health dashboard data
 */
router.get(
  '/:userId/dashboard',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify user has permission to access this data
      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user health data',
        });
      }

      const dashboard = await wearableService.getHealthDashboard(userId);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      logger.error('Dashboard fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch health dashboard',
      });
    }
  }
);

/**
 * GET /wearable/:userId/vitals/latest
 * Get latest vital signs for a user
 */
router.get(
  '/:userId/vitals/latest',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user health data',
        });
      }

      const vitals = await wearableService.getLatestVitalSigns(userId);

      if (!vitals) {
        return res.status(404).json({
          success: false,
          error: 'No vital signs data found',
        });
      }

      res.json({
        success: true,
        data: vitals,
      });
    } catch (error: any) {
      logger.error('Vitals fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch vital signs',
      });
    }
  }
);

/**
 * GET /wearable/:userId/activity
 * Get activity summary for a date range
 */
router.get(
  '/:userId/activity',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user health data',
        });
      }

      // Default to last 7 days if no dates provided
      const end = endDate ? new Date(endDate as string) : new Date();
      const start = startDate
        ? new Date(startDate as string)
        : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      const activity = await wearableService.getActivitySummary(
        userId,
        start,
        end
      );

      res.json({
        success: true,
        data: activity,
      });
    } catch (error: any) {
      logger.error('Activity fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch activity data',
      });
    }
  }
);

/**
 * GET /wearable/:userId/body-metrics
 * Get body metrics history
 */
router.get(
  '/:userId/body-metrics',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user health data',
        });
      }

      const limitNum = limit ? parseInt(limit as string) : 30;
      const metrics = await wearableService.getBodyMetricsHistory(
        userId,
        limitNum
      );

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Body metrics fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch body metrics',
      });
    }
  }
);

/**
 * GET /wearable/:userId/sleep
 * Get sleep data for a date range
 */
router.get(
  '/:userId/sleep',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user health data',
        });
      }

      // Default to last 30 days
      const end = endDate ? new Date(endDate as string) : new Date();
      const start = startDate
        ? new Date(startDate as string)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      const sleepData = await wearableService.getSleepData(userId, start, end);

      res.json({
        success: true,
        data: sleepData,
      });
    } catch (error: any) {
      logger.error('Sleep data fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch sleep data',
      });
    }
  }
);

/**
 * GET /wearable/:userId/heart-rate/trends
 * Get heart rate trends (last 30 days)
 */
router.get(
  '/:userId/heart-rate/trends',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user health data',
        });
      }

      const trends = await wearableService.getHeartRateTrends(userId);

      res.json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      logger.error('Heart rate trends fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch heart rate trends',
      });
    }
  }
);

/**
 * GET /wearable/:userId/status
 * Check if user has recent wearable data
 */
router.get(
  '/:userId/status',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user health data',
        });
      }

      const hasRecentData = await wearableService.hasRecentData(userId);

      res.json({
        success: true,
        data: {
          connected: hasRecentData,
          lastSync: hasRecentData ? new Date().toISOString() : null,
        },
      });
    } catch (error: any) {
      logger.error('Wearable status check error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check wearable status',
      });
    }
  }
);

export default router;
