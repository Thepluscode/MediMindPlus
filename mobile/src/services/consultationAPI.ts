/**
 * Consultation API Service for MediMindPlus
 * Handles video consultation booking and management
 */

import apiService from './apiService';
import {
  Consultation,
  Provider,
  BookConsultationRequest,
  SearchProvidersRequest,
  VideoTokenResponse,
  ShareVitalsRequest,
} from '../types/consultation.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  providers: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ConsultationAPI {
  /**
   * Search for available providers
   */
  async searchProviders(filters: SearchProvidersRequest): Promise<PaginatedResponse<Provider>> {
    try {
      console.log('[ConsultationAPI] Searching providers:', filters);

      const params = new URLSearchParams();
      if (filters.specialty) params.append('specialty', filters.specialty);
      if (filters.minRating) params.append('minRating', filters.minRating.toString());
      if (filters.maxFee) params.append('maxFee', filters.maxFee.toString());
      if (filters.insuranceAccepted) params.append('insuranceAccepted', filters.insuranceAccepted);
      if (filters.languageSpoken) params.append('languageSpoken', filters.languageSpoken);
      if (filters.availableDate) params.append('availableDate', filters.availableDate);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiService.get<ApiResponse<PaginatedResponse<Provider>>>(
        `/consultations/providers/search?${params.toString()}`
      );

      console.log('[ConsultationAPI] Found', response.data.data.total, 'providers');
      return response.data.data;
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to search providers:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to search providers');
    }
  }

  /**
   * Get provider details by ID
   */
  async getProviderDetails(providerId: string): Promise<Provider> {
    try {
      console.log('[ConsultationAPI] Fetching provider details:', providerId);

      const response = await apiService.get<ApiResponse<Provider>>(
        `/provider/${providerId}`
      );

      console.log('[ConsultationAPI] Provider details retrieved');
      return response.data.data;
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to fetch provider details:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch provider details');
    }
  }

  /**
   * Book a consultation with a provider
   */
  async bookConsultation(request: BookConsultationRequest): Promise<Consultation> {
    try {
      console.log('[ConsultationAPI] Booking consultation:', request);

      const response = await apiService.post<ApiResponse<Consultation>>(
        '/consultations/book',
        request
      );

      console.log('[ConsultationAPI] Consultation booked successfully:', response.data.data.id);
      return response.data.data;
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to book consultation:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to book consultation');
    }
  }

  /**
   * Get user's consultation history
   */
  async getConsultations(): Promise<Consultation[]> {
    try {
      console.log('[ConsultationAPI] Fetching consultations');

      const response = await apiService.get<ApiResponse<Consultation[]>>(
        '/consultations'
      );

      console.log('[ConsultationAPI] Retrieved', response.data.data.length, 'consultations');
      return response.data.data;
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to fetch consultations:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch consultations');
    }
  }

  /**
   * Get a specific consultation by ID
   */
  async getConsultationById(consultationId: string): Promise<Consultation> {
    try {
      console.log('[ConsultationAPI] Fetching consultation:', consultationId);

      const response = await apiService.get<ApiResponse<Consultation>>(
        `/consultations/${consultationId}`
      );

      console.log('[ConsultationAPI] Consultation retrieved');
      return response.data.data;
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to fetch consultation:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch consultation');
    }
  }

  /**
   * Cancel a consultation
   */
  async cancelConsultation(consultationId: string, reason: string): Promise<void> {
    try {
      console.log('[ConsultationAPI] Cancelling consultation:', consultationId);

      await apiService.post<ApiResponse<void>>(
        `/consultations/${consultationId}/cancel`,
        { reason }
      );

      console.log('[ConsultationAPI] Consultation cancelled successfully');
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to cancel consultation:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to cancel consultation');
    }
  }

  /**
   * Generate Twilio video token for joining a consultation
   */
  async generateVideoToken(consultationId: string, role: 'patient' | 'provider'): Promise<VideoTokenResponse> {
    try {
      console.log('[ConsultationAPI] Generating video token:', { consultationId, role });

      const response = await apiService.post<ApiResponse<VideoTokenResponse>>(
        '/consultations/video/generate-token',
        { consultationId, role }
      );

      console.log('[ConsultationAPI] Video token generated');
      return response.data.data;
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to generate video token:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to generate video token');
    }
  }

  /**
   * Join a video consultation
   */
  async joinVideoCall(consultationId: string): Promise<void> {
    try {
      console.log('[ConsultationAPI] Joining video call:', consultationId);

      await apiService.post<ApiResponse<void>>(
        '/consultations/video/join',
        { consultationId }
      );

      console.log('[ConsultationAPI] Joined video call successfully');
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to join video call:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to join video call');
    }
  }

  /**
   * End a video consultation
   */
  async endVideoCall(consultationId: string): Promise<void> {
    try {
      console.log('[ConsultationAPI] Ending video call:', consultationId);

      await apiService.post<ApiResponse<void>>(
        '/consultations/video/end',
        { consultationId }
      );

      console.log('[ConsultationAPI] Video call ended successfully');
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to end video call:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to end video call');
    }
  }

  /**
   * Share patient vitals during video consultation
   */
  async shareVitals(request: ShareVitalsRequest): Promise<void> {
    try {
      console.log('[ConsultationAPI] Sharing vitals:', request);

      await apiService.post<ApiResponse<void>>(
        '/consultations/video/share-vitals',
        request
      );

      console.log('[ConsultationAPI] Vitals shared successfully');
    } catch (error: any) {
      console.error('[ConsultationAPI] Failed to share vitals:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to share vitals');
    }
  }
}

// Export singleton instance
export const consultationAPI = new ConsultationAPI();
export default consultationAPI;
