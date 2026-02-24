/**
 * Health Data Integration Service
 * Combines wearable data with health profiles for enhanced risk assessment
 */

import { getKnex } from '../../config/knex';
import { logger } from '../../utils/logger';
import { UserHealthData } from '../ml/healthRiskAssessment';

export class HealthDataIntegrationService {
  private knex = getKnex();

  /**
   * Get comprehensive user health data from all sources
   * Combines: health profile, wearable data, vital signs, health records
   */
  async getComprehensiveHealthData(userId: string): Promise<UserHealthData> {
    try {
      // Get user basic info
      const user = await this.knex('users').where({ id: userId }).first();

      if (!user) {
        throw new Error('User not found');
      }

      // Get health profile
      const healthProfile = await this.knex('health_profiles')
        .where({ user_id: userId })
        .first();

      // Get latest wearable vitals (last 24 hours)
      const latestVitals = await this.getLatestWearableVitals(userId);

      // Get wearable activity data (last 7 days for averages)
      const activityData = await this.getRecentActivityData(userId, 7);

      // Get wearable body metrics
      const bodyMetrics = await this.getLatestBodyMetrics(userId);

      // Get sleep data (last 7 days average)
      const sleepData = await this.getRecentSleepData(userId, 7);

      // Combine all data sources
      const comprehensiveData: UserHealthData = {
        userId,

        // Basic demographics
        age: this.calculateAge(healthProfile?.date_of_birth),
        gender: (healthProfile?.gender?.toUpperCase() || 'OTHER') as 'MALE' | 'FEMALE' | 'OTHER',

        // Body metrics - prefer wearable data if available
        bmi: bodyMetrics?.bmi || healthProfile?.bmi || this.calculateBMI(
          bodyMetrics?.weight || healthProfile?.weight,
          bodyMetrics?.height || healthProfile?.height
        ),
        weight: bodyMetrics?.weight || healthProfile?.weight || 70,
        height: bodyMetrics?.height || healthProfile?.height || 170,

        // Vitals - from wearables (most recent)
        bloodPressure: latestVitals?.bloodPressure || healthProfile?.blood_pressure,

        // Lab values
        cholesterol: healthProfile?.cholesterol,
        fastingGlucose: latestVitals?.bloodGlucose || healthProfile?.fasting_glucose,
        a1c: healthProfile?.a1c,

        // Lifestyle
        smokingStatus: (healthProfile?.smoking_status?.toUpperCase() || 'NEVER') as 'NEVER' | 'FORMER' | 'CURRENT',
        alcoholConsumption: (healthProfile?.alcohol_consumption?.toUpperCase() || 'NONE') as 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY',

        // Activity - from wearables (7-day average)
        exerciseMinutesPerWeek: this.calculateWeeklyExerciseMinutes(activityData),

        // Medical history
        familyHistory: this.parseFamilyHistory(healthProfile?.family_history),
        medications: this.parseMedications(healthProfile?.medications),

        // Mental health
        phq9Score: healthProfile?.phq9_score,
        gad7Score: healthProfile?.gad7_score,
        sleepHoursPerNight: this.calculateAverageSleep(sleepData),
        stressLevel: healthProfile?.stress_level,
      };

      logger.info(`Comprehensive health data retrieved for user ${userId}`, {
        sources: {
          healthProfile: !!healthProfile,
          wearableVitals: !!latestVitals,
          activityData: activityData.length,
          bodyMetrics: !!bodyMetrics,
          sleepData: sleepData.length,
        },
      });

      return comprehensiveData;
    } catch (error: any) {
      logger.error(`Error getting comprehensive health data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get latest wearable vital signs
   */
  private async getLatestWearableVitals(userId: string): Promise<any> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.knex('wearable_data')
      .where({ user_id: userId, data_type: 'VITALS' })
      .where('recorded_at', '>=', twentyFourHoursAgo)
      .orderBy('recorded_at', 'desc')
      .first();

    return result?.data || null;
  }

  /**
   * Get recent activity data
   */
  private async getRecentActivityData(userId: string, days: number): Promise<any[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const results = await this.knex('wearable_data')
      .where({ user_id: userId, data_type: 'ACTIVITY' })
      .where('recorded_at', '>=', startDate)
      .orderBy('recorded_at', 'desc');

    return results.map((r: any) => r.data);
  }

  /**
   * Get latest body metrics from wearables
   */
  private async getLatestBodyMetrics(userId: string): Promise<any> {
    const result = await this.knex('wearable_data')
      .where({ user_id: userId, data_type: 'BODY_METRICS' })
      .orderBy('recorded_at', 'desc')
      .first();

    return result?.data || null;
  }

  /**
   * Get recent sleep data
   */
  private async getRecentSleepData(userId: string, days: number): Promise<any[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const results = await this.knex('wearable_data')
      .where({ user_id: userId, data_type: 'SLEEP' })
      .where('recorded_at', '>=', startDate)
      .orderBy('recorded_at', 'desc');

    return results.map((r: any) => r.data);
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth?: Date): number {
    if (!dateOfBirth) return 30; // Default

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Calculate BMI
   */
  private calculateBMI(weight?: number, height?: number): number {
    if (!weight || !height) return 25; // Default normal BMI

    // BMI = weight(kg) / (height(m))^2
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  /**
   * Calculate weekly exercise minutes from activity data
   */
  private calculateWeeklyExerciseMinutes(activityData: any[]): number {
    if (activityData.length === 0) return 0;

    // Estimate exercise minutes from steps and active energy
    // Rough estimate: 100 steps ≈ 1 minute of moderate activity
    const totalSteps = activityData.reduce((sum, day) => sum + (day.steps || 0), 0);
    const avgDailySteps = totalSteps / activityData.length;

    // Estimate weekly minutes (assuming 7 days)
    const weeklySteps = avgDailySteps * 7;
    const exerciseMinutes = Math.round(weeklySteps / 100);

    return Math.min(exerciseMinutes, 1000); // Cap at reasonable max
  }

  /**
   * Calculate average sleep hours
   */
  private calculateAverageSleep(sleepData: any[]): number {
    if (sleepData.length === 0) return 7; // Default

    const totalHours = sleepData.reduce((sum, day) => sum + (day.sleepHours || 0), 0);
    return parseFloat((totalHours / sleepData.length).toFixed(1));
  }

  /**
   * Parse family history JSON/text
   */
  private parseFamilyHistory(familyHistory?: any): string[] {
    if (!familyHistory) return [];

    if (typeof familyHistory === 'string') {
      try {
        return JSON.parse(familyHistory);
      } catch {
        return familyHistory.split(',').map((s: string) => s.trim());
      }
    }

    return Array.isArray(familyHistory) ? familyHistory : [];
  }

  /**
   * Parse medications JSON/text
   */
  private parseMedications(medications?: any): string[] {
    if (!medications) return [];

    if (typeof medications === 'string') {
      try {
        return JSON.parse(medications);
      } catch {
        return medications.split(',').map((s: string) => s.trim());
      }
    }

    return Array.isArray(medications) ? medications : [];
  }

  /**
   * Check if user has recent wearable data (determines accuracy of assessment)
   */
  async hasRecentWearableData(userId: string): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await this.knex('wearable_data')
      .where({ user_id: userId })
      .where('synced_at', '>=', twentyFourHoursAgo)
      .count('* as count')
      .first();

    return parseInt(count?.count || '0') > 0;
  }

  /**
   * Get data quality score (0-100)
   * Higher score = more complete data = more accurate risk assessment
   */
  async getDataQualityScore(userId: string): Promise<number> {
    const data = await this.getComprehensiveHealthData(userId);
    let score = 0;

    // Demographics (10 points)
    if (data.age > 0) score += 5;
    if (data.gender !== 'OTHER') score += 5;

    // Body metrics (20 points)
    if (data.weight) score += 7;
    if (data.height) score += 7;
    if (data.bmi) score += 6;

    // Vitals (30 points)
    if (data.bloodPressure) score += 15;
    if (data.fastingGlucose) score += 8;
    if (data.a1c) score += 7;

    // Lifestyle (20 points)
    if (data.smokingStatus) score += 5;
    if (data.exerciseMinutesPerWeek > 0) score += 10;
    if (data.sleepHoursPerNight) score += 5;

    // History (20 points)
    if (data.familyHistory.length > 0) score += 10;
    if (data.medications.length > 0) score += 5;
    if (data.cholesterol) score += 5;

    return Math.min(score, 100);
  }
}

export default HealthDataIntegrationService;
