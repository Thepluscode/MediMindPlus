import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  PatientOnboarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  ProviderPortal: undefined;
  CameraHealth: undefined;
  AIPredictionModels: undefined;
  FluInfectiousDiseaseDetection: undefined;
  CancerDetectionSystem: undefined;
  MedicalHistory: undefined;
  LifestyleAssessment: undefined;
  StrokeDetection: undefined;
  WearableDevices: undefined;
  ProviderDashboard: undefined;
  PatientManagement: { filter?: string } | undefined;
  PatientDetails: { patientId: string };
  AppointmentManagement: { filter?: string; patientId?: string; action?: string } | undefined;
  ClinicalNotes: { patientId?: string; action?: string } | undefined;
  PrescriptionManagement: { filter?: string; patientId?: string; action?: string } | undefined;
  VirtualHealthTwin: undefined;
  BiologicalAge: undefined;
  EmployerDashboard: undefined;
  AuthenticatedApp: undefined;
  LogHealthData: undefined;
  AIDoctorChat: undefined;
  BookingConfirmation: { appointmentId?: string } | undefined;
  PaymentCheckout: { amount: number; appointmentId?: string } | undefined;
  PaymentHistory: undefined;
  PaymentSuccess: { paymentId: string } | undefined;
  VoiceAnalysis: undefined;
  AnomalyDashboard: undefined;
  PredictiveTimeline: undefined;
  LabResults: undefined;
  CBTChatbot: undefined;
  CrisisIntervention: undefined;
  ChestXrayAnalysis: undefined;
  MammographyScreening: undefined;
  RetinalImaging: undefined;
  BrainTumorDetection: undefined;
  DrugInteraction: undefined;
  DrugDosing: undefined;
  SecureMessaging: undefined;
  Billing: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  PrivacySettings: undefined;
  ClearCache: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Reports: undefined;
  Enterprise: undefined;
  Profile: { userId?: string };
  Settings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: {
    navigate: (screen: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) => void;
    goBack: () => void;
  };
  route: {
    params: RootStackParamList[T];
  };
};

export type TabScreenProps<T extends keyof TabParamList> = {
  navigation: {
    navigate: (screen: keyof TabParamList, params?: TabParamList[keyof TabParamList]) => void;
    goBack: () => void;
  };
  route: {
    params: TabParamList[T];
  };
};
