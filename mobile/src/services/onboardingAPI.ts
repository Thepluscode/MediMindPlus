/**
 * Patient Onboarding API Service
 * Connects frontend onboarding flow to backend endpoints
 *
 * Backend endpoints: /api/onboarding/*
 * Documentation: BACKEND_API_ENDPOINTS_ANALYSIS.md (lines 175-264)
 */

import apiService from './apiService';

// ==================== TYPE DEFINITIONS ====================

export interface OnboardingStatus {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  completedSteps: string[];
  lastUpdated: string;
  isCompleted: boolean;
}

export interface ProfileData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  };
  bloodType?: string;
  height?: number; // cm
  weight?: number; // kg
}

export interface MedicalHistoryData {
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
  surgeries?: Array<{
    name: string;
    date: string;
    notes?: string;
  }>;
  familyHistory?: Array<{
    condition: string;
    relationship: string;
    notes?: string;
  }>;
}

export interface LifestyleData {
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholConsumption?: 'none' | 'occasional' | 'moderate' | 'heavy';
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietType?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'other';
  sleepHours?: number;
  stressLevel?: 1 | 2 | 3 | 4 | 5;
  occupation?: string;
}

export interface ConsentData {
  consentType: 'HIPAA' | 'Data_Sharing' | 'Research' | 'Marketing';
  accepted: boolean;
  timestamp?: string;
  ipAddress?: string;
}

export interface MedicalRecordConnection {
  provider: 'Epic' | 'Cerner' | 'AppleHealth' | 'Manual' | 'Other';
  credentials?: {
    username?: string;
    password?: string;
    facilityCode?: string;
  };
  status?: 'pending' | 'connected' | 'failed';
  connectedAt?: string;
}

export interface DeviceConnection {
  deviceType: 'Fitbit' | 'Garmin' | 'AppleWatch' | 'OuraRing' | 'Whoop' | 'Other';
  deviceId: string;
  deviceName?: string;
  status?: 'pending' | 'connected' | 'disconnected';
  connectedAt?: string;
  lastSyncedAt?: string;
}

export interface HealthGoal {
  id?: string;
  goalName: string;
  goalType: 'weight_loss' | 'fitness' | 'nutrition' | 'sleep' | 'stress' | 'chronic_condition' | 'prevention' | 'other';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  timeframe?: string; // e.g., "3 months", "6 months", "1 year"
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Get current onboarding status for authenticated user
 * Backend: GET /api/onboarding/status
 */
export const getOnboardingStatus = async (): Promise<OnboardingStatus> => {
  const response = await apiService.get('/onboarding/status');
  return response.data;
};

/**
 * Start or resume onboarding flow
 * Backend: POST /api/onboarding/start
 */
export const startOnboarding = async (): Promise<OnboardingStatus> => {
  const response = await apiService.post('/onboarding/start');
  return response.data;
};

/**
 * Update progress to a specific onboarding step
 * Backend: PUT /api/onboarding/step
 */
export const updateOnboardingStep = async (
  stepNumber: number,
  stepData?: any
): Promise<OnboardingStatus> => {
  const response = await apiService.put('/onboarding/step', {
    stepNumber,
    data: stepData,
  });
  return response.data;
};

/**
 * Save user profile data
 * Backend: PUT /api/onboarding/profile
 */
export const saveProfileData = async (profileData: ProfileData): Promise<any> => {
  const response = await apiService.put('/onboarding/profile', profileData);
  return response.data;
};

/**
 * Save medical history
 * Backend: PUT /api/onboarding/medical-history
 */
export const saveMedicalHistory = async (medicalHistory: MedicalHistoryData): Promise<any> => {
  const response = await apiService.put('/onboarding/medical-history', medicalHistory);
  return response.data;
};

/**
 * Save lifestyle information
 * Backend: PUT /api/onboarding/lifestyle
 */
export const saveLifestyleData = async (lifestyleData: LifestyleData): Promise<any> => {
  const response = await apiService.put('/onboarding/lifestyle', lifestyleData);
  return response.data;
};

/**
 * Record user consent
 * Backend: POST /api/onboarding/consent
 */
export const recordConsent = async (consentData: ConsentData): Promise<any> => {
  const response = await apiService.post('/onboarding/consent', consentData);
  return response.data;
};

/**
 * Connect medical records from provider
 * Backend: POST /api/onboarding/medical-records
 */
export const connectMedicalRecords = async (
  connectionData: MedicalRecordConnection
): Promise<any> => {
  const response = await apiService.post('/onboarding/medical-records', connectionData);
  return response.data;
};

/**
 * Get list of connected medical record providers
 * Backend: GET /api/onboarding/medical-records
 */
export const getConnectedMedicalRecords = async (): Promise<MedicalRecordConnection[]> => {
  const response = await apiService.get('/onboarding/medical-records');
  return response.data;
};

/**
 * Connect a wearable device
 * Backend: POST /api/onboarding/devices
 */
export const connectDevice = async (deviceData: DeviceConnection): Promise<any> => {
  const response = await apiService.post('/onboarding/devices', deviceData);
  return response.data;
};

/**
 * Get list of connected devices
 * Backend: GET /api/onboarding/devices
 */
export const getConnectedDevices = async (): Promise<DeviceConnection[]> => {
  const response = await apiService.get('/onboarding/devices');
  return response.data;
};

/**
 * Disconnect a device
 * Backend: DELETE /api/onboarding/devices/:deviceId
 */
export const disconnectDevice = async (deviceId: string): Promise<any> => {
  const response = await apiService.delete(`/onboarding/devices/${deviceId}`);
  return response.data;
};

/**
 * Add a health goal
 * Backend: POST /api/onboarding/goals
 */
export const addHealthGoal = async (goalData: HealthGoal): Promise<HealthGoal> => {
  const response = await apiService.post('/onboarding/goals', goalData);
  return response.data;
};

/**
 * Get all health goals
 * Backend: GET /api/onboarding/goals
 */
export const getHealthGoals = async (): Promise<HealthGoal[]> => {
  const response = await apiService.get('/onboarding/goals');
  return response.data;
};

/**
 * Update a health goal
 * Backend: PUT /api/onboarding/goals/:goalId
 */
export const updateHealthGoal = async (goalId: string, goalData: Partial<HealthGoal>): Promise<HealthGoal> => {
  const response = await apiService.put(`/onboarding/goals/${goalId}`, goalData);
  return response.data;
};

/**
 * Delete a health goal
 * Backend: DELETE /api/onboarding/goals/:goalId
 */
export const deleteHealthGoal = async (goalId: string): Promise<any> => {
  const response = await apiService.delete(`/onboarding/goals/${goalId}`);
  return response.data;
};

/**
 * Mark onboarding as complete
 * Backend: POST /api/onboarding/complete
 */
export const completeOnboarding = async (): Promise<any> => {
  const response = await apiService.post('/onboarding/complete');
  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Save all onboarding data at once
 * Convenience function that calls multiple endpoints
 */
export const saveCompleteOnboardingData = async (data: {
  profile?: ProfileData;
  medicalHistory?: MedicalHistoryData;
  lifestyle?: LifestyleData;
  goals?: HealthGoal[];
  consents?: ConsentData[];
}): Promise<void> => {
  try {
    // Save in sequence to ensure data integrity
    if (data.profile) {
      await saveProfileData(data.profile);
    }

    if (data.medicalHistory) {
      await saveMedicalHistory(data.medicalHistory);
    }

    if (data.lifestyle) {
      await saveLifestyleData(data.lifestyle);
    }

    if (data.consents && data.consents.length > 0) {
      for (const consent of data.consents) {
        await recordConsent(consent);
      }
    }

    if (data.goals && data.goals.length > 0) {
      for (const goal of data.goals) {
        await addHealthGoal(goal);
      }
    }
  } catch (error) {
    console.error('[OnboardingAPI] Error saving complete onboarding data:', error);
    throw error;
  }
};

/**
 * Validate if onboarding is complete
 */
export const validateOnboardingCompletion = async (): Promise<boolean> => {
  try {
    const status = await getOnboardingStatus();
    return status.isCompleted && status.completionPercentage === 100;
  } catch (error) {
    console.error('[OnboardingAPI] Error validating onboarding completion:', error);
    return false;
  }
};

export default {
  // Status
  getOnboardingStatus,
  startOnboarding,
  updateOnboardingStep,
  completeOnboarding,

  // Profile
  saveProfileData,
  saveMedicalHistory,
  saveLifestyleData,

  // Consent
  recordConsent,

  // Medical Records
  connectMedicalRecords,
  getConnectedMedicalRecords,

  // Devices
  connectDevice,
  getConnectedDevices,
  disconnectDevice,

  // Goals
  addHealthGoal,
  getHealthGoals,
  updateHealthGoal,
  deleteHealthGoal,

  // Helpers
  saveCompleteOnboardingData,
  validateOnboardingCompletion,
};
