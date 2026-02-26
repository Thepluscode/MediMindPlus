import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Typography } from '../components/ui';
import { theme } from '../theme/theme';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to MediMind',
    description: 'Your personal AI-powered healthcare companion that helps monitor and predict your health.',
    icon: '🏥',
  },
  {
    id: 2,
    title: 'Health Monitoring',
    description: 'Track your vital signs, symptoms, and daily health metrics with ease.',
    icon: '📊',
  },
  {
    id: 3,
    title: 'AI Predictions',
    description: 'Get personalized health insights and risk assessments powered by advanced AI.',
    icon: '🤖',
  },
  {
    id: 4,
    title: 'Stay Connected',
    description: 'Connect with healthcare providers and get real-time health recommendations.',
    icon: '🔗',
  },
];

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Navigate to main app or login screen
    navigation.replace('Login');
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
        accessibilityHint="Skip tutorial and go to login screen"
      >
        <Typography variant="body" color="secondary" weight="medium">
          Skip
        </Typography>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <View
          style={styles.iconContainer}
          importantForAccessibility="no"
          accessible={false}
        >
          <Typography style={styles.icon}>{currentStepData.icon}</Typography>
        </View>

        <Typography variant="h2" weight="bold" color="primary" align="center" style={styles.title}>
          {currentStepData.title}
        </Typography>
        <Typography variant="body" color="secondary" align="center" style={styles.description}>
          {currentStepData.description}
        </Typography>
      </View>

      {/* Progress Indicators */}
      <View
        style={styles.progressContainer}
        accessibilityLabel={`Step ${currentStep + 1} of ${onboardingSteps.length}`}
        accessibilityRole="progressbar"
      >
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
            ]}
            importantForAccessibility="no"
            accessible={false}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.previousButton]}
            onPress={handlePrevious}
            accessibilityRole="button"
            accessibilityLabel="Previous"
            accessibilityHint="Go back to previous onboarding step"
          >
            <Typography variant="body" color="info" weight="semibold">
              Previous
            </Typography>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.nextButton]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={currentStep === onboardingSteps.length - 1 ? 'Get started' : 'Next'}
          accessibilityHint={currentStep === onboardingSteps.length - 1 ? 'Complete onboarding and go to login' : 'Continue to next onboarding step'}
        >
          <Typography variant="body" color="inverse" weight="semibold">
            {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    marginBottom: theme.spacing.lg,
  },
  description: {
    lineHeight: 24,
    paddingHorizontal: theme.spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  previousButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.info,
  },
  nextButton: {
    backgroundColor: theme.colors.info,
  },
});

export default OnboardingScreen;
