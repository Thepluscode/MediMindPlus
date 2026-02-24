/**
 * Payment API Routes
 * Stripe payment processing for consultations
 */

import { Router, Request, Response } from 'express';
import { StripePaymentService } from '../services/payments/StripePaymentService';
import { authenticate } from '../middleware/authorization';
import { logger } from '../utils/logger';
import Stripe from 'stripe';

const router = Router();
const paymentService = new StripePaymentService();

/**
 * POST /payments/create-intent
 * Create payment intent for consultation
 */
router.post(
  '/create-intent',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId } = req.body;
      const patientId = req.user?.id;

      if (!patientId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      if (!consultationId) {
        return res.status(400).json({
          success: false,
          error: 'consultationId is required',
        });
      }

      const paymentIntent = await paymentService.createPaymentIntent(
        consultationId,
        patientId
      );

      res.json({
        success: true,
        message: 'Payment intent created',
        data: paymentIntent,
      });
    } catch (error: any) {
      logger.error('Error creating payment intent:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create payment intent',
      });
    }
  }
);

/**
 * POST /payments/confirm
 * Confirm payment completion
 */
router.post(
  '/confirm',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          error: 'paymentIntentId is required',
        });
      }

      await paymentService.confirmPayment(paymentIntentId);

      res.json({
        success: true,
        message: 'Payment confirmed',
      });
    } catch (error: any) {
      logger.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to confirm payment',
      });
    }
  }
);

/**
 * POST /payments/refund
 * Process refund for cancelled consultation
 */
router.post(
  '/refund',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { consultationId, reason } = req.body;
      const userId = req.user?.id;

      if (!consultationId || !reason) {
        return res.status(400).json({
          success: false,
          error: 'consultationId and reason are required',
        });
      }

      await paymentService.processRefund(consultationId, reason);

      res.json({
        success: true,
        message: 'Refund processed successfully',
      });
    } catch (error: any) {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process refund',
      });
    }
  }
);

/**
 * GET /payments/history
 * Get payment history for patient
 */
router.get(
  '/history',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const patientId = req.user?.id;

      if (!patientId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const payments = await paymentService.getPaymentHistory(patientId);

      res.json({
        success: true,
        data: {
          payments,
          count: payments.length,
        },
      });
    } catch (error: any) {
      logger.error('Error getting payment history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get payment history',
      });
    }
  }
);

/**
 * GET /payments/provider/:providerId/earnings
 * Get provider earnings summary
 */
router.get(
  '/provider/:providerId/earnings',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;

      // Verify user is the provider or admin
      if (req.user?.role !== 'provider' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Provider access required',
        });
      }

      const earnings = await paymentService.calculateProviderEarnings(providerId);

      res.json({
        success: true,
        data: earnings,
      });
    } catch (error: any) {
      logger.error('Error getting provider earnings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get provider earnings',
      });
    }
  }
);

/**
 * POST /payments/webhook
 * Stripe webhook endpoint
 */
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2024-11-20.acacia',
      });

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the event
      await paymentService.handleWebhook(event);

      res.json({ received: true });
    } catch (error: any) {
      logger.error('Error processing webhook:', error);
      res.status(500).send('Webhook processing failed');
    }
  }
);

export default router;
