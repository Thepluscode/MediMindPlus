import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api';

// TypeScript Interfaces
export interface ProviderDashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingPrescriptions: number;
  criticalAlerts: number;
  upcomingAppointments: Appointment[];
  recentPatients: PatientSummary[];
}

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  lastVisit?: string;
  upcomingAppointment?: string;
  riskScore?: number;
  conditions?: string[];
}

export interface PatientDetails extends PatientSummary {
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodType?: string;
  allergies?: string[];
  medications?: Medication[];
  conditions?: MedicalCondition[];
  surgeries?: Surgery[];
  familyHistory?: FamilyHistory[];
  lifestyle?: LifestyleData;
  appointments?: Appointment[];
  prescriptions?: Prescription[];
  clinicalNotes?: ClinicalNote[];
  vitalSigns?: VitalSign[];
}

export interface Appointment {
  id?: string;
  patientId: string;
  patientName?: string;
  providerId?: string;
  providerName?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: 'checkup' | 'follow-up' | 'urgent' | 'consultation' | 'procedure';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClinicalNote {
  id?: string;
  patientId: string;
  providerId?: string;
  appointmentId?: string;
  noteType: 'progress' | 'consultation' | 'procedure' | 'diagnosis' | 'treatment-plan' | 'follow-up';
  chiefComplaint?: string;
  presentIllness?: string;
  assessment: string;
  plan: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
  };
  diagnosis?: string[];
  prescriptions?: string[];
  labOrders?: string[];
  referrals?: string[];
  followUpDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Prescription {
  id?: string;
  patientId: string;
  patientName?: string;
  providerId?: string;
  providerName?: string;
  medication: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  duration: string;
  quantity: number;
  refills: number;
  instructions?: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  prescribedDate?: string;
  filledDate?: string;
  pharmacyNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
}

export interface MedicalCondition {
  id?: string;
  name: string;
  diagnosedDate?: string;
  status?: 'active' | 'resolved' | 'managed';
  notes?: string;
}

export interface Surgery {
  id?: string;
  name: string;
  date: string;
  notes?: string;
}

export interface FamilyHistory {
  id?: string;
  condition: string;
  relationship: string;
  notes?: string;
}

export interface LifestyleData {
  smokingStatus?: string;
  alcoholConsumption?: string;
  exerciseFrequency?: string;
  diet?: string;
  sleepHours?: number;
  stressLevel?: number;
  occupation?: string;
}

export interface VitalSign {
  id?: string;
  recordedDate: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface PatientUpdateData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodType?: string;
}

export interface AppointmentFilters {
  date?: string;
  status?: string;
  patientId?: string;
  type?: string;
}

export interface PrescriptionFilters {
  patientId?: string;
  status?: string;
  medication?: string;
}

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Provider API Service
const providerAPI = {
  // 1. Get Provider Dashboard Stats
  getDashboardStats: async (): Promise<ProviderDashboardStats> => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/provider/dashboard`, { headers });
    return response.data;
  },

  // 2. Get All Patients (with optional search/filter)
  getPatients: async (search?: string): Promise<PatientSummary[]> => {
    const headers = await getAuthHeaders();
    const params = search ? { search } : {};
    const response = await axios.get(`${API_URL}/provider/patients`, { headers, params });
    return response.data;
  },

  // 3. Get Patient Details by ID
  getPatientDetails: async (patientId: string): Promise<PatientDetails> => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/provider/patients/${patientId}`, { headers });
    return response.data;
  },

  // 4. Update Patient Information
  updatePatient: async (patientId: string, data: PatientUpdateData): Promise<PatientDetails> => {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/provider/patients/${patientId}`, data, { headers });
    return response.data;
  },

  // 5. Create New Appointment
  createAppointment: async (appointmentData: Appointment): Promise<Appointment> => {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/provider/appointments`, appointmentData, { headers });
    return response.data;
  },

  // 6. Get Appointments (with optional filters)
  getAppointments: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/provider/appointments`, { headers, params: filters });
    return response.data;
  },

  // 7. Update Appointment
  updateAppointment: async (appointmentId: string, data: Partial<Appointment>): Promise<Appointment> => {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/provider/appointments/${appointmentId}`, data, { headers });
    return response.data;
  },

  // 8. Cancel Appointment
  cancelAppointment: async (appointmentId: string, reason?: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/provider/appointments/${appointmentId}`, {
      headers,
      data: { reason }
    });
  },

  // 9. Create Clinical Note
  createClinicalNote: async (noteData: ClinicalNote): Promise<ClinicalNote> => {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/provider/notes`, noteData, { headers });
    return response.data;
  },

  // 10. Get Clinical Notes for Patient
  getPatientNotes: async (patientId: string): Promise<ClinicalNote[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/provider/notes/${patientId}`, { headers });
    return response.data;
  },

  // 11. Create Prescription
  createPrescription: async (prescriptionData: Prescription): Promise<Prescription> => {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/provider/prescriptions`, prescriptionData, { headers });
    return response.data;
  },

  // 12. Get Prescriptions (with optional filters)
  getPrescriptions: async (filters?: PrescriptionFilters): Promise<Prescription[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/provider/prescriptions`, { headers, params: filters });
    return response.data;
  },

  // Bonus: Update Prescription Status
  updatePrescription: async (prescriptionId: string, data: Partial<Prescription>): Promise<Prescription> => {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/provider/prescriptions/${prescriptionId}`, data, { headers });
    return response.data;
  },
};

export default providerAPI;
