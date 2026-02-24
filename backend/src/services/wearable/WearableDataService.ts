/**
 * Wearable Data Service
 * Handles syncing and processing data from wearable devices (Apple Health, Fitbit, etc.)
 */

import { AppDataSource } from '../../config/data-source';
import { logger } from '../../utils/logger';

interface VitalSigns {
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodGlucose?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  bodyTemperature?: number;
  timestamp: Date;
}

interface ActivityData {
  steps: number;
  distance: number; // in meters
  activeEnergyBurned: number; // in calories
  timestamp: Date;
}

interface BodyMetrics {
  weight?: number; // in kg
  height?: number; // in cm
  bmi?: number;
  timestamp: Date;
}

interface WearableSyncPayload {
  source: 'APPLE_HEALTH' | 'FITBIT' | 'GARMIN' | 'SAMSUNG_HEALTH';
  vitals?: VitalSigns;
  activity?: ActivityData;
  bodyMetrics?: BodyMetrics;
  sleepHours?: number;
  syncedAt: string;
}

export class WearableDataService {
  /**
   * Sync wearable data from device to backend
   */
  async syncWearableData(
    userId: string,
    payload: WearableSyncPayload
  ): Promise<{ success: boolean; recordsCreated: number; alerts?: any[] }> {
    try {
      logger.info(`Syncing wearable data for user ${userId} from ${payload.source}`);

      let recordsCreated = 0;
      let alerts: any[] = [];

      // Store vitals data
      if (payload.vitals) {
        await this.storeVitalSigns(userId, payload.source, payload.vitals);
        recordsCreated++;

        // Check for abnormal vitals and generate alerts
        try {
          const { VitalsMonitoringService } = await import('../monitoring/VitalsMonitoringService');
          const monitoringService = new VitalsMonitoringService();
          alerts = await monitoringService.processVitals(userId, payload.vitals);
        } catch (error) {
          logger.error('Error monitoring vitals:', error);
          // Don't fail the sync if monitoring fails
        }
      }

      // Store activity data
      if (payload.activity) {
        await this.storeActivityData(userId, payload.source, payload.activity);
        recordsCreated++;
      }

      // Store body metrics
      if (payload.bodyMetrics) {
        await this.storeBodyMetrics(userId, payload.source, payload.bodyMetrics);
        recordsCreated++;
      }

      // Store sleep data
      if (payload.sleepHours !== undefined) {
        await this.storeSleepData(userId, payload.source, payload.sleepHours, new Date(payload.syncedAt));
        recordsCreated++;
      }

      logger.info(`Successfully synced ${recordsCreated} wearable data records for user ${userId}`, {
        alertsGenerated: alerts.length,
      });

      return {
        success: true,
        recordsCreated,
        alerts: alerts.length > 0 ? alerts : undefined,
      };
    } catch (error: any) {
      logger.error(`Error syncing wearable data for user ${userId}:`, error);
      throw new Error(`Failed to sync wearable data: ${error.message}`);
    }
  }

  /**
   * Store vital signs data
   */
  private async storeVitalSigns(
    userId: string,
    source: string,
    vitals: VitalSigns
  ): Promise<void> {
    const query = `
      INSERT INTO wearable_data (user_id, source, data_type, data, recorded_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await AppDataSource.query(query, [
      userId,
      source,
      'VITALS',
      JSON.stringify(vitals),
      vitals.timestamp,
    ]);
  }

  /**
   * Store activity data
   */
  private async storeActivityData(
    userId: string,
    source: string,
    activity: ActivityData
  ): Promise<void> {
    const query = `
      INSERT INTO wearable_data (user_id, source, data_type, data, recorded_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await AppDataSource.query(query, [
      userId,
      source,
      'ACTIVITY',
      JSON.stringify(activity),
      activity.timestamp,
    ]);
  }

  /**
   * Store body metrics
   */
  private async storeBodyMetrics(
    userId: string,
    source: string,
    metrics: BodyMetrics
  ): Promise<void> {
    const query = `
      INSERT INTO wearable_data (user_id, source, data_type, data, recorded_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await AppDataSource.query(query, [
      userId,
      source,
      'BODY_METRICS',
      JSON.stringify(metrics),
      metrics.timestamp,
    ]);
  }

  /**
   * Store sleep data
   */
  private async storeSleepData(
    userId: string,
    source: string,
    sleepHours: number,
    timestamp: Date
  ): Promise<void> {
    const query = `
      INSERT INTO wearable_data (user_id, source, data_type, data, recorded_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await AppDataSource.query(query, [
      userId,
      source,
      'SLEEP',
      JSON.stringify({ sleepHours, quality: 'ASLEEP' }),
      timestamp,
    ]);
  }

  /**
   * Get latest vital signs for a user
   */
  async getLatestVitalSigns(userId: string): Promise<VitalSigns | null> {
    const query = `
      SELECT data, recorded_at
      FROM wearable_data
      WHERE user_id = $1 AND data_type = 'VITALS'
      ORDER BY recorded_at DESC
      LIMIT 1
    `;

    const result = await AppDataSource.query(query, [userId]);

    if (result.length === 0) {
      return null;
    }

    return {
      ...result[0].data,
      timestamp: result[0].recorded_at,
    };
  }

  /**
   * Get activity summary for a date range
   */
  async getActivitySummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ActivityData[]> {
    const query = `
      SELECT data, recorded_at
      FROM wearable_data
      WHERE user_id = $1
        AND data_type = 'ACTIVITY'
        AND recorded_at BETWEEN $2 AND $3
      ORDER BY recorded_at DESC
    `;

    const results = await AppDataSource.query(query, [userId, startDate, endDate]);

    return results.map((row: any) => ({
      ...row.data,
      timestamp: row.recorded_at,
    }));
  }

  /**
   * Get body metrics history
   */
  async getBodyMetricsHistory(
    userId: string,
    limit: number = 30
  ): Promise<BodyMetrics[]> {
    const query = `
      SELECT data, recorded_at
      FROM wearable_data
      WHERE user_id = $1 AND data_type = 'BODY_METRICS'
      ORDER BY recorded_at DESC
      LIMIT $2
    `;

    const results = await AppDataSource.query(query, [userId, limit]);

    return results.map((row: any) => ({
      ...row.data,
      timestamp: row.recorded_at,
    }));
  }

  /**
   * Get sleep data for a date range
   */
  async getSleepData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ sleepHours: number; date: Date }>> {
    const query = `
      SELECT data, recorded_at
      FROM wearable_data
      WHERE user_id = $1
        AND data_type = 'SLEEP'
        AND recorded_at BETWEEN $2 AND $3
      ORDER BY recorded_at DESC
    `;

    const results = await AppDataSource.query(query, [userId, startDate, endDate]);

    return results.map((row: any) => ({
      sleepHours: row.data.sleepHours,
      date: row.recorded_at,
    }));
  }

  /**
   * Get comprehensive health dashboard data
   */
  async getHealthDashboard(userId: string): Promise<{
    latestVitals: VitalSigns | null;
    todayActivity: ActivityData | null;
    latestBodyMetrics: BodyMetrics | null;
    weeklyStepsAverage: number;
    weeklySleepAverage: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get latest vitals
    const latestVitals = await this.getLatestVitalSigns(userId);

    // Get today's activity
    const todayActivity = await this.getActivitySummary(userId, startOfDay, now);

    // Get latest body metrics
    const bodyMetricsHistory = await this.getBodyMetricsHistory(userId, 1);
    const latestBodyMetrics = bodyMetricsHistory.length > 0 ? bodyMetricsHistory[0] : null;

    // Calculate weekly averages
    const weeklyActivity = await this.getActivitySummary(userId, sevenDaysAgo, now);
    const weeklyStepsAverage = weeklyActivity.length > 0
      ? Math.round(
          weeklyActivity.reduce((sum, day) => sum + day.steps, 0) / weeklyActivity.length
        )
      : 0;

    const weeklySleep = await this.getSleepData(userId, sevenDaysAgo, now);
    const weeklySleepAverage = weeklySleep.length > 0
      ? Math.round(
          (weeklySleep.reduce((sum, day) => sum + day.sleepHours, 0) / weeklySleep.length) * 10
        ) / 10
      : 0;

    return {
      latestVitals,
      todayActivity: todayActivity.length > 0 ? todayActivity[0] : null,
      latestBodyMetrics,
      weeklyStepsAverage,
      weeklySleepAverage,
    };
  }

  /**
   * Get heart rate trends (last 30 days)
   */
  async getHeartRateTrends(userId: string): Promise<Array<{ date: Date; avgHeartRate: number }>> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const query = `
      SELECT
        DATE(recorded_at) as date,
        AVG((data->>'heartRate')::numeric) as avg_heart_rate
      FROM wearable_data
      WHERE user_id = $1
        AND data_type = 'VITALS'
        AND data->>'heartRate' IS NOT NULL
        AND recorded_at >= $2
      GROUP BY DATE(recorded_at)
      ORDER BY date DESC
    `;

    const results = await AppDataSource.query(query, [userId, thirtyDaysAgo]);

    return results.map((row: any) => ({
      date: row.date,
      avgHeartRate: Math.round(parseFloat(row.avg_heart_rate)),
    }));
  }

  /**
   * Check if user has recent wearable data (within last 24 hours)
   */
  async hasRecentData(userId: string): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const query = `
      SELECT COUNT(*) as count
      FROM wearable_data
      WHERE user_id = $1 AND synced_at >= $2
    `;

    const result = await AppDataSource.query(query, [userId, twentyFourHoursAgo]);
    return parseInt(result[0].count) > 0;
  }

  /**
   * Delete old wearable data (older than 1 year for compliance)
   */
  async cleanupOldData(): Promise<number> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const query = `
      DELETE FROM wearable_data
      WHERE recorded_at < $1
    `;

    const result = await AppDataSource.query(query, [oneYearAgo]);

    logger.info(`Cleaned up ${result.rowCount} old wearable data records`);
    return result.rowCount || 0;
  }
}

export default WearableDataService;
