/**
 * Billing Controller
 *
 * REST API endpoints for billing, subscriptions, and payments
 */

import { Request, Response } from 'express';
import { stripePaymentService } from '../services/billing/StripePaymentService';
import logger from '../utils/logger';

export class BillingController {
  /**
   * GET /api/billing/plans
   * Get all available subscription plans
   */
  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = stripePaymentService.getPlans();
      res.json({
        success: true,
        data: plans
      });
    } catch (error: any) {
      logger.error('Failed to get billing plans', {
        service: 'billing',
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/billing/customer
   * Create Stripe customer for current user
   */
  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { email, name } = req.body;

      const customer = await stripePaymentService.createCustomer(
        user.id,
        email || user.email,
        name || user.name
      );

      res.json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      logger.error('Failed to create Stripe customer', {
        service: 'billing',
        userId: (req as any).user?.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/billing/payment-methods
   * Add payment method to customer
   */
  async addPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { paymentMethodId, setAsDefault } = req.body;

      if (!paymentMethodId) {
        res.status(400).json({
          success: false,
          error: 'Payment method ID required'
        });
        return;
      }

      const paymentMethod = await stripePaymentService.addPaymentMethod(
        user.id,
        paymentMethodId,
        setAsDefault
      );

      res.json({
        success: true,
        data: paymentMethod
      });
    } catch (error: any) {
      logger.error('Failed to add payment method', {
        service: 'billing',
        userId: (req as any).user?.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/billing/subscriptions
   * Create new subscription
   */
  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { planId, paymentMethodId, trialDays } = req.body;

      if (!planId) {
        res.status(400).json({
          success: false,
          error: 'Plan ID required'
        });
        return;
      }

      const subscription = await stripePaymentService.createSubscription(
        user.id,
        planId,
        paymentMethodId,
        trialDays
      );

      res.json({
        success: true,
        data: subscription
      });
    } catch (error: any) {
      logger.error('Failed to create subscription', {
        service: 'billing',
        userId: (req as any).user?.id,
        planId: req.body.planId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/billing/subscriptions
   * Update subscription (change plan)
   */
  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { newPlanId } = req.body;

      if (!newPlanId) {
        res.status(400).json({
          success: false,
          error: 'New plan ID required'
        });
        return;
      }

      const subscription = await stripePaymentService.updateSubscription(
        user.id,
        newPlanId
      );

      res.json({
        success: true,
        data: subscription
      });
    } catch (error: any) {
      logger.error('Failed to update subscription', {
        service: 'billing',
        userId: (req as any).user?.id,
        newPlanId: req.body.newPlanId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/billing/subscriptions
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { immediately } = req.body;

      const subscription = await stripePaymentService.cancelSubscription(
        user.id,
        immediately || false
      );

      res.json({
        success: true,
        data: subscription,
        message: immediately
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at end of billing period'
      });
    } catch (error: any) {
      logger.error('Failed to cancel subscription', {
        service: 'billing',
        userId: (req as any).user?.id,
        immediately: req.body.immediately,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/billing/payments
   * Create one-time payment
   */
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { amount, description, metadata } = req.body;

      if (!amount || !description) {
        res.status(400).json({
          success: false,
          error: 'Amount and description required'
        });
        return;
      }

      const payment = await stripePaymentService.createPayment(
        user.id,
        amount,
        description,
        metadata
      );

      res.json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      logger.error('Failed to create payment', {
        service: 'billing',
        userId: (req as any).user?.id,
        amount: req.body.amount,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/billing/invoices
   * Get user invoices
   */
  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const limit = parseInt(req.query.limit as string) || 10;

      const invoices = await stripePaymentService.getInvoices(user.id, limit);

      res.json({
        success: true,
        data: invoices
      });
    } catch (error: any) {
      logger.error('Failed to get invoices', {
        service: 'billing',
        userId: (req as any).user?.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/billing/webhooks
   * Stripe webhook handler
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        res.status(400).json({
          success: false,
          error: 'Missing stripe-signature header'
        });
        return;
      }

      // Validate and process webhook
      const event = stripePaymentService.validateWebhookSignature(
        req.body,
        signature
      );

      await stripePaymentService.handleWebhookEvent(event);

      res.json({ received: true });
    } catch (error: any) {
      logger.error('Stripe webhook processing failed', {
        service: 'billing',
        error: error.message
      });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/billing/refunds
   * Process refund (admin only)
   */
  async createRefund(req: Request, res: Response): Promise<void> {
    try {
      const { paymentIntentId, amount, reason } = req.body;

      if (!paymentIntentId) {
        res.status(400).json({
          success: false,
          error: 'Payment intent ID required'
        });
        return;
      }

      const refundId = await stripePaymentService.createRefund(
        paymentIntentId,
        amount,
        reason
      );

      res.json({
        success: true,
        data: { refundId },
        message: 'Refund processed successfully'
      });
    } catch (error: any) {
      logger.error('Failed to process refund', {
        service: 'billing',
        paymentIntentId: req.body.paymentIntentId,
        amount: req.body.amount,
        error: error.message
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const billingController = new BillingController();
