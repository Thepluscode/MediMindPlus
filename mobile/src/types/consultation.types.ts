/**
 * Consultation-related TypeScript interfaces for MediMindPlus
 * Supports video consultations and provider management
 */

export type ConsultationType =
  | 'ROUTINE_CHECKUP'
  | 'FOLLOW_UP'
  | 'URGENT_CARE'
  | 'MENTAL_HEALTH'
  | 'SPECIALIST_CONSULTATION'
  | 'PRESCRIPTION_REFILL';

export type ConsultationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'REFUNDED'
  | 'FAILED';

export type ProviderSpecialty =
  | 'PRIMARY_CARE'
  | 'CARDIOLOGY'
  | 'DERMATOLOGY'
  | 'ENDOCRINOLOGY'
  | 'GASTROENTEROLOGY'
  | 'NEUROLOGY'
  | 'ORTHOPEDICS'
  | 'PEDIATRICS'
  | 'PSYCHIATRY'
  | 'PULMONOLOGY';

export interface Provider {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  specialty: ProviderSpecialty;
  subspecialties?: ProviderSpecialty[];
  yearsExperience: number;
  consultationFee: number;
  bio: string;
  rating?: number;
  reviewsCount?: number;
  languagesSpoken?: string[];
  insuranceAccepted?: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  consultationType: ConsultationType;
  status: ConsultationStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  consultationFee: number;
  platformFee: number;
  providerEarnings: number;
  reasonForVisit: string;
  notes?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  videoRoomName?: string;
  createdAt: string;
  updatedAt: string;
  provider?: Provider;
}

export interface BookConsultationRequest {
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  consultationType: ConsultationType;
  reasonForVisit: string;
}

export interface SearchProvidersRequest {
  specialty?: ProviderSpecialty;
  minRating?: number;
  maxFee?: number;
  insuranceAccepted?: string;
  languageSpoken?: string;
  availableDate?: string;
  page?: number;
  limit?: number;
}

export interface VideoTokenResponse {
  token: string;
  roomName: string;
  identity: string;
  expiresAt: string;
}

export interface ShareVitalsRequest {
  consultationId: string;
  vitals: {
    heartRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    oxygenSaturation?: number;
    temperature?: number;
    bloodGlucose?: number;
  };
}

export interface ConsultationState {
  consultations: Consultation[];
  currentConsultation: Consultation | null;
  providers: Provider[];
  selectedProvider: Provider | null;
  videoToken: VideoTokenResponse | null;
  isLoading: boolean;
  error: string | null;
}
