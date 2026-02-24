/**
 * Consultation & Video API Routes
 * Endpoints for appointment scheduling, video consultations, and provider management
 */

import { Router, Request, Response } from 'express';
import { ConsultationService } from '../services/consultations/ConsultationService';
import { TwilioVideoService } from '../services/video/TwilioVideoService';
import { authenticate } from '../middleware/authorization';
import { logger } from '../utils/logger';

const router = Router();
const consultationService = new ConsultationService();
const videoService = new TwilioVideoService();

/**
 * GET /consultations/providers/search
 * Search for available healthcare providers
 */
router.get(
  '/providers/search',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        specialty: req.query.specialty as string,
        acceptingPatients: req.query.acceptingPatients === 'true',
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        maxFee: req.query.maxFee ? parseInt(req.query.maxFee as string) : undefined,
      };

      const providers = await consultationService.searchProviders(filters);

      res.json({
        success: true,
        data: {
          providers,
          count: providers.length,
        },
      });
    } catch (error: any) {
      logger.error('Error searching providers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search providers',
      });
    }
  }
);

/**
 * GET /consultations/providers/:providerId/availability
 * Get available time slots for a provider
 */
router.get(
  '/providers/:providerId/availability',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Valid startDate and endDate are required',
        });
      }

      const availability = await consultationService.getProviderAvailability(
        providerId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: {
          providerId,
          dateRange: { start: startDate, end: endDate },
          slots: availability,
          totalSlots: availability.length,
        },
      });
    } catch (error: any) {
      logger.error('Error getting provider availability:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get provider availability',
      });
    }
  }
);

/**
 * POST /consultations/book
 * Book a new consultation
 */
router.post(
  '/book',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { providerId, scheduledStart, scheduledEnd, consultationType, reasonForVisit, patientNotes } = req.body;
      const patientId = req.user?.id;

      if (!patientId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      if (!providerId || !scheduledStart || !consultationType || !reasonForVisit) {
        return res.status(400).json({
          success: false,
          error: 'providerId, scheduledStart, consultationType, and reasonForVisit are required',
        });
      }

      const consultation = await consultationService.createConsultation({
        patientId,
        providerId,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : new Date(new Date(scheduledStart).getTime() + 30 * 60000),
        consultationType,
        reasonForVisit,
        patientNotes,
      });

      res.status(201).json({
        success: true,
        message: 'Consultation booked successfully',
        data: consultation,
      });
    } catch (error: any) {
      logger.error('Error booking consultation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to book consultation',
      });
    }
  }
);

/**
 * GET /consultations/patient/:patientId
 * Get all consultations for a patient
 */
router.get(
  '/patient/:patientId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      const status = req.query.status ? (req.query.status as string).split(',') : undefined;

      // Verify user has permission
      if (req.user?.id !== patientId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access',
        });
      }

      const consultations = await consultationService.getPatientConsultations(patientId, status);

      res.json({
        success: true,
        data: {
          consultations,
          count: consultations.length,
        },
      });
    } catch (error: any) {
      logger.error('Error getting patient consultations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get consultations',
      });
    }
  }
);

/**
 * GET /consultations/provider/:providerId
 * Get all consultations for a provider
 */
router.get(
  '/provider/:providerId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const status = req.query.status ? (req.query.status as string).split(',') : undefined;

      // Verify provider access
      if (req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Provider access required',
        });
      }

      const consultations = await consultationService.getProviderConsultations(providerId, status);

      res.json({
        success: true,
        data: {
          consultations,
          count: consultations.length,
        },
      });
    } catch (error: any) {
      logger.error('Error getting provider consultations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get consultations',
      });
    }
  }
);

/**
 * GET /consultations/:consultationId
 * Get consultation details by ID
 */
router.get(
  '/:consultationId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;

      const consultation = await consultationService.getConsultationById(consultationId);

      // Verify user has permission
      if (
        req.user?.id !== consultation.patient_id &&
        req.user?.id !== consultation.provider_id &&
        req.user?.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to consultation',
        });
      }

      res.json({
        success: true,
        data: consultation,
      });
    } catch (error: any) {
      logger.error('Error getting consultation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get consultation',
      });
    }
  }
);

/**
 * POST /consultations/:consultationId/video/token
 * Generate Twilio access token for video session
 */
router.post(
  '/:consultationId/video/token',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;
      const userId = req.user?.id;
      const userName = `${req.user?.first_name} ${req.user?.last_name}`;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const tokenData = await videoService.generateAccessToken(
        consultationId,
        userId,
        userName
      );

      res.json({
        success: true,
        data: tokenData,
      });
    } catch (error: any) {
      logger.error('Error generating video token:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate video token',
      });
    }
  }
);

/**
 * POST /consultations/:consultationId/video/start
 * Start a video consultation (provider only)
 */
router.post(
  '/:consultationId/video/start',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;
      const providerId = req.user?.id;

      if (req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Provider access required',
        });
      }

      if (!providerId) {
        return res.status(401).json({
          success: false,
          error: 'Provider not authenticated',
        });
      }

      // Create video room if doesn't exist
      const consultation = await consultationService.getConsultationById(consultationId);

      if (!consultation.twilio_room_sid) {
        await videoService.createVideoRoom({
          consultationId,
          patientId: consultation.patient_id,
          providerId,
          enableRecording: req.body.enableRecording || false,
        });
      }

      // Start consultation
      await videoService.startConsultation(consultationId, providerId);

      res.json({
        success: true,
        message: 'Consultation started',
      });
    } catch (error: any) {
      logger.error('Error starting consultation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start consultation',
      });
    }
  }
);

/**
 * POST /consultations/:consultationId/video/end
 * End a video consultation
 */
router.post(
  '/:consultationId/video/end',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;
      const userId = req.user?.id;
      const { notes } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      await videoService.endConsultation(consultationId, userId, notes);

      res.json({
        success: true,
        message: 'Consultation ended successfully',
      });
    } catch (error: any) {
      logger.error('Error ending consultation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to end consultation',
      });
    }
  }
);

/**
 * POST /consultations/:consultationId/cancel
 * Cancel a consultation
 */
router.post(
  '/:consultationId/cancel',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      if (!userId || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Reason for cancellation is required',
        });
      }

      const consultation = await consultationService.getConsultationById(consultationId);

      const cancelledBy =
        consultation.patient_id === userId ? 'PATIENT' :
        consultation.provider_id === userId ? 'PROVIDER' : 'SYSTEM';

      await videoService.cancelConsultation(consultationId, userId, reason, cancelledBy);

      res.json({
        success: true,
        message: 'Consultation cancelled successfully',
      });
    } catch (error: any) {
      logger.error('Error cancelling consultation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel consultation',
      });
    }
  }
);

/**
 * PUT /consultations/:consultationId/notes
 * Update consultation notes (provider only)
 */
router.put(
  '/:consultationId/notes',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;
      const providerId = req.user?.id;

      if (req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Provider access required',
        });
      }

      if (!providerId) {
        return res.status(401).json({
          success: false,
          error: 'Provider not authenticated',
        });
      }

      const { providerNotes, diagnosisCodes, treatmentPlan } = req.body;

      await consultationService.updateConsultationNotes(consultationId, providerId, {
        providerNotes,
        diagnosisCodes,
        treatmentPlan,
      });

      res.json({
        success: true,
        message: 'Consultation notes updated',
      });
    } catch (error: any) {
      logger.error('Error updating consultation notes:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update notes',
      });
    }
  }
);

/**
 * POST /consultations/:consultationId/no-show
 * Mark patient as no-show (provider only)
 */
router.post(
  '/:consultationId/no-show',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;
      const providerId = req.user?.id;

      if (req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Provider access required',
        });
      }

      if (!providerId) {
        return res.status(401).json({
          success: false,
          error: 'Provider not authenticated',
        });
      }

      await consultationService.markNoShow(consultationId, providerId);

      res.json({
        success: true,
        message: 'Consultation marked as no-show',
      });
    } catch (error: any) {
      logger.error('Error marking no-show:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark as no-show',
      });
    }
  }
);

/**
 * POST /consultations/:consultationId/review
 * Submit consultation review (patient only)
 */
router.post(
  '/:consultationId/review',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;
      const patientId = req.user?.id;

      if (!patientId) {
        return res.status(401).json({
          success: false,
          error: 'Patient not authenticated',
        });
      }

      const {
        overallRating,
        communicationRating,
        professionalismRating,
        careQualityRating,
        waitTimeRating,
        reviewText,
        wouldRecommend,
      } = req.body;

      if (!overallRating || overallRating < 1 || overallRating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Valid overallRating (1-5) is required',
        });
      }

      await consultationService.submitReview(consultationId, patientId, {
        overallRating,
        communicationRating,
        professionalismRating,
        careQualityRating,
        waitTimeRating,
        reviewText,
        wouldRecommend,
      });

      res.json({
        success: true,
        message: 'Review submitted successfully',
      });
    } catch (error: any) {
      logger.error('Error submitting review:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit review',
      });
    }
  }
);

/**
 * POST /consultations/:consultationId/vitals/share
 * Share real-time vitals during consultation
 */
router.post(
  '/:consultationId/vitals/share',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.params;
      const patientId = req.user?.id;

      if (!patientId) {
        return res.status(401).json({
          success: false,
          error: 'Patient not authenticated',
        });
      }

      await videoService.shareVitals(consultationId, patientId);

      res.json({
        success: true,
        message: 'Vitals shared with provider',
      });
    } catch (error: any) {
      logger.error('Error sharing vitals:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to share vitals',
      });
    }
  }
);

/**
 * POST /consultations/twilio-webhook
 * Webhook for Twilio video events
 */
router.post(
  '/twilio-webhook',
  async (req: Request, res: Response) => {
    try {
      const { RoomSid, RoomName, StatusCallbackEvent } = req.body;

      logger.info('Twilio webhook received', {
        roomSid: RoomSid,
        roomName: RoomName,
        event: StatusCallbackEvent,
      });

      // Handle different room events
      switch (StatusCallbackEvent) {
        case 'room-created':
          logger.info(`Room created: ${RoomSid}`);
          break;
        case 'room-ended':
          logger.info(`Room ended: ${RoomSid}`);
          break;
        case 'participant-connected':
          logger.info(`Participant connected to room: ${RoomSid}`);
          break;
        case 'participant-disconnected':
          logger.info(`Participant disconnected from room: ${RoomSid}`);
          break;
        default:
          logger.info(`Unknown event: ${StatusCallbackEvent}`);
      }

      res.status(200).send('OK');
    } catch (error: any) {
      logger.error('Error processing Twilio webhook:', error);
      res.status(500).send('Error');
    }
  }
);

export default router;
