/**
 * Twilio Video Service
 * Manages video consultation sessions using Twilio Programmable Video
 */

import twilio from 'twilio';
import { getKnex } from '../../config/knex';
import { logger } from '../../utils/logger';

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

interface VideoRoomConfig {
  consultationId: string;
  patientId: string;
  providerId: string;
  enableRecording?: boolean;
  maxParticipants?: number;
}

interface AccessTokenResponse {
  token: string;
  roomName: string;
  roomSid?: string;
  identity: string;
}

export class TwilioVideoService {
  private knex = getKnex();
  private twilioClient: twilio.Twilio;
  private accountSid: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACplaceholder00000000000000000000000';
    this.apiKey = process.env.TWILIO_API_KEY || 'SKplaceholder000000000000000000000';
    this.apiSecret = process.env.TWILIO_API_SECRET || 'placeholder_secret_not_configured';

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET) {
      logger.warn('Twilio credentials not configured. Video consultations will not work.');
    }

    this.twilioClient = twilio(this.accountSid, this.apiSecret);
  }

  /**
   * Create a video room for a consultation
   */
  async createVideoRoom(config: VideoRoomConfig): Promise<{ roomSid: string; roomName: string }> {
    try {
      const roomName = `consultation-${config.consultationId}`;

      // Create Twilio video room
      const room = await this.twilioClient.video.v1.rooms.create({
        uniqueName: roomName,
        type: 'group', // Supports up to 50 participants
        recordParticipantsOnConnect: config.enableRecording || false,
        maxParticipants: config.maxParticipants || 2,
        statusCallback: `${process.env.API_BASE_URL}/api/consultations/twilio-webhook`,
        statusCallbackMethod: 'POST',
      });

      // Update consultation with Twilio room info
      await this.knex('consultations')
        .where({ id: config.consultationId })
        .update({
          twilio_room_sid: room.sid,
          twilio_room_name: room.uniqueName,
          recording_enabled: config.enableRecording || false,
          updated_at: new Date(),
        });

      logger.info(`Video room created for consultation ${config.consultationId}`, {
        roomSid: room.sid,
        roomName: room.uniqueName,
      });

      return {
        roomSid: room.sid,
        roomName: room.uniqueName,
      };
    } catch (error: any) {
      logger.error(`Error creating video room for consultation ${config.consultationId}:`, error);
      throw new Error(`Failed to create video room: ${error.message}`);
    }
  }

  /**
   * Generate access token for a participant to join a video room
   */
  async generateAccessToken(
    consultationId: string,
    userId: string,
    userName: string
  ): Promise<AccessTokenResponse> {
    try {
      // Get consultation details
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Verify user is authorized (patient or provider)
      if (consultation.patient_id !== userId && consultation.provider_id !== userId) {
        throw new Error('User not authorized for this consultation');
      }

      const roomName = consultation.twilio_room_name || `consultation-${consultationId}`;

      // Create access token
      const token = new AccessToken(this.accountSid, this.apiKey, this.apiSecret, {
        identity: userId,
        ttl: 14400, // 4 hours
      });

      // Grant video access
      const videoGrant = new VideoGrant({
        room: roomName,
      });

      token.addGrant(videoGrant);

      logger.info(`Access token generated for user ${userId} in consultation ${consultationId}`);

      return {
        token: token.toJwt(),
        roomName,
        roomSid: consultation.twilio_room_sid,
        identity: userId,
      };
    } catch (error: any) {
      logger.error(`Error generating access token for consultation ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * Start a consultation (when provider joins)
   */
  async startConsultation(consultationId: string, providerId: string): Promise<void> {
    try {
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.provider_id !== providerId) {
        throw new Error('Provider not authorized for this consultation');
      }

      // Update consultation status
      await this.knex('consultations')
        .where({ id: consultationId })
        .update({
          status: 'IN_PROGRESS',
          actual_start: new Date(),
          video_started_at: new Date(),
          updated_at: new Date(),
        });

      // Get latest vitals for snapshot
      const vitals = await this.getLatestVitals(consultation.patient_id);

      if (vitals) {
        await this.knex('consultations')
          .where({ id: consultationId })
          .update({
            vitals_snapshot: vitals,
            vitals_shared: true,
          });
      }

      logger.info(`Consultation ${consultationId} started by provider ${providerId}`);
    } catch (error: any) {
      logger.error(`Error starting consultation ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * End a consultation
   */
  async endConsultation(
    consultationId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    try {
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      const now = new Date();
      const actualStart = new Date(consultation.actual_start || consultation.video_started_at);
      const durationSeconds = Math.floor((now.getTime() - actualStart.getTime()) / 1000);

      // Update consultation
      const updates: any = {
        status: 'COMPLETED',
        actual_end: now,
        video_ended_at: now,
        video_duration_seconds: durationSeconds,
        updated_at: now,
      };

      // Add provider notes if provided
      if (notes && consultation.provider_id === userId) {
        updates.provider_notes = notes;
      }

      await this.knex('consultations')
        .where({ id: consultationId })
        .update(updates);

      // Complete Twilio room
      if (consultation.twilio_room_sid) {
        await this.completeTwilioRoom(consultation.twilio_room_sid);
      }

      // Update provider statistics
      await this.updateProviderStats(consultation.provider_id);

      logger.info(`Consultation ${consultationId} ended`, {
        duration: durationSeconds,
        endedBy: userId,
      });
    } catch (error: any) {
      logger.error(`Error ending consultation ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * Complete (close) a Twilio room
   */
  private async completeTwilioRoom(roomSid: string): Promise<void> {
    try {
      await this.twilioClient.video.v1
        .rooms(roomSid)
        .update({ status: 'completed' });

      logger.info(`Twilio room ${roomSid} completed`);
    } catch (error: any) {
      logger.error(`Error completing Twilio room ${roomSid}:`, error);
      // Don't throw - this is cleanup
    }
  }

  /**
   * Get latest vitals for a patient
   */
  private async getLatestVitals(patientId: string): Promise<any> {
    const result = await this.knex('wearable_data')
      .where({ user_id: patientId, data_type: 'VITALS' })
      .orderBy('recorded_at', 'desc')
      .first();

    return result?.data || null;
  }

  /**
   * Update provider statistics after consultation
   */
  private async updateProviderStats(providerId: string): Promise<void> {
    try {
      await this.knex.raw(`
        UPDATE providers
        SET total_consultations = (
          SELECT COUNT(*)
          FROM consultations
          WHERE provider_id = ? AND status = 'COMPLETED'
        ),
        updated_at = NOW()
        WHERE id = ?
      `, [providerId, providerId]);

      // Recalculate rating from reviews
      const avgRating = await this.knex('consultation_reviews')
        .where({ provider_id: providerId, is_visible: true })
        .avg('overall_rating as rating')
        .first();

      if (avgRating?.rating) {
        await this.knex('providers')
          .where({ id: providerId })
          .update({
            rating: parseFloat(avgRating.rating).toFixed(2),
          });
      }
    } catch (error: any) {
      logger.error(`Error updating provider stats for ${providerId}:`, error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Cancel a consultation
   */
  async cancelConsultation(
    consultationId: string,
    userId: string,
    reason: string,
    cancelledBy: 'PATIENT' | 'PROVIDER' | 'SYSTEM'
  ): Promise<void> {
    try {
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Update consultation
      await this.knex('consultations')
        .where({ id: consultationId })
        .update({
          status: 'CANCELLED',
          cancellation_reason: reason,
          cancelled_by: cancelledBy,
          updated_at: new Date(),
        });

      // Complete Twilio room if exists
      if (consultation.twilio_room_sid) {
        await this.completeTwilioRoom(consultation.twilio_room_sid);
      }

      // Handle refund if applicable
      if (consultation.payment_status === 'PAID') {
        // TODO: Integrate with payment service for refunds
        logger.info(`Refund needed for consultation ${consultationId}`);
      }

      logger.info(`Consultation ${consultationId} cancelled by ${cancelledBy}`, {
        reason,
      });
    } catch (error: any) {
      logger.error(`Error cancelling consultation ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * Get room composition (recording) URL
   */
  async getRecordingUrl(consultationId: string): Promise<string | null> {
    try {
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation?.twilio_room_sid) {
        return null;
      }

      // Get recordings for this room
      const recordings = await this.twilioClient.video.v1
        .rooms(consultation.twilio_room_sid)
        .recordings
        .list({ limit: 1 });

      if (recordings.length === 0) {
        return null;
      }

      const recordingUrl = recordings[0].url;

      // Store recording URL
      await this.knex('consultations')
        .where({ id: consultationId })
        .update({
          recording_url: recordingUrl,
          updated_at: new Date(),
        });

      return recordingUrl;
    } catch (error: any) {
      logger.error(`Error getting recording URL for consultation ${consultationId}:`, error);
      return null;
    }
  }

  /**
   * Share vitals during active consultation
   */
  async shareVitals(consultationId: string, patientId: string): Promise<void> {
    try {
      const vitals = await this.getLatestVitals(patientId);

      if (!vitals) {
        throw new Error('No vitals data available');
      }

      await this.knex('consultations')
        .where({ id: consultationId })
        .update({
          vitals_snapshot: vitals,
          vitals_shared: true,
          updated_at: new Date(),
        });

      logger.info(`Vitals shared for consultation ${consultationId}`);
    } catch (error: any) {
      logger.error(`Error sharing vitals for consultation ${consultationId}:`, error);
      throw error;
    }
  }
}

export default TwilioVideoService;
