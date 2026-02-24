"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthAnalysisService = void 0;
const axios_1 = __importDefault(require("axios"));
const knex_1 = __importDefault(require("../config/knex"));
const logger_1 = require("../utils/logger");
class HealthAnalysisService {
    constructor() {
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
    }
    /**
     * Analyze voice biomarkers
     */
    async analyzeVoice(userId, audioFilePath) {
        try {
            // Send audio to ML service for analysis
            const FormData = require('form-data');
            const fs = require('fs');
            const formData = new FormData();
            formData.append('audio', fs.createReadStream(audioFilePath));
            const response = await axios_1.default.post(`${this.mlServiceUrl}/voice/analyze`, formData, {
                headers: formData.getHeaders(),
                timeout: 30000,
            });
            const analysisResult = response.data;
            // Save analysis result to database
            await knex_1.default.db('voice_analyses').insert({
                user_id: userId,
                health_score: analysisResult.healthScore,
                biomarkers: JSON.stringify(analysisResult.biomarkers),
                detailed_analysis: JSON.stringify(analysisResult.detailedAnalysis),
                recommendations: JSON.stringify(analysisResult.recommendations),
                created_at: new Date(),
            });
            logger_1.logger.info(`Voice analysis completed for user ${userId}`);
            return analysisResult;
        }
        catch (error) {
            logger_1.logger.error('Voice analysis service error:', error);
            throw new Error('Failed to analyze voice');
        }
    }
    /**
     * Analyze camera frames for health markers
     */
    async analyzeCameraFrames(userId, framePaths, metadata) {
        try {
            // Send frames to ML service
            const FormData = require('form-data');
            const fs = require('fs');
            const formData = new FormData();
            for (const framePath of framePaths) {
                formData.append('frames', fs.createReadStream(framePath));
            }
            formData.append('frameCount', metadata.frameCount.toString());
            formData.append('timestamp', metadata.timestamp);
            const response = await axios_1.default.post(`${this.mlServiceUrl}/camera/analyze`, formData, {
                headers: formData.getHeaders(),
                timeout: 60000,
            });
            const analysisResult = response.data;
            // Save analysis result to database
            await knex_1.default.db('camera_analyses').insert({
                user_id: userId,
                heart_rate: analysisResult.heartRate.bpm,
                heart_rate_confidence: analysisResult.heartRate.confidence,
                heart_rate_variability: analysisResult.heartRate.variability,
                stress_level: analysisResult.stressLevel.score,
                stress_category: analysisResult.stressLevel.category,
                skin_health_score: analysisResult.skinHealth.score,
                skin_concerns: JSON.stringify(analysisResult.skinHealth.concerns),
                eye_fatigue_level: analysisResult.eyeHealth.fatigueLevel,
                blink_rate: analysisResult.eyeHealth.blinkRate,
                recommendations: JSON.stringify(analysisResult.recommendations),
                created_at: new Date(metadata.timestamp),
            });
            logger_1.logger.info(`Camera analysis completed for user ${userId}`);
            return analysisResult;
        }
        catch (error) {
            logger_1.logger.error('Camera analysis service error:', error);
            throw new Error('Failed to analyze camera frames');
        }
    }
    /**
     * Get health metrics history
     */
    async getHealthMetrics(userId, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const metrics = await knex_1.default
                .db('health_metrics')
                .where('user_id', userId)
                .where('recorded_at', '>=', startDate)
                .orderBy('recorded_at', 'asc')
                .select('*');
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch health metrics:', error);
            throw new Error('Failed to fetch health metrics');
        }
    }
    /**
     * Save health metrics
     */
    async saveHealthMetrics(userId, metrics, source, timestamp) {
        var _a, _b, _c, _d, _e;
        try {
            const [result] = await knex_1.default.db('health_metrics').insert({
                user_id: userId,
                heart_rate: metrics.heartRate,
                heart_rate_variability: metrics.heartRateVariability,
                steps: metrics.steps,
                active_energy_burned: metrics.activeEnergyBurned,
                blood_pressure_systolic: (_a = metrics.bloodPressure) === null || _a === void 0 ? void 0 : _a.systolic,
                blood_pressure_diastolic: (_b = metrics.bloodPressure) === null || _b === void 0 ? void 0 : _b.diastolic,
                blood_glucose: metrics.bloodGlucose,
                body_temperature: metrics.bodyTemperature,
                oxygen_saturation: metrics.oxygenSaturation,
                respiratory_rate: metrics.respiratoryRate,
                sleep_asleep: (_c = metrics.sleepAnalysis) === null || _c === void 0 ? void 0 : _c.asleep,
                sleep_awake: (_d = metrics.sleepAnalysis) === null || _d === void 0 ? void 0 : _d.awake,
                sleep_in_bed: (_e = metrics.sleepAnalysis) === null || _e === void 0 ? void 0 : _e.inBed,
                weight: metrics.weight,
                height: metrics.height,
                bmi: metrics.bmi,
                source,
                recorded_at: new Date(timestamp),
                created_at: new Date(),
            }).returning('id');
            logger_1.logger.info(`Health metrics saved for user ${userId}`);
            return { id: result, success: true };
        }
        catch (error) {
            logger_1.logger.error('Failed to save health metrics:', error);
            throw new Error('Failed to save health metrics');
        }
    }
    /**
     * Calculate infection risk score
     */
    async calculateInfectionRisk(userId) {
        try {
            // Get recent health metrics
            const recentMetrics = await knex_1.default
                .db('health_metrics')
                .where('user_id', userId)
                .orderBy('recorded_at', 'desc')
                .limit(10)
                .select('*');
            if (recentMetrics.length === 0) {
                return {
                    overall: 0,
                    flu: 0,
                    covid: 0,
                    respiratory: 0,
                    category: 'low',
                };
            }
            // Call ML service for risk calculation
            const response = await axios_1.default.post(`${this.mlServiceUrl}/infection/risk`, {
                userId,
                metrics: recentMetrics,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate infection risk:', error);
            // Return default low risk if ML service fails
            return {
                overall: 0,
                flu: 0,
                covid: 0,
                respiratory: 0,
                category: 'low',
            };
        }
    }
    /**
     * Get early warning signals
     */
    async getEarlyWarnings(userId) {
        try {
            const warnings = await knex_1.default
                .db('early_warnings')
                .where('user_id', userId)
                .where('acknowledged', false)
                .orderBy('created_at', 'desc')
                .limit(10)
                .select('*');
            return warnings.map(w => ({
                id: w.id,
                type: w.warning_type,
                severity: w.severity,
                message: w.message,
                timestamp: w.created_at,
                recommendations: JSON.parse(w.recommendations || '[]'),
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch early warnings:', error);
            return [];
        }
    }
    /**
     * Get nearby disease outbreaks
     */
    async getNearbyOutbreaks(location) {
        try {
            // This would typically query a disease outbreak database or external API
            // For now, return empty array
            return [];
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch outbreaks:', error);
            return [];
        }
    }
    /**
     * Get infection-relevant biometrics
     */
    async getInfectionBiometrics(userId, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const biometrics = await knex_1.default
                .db('health_metrics')
                .where('user_id', userId)
                .where('recorded_at', '>=', startDate)
                .orderBy('recorded_at', 'asc')
                .select('body_temperature as temperature', 'heart_rate as heartRate', 'heart_rate_variability as heartRateVariability', 'respiratory_rate as respiratoryRate', 'oxygen_saturation as oxygenSaturation', 'recorded_at as timestamp');
            return biometrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch infection biometrics:', error);
            return [];
        }
    }
    /**
     * Get cancer screening data
     */
    async getCancerScreening(userId) {
        try {
            const screenings = await knex_1.default
                .db('cancer_screenings')
                .where('user_id', userId)
                .orderBy('created_at', 'desc')
                .select('*');
            return {
                cancers: screenings.map(s => ({
                    id: s.id,
                    name: s.cancer_type,
                    riskScore: s.risk_score,
                    riskCategory: s.risk_category,
                    icon: s.icon,
                    color: s.color,
                    biomarkers: JSON.parse(s.biomarkers || '[]'),
                    screeningStatus: JSON.parse(s.screening_status || '{}'),
                    riskFactors: JSON.parse(s.risk_factors || '[]'),
                })),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch cancer screening data:', error);
            return { cancers: [] };
        }
    }
    /**
     * Get genetic risk assessment
     */
    async getGeneticRisk(userId) {
        try {
            const genetic = await knex_1.default
                .db('genetic_tests')
                .where('user_id', userId)
                .orderBy('test_date', 'desc')
                .first();
            if (!genetic) {
                return {
                    tested: false,
                    mutations: [],
                };
            }
            return {
                tested: true,
                mutations: JSON.parse(genetic.mutations || '[]'),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch genetic risk:', error);
            return {
                tested: false,
                mutations: [],
            };
        }
    }
}
exports.HealthAnalysisService = HealthAnalysisService;
