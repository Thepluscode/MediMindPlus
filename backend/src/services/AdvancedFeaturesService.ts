/**
 * Advanced Features Service
 * Comprehensive service for Stroke Detection, BCI, Microbiome, Medical Copilot,
 * Athletic Performance, and Wearable Devices
 */

import knex from '../config/knex';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class AdvancedFeaturesService {

  // ============================================================================
  // STROKE DETECTION METHODS
  // ============================================================================

  /**
   * Create stroke analysis record
   */
  async createStrokeAnalysis(data: any) {
    try {
      const [analysis] = await knex.getKnex()('stroke_analyses')
        .insert({
          id: uuidv4(),
          patient_id: data.patient_id,
          scan_type: data.scan_type,
          stroke_detected: data.stroke_detected,
          stroke_type: data.stroke_type,
          confidence: data.confidence,
          time_since_onset: data.time_since_onset,
          treatment_eligible: data.treatment_eligible,
          affected_region: data.affected_region,
          infarct_volume: data.infarct_volume,
          location: JSON.stringify(data.location),
          vessel_occlusion: JSON.stringify(data.vessel_occlusion),
          recommendations: JSON.stringify(data.recommendations),
          prognosis: JSON.stringify(data.prognosis),
          clinical_context: JSON.stringify(data.clinical_context),
          processing_time_ms: data.processing_time_ms,
        })
        .returning('*');

      logger.info(`Stroke analysis created: ${analysis.id}`);
      return analysis;
    } catch (error) {
      logger.error('Error creating stroke analysis:', error);
      throw error;
    }
  }

  /**
   * Save stroke scan images
   */
  async saveStrokeScanImages(analysisId: string, images: any[]) {
    try {
      const imageRecords = images.map(img => ({
        id: uuidv4(),
        analysis_id: analysisId,
        file_name: img.file_name,
        file_path: img.file_path,
        file_type: img.file_type,
        file_size: img.file_size,
        metadata: JSON.stringify(img.metadata || {}),
      }));

      await knex.getKnex()('stroke_scan_images').insert(imageRecords);
      logger.info(`Saved ${images.length} scan images for analysis ${analysisId}`);
    } catch (error) {
      logger.error('Error saving stroke scan images:', error);
      throw error;
    }
  }

  /**
   * Get stroke analysis by ID
   */
  async getStrokeAnalysis(analysisId: string) {
    try {
      const analysis = await knex.getKnex()('stroke_analyses')
        .where({ id: analysisId })
        .first();

      if (analysis) {
        // Parse JSON fields
        analysis.location = JSON.parse(analysis.location);
        analysis.vessel_occlusion = JSON.parse(analysis.vessel_occlusion);
        analysis.recommendations = JSON.parse(analysis.recommendations);
        analysis.prognosis = JSON.parse(analysis.prognosis);
        if (analysis.clinical_context) {
          analysis.clinical_context = JSON.parse(analysis.clinical_context);
        }

        // Get associated images
        const images = await knex.getKnex()('stroke_scan_images')
          .where({ analysis_id: analysisId });

        analysis.images = images.map(img => ({
          ...img,
          metadata: img.metadata ? JSON.parse(img.metadata) : null,
        }));
      }

      return analysis;
    } catch (error) {
      logger.error('Error fetching stroke analysis:', error);
      throw error;
    }
  }

  /**
   * Get patient stroke history
   */
  async getPatientStrokeHistory(patientId: string, limit = 10) {
    try {
      const analyses = await knex.getKnex()('stroke_analyses')
        .where({ patient_id: patientId })
        .orderBy('created_at', 'desc')
        .limit(limit);

      return analyses.map(a => ({
        ...a,
        location: JSON.parse(a.location),
        vessel_occlusion: JSON.parse(a.vessel_occlusion),
        recommendations: JSON.parse(a.recommendations),
        prognosis: JSON.parse(a.prognosis),
      }));
    } catch (error) {
      logger.error('Error fetching patient stroke history:', error);
      throw error;
    }
  }

  // ============================================================================
  // WEARABLE DEVICES METHODS
  // ============================================================================

  /**
   * Connect a wearable device
   */
  async connectWearableDevice(data: any) {
    try {
      const [device] = await knex.getKnex()('wearable_devices')
        .insert({
          id: uuidv4(),
          user_id: data.user_id,
          device_type: data.device_type,
          manufacturer: data.manufacturer,
          model_name: data.model_name,
          serial_number: data.serial_number,
          firmware_version: data.firmware_version,
          status: 'connected',
          battery_level: data.battery_level || 100,
          last_sync: new Date(),
          capabilities: JSON.stringify(data.capabilities),
          auth_token_encrypted: data.auth_token_encrypted,
          external_device_id: data.external_device_id,
          settings: JSON.stringify(data.settings || {}),
        })
        .returning('*');

      logger.info(`Wearable device connected: ${device.id}`);
      return {
        ...device,
        capabilities: JSON.parse(device.capabilities),
        settings: JSON.parse(device.settings),
      };
    } catch (error) {
      logger.error('Error connecting wearable device:', error);
      throw error;
    }
  }

  /**
   * Get connected devices for user
   */
  async getConnectedDevices(userId: string) {
    try {
      const devices = await knex.getKnex()('wearable_devices')
        .where({ user_id: userId })
        .orderBy('last_sync', 'desc');

      return devices.map(d => ({
        ...d,
        capabilities: JSON.parse(d.capabilities),
        settings: d.settings ? JSON.parse(d.settings) : null,
      }));
    } catch (error) {
      logger.error('Error fetching connected devices:', error);
      throw error;
    }
  }

  /**
   * Update device sync status
   */
  async updateDeviceSync(deviceId: string, data: any) {
    try {
      const [device] = await knex.getKnex()('wearable_devices')
        .where({ id: deviceId })
        .update({
          status: data.status || 'connected',
          last_sync: new Date(),
          battery_level: data.battery_level,
          data_points_today: knex.getKnex().raw('data_points_today + ?', [data.new_data_points || 0]),
          updated_at: new Date(),
        })
        .returning('*');

      return device;
    } catch (error) {
      logger.error('Error updating device sync:', error);
      throw error;
    }
  }

  /**
   * Save biometric data
   */
  async saveBiometricData(data: any) {
    try {
      const [record] = await knex.getKnex()('biometric_data')
        .insert({
          id: uuidv4(),
          user_id: data.user_id,
          device_id: data.device_id,
          data_type: data.data_type,
          value: data.value,
          unit: data.unit,
          timestamp: data.timestamp,
          source: data.source,
          metadata: JSON.stringify(data.metadata || {}),
        })
        .returning('*');

      return record;
    } catch (error) {
      logger.error('Error saving biometric data:', error);
      throw error;
    }
  }

  /**
   * Bulk save biometric data
   */
  async bulkSaveBiometricData(userId: string, dataPoints: any[]) {
    try {
      const records = dataPoints.map(dp => ({
        id: uuidv4(),
        user_id: userId,
        device_id: dp.device_id,
        data_type: dp.data_type,
        value: dp.value,
        unit: dp.unit,
        timestamp: dp.timestamp,
        source: dp.source,
        metadata: JSON.stringify(dp.metadata || {}),
      }));

      await knex.getKnex()('biometric_data').insert(records);
      logger.info(`Saved ${records.length} biometric data points for user ${userId}`);

      return { uploaded: records.length };
    } catch (error) {
      logger.error('Error bulk saving biometric data:', error);
      throw error;
    }
  }

  /**
   * Get biometric data with filters
   */
  async getBiometricData(userId: string, filters: any) {
    try {
      let query = knex.getKnex()('biometric_data')
        .where({ user_id: userId });

      if (filters.data_type) {
        query = query.andWhere({ data_type: filters.data_type });
      }

      if (filters.start_date) {
        query = query.andWhere('timestamp', '>=', filters.start_date);
      }

      if (filters.end_date) {
        query = query.andWhere('timestamp', '<=', filters.end_date);
      }

      if (filters.device_id) {
        query = query.andWhere({ device_id: filters.device_id });
      }

      const data = await query.orderBy('timestamp', 'desc');

      return data.map(d => ({
        ...d,
        metadata: d.metadata ? JSON.parse(d.metadata) : null,
      }));
    } catch (error) {
      logger.error('Error fetching biometric data:', error);
      throw error;
    }
  }

  /**
   * Get real-time biometric summary
   */
  async getRealtimeBiometrics(userId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Heart rate
      const heartRateData = await knex.getKnex()('biometric_data')
        .where({ user_id: userId, data_type: 'heart_rate' })
        .andWhere('timestamp', '>=', today)
        .select('value', 'timestamp', 'source')
        .orderBy('timestamp', 'desc');

      const hrValues = heartRateData.map(d => d.value);
      const heartRate = {
        current: hrValues[0] || 0,
        min_today: Math.min(...hrValues) || 0,
        max_today: Math.max(...hrValues) || 0,
        avg_today: hrValues.length > 0 ? hrValues.reduce((a, b) => a + b, 0) / hrValues.length : 0,
        source: heartRateData[0]?.source || 'Unknown',
        trend: hrValues.slice(0, 9).reverse(),
        last_update: heartRateData[0]?.timestamp || new Date(),
      };

      // Steps
      const stepsData = await knex.getKnex()('biometric_data')
        .where({ user_id: userId, data_type: 'steps' })
        .andWhere('timestamp', '>=', today)
        .sum('value as total')
        .first();

      const caloriesData = await knex.getKnex()('biometric_data')
        .where({ user_id: userId, data_type: 'calories' })
        .andWhere('timestamp', '>=', today)
        .sum('value as total')
        .first();

      const distanceData = await knex.getKnex()('biometric_data')
        .where({ user_id: userId, data_type: 'distance' })
        .andWhere('timestamp', '>=', today)
        .sum('value as total')
        .first();

      const activeMinutesData = await knex.getKnex()('biometric_data')
        .where({ user_id: userId, data_type: 'active_minutes' })
        .andWhere('timestamp', '>=', today)
        .sum('value as total')
        .first();

      const steps = {
        current: parseInt(stepsData?.total || 0),
        goal: 10000,
        source: 'Apple Watch',
        calories: parseInt(caloriesData?.total || 0),
        distance: parseFloat(distanceData?.total || 0),
        active_minutes: parseInt(activeMinutesData?.total || 0),
      };

      // Sleep (from last night)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const sleepData = await knex.getKnex()('biometric_data')
        .where({ user_id: userId })
        .andWhere('timestamp', '>=', yesterday)
        .andWhere('timestamp', '<', today)
        .whereIn('data_type', ['sleep_total', 'sleep_deep', 'sleep_light', 'sleep_rem', 'sleep_awakenings', 'sleep_quality'])
        .select('data_type', 'value', 'source');

      const sleepMap: any = {};
      sleepData.forEach(d => {
        sleepMap[d.data_type] = d.value;
      });

      const sleep = {
        last_night: parseFloat(sleepMap.sleep_total || 0),
        deep_sleep: parseFloat(sleepMap.sleep_deep || 0),
        light_sleep: parseFloat(sleepMap.sleep_light || 0),
        rem_sleep: parseFloat(sleepMap.sleep_rem || 0),
        awakenings: parseInt(sleepMap.sleep_awakenings || 0),
        quality: parseInt(sleepMap.sleep_quality || 0),
        source: sleepData[0]?.source || 'Oura Ring',
      };

      // HRV
      const hrvData = await knex.getKnex()('biometric_data')
        .where({ user_id: userId, data_type: 'hrv' })
        .orderBy('timestamp', 'desc')
        .limit(7);

      const hrv = {
        current: hrvData[0]?.value || 0,
        avg_7day: hrvData.length > 0
          ? hrvData.reduce((sum, d) => sum + parseFloat(d.value), 0) / hrvData.length
          : 0,
        trend: 'improving',
        source: hrvData[0]?.source || 'Oura Ring',
        interpretation: 'Good recovery status',
      };

      return {
        heart_rate: heartRate,
        steps,
        sleep,
        hrv,
      };
    } catch (error) {
      logger.error('Error fetching realtime biometrics:', error);
      throw error;
    }
  }

  /**
   * Get data quality metrics
   */
  async getDataQuality(userId: string) {
    try {
      const devices = await this.getConnectedDevices(userId);
      const issues = await knex.getKnex()('data_quality_issues as dqi')
        .join('wearable_devices as wd', 'dqi.device_id', 'wd.id')
        .where('wd.user_id', userId)
        .andWhereNull('dqi.resolved_at')
        .select('dqi.*', 'wd.model_name as device');

      // Calculate completeness (devices with recent data)
      const recentDataCounts = await Promise.all(
        devices.map(async (device) => {
          const count = await knex.getKnex()('biometric_data')
            .where({ device_id: device.id })
            .andWhere('timestamp', '>=', knex.getKnex().raw("NOW() - INTERVAL '24 hours'"))
            .count('* as count')
            .first();
          return count?.count || 0;
        })
      );

      const completeness = devices.length > 0
        ? (recentDataCounts.filter(c => c > 0).length / devices.length) * 100
        : 0;

      // Calculate freshness (average time since last sync)
      const avgFreshness = devices.length > 0
        ? devices.reduce((sum, d) => {
            const syncAge = Date.now() - new Date(d.last_sync).getTime();
            return sum + (syncAge / (1000 * 60)); // minutes
          }, 0) / devices.length
        : 0;

      const freshness = Math.max(0, 100 - (avgFreshness / 60) * 10); // Decrease by 10% per hour

      // Accuracy estimate (based on number of issues)
      const accuracy = Math.max(0, 100 - (issues.length * 5));

      const overall_score = Math.round((completeness + freshness + accuracy) / 3);

      return {
        overall_score,
        completeness: Math.round(completeness),
        accuracy: Math.round(accuracy),
        freshness: Math.round(freshness),
        issues: issues.map(i => ({
          device: i.device,
          issue: i.description,
          severity: i.severity,
        })),
      };
    } catch (error) {
      logger.error('Error calculating data quality:', error);
      throw error;
    }
  }

  // ============================================================================
  // BCI MENTAL HEALTH METHODS
  // ============================================================================

  /**
   * Start BCI monitoring session
   */
  async startBCISession(userId: string, deviceType: string) {
    try {
      const [session] = await knex.getKnex()('bci_sessions')
        .insert({
          id: uuidv4(),
          user_id: userId,
          device_type: deviceType,
          start_time: new Date(),
          status: 'active',
        })
        .returning('*');

      logger.info(`BCI session started: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Error starting BCI session:', error);
      throw error;
    }
  }

  /**
   * Save BCI metrics
   */
  async saveBCIMetrics(data: any) {
    try {
      const [metrics] = await knex.getKnex()('bci_metrics')
        .insert({
          id: uuidv4(),
          user_id: data.user_id,
          session_id: data.session_id,
          overall_score: data.overall_score,
          depression_severity: JSON.stringify(data.depression_severity),
          anxiety_level: JSON.stringify(data.anxiety_level),
          stress_pattern: JSON.stringify(data.stress_pattern),
          cognitive_performance: JSON.stringify(data.cognitive_performance),
          sleep_brain_analysis: JSON.stringify(data.sleep_brain_analysis),
          brainwave_patterns: JSON.stringify(data.brainwave_patterns),
          measured_at: new Date(),
        })
        .returning('*');

      return metrics;
    } catch (error) {
      logger.error('Error saving BCI metrics:', error);
      throw error;
    }
  }

  /**
   * Get latest BCI metrics for user
   */
  async getLatestBCIMetrics(userId: string) {
    try {
      const metrics = await knex.getKnex()('bci_metrics')
        .where({ user_id: userId })
        .orderBy('measured_at', 'desc')
        .first();

      if (metrics) {
        return {
          ...metrics,
          depression_severity: JSON.parse(metrics.depression_severity),
          anxiety_level: JSON.parse(metrics.anxiety_level),
          stress_pattern: JSON.parse(metrics.stress_pattern),
          cognitive_performance: JSON.parse(metrics.cognitive_performance),
          sleep_brain_analysis: JSON.parse(metrics.sleep_brain_analysis),
          brainwave_patterns: JSON.parse(metrics.brainwave_patterns),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error fetching BCI metrics:', error);
      throw error;
    }
  }

  // ============================================================================
  // MICROBIOME ANALYSIS METHODS
  // ============================================================================

  /**
   * Order microbiome kit
   */
  async orderMicrobiomeKit(data: any) {
    try {
      const kitNumber = `MK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const [kit] = await knex.getKnex()('microbiome_kits')
        .insert({
          id: uuidv4(),
          user_id: data.user_id,
          kit_number: kitNumber,
          status: 'ordered',
          ordered_at: new Date(),
          shipping_address: JSON.stringify(data.shipping_address),
        })
        .returning('*');

      logger.info(`Microbiome kit ordered: ${kit.kit_number}`);
      return {
        ...kit,
        shipping_address: JSON.parse(kit.shipping_address),
      };
    } catch (error) {
      logger.error('Error ordering microbiome kit:', error);
      throw error;
    }
  }

  /**
   * Get microbiome results
   */
  async getMicrobiomeResults(userId: string) {
    try {
      const results = await knex.getKnex()('microbiome_results')
        .where({ user_id: userId })
        .orderBy('analyzed_at', 'desc')
        .first();

      if (results) {
        return {
          ...results,
          detected_conditions: JSON.parse(results.detected_conditions),
          bacterial_composition: JSON.parse(results.bacterial_composition),
          recommendations: JSON.parse(results.recommendations),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error fetching microbiome results:', error);
      throw error;
    }
  }

  // ============================================================================
  // ATHLETIC PERFORMANCE METHODS
  // ============================================================================

  /**
   * Save athletic metrics
   */
  async saveAthleticMetrics(data: any) {
    try {
      const [metrics] = await knex.getKnex()('athletic_metrics')
        .insert({
          id: uuidv4(),
          user_id: data.user_id,
          performance_score: data.performance_score,
          readiness_score: data.readiness_score,
          injury_risk: data.injury_risk,
          optimal_training_load: data.optimal_training_load,
          hrv_data: JSON.stringify(data.hrv_data),
          cognitive_performance: JSON.stringify(data.cognitive_performance),
          recovery_metrics: JSON.stringify(data.recovery_metrics),
          measured_at: new Date(),
        })
        .returning('*');

      return metrics;
    } catch (error) {
      logger.error('Error saving athletic metrics:', error);
      throw error;
    }
  }

  /**
   * Get latest athletic metrics
   */
  async getAthleticMetrics(userId: string) {
    try {
      const metrics = await knex.getKnex()('athletic_metrics')
        .where({ user_id: userId })
        .orderBy('measured_at', 'desc')
        .first();

      if (metrics) {
        return {
          ...metrics,
          hrv_data: JSON.parse(metrics.hrv_data),
          cognitive_performance: JSON.parse(metrics.cognitive_performance),
          recovery_metrics: JSON.parse(metrics.recovery_metrics),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error fetching athletic metrics:', error);
      throw error;
    }
  }

  // ============================================================================
  // USAGE TRACKING
  // ============================================================================

  /**
   * Log feature usage
   */
  async logFeatureUsage(userId: string, featureType: string, action: string, metadata: any = {}) {
    try {
      await knex.getKnex()('feature_usage_logs').insert({
        id: uuidv4(),
        user_id: userId,
        feature_type: featureType,
        action,
        metadata: JSON.stringify(metadata),
        used_at: new Date(),
      });
    } catch (error) {
      logger.error('Error logging feature usage:', error);
      // Don't throw - usage logging shouldn't break the main flow
    }
  }
}

export default new AdvancedFeaturesService();
