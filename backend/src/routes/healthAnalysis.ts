import { Router } from 'express';
import { HealthAnalysisController, uploadAudio, uploadFrames } from '../controllers/HealthAnalysisController';
import { authenticate } from '../middleware/authorization';

const router = Router();
const controller = new HealthAnalysisController();

// All routes require authentication
router.use(authenticate);

/**
 * Voice Analysis Routes
 */

/**
 * @route POST /api/voice/analyze
 * @desc Analyze voice biomarkers from audio file
 * @access Authenticated users
 */
router.post('/voice/analyze', uploadAudio, controller.analyzeVoice);

/**
 * Camera Analysis Routes
 */

/**
 * @route POST /api/camera/analyze
 * @desc Analyze health markers from camera frames
 * @access Authenticated users
 */
router.post('/camera/analyze', uploadFrames, controller.analyzeCameraFrames);

/**
 * Health Metrics Routes
 */

/**
 * @route GET /api/health-metrics
 * @desc Get health metrics history
 * @access Authenticated users
 * @query days - Number of days to retrieve (default: 7)
 */
router.get('/health-metrics', controller.getHealthMetrics);

/**
 * @route POST /api/health-metrics
 * @desc Save health metrics
 * @access Authenticated users
 */
router.post('/health-metrics', controller.saveHealthMetrics);

/**
 * Infection Detection Routes
 */

/**
 * @route GET /api/infection/risk-score
 * @desc Get infection risk score
 * @access Authenticated users
 */
router.get('/infection/risk-score', controller.getInfectionRiskScore);

/**
 * @route GET /api/infection/early-warnings
 * @desc Get early warning signals
 * @access Authenticated users
 */
router.get('/infection/early-warnings', controller.getEarlyWarnings);

/**
 * @route GET /api/infection/outbreaks
 * @desc Get nearby disease outbreaks
 * @access Authenticated users
 * @query latitude - User's latitude
 * @query longitude - User's longitude
 * @query radius - Search radius in km (default: 50)
 */
router.get('/infection/outbreaks', controller.getNearbyOutbreaks);

/**
 * @route GET /api/infection/biometrics
 * @desc Get infection-relevant biometrics history
 * @access Authenticated users
 * @query days - Number of days to retrieve (default: 7)
 */
router.get('/infection/biometrics', controller.getInfectionBiometrics);

/**
 * Cancer Detection Routes
 */

/**
 * @route GET /api/cancer/screening
 * @desc Get cancer screening data
 * @access Authenticated users
 */
router.get('/cancer/screening', controller.getCancerScreening);

/**
 * @route GET /api/cancer/genetic-risk
 * @desc Get genetic risk assessment
 * @access Authenticated users
 */
router.get('/cancer/genetic-risk', controller.getGeneticRisk);

export default router;
