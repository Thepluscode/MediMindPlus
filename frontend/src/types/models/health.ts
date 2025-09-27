export interface VitalSigns {
  value: any;
  id: string;
  userId: string;
  heartRate: number;
  systolicBp: number;
  diastolicBp: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  measuredAt: string;
  measurementSource: 'device' | 'manual';
  deviceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthProfile {
  id: string;
  userId: string;
  height: number; // in cm
  weight: number; // in kg
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }>;
  medicalConditions: Array<{
    name: string;
    diagnosisDate: string;
    isActive: boolean;
    notes?: string;
  }>;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Health data point for time series data
export interface HealthDataPoint {
  value: number;
  timestamp: string;
  unit?: string;
}

// Blood pressure reading
export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: string;
  position?: 'sitting' | 'standing' | 'lying';
  arm?: 'left' | 'right';
  notes?: string;
}

// Sleep data
export interface SleepData {
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  sleepStages?: {
    awake: number;
    light: number;
    deep: number;
    rem: number;
  };
  quality?: number; // 1-10
  notes?: string;
}

// Activity data
export interface ActivityData {
  steps: number;
  distance?: number; // in meters
  calories?: number;
  activeMinutes?: number;
  startTime: string;
  endTime: string;
  activityType?: 'walking' | 'running' | 'cycling' | 'swimming' | 'other';
}

// Voice data for analysis
export interface VoiceData {
  recordingUri: string;
  duration: number; // in seconds
  timestamp: string;
  analysisResults?: any; // Will be replaced with specific type once analysis structure is defined
}

// Health metrics for time series data
export interface HealthMetrics {
  timestamp: string;
  heartRate?: number;
  systolicBp?: number;
  diastolicBp?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  steps?: number;
  caloriesBurned?: number;
  activeMinutes?: number;
  sleepDuration?: number;
  sleepEfficiency?: number;
  stressLevel?: number;
  hrv?: number; // Heart Rate Variability
  bloodGlucose?: number;
  weight?: number;
  bmi?: number;
  bodyFatPercentage?: number;
  hydration?: number;
  spo2?: number; // Peripheral capillary oxygen saturation
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    pulse?: number;
  };
  tags?: string[];
  notes?: string;
}

// Health data state for Redux
export interface HealthDataState {
  currentData: any;
  isUploading: any;
  lastSyncTime: any;
  vitalSigns: VitalSigns[];
  bloodPressureReadings: BloodPressureReading[];
  sleepData: SleepData[];
  activityData: ActivityData[];
  voiceRecordings: VoiceData[];
  healthMetrics: HealthMetrics[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface HealthSummary {
  lastVitalSigns: Omit<VitalSigns, 'userId' | 'createdAt' | 'updatedAt'>;
  recentTrends: {
    heartRate: number[];
    bloodPressure: { systolic: number[]; diastolic: number[] };
    temperature: number[];
  };
  riskFactors: string[];
  lastCheckup?: string;
  nextAppointment?: string;
}
