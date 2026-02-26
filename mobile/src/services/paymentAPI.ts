/**
 * Payment API Service for MediMindPlus
 * Handles all Stripe payment-related API calls
 */

import apiService from './apiService';
import {
  PaymentIntent,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  RefundRequest,
  PaymentHistory,
  ProviderEarnings,
} from '../types/payment.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class PaymentAPI {
  /**
   * Create a Stripe Payment Intent for a consultation
   */
  async createPaymentIntent(
    consultationId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<PaymentIntent> {
    try {
      console.log('[PaymentAPI] Creating payment intent:', { consultationId, amount, currency });

      const response = await apiService.post<ApiResponse<PaymentIntent>>(
        '/payments/create-intent',
        { consultationId, amount, currency }
      );

      console.log('[PaymentAPI] Payment intent created successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('[PaymentAPI] Failed to create payment intent:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create payment intent');
    }
  }

  /**
   * Confirm a payment after successful Stripe payment
   */
  async confirmPayment(consultationId: string, paymentIntentId: string): Promise<void> {
    try {
      console.log('[PaymentAPI] Confirming payment:', { consultationId, paymentIntentId });

      await apiService.post<ApiResponse<void>>(
        '/payments/confirm',
        { consultationId, paymentIntentId }
      );

      console.log('[PaymentAPI] Payment confirmed successfully');
    } catch (error: any) {
      console.error('[PaymentAPI] Failed to confirm payment:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to confirm payment');
    }
  }

  /**
   * Process a refund for a consultation
   */
  async processRefund(consultationId: string, reason: string): Promise<void> {
    try {
      console.log('[PaymentAPI] Processing refund:', { consultationId, reason });

      await apiService.post<ApiResponse<void>>(
        '/payments/refund',
        { consultationId, reason }
      );

      console.log('[PaymentAPI] Refund processed successfully');
    } catch (error: any) {
      console.error('[PaymentAPI] Failed to process refund:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to process refund');
    }
  }

  /**
   * Get payment history for the current user
   */
  async getPaymentHistory(): Promise<PaymentHistory[]> {
    try {
      console.log('[PaymentAPI] Fetching payment history');

      const response = await apiService.get<ApiResponse<PaymentHistory[]>>(
        '/payments/history'
      );

      console.log('[PaymentAPI] Payment history retrieved:', response.data.data.length, 'records');
      return response.data.data;
    } catch (error: any) {
      console.error('[PaymentAPI] Failed to fetch payment history:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  }

  /**
   * Get earnings summary for a provider
   */
  async getProviderEarnings(providerId: string): Promise<ProviderEarnings> {
    try {
      console.log('[PaymentAPI] Fetching provider earnings:', providerId);

      const response = await apiService.get<ApiResponse<ProviderEarnings>>(
        `/payments/provider/${providerId}/earnings`
      );

      console.log('[PaymentAPI] Provider earnings retrieved');
      return response.data.data;
    } catch (error: any) {
      console.error('[PaymentAPI] Failed to fetch provider earnings:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch provider earnings');
    }
  }

  /**
   * Get Stripe publishable key from environment
   */
  getStripePublishableKey(): string {
    // In production, this should come from environment variables
    const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
                 'pk_test_51RVJBGIYzxeKN90NS2yhS9dWGheZYi70uoQ8PZHOknAxSixQvUtJI7AlI1guQmjD276xq3UvPCP8MDe7TOh1rhoi00v5ORt563';

    return key;
  }
}

// Export singleton instance
export const paymentAPI = new PaymentAPI();
export default paymentAPI;
