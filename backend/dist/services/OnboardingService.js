"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const knex_1 = __importDefault(require("../config/knex"));
const uuid_1 = require("uuid");
class OnboardingService {
    /**
     * Get or create onboarding record
     */
    async getOnboardingStatus(userId) {
        const onboarding = await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .first();
        if (!onboarding) {
            return {
                exists: false,
                current_step: 0,
                is_completed: false,
            };
        }
        return {
            exists: true,
            ...onboarding,
        };
    }
    /**
     * Start onboarding process
     */
    async startOnboarding(userId) {
        // Check if already exists
        const existing = await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .first();
        if (existing) {
            return existing;
        }
        const [onboarding] = await (0, knex_1.default)('patient_onboarding')
            .insert({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            current_step: 0,
            is_completed: false,
            started_at: knex_1.default.fn.now(),
        })
            .returning('*');
        return onboarding;
    }
    /**
     * Update current step
     */
    async updateStep(userId, step) {
        const [updated] = await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .update({
            current_step: step,
            updated_at: knex_1.default.fn.now(),
        })
            .returning('*');
        return updated;
    }
    /**
     * Save profile data
     */
    async saveProfileData(userId, profileData) {
        const [updated] = await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .update({
            profile_data: JSON.stringify(profileData),
            updated_at: knex_1.default.fn.now(),
        })
            .returning('*');
        // Also update health_profiles table if exists
        const healthProfile = await (0, knex_1.default)('health_profiles')
            .where({ user_id: userId })
            .first();
        if (healthProfile) {
            await (0, knex_1.default)('health_profiles')
                .where({ user_id: userId })
                .update({
                medical_history: profileData.medical_history || [],
                current_medications: profileData.medications || [],
                allergies: profileData.allergies || [],
                updated_at: knex_1.default.fn.now(),
            });
        }
        else {
            await (0, knex_1.default)('health_profiles').insert({
                id: (0, uuid_1.v4)(),
                user_id: userId,
                medical_history: profileData.medical_history || [],
                current_medications: profileData.medications || [],
                allergies: profileData.allergies || [],
            });
        }
        return updated;
    }
    /**
     * Save consent data
     */
    async saveConsentData(userId, consentData, ipAddress, userAgent) {
        const consents = [];
        // Create consent records for each type
        for (const [type, given] of Object.entries(consentData)) {
            if (type === 'consent_version')
                continue;
            const [consent] = await (0, knex_1.default)('user_consents')
                .insert({
                id: (0, uuid_1.v4)(),
                user_id: userId,
                consent_type: type,
                consent_given: given,
                consent_version: consentData.consent_version,
                ip_address: ipAddress,
                user_agent: userAgent,
                consented_at: knex_1.default.fn.now(),
            })
                .returning('*');
            consents.push(consent);
        }
        // Update onboarding record
        await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .update({
            consent_data: JSON.stringify(consentData),
            updated_at: knex_1.default.fn.now(),
        });
        return consents;
    }
    /**
     * Connect medical record provider
     */
    async connectMedicalRecord(userId, recordData) {
        const [connection] = await (0, knex_1.default)('medical_record_connections')
            .insert({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            provider_name: recordData.provider_name,
            provider_type: recordData.provider_type,
            connection_status: 'pending',
            connection_metadata: JSON.stringify(recordData.connection_metadata || {}),
        })
            .returning('*');
        // Update onboarding record
        await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .update({
            medical_records_data: knex_1.default.raw(`jsonb_set(COALESCE(medical_records_data, '{}'), '{connections}', COALESCE(medical_records_data->'connections', '[]')::jsonb || ?::jsonb)`, [JSON.stringify([connection.id])]),
            updated_at: knex_1.default.fn.now(),
        });
        return connection;
    }
    /**
     * Get medical record connections
     */
    async getMedicalRecordConnections(userId) {
        return await (0, knex_1.default)('medical_record_connections')
            .where({ user_id: userId })
            .orderBy('created_at', 'desc');
    }
    /**
     * Connect device
     */
    async connectDevice(userId, deviceData) {
        // Check if device already connected
        const existing = await (0, knex_1.default)('connected_devices')
            .where({
            user_id: userId,
            device_id: deviceData.device_id,
        })
            .first();
        if (existing) {
            // Update existing device
            const [updated] = await (0, knex_1.default)('connected_devices')
                .where({ id: existing.id })
                .update({
                connection_status: 'active',
                device_metadata: JSON.stringify(deviceData.device_metadata || {}),
                metrics_tracked: JSON.stringify(deviceData.metrics_tracked || []),
                updated_at: knex_1.default.fn.now(),
            })
                .returning('*');
            return updated;
        }
        const [device] = await (0, knex_1.default)('connected_devices')
            .insert({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            device_name: deviceData.device_name,
            device_type: deviceData.device_type,
            device_id: deviceData.device_id,
            connection_status: 'active',
            device_metadata: JSON.stringify(deviceData.device_metadata || {}),
            metrics_tracked: JSON.stringify(deviceData.metrics_tracked || []),
            connected_at: knex_1.default.fn.now(),
        })
            .returning('*');
        // Update onboarding record
        await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .update({
            devices_data: knex_1.default.raw(`jsonb_set(COALESCE(devices_data, '{}'), '{devices}', COALESCE(devices_data->'devices', '[]')::jsonb || ?::jsonb)`, [JSON.stringify([device.id])]),
            updated_at: knex_1.default.fn.now(),
        });
        return device;
    }
    /**
     * Get connected devices
     */
    async getConnectedDevices(userId) {
        return await (0, knex_1.default)('connected_devices')
            .where({ user_id: userId })
            .orderBy('connected_at', 'desc');
    }
    /**
     * Disconnect device
     */
    async disconnectDevice(userId, deviceId) {
        await (0, knex_1.default)('connected_devices')
            .where({
            id: deviceId,
            user_id: userId,
        })
            .update({
            connection_status: 'disconnected',
            updated_at: knex_1.default.fn.now(),
        });
    }
    /**
     * Add health goal
     */
    async addHealthGoal(userId, goalData) {
        const [goal] = await (0, knex_1.default)('health_goals')
            .insert({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            goal_category: goalData.goal_category,
            goal_name: goalData.goal_name,
            goal_description: goalData.goal_description,
            target_metrics: JSON.stringify(goalData.target_metrics || {}),
            current_progress: JSON.stringify({}),
            progress_percentage: 0,
            target_date: goalData.target_date,
            status: 'active',
        })
            .returning('*');
        // Update onboarding record
        await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .update({
            goals_data: knex_1.default.raw(`jsonb_set(COALESCE(goals_data, '{}'), '{goals}', COALESCE(goals_data->'goals', '[]')::jsonb || ?::jsonb)`, [JSON.stringify([goal.id])]),
            updated_at: knex_1.default.fn.now(),
        });
        return goal;
    }
    /**
     * Get health goals
     */
    async getHealthGoals(userId) {
        return await (0, knex_1.default)('health_goals')
            .where({ user_id: userId })
            .orderBy('created_at', 'desc');
    }
    /**
     * Complete onboarding
     */
    async completeOnboarding(userId) {
        const [completed] = await (0, knex_1.default)('patient_onboarding')
            .where({ user_id: userId })
            .update({
            is_completed: true,
            current_step: 7,
            completed_at: knex_1.default.fn.now(),
            updated_at: knex_1.default.fn.now(),
        })
            .returning('*');
        return completed;
    }
}
exports.OnboardingService = OnboardingService;
