/**
 * Payment-related TypeScript interfaces for MediMindPlus
 * Supports Stripe payment integration
 */

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency?: string;
  status?: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
}

export interface CreatePaymentIntentRequest {
  consultationId: string;
  amount: number;
  currency?: string;
}

export interface ConfirmPaymentRequest {
  consultationId: string;
  paymentIntentId: string;
}

export interface RefundRequest {
  consultationId: string;
  reason: string;
}

export interface PaymentHistory {
  id: string;
  consultationId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  paymentDate: string;
  paymentIntentId: string;
  providerName: string;
  consultationType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderEarnings {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  consultationsCount: number;
  platformFee: number;
  netEarnings: number;
}

export interface PaymentState {
  paymentIntent: PaymentIntent | null;
  paymentHistory: PaymentHistory[];
  providerEarnings: ProviderEarnings | null;
  isLoading: boolean;
  error: string | null;
}
