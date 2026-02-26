import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Button, CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Typography, Card } from '../components/ui';
import { theme } from '../theme/theme';
import onboardingAPI, {
  ProfileData,
  MedicalHistoryData,
  LifestyleData,
  HealthGoal,
  ConsentData,
  MedicalRecordConnection,
  DeviceConnection,
} from '../services/onboardingAPI';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  duration: string;
  description: string;
}

interface UserProfile {
  name: string;
  age: string;
  conditions: string[];
  medications: string[];
  devices: string[];
  goals: string[];
}

const PatientOnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Onboarding data states
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    age: '',
    conditions: [],
    medications: [],
    devices: [],
    goals: []
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryData>({
    conditions: [],
    allergies: [],
    medications: [],
    surgeries: [],
    familyHistory: [],
  });

  const [lifestyleData, setLifestyleData] = useState<LifestyleData>({});
  const [healthGoals, setHealthGoals] = useState<HealthGoal[]>([]);
  const [consents, setConsents] = useState<{ [key: string]: boolean }>({
    HIPAA: false,
    Data_Sharing: false,
  });
  const [connectedDevices, setConnectedDevices] = useState<DeviceConnection[]>([]);

  // Load onboarding status on mount
  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      setLoading(true);
      const status = await onboardingAPI.getOnboardingStatus();
      if (status.currentStep > 0) {
        setCurrentStep(status.currentStep);
      }

      // Load connected devices if any
      const devices = await onboardingAPI.getConnectedDevices();
      setConnectedDevices(devices);

      // Load existing goals if any
      const goals = await onboardingAPI.getHealthGoals();
      setHealthGoals(goals);
    } catch (error) {
      // Error loading onboarding status - will use defaults
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentStepData = async () => {
    try {
      setSaving(true);
      const stepId = onboardingSteps[currentStep].id;

      switch (stepId) {
        case 'profile':
          await onboardingAPI.saveProfileData(profileData);
          break;
        case 'consent':
          // Save all consents
          for (const [type, accepted] of Object.entries(consents)) {
            if (accepted) {
              await onboardingAPI.recordConsent({
                consentType: type as ConsentData['consentType'],
                accepted: true,
              });
            }
          }
          break;
        case 'baseline':
          // Save medical history and lifestyle data
          await onboardingAPI.saveMedicalHistory(medicalHistory);
          await onboardingAPI.saveLifestyleData(lifestyleData);
          break;
        case 'goals':
          // Save health goals
          for (const goal of healthGoals) {
            if (!goal.id) {
              await onboardingAPI.addHealthGoal(goal);
            }
          }
          break;
      }

      // Update backend with current step
      await onboardingAPI.updateOnboardingStep(currentStep + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to save your data. Please try again.');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to MediMind',
      subtitle: 'Your AI-Powered Health Companion',
      icon: 'psychology',
      duration: '30 seconds',
      description: 'MediMind uses advanced AI to help you understand your health, predict potential issues before they happen, and guide you toward optimal wellness.',
    },
    {
      id: 'consent',
      title: 'Privacy & Consent',
      subtitle: 'Your Data, Your Control',
      icon: 'security',
      duration: '2 minutes',
      description: 'We take your privacy seriously. Your health data is encrypted, HIPAA-compliant, and never sold.',
    },
    {
      id: 'profile',
      title: 'Build Your Health Profile',
      subtitle: 'Help Us Understand You',
      icon: 'person',
      duration: '5 minutes',
      description: 'The more we know, the better we can help. All information is optional but improves accuracy.',
    },
    {
      id: 'records',
      title: 'Connect Your Medical Records',
      subtitle: 'Import Your Health History',
      icon: 'description',
      duration: '3 minutes',
      description: 'Securely import your medical records from your healthcare providers.',
    },
    {
      id: 'devices',
      title: 'Connect Your Devices',
      subtitle: 'Sync Wearables & Health Tech',
      icon: 'watch',
      duration: '5 minutes',
      description: 'Connect your wearables and health devices for continuous monitoring.',
    },
    {
      id: 'baseline',
      title: 'Establish Your Baseline',
      subtitle: 'Initial Health Assessment',
      icon: 'monitor-heart',
      duration: '10 minutes',
      description: 'Complete questionnaires and optional assessments to establish your health baseline.',
    },
    {
      id: 'goals',
      title: 'Set Your Health Goals',
      subtitle: 'What Do You Want to Achieve?',
      icon: 'trending-up',
      duration: '3 minutes',
      description: "Choose goals and we'll create a personalized plan to help you achieve them.",
    },
    {
      id: 'complete',
      title: "You're All Set! 🎉",
      subtitle: 'Your AI Health Companion is Ready',
      icon: 'check-circle',
      duration: 'Done!',
      description: 'MediMind is now analyzing your data and creating your personalized health insights.',
    }
  ];

  const currentStepData = onboardingSteps[currentStep];

  const handleNext = async () => {
    try {
      // Save current step data before moving to next
      await saveCurrentStepData();

      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete onboarding and navigate to dashboard
        await onboardingAPI.completeOnboarding();
        navigation.replace('Main');
      }
    } catch (error) {
      // Don't proceed if save failed
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeviceConnect = async (deviceType: DeviceConnection['deviceType']) => {
    try {
      setSaving(true);
      await onboardingAPI.connectDevice({
        deviceType,
        deviceId: `${deviceType.toLowerCase()}_${Date.now()}`,
        deviceName: deviceType,
      });

      // Reload connected devices
      const devices = await onboardingAPI.getConnectedDevices();
      setConnectedDevices(devices);

      Alert.alert('Success', `${deviceType} connected successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to connect device. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMedicalRecordConnect = async (provider: MedicalRecordConnection['provider']) => {
    try {
      setSaving(true);
      await onboardingAPI.connectMedicalRecords({
        provider,
        status: 'pending',
      });

      Alert.alert('Success', `${provider} connection initiated! We'll fetch your records shortly.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to connect medical records. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.featureList}>
        {[
          'Predict health risks 3-5 years in advance',
          'Personalized health insights from your data',
          'Connect all your health devices in one place',
          'Chat with AI trained on millions of medical records'
        ].map((feature, idx) => (
          <View key={idx} style={styles.featureItem}>
            <Icon name="check-circle" size={24} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
            <Typography variant="body" style={styles.featureText}>
              {feature}
            </Typography>
          </View>
        ))}
      </View>

      <View style={styles.howItWorksContainer}>
        <Typography variant="h3" weight="bold" style={styles.howItWorksTitle}>
          How It Works
        </Typography>
        <View style={styles.stepsRow}>
          {['Connect Your Data', 'AI Analysis', 'Take Action'].map((step, idx) => (
            <View key={idx} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Typography variant="body" weight="bold" style={styles.stepNumberText}>
                  {idx + 1}
                </Typography>
              </View>
              <Typography variant="caption" style={styles.stepItemTitle}>
                {step}
              </Typography>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderConsentStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.privacyBox}>
        <Typography variant="h4" weight="bold" style={styles.privacyTitle}>
          Your Privacy Rights
        </Typography>
        {[
          'End-to-end encryption',
          'HIPAA compliant',
          'No data selling',
          'You own your data'
        ].map((feature, idx) => (
          <View key={idx} style={styles.privacyFeature}>
            <Icon name="verified-user" size={20} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
            <Typography variant="body" style={styles.privacyFeatureText}>
              {feature}
            </Typography>
          </View>
        ))}
      </View>

      <View style={styles.consentCheckboxes}>
        <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
          Required Consents
        </Typography>
        <CheckBox
          title="I agree to HIPAA privacy practices and health data processing"
          checked={consents.HIPAA}
          onPress={() => setConsents({ ...consents, HIPAA: !consents.HIPAA })}
          containerStyle={styles.checkboxContainer}
          textStyle={styles.checkboxText}
        />
        <CheckBox
          title="I consent to secure data sharing with healthcare providers"
          checked={consents.Data_Sharing}
          onPress={() => setConsents({ ...consents, Data_Sharing: !consents.Data_Sharing })}
          containerStyle={styles.checkboxContainer}
          textStyle={styles.checkboxText}
        />
      </View>

      <View style={styles.infoBox}>
        <Typography variant="body" color="primary">
          <Typography variant="body" weight="bold">Note:</Typography> You can change these preferences anytime in Settings.
          Your consent is required to use MediMind services effectively.
        </Typography>
      </View>
    </View>
  );

  const renderProfileStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.profileSection}>
        <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
          Basic Information
        </Typography>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={profileData.firstName}
          onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={profileData.lastName}
          onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD)"
          value={profileData.dateOfBirth}
          onChangeText={(text) => setProfileData({ ...profileData, dateOfBirth: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={profileData.phoneNumber}
          onChangeText={(text) => setProfileData({ ...profileData, phoneNumber: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Blood Type (optional)"
          value={profileData.bloodType}
          onChangeText={(text) => setProfileData({ ...profileData, bloodType: text })}
        />
      </View>

      <View style={styles.infoBox}>
        <Typography variant="body" color="primary">
          <Typography variant="body" weight="bold">Privacy Note:</Typography> All fields are optional. More complete information improves prediction accuracy by 15-30%.
        </Typography>
      </View>
    </View>
  );

  const renderRecordsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.recordsGrid}>
        {[
          { name: 'Epic MyChart', icon: '🏥', patients: '200M+ patients', provider: 'Epic' as const },
          { name: 'Cerner Health', icon: '⚕️', patients: '150M+ patients', provider: 'Cerner' as const },
          { name: 'Apple Health', icon: '🍎', patients: '100M+ users', provider: 'AppleHealth' as const },
          { name: 'Manual Upload', icon: '📄', patients: 'Any provider', provider: 'Manual' as const }
        ].map((option, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.recordOption}
            accessibilityRole="button"
            accessibilityLabel={`Connect ${option.name}`}
          >
            <Typography style={styles.recordIcon}>{option.icon}</Typography>
            <Typography variant="body" weight="bold" style={styles.recordName}>{option.name}</Typography>
            <Typography variant="caption" color="secondary" style={styles.recordPatients}>{option.patients}</Typography>
            <Button
              title={saving ? "Connecting..." : "Connect"}
              buttonStyle={styles.connectButton}
              titleStyle={styles.connectButtonText}
              onPress={() => handleMedicalRecordConnect(option.provider)}
              disabled={saving}
              accessibilityHint={`Connect to ${option.name} to import your medical records`}
            />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.infoBox}>
        <Typography variant="body" color="primary">
          <Typography variant="body" weight="bold">Optional Step:</Typography> You can skip this and add records later in Settings.
        </Typography>
      </View>
    </View>
  );

  const renderDevicesStep = () => {
    const deviceOptions = [
      { name: 'Apple Watch', icon: '⌚', metrics: 'Heart rate, ECG, activity', type: 'AppleWatch' as const },
      { name: 'Fitbit', icon: '📱', metrics: 'Steps, heart rate, sleep', type: 'Fitbit' as const },
      { name: 'Oura Ring', icon: '💍', metrics: 'Sleep, HRV, temperature', type: 'OuraRing' as const },
      { name: 'Garmin', icon: '⌚', metrics: 'GPS, heart rate, training', type: 'Garmin' as const }
    ];

    return (
      <View style={styles.stepContent}>
        <View style={styles.deviceCategory}>
          <Typography variant="h4" weight="bold" style={styles.categoryTitle}>
            Fitness Trackers & Wearables
          </Typography>
          {deviceOptions.map((device, idx) => {
            const isConnected = connectedDevices.some(d => d.deviceType === device.type);
            return (
              <View key={idx} style={styles.deviceItem}>
                <View style={styles.deviceInfo}>
                  <Typography style={styles.deviceIcon}>{device.icon}</Typography>
                  <View>
                    <Typography variant="body" weight="bold" style={styles.deviceName}>{device.name}</Typography>
                    <Typography variant="caption" color="secondary" style={styles.deviceMetrics}>{device.metrics}</Typography>
                    {isConnected && (
                      <Typography variant="caption" weight="semibold" style={styles.connectedLabel}>✓ Connected</Typography>
                    )}
                  </View>
                </View>
                <Button
                  title={isConnected ? "Connected" : (saving ? "..." : "Connect")}
                  buttonStyle={[
                    styles.deviceConnectButton,
                    isConnected && styles.deviceConnectedButton
                  ]}
                  titleStyle={styles.deviceConnectButtonText}
                  onPress={() => handleDeviceConnect(device.type)}
                  disabled={saving || isConnected}
                  accessibilityHint={isConnected ? `${device.name} is already connected` : `Connect your ${device.name} to sync health data`}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.infoBox}>
          <Typography variant="body" color="primary">
            <Typography variant="body" weight="bold">Optional Step:</Typography> Connect devices for continuous health monitoring. You can add more devices later.
          </Typography>
        </View>
      </View>
    );
  };

  const renderGoalsStep = () => {
    const goalOptions = [
      { category: 'Prevention', goals: [
        { name: 'Reduce heart disease risk', type: 'prevention' as const },
        { name: 'Prevent diabetes', type: 'prevention' as const },
        { name: 'Lower cancer risk', type: 'prevention' as const }
      ]},
      { category: 'Wellness', goals: [
        { name: 'Improve sleep quality', type: 'sleep' as const },
        { name: 'Reduce stress', type: 'stress' as const },
        { name: 'Increase energy', type: 'fitness' as const }
      ]}
    ];

    const toggleGoal = (goalName: string, goalType: HealthGoal['goalType']) => {
      const existingGoal = healthGoals.find(g => g.goalName === goalName);
      if (existingGoal) {
        // Remove goal
        setHealthGoals(healthGoals.filter(g => g.goalName !== goalName));
      } else {
        // Add goal
        setHealthGoals([
          ...healthGoals,
          {
            goalName,
            goalType,
            priority: 'medium',
            timeframe: '6 months',
          }
        ]);
      }
    };

    return (
      <View style={styles.stepContent}>
        <View style={styles.goalsGrid}>
          {goalOptions.map((category, idx) => (
            <View key={idx} style={styles.goalCategory}>
              <Typography variant="h4" weight="bold" style={styles.goalCategoryTitle}>
                {category.category}
              </Typography>
              {category.goals.map((goal, goalIdx) => (
                <CheckBox
                  key={goalIdx}
                  title={goal.name}
                  checked={healthGoals.some(g => g.goalName === goal.name)}
                  onPress={() => toggleGoal(goal.name, goal.type)}
                  containerStyle={styles.checkboxContainer}
                  textStyle={styles.checkboxText}
                />
              ))}
            </View>
          ))}
        </View>
        <View style={styles.infoBox}>
          <Typography variant="body" color="primary">
            <Typography variant="body" weight="bold">Optional Step:</Typography> Select health goals to create a personalized action plan. You can modify goals anytime in your dashboard.
          </Typography>
        </View>
      </View>
    );
  };

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.celebrationBox}>
        <Typography style={styles.celebrationEmoji}>🎉</Typography>
        <Typography variant="h2" weight="bold" style={styles.celebrationTitle}>
          Welcome to MediMind!
        </Typography>
        <Typography variant="body" style={styles.celebrationSubtitle}>
          Your AI health companion is now processing your data
        </Typography>
      </View>

      <View style={styles.processingBox}>
        <Typography variant="body" weight="bold" style={styles.processingTitle}>
          AI Processing Status
        </Typography>
        {[
          'Analyzing medical records...',
          'Processing wearable data...',
          'Running AI prediction models...',
          'Generating personalized insights...'
        ].map((process, idx) => (
          <View key={idx} style={styles.processingItem}>
            <View style={styles.spinner} />
            <Typography variant="body" style={styles.processingText}>{process}</Typography>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'consent':
        return renderConsentStep();
      case 'profile':
        return renderProfileStep();
      case 'records':
        return renderRecordsStep();
      case 'devices':
        return renderDevicesStep();
      case 'goals':
        return renderGoalsStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return (
          <View style={styles.stepContent}>
            <Typography variant="body" color="secondary" style={styles.placeholderText}>
              Step content coming soon...
            </Typography>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Typography variant="h3" weight="bold" style={styles.progressTitle}>
            Patient Onboarding
          </Typography>
          <Typography variant="body" color="secondary" style={styles.progressStep}>
            Step {currentStep + 1} of {onboardingSteps.length}
          </Typography>
        </View>
        <View style={styles.progressTime}>
          <Typography variant="caption" color="secondary" style={styles.progressTimeLabel}>
            Estimated Time
          </Typography>
          <Typography variant="h4" weight="bold" color="primary" style={styles.progressTimeValue}>
            {currentStepData.duration}
          </Typography>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        {onboardingSteps.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressBar,
              idx < currentStep && styles.progressBarCompleted,
              idx === currentStep && styles.progressBarActive,
            ]}
          />
        ))}
      </View>

      {/* Current Step Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Onboarding step content" accessibilityRole="scrollview">
        <View style={styles.stepHeader}>
          <View style={styles.iconContainer}>
            <Icon name={currentStepData.icon} size={40} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
          </View>
          <View style={styles.stepHeaderText}>
            <Typography variant="h3" weight="bold" style={styles.stepTitle}>
              {currentStepData.title}
            </Typography>
            <Typography variant="body" color="secondary" style={styles.stepSubtitle}>
              {currentStepData.subtitle}
            </Typography>
          </View>
        </View>

        <Typography variant="body" color="primary" style={styles.stepDescription}>
          {currentStepData.description}
        </Typography>

        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Button
          title="Previous"
          onPress={handlePrevious}
          disabled={currentStep === 0}
          buttonStyle={[styles.navButton, styles.previousButton]}
          titleStyle={styles.previousButtonText}
          disabledStyle={styles.disabledButton}
        />

        <Typography variant="caption" color="secondary" style={styles.remainingSteps}>
          {currentStep === onboardingSteps.length - 1
            ? 'Setup Complete!'
            : `${onboardingSteps.length - currentStep - 1} steps remaining`}
        </Typography>

        <Button
          title={saving ? 'Saving...' : (currentStep === onboardingSteps.length - 1 ? 'Go to Dashboard' : 'Continue')}
          onPress={handleNext}
          disabled={
            saving ||
            currentStep === onboardingSteps.length - 1 ||
            (onboardingSteps[currentStep].id === 'consent' && (!consents.HIPAA || !consents.Data_Sharing))
          }
          buttonStyle={[styles.navButton, styles.nextButton]}
          titleStyle={styles.nextButtonText}
          icon={!saving && <Icon name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} importantForAccessibility="no" accessible={false} />}
          iconRight
        />
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Typography variant="caption" color="secondary">
          Need help? <Typography variant="caption" weight="semibold" color="primary" style={styles.helpLink}>Chat with support</Typography>
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  progressHeader: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {},
  progressStep: {
    marginTop: theme.spacing.xs,
  },
  progressTime: {
    alignItems: 'flex-end',
  },
  progressTimeLabel: {},
  progressTimeValue: {},
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
  },
  progressBarCompleted: {
    backgroundColor: theme.colors.success,
  },
  progressBarActive: {
    backgroundColor: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepHeaderText: {
    flex: 1,
  },
  stepTitle: {},
  stepSubtitle: {
    marginTop: theme.spacing.xs,
  },
  stepDescription: {
    lineHeight: 24,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  stepContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  featureList: {
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  howItWorksContainer: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  howItWorksTitle: {
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepNumberText: {},
  stepItemTitle: {
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  privacyBox: {
    backgroundColor: theme.colors.success + '10',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.success + '30',
  },
  privacyTitle: {
    marginBottom: theme.spacing.md,
  },
  privacyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  privacyFeatureText: {
    marginLeft: theme.spacing.sm,
  },
  consentCheckboxes: {
    marginTop: theme.spacing.md,
  },
  consentSteps: {
    gap: 12,
  },
  consentStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  consentStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  consentStepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  consentStepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingTop: 6,
  },
  profileSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: 15,
    marginBottom: theme.spacing.sm,
  },
  infoBox: {
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  infoText: {},
  infoBold: {},
  recordsGrid: {
    gap: 12,
  },
  recordOption: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  recordName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recordPatients: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deviceCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    fontSize: 30,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceMetrics: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deviceConnectButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deviceConnectButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deviceConnectedButton: {
    backgroundColor: theme.colors.success,
  },
  connectedLabel: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
    marginTop: 4,
  },
  goalsGrid: {
    gap: 20,
  },
  goalCategory: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  goalCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 8,
    marginLeft: 0,
    marginRight: 0,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#333',
  },
  celebrationBox: {
    backgroundColor: theme.colors.primary,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  processingBox: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  processingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderTopColor: 'transparent',
    marginRight: 12,
  },
  processingText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: 25,
    minWidth: 100,
  },
  previousButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  previousButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
  },
  nextButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.3,
  },
  remainingSteps: {
    flex: 1,
    textAlign: 'center',
  },
  helpSection: {
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  helpText: {},
  helpLink: {},
});

export default PatientOnboardingScreen;
