"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProviderPortalController_1 = require("../controllers/ProviderPortalController");
const authorization_1 = require("../middleware/authorization");
const router = (0, express_1.Router)();
const controller = new ProviderPortalController_1.ProviderPortalController();
// All routes require authentication and provider role
router.use(authorization_1.authenticate);
router.use(authorization_1.requireProvider);
/**
 * @route GET /api/provider/stats
 * @desc Get provider dashboard statistics
 * @access Provider
 */
router.get('/stats', controller.getProviderStats);
/**
 * @route GET /api/provider/patients
 * @desc Get all patients assigned to provider
 * @access Provider
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50)
 * @query search - Search term
 * @query risk_level - Filter by risk level
 */
router.get('/patients', controller.getPatients);
/**
 * @route GET /api/provider/patients/high-risk
 * @desc Get high-risk patients
 * @access Provider
 */
router.get('/patients/high-risk', controller.getHighRiskPatients);
/**
 * @route GET /api/provider/patients/:patientId
 * @desc Get detailed patient information
 * @access Provider
 */
router.get('/patients/:patientId', controller.getPatientDetails);
/**
 * @route GET /api/provider/patients/:patientId/risk-assessments
 * @desc Get patient risk assessments
 * @access Provider
 */
router.get('/patients/:patientId/risk-assessments', controller.getPatientRiskAssessments);
/**
 * @route POST /api/provider/risk-assessments
 * @desc Create a risk assessment
 * @access Provider
 */
router.post('/risk-assessments', controller.createRiskAssessment);
/**
 * @route GET /api/provider/alerts
 * @desc Get clinical alerts
 * @access Provider
 * @query status - Filter by status
 * @query priority - Filter by priority
 * @query page - Page number
 * @query limit - Items per page
 */
router.get('/alerts', controller.getAlerts);
/**
 * @route POST /api/provider/alerts
 * @desc Create a clinical alert
 * @access Provider
 */
router.post('/alerts', controller.createAlert);
/**
 * @route PUT /api/provider/alerts/:alertId/acknowledge
 * @desc Acknowledge an alert
 * @access Provider
 */
router.put('/alerts/:alertId/acknowledge', controller.acknowledgeAlert);
/**
 * @route PUT /api/provider/alerts/:alertId/resolve
 * @desc Resolve an alert
 * @access Provider
 */
router.put('/alerts/:alertId/resolve', controller.resolveAlert);
/**
 * @route GET /api/provider/appointments
 * @desc Get appointments
 * @access Provider
 * @query start_date - Start date filter
 * @query end_date - End date filter
 * @query status - Status filter
 */
router.get('/appointments', controller.getAppointments);
/**
 * @route POST /api/provider/appointments
 * @desc Create an appointment
 * @access Provider
 */
router.post('/appointments', controller.createAppointment);
/**
 * @route PUT /api/provider/appointments/:appointmentId/status
 * @desc Update appointment status
 * @access Provider
 */
router.put('/appointments/:appointmentId/status', controller.updateAppointmentStatus);
/**
 * @route POST /api/provider/patients/assign
 * @desc Assign a patient to provider
 * @access Provider
 */
router.post('/patients/assign', controller.assignPatient);
exports.default = router;
