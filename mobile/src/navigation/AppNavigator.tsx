import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList, TabParamList } from '../types/navigation';
import { HealthDataProvider } from '../context/HealthDataProvider';

// Screens
import ModernLoginScreen from '../screens/ModernLoginScreen';
import ModernRegisterScreen from '../screens/ModernRegisterScreen';
import HealthDashboardWrapper from '../components/HealthDashboardWrapper';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EnterpriseScreen from '../screens/EnterpriseScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PatientOnboardingScreen from '../screens/PatientOnboardingScreen';
import ProviderPortalScreen from '../screens/ProviderPortalScreen';
import CameraHealthScreen from '../screens/CameraHealthScreen';
import AIPredictionModelsScreen from '../screens/AIPredictionModelsScreen';
import FluInfectiousDiseaseDetectionScreen from '../screens/FluInfectiousDiseaseDetectionScreen';
import CancerDetectionSystemScreen from '../screens/CancerDetectionSystemScreen';
import StrokeDetectionScreen from '../screens/StrokeDetectionScreen';
import WearableDevicesScreen from '../screens/WearableDevicesScreen';
import MedicalHistoryScreen from '../screens/MedicalHistoryScreen';
import LifestyleAssessmentScreen from '../screens/LifestyleAssessmentScreen';
import ProviderDashboardScreen from '../screens/ProviderDashboardScreen';
import PatientManagementScreen from '../screens/PatientManagementScreen';
import PatientDetailsScreen from '../screens/PatientDetailsScreen';
import AppointmentManagementScreen from '../screens/AppointmentManagementScreen';
import ClinicalNotesScreen from '../screens/ClinicalNotesScreen';
import PrescriptionManagementScreen from '../screens/PrescriptionManagementScreen';
import VirtualHealthTwinScreen from '../screens/VirtualHealthTwinScreen';
import BiologicalAgeScreen from '../screens/BiologicalAgeScreen';
import EmployerDashboardScreen from '../screens/EmployerDashboardScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import PaymentCheckoutScreen from '../screens/PaymentCheckoutScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import LogHealthDataScreen from '../screens/LogHealthDataScreen';
import AIDoctorChatScreen from '../screens/AIDoctorChatScreen';
import VoiceAnalysisScreen from '../screens/VoiceAnalysisScreen';
import AnomalyDashboardScreen from '../screens/AnomalyDashboardScreen';
import PredictiveTimelineScreen from '../screens/PredictiveTimelineScreen';
import LabResultsScreen from '../screens/LabResultsScreen';
import CBTChatbotScreen from '../screens/CBTChatbotScreen';
import CrisisInterventionScreen from '../screens/CrisisInterventionScreen';
import ChestXrayAnalysisScreen from '../screens/ChestXrayAnalysisScreen';
import MammographyScreeningScreen from '../screens/MammographyScreeningScreen';
import RetinalImagingScreen from '../screens/RetinalImagingScreen';
import BrainTumorDetectionScreen from '../screens/BrainTumorDetectionScreen';
import DrugInteractionScreen from '../screens/DrugInteractionScreen';
import DrugDosingScreen from '../screens/DrugDosingScreen';
import SecureMessagingScreen from '../screens/SecureMessagingScreen';
import BillingScreen from '../screens/BillingScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import ClearCacheScreen from '../screens/ClearCacheScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import DesignSystemDemo from '../screens/DesignSystemDemo';
import { RootState } from '../store/store';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const MainTabs: React.FC = () => {
  const tabBarIcon = (routeName: keyof TabParamList) => 
    ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName: string;

      switch (routeName) {
        case 'Dashboard':
          iconName = 'dashboard';
          break;
        case 'Reports':
          iconName = 'assessment';
          break;
        case 'Enterprise':
          iconName = 'business';
          break;
        case 'Profile':
          iconName = 'person';
          break;
        case 'Settings':
          iconName = 'settings';
          break;
        default:
          iconName = 'help';
      }

      return <Icon name={iconName} size={size} color={color} />;
    };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: tabBarIcon(route.name as keyof TabParamList),
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#667eea',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={HealthDashboardWrapper}
        options={{
          title: 'Health Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: tabBarIcon('Dashboard')
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Health Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: tabBarIcon('Reports')
        }}
      />
      <Tab.Screen
        name="Enterprise"
        component={EnterpriseScreen}
        options={{
          title: 'Enterprise Platform',
          tabBarLabel: 'Enterprise',
          tabBarIcon: tabBarIcon('Enterprise'),
          tabBarBadge: 'NEW',
          tabBarBadgeStyle: {
            backgroundColor: '#FF3B30',
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
          }
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: tabBarIcon('Profile')
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: tabBarIcon('Settings')
        }}
      />
    </Tab.Navigator>
  );
};

// Wrapper component for authenticated routes with HealthDataProvider
const AuthenticatedRoutes: React.FC = () => {
  return (
    <HealthDataProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="CameraHealth" component={CameraHealthScreen} />
        <Stack.Screen name="AIPredictionModels" component={AIPredictionModelsScreen} />
        <Stack.Screen name="FluInfectiousDiseaseDetection" component={FluInfectiousDiseaseDetectionScreen} />
        <Stack.Screen name="CancerDetectionSystem" component={CancerDetectionSystemScreen} />
        <Stack.Screen
          name="StrokeDetection"
          component={StrokeDetectionScreen}
          options={{ headerShown: true, title: 'AI Stroke Detection' }}
        />
        <Stack.Screen
          name="WearableDevices"
          component={WearableDevicesScreen}
          options={{ headerShown: true, title: 'Wearable Devices' }}
        />
        <Stack.Screen
          name="MedicalHistory"
          component={MedicalHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LifestyleAssessment"
          component={LifestyleAssessmentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProviderDashboard"
          component={ProviderDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PatientManagement"
          component={PatientManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PatientDetails"
          component={PatientDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AppointmentManagement"
          component={AppointmentManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ClinicalNotes"
          component={ClinicalNotesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrescriptionManagement"
          component={PrescriptionManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VirtualHealthTwin"
          component={VirtualHealthTwinScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BiologicalAge"
          component={BiologicalAgeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EmployerDashboard"
          component={EmployerDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{ headerShown: true, title: 'Confirm Booking' }}
        />
        <Stack.Screen
          name="PaymentCheckout"
          component={PaymentCheckoutScreen}
          options={{ headerShown: true, title: 'Payment' }}
        />
        <Stack.Screen
          name="PaymentHistory"
          component={PaymentHistoryScreen}
          options={{ headerShown: true, title: 'Payment History' }}
        />
        <Stack.Screen
          name="PaymentSuccess"
          component={PaymentSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LogHealthData"
          component={LogHealthDataScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AIDoctorChat"
          component={AIDoctorChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VoiceAnalysis"
          component={VoiceAnalysisScreen}
          options={{ headerShown: true, title: 'Voice Analysis' }}
        />
        <Stack.Screen
          name="AnomalyDashboard"
          component={AnomalyDashboardScreen}
          options={{ headerShown: true, title: 'Health Anomalies' }}
        />
        <Stack.Screen
          name="PredictiveTimeline"
          component={PredictiveTimelineScreen}
          options={{ headerShown: true, title: 'Predictive Health Timeline' }}
        />
        <Stack.Screen
          name="LabResults"
          component={LabResultsScreen}
          options={{ headerShown: true, title: 'Lab Results' }}
        />
        <Stack.Screen
          name="CBTChatbot"
          component={CBTChatbotScreen}
          options={{ headerShown: true, title: 'CBT Therapy' }}
        />
        <Stack.Screen
          name="CrisisIntervention"
          component={CrisisInterventionScreen}
          options={{ headerShown: true, title: 'Crisis Support' }}
        />
        <Stack.Screen
          name="ChestXrayAnalysis"
          component={ChestXrayAnalysisScreen}
          options={{ headerShown: true, title: 'Chest X-Ray Analysis' }}
        />
        <Stack.Screen
          name="MammographyScreening"
          component={MammographyScreeningScreen}
          options={{ headerShown: true, title: 'Mammography Screening' }}
        />
        <Stack.Screen
          name="RetinalImaging"
          component={RetinalImagingScreen}
          options={{ headerShown: true, title: 'Retinal Imaging' }}
        />
        <Stack.Screen
          name="BrainTumorDetection"
          component={BrainTumorDetectionScreen}
          options={{ headerShown: true, title: 'Brain Tumor Detection' }}
        />
        <Stack.Screen
          name="DrugInteraction"
          component={DrugInteractionScreen}
          options={{ headerShown: true, title: 'Drug Interaction Checker' }}
        />
        <Stack.Screen
          name="DrugDosing"
          component={DrugDosingScreen}
          options={{ headerShown: true, title: 'Drug Dosing Guide' }}
        />
        <Stack.Screen
          name="SecureMessaging"
          component={SecureMessagingScreen}
          options={{ headerShown: true, title: 'Secure Messaging' }}
        />
        <Stack.Screen
          name="Billing"
          component={BillingScreen}
          options={{ headerShown: true, title: 'Billing & Payments' }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: true, title: 'Edit Profile' }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ headerShown: true, title: 'Change Password' }}
        />
        <Stack.Screen
          name="PrivacySettings"
          component={PrivacySettingsScreen}
          options={{ headerShown: true, title: 'Privacy Settings' }}
        />
        <Stack.Screen
          name="ClearCache"
          component={ClearCacheScreen}
          options={{ headerShown: true, title: 'Clear Cache' }}
        />
        <Stack.Screen
          name="HelpCenter"
          component={HelpCenterScreen}
          options={{ headerShown: true, title: 'Help Center' }}
        />
        <Stack.Screen
          name="ContactUs"
          component={ContactUsScreen}
          options={{ headerShown: true, title: 'Contact Us' }}
        />
        <Stack.Screen
          name="TermsOfService"
          component={TermsOfServiceScreen}
          options={{ headerShown: true, title: 'Terms of Service' }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ headerShown: true, title: 'Privacy Policy' }}
        />
        <Stack.Screen
          name="DesignSystemDemo"
          component={DesignSystemDemo}
          options={{ headerShown: true, title: 'Design System Demo' }}
        />
      </Stack.Navigator>
    </HealthDataProvider>
  );
};

const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  console.log('[AppNavigator] Rendering with isAuthenticated:', isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="PatientOnboarding" component={PatientOnboardingScreen} />
          <Stack.Screen name="Login" component={ModernLoginScreen} />
          <Stack.Screen name="Register" component={ModernRegisterScreen} />
          <Stack.Screen name="ProviderPortal" component={ProviderPortalScreen} />
        </>
      ) : (
        <Stack.Screen name="AuthenticatedApp" component={AuthenticatedRoutes} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
