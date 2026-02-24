/**
 * Advanced Features Routes
 * MediMindPlus - Enterprise Health Platform
 *
 * Routes for stroke detection, wearables, biometrics, BCI monitoring,
 * microbiome analysis, and athletic performance tracking.
 */

import { Router } from 'express';
import * as AdvancedFeaturesController from '../controllers/AdvancedFeaturesController';
import { authenticate } from '../middleware/authorization';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ============================================================================
// STROKE DETECTION ROUTES
// ============================================================================

/**
 * POST /clinical/stroke-detection
 * Analyze brain imaging for stroke detection (with file upload)
 */
router.post(
  '/clinical/stroke-detection',
  AdvancedFeaturesController.uploadStrokeScan,
  AdvancedFeaturesController.analyzeStrokeScan
);

/**
 * GET /clinical/stroke-detection/:analysisId
 * Get stroke detection analysis by ID
 */
router.get(
  '/clinical/stroke-detection/:analysisId',
  AdvancedFeaturesController.getStrokeAnalysis
);

/**
 * GET /clinical/stroke-detection/patient/:patientId
 * Get all stroke analyses for a patient
 */
router.get(
  '/clinical/stroke-detection/patient/:patientId',
  AdvancedFeaturesController.getPatientStrokeHistory
);

// ============================================================================
// WEARABLE DEVICES ROUTES
// ============================================================================

/**
 * GET /wearables/devices/:userId
 * Get all connected wearable devices for a user
 */
router.get(
  '/wearables/devices/:userId',
  AdvancedFeaturesController.getConnectedDevices
);

/**
 * POST /wearables/connect
 * Connect a new wearable device
 */
router.post(
  '/wearables/connect',
  AdvancedFeaturesController.connectDevice
);

/**
 * POST /wearables/sync/:deviceId
 * Sync data from a wearable device
 */
router.post(
  '/wearables/sync/:deviceId',
  AdvancedFeaturesController.syncDevice
);

/**
 * DELETE /wearables/devices/:deviceId
 * Disconnect a wearable device
 */
router.delete(
  '/wearables/devices/:deviceId',
  AdvancedFeaturesController.disconnectDevice
);

/**
 * GET /wearables/realtime/:userId
 * Get real-time biometric data
 */
router.get(
  '/wearables/realtime/:userId',
  AdvancedFeaturesController.getRealtimeBiometrics
);

/**
 * GET /wearables/data-quality/:userId
 * Get data quality metrics
 */
router.get(
  '/wearables/data-quality/:userId',
  AdvancedFeaturesController.getDataQuality
);

// ============================================================================
// BIOMETRIC DATA ROUTES
// ============================================================================

/**
 * POST /biometrics/:userId
 * Submit a single biometric data point
 */
router.post(
  '/biometrics/:userId',
  AdvancedFeaturesController.saveBiometricData
);

/**
 * POST /biometrics/:userId/bulk
 * Bulk upload biometric data points
 */
router.post(
  '/biometrics/:userId/bulk',
  AdvancedFeaturesController.bulkUploadBiometrics
);

/**
 * GET /biometrics/:userId
 * Get biometric data time series
 */
router.get(
  '/biometrics/:userId',
  AdvancedFeaturesController.getBiometricTimeSeries
);

// ============================================================================
// BCI MENTAL HEALTH ROUTES
// ============================================================================

/**
 * GET /bci/metrics/:userId
 * Get BCI mental health metrics
 */
router.get(
  '/bci/metrics/:userId',
  AdvancedFeaturesController.getBCIMetrics
);

/**
 * POST /bci/start-monitoring
 * Start BCI monitoring session
 */
router.post(
  '/bci/start-monitoring',
  AdvancedFeaturesController.startBCIMonitoring
);

/**
 * POST /bci/stop-monitoring/:sessionId
 * Stop BCI monitoring session
 */
router.post(
  '/bci/stop-monitoring/:sessionId',
  AdvancedFeaturesController.stopBCIMonitoring
);

// ============================================================================
// MICROBIOME ANALYSIS ROUTES
// ============================================================================

/**
 * POST /microbiome/order-kit
 * Order a microbiome test kit
 */
router.post(
  '/microbiome/order-kit',
  AdvancedFeaturesController.orderMicrobiomeKit
);

/**
 * GET /microbiome/results/:userId
 * Get microbiome analysis results
 */
router.get(
  '/microbiome/results/:userId',
  AdvancedFeaturesController.getMicrobiomeResults
);

/**
 * GET /microbiome/kit-status/:kitId
 * Get microbiome test kit status
 */
router.get(
  '/microbiome/kit-status/:kitId',
  AdvancedFeaturesController.getMicrobiomeKitStatus
);

// ============================================================================
// ATHLETIC PERFORMANCE ROUTES
// ============================================================================

/**
 * GET /athletic/metrics/:userId
 * Get athletic performance metrics
 */
router.get(
  '/athletic/metrics/:userId',
  AdvancedFeaturesController.getAthleteMetrics
);

// ============================================================================
// HEALTH CHECK ROUTE
// ============================================================================

/**
 * GET /health
 * Get API health status
 */
router.get(
  '/health',
  AdvancedFeaturesController.getHealthStatus
);

export default router;
