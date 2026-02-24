"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderPortalService = void 0;
const knex_1 = __importDefault(require("../config/knex"));
const uuid_1 = require("uuid");
class ProviderPortalService {
    /**
     * Get provider dashboard stats
     */
    async getProviderStats(providerId) {
        // Try to get from cache first
        const cached = await (0, knex_1.default)('provider_stats_cache')
            .where({ provider_id: providerId })
            .first();
        // If cache is recent (< 5 minutes), return it
        if (cached && Date.now() - new Date(cached.last_updated).getTime() < 5 * 60 * 1000) {
            return cached;
        }
        // Calculate stats
        const totalPatients = await (0, knex_1.default)('provider_patient_assignments')
            .where({ provider_id: providerId, is_active: true })
            .count('* as count')
            .first();
        const activePatients = await (0, knex_1.default)('provider_patient_assignments as ppa')
            .join('users as u', 'ppa.patient_id', 'u.id')
            .where({ 'ppa.provider_id': providerId, 'ppa.is_active': true, 'u.is_active': true })
            .count('* as count')
            .first();
        const highRiskAlerts = await (0, knex_1.default)('clinical_alerts')
            .where({
            provider_id: providerId,
            status: 'new',
        })
            .whereIn('priority', ['critical', 'high'])
            .count('* as count')
            .first();
        const pendingReviews = await (0, knex_1.default)('clinical_alerts')
            .where({
            provider_id: providerId,
            status: 'acknowledged',
        })
            .count('* as count')
            .first();
        // Calculate engagement (simplified - percentage of patients with recent activity)
        const patientsWithActivity = await (0, knex_1.default)('provider_patient_assignments as ppa')
            .join('vital_signs as vs', 'ppa.patient_id', 'vs.user_id')
            .where({
            'ppa.provider_id': providerId,
            'ppa.is_active': true,
        })
            .where('vs.created_at', '>=', knex_1.default.raw("NOW() - INTERVAL '7 days'"))
            .countDistinct('ppa.patient_id as count')
            .first();
        const avgEngagement = totalPatients.count > 0
            ? Math.round((patientsWithActivity.count / totalPatients.count) * 100)
            : 0;
        // Predictions this week
        const predictionsThisWeek = await (0, knex_1.default)('ai_predictions')
            .join('provider_patient_assignments as ppa', 'ai_predictions.user_id', 'ppa.patient_id')
            .where({
            'ppa.provider_id': providerId,
            'ppa.is_active': true,
        })
            .where('ai_predictions.created_at', '>=', knex_1.default.raw("NOW() - INTERVAL '7 days'"))
            .count('* as count')
            .first();
        const stats = {
            total_patients: parseInt(totalPatients.count),
            active_patients: parseInt(activePatients.count),
            high_risk_alerts: parseInt(highRiskAlerts.count),
            pending_reviews: parseInt(pendingReviews.count),
            avg_engagement: avgEngagement,
            predictions_this_week: parseInt(predictionsThisWeek.count),
        };
        // Update cache
        await (0, knex_1.default)('provider_stats_cache')
            .insert({
            id: (0, uuid_1.v4)(),
            provider_id: providerId,
            ...stats,
            last_updated: knex_1.default.fn.now(),
        })
            .onConflict('provider_id')
            .merge();
        return stats;
    }
    /**
     * Get all patients for provider with pagination
     */
    async getPatients(providerId, params) {
        const { page, limit, search, risk_level } = params;
        const offset = (page - 1) * limit;
        let query = (0, knex_1.default)('provider_patient_assignments as ppa')
            .join('users as u', 'ppa.patient_id', 'u.id')
            .leftJoin('health_profiles as hp', 'u.id', 'hp.user_id')
            .leftJoin((0, knex_1.default)('patient_risk_assessments')
            .select('patient_id')
            .max('assessed_at as last_assessed')
            .max('risk_score as risk_score')
            .max('risk_level as risk_level')
            .max('risk_category as risk_category')
            .groupBy('patient_id')
            .as('ra'), 'u.id', 'ra.patient_id')
            .where({ 'ppa.provider_id': providerId, 'ppa.is_active': true })
            .select('u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.date_of_birth', 'hp.medical_history', 'ppa.assigned_at', 'ra.risk_score', 'ra.risk_level', 'ra.risk_category', 'ra.last_assessed');
        // Search filter
        if (search) {
            query = query.where(function () {
                this.where('u.first_name', 'ilike', `%${search}%`)
                    .orWhere('u.last_name', 'ilike', `%${search}%`)
                    .orWhere('u.email', 'ilike', `%${search}%`);
            });
        }
        // Risk level filter
        if (risk_level) {
            query = query.where('ra.risk_level', risk_level);
        }
        // Get total count
        const countQuery = query.clone().clearSelect().count('* as count').first();
        const total = await countQuery;
        // Get paginated data
        const data = await query.orderBy('ra.risk_score', 'desc').limit(limit).offset(offset);
        return {
            data,
            pagination: {
                page,
                limit,
                total: parseInt(total.count),
                pages: Math.ceil(parseInt(total.count) / limit),
            },
        };
    }
    /**
     * Get high-risk patients
     */
    async getHighRiskPatients(providerId) {
        return await (0, knex_1.default)('provider_patient_assignments as ppa')
            .join('users as u', 'ppa.patient_id', 'u.id')
            .join((0, knex_1.default)('patient_risk_assessments')
            .select('*')
            .distinctOn('patient_id')
            .orderBy('patient_id')
            .orderBy('assessed_at', 'desc')
            .as('ra'), 'u.id', 'ra.patient_id')
            .where({ 'ppa.provider_id': providerId, 'ppa.is_active': true })
            .whereIn('ra.risk_level', ['critical', 'high'])
            .select('u.id', 'u.first_name', 'u.last_name', 'u.date_of_birth', 'ra.*')
            .orderBy('ra.risk_score', 'desc');
    }
    /**
     * Verify provider has access to patient
     */
    async verifyPatientAccess(providerId, patientId) {
        const assignment = await (0, knex_1.default)('provider_patient_assignments')
            .where({
            provider_id: providerId,
            patient_id: patientId,
            is_active: true,
        })
            .first();
        return !!assignment;
    }
    /**
     * Get detailed patient information
     */
    async getPatientDetails(patientId) {
        const patient = await (0, knex_1.default)('users as u')
            .leftJoin('health_profiles as hp', 'u.id', 'hp.user_id')
            .where({ 'u.id': patientId })
            .select('u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.date_of_birth', 'u.phone_number', 'u.created_at', 'hp.medical_history', 'hp.current_medications', 'hp.allergies', 'hp.emergency_contact')
            .first();
        if (!patient) {
            throw new Error('Patient not found');
        }
        // Get recent vitals
        const recentVitals = await (0, knex_1.default)('vital_signs')
            .where({ user_id: patientId })
            .orderBy('timestamp', 'desc')
            .limit(10);
        // Get connected devices
        const devices = await (0, knex_1.default)('connected_devices')
            .where({ user_id: patientId, connection_status: 'active' });
        // Get health goals
        const goals = await (0, knex_1.default)('health_goals')
            .where({ user_id: patientId, status: 'active' });
        return {
            ...patient,
            recent_vitals: recentVitals,
            connected_devices: devices,
            health_goals: goals,
        };
    }
    /**
     * Get patient risk assessments
     */
    async getPatientRiskAssessments(patientId) {
        return await (0, knex_1.default)('patient_risk_assessments')
            .where({ patient_id: patientId })
            .orderBy('assessed_at', 'desc')
            .limit(20);
    }
    /**
     * Create risk assessment
     */
    async createRiskAssessment(assessmentData) {
        const [assessment] = await (0, knex_1.default)('patient_risk_assessments')
            .insert({
            id: (0, uuid_1.v4)(),
            patient_id: assessmentData.patient_id,
            risk_category: assessmentData.risk_category,
            risk_score: assessmentData.risk_score,
            risk_level: assessmentData.risk_level,
            predicted_event: assessmentData.predicted_event,
            timeframe: assessmentData.timeframe,
            key_factors: JSON.stringify(assessmentData.key_factors || []),
            recommended_actions: JSON.stringify(assessmentData.recommended_actions || []),
            wearable_data: JSON.stringify(assessmentData.wearable_data || {}),
            assessment_version: 'v1.0',
            confidence_score: assessmentData.confidence_score,
            assessed_at: knex_1.default.fn.now(),
        })
            .returning('*');
        return assessment;
    }
    /**
     * Get clinical alerts with filters
     */
    async getAlerts(providerId, filters) {
        const { status, priority, page, limit } = filters;
        const offset = (page - 1) * limit;
        let query = (0, knex_1.default)('clinical_alerts as ca')
            .leftJoin('users as u', 'ca.patient_id', 'u.id')
            .where(function () {
            this.where('ca.provider_id', providerId).orWhereNull('ca.provider_id');
        })
            .select('ca.*', 'u.first_name as patient_first_name', 'u.last_name as patient_last_name');
        if (status) {
            query = query.where('ca.status', status);
        }
        if (priority) {
            query = query.where('ca.priority', priority);
        }
        // Get total count
        const countQuery = query.clone().clearSelect().count('* as count').first();
        const total = await countQuery;
        // Get paginated data
        const data = await query
            .orderBy([
            { column: 'ca.priority', order: 'asc' }, // critical first
            { column: 'ca.created_at', order: 'desc' },
        ])
            .limit(limit)
            .offset(offset);
        return {
            data,
            pagination: {
                page,
                limit,
                total: parseInt(total.count),
                pages: Math.ceil(parseInt(total.count) / limit),
            },
        };
    }
    /**
     * Create clinical alert
     */
    async createAlert(alertData) {
        const [alert] = await (0, knex_1.default)('clinical_alerts')
            .insert({
            id: (0, uuid_1.v4)(),
            patient_id: alertData.patient_id,
            provider_id: alertData.provider_id,
            alert_type: alertData.alert_type,
            priority: alertData.priority,
            message: alertData.message,
            alert_data: JSON.stringify(alertData.alert_data || {}),
            status: 'new',
        })
            .returning('*');
        return alert;
    }
    /**
     * Acknowledge alert
     */
    async acknowledgeAlert(alertId, providerId) {
        const [alert] = await (0, knex_1.default)('clinical_alerts')
            .where({ id: alertId })
            .update({
            status: 'acknowledged',
            acknowledged_by: providerId,
            acknowledged_at: knex_1.default.fn.now(),
            updated_at: knex_1.default.fn.now(),
        })
            .returning('*');
        return alert;
    }
    /**
     * Resolve alert
     */
    async resolveAlert(alertId, providerId, resolutionNotes) {
        const [alert] = await (0, knex_1.default)('clinical_alerts')
            .where({ id: alertId })
            .update({
            status: 'resolved',
            resolved_by: providerId,
            resolved_at: knex_1.default.fn.now(),
            resolution_notes: resolutionNotes,
            updated_at: knex_1.default.fn.now(),
        })
            .returning('*');
        return alert;
    }
    /**
     * Get appointments
     */
    async getAppointments(providerId, filters) {
        const { start_date, end_date, status } = filters;
        let query = (0, knex_1.default)('appointments as a')
            .join('users as u', 'a.patient_id', 'u.id')
            .where({ 'a.provider_id': providerId })
            .select('a.*', 'u.first_name as patient_first_name', 'u.last_name as patient_last_name');
        if (start_date) {
            query = query.where('a.scheduled_start', '>=', start_date);
        }
        if (end_date) {
            query = query.where('a.scheduled_start', '<=', end_date);
        }
        if (status) {
            query = query.where('a.status', status);
        }
        return await query.orderBy('a.scheduled_start', 'asc');
    }
    /**
     * Create appointment
     */
    async createAppointment(appointmentData) {
        const [appointment] = await (0, knex_1.default)('appointments')
            .insert({
            id: (0, uuid_1.v4)(),
            patient_id: appointmentData.patient_id,
            provider_id: appointmentData.provider_id,
            appointment_type: appointmentData.appointment_type,
            scheduled_start: appointmentData.scheduled_start,
            scheduled_end: appointmentData.scheduled_end,
            reason: appointmentData.reason,
            location: appointmentData.location,
            status: 'scheduled',
        })
            .returning('*');
        return appointment;
    }
    /**
     * Update appointment status
     */
    async updateAppointmentStatus(appointmentId, status, notes) {
        const [appointment] = await (0, knex_1.default)('appointments')
            .where({ id: appointmentId })
            .update({
            status,
            notes,
            updated_at: knex_1.default.fn.now(),
        })
            .returning('*');
        return appointment;
    }
    /**
     * Assign patient to provider
     */
    async assignPatient(providerId, patientId, relationshipType = 'primary') {
        const [assignment] = await (0, knex_1.default)('provider_patient_assignments')
            .insert({
            id: (0, uuid_1.v4)(),
            provider_id: providerId,
            patient_id: patientId,
            relationship_type: relationshipType,
            is_active: true,
            assigned_at: knex_1.default.fn.now(),
        })
            .returning('*');
        return assignment;
    }
}
exports.ProviderPortalService = ProviderPortalService;
