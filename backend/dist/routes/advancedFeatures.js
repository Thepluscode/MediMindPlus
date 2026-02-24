"use strict";
/**
 * Advanced Features Routes
 * MediMindPlus - Enterprise Health Platform
 *
 * Routes for stroke detection, wearables, biometrics, BCI monitoring,
 * microbiome analysis, and athletic performance tracking.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdvancedFeaturesController = __importStar(require("../controllers/AdvancedFeaturesController"));
const authorization_1 = require("../middleware/authorization");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(authorization_1.authenticate);
// ============================================================================
// STROKE DETECTION ROUTES
// ============================================================================
/**
 * POST /clinical/stroke-detection
 * Analyze brain imaging for stroke detection (with file upload)
 */
router.post('/clinical/stroke-detection', AdvancedFeaturesController.uploadStrokeScan, AdvancedFeaturesController.analyzeStrokeScan);
/**
 * GET /clinical/stroke-detection/:analysisId
 * Get stroke detection analysis by ID
 */
router.get('/clinical/stroke-detection/:analysisId', AdvancedFeaturesController.getStrokeAnalysis);
/**
 * GET /clinical/stroke-detection/patient/:patientId
 * Get all stroke analyses for a patient
 */
router.get('/clinical/stroke-detection/patient/:patientId', AdvancedFeaturesController.getPatientStrokeHistory);
// ============================================================================
// WEARABLE DEVICES ROUTES
// ============================================================================
/**
 * GET /wearables/devices/:userId
 * Get all connected wearable devices for a user
 */
router.get('/wearables/devices/:userId', AdvancedFeaturesController.getConnectedDevices);
/**
 * POST /wearables/connect
 * Connect a new wearable device
 */
router.post('/wearables/connect', AdvancedFeaturesController.connectDevice);
/**
 * POST /wearables/sync/:deviceId
 * Sync data from a wearable device
 */
router.post('/wearables/sync/:deviceId', AdvancedFeaturesController.syncDevice);
/**
 * DELETE /wearables/devices/:deviceId
 * Disconnect a wearable device
 */
router.delete('/wearables/devices/:deviceId', AdvancedFeaturesController.disconnectDevice);
/**
 * GET /wearables/realtime/:userId
 * Get real-time biometric data
 */
router.get('/wearables/realtime/:userId', AdvancedFeaturesController.getRealtimeBiometrics);
/**
 * GET /wearables/data-quality/:userId
 * Get data quality metrics
 */
router.get('/wearables/data-quality/:userId', AdvancedFeaturesController.getDataQuality);
// ============================================================================
// BIOMETRIC DATA ROUTES
// ============================================================================
/**
 * POST /biometrics/:userId
 * Submit a single biometric data point
 */
router.post('/biometrics/:userId', AdvancedFeaturesController.saveBiometricData);
/**
 * POST /biometrics/:userId/bulk
 * Bulk upload biometric data points
 */
router.post('/biometrics/:userId/bulk', AdvancedFeaturesController.bulkUploadBiometrics);
/**
 * GET /biometrics/:userId
 * Get biometric data time series
 */
router.get('/biometrics/:userId', AdvancedFeaturesController.getBiometricTimeSeries);
// ============================================================================
// BCI MENTAL HEALTH ROUTES
// ============================================================================
/**
 * GET /bci/metrics/:userId
 * Get BCI mental health metrics
 */
router.get('/bci/metrics/:userId', AdvancedFeaturesController.getBCIMetrics);
/**
 * POST /bci/start-monitoring
 * Start BCI monitoring session
 */
router.post('/bci/start-monitoring', AdvancedFeaturesController.startBCIMonitoring);
/**
 * POST /bci/stop-monitoring/:sessionId
 * Stop BCI monitoring session
 */
router.post('/bci/stop-monitoring/:sessionId', AdvancedFeaturesController.stopBCIMonitoring);
// ============================================================================
// MICROBIOME ANALYSIS ROUTES
// ============================================================================
/**
 * POST /microbiome/order-kit
 * Order a microbiome test kit
 */
router.post('/microbiome/order-kit', AdvancedFeaturesController.orderMicrobiomeKit);
/**
 * GET /microbiome/results/:userId
 * Get microbiome analysis results
 */
router.get('/microbiome/results/:userId', AdvancedFeaturesController.getMicrobiomeResults);
/**
 * GET /microbiome/kit-status/:kitId
 * Get microbiome test kit status
 */
router.get('/microbiome/kit-status/:kitId', AdvancedFeaturesController.getMicrobiomeKitStatus);
// ============================================================================
// ATHLETIC PERFORMANCE ROUTES
// ============================================================================
/**
 * GET /athletic/metrics/:userId
 * Get athletic performance metrics
 */
router.get('/athletic/metrics/:userId', AdvancedFeaturesController.getAthleteMetrics);
// ============================================================================
// HEALTH CHECK ROUTE
// ============================================================================
/**
 * GET /health
 * Get API health status
 */
router.get('/health', AdvancedFeaturesController.getHealthStatus);
exports.default = router;
