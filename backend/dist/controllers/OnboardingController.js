"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const OnboardingService_1 = require("../services/OnboardingService");
const AuditService_1 = require("../services/AuditService");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
// Validation schemas
const ProfileDataSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    age: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional(),
    height: zod_1.z.number().optional(),
    weight: zod_1.z.number().optional(),
    medical_history: zod_1.z.array(zod_1.z.string()).optional(),
    medications: zod_1.z.array(zod_1.z.string()).optional(),
    allergies: zod_1.z.array(zod_1.z.string()).optional(),
    family_history: zod_1.z.array(zod_1.z.string()).optional(),
});
const ConsentDataSchema = zod_1.z.object({
    data_processing: zod_1.z.boolean(),
    data_sharing: zod_1.z.boolean().optional(),
    research_participation: zod_1.z.boolean().optional(),
    marketing: zod_1.z.boolean().optional(),
    consent_version: zod_1.z.string(),
});
const MedicalRecordSchema = zod_1.z.object({
    provider_name: zod_1.z.string(),
    provider_type: zod_1.z.enum(['EMR', 'PHR', 'DEVICE']),
    connection_metadata: zod_1.z.object({}).passthrough().optional(),
});
const DeviceSchema = zod_1.z.object({
    device_name: zod_1.z.string(),
    device_type: zod_1.z.enum(['FITNESS_TRACKER', 'MEDICAL_DEVICE', 'SMART_HOME']),
    device_id: zod_1.z.string(),
    device_metadata: zod_1.z.object({}).passthrough().optional(),
    metrics_tracked: zod_1.z.array(zod_1.z.string()).optional(),
});
const HealthGoalSchema = zod_1.z.object({
    goal_category: zod_1.z.enum(['Prevention', 'Wellness', 'Performance', 'Management']),
    goal_name: zod_1.z.string(),
    goal_description: zod_1.z.string().optional(),
    target_metrics: zod_1.z.object({}).passthrough().optional(),
    target_date: zod_1.z.string().optional(),
});
class OnboardingController {
    constructor() {
        /**
         * Get current onboarding status
         * GET /api/onboarding/status
         */
        this.getOnboardingStatus = async (req, res) => {
            try {
                const userId = req.user.id;
                const status = await this.onboardingService.getOnboardingStatus(userId);
                res.json({
                    success: true,
                    data: status,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting onboarding status:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get onboarding status',
                });
            }
        };
        /**
         * Start or resume onboarding
         * POST /api/onboarding/start
         */
        this.startOnboarding = async (req, res) => {
            try {
                const userId = req.user.id;
                const onboarding = await this.onboardingService.startOnboarding(userId);
                // Audit log
                await this.auditService.log({
                    user_id: userId,
                    action: 'onboarding_started',
                    resource_type: 'patient_onboarding',
                    resource_id: onboarding.id,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: onboarding,
                });
            }
            catch (error) {
                logger_1.logger.error('Error starting onboarding:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to start onboarding',
                });
            }
        };
        /**
         * Update current step
         * PUT /api/onboarding/step
         */
        this.updateStep = async (req, res) => {
            try {
                const userId = req.user.id;
                const { step } = req.body;
                if (typeof step !== 'number' || step < 0 || step > 7) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid step number',
                    });
                }
                const updated = await this.onboardingService.updateStep(userId, step);
                res.json({
                    success: true,
                    data: updated,
                });
            }
            catch (error) {
                logger_1.logger.error('Error updating onboarding step:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to update step',
                });
            }
        };
        /**
         * Save profile data
         * PUT /api/onboarding/profile
         */
        this.saveProfile = async (req, res) => {
            try {
                const userId = req.user.id;
                const profileData = req.body;
                // Validate
                const validated = ProfileDataSchema.parse(profileData);
                const updated = await this.onboardingService.saveProfileData(userId, validated);
                // Audit log
                await this.auditService.log({
                    user_id: userId,
                    action: 'profile_updated',
                    resource_type: 'patient_onboarding',
                    resource_id: updated.id,
                    details: { fields: Object.keys(validated) },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: updated,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid profile data',
                        details: error.errors,
                    });
                }
                logger_1.logger.error('Error saving profile:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to save profile',
                });
            }
        };
        /**
         * Save consent data
         * POST /api/onboarding/consent
         */
        this.saveConsent = async (req, res) => {
            var _a;
            try {
                const userId = req.user.id;
                const consentData = req.body;
                // Validate
                const validated = ConsentDataSchema.parse(consentData);
                const consents = await this.onboardingService.saveConsentData(userId, validated, req.ip, req.headers['user-agent']);
                // Audit log - HIPAA compliance
                await this.auditService.log({
                    user_id: userId,
                    action: 'consent_given',
                    resource_type: 'user_consent',
                    resource_id: (_a = consents[0]) === null || _a === void 0 ? void 0 : _a.id,
                    details: {
                        consents: Object.keys(validated).filter((key) => validated[key] === true),
                    },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                    is_phi_access: true,
                });
                res.json({
                    success: true,
                    data: consents,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid consent data',
                        details: error.errors,
                    });
                }
                logger_1.logger.error('Error saving consent:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to save consent',
                });
            }
        };
        /**
         * Connect medical record provider
         * POST /api/onboarding/medical-records
         */
        this.connectMedicalRecord = async (req, res) => {
            try {
                const userId = req.user.id;
                const recordData = req.body;
                // Validate
                const validated = MedicalRecordSchema.parse(recordData);
                const connection = await this.onboardingService.connectMedicalRecord(userId, validated);
                // Audit log
                await this.auditService.log({
                    user_id: userId,
                    action: 'medical_record_connected',
                    resource_type: 'medical_record_connection',
                    resource_id: connection.id,
                    details: { provider: validated.provider_name },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: connection,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid medical record data',
                        details: error.errors,
                    });
                }
                logger_1.logger.error('Error connecting medical record:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to connect medical record',
                });
            }
        };
        /**
         * Get connected medical records
         * GET /api/onboarding/medical-records
         */
        this.getMedicalRecords = async (req, res) => {
            try {
                const userId = req.user.id;
                const connections = await this.onboardingService.getMedicalRecordConnections(userId);
                res.json({
                    success: true,
                    data: connections,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting medical records:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get medical records',
                });
            }
        };
        /**
         * Connect device
         * POST /api/onboarding/devices
         */
        this.connectDevice = async (req, res) => {
            try {
                const userId = req.user.id;
                const deviceData = req.body;
                // Validate
                const validated = DeviceSchema.parse(deviceData);
                const device = await this.onboardingService.connectDevice(userId, validated);
                // Audit log
                await this.auditService.log({
                    user_id: userId,
                    action: 'device_connected',
                    resource_type: 'connected_device',
                    resource_id: device.id,
                    details: {
                        device_name: validated.device_name,
                        device_type: validated.device_type,
                    },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: device,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid device data',
                        details: error.errors,
                    });
                }
                logger_1.logger.error('Error connecting device:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to connect device',
                });
            }
        };
        /**
         * Get connected devices
         * GET /api/onboarding/devices
         */
        this.getDevices = async (req, res) => {
            try {
                const userId = req.user.id;
                const devices = await this.onboardingService.getConnectedDevices(userId);
                res.json({
                    success: true,
                    data: devices,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting devices:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get devices',
                });
            }
        };
        /**
         * Disconnect device
         * DELETE /api/onboarding/devices/:deviceId
         */
        this.disconnectDevice = async (req, res) => {
            try {
                const userId = req.user.id;
                const { deviceId } = req.params;
                await this.onboardingService.disconnectDevice(userId, deviceId);
                // Audit log
                await this.auditService.log({
                    user_id: userId,
                    action: 'device_disconnected',
                    resource_type: 'connected_device',
                    resource_id: deviceId,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    message: 'Device disconnected successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error disconnecting device:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to disconnect device',
                });
            }
        };
        /**
         * Add health goal
         * POST /api/onboarding/goals
         */
        this.addHealthGoal = async (req, res) => {
            try {
                const userId = req.user.id;
                const goalData = req.body;
                // Validate
                const validated = HealthGoalSchema.parse(goalData);
                const goal = await this.onboardingService.addHealthGoal(userId, validated);
                // Audit log
                await this.auditService.log({
                    user_id: userId,
                    action: 'health_goal_added',
                    resource_type: 'health_goal',
                    resource_id: goal.id,
                    details: {
                        goal_category: validated.goal_category,
                        goal_name: validated.goal_name,
                    },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: goal,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid goal data',
                        details: error.errors,
                    });
                }
                logger_1.logger.error('Error adding health goal:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to add health goal',
                });
            }
        };
        /**
         * Get health goals
         * GET /api/onboarding/goals
         */
        this.getHealthGoals = async (req, res) => {
            try {
                const userId = req.user.id;
                const goals = await this.onboardingService.getHealthGoals(userId);
                res.json({
                    success: true,
                    data: goals,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting health goals:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get health goals',
                });
            }
        };
        /**
         * Complete onboarding
         * POST /api/onboarding/complete
         */
        this.completeOnboarding = async (req, res) => {
            try {
                const userId = req.user.id;
                const completed = await this.onboardingService.completeOnboarding(userId);
                // Audit log
                await this.auditService.log({
                    user_id: userId,
                    action: 'onboarding_completed',
                    resource_type: 'patient_onboarding',
                    resource_id: completed.id,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                // Trigger AI baseline analysis
                // TODO: Integrate with ML service for initial health assessment
                res.json({
                    success: true,
                    data: completed,
                    message: 'Onboarding completed successfully! Your AI health companion is now processing your data.',
                });
            }
            catch (error) {
                logger_1.logger.error('Error completing onboarding:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to complete onboarding',
                });
            }
        };
        this.onboardingService = new OnboardingService_1.OnboardingService();
        this.auditService = new AuditService_1.AuditService();
    }
}
exports.OnboardingController = OnboardingController;
