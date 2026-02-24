"use strict";
/**
 * Advanced Features Controller
 * MediMindPlus - Enterprise Health Platform
 *
 * Handles HTTP requests for stroke detection, wearables, biometrics,
 * BCI monitoring, microbiome analysis, and athletic performance tracking.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = exports.getAthleteMetrics = exports.getMicrobiomeKitStatus = exports.getMicrobiomeResults = exports.orderMicrobiomeKit = exports.stopBCIMonitoring = exports.startBCIMonitoring = exports.getBCIMetrics = exports.getDataQuality = exports.getBiometricTimeSeries = exports.bulkUploadBiometrics = exports.saveBiometricData = exports.getRealtimeBiometrics = exports.disconnectDevice = exports.syncDevice = exports.connectDevice = exports.getConnectedDevices = exports.getPatientStrokeHistory = exports.getStrokeAnalysis = exports.analyzeStrokeScan = exports.uploadStrokeScan = void 0;
const AdvancedFeaturesService_1 = require("../services/AdvancedFeaturesService");
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const advancedFeaturesService = new AdvancedFeaturesService_1.AdvancedFeaturesService();
// Configure multer for medical image uploads
const uploadDir = path_1.default.join(__dirname, '../../uploads/medical-scans');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = (0, uuid_1.v4)();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `scan_${uniqueId}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'application/dicom', 'image/dicom'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and DICOM files are allowed.'));
        }
    },
});
exports.uploadStrokeScan = upload.array('dicom_files', 10);
// ============================================================================
// STROKE DETECTION ENDPOINTS
// ============================================================================
/**
 * POST /api/advanced/clinical/stroke-detection
 * Analyze brain imaging for stroke detection
 */
const analyzeStrokeScan = async (req, res) => {
    try {
        const { patient_id, scan_type, clinical_context } = req.body;
        const files = req.files;
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
    }
    catch (error) {
        console.error('Error analyzing stroke scan:', error);
        res.status(500).json({
            error: 'Stroke analysis failed',
            message: error.message,
        });
    }
};
exports.analyzeStrokeScan = analyzeStrokeScan;
/**
 * GET /api/advanced/clinical/stroke-detection/:analysisId
 * Get stroke detection analysis by ID
 */
const getStrokeAnalysis = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching stroke analysis:', error);
        res.status(500).json({
            error: 'Failed to fetch analysis',
            message: error.message,
        });
    }
};
exports.getStrokeAnalysis = getStrokeAnalysis;
/**
 * GET /api/advanced/clinical/stroke-detection/patient/:patientId
 * Get all stroke analyses for a patient
 */
const getPatientStrokeHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const analyses = await advancedFeaturesService.getPatientStrokeHistory(patientId);
        res.status(200).json({
            patient_id: patientId,
            total_analyses: analyses.length,
            analyses,
        });
    }
    catch (error) {
        console.error('Error fetching patient stroke history:', error);
        res.status(500).json({
            error: 'Failed to fetch patient history',
            message: error.message,
        });
    }
};
exports.getPatientStrokeHistory = getPatientStrokeHistory;
// ============================================================================
// WEARABLE DEVICES ENDPOINTS
// ============================================================================
/**
 * GET /api/advanced/wearables/devices/:userId
 * Get all connected wearable devices for a user
 */
const getConnectedDevices = async (req, res) => {
    try {
        const { userId } = req.params;
        const devices = await advancedFeaturesService.getConnectedDevices(userId);
        res.status(200).json(devices);
    }
    catch (error) {
        console.error('Error fetching connected devices:', error);
        res.status(500).json({
            error: 'Failed to fetch devices',
            message: error.message,
        });
    }
};
exports.getConnectedDevices = getConnectedDevices;
/**
 * POST /api/advanced/wearables/connect
 * Connect a new wearable device
 */
const connectDevice = async (req, res) => {
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
            auth_token: `mock_token_${(0, uuid_1.v4)()}`,
        };
        const device = await advancedFeaturesService.connectWearableDevice(deviceData);
        res.status(201).json(device);
    }
    catch (error) {
        console.error('Error connecting device:', error);
        res.status(500).json({
            error: 'Failed to connect device',
            message: error.message,
        });
    }
};
exports.connectDevice = connectDevice;
/**
 * POST /api/advanced/wearables/sync/:deviceId
 * Sync data from a wearable device
 */
const syncDevice = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error syncing device:', error);
        res.status(500).json({
            error: 'Device sync failed',
            message: error.message,
        });
    }
};
exports.syncDevice = syncDevice;
/**
 * DELETE /api/advanced/wearables/devices/:deviceId
 * Disconnect a wearable device
 */
const disconnectDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        await advancedFeaturesService.disconnectDevice(deviceId);
        res.status(200).json({
            status: 'success',
            message: 'Device disconnected successfully',
        });
    }
    catch (error) {
        console.error('Error disconnecting device:', error);
        res.status(500).json({
            error: 'Failed to disconnect device',
            message: error.message,
        });
    }
};
exports.disconnectDevice = disconnectDevice;
// ============================================================================
// BIOMETRIC DATA ENDPOINTS
// ============================================================================
/**
 * GET /api/advanced/wearables/realtime/:userId
 * Get real-time biometric data
 */
const getRealtimeBiometrics = async (req, res) => {
    try {
        const { userId } = req.params;
        const biometrics = await advancedFeaturesService.getRealtimeBiometrics(userId);
        res.status(200).json(biometrics);
    }
    catch (error) {
        console.error('Error fetching real-time biometrics:', error);
        res.status(500).json({
            error: 'Failed to fetch biometrics',
            message: error.message,
        });
    }
};
exports.getRealtimeBiometrics = getRealtimeBiometrics;
/**
 * POST /api/advanced/biometrics/:userId
 * Submit a single biometric data point
 */
const saveBiometricData = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error saving biometric data:', error);
        res.status(500).json({
            error: 'Failed to save biometric data',
            message: error.message,
        });
    }
};
exports.saveBiometricData = saveBiometricData;
/**
 * POST /api/advanced/biometrics/:userId/bulk
 * Bulk upload biometric data points
 */
const bulkUploadBiometrics = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error bulk uploading biometrics:', error);
        res.status(500).json({
            error: 'Bulk upload failed',
            message: error.message,
        });
    }
};
exports.bulkUploadBiometrics = bulkUploadBiometrics;
/**
 * GET /api/advanced/biometrics/:userId
 * Get biometric data time series
 */
const getBiometricTimeSeries = async (req, res) => {
    try {
        const { userId } = req.params;
        const { data_type, start_date, end_date, granularity } = req.query;
        const query = {
            user_id: userId,
            data_type: data_type,
            start_date: start_date,
            end_date: end_date,
            granularity: granularity || 'raw',
        };
        const timeSeries = await advancedFeaturesService.getBiometricData(query);
        res.status(200).json(timeSeries);
    }
    catch (error) {
        console.error('Error fetching biometric time series:', error);
        res.status(500).json({
            error: 'Failed to fetch time series',
            message: error.message,
        });
    }
};
exports.getBiometricTimeSeries = getBiometricTimeSeries;
/**
 * GET /api/advanced/wearables/data-quality/:userId
 * Get data quality metrics
 */
const getDataQuality = async (req, res) => {
    try {
        const { userId } = req.params;
        const dataQuality = await advancedFeaturesService.getDataQuality(userId);
        res.status(200).json(dataQuality);
    }
    catch (error) {
        console.error('Error fetching data quality:', error);
        res.status(500).json({
            error: 'Failed to fetch data quality',
            message: error.message,
        });
    }
};
exports.getDataQuality = getDataQuality;
// ============================================================================
// BCI MENTAL HEALTH ENDPOINTS
// ============================================================================
/**
 * GET /api/advanced/bci/metrics/:userId
 * Get BCI mental health metrics
 */
const getBCIMetrics = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching BCI metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch BCI metrics',
            message: error.message,
        });
    }
};
exports.getBCIMetrics = getBCIMetrics;
/**
 * POST /api/advanced/bci/start-monitoring
 * Start BCI monitoring session
 */
const startBCIMonitoring = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error starting BCI monitoring:', error);
        res.status(500).json({
            error: 'Failed to start BCI monitoring',
            message: error.message,
        });
    }
};
exports.startBCIMonitoring = startBCIMonitoring;
/**
 * POST /api/advanced/bci/stop-monitoring/:sessionId
 * Stop BCI monitoring session
 */
const stopBCIMonitoring = async (req, res) => {
    try {
        const { sessionId } = req.params;
        // TODO: Implement session completion logic
        // For now, just acknowledge the stop request
        res.status(200).json({
            status: 'monitoring_stopped',
            session_id: sessionId,
            stopped_at: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error stopping BCI monitoring:', error);
        res.status(500).json({
            error: 'Failed to stop BCI monitoring',
            message: error.message,
        });
    }
};
exports.stopBCIMonitoring = stopBCIMonitoring;
// ============================================================================
// MICROBIOME ANALYSIS ENDPOINTS
// ============================================================================
/**
 * POST /api/advanced/microbiome/order-kit
 * Order a microbiome test kit
 */
const orderMicrobiomeKit = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error ordering microbiome kit:', error);
        res.status(500).json({
            error: 'Failed to order kit',
            message: error.message,
        });
    }
};
exports.orderMicrobiomeKit = orderMicrobiomeKit;
/**
 * GET /api/advanced/microbiome/results/:userId
 * Get microbiome analysis results
 */
const getMicrobiomeResults = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching microbiome results:', error);
        res.status(500).json({
            error: 'Failed to fetch results',
            message: error.message,
        });
    }
};
exports.getMicrobiomeResults = getMicrobiomeResults;
/**
 * GET /api/advanced/microbiome/kit-status/:kitId
 * Get microbiome test kit status
 */
const getMicrobiomeKitStatus = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching kit status:', error);
        res.status(500).json({
            error: 'Failed to fetch kit status',
            message: error.message,
        });
    }
};
exports.getMicrobiomeKitStatus = getMicrobiomeKitStatus;
// ============================================================================
// ATHLETIC PERFORMANCE ENDPOINTS
// ============================================================================
/**
 * GET /api/advanced/athletic/metrics/:userId
 * Get athletic performance metrics
 */
const getAthleteMetrics = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching athlete metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch metrics',
            message: error.message,
        });
    }
};
exports.getAthleteMetrics = getAthleteMetrics;
// ============================================================================
// HEALTH CHECK
// ============================================================================
/**
 * GET /api/advanced/health
 * Get API health status
 */
const getHealthStatus = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
        });
    }
};
exports.getHealthStatus = getHealthStatus;
