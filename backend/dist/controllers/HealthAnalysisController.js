"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFrames = exports.uploadAudio = exports.HealthAnalysisController = void 0;
const HealthAnalysisService_1 = require("../services/HealthAnalysisService");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
// Multer configuration for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: async (req, file, cb) => {
            const uploadDir = path_1.default.join(__dirname, '../../uploads');
            await promises_1.default.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
        },
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
        const allowedAudioTypes = /m4a|mp3|wav|aac/;
        const allowedImageTypes = /jpg|jpeg|png/;
        const extname = path_1.default.extname(file.originalname).toLowerCase().slice(1);
        if (file.fieldname === 'audio' && allowedAudioTypes.test(extname)) {
            cb(null, true);
        }
        else if (file.fieldname === 'frames' && allowedImageTypes.test(extname)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    },
});
class HealthAnalysisController {
    constructor() {
        /**
         * Analyze voice biomarkers from audio file
         * POST /api/voice/analyze
         */
        this.analyzeVoice = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                // File is uploaded via multer middleware
                const audioFile = req.file;
                if (!audioFile) {
                    res.status(400).json({ error: 'No audio file provided' });
                    return;
                }
                logger_1.logger.info(`Analyzing voice for user ${userId}`, {
                    filename: audioFile.filename,
                    size: audioFile.size,
                });
                // Process voice analysis
                const result = await this.service.analyzeVoice(userId, audioFile.path);
                // Clean up uploaded file
                await promises_1.default.unlink(audioFile.path);
                res.status(200).json(result);
            }
            catch (error) {
                logger_1.logger.error('Voice analysis failed:', error);
                res.status(500).json({
                    error: 'Voice analysis failed',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Analyze health markers from camera frames
         * POST /api/camera/analyze
         */
        this.analyzeCameraFrames = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                // Multiple frames uploaded via multer
                const frames = req.files;
                if (!frames || frames.length === 0) {
                    res.status(400).json({ error: 'No frames provided' });
                    return;
                }
                const { frameCount, timestamp } = req.body;
                logger_1.logger.info(`Analyzing ${frames.length} camera frames for user ${userId}`);
                // Process camera analysis
                const framePaths = frames.map((f) => f.path);
                const result = await this.service.analyzeCameraFrames(userId, framePaths, {
                    frameCount: parseInt(frameCount) || frames.length,
                    timestamp: timestamp || new Date().toISOString(),
                });
                // Clean up uploaded frames
                for (const framePath of framePaths) {
                    await promises_1.default.unlink(framePath);
                }
                res.status(200).json(result);
            }
            catch (error) {
                logger_1.logger.error('Camera analysis failed:', error);
                res.status(500).json({
                    error: 'Camera analysis failed',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Get health metrics for a user
         * GET /api/health-metrics
         */
        this.getHealthMetrics = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const { days = 7 } = req.query;
                const metrics = await this.service.getHealthMetrics(userId, parseInt(days));
                res.status(200).json({ metrics });
            }
            catch (error) {
                logger_1.logger.error('Failed to fetch health metrics:', error);
                res.status(500).json({
                    error: 'Failed to fetch health metrics',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Save health metrics
         * POST /api/health-metrics
         */
        this.saveHealthMetrics = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const HealthMetricsSchema = zod_1.z.object({
                    metrics: zod_1.z.object({
                        heartRate: zod_1.z.number().optional(),
                        heartRateVariability: zod_1.z.number().optional(),
                        steps: zod_1.z.number().optional(),
                        activeEnergyBurned: zod_1.z.number().optional(),
                        bloodPressure: zod_1.z.object({
                            systolic: zod_1.z.number(),
                            diastolic: zod_1.z.number(),
                        }).optional(),
                        bloodGlucose: zod_1.z.number().optional(),
                        bodyTemperature: zod_1.z.number().optional(),
                        oxygenSaturation: zod_1.z.number().optional(),
                        respiratoryRate: zod_1.z.number().optional(),
                        sleepAnalysis: zod_1.z.object({
                            asleep: zod_1.z.number(),
                            awake: zod_1.z.number(),
                            inBed: zod_1.z.number(),
                        }).optional(),
                        weight: zod_1.z.number().optional(),
                        height: zod_1.z.number().optional(),
                        bmi: zod_1.z.number().optional(),
                    }),
                    timestamp: zod_1.z.string(),
                    source: zod_1.z.enum(['apple_health', 'google_fit', 'manual', 'device']),
                });
                const validatedData = HealthMetricsSchema.parse(req.body);
                const result = await this.service.saveHealthMetrics(userId, validatedData.metrics, validatedData.source, validatedData.timestamp);
                res.status(201).json(result);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({
                        error: 'Validation failed',
                        details: error.errors,
                    });
                    return;
                }
                logger_1.logger.error('Failed to save health metrics:', error);
                res.status(500).json({
                    error: 'Failed to save health metrics',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Get infection risk score
         * GET /api/infection/risk-score
         */
        this.getInfectionRiskScore = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const riskScore = await this.service.calculateInfectionRisk(userId);
                res.status(200).json(riskScore);
            }
            catch (error) {
                logger_1.logger.error('Failed to calculate infection risk:', error);
                res.status(500).json({
                    error: 'Failed to calculate infection risk',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Get early warning signals
         * GET /api/infection/early-warnings
         */
        this.getEarlyWarnings = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const warnings = await this.service.getEarlyWarnings(userId);
                res.status(200).json({ warnings });
            }
            catch (error) {
                logger_1.logger.error('Failed to fetch early warnings:', error);
                res.status(500).json({
                    error: 'Failed to fetch early warnings',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Get nearby outbreaks
         * GET /api/infection/outbreaks
         */
        this.getNearbyOutbreaks = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const { latitude, longitude, radius = 50 } = req.query;
                const outbreaks = await this.service.getNearbyOutbreaks({
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    radius: parseFloat(radius),
                });
                res.status(200).json({ outbreaks });
            }
            catch (error) {
                logger_1.logger.error('Failed to fetch outbreaks:', error);
                res.status(500).json({
                    error: 'Failed to fetch outbreaks',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Get infection biometrics history
         * GET /api/infection/biometrics
         */
        this.getInfectionBiometrics = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const { days = 7 } = req.query;
                const biometrics = await this.service.getInfectionBiometrics(userId, parseInt(days));
                res.status(200).json({ biometrics });
            }
            catch (error) {
                logger_1.logger.error('Failed to fetch infection biometrics:', error);
                res.status(500).json({
                    error: 'Failed to fetch infection biometrics',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Get cancer screening data
         * GET /api/cancer/screening
         */
        this.getCancerScreening = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const screeningData = await this.service.getCancerScreening(userId);
                res.status(200).json(screeningData);
            }
            catch (error) {
                logger_1.logger.error('Failed to fetch cancer screening data:', error);
                res.status(500).json({
                    error: 'Failed to fetch cancer screening data',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        /**
         * Get genetic risk assessment
         * GET /api/cancer/genetic-risk
         */
        this.getGeneticRisk = async (req, res) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const geneticRisk = await this.service.getGeneticRisk(userId);
                res.status(200).json(geneticRisk);
            }
            catch (error) {
                logger_1.logger.error('Failed to fetch genetic risk:', error);
                res.status(500).json({
                    error: 'Failed to fetch genetic risk',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };
        this.service = new HealthAnalysisService_1.HealthAnalysisService();
    }
}
exports.HealthAnalysisController = HealthAnalysisController;
// Export multer middleware for routes
exports.uploadAudio = upload.single('audio');
exports.uploadFrames = upload.array('frames', 50);
