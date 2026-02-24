"use strict";
/**
 * Feature Engineering Service for MediMind Backend
 * Converts raw health data into meaningful features for ML models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalFeatureExtractor = exports.SleepFeatureExtractor = exports.ActivityFeatureExtractor = exports.VoiceFeatureExtractor = exports.FeatureEngineeringService = void 0;
const analytics_1 = require("../types/analytics");
class FeatureEngineeringService {
    constructor() {
        this.featureExtractors = new Map();
        this.setupFeatureExtractors();
    }
    setupFeatureExtractors() {
        this.featureExtractors.set('voice', new VoiceFeatureExtractor());
        this.featureExtractors.set('activity', new ActivityFeatureExtractor());
        this.featureExtractors.set('sleep', new SleepFeatureExtractor());
        this.featureExtractors.set('temporal', new TemporalFeatureExtractor());
    }
    async extractFeatures(dataType, rawData) {
        const extractor = this.featureExtractors.get(dataType);
        if (!extractor) {
            throw new analytics_1.AnalyticsServiceError(`No feature extractor found for ${dataType}`, 'EXTRACTOR_NOT_FOUND', 400);
        }
        try {
            return await extractor.extract(rawData);
        }
        catch (error) {
            throw new analytics_1.AnalyticsServiceError(`Feature extraction failed for ${dataType}: ${error.message}`, 'EXTRACTION_FAILED', 500, { dataType, originalError: error.message });
        }
    }
    async extractAllFeatures(patientData) {
        const results = [];
        const extractedAt = new Date();
        for (const [dataType, extractor] of this.featureExtractors) {
            if (patientData[dataType]) {
                try {
                    const features = await extractor.extract(patientData[dataType]);
                    results.push({
                        userId: '', // Will be set by calling service
                        dataType,
                        features,
                        extractedAt,
                        version: '1.0.0'
                    });
                }
                catch (error) {
                    console.error(`Error extracting ${dataType} features:`, error);
                    // Continue with other feature types
                }
            }
        }
        return results;
    }
    // Utility method to validate extracted features
    validateFeatures(features) {
        for (const [key, value] of Object.entries(features)) {
            if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
                console.warn(`Invalid feature value for ${key}: ${value}`);
                return false;
            }
        }
        return true;
    }
    // Get available feature extractors
    getAvailableExtractors() {
        return Array.from(this.featureExtractors.keys());
    }
}
exports.FeatureEngineeringService = FeatureEngineeringService;
class VoiceFeatureExtractor {
    async extract(voiceData) {
        var _a, _b, _c;
        const features = {
            // Fundamental frequency features
            f0_mean: this.calculateMean(voiceData.f0 || []),
            f0_std: this.calculateStd(voiceData.f0 || []),
            f0_range: this.calculateRange(voiceData.f0 || []),
            // Jitter and shimmer
            jitter: voiceData.jitter || 0,
            shimmer: voiceData.shimmer || 0,
            // Harmonics-to-noise ratio
            hnr: voiceData.hnr || 20,
            // Spectral features
            spectral_centroid: voiceData.spectral_centroid || 2000,
            spectral_bandwidth: voiceData.spectral_bandwidth || 1000,
            // MFCC features
            mfcc_1: ((_a = voiceData.mfcc) === null || _a === void 0 ? void 0 : _a[0]) || 0,
            mfcc_2: ((_b = voiceData.mfcc) === null || _b === void 0 ? void 0 : _b[1]) || 0,
            mfcc_3: ((_c = voiceData.mfcc) === null || _c === void 0 ? void 0 : _c[2]) || 0,
            // Speaking rate and pauses
            speaking_rate: voiceData.speaking_rate || 3,
            pause_ratio: voiceData.pause_ratio || 0.2,
            // Voice quality indicators
            breathiness: voiceData.breathiness || 0,
            roughness: voiceData.roughness || 0,
            // Emotional indicators
            valence: voiceData.valence || 0.5,
            arousal: voiceData.arousal || 0.5,
            stress_level: voiceData.stress_level || 0.3
        };
        return features;
    }
    calculateMean(values) {
        if (!Array.isArray(values) || values.length === 0)
            return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    calculateStd(values) {
        if (!Array.isArray(values) || values.length === 0)
            return 0;
        const mean = this.calculateMean(values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    calculateRange(values) {
        if (!Array.isArray(values) || values.length === 0)
            return 0;
        return Math.max(...values) - Math.min(...values);
    }
}
exports.VoiceFeatureExtractor = VoiceFeatureExtractor;
class ActivityFeatureExtractor {
    async extract(activityData) {
        const features = {
            // Step counting features
            daily_steps: activityData.daily_steps || 0,
            step_consistency: this.calculateStepConsistency(activityData.weekly_steps || []),
            // Activity intensity
            sedentary_time: activityData.sedentary_time || 0,
            light_activity_time: activityData.light_activity_time || 0,
            moderate_activity_time: activityData.moderate_activity_time || 0,
            vigorous_activity_time: activityData.vigorous_activity_time || 0,
            // Heart rate during activity
            resting_hr: activityData.resting_hr || 70,
            max_hr: activityData.max_hr || 180,
            hr_variability: activityData.hr_variability || 30,
            // Movement patterns
            gait_speed: activityData.gait_speed || 1.2,
            gait_variability: activityData.gait_variability || 0.1,
            balance_score: activityData.balance_score || 0.8,
            // Activity timing
            activity_regularity: this.calculateActivityRegularity(activityData.hourly_activity || []),
            weekend_activity_ratio: activityData.weekend_activity_ratio || 0.8,
            // Caloric expenditure
            total_calories: activityData.total_calories || 2000,
            active_calories: activityData.active_calories || 500,
            calories_per_step: (activityData.total_calories || 2000) / Math.max(1, activityData.daily_steps || 1)
        };
        return features;
    }
    calculateStepConsistency(weeklySteps) {
        if (!Array.isArray(weeklySteps) || weeklySteps.length === 0)
            return 0;
        const mean = weeklySteps.reduce((sum, steps) => sum + steps, 0) / weeklySteps.length;
        const variance = weeklySteps.reduce((sum, steps) => sum + Math.pow(steps - mean, 2), 0) / weeklySteps.length;
        return 1 / (1 + Math.sqrt(variance) / mean); // Higher consistency = lower CV
    }
    calculateActivityRegularity(hourlyActivity) {
        if (!Array.isArray(hourlyActivity) || hourlyActivity.length === 0)
            return 0;
        // Calculate entropy of hourly activity distribution
        const total = hourlyActivity.reduce((sum, activity) => sum + activity, 0);
        if (total === 0)
            return 0;
        const probabilities = hourlyActivity.map(activity => activity / total);
        const entropy = -probabilities.reduce((sum, p) => p > 0 ? sum + p * Math.log2(p) : sum, 0);
        return 1 - (entropy / Math.log2(hourlyActivity.length)); // Normalized regularity
    }
}
exports.ActivityFeatureExtractor = ActivityFeatureExtractor;
class SleepFeatureExtractor {
    async extract(sleepData) {
        const features = {
            // Sleep duration and timing
            sleep_duration: sleepData.sleep_duration || 7,
            bedtime_hour: sleepData.bedtime_hour || 23,
            wake_time_hour: sleepData.wake_time_hour || 7,
            // Sleep quality metrics
            sleep_efficiency: sleepData.sleep_efficiency || 0.85,
            sleep_latency: sleepData.sleep_latency || 15,
            wake_after_sleep_onset: sleepData.wake_after_sleep_onset || 30,
            // Sleep stage distribution
            light_sleep_percentage: sleepData.light_sleep_percentage || 0.55,
            deep_sleep_percentage: sleepData.deep_sleep_percentage || 0.20,
            rem_sleep_percentage: sleepData.rem_sleep_percentage || 0.25,
            // Sleep consistency
            bedtime_consistency: this.calculateBedtimeConsistency(sleepData.weekly_bedtimes || []),
            sleep_duration_consistency: this.calculateDurationConsistency(sleepData.weekly_durations || []),
            // Sleep disruption indicators
            awakenings_count: sleepData.awakenings_count || 2,
            longest_wake_period: sleepData.longest_wake_period || 5,
            // Heart rate during sleep
            sleep_hr_mean: sleepData.sleep_hr_mean || 60,
            sleep_hr_variability: sleepData.sleep_hr_variability || 5,
            // Respiratory indicators
            sleep_respiratory_rate: sleepData.sleep_respiratory_rate || 14,
            respiratory_disturbance_index: sleepData.respiratory_disturbance_index || 0,
            // Movement during sleep
            sleep_movement_index: sleepData.sleep_movement_index || 0.1,
            position_changes: sleepData.position_changes || 15,
            // Sleep environment
            room_temperature: sleepData.room_temperature || 20,
            ambient_light: sleepData.ambient_light || 0,
            noise_level: sleepData.noise_level || 30
        };
        return features;
    }
    calculateBedtimeConsistency(weeklyBedtimes) {
        if (!Array.isArray(weeklyBedtimes) || weeklyBedtimes.length === 0)
            return 0;
        // Convert bedtimes to minutes from midnight
        const bedtimeMinutes = weeklyBedtimes.map(time => {
            const [hour, minute] = time.split(':').map(Number);
            return hour * 60 + minute;
        });
        const std = this.calculateStd(bedtimeMinutes);
        return Math.max(0, 1 - (std / 60)); // Normalize to 0-1 scale
    }
    calculateDurationConsistency(weeklyDurations) {
        if (!Array.isArray(weeklyDurations) || weeklyDurations.length === 0)
            return 0;
        const std = this.calculateStd(weeklyDurations);
        return Math.max(0, 1 - (std / 2)); // Normalize to 0-1 scale
    }
    calculateStd(values) {
        if (!Array.isArray(values) || values.length === 0)
            return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
}
exports.SleepFeatureExtractor = SleepFeatureExtractor;
class TemporalFeatureExtractor {
    async extract(temporalData) {
        const features = {
            // Circadian rhythm indicators
            circadian_regularity: temporalData.circadian_regularity || 0.8,
            melatonin_onset_time: temporalData.melatonin_onset_time || 22,
            core_body_temp_nadir: temporalData.core_body_temp_nadir || 6,
            // Weekly patterns
            weekday_weekend_difference: temporalData.weekday_weekend_difference || 0.1,
            monday_effect: temporalData.monday_effect || 0,
            friday_effect: temporalData.friday_effect || 0,
            // Seasonal patterns
            seasonal_affective_score: temporalData.seasonal_affective_score || 0,
            daylight_exposure: temporalData.daylight_exposure || 8,
            // Activity timing patterns
            morning_activity_ratio: temporalData.morning_activity_ratio || 0.3,
            evening_activity_ratio: temporalData.evening_activity_ratio || 0.3,
            // Meal timing
            breakfast_time_regularity: temporalData.breakfast_time_regularity || 0.8,
            dinner_time_regularity: temporalData.dinner_time_regularity || 0.7,
            // Social jetlag
            social_jetlag: temporalData.social_jetlag || 1, // Hours
            // Chronotype indicators
            chronotype_score: temporalData.chronotype_score || 0, // -2 to +2 (extreme evening to extreme morning)
            // Shift work indicators
            shift_work_disorder_risk: temporalData.shift_work_disorder_risk || 0,
            // Time zone changes
            recent_timezone_changes: temporalData.recent_timezone_changes || 0
        };
        return features;
    }
}
exports.TemporalFeatureExtractor = TemporalFeatureExtractor;
