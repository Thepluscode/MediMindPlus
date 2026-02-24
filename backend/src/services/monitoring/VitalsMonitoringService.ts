/**
 * Real-Time Vitals Monitoring Service
 * Monitors wearable data for abnormal vitals and triggers alerts
 */

import { getKnex } from '../../config/knex';
import { logger } from '../../utils/logger';

interface VitalAlert {
  userId: string;
  vitalType: string;
  value: number;
  normalRange: { min: number; max: number };
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  recommendations: string[];
  timestamp: Date;
}

interface VitalThresholds {
  heartRate: { min: number; max: number; criticalMin: number; criticalMax: number };
  bloodPressureSystolic: { min: number; max: number; criticalMin: number; criticalMax: number };
  bloodPressureDiastolic: { min: number; max: number; criticalMin: number; criticalMax: number };
  oxygenSaturation: { min: number; criticalMin: number };
  bloodGlucose: { min: number; max: number; criticalMin: number; criticalMax: number };
  bodyTemperature: { min: number; max: number; criticalMin: number; criticalMax: number };
  respiratoryRate: { min: number; max: number; criticalMin: number; criticalMax: number };
}

export class VitalsMonitoringService {
  private knex = getKnex();

  // Standard vital sign thresholds (based on medical guidelines)
  private readonly THRESHOLDS: VitalThresholds = {
    heartRate: {
      min: 60,
      max: 100,
      criticalMin: 40,
      criticalMax: 150,
    },
    bloodPressureSystolic: {
      min: 90,
      max: 140,
      criticalMin: 70,
      criticalMax: 180,
    },
    bloodPressureDiastolic: {
      min: 60,
      max: 90,
      criticalMin: 40,
      criticalMax: 120,
    },
    oxygenSaturation: {
      min: 95,
      criticalMin: 90,
    },
    bloodGlucose: {
      min: 70,
      max: 140,
      criticalMin: 50,
      criticalMax: 250,
    },
    bodyTemperature: {
      min: 36.1,
      max: 37.8,
      criticalMin: 35.0,
      criticalMax: 40.0,
    },
    respiratoryRate: {
      min: 12,
      max: 20,
      criticalMin: 8,
      criticalMax: 30,
    },
  };

  /**
   * Process new vitals data and check for abnormalities
   */
  async processVitals(userId: string, vitals: any): Promise<VitalAlert[]> {
    const alerts: VitalAlert[] = [];

    try {
      // Check heart rate
      if (vitals.heartRate) {
        const alert = this.checkHeartRate(userId, vitals.heartRate);
        if (alert) alerts.push(alert);
      }

      // Check blood pressure
      if (vitals.bloodPressure) {
        const bpAlerts = this.checkBloodPressure(userId, vitals.bloodPressure);
        alerts.push(...bpAlerts);
      }

      // Check oxygen saturation
      if (vitals.oxygenSaturation) {
        const alert = this.checkOxygenSaturation(userId, vitals.oxygenSaturation);
        if (alert) alerts.push(alert);
      }

      // Check blood glucose
      if (vitals.bloodGlucose) {
        const alert = this.checkBloodGlucose(userId, vitals.bloodGlucose);
        if (alert) alerts.push(alert);
      }

      // Check body temperature
      if (vitals.bodyTemperature) {
        const alert = this.checkBodyTemperature(userId, vitals.bodyTemperature);
        if (alert) alerts.push(alert);
      }

      // Check respiratory rate
      if (vitals.respiratoryRate) {
        const alert = this.checkRespiratoryRate(userId, vitals.respiratoryRate);
        if (alert) alerts.push(alert);
      }

      // Store alerts in database
      if (alerts.length > 0) {
        await this.storeAlerts(alerts);
        await this.notifyUser(userId, alerts);
      }

      logger.info(`Processed vitals for user ${userId}`, {
        alertsGenerated: alerts.length,
        criticalAlerts: alerts.filter((a) => a.severity === 'CRITICAL').length,
      });

      return alerts;
    } catch (error: any) {
      logger.error(`Error processing vitals for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check heart rate
   */
  private checkHeartRate(userId: string, heartRate: number): VitalAlert | null {
    const { min, max, criticalMin, criticalMax } = this.THRESHOLDS.heartRate;

    if (heartRate <= criticalMin || heartRate >= criticalMax) {
      return {
        userId,
        vitalType: 'HEART_RATE',
        value: heartRate,
        normalRange: { min, max },
        severity: 'CRITICAL',
        message: `Critical heart rate detected: ${heartRate} bpm`,
        recommendations: [
          'URGENT: Seek immediate medical attention',
          'Call 911 if experiencing chest pain, shortness of breath, or dizziness',
          'Do not drive yourself to the hospital',
        ],
        timestamp: new Date(),
      };
    }

    if (heartRate < min || heartRate > max) {
      return {
        userId,
        vitalType: 'HEART_RATE',
        value: heartRate,
        normalRange: { min, max },
        severity: 'WARNING',
        message: `Abnormal heart rate: ${heartRate} bpm (normal: ${min}-${max})`,
        recommendations: [
          'Monitor your heart rate closely',
          'Contact your doctor if symptoms persist',
          'Rest and avoid strenuous activity',
        ],
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Check blood pressure
   */
  private checkBloodPressure(
    userId: string,
    bp: { systolic: number; diastolic: number }
  ): VitalAlert[] {
    const alerts: VitalAlert[] = [];

    // Check systolic
    const systolicThresholds = this.THRESHOLDS.bloodPressureSystolic;
    if (bp.systolic <= systolicThresholds.criticalMin || bp.systolic >= systolicThresholds.criticalMax) {
      alerts.push({
        userId,
        vitalType: 'BLOOD_PRESSURE_SYSTOLIC',
        value: bp.systolic,
        normalRange: { min: systolicThresholds.min, max: systolicThresholds.max },
        severity: 'CRITICAL',
        message: `Critical blood pressure: ${bp.systolic}/${bp.diastolic} mmHg`,
        recommendations: [
          'URGENT: Seek immediate medical attention',
          'This could indicate hypertensive crisis or severe hypotension',
          'Call 911 if experiencing severe headache, chest pain, or confusion',
        ],
        timestamp: new Date(),
      });
    } else if (bp.systolic < systolicThresholds.min || bp.systolic > systolicThresholds.max) {
      alerts.push({
        userId,
        vitalType: 'BLOOD_PRESSURE_SYSTOLIC',
        value: bp.systolic,
        normalRange: { min: systolicThresholds.min, max: systolicThresholds.max },
        severity: 'WARNING',
        message: `Elevated blood pressure: ${bp.systolic}/${bp.diastolic} mmHg`,
        recommendations: [
          'Schedule appointment with your doctor within 1 week',
          'Reduce sodium intake',
          'Monitor blood pressure daily',
          'Practice stress reduction techniques',
        ],
        timestamp: new Date(),
      });
    }

    // Check diastolic
    const diastolicThresholds = this.THRESHOLDS.bloodPressureDiastolic;
    if (
      bp.diastolic <= diastolicThresholds.criticalMin ||
      bp.diastolic >= diastolicThresholds.criticalMax
    ) {
      if (alerts.length === 0) {
        // Only add if not already added critical systolic alert
        alerts.push({
          userId,
          vitalType: 'BLOOD_PRESSURE_DIASTOLIC',
          value: bp.diastolic,
          normalRange: { min: diastolicThresholds.min, max: diastolicThresholds.max },
          severity: 'CRITICAL',
          message: `Critical blood pressure: ${bp.systolic}/${bp.diastolic} mmHg`,
          recommendations: [
            'URGENT: Seek immediate medical attention',
            'This could indicate hypertensive crisis or severe hypotension',
          ],
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Check oxygen saturation
   */
  private checkOxygenSaturation(userId: string, o2Sat: number): VitalAlert | null {
    const { min, criticalMin } = this.THRESHOLDS.oxygenSaturation;

    if (o2Sat <= criticalMin) {
      return {
        userId,
        vitalType: 'OXYGEN_SATURATION',
        value: o2Sat,
        normalRange: { min, max: 100 },
        severity: 'CRITICAL',
        message: `Critical oxygen saturation: ${o2Sat}%`,
        recommendations: [
          'URGENT: Seek immediate medical attention',
          'Call 911 - this indicates severe hypoxemia',
          'Sit upright and try to remain calm',
          'Use supplemental oxygen if available',
        ],
        timestamp: new Date(),
      };
    }

    if (o2Sat < min) {
      return {
        userId,
        vitalType: 'OXYGEN_SATURATION',
        value: o2Sat,
        normalRange: { min, max: 100 },
        severity: 'WARNING',
        message: `Low oxygen saturation: ${o2Sat}%`,
        recommendations: [
          'Contact your doctor immediately',
          'Rest and avoid physical exertion',
          'Take deep breaths',
          'Monitor closely and seek ER if it drops further',
        ],
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Check blood glucose
   */
  private checkBloodGlucose(userId: string, glucose: number): VitalAlert | null {
    const { min, max, criticalMin, criticalMax } = this.THRESHOLDS.bloodGlucose;

    if (glucose <= criticalMin || glucose >= criticalMax) {
      return {
        userId,
        vitalType: 'BLOOD_GLUCOSE',
        value: glucose,
        normalRange: { min, max },
        severity: 'CRITICAL',
        message: `Critical blood glucose: ${glucose} mg/dL`,
        recommendations: [
          glucose <= criticalMin
            ? 'URGENT: Severe hypoglycemia - consume 15g fast-acting carbs immediately'
            : 'URGENT: Severe hyperglycemia - seek immediate medical attention',
          'Call 911 if confused, unconscious, or experiencing severe symptoms',
          'Contact your endocrinologist',
        ],
        timestamp: new Date(),
      };
    }

    if (glucose < min || glucose > max) {
      return {
        userId,
        vitalType: 'BLOOD_GLUCOSE',
        value: glucose,
        normalRange: { min, max },
        severity: 'WARNING',
        message: `Abnormal blood glucose: ${glucose} mg/dL`,
        recommendations: [
          glucose < min ? 'Consume 15g carbs and retest in 15 minutes' : 'Check ketones and stay hydrated',
          'Contact your doctor if levels don\'t normalize',
          'Review your diabetes management plan',
        ],
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Check body temperature
   */
  private checkBodyTemperature(userId: string, temp: number): VitalAlert | null {
    const { min, max, criticalMin, criticalMax } = this.THRESHOLDS.bodyTemperature;

    if (temp <= criticalMin || temp >= criticalMax) {
      return {
        userId,
        vitalType: 'BODY_TEMPERATURE',
        value: temp,
        normalRange: { min, max },
        severity: 'CRITICAL',
        message: `Critical body temperature: ${temp}°C`,
        recommendations: [
          'URGENT: Seek immediate medical attention',
          temp <= criticalMin
            ? 'Hypothermia - warm gradually with blankets'
            : 'High fever - seek emergency care',
        ],
        timestamp: new Date(),
      };
    }

    if (temp < min || temp > max) {
      return {
        userId,
        vitalType: 'BODY_TEMPERATURE',
        value: temp,
        normalRange: { min, max },
        severity: 'WARNING',
        message: `Abnormal temperature: ${temp}°C`,
        recommendations: [
          temp < min ? 'Warm up gradually' : 'Take fever reducer (acetaminophen/ibuprofen)',
          'Stay hydrated',
          'Contact doctor if persists > 24 hours',
        ],
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Check respiratory rate
   */
  private checkRespiratoryRate(userId: string, rate: number): VitalAlert | null {
    const { min, max, criticalMin, criticalMax } = this.THRESHOLDS.respiratoryRate;

    if (rate <= criticalMin || rate >= criticalMax) {
      return {
        userId,
        vitalType: 'RESPIRATORY_RATE',
        value: rate,
        normalRange: { min, max },
        severity: 'CRITICAL',
        message: `Critical respiratory rate: ${rate} breaths/min`,
        recommendations: [
          'URGENT: Seek immediate medical attention',
          'Call 911 - this indicates respiratory distress',
        ],
        timestamp: new Date(),
      };
    }

    if (rate < min || rate > max) {
      return {
        userId,
        vitalType: 'RESPIRATORY_RATE',
        value: rate,
        normalRange: { min, max },
        severity: 'WARNING',
        message: `Abnormal respiratory rate: ${rate} breaths/min`,
        recommendations: [
          'Monitor closely',
          'Practice slow, deep breathing',
          'Contact doctor if symptoms worsen',
        ],
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Store alerts in database
   */
  private async storeAlerts(alerts: VitalAlert[]): Promise<void> {
    const records = alerts.map((alert) => ({
      user_id: alert.userId,
      alert_type: 'VITAL_ABNORMALITY',
      severity: alert.severity,
      title: alert.message,
      message: JSON.stringify({
        vitalType: alert.vitalType,
        value: alert.value,
        normalRange: alert.normalRange,
        recommendations: alert.recommendations,
      }),
      created_at: alert.timestamp,
      read: false,
    }));

    await this.knex('notifications').insert(records);
  }

  /**
   * Notify user of alerts (email, SMS, push notification)
   */
  private async notifyUser(userId: string, alerts: VitalAlert[]): Promise<void> {
    // Get user contact info
    const user = await this.knex('users').where({ id: userId }).first();

    if (!user) return;

    // Send critical alerts via multiple channels
    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');

    if (criticalAlerts.length > 0) {
      logger.warn(`CRITICAL ALERTS for user ${userId}:`, {
        alerts: criticalAlerts.map((a) => ({
          type: a.vitalType,
          value: a.value,
          message: a.message,
        })),
      });

      // TODO: Integrate with notification services (email, SMS, push)
      // - SendGrid for email
      // - Twilio for SMS
      // - Firebase for push notifications
    }
  }

  /**
   * Get recent alerts for user
   */
  async getRecentAlerts(userId: string, hours: number = 24): Promise<VitalAlert[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const results = await this.knex('notifications')
      .where({ user_id: userId, alert_type: 'VITAL_ABNORMALITY' })
      .where('created_at', '>=', startTime)
      .orderBy('created_at', 'desc');

    return results.map((row: any) => {
      const messageData = JSON.parse(row.message);
      return {
        userId: row.user_id,
        vitalType: messageData.vitalType,
        value: messageData.value,
        normalRange: messageData.normalRange,
        severity: row.severity,
        message: row.title,
        recommendations: messageData.recommendations,
        timestamp: row.created_at,
      };
    });
  }
}

export default VitalsMonitoringService;
