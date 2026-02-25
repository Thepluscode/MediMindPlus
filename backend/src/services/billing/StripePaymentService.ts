/**
 * Stripe Payment Service for MediMindPlus
 *
 * Handles all payment processing, subscription management, and billing operations
 * using Stripe API. Compliant with PCI-DSS Level 1 (Stripe handles card data).
 *
 * Features:
 * - Subscription management (create, update, cancel)
 * - One-time payments
 * - Usage-based billing (per-AI-analysis, per-video-call)
 * - Invoice generation
 * - Payment method management
 * - Refunds & disputes
 * - Webhooks for payment events
 *
 * Revenue Model:
 * - Basic Plan: $29/month (Patient access)
 * - Professional Plan: $199/month (Provider access)
 * - Enterprise Plan: $999/month (Hospital/Clinic)
 * - Pay-per-use: AI analyses ($5-50 each), Video calls ($25 each)
 */

import Stripe from 'stripe';
import { redisCache, CacheKeys } from '../../infrastructure/cache/RedisCache';
import logger from '../../utils/logger';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

interface Customer {
  userId: string;
  stripeCustomerId: string;
  email: string;
  name: string;
  paymentMethods: PaymentMethod[];
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  amount: number;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: Date;
  paidAt?: Date;
  invoiceUrl: string;
  invoicePdf: string;
}

interface UsageRecord {
  userId: string;
  subscriptionItemId: string;
  quantity: number;
  action: 'increment' | 'set';
  timestamp: Date;
}

export class StripePaymentService {
  private stripe: Stripe;

  // Subscription plans
  private plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      description: 'Essential health monitoring for individuals',
      price: 2900, // $29/month
      interval: 'month',
      features: [
        'Health Records Management',
        'Appointment Booking',
        'Secure Messaging',
        '5 AI Analyses/month',
        'Mobile App Access',
        'Basic Support'
      ],
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic'
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      description: 'Complete toolkit for healthcare providers',
      price: 19900, // $199/month
      interval: 'month',
      features: [
        'All Basic Features',
        'Unlimited AI Analyses',
        'Video Consultations',
        'Clinical Scribe',
        'Drug Interaction Checker',
        'ICD-10 Coding Assistant',
        'Priority Support',
        'HIPAA-compliant Storage'
      ],
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_professional'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      description: 'Scalable solution for hospitals and clinics',
      price: 99900, // $999/month
      interval: 'month',
      features: [
        'All Professional Features',
        'Multi-provider Support',
        'Custom AI Model Training',
        'Advanced Analytics',
        'API Access',
        'White-label Options',
        'Dedicated Account Manager',
        'SLA Guarantee'
      ],
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise'
    }
  ];

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_placeholder_not_configured';

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('STRIPE_SECRET_KEY not set. Stripe payments will not work.');
    }
  }

  /**
   * Create Stripe customer for user
   */
  async createCustomer(userId: string, email: string, name: string): Promise<Customer> {
    try {
      const stripeCustomer = await this.stripe.customers.create({
        email,
        name,
        metadata: { userId }
      });

      const customer: Customer = {
        userId,
        stripeCustomerId: stripeCustomer.id,
        email,
        name,
        paymentMethods: []
      };

      // Cache customer data
      await redisCache.set(`stripe:customer:${userId}`, customer, 3600);

      logger.info('Stripe customer created', {
        stripeCustomerId: stripeCustomer.id,
        userId,
        service: 'billing'
      });
      return customer;
    } catch (error: any) {
      logger.error('Stripe customer creation failed', {
        error: error.message,
        userId,
        email,
        service: 'billing'
      });
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Get or create customer
   */
  async getOrCreateCustomer(userId: string, email: string, name: string): Promise<Customer> {
    // Try cache first
    const cached = await redisCache.get<Customer>(`stripe:customer:${userId}`);
    if (cached) return cached;

    // Try database lookup (in production: query from DB)
    // For now: create new customer
    return await this.createCustomer(userId, email, name);
  }

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(
    userId: string,
    paymentMethodId: string,
    setAsDefault: boolean = true
  ): Promise<PaymentMethod> {
    try {
      const customer = await redisCache.get<Customer>(`stripe:customer:${userId}`);
      if (!customer) throw new Error('Customer not found');

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.stripeCustomerId
      });

      // Set as default if requested
      if (setAsDefault) {
        await this.stripe.customers.update(customer.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      // Retrieve payment method details
      const pm = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      const paymentMethod: PaymentMethod = {
        id: pm.id,
        type: pm.type as 'card' | 'bank_account',
        last4: pm.card?.last4 || '',
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        isDefault: setAsDefault
      };

      logger.info('Stripe payment method added', {
        paymentMethodId,
        userId,
        setAsDefault,
        service: 'billing'
      });
      return paymentMethod;
    } catch (error: any) {
      logger.error('Stripe add payment method failed', {
        error: error.message,
        userId,
        paymentMethodId,
        service: 'billing'
      });
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string,
    trialDays?: number
  ): Promise<Subscription> {
    try {
      const customer = await redisCache.get<Customer>(`stripe:customer:${userId}`);
      if (!customer) throw new Error('Customer not found');

      const plan = this.plans.find(p => p.id === planId);
      if (!plan) throw new Error(`Plan ${planId} not found`);

      // Prepare subscription parameters
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.stripeCustomerId,
        items: [{ price: plan.stripePriceId }],
        metadata: { userId, planId },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      };

      // Add trial period if specified
      if (trialDays) {
        subscriptionParams.trial_period_days = trialDays;
      }

      // Add payment method if provided
      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const stripeSubscription = await this.stripe.subscriptions.create(subscriptionParams);

      const subscription: Subscription = {
        id: stripeSubscription.id,
        userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status as Subscription['status'],
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined
      };

      // Cache subscription
      await redisCache.set(`stripe:subscription:${userId}`, subscription, 3600);

      logger.info('Stripe subscription created', {
        stripeSubscriptionId: stripeSubscription.id,
        userId,
        planId,
        trialDays,
        service: 'billing'
      });
      return subscription;
    } catch (error: any) {
      logger.error('Stripe subscription creation failed', {
        error: error.message,
        userId,
        planId,
        service: 'billing'
      });
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(userId: string, newPlanId: string): Promise<Subscription> {
    try {
      const subscription = await redisCache.get<Subscription>(`stripe:subscription:${userId}`);
      if (!subscription) throw new Error('Subscription not found');

      const newPlan = this.plans.find(p => p.id === newPlanId);
      if (!newPlan) throw new Error(`Plan ${newPlanId} not found`);

      // Update subscription
      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [{
            id: (await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
            price: newPlan.stripePriceId
          }],
          proration_behavior: 'create_prorations', // Pro-rate charges
          metadata: { planId: newPlanId }
        }
      );

      const updatedSubscription: Subscription = {
        ...subscription,
        planId: newPlanId,
        status: stripeSubscription.status as Subscription['status'],
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
      };

      // Update cache
      await redisCache.set(`stripe:subscription:${userId}`, updatedSubscription, 3600);

      logger.info('Stripe subscription updated', {
        userId,
        newPlanId,
        oldPlanId: subscription.planId,
        service: 'billing'
      });
      return updatedSubscription;
    } catch (error: any) {
      logger.error('Stripe subscription update failed', {
        error: error.message,
        userId,
        newPlanId,
        service: 'billing'
      });
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, immediately: boolean = false): Promise<Subscription> {
    try {
      const subscription = await redisCache.get<Subscription>(`stripe:subscription:${userId}`);
      if (!subscription) throw new Error('Subscription not found');

      let stripeSubscription;
      if (immediately) {
        // Cancel immediately
        stripeSubscription = await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } else {
        // Cancel at period end
        stripeSubscription = await this.stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          { cancel_at_period_end: true }
        );
      }

      const canceledSubscription: Subscription = {
        ...subscription,
        status: stripeSubscription.status as Subscription['status'],
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      };

      // Update cache
      await redisCache.set(`stripe:subscription:${userId}`, canceledSubscription, 3600);

      logger.info('Stripe subscription canceled', {
        userId,
        immediately,
        subscriptionId: subscription.stripeSubscriptionId,
        service: 'billing'
      });
      return canceledSubscription;
    } catch (error: any) {
      logger.error('Stripe subscription cancellation failed', {
        error: error.message,
        userId,
        service: 'billing'
      });
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Create one-time payment (for pay-per-use features)
   */
  async createPayment(
    userId: string,
    amount: number, // in cents
    description: string,
    metadata?: Record<string, string>
  ): Promise<{ paymentIntentId: string; clientSecret: string }> {
    try {
      const customer = await redisCache.get<Customer>(`stripe:customer:${userId}`);
      if (!customer) throw new Error('Customer not found');

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customer.stripeCustomerId,
        description,
        metadata: { userId, ...metadata },
        automatic_payment_methods: { enabled: true }
      });

      logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        userId,
        amount,
        description,
        service: 'billing'
      });
      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!
      };
    } catch (error: any) {
      logger.error('Stripe payment creation failed', {
        error: error.message,
        userId,
        amount,
        description,
        service: 'billing'
      });
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Record usage for metered billing (e.g., AI analyses)
   */
  async recordUsage(
    userId: string,
    subscriptionItemId: string,
    quantity: number = 1,
    action: 'increment' | 'set' = 'increment'
  ): Promise<void> {
    try {
      await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          action,
          timestamp: Math.floor(Date.now() / 1000)
        }
      );

      logger.info('Stripe usage recorded', {
        userId,
        subscriptionItemId,
        quantity,
        action,
        service: 'billing'
      });
    } catch (error: any) {
      logger.error('Stripe usage recording failed', {
        error: error.message,
        userId,
        subscriptionItemId,
        quantity,
        service: 'billing'
      });
      throw new Error(`Failed to record usage: ${error.message}`);
    }
  }

  /**
   * Get invoices for user
   */
  async getInvoices(userId: string, limit: number = 10): Promise<Invoice[]> {
    try {
      const customer = await redisCache.get<Customer>(`stripe:customer:${userId}`);
      if (!customer) throw new Error('Customer not found');

      const stripeInvoices = await this.stripe.invoices.list({
        customer: customer.stripeCustomerId,
        limit
      });

      const invoices: Invoice[] = stripeInvoices.data.map(inv => ({
        id: inv.id,
        userId,
        stripeInvoiceId: inv.id,
        amount: inv.total,
        status: inv.status as Invoice['status'],
        dueDate: new Date(inv.due_date! * 1000),
        paidAt: inv.status_transitions.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : undefined,
        invoiceUrl: inv.hosted_invoice_url || '',
        invoicePdf: inv.invoice_pdf || ''
      }));

      return invoices;
    } catch (error: any) {
      logger.error('Stripe get invoices failed', {
        error: error.message,
        userId,
        limit,
        service: 'billing'
      });
      throw new Error(`Failed to get invoices: ${error.message}`);
    }
  }

  /**
   * Process refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number, // partial refund if specified
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  ): Promise<string> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason
      });

      logger.info('Stripe refund created', {
        refundId: refund.id,
        paymentIntentId,
        amount: amount || 'full',
        reason,
        service: 'billing'
      });
      return refund.id;
    } catch (error: any) {
      logger.error('Stripe refund creation failed', {
        error: error.message,
        paymentIntentId,
        amount,
        reason,
        service: 'billing'
      });
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Get subscription plans
   */
  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): SubscriptionPlan | undefined {
    return this.plans.find(p => p.id === planId);
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not set');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error: any) {
      logger.error('Stripe webhook signature validation failed', {
        error: error.message,
        service: 'billing'
      });
      throw new Error(`Webhook signature validation failed: ${error.message}`);
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    logger.info('Stripe webhook received', {
      eventType: event.type,
      eventId: event.id,
      service: 'billing'
    });

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        logger.info('Stripe unhandled event type', {
          eventType: event.type,
          eventId: event.id,
          service: 'billing'
        });
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    // Update cached subscription
    const cached = await redisCache.get<Subscription>(`stripe:subscription:${userId}`);
    if (cached) {
      cached.status = subscription.status as Subscription['status'];
      cached.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      cached.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      cached.cancelAtPeriodEnd = subscription.cancel_at_period_end;
      await redisCache.set(`stripe:subscription:${userId}`, cached, 3600);
    }

    logger.info('Stripe webhook subscription updated', {
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
      service: 'billing'
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await redisCache.del(`stripe:subscription:${userId}`);
    logger.info('Stripe webhook subscription deleted', {
      userId,
      subscriptionId: subscription.id,
      service: 'billing'
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    logger.info('Stripe webhook invoice paid', {
      invoiceId: invoice.id,
      customerId,
      amount: invoice.amount_paid,
      service: 'billing'
    });
    // In production: Send receipt email, update user credits, etc.
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    logger.warn('Stripe webhook payment failed', {
      invoiceId: invoice.id,
      customerId,
      attemptCount: invoice.attempt_count,
      service: 'billing'
    });
    // In production: Send notification, attempt retry, suspend account if needed
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.info('Stripe webhook payment succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      service: 'billing'
    });
    // In production: Fulfill order, send confirmation
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.warn('Stripe webhook payment intent failed', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      lastPaymentError: paymentIntent.last_payment_error?.message,
      service: 'billing'
    });
    // In production: Notify user, provide alternative payment options
  }
}

// Singleton instance
export const stripePaymentService = new StripePaymentService();
