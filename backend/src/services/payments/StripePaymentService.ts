/**
 * Stripe Payment Service
 * Handles payment processing for consultations
 */

import Stripe from 'stripe';
import { getKnex } from '../../config/knex';
import { logger } from '../../utils/logger';

export class StripePaymentService {
  private stripe: Stripe;
  private knex = getKnex();

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_placeholder_not_configured';

    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('Stripe secret key not configured. Payments will not work.');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  /**
   * Create payment intent for consultation
   */
  async createPaymentIntent(consultationId: string, patientId: string): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
  }> {
    try {
      // Get consultation details
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.patient_id !== patientId) {
        throw new Error('Unauthorized access to consultation');
      }

      if (consultation.payment_status === 'PAID') {
        throw new Error('Consultation already paid');
      }

      // Get patient details for metadata
      const patient = await this.knex('users')
        .where({ id: patientId })
        .first();

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: consultation.amount_charged,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          consultation_id: consultationId,
          patient_id: patientId,
          patient_email: patient?.email || '',
          provider_id: consultation.provider_id,
        },
        description: `Video Consultation - ${consultation.consultation_type}`,
      });

      // Update consultation with payment intent ID
      await this.knex('consultations')
        .where({ id: consultationId })
        .update({
          payment_intent_id: paymentIntent.id,
          payment_status: 'PENDING',
          updated_at: new Date(),
        });

      logger.info(`Payment intent created for consultation ${consultationId}`, {
        paymentIntentId: paymentIntent.id,
        amount: consultation.amount_charged,
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: consultation.amount_charged,
      };
    } catch (error: any) {
      logger.error(`Error creating payment intent for consultation ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * Confirm payment and update consultation status
   */
  async confirmPayment(paymentIntentId: string): Promise<void> {
    try {
      // Get payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent.metadata.consultation_id) {
        throw new Error('Invalid payment intent - missing consultation ID');
      }

      const consultationId = paymentIntent.metadata.consultation_id;

      // Update consultation payment status
      if (paymentIntent.status === 'succeeded') {
        await this.knex('consultations')
          .where({ id: consultationId })
          .update({
            payment_status: 'PAID',
            updated_at: new Date(),
          });

        logger.info(`Payment confirmed for consultation ${consultationId}`, {
          paymentIntentId,
          amount: paymentIntent.amount,
        });
      } else if (paymentIntent.status === 'payment_failed') {
        await this.knex('consultations')
          .where({ id: consultationId })
          .update({
            payment_status: 'FAILED',
            updated_at: new Date(),
          });

        logger.warn(`Payment failed for consultation ${consultationId}`, {
          paymentIntentId,
        });
      }
    } catch (error: any) {
      logger.error(`Error confirming payment ${paymentIntentId}:`, error);
      throw error;
    }
  }

  /**
   * Process refund for cancelled consultation
   */
  async processRefund(consultationId: string, reason: string): Promise<void> {
    try {
      const consultation = await this.knex('consultations')
        .where({ id: consultationId })
        .first();

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      if (consultation.payment_status !== 'PAID') {
        throw new Error('Consultation has not been paid');
      }

      if (!consultation.payment_intent_id) {
        throw new Error('No payment intent found for consultation');
      }

      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: consultation.payment_intent_id,
        reason: 'requested_by_customer',
        metadata: {
          consultation_id: consultationId,
          refund_reason: reason,
        },
      });

      // Update consultation status
      await this.knex('consultations')
        .where({ id: consultationId })
        .update({
          payment_status: 'REFUNDED',
          updated_at: new Date(),
        });

      logger.info(`Refund processed for consultation ${consultationId}`, {
        refundId: refund.id,
        amount: refund.amount,
        reason,
      });
    } catch (error: any) {
      logger.error(`Error processing refund for consultation ${consultationId}:`, error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      logger.info(`Processing Stripe webhook: ${event.type}`, {
        eventId: event.id,
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error: any) {
      logger.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const consultationId = paymentIntent.metadata.consultation_id;

    if (!consultationId) {
      logger.warn('Payment succeeded but no consultation ID in metadata', {
        paymentIntentId: paymentIntent.id,
      });
      return;
    }

    await this.knex('consultations')
      .where({ id: consultationId })
      .update({
        payment_status: 'PAID',
        updated_at: new Date(),
      });

    logger.info(`Payment succeeded for consultation ${consultationId}`, {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
    });

    // TODO: Send confirmation email to patient
    // TODO: Send notification to provider
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const consultationId = paymentIntent.metadata.consultation_id;

    if (!consultationId) {
      return;
    }

    await this.knex('consultations')
      .where({ id: consultationId })
      .update({
        payment_status: 'FAILED',
        updated_at: new Date(),
      });

    logger.warn(`Payment failed for consultation ${consultationId}`, {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    });

    // TODO: Send payment failure notification to patient
  }

  /**
   * Handle refund
   */
  private async handleRefund(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      return;
    }

    // Find consultation by payment intent ID
    const consultation = await this.knex('consultations')
      .where({ payment_intent_id: paymentIntentId })
      .first();

    if (!consultation) {
      logger.warn('Refund processed but consultation not found', {
        paymentIntentId,
      });
      return;
    }

    await this.knex('consultations')
      .where({ id: consultation.id })
      .update({
        payment_status: 'REFUNDED',
        updated_at: new Date(),
      });

    logger.info(`Refund processed for consultation ${consultation.id}`, {
      chargeId: charge.id,
      amount: charge.amount_refunded,
    });

    // TODO: Send refund confirmation to patient
  }

  /**
   * Get payment history for a patient
   */
  async getPaymentHistory(patientId: string): Promise<any[]> {
    try {
      const payments = await this.knex('consultations')
        .join('providers', 'consultations.provider_id', 'providers.id')
        .join('users', 'providers.user_id', 'users.id')
        .where('consultations.patient_id', patientId)
        .whereNotNull('consultations.payment_intent_id')
        .select(
          'consultations.id as consultation_id',
          'consultations.scheduled_start',
          'consultations.consultation_type',
          'consultations.amount_charged',
          'consultations.payment_status',
          'consultations.payment_intent_id',
          'users.first_name as provider_first_name',
          'users.last_name as provider_last_name',
          'providers.specialty'
        )
        .orderBy('consultations.scheduled_start', 'desc');

      return payments;
    } catch (error: any) {
      logger.error(`Error getting payment history for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate provider earnings
   */
  async calculateProviderEarnings(providerId: string): Promise<{
    totalEarnings: number;
    pendingPayouts: number;
    completedPayouts: number;
    consultationsCount: number;
  }> {
    try {
      const stats = await this.knex('consultations')
        .where({ provider_id: providerId, payment_status: 'PAID' })
        .select(
          this.knex.raw('SUM(amount_charged) as total_earnings'),
          this.knex.raw('COUNT(*) as consultations_count')
        )
        .first();

      const platformFee = 0.2; // 20% commission
      const totalEarnings = parseInt(stats?.total_earnings || '0');
      const providerEarnings = Math.floor(totalEarnings * (1 - platformFee));

      return {
        totalEarnings: providerEarnings,
        pendingPayouts: providerEarnings, // TODO: Calculate based on payout schedule
        completedPayouts: 0, // TODO: Track actual payouts
        consultationsCount: parseInt(stats?.consultations_count || '0'),
      };
    } catch (error: any) {
      logger.error(`Error calculating earnings for provider ${providerId}:`, error);
      throw error;
    }
  }
}

export default StripePaymentService;
