"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderPortalController = void 0;
const ProviderPortalService_1 = require("../services/ProviderPortalService");
const AuditService_1 = require("../services/AuditService");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
// Validation schemas
const RiskAssessmentSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    risk_category: zod_1.z.string(),
    risk_score: zod_1.z.number().min(0).max(100),
    risk_level: zod_1.z.enum(['critical', 'high', 'moderate', 'low']),
    predicted_event: zod_1.z.string().optional(),
    timeframe: zod_1.z.string().optional(),
    key_factors: zod_1.z.array(zod_1.z.string()).optional(),
    recommended_actions: zod_1.z.array(zod_1.z.string()).optional(),
    wearable_data: zod_1.z.object({}).passthrough().optional(),
});
const AlertSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    alert_type: zod_1.z.string(),
    priority: zod_1.z.enum(['critical', 'high', 'medium', 'low']),
    message: zod_1.z.string(),
    alert_data: zod_1.z.object({}).passthrough().optional(),
});
const AppointmentSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    appointment_type: zod_1.z.string(),
    scheduled_start: zod_1.z.string(), // ISO datetime
    scheduled_end: zod_1.z.string(), // ISO datetime
    reason: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
});
class ProviderPortalController {
    constructor() {
        /**
         * Get provider dashboard stats
         * GET /api/provider/stats
         */
        this.getProviderStats = async (req, res) => {
            try {
                const providerId = req.user.id;
                const stats = await this.portalService.getProviderStats(providerId);
                res.json({
                    success: true,
                    data: stats,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting provider stats:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get provider stats',
                });
            }
        };
        /**
         * Get all patients assigned to provider
         * GET /api/provider/patients
         */
        this.getPatients = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { page = 1, limit = 50, search, risk_level } = req.query;
                const patients = await this.portalService.getPatients(providerId, {
                    page: Number(page),
                    limit: Number(limit),
                    search: search,
                    risk_level: risk_level,
                });
                // Audit log - PHI access
                await this.auditService.log({
                    user_id: providerId,
                    action: 'patients_list_viewed',
                    resource_type: 'patient_list',
                    details: {
                        page,
                        limit,
                        patient_count: patients.data.length,
                    },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                    is_phi_access: true,
                });
                res.json({
                    success: true,
                    ...patients,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting patients:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get patients',
                });
            }
        };
        /**
         * Get high-risk patients
         * GET /api/provider/patients/high-risk
         */
        this.getHighRiskPatients = async (req, res) => {
            try {
                const providerId = req.user.id;
                const patients = await this.portalService.getHighRiskPatients(providerId);
                // Audit log - PHI access
                await this.auditService.log({
                    user_id: providerId,
                    action: 'high_risk_patients_viewed',
                    resource_type: 'patient_list',
                    details: { patient_count: patients.length },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                    is_phi_access: true,
                });
                res.json({
                    success: true,
                    data: patients,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting high-risk patients:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get high-risk patients',
                });
            }
        };
        /**
         * Get detailed patient information
         * GET /api/provider/patients/:patientId
         */
        this.getPatientDetails = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { patientId } = req.params;
                // Verify provider has access to this patient
                const hasAccess = await this.portalService.verifyPatientAccess(providerId, patientId);
                if (!hasAccess) {
                    return res.status(403).json({
                        success: false,
                        error: 'Access denied to this patient',
                    });
                }
                const patient = await this.portalService.getPatientDetails(patientId);
                // Audit log - PHI access
                await this.auditService.log({
                    user_id: providerId,
                    action: 'patient_record_viewed',
                    resource_type: 'patient',
                    resource_id: patientId,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                    is_phi_access: true,
                });
                res.json({
                    success: true,
                    data: patient,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting patient details:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get patient details',
                });
            }
        };
        /**
         * Get patient risk assessments
         * GET /api/provider/patients/:patientId/risk-assessments
         */
        this.getPatientRiskAssessments = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { patientId } = req.params;
                // Verify access
                const hasAccess = await this.portalService.verifyPatientAccess(providerId, patientId);
                if (!hasAccess) {
                    return res.status(403).json({
                        success: false,
                        error: 'Access denied',
                    });
                }
                const assessments = await this.portalService.getPatientRiskAssessments(patientId);
                // Audit log
                await this.auditService.log({
                    user_id: providerId,
                    action: 'risk_assessments_viewed',
                    resource_type: 'patient_risk_assessment',
                    resource_id: patientId,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                    is_phi_access: true,
                });
                res.json({
                    success: true,
                    data: assessments,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting risk assessments:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get risk assessments',
                });
            }
        };
        /**
         * Create risk assessment
         * POST /api/provider/risk-assessments
         */
        this.createRiskAssessment = async (req, res) => {
            try {
                const providerId = req.user.id;
                const assessmentData = req.body;
                // Validate
                const validated = RiskAssessmentSchema.parse(assessmentData);
                // Verify access
                const hasAccess = await this.portalService.verifyPatientAccess(providerId, validated.patient_id);
                if (!hasAccess) {
                    return res.status(403).json({
                        success: false,
                        error: 'Access denied',
                    });
                }
                const assessment = await this.portalService.createRiskAssessment(validated);
                // Audit log
                await this.auditService.log({
                    user_id: providerId,
                    action: 'risk_assessment_created',
                    resource_type: 'patient_risk_assessment',
                    resource_id: assessment.id,
                    details: {
                        patient_id: validated.patient_id,
                        risk_level: validated.risk_level,
                        risk_score: validated.risk_score,
                    },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                    is_phi_access: true,
                });
                // If critical risk, create alert automatically
                if (validated.risk_level === 'critical') {
                    await this.portalService.createAlert({
                        patient_id: validated.patient_id,
                        provider_id: providerId,
                        alert_type: 'Critical Risk',
                        priority: 'critical',
                        message: `Critical risk assessment: ${validated.predicted_event || 'High risk detected'}`,
                        alert_data: { assessment_id: assessment.id },
                    });
                }
                res.json({
                    success: true,
                    data: assessment,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid assessment data',
                        details: error.errors,
                    });
                }
                logger_1.logger.error('Error creating risk assessment:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to create risk assessment',
                });
            }
        };
        /**
         * Get clinical alerts
         * GET /api/provider/alerts
         */
        this.getAlerts = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { status, priority, page = 1, limit = 50 } = req.query;
                const alerts = await this.portalService.getAlerts(providerId, {
                    status: status,
                    priority: priority,
                    page: Number(page),
                    limit: Number(limit),
                });
                res.json({
                    success: true,
                    ...alerts,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting alerts:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get alerts',
                });
            }
        };
        /**
         * Create clinical alert
         * POST /api/provider/alerts
         */
        this.createAlert = async (req, res) => {
            try {
                const providerId = req.user.id;
                const alertData = req.body;
                // Validate
                const validated = AlertSchema.parse(alertData);
                // Verify access
                const hasAccess = await this.portalService.verifyPatientAccess(providerId, validated.patient_id);
                if (!hasAccess) {
                    return res.status(403).json({
                        success: false,
                        error: 'Access denied',
                    });
                }
                const alert = await this.portalService.createAlert({
                    ...validated,
                    provider_id: providerId,
                });
                // Audit log
                await this.auditService.log({
                    user_id: providerId,
                    action: 'alert_created',
                    resource_type: 'clinical_alert',
                    resource_id: alert.id,
                    details: {
                        patient_id: validated.patient_id,
                        priority: validated.priority,
                        alert_type: validated.alert_type,
                    },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: alert,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid alert data',
                        details: error.errors,
                    });
                }
                logger_1.logger.error('Error creating alert:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to create alert',
                });
            }
        };
        /**
         * Acknowledge alert
         * PUT /api/provider/alerts/:alertId/acknowledge
         */
        this.acknowledgeAlert = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { alertId } = req.params;
                const alert = await this.portalService.acknowledgeAlert(alertId, providerId);
                // Audit log
                await this.auditService.log({
                    user_id: providerId,
                    action: 'alert_acknowledged',
                    resource_type: 'clinical_alert',
                    resource_id: alertId,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: alert,
                });
            }
            catch (error) {
                logger_1.logger.error('Error acknowledging alert:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to acknowledge alert',
                });
            }
        };
        /**
         * Resolve alert
         * PUT /api/provider/alerts/:alertId/resolve
         */
        this.resolveAlert = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { alertId } = req.params;
                const { resolution_notes } = req.body;
                const alert = await this.portalService.resolveAlert(alertId, providerId, resolution_notes);
                // Audit log
                await this.auditService.log({
                    user_id: providerId,
                    action: 'alert_resolved',
                    resource_type: 'clinical_alert',
                    resource_id: alertId,
                    details: { resolution_notes },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: alert,
                });
            }
            catch (error) {
                logger_1.logger.error('Error resolving alert:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to resolve alert',
                });
            }
        };
        /**
         * Get appointments
         * GET /api/provider/appointments
         */
        this.getAppointments = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { start_date, end_date, status } = req.query;
                const appointments = await this.portalService.getAppointments(providerId, {
                    start_date: start_date,
                    end_date: end_date,
                    status: status,
                });
                res.json({
                    success: true,
                    data: appointments,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting appointments:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get appointments',
                });
            }
        };
        /**
         * Create appointment
         * POST /api/provider/appointments
         */
        this.createAppointment = async (req, res) => {
            try {
                const providerId = req.user.id;
                const appointmentData = req.body;
                // Validate
                const validated = AppointmentSchema.parse(appointmentData);
                // Verify access
                const hasAccess = await this.portalService.verifyPatientAccess(providerId, validated.patient_id);
                if (!hasAccess) {
                    return res.status(403).json({
                        success: false,
                        error: 'Access denied',
                    });
                }
                const appointment = await this.portalService.createAppointment({
                    ...validated,
                    provider_id: providerId,
                });
                // Audit log
                await this.auditService.log({
                    user_id: providerId,
                    action: 'appointment_created',
                    resource_type: 'appointment',
                    resource_id: appointment.id,
                    details: {
                        patient_id: validated.patient_id,
                        appointment_type: validated.appointment_type,
                        scheduled_start: validated.scheduled_start,
                    },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: appointment,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid appointment data',
                        details: error.errors,
                    });
                }
                logger_1.logger.error('Error creating appointment:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to create appointment',
                });
            }
        };
        /**
         * Update appointment status
         * PUT /api/provider/appointments/:appointmentId/status
         */
        this.updateAppointmentStatus = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { appointmentId } = req.params;
                const { status, notes } = req.body;
                const appointment = await this.portalService.updateAppointmentStatus(appointmentId, status, notes);
                // Audit log
                await this.auditService.log({
                    user_id: providerId,
                    action: 'appointment_status_updated',
                    resource_type: 'appointment',
                    resource_id: appointmentId,
                    details: { status, notes },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: appointment,
                });
            }
            catch (error) {
                logger_1.logger.error('Error updating appointment status:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to update appointment status',
                });
            }
        };
        /**
         * Assign patient to provider
         * POST /api/provider/patients/assign
         */
        this.assignPatient = async (req, res) => {
            try {
                const providerId = req.user.id;
                const { patient_id, relationship_type = 'primary' } = req.body;
                if (!patient_id) {
                    return res.status(400).json({
                        success: false,
                        error: 'Patient ID is required',
                    });
                }
                const assignment = await this.portalService.assignPatient(providerId, patient_id, relationship_type);
                // Audit log
                await this.auditService.log({
                    user_id: providerId,
                    action: 'patient_assigned',
                    resource_type: 'provider_patient_assignment',
                    resource_id: assignment.id,
                    details: { patient_id, relationship_type },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                });
                res.json({
                    success: true,
                    data: assignment,
                });
            }
            catch (error) {
                logger_1.logger.error('Error assigning patient:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to assign patient',
                });
            }
        };
        this.portalService = new ProviderPortalService_1.ProviderPortalService();
        this.auditService = new AuditService_1.AuditService();
    }
}
exports.ProviderPortalController = ProviderPortalController;
