import { Request, Response } from 'express';
import { OnboardingService } from '../services/OnboardingService';
import { AuditService } from '../services/AuditService';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const ProfileDataSchema = z.object({
  name: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  medical_history: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  family_history: z.array(z.string()).optional(),
});

const ConsentDataSchema = z.object({
  data_processing: z.boolean(),
  data_sharing: z.boolean().optional(),
  research_participation: z.boolean().optional(),
  marketing: z.boolean().optional(),
  consent_version: z.string(),
});

const MedicalRecordSchema = z.object({
  provider_name: z.string(),
  provider_type: z.enum(['EMR', 'PHR', 'DEVICE']),
  connection_metadata: z.object({}).passthrough().optional(),
});

const DeviceSchema = z.object({
  device_name: z.string(),
  device_type: z.enum(['FITNESS_TRACKER', 'MEDICAL_DEVICE', 'SMART_HOME']),
  device_id: z.string(),
  device_metadata: z.object({}).passthrough().optional(),
  metrics_tracked: z.array(z.string()).optional(),
});

const HealthGoalSchema = z.object({
  goal_category: z.enum(['Prevention', 'Wellness', 'Performance', 'Management']),
  goal_name: z.string(),
  goal_description: z.string().optional(),
  target_metrics: z.object({}).passthrough().optional(),
  target_date: z.string().optional(),
});

export class OnboardingController {
  private onboardingService: OnboardingService;
  private auditService: AuditService;

  constructor() {
    this.onboardingService = new OnboardingService();
    this.auditService = new AuditService();
  }

  /**
   * Get current onboarding status
   * GET /api/onboarding/status
   */
  getOnboardingStatus = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const status = await this.onboardingService.getOnboardingStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Error getting onboarding status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get onboarding status',
      });
    }
  };

  /**
   * Start or resume onboarding
   * POST /api/onboarding/start
   */
  startOnboarding = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const onboarding = await this.onboardingService.startOnboarding(userId);

      // Audit log
      await this.auditService.log({
        user_id: userId,
        action: 'onboarding_started',
        resource_type: 'patient_onboarding',
        resource_id: onboarding.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: onboarding,
      });
    } catch (error) {
      logger.error('Error starting onboarding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start onboarding',
      });
    }
  };

  /**
   * Update current step
   * PUT /api/onboarding/step
   */
  updateStep = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { step } = req.body;

      if (typeof step !== 'number' || step < 0 || step > 7) {
        return res.status(400).json({
          success: false,
          error: 'Invalid step number',
        });
      }

      const updated = await this.onboardingService.updateStep(userId, step);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      logger.error('Error updating onboarding step:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update step',
      });
    }
  };

  /**
   * Save profile data
   * PUT /api/onboarding/profile
   */
  saveProfile = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const profileData = req.body;

      // Validate
      const validated = ProfileDataSchema.parse(profileData);

      const updated = await this.onboardingService.saveProfileData(userId, validated);

      // Audit log
      await this.auditService.log({
        user_id: userId,
        action: 'profile_updated',
        resource_type: 'patient_onboarding',
        resource_id: updated.id,
        details: { fields: Object.keys(validated) },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid profile data',
          details: error.errors,
        });
      }

      logger.error('Error saving profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save profile',
      });
    }
  };

  /**
   * Save consent data
   * POST /api/onboarding/consent
   */
  saveConsent = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const consentData = req.body;

      // Validate
      const validated = ConsentDataSchema.parse(consentData);

      const consents = await this.onboardingService.saveConsentData(
        userId,
        validated,
        req.ip,
        req.headers['user-agent']
      );

      // Audit log - HIPAA compliance
      await this.auditService.log({
        user_id: userId,
        action: 'consent_given',
        resource_type: 'user_consent',
        resource_id: consents[0]?.id,
        details: {
          consents: Object.keys(validated).filter(
            (key) => validated[key] === true
          ),
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        is_phi_access: true,
      });

      res.json({
        success: true,
        data: consents,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid consent data',
          details: error.errors,
        });
      }

      logger.error('Error saving consent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save consent',
      });
    }
  };

  /**
   * Connect medical record provider
   * POST /api/onboarding/medical-records
   */
  connectMedicalRecord = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const recordData = req.body;

      // Validate
      const validated = MedicalRecordSchema.parse(recordData);

      const connection = await this.onboardingService.connectMedicalRecord(
        userId,
        validated
      );

      // Audit log
      await this.auditService.log({
        user_id: userId,
        action: 'medical_record_connected',
        resource_type: 'medical_record_connection',
        resource_id: connection.id,
        details: { provider: validated.provider_name },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: connection,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid medical record data',
          details: error.errors,
        });
      }

      logger.error('Error connecting medical record:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect medical record',
      });
    }
  };

  /**
   * Get connected medical records
   * GET /api/onboarding/medical-records
   */
  getMedicalRecords = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const connections = await this.onboardingService.getMedicalRecordConnections(
        userId
      );

      res.json({
        success: true,
        data: connections,
      });
    } catch (error) {
      logger.error('Error getting medical records:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get medical records',
      });
    }
  };

  /**
   * Connect device
   * POST /api/onboarding/devices
   */
  connectDevice = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const deviceData = req.body;

      // Validate
      const validated = DeviceSchema.parse(deviceData);

      const device = await this.onboardingService.connectDevice(userId, validated);

      // Audit log
      await this.auditService.log({
        user_id: userId,
        action: 'device_connected',
        resource_type: 'connected_device',
        resource_id: device.id,
        details: {
          device_name: validated.device_name,
          device_type: validated.device_type,
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: device,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid device data',
          details: error.errors,
        });
      }

      logger.error('Error connecting device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect device',
      });
    }
  };

  /**
   * Get connected devices
   * GET /api/onboarding/devices
   */
  getDevices = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const devices = await this.onboardingService.getConnectedDevices(userId);

      res.json({
        success: true,
        data: devices,
      });
    } catch (error) {
      logger.error('Error getting devices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get devices',
      });
    }
  };

  /**
   * Disconnect device
   * DELETE /api/onboarding/devices/:deviceId
   */
  disconnectDevice = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;

      await this.onboardingService.disconnectDevice(userId, deviceId);

      // Audit log
      await this.auditService.log({
        user_id: userId,
        action: 'device_disconnected',
        resource_type: 'connected_device',
        resource_id: deviceId,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'Device disconnected successfully',
      });
    } catch (error) {
      logger.error('Error disconnecting device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect device',
      });
    }
  };

  /**
   * Add health goal
   * POST /api/onboarding/goals
   */
  addHealthGoal = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const goalData = req.body;

      // Validate
      const validated = HealthGoalSchema.parse(goalData);

      const goal = await this.onboardingService.addHealthGoal(userId, validated);

      // Audit log
      await this.auditService.log({
        user_id: userId,
        action: 'health_goal_added',
        resource_type: 'health_goal',
        resource_id: goal.id,
        details: {
          goal_category: validated.goal_category,
          goal_name: validated.goal_name,
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: goal,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid goal data',
          details: error.errors,
        });
      }

      logger.error('Error adding health goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add health goal',
      });
    }
  };

  /**
   * Get health goals
   * GET /api/onboarding/goals
   */
  getHealthGoals = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const goals = await this.onboardingService.getHealthGoals(userId);

      res.json({
        success: true,
        data: goals,
      });
    } catch (error) {
      logger.error('Error getting health goals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get health goals',
      });
    }
  };

  /**
   * Complete onboarding
   * POST /api/onboarding/complete
   */
  completeOnboarding = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const completed = await this.onboardingService.completeOnboarding(userId);

      // Audit log
      await this.auditService.log({
        user_id: userId,
        action: 'onboarding_completed',
        resource_type: 'patient_onboarding',
        resource_id: completed.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      // Trigger AI baseline analysis
      // TODO: Integrate with ML service for initial health assessment

      res.json({
        success: true,
        data: completed,
        message: 'Onboarding completed successfully! Your AI health companion is now processing your data.',
      });
    } catch (error) {
      logger.error('Error completing onboarding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete onboarding',
      });
    }
  };
}
