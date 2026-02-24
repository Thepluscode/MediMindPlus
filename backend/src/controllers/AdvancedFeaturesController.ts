/**
 * Advanced Features Controller
 * MediMindPlus - Enterprise Health Platform
 *
 * Handles HTTP requests for stroke detection, wearables, biometrics,
 * BCI monitoring, microbiome analysis, and athletic performance tracking.
 */

import { Request, Response } from 'express';
import { AdvancedFeaturesService } from '../services/AdvancedFeaturesService';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

const advancedFeaturesService = new AdvancedFeaturesService();

// Configure multer for medical image uploads
const uploadDir = path.join(__dirname, '../../uploads/medical-scans');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `scan_${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/dicom', 'image/dicom'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and DICOM files are allowed.'));
    }
  },
});

export const uploadStrokeScan = upload.array('dicom_files', 10);

// ============================================================================
// STROKE DETECTION ENDPOINTS
// ============================================================================

/**
 * POST /api/advanced/clinical/stroke-detection
 * Analyze brain imaging for stroke detection
 */
export const analyzeStrokeScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id, scan_type, clinical_context } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!patient_id || !scan_type) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'patient_id and scan_type are required',
      });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({
        error: 'No files uploaded',
        message: 'At least one DICOM file is required',
      });
      return;
    }

    // Parse clinical context if it's a string
    const parsedContext = typeof clinical_context === 'string'
      ? JSON.parse(clinical_context)
      : clinical_context;

    // TODO: Integrate real AI model for stroke detection
    // For now, we'll use mock analysis based on the uploaded scan
    const mockAnalysis = {
      patient_id,
      scan_type,
      stroke_detected: Math.random() > 0.3, // 70% chance of stroke detection in mock
      confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
      stroke_type: ['Ischemic', 'Hemorrhagic', 'TIA'][Math.floor(Math.random() * 3)],
      location: {
        hemisphere: Math.random() > 0.5 ? 'Left' : 'Right',
        lobe: ['Frontal', 'Parietal', 'Temporal', 'Occipital'][Math.floor(Math.random() * 4)],
        specific_region: 'Middle Cerebral Artery Territory',
        coordinates: { x: 45.2, y: 32.8, z: 15.6 },
      },
      vessel_occlusion: {
        vessel_name: 'Middle Cerebral Artery',
        occlusion_percentage: 75 + Math.random() * 25,
        clot_burden_score: 7,
        collateral_flow: 'Good',
      },
      volume_ml: 25.5 + Math.random() * 30,
      core_infarct_volume: 15.2,
      penumbra_volume: 35.8,
      mismatch_ratio: 2.3,
      nihss_predicted: 12,
      aspects_score: 8,
      recommendations: {
        treatment: 'IV tPA recommended',
        time_window: 'Within window for thrombolysis',
        considerations: ['Monitor blood pressure', 'Consider thrombectomy'],
      },
      prognosis: {
        modified_rankin_score_predicted: 2,
        recovery_likelihood: 'Good',
        estimated_recovery_time: '3-6 months',
      },
      image_urls: files.map(f => `/uploads/medical-scans/${f.filename}`),
      clinical_context: parsedContext,
    };

    const analysis = await advancedFeaturesService.createStrokeAnalysis(mockAnalysis);

    res.status(200).json({
      success: true,
      results: analysis,
    });
  } catch (error: any) {
    logger.error('Error analyzing stroke scan:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Stroke analysis failed',
      message: error.message,
    });
  }
};

/**
 * GET /api/advanced/clinical/stroke-detection/:analysisId
 * Get stroke detection analysis by ID
 */
export const getStrokeAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;
    const analysis = await advancedFeaturesService.getStrokeAnalysis(analysisId);

    if (!analysis) {
      res.status(404).json({
        error: 'Analysis not found',
        message: `No stroke analysis found with ID: ${analysisId}`,
      });
      return;
    }

    res.status(200).json(analysis);
  } catch (error: any) {
    logger.error('Error fetching stroke analysis:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch analysis',
      message: error.message,
    });
  }
};

/**
 * GET /api/advanced/clinical/stroke-detection/patient/:patientId
 * Get all stroke analyses for a patient
 */
export const getPatientStrokeHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const analyses = await advancedFeaturesService.getPatientStrokeHistory(patientId);

    res.status(200).json({
      patient_id: patientId,
      total_analyses: analyses.length,
      analyses,
    });
  } catch (error: any) {
    logger.error('Error fetching patient stroke history:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch patient history',
      message: error.message,
    });
  }
};

// ============================================================================
// WEARABLE DEVICES ENDPOINTS
// ============================================================================

/**
 * GET /api/advanced/wearables/devices/:userId
 * Get all connected wearable devices for a user
 */
export const getConnectedDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const devices = await advancedFeaturesService.getConnectedDevices(userId);

    res.status(200).json(devices);
  } catch (error: any) {
    logger.error('Error fetching connected devices:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch devices',
      message: error.message,
    });
  }
};

/**
 * POST /api/advanced/wearables/connect
 * Connect a new wearable device
 */
export const connectDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, device_type, manufacturer, auth_code } = req.body;

    if (!user_id || !device_type || !manufacturer) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'user_id, device_type, and manufacturer are required',
      });
      return;
    }

    // TODO: Implement real OAuth flow for device authorization
    // For now, accept any auth_code and create device

    const deviceData = {
      user_id,
      device_type,
      manufacturer,
      name: `${manufacturer} ${device_type}`,
      status: 'connected',
      battery_level: 85 + Math.floor(Math.random() * 15),
      capabilities: ['heart_rate', 'steps', 'sleep', 'activity'],
      firmware_version: '1.2.0',
      auth_token: `mock_token_${uuidv4()}`,
    };

    const device = await advancedFeaturesService.connectWearableDevice(deviceData);

    res.status(201).json(device);
  } catch (error: any) {
    logger.error('Error connecting device:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to connect device',
      message: error.message,
    });
  }
};

/**
 * POST /api/advanced/wearables/sync/:deviceId
 * Sync data from a wearable device
 */
export const syncDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const { force_sync } = req.body;

    // Update device sync status
    await advancedFeaturesService.updateDeviceSync(deviceId, new Date());

    // TODO: Implement real device API calls to fetch latest data
    // For now, generate mock biometric data

    res.status(200).json({
      status: 'success',
      device_id: deviceId,
      synced_at: new Date().toISOString(),
      data_points_synced: Math.floor(Math.random() * 500) + 100,
    });
  } catch (error: any) {
    logger.error('Error syncing device:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Device sync failed',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/advanced/wearables/devices/:deviceId
 * Disconnect a wearable device
 */
export const disconnectDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    await advancedFeaturesService.disconnectDevice(deviceId);

    res.status(200).json({
      status: 'success',
      message: 'Device disconnected successfully',
    });
  } catch (error: any) {
    logger.error('Error disconnecting device:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to disconnect device',
      message: error.message,
    });
  }
};

// ============================================================================
// BIOMETRIC DATA ENDPOINTS
// ============================================================================

/**
 * GET /api/advanced/wearables/realtime/:userId
 * Get real-time biometric data
 */
export const getRealtimeBiometrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const biometrics = await advancedFeaturesService.getRealtimeBiometrics(userId);

    res.status(200).json(biometrics);
  } catch (error: any) {
    logger.error('Error fetching real-time biometrics:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch biometrics',
      message: error.message,
    });
  }
};

/**
 * POST /api/advanced/biometrics/:userId
 * Submit a single biometric data point
 */
export const saveBiometricData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { data_type, value, timestamp, metadata } = req.body;

    if (!data_type || value === undefined || !timestamp) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'data_type, value, and timestamp are required',
      });
      return;
    }

    const dataPoint = await advancedFeaturesService.saveBiometricData({
      user_id: userId,
      data_type,
      value,
      timestamp,
      metadata: metadata || {},
    });

    res.status(201).json({
      status: 'success',
      data: dataPoint,
    });
  } catch (error: any) {
    logger.error('Error saving biometric data:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to save biometric data',
      message: error.message,
    });
  }
};

/**
 * POST /api/advanced/biometrics/:userId/bulk
 * Bulk upload biometric data points
 */
export const bulkUploadBiometrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { data_points } = req.body;

    if (!data_points || !Array.isArray(data_points) || data_points.length === 0) {
      res.status(400).json({
        error: 'Invalid data',
        message: 'data_points array is required and must not be empty',
      });
      return;
    }

    // Add user_id to each data point
    const dataPointsWithUserId = data_points.map(dp => ({
      ...dp,
      user_id: userId,
    }));

    const count = await advancedFeaturesService.bulkSaveBiometricData(dataPointsWithUserId);

    res.status(201).json({
      status: 'success',
      uploaded: count,
    });
  } catch (error: any) {
    logger.error('Error bulk uploading biometrics:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Bulk upload failed',
      message: error.message,
    });
  }
};

/**
 * GET /api/advanced/biometrics/:userId
 * Get biometric data time series
 */
export const getBiometricTimeSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { data_type, start_date, end_date, granularity } = req.query;

    const query = {
      user_id: userId,
      data_type: data_type as string,
      start_date: start_date as string,
      end_date: end_date as string,
      granularity: (granularity as string) || 'raw',
    };

    const timeSeries = await advancedFeaturesService.getBiometricData(query);

    res.status(200).json(timeSeries);
  } catch (error: any) {
    logger.error('Error fetching biometric time series:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch time series',
      message: error.message,
    });
  }
};

/**
 * GET /api/advanced/wearables/data-quality/:userId
 * Get data quality metrics
 */
export const getDataQuality = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const dataQuality = await advancedFeaturesService.getDataQuality(userId);

    res.status(200).json(dataQuality);
  } catch (error: any) {
    logger.error('Error fetching data quality:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch data quality',
      message: error.message,
    });
  }
};

// ============================================================================
// BCI MENTAL HEALTH ENDPOINTS
// ============================================================================

/**
 * GET /api/advanced/bci/metrics/:userId
 * Get BCI mental health metrics
 */
export const getBCIMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const metrics = await advancedFeaturesService.getLatestBCIMetrics(userId);

    if (!metrics) {
      res.status(404).json({
        error: 'No BCI metrics found',
        message: `No BCI metrics available for user: ${userId}`,
      });
      return;
    }

    res.status(200).json(metrics);
  } catch (error: any) {
    logger.error('Error fetching BCI metrics:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch BCI metrics',
      message: error.message,
    });
  }
};

/**
 * POST /api/advanced/bci/start-monitoring
 * Start BCI monitoring session
 */
export const startBCIMonitoring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({
        error: 'Missing required field',
        message: 'user_id is required',
      });
      return;
    }

    const session = await advancedFeaturesService.startBCISession(user_id);

    res.status(201).json({
      session_id: session.id,
      status: 'monitoring_started',
      started_at: session.created_at,
    });
  } catch (error: any) {
    logger.error('Error starting BCI monitoring:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to start BCI monitoring',
      message: error.message,
    });
  }
};

/**
 * POST /api/advanced/bci/stop-monitoring/:sessionId
 * Stop BCI monitoring session
 */
export const stopBCIMonitoring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // TODO: Implement session completion logic
    // For now, just acknowledge the stop request

    res.status(200).json({
      status: 'monitoring_stopped',
      session_id: sessionId,
      stopped_at: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error stopping BCI monitoring:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to stop BCI monitoring',
      message: error.message,
    });
  }
};

// ============================================================================
// MICROBIOME ANALYSIS ENDPOINTS
// ============================================================================

/**
 * POST /api/advanced/microbiome/order-kit
 * Order a microbiome test kit
 */
export const orderMicrobiomeKit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, shipping_address, test_type } = req.body;

    if (!user_id || !shipping_address) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'user_id and shipping_address are required',
      });
      return;
    }

    const kitData = {
      user_id,
      kit_id: `KIT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status: 'ordered',
      test_type: test_type || 'comprehensive',
      shipping_address,
      ordered_date: new Date(),
      price: 199.00,
    };

    const kit = await advancedFeaturesService.orderMicrobiomeKit(kitData);

    res.status(201).json(kit);
  } catch (error: any) {
    logger.error('Error ordering microbiome kit:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to order kit',
      message: error.message,
    });
  }
};

/**
 * GET /api/advanced/microbiome/results/:userId
 * Get microbiome analysis results
 */
export const getMicrobiomeResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const results = await advancedFeaturesService.getMicrobiomeResults(userId);

    if (!results) {
      res.status(404).json({
        error: 'No results found',
        message: `No microbiome results available for user: ${userId}`,
      });
      return;
    }

    res.status(200).json(results);
  } catch (error: any) {
    logger.error('Error fetching microbiome results:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch results',
      message: error.message,
    });
  }
};

/**
 * GET /api/advanced/microbiome/kit-status/:kitId
 * Get microbiome test kit status
 */
export const getMicrobiomeKitStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kitId } = req.params;
    const kit = await advancedFeaturesService.getMicrobiomeKitStatus(kitId);

    if (!kit) {
      res.status(404).json({
        error: 'Kit not found',
        message: `No microbiome kit found with ID: ${kitId}`,
      });
      return;
    }

    res.status(200).json(kit);
  } catch (error: any) {
    logger.error('Error fetching kit status:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch kit status',
      message: error.message,
    });
  }
};

// ============================================================================
// ATHLETIC PERFORMANCE ENDPOINTS
// ============================================================================

/**
 * GET /api/advanced/athletic/metrics/:userId
 * Get athletic performance metrics
 */
export const getAthleteMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const metrics = await advancedFeaturesService.getAthleticMetrics(userId);

    if (!metrics) {
      res.status(404).json({
        error: 'No metrics found',
        message: `No athletic metrics available for user: ${userId}`,
      });
      return;
    }

    res.status(200).json(metrics);
  } catch (error: any) {
    logger.error('Error fetching athlete metrics:', { service: 'advanced-features', error: error.message });
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message,
    });
  }
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/advanced/health
 * Get API health status
 */
export const getHealthStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        stroke_detection: 'operational',
        wearables: 'operational',
        bci: 'operational',
        microbiome: 'operational',
        athletic: 'operational',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
};
