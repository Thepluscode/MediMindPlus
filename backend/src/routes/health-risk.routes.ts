/**
 * Health Risk Assessment API Routes
 * Endpoints for AI-powered disease risk prediction
 */

import { Router, Request, Response } from 'express';
import HealthRiskAssessmentService from '../services/ml/healthRiskAssessment';
import { authenticate } from '../middleware/authorization';
import logger from '../utils/logger';

const router = Router();
const riskService = new HealthRiskAssessmentService();

/**
 * GET /health-risk/:userId/diabetes
 * Get Type 2 Diabetes risk assessment
 */
router.get(
  '/:userId/diabetes',
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

      const assessment = await riskService.predictDiabetesRisk(userId);

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      logger.error('Diabetes risk assessment error', {
        service: 'health-risk',
        userId: req.params.userId,
        endpoint: '/health-risk/:userId/diabetes',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assess diabetes risk',
      });
    }
  }
);

/**
 * GET /health-risk/:userId/cardiovascular
 * Get Cardiovascular disease risk assessment (Framingham Score)
 */
router.get(
  '/:userId/cardiovascular',
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

      const assessment = await riskService.predictCardiovascularRisk(userId);

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      logger.error('Cardiovascular risk assessment error', {
        service: 'health-risk',
        userId: req.params.userId,
        endpoint: '/health-risk/:userId/cardiovascular',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assess cardiovascular risk',
      });
    }
  }
);

/**
 * GET /health-risk/:userId/hypertension
 * Get Hypertension risk assessment
 */
router.get(
  '/:userId/hypertension',
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

      const assessment = await riskService.predictHypertensionRisk(userId);

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      logger.error('Hypertension risk assessment error', {
        service: 'health-risk',
        userId: req.params.userId,
        endpoint: '/health-risk/:userId/hypertension',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assess hypertension risk',
      });
    }
  }
);

/**
 * GET /health-risk/:userId/mental-health
 * Get Mental health risk assessment (PHQ-9, GAD-7)
 */
router.get(
  '/:userId/mental-health',
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

      const assessment = await riskService.predictMentalHealthRisk(userId);

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      logger.error('Mental health risk assessment error', {
        service: 'health-risk',
        userId: req.params.userId,
        endpoint: '/health-risk/:userId/mental-health',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assess mental health risk',
      });
    }
  }
);

/**
 * GET /health-risk/:userId/cancer-screening
 * Get Cancer screening recommendations
 */
router.get(
  '/:userId/cancer-screening',
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

      const assessment = await riskService.getCancerScreeningRecommendations(
        userId
      );

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      logger.error('Cancer screening assessment error', {
        service: 'health-risk',
        userId: req.params.userId,
        endpoint: '/health-risk/:userId/cancer-screening',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get cancer screening recommendations',
      });
    }
  }
);

/**
 * GET /health-risk/:userId/comprehensive
 * Get Comprehensive health risk report (all 5 models)
 */
router.get(
  '/:userId/comprehensive',
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

      const report = await riskService.getComprehensiveRiskReport(userId);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      logger.error('Comprehensive risk report error', {
        service: 'health-risk',
        userId: req.params.userId,
        endpoint: '/health-risk/:userId/comprehensive',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate comprehensive risk report',
      });
    }
  }
);

export default router;
