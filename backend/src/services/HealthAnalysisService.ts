import axios from 'axios';
import knex from '../config/knex';
import { logger } from '../utils/logger';

export class HealthAnalysisService {
  private mlServiceUrl: string;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
  }

  /**
   * Analyze voice biomarkers
   */
  async analyzeVoice(userId: number, audioFilePath: string) {
    try {
      // Send audio to ML service for analysis
      const FormData = require('form-data');
      const fs = require('fs');
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(audioFilePath));

      const response = await axios.post(`${this.mlServiceUrl}/voice/analyze`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000,
      });

      const analysisResult = response.data;

      // Save analysis result to database
      await knex.db('voice_analyses').insert({
        user_id: userId,
        health_score: analysisResult.healthScore,
        biomarkers: JSON.stringify(analysisResult.biomarkers),
        detailed_analysis: JSON.stringify(analysisResult.detailedAnalysis),
        recommendations: JSON.stringify(analysisResult.recommendations),
        created_at: new Date(),
      });

      logger.info(`Voice analysis completed for user ${userId}`);

      return analysisResult;
    } catch (error) {
      logger.error('Voice analysis service error:', error);
      throw new Error('Failed to analyze voice');
    }
  }

  /**
   * Analyze camera frames for health markers
   */
  async analyzeCameraFrames(
    userId: number,
    framePaths: string[],
    metadata: { frameCount: number; timestamp: string }
  ) {
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

      const response = await axios.post(`${this.mlServiceUrl}/camera/analyze`, formData, {
        headers: formData.getHeaders(),
        timeout: 60000,
      });

      const analysisResult = response.data;

      // Save analysis result to database
      await knex.db('camera_analyses').insert({
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

      logger.info(`Camera analysis completed for user ${userId}`);

      return analysisResult;
    } catch (error) {
      logger.error('Camera analysis service error:', error);
      throw new Error('Failed to analyze camera frames');
    }
  }

  /**
   * Get health metrics history
   */
  async getHealthMetrics(userId: number, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await knex
        .db('health_metrics')
        .where('user_id', userId)
        .where('recorded_at', '>=', startDate)
        .orderBy('recorded_at', 'asc')
        .select('*');

      return metrics;
    } catch (error) {
      logger.error('Failed to fetch health metrics:', error);
      throw new Error('Failed to fetch health metrics');
    }
  }

  /**
   * Save health metrics
   */
  async saveHealthMetrics(
    userId: number,
    metrics: any,
    source: string,
    timestamp: string
  ) {
    try {
      const [result] = await knex.db('health_metrics').insert({
        user_id: userId,
        heart_rate: metrics.heartRate,
        heart_rate_variability: metrics.heartRateVariability,
        steps: metrics.steps,
        active_energy_burned: metrics.activeEnergyBurned,
        blood_pressure_systolic: metrics.bloodPressure?.systolic,
        blood_pressure_diastolic: metrics.bloodPressure?.diastolic,
        blood_glucose: metrics.bloodGlucose,
        body_temperature: metrics.bodyTemperature,
        oxygen_saturation: metrics.oxygenSaturation,
        respiratory_rate: metrics.respiratoryRate,
        sleep_asleep: metrics.sleepAnalysis?.asleep,
        sleep_awake: metrics.sleepAnalysis?.awake,
        sleep_in_bed: metrics.sleepAnalysis?.inBed,
        weight: metrics.weight,
        height: metrics.height,
        bmi: metrics.bmi,
        source,
        recorded_at: new Date(timestamp),
        created_at: new Date(),
      }).returning('id');

      logger.info(`Health metrics saved for user ${userId}`);

      return { id: result, success: true };
    } catch (error) {
      logger.error('Failed to save health metrics:', error);
      throw new Error('Failed to save health metrics');
    }
  }

  /**
   * Calculate infection risk score
   */
  async calculateInfectionRisk(userId: number) {
    try {
      // Get recent health metrics
      const recentMetrics = await knex
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
      const response = await axios.post(`${this.mlServiceUrl}/infection/risk`, {
        userId,
        metrics: recentMetrics,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to calculate infection risk:', error);

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
  async getEarlyWarnings(userId: number) {
    try {
      const warnings = await knex
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
    } catch (error) {
      logger.error('Failed to fetch early warnings:', error);
      return [];
    }
  }

  /**
   * Get nearby disease outbreaks
   */
  async getNearbyOutbreaks(location: { latitude: number; longitude: number; radius: number }) {
    try {
      // This would typically query a disease outbreak database or external API
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to fetch outbreaks:', error);
      return [];
    }
  }

  /**
   * Get infection-relevant biometrics
   */
  async getInfectionBiometrics(userId: number, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const biometrics = await knex
        .db('health_metrics')
        .where('user_id', userId)
        .where('recorded_at', '>=', startDate)
        .orderBy('recorded_at', 'asc')
        .select(
          'body_temperature as temperature',
          'heart_rate as heartRate',
          'heart_rate_variability as heartRateVariability',
          'respiratory_rate as respiratoryRate',
          'oxygen_saturation as oxygenSaturation',
          'recorded_at as timestamp'
        );

      return biometrics;
    } catch (error) {
      logger.error('Failed to fetch infection biometrics:', error);
      return [];
    }
  }

  /**
   * Get cancer screening data
   */
  async getCancerScreening(userId: number) {
    try {
      const screenings = await knex
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
    } catch (error) {
      logger.error('Failed to fetch cancer screening data:', error);
      return { cancers: [] };
    }
  }

  /**
   * Get genetic risk assessment
   */
  async getGeneticRisk(userId: number) {
    try {
      const genetic = await knex
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
    } catch (error) {
      logger.error('Failed to fetch genetic risk:', error);
      return {
        tested: false,
        mutations: [],
      };
    }
  }
}
