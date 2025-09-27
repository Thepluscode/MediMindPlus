/**
 * Feature Engineering Service for MediMind Backend
 * Converts raw health data into meaningful features for ML models
 */

import {
  FeatureExtractionResult,
  VoiceFeatures,
  ActivityFeatures,
  SleepFeatures,
  HealthDataPoint,
  VitalSigns,
  ActivityData,
  SleepData,
  AnalyticsServiceError
} from '../types/analytics';

// Raw data interfaces for feature extraction
interface RawVoiceData {
  f0?: number[];
  jitter?: number;
  shimmer?: number;
  hnr?: number;
  spectral_centroid?: number;
  spectral_bandwidth?: number;
  mfcc?: number[];
  speaking_rate?: number;
  pause_ratio?: number;
  breathiness?: number;
  roughness?: number;
  valence?: number;
  arousal?: number;
  stress_level?: number;
}

interface RawActivityData {
  daily_steps?: number;
  weekly_steps?: number[];
  sedentary_time?: number;
  light_activity_time?: number;
  moderate_activity_time?: number;
  vigorous_activity_time?: number;
  resting_hr?: number;
  max_hr?: number;
  hr_variability?: number;
  gait_speed?: number;
  gait_variability?: number;
  balance_score?: number;
  hourly_activity?: number[];
  weekend_activity_ratio?: number;
  total_calories?: number;
  active_calories?: number;
}

interface RawSleepData {
  sleep_duration?: number;
  bedtime_hour?: number;
  wake_time_hour?: number;
  sleep_efficiency?: number;
  sleep_latency?: number;
  wake_after_sleep_onset?: number;
  light_sleep_percentage?: number;
  deep_sleep_percentage?: number;
  rem_sleep_percentage?: number;
  weekly_bedtimes?: string[];
  weekly_durations?: number[];
  awakenings_count?: number;
  longest_wake_period?: number;
  sleep_hr_mean?: number;
  sleep_hr_variability?: number;
  sleep_respiratory_rate?: number;
  respiratory_disturbance_index?: number;
  sleep_movement_index?: number;
  position_changes?: number;
  room_temperature?: number;
  ambient_light?: number;
  noise_level?: number;
}

interface RawTemporalData {
  circadian_regularity?: number;
  melatonin_onset_time?: number;
  core_body_temp_nadir?: number;
  weekday_weekend_difference?: number;
  monday_effect?: number;
  friday_effect?: number;
  seasonal_affective_score?: number;
  daylight_exposure?: number;
  morning_activity_ratio?: number;
  evening_activity_ratio?: number;
  breakfast_time_regularity?: number;
  dinner_time_regularity?: number;
  social_jetlag?: number;
  chronotype_score?: number;
  shift_work_disorder_risk?: number;
  recent_timezone_changes?: number;
}

interface PatientData {
  voice?: RawVoiceData;
  activity?: RawActivityData;
  sleep?: RawSleepData;
  temporal?: RawTemporalData;
}

// Feature extractor interface
interface FeatureExtractor<T, R> {
  extract(data: T): Promise<R>;
}

export class FeatureEngineeringService {
  private featureExtractors: Map<string, FeatureExtractor<any, any>>;

  constructor() {
    this.featureExtractors = new Map();
    this.setupFeatureExtractors();
  }

  private setupFeatureExtractors(): void {
    this.featureExtractors.set('voice', new VoiceFeatureExtractor());
    this.featureExtractors.set('activity', new ActivityFeatureExtractor());
    this.featureExtractors.set('sleep', new SleepFeatureExtractor());
    this.featureExtractors.set('temporal', new TemporalFeatureExtractor());
  }

  async extractFeatures(dataType: string, rawData: any): Promise<Record<string, number>> {
    const extractor = this.featureExtractors.get(dataType);
    if (!extractor) {
      throw new AnalyticsServiceError(
        `No feature extractor found for ${dataType}`,
        'EXTRACTOR_NOT_FOUND',
        400
      );
    }

    try {
      return await extractor.extract(rawData);
    } catch (error) {
      throw new AnalyticsServiceError(
        `Feature extraction failed for ${dataType}: ${error.message}`,
        'EXTRACTION_FAILED',
        500,
        { dataType, originalError: error.message }
      );
    }
  }

  async extractAllFeatures(patientData: PatientData): Promise<FeatureExtractionResult[]> {
    const results: FeatureExtractionResult[] = [];
    const extractedAt = new Date();

    for (const [dataType, extractor] of this.featureExtractors) {
      if (patientData[dataType as keyof PatientData]) {
        try {
          const features = await extractor.extract(patientData[dataType as keyof PatientData]);
          results.push({
            userId: '', // Will be set by calling service
            dataType,
            features,
            extractedAt,
            version: '1.0.0'
          });
        } catch (error) {
          console.error(`Error extracting ${dataType} features:`, error);
          // Continue with other feature types
        }
      }
    }

    return results;
  }

  // Utility method to validate extracted features
  validateFeatures(features: Record<string, number>): boolean {
    for (const [key, value] of Object.entries(features)) {
      if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        console.warn(`Invalid feature value for ${key}: ${value}`);
        return false;
      }
    }
    return true;
  }

  // Get available feature extractors
  getAvailableExtractors(): string[] {
    return Array.from(this.featureExtractors.keys());
  }
}

class VoiceFeatureExtractor implements FeatureExtractor<RawVoiceData, VoiceFeatures> {
  async extract(voiceData: RawVoiceData): Promise<VoiceFeatures> {
    const features: VoiceFeatures = {
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
      mfcc_1: voiceData.mfcc?.[0] || 0,
      mfcc_2: voiceData.mfcc?.[1] || 0,
      mfcc_3: voiceData.mfcc?.[2] || 0,

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

  private calculateMean(values: number[]): number {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStd(values: number[]): number {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateRange(values: number[]): number {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return Math.max(...values) - Math.min(...values);
  }
}

class ActivityFeatureExtractor implements FeatureExtractor<RawActivityData, ActivityFeatures> {
  async extract(activityData: RawActivityData): Promise<ActivityFeatures> {
    const features: ActivityFeatures = {
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

  private calculateStepConsistency(weeklySteps: number[]): number {
    if (!Array.isArray(weeklySteps) || weeklySteps.length === 0) return 0;
    const mean = weeklySteps.reduce((sum, steps) => sum + steps, 0) / weeklySteps.length;
    const variance = weeklySteps.reduce((sum, steps) => sum + Math.pow(steps - mean, 2), 0) / weeklySteps.length;
    return 1 / (1 + Math.sqrt(variance) / mean); // Higher consistency = lower CV
  }

  private calculateActivityRegularity(hourlyActivity: number[]): number {
    if (!Array.isArray(hourlyActivity) || hourlyActivity.length === 0) return 0;
    // Calculate entropy of hourly activity distribution
    const total = hourlyActivity.reduce((sum, activity) => sum + activity, 0);
    if (total === 0) return 0;

    const probabilities = hourlyActivity.map(activity => activity / total);
    const entropy = -probabilities.reduce((sum, p) => p > 0 ? sum + p * Math.log2(p) : sum, 0);

    return 1 - (entropy / Math.log2(hourlyActivity.length)); // Normalized regularity
  }
}

class SleepFeatureExtractor implements FeatureExtractor<RawSleepData, SleepFeatures> {
  async extract(sleepData: RawSleepData): Promise<SleepFeatures> {
    const features: SleepFeatures = {
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

  private calculateBedtimeConsistency(weeklyBedtimes: string[]): number {
    if (!Array.isArray(weeklyBedtimes) || weeklyBedtimes.length === 0) return 0;

    // Convert bedtimes to minutes from midnight
    const bedtimeMinutes = weeklyBedtimes.map(time => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    });

    const std = this.calculateStd(bedtimeMinutes);
    return Math.max(0, 1 - (std / 60)); // Normalize to 0-1 scale
  }

  private calculateDurationConsistency(weeklyDurations: number[]): number {
    if (!Array.isArray(weeklyDurations) || weeklyDurations.length === 0) return 0;
    const std = this.calculateStd(weeklyDurations);
    return Math.max(0, 1 - (std / 2)); // Normalize to 0-1 scale
  }

  private calculateStd(values: number[]): number {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

class TemporalFeatureExtractor implements FeatureExtractor<RawTemporalData, Record<string, number>> {
  async extract(temporalData: RawTemporalData): Promise<Record<string, number>> {
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

// Export all classes
export {
  VoiceFeatureExtractor,
  ActivityFeatureExtractor,
  SleepFeatureExtractor,
  TemporalFeatureExtractor
};
