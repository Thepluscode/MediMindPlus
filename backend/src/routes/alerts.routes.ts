/**
 * Health Alerts API Routes
 * Endpoints for vital signs alerts and notifications
 */

import { Router, Request, Response } from 'express';
import { VitalsMonitoringService } from '../services/monitoring/VitalsMonitoringService';
import { authenticate } from '../middleware/authorization';
import { logger } from '../utils/logger';

const router = Router();
const monitoringService = new VitalsMonitoringService();

/**
 * GET /alerts/:userId/recent
 * Get recent vital alerts for a user
 */
router.get(
  '/:userId/recent',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;

      // Verify user has permission to access alerts
      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user alerts',
        });
      }

      const alerts = await monitoringService.getRecentAlerts(userId, hours);

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          criticalCount: alerts.filter((a) => a.severity === 'CRITICAL').length,
          warningCount: alerts.filter((a) => a.severity === 'WARNING').length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching alerts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch alerts',
      });
    }
  }
);

/**
 * GET /alerts/:userId/critical
 * Get only critical alerts for a user
 */
router.get(
  '/:userId/critical',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user alerts',
        });
      }

      const alerts = await monitoringService.getRecentAlerts(userId, 168); // 7 days
      const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');

      res.json({
        success: true,
        data: {
          alerts: criticalAlerts,
          count: criticalAlerts.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching critical alerts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch critical alerts',
      });
    }
  }
);

/**
 * POST /alerts/:userId/test
 * Test alert system by processing sample vitals
 */
router.post(
  '/:userId/test',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const testVitals = req.body.vitals || {
        heartRate: 150, // Abnormally high
        bloodPressure: { systolic: 160, diastolic: 100 }, // High BP
        oxygenSaturation: 92, // Low
      };

      const alerts = await monitoringService.processVitals(userId, testVitals);

      res.json({
        success: true,
        message: 'Test alerts generated',
        data: {
          testVitals,
          alertsGenerated: alerts,
        },
      });
    } catch (error: any) {
      logger.error('Error testing alerts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to test alerts',
      });
    }
  }
);

export default router;
