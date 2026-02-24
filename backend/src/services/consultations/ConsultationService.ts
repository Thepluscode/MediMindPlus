/**
 * Consultation Service
 * Manages appointment scheduling, booking, and consultation lifecycle
 */

import { getKnex } from '../../config/knex';
import { logger } from '../../utils/logger';

interface CreateConsultationRequest {
  patientId: string;
  providerId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  consultationType: string;
  reasonForVisit: string;
  patientNotes?: string;
}

interface ProviderSearchFilters {
  specialty?: string;
  acceptingPatients?: boolean;
  minRating?: number;
  maxFee?: number;
  availability?: Date;
}

export class ConsultationService {
  private knex = getKnex();

  /**
   * Search for available providers
   */
  async searchProviders(filters: ProviderSearchFilters): Promise<any[]> {
    try {
      let query = this.knex('providers')
        .join('users', 'providers.user_id', 'users.id')
        .select(
          'providers.id',
          'users.first_name',
          'users.last_name',
          'users.email',
          'providers.specialty',
          'providers.subspecialties',
          'providers.years_experience',
          'providers.bio',
          'providers.profile_image_url',
          'providers.rating',
          'providers.total_consultations',
          'providers.total_reviews',
          'providers.consultation_fee',
          'providers.consultation_duration_minutes',
          'providers.accepted_insurance',
          'providers.languages',
          'providers.accepting_patients'
        )
        .where('providers.status', 'ACTIVE')
        .where('providers.verification_status', 'VERIFIED');

      // Apply filters
      if (filters.specialty) {
        query = query.where('providers.specialty', filters.specialty);
      }

      if (filters.acceptingPatients !== undefined) {
        query = query.where('providers.accepting_patients', filters.acceptingPatients);
      }

      if (filters.minRating) {
        query = query.where('providers.rating', '>=', filters.minRating);
      }

      if (filters.maxFee) {
        query = query.where('providers.consultation_fee', '<=', filters.maxFee);
      }

      // Order by rating and experience
      query = query.orderBy('providers.rating', 'desc')
        .orderBy('providers.years_experience', 'desc');

      const providers = await query;

      logger.info('Provider search completed', {
        filters,
        resultsCount: providers.length,
      });

      return providers;
    } catch (error: any) {
      logger.error('Error searching providers:', error);
      throw error;
    }
  }

  /**
   * Get provider availability slots
   */
  async getProviderAvailability(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      // Get provider's weekly schedule
      const availability = await this.knex('provider_availability')
        .where({ provider_id: providerId, is_available: true })
        .orderBy('day_of_week')
        .orderBy('start_time');

      // Get existing consultations in this date range
      const existingConsultations = await this.knex('consultations')
        .where({ provider_id: providerId })
        .whereIn('status', ['SCHEDULED', 'IN_PROGRESS'])
        .whereBetween('scheduled_start', [startDate, endDate])
        .select('scheduled_start', 'scheduled_end');

      // Get provider's consultation duration
      const provider = await this.knex('providers')
        .where({ id: providerId })
        .first();

      const slotDuration = provider?.consultation_duration_minutes || 30;

      // Generate available time slots
      const availableSlots = this.generateTimeSlots(
        availability,
        existingConsultations,
        startDate,
        endDate,
        slotDuration
      );

      return availableSlots;
    } catch (error: any) {
      logger.error(`Error getting availability for provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Generate available time slots based on provider schedule
   */
  private generateTimeSlots(
    availability: any[],
    existingConsultations: any[],
    startDate: Date,
    endDate: Date,
    slotDuration: number
  ): any[] {
    const slots: any[] = [];
    const dayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = dayMap[currentDate.getDay()];

      // Find availability for this day
      const dayAvailability = availability.filter(a =>
        a.day_of_week === dayOfWeek &&
        (a.is_recurring || (a.specific_date &&
          new Date(a.specific_date).toDateString() === currentDate.toDateString()))
      );

      // Generate slots for each availability window
      for (const avail of dayAvailability) {
        const [startHour, startMinute] = avail.start_time.split(':').map(Number);
        const [endHour, endMinute] = avail.end_time.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const windowEnd = new Date(currentDate);
        windowEnd.setHours(endHour, endMinute, 0, 0);

        // Generate slots within this window
        while (slotStart < windowEnd) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

          // Check if slot conflicts with existing consultation
          const hasConflict = existingConsultations.some(consult => {
            const consultStart = new Date(consult.scheduled_start);
            const consultEnd = new Date(consult.scheduled_end);
            return (slotStart < consultEnd && slotEnd > consultStart);
          });

          if (!hasConflict && slotEnd <= windowEnd) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              duration: slotDuration,
              available: true,
            });
          }

          slotStart = slotEnd;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    return slots;
  }

  /**
   * Create a new consultation/appointment
   */
  async createConsultation(request: CreateConsultationRequest): Promise<any> {
    try {
      // Validate provider availability
      const isAvailable = await this.validateTimeSlot(
        request.providerId,
        request.scheduledStart,
        request.scheduledEnd
      );

      if (!isAvailable) {
        throw new Error('Time slot is not available');
      }

      // Get provider consultation fee
      const provider = await this.knex('providers')
        .where({ id: request.providerId })
        .first();

      if (!provider) {
        throw new Error('Provider not found');
      }

      // Create consultation record
      const [consultation] = await this.knex('consultations')
        .insert({
          patient_id: request.patientId,
          provider_id: request.providerId,
          scheduled_start: request.scheduledStart,
          scheduled_end: request.scheduledEnd,
          consultation_type: request.consultationType,
          reason_for_visit: request.reasonForVisit,
          patient_notes: request.patientNotes,
          status: 'SCHEDULED',
          amount_charged: provider.consultation_fee,
          payment_status: 'PENDING',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      logger.info('Consultation created', {
        consultationId: consultation.id,
        patientId: request.patientId,
        providerId: request.providerId,
        scheduledStart: request.scheduledStart,
      });

      // TODO: Send confirmation notifications
      // TODO: Create payment intent with Stripe

      return consultation;
    } catch (error: any) {
      logger.error('Error creating consultation:', error);
      throw error;
    }
  }

  /**
   * Validate that a time slot is available
   */
  private async validateTimeSlot(
    providerId: string,
    scheduledStart: Date,
    scheduledEnd: Date
  ): Promise<boolean> {
    const conflictingConsultations = await this.knex('consultations')
      .where({ provider_id: providerId })
      .whereIn('status', ['SCHEDULED', 'IN_PROGRESS'])
      .where(function() {
        this.whereBetween('scheduled_start', [scheduledStart, scheduledEnd])
          .orWhereBetween('scheduled_end', [scheduledStart, scheduledEnd])
          .orWhere(function() {
            this.where('scheduled_start', '<=', scheduledStart)
              .where('scheduled_end', '>=', scheduledEnd);
          });
      })
      .count('* as count')
      .first();

    return parseInt(conflictingConsultations?.count || '0') === 0;
  }

  /**
   * Get upcoming consultations for a patient
   */
  async getPatientConsultations(
    patientId: string,
    status?: string[]
  ): Promise<any[]> {
    try {
      let query = this.knex('consultations')
        .join('providers', 'consultations.provider_id', 'providers.id')
        .join('users', 'providers.user_id', 'users.id')
        .where('consultations.patient_id', patientId)
        .select(
          'consultations.*',
          'users.first_name as provider_first_name',
          'users.last_name as provider_last_name',
          'providers.specialty',
          'providers.profile_image_url'
        )
        .orderBy('consultations.scheduled_start', 'desc');

      if (status && status.length > 0) {
        query = query.whereIn('consultations.status', status);
      }

      const consultations = await query;

      return consultations;
    } catch (error: any) {
      logger.error(`Error getting consultations for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Get upcoming consultations for a provider
   */
  async getProviderConsultations(
    providerId: string,
    status?: string[]
  ): Promise<any[]> {
    try {
      let query = this.knex('consultations')
        .join('users', 'consultations.patient_id', 'users.id')
        .where('consultations.provider_id', providerId)
        .select(
          'consultations.*',
          'users.first_name as patient_first_name',
          'users.last_name as patient_last_name',
          'users.email as patient_email'
        )
        .orderBy('consultations.scheduled_start', 'asc');

      if (status && status.length > 0) {
        query = query.whereIn('consultations.status', status);
      }

      const consultations = await query;

      return consultations;
    } catch (error: any) {
      logger.error(`Error getting consultations for provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get consultation details by ID
   */
  async getConsultationById(consultationId: string): Promise<any> {
    try {
      const consultation = await this.knex('consultations')
        .leftJoin('providers', 'consultations.provider_id', 'providers.id')
        .leftJoin('users as provider_users', 'providers.user_id', 'provider_users.id')
        .leftJoin('users as patient_users', 'consultations.patient_id', 'patient_users.id')
        .where('consultations.id', consultationId)
        .select(
          'consultations.*',
          'provider_users.first_name as provider_first_name',
          'provider_users.last_name as provider_last_name',
          'provider_users.email as provider_email',
          'providers.specialty',
          'providers.profile_image_url as provider_image',
          'patient_users.first_name as patient_first_name',
          'patient_users.last_name as patient_last_name',
          'patient_users.email as patient_email'
        )
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      return consultation;
    } catch (error: any) {
      logger.error(`Error getting consultation ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * Update consultation notes
   */
  async updateConsultationNotes(
    consultationId: string,
    providerId: string,
    notes: {
      providerNotes?: string;
      diagnosisCodes?: string[];
      treatmentPlan?: any;
    }
  ): Promise<void> {
    try {
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.provider_id !== providerId) {
        throw new Error('Provider not authorized');
      }

      await this.knex('consultations')
        .where({ id: consultationId })
        .update({
          provider_notes: notes.providerNotes,
          diagnosis_codes: notes.diagnosisCodes ? JSON.stringify(notes.diagnosisCodes) : undefined,
          treatment_plan: notes.treatmentPlan ? JSON.stringify(notes.treatmentPlan) : undefined,
          updated_at: new Date(),
        });

      logger.info(`Consultation notes updated for ${consultationId}`);
    } catch (error: any) {
      logger.error(`Error updating consultation notes for ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * Mark patient as no-show
   */
  async markNoShow(consultationId: string, providerId: string): Promise<void> {
    try {
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.provider_id !== providerId) {
        throw new Error('Provider not authorized');
      }

      await this.knex('consultations')
        .where({ id: consultationId })
        .update({
          status: 'NO_SHOW',
          updated_at: new Date(),
        });

      logger.info(`Consultation ${consultationId} marked as no-show`);
    } catch (error: any) {
      logger.error(`Error marking consultation ${consultationId} as no-show:`, error);
      throw error;
    }
  }

  /**
   * Submit consultation review
   */
  async submitReview(
    consultationId: string,
    patientId: string,
    review: {
      overallRating: number;
      communicationRating?: number;
      professionalismRating?: number;
      careQualityRating?: number;
      waitTimeRating?: number;
      reviewText?: string;
      wouldRecommend?: boolean;
    }
  ): Promise<void> {
    try {
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.patient_id !== patientId) {
        throw new Error('Patient not authorized');
      }

      if (consultation.status !== 'COMPLETED') {
        throw new Error('Can only review completed consultations');
      }

      // Check if review already exists
      const existingReview = await this.knex('consultation_reviews')
        .where({ consultation_id: consultationId })
        .first();

      if (existingReview) {
        throw new Error('Review already submitted for this consultation');
      }

      // Create review
      await this.knex('consultation_reviews').insert({
        consultation_id: consultationId,
        patient_id: patientId,
        provider_id: consultation.provider_id,
        overall_rating: review.overallRating,
        communication_rating: review.communicationRating,
        professionalism_rating: review.professionalismRating,
        care_quality_rating: review.careQualityRating,
        wait_time_rating: review.waitTimeRating,
        review_text: review.reviewText,
        would_recommend: review.wouldRecommend !== undefined ? review.wouldRecommend : true,
        is_verified: true,
        is_visible: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Update provider stats
      await this.updateProviderRating(consultation.provider_id);

      logger.info(`Review submitted for consultation ${consultationId}`);
    } catch (error: any) {
      logger.error(`Error submitting review for consultation ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * Update provider rating based on reviews
   */
  private async updateProviderRating(providerId: string): Promise<void> {
    try {
      const stats = await this.knex('consultation_reviews')
        .where({ provider_id: providerId, is_visible: true })
        .select(
          this.knex.raw('AVG(overall_rating) as avg_rating'),
          this.knex.raw('COUNT(*) as review_count')
        )
        .first();

      if (stats && stats.review_count > 0) {
        await this.knex('providers')
          .where({ id: providerId })
          .update({
            rating: parseFloat(stats.avg_rating).toFixed(2),
            total_reviews: stats.review_count,
            updated_at: new Date(),
          });
      }
    } catch (error: any) {
      logger.error(`Error updating provider rating for ${providerId}:`, error);
    }
  }
}

export default ConsultationService;
