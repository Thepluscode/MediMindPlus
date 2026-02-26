import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../store/slices/authSlice';
import { ScreenProps } from '../types/navigation';
import { AppDispatch } from '../store/store';
import { theme } from '../theme/theme';
import {
  Button,
  Card,
  Input,
  Typography,
  Spacing,
  AlertCard,
} from '../components/ui';

const ModernRegisterScreen: React.FC<ScreenProps<'Register'>> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  // Stop loading when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Must contain an uppercase letter';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Must contain a number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    // Prevent duplicate submissions
    if (isLoading) return;

    // Clear previous errors
    setRegistrationError(null);

    // Validate form
    if (!validateForm()) return;

    setIsLoading(true);

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setRegistrationError('Registration is taking too long. Please try again.');
    }, 10000);

    try {
      const { confirmPassword, ...userData } = formData;
      await dispatch(registerUser(userData)).unwrap();
      clearTimeout(timeoutId);
      // Navigation happens automatically via Redux state change
    } catch (error: any) {
      clearTimeout(timeoutId);
      setRegistrationError(error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={theme.gradients.primary.colors} style={styles.gradient} accessible={false} importantForAccessibility="no-hide-descendants">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Registration form"
          accessibilityRole="scrollview"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Return to previous screen"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
            <View style={styles.iconContainer} importantForAccessibility="no" accessible={false}>
              <Ionicons name="person-add" size={50} color="#fff" importantForAccessibility="no" accessible={false} />
            </View>
            <Typography variant="h1" color="inverse" align="center">
              Create Account
            </Typography>
            <Spacing size="xs" />
            <Typography variant="body" color="inverse" align="center">
              Join MediMind+ for better health
            </Typography>
          </View>

          <Spacing size="lg" />

          {/* Register Card */}
          <Card elevated={true} elevation="lg" padding="lg">
            {/* Registration Error Alert */}
            {registrationError && (
              <>
                <AlertCard
                  severity="critical"
                  title="Registration Failed"
                  message={registrationError}
                  onDismiss={() => setRegistrationError(null)}
                />
                <Spacing size="md" />
              </>
            )}

            {/* Name Input */}
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              error={errors.name}
              autoCapitalize="words"
              required={true}
              leftIcon={<Ionicons name="person-outline" size={20} color="#667eea" importantForAccessibility="no" accessible={false} />}
              accessibilityLabel="Full name"
              accessibilityHint="Enter your full name to create an account"
            />

            {/* Email Input */}
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required={true}
              leftIcon={<Ionicons name="mail-outline" size={20} color="#667eea" importantForAccessibility="no" accessible={false} />}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address to create an account"
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              error={errors.password}
              helperText="Min 8 characters, 1 uppercase, 1 number"
              secureTextEntry={true}
              autoCapitalize="none"
              required={true}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#667eea" importantForAccessibility="no" accessible={false} />}
              accessibilityLabel="Password"
              accessibilityHint="Create a password with minimum 8 characters, 1 uppercase letter, and 1 number"
            />

            {/* Confirm Password Input */}
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              error={errors.confirmPassword}
              secureTextEntry={true}
              autoCapitalize="none"
              required={true}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#667eea" importantForAccessibility="no" accessible={false} />}
              accessibilityLabel="Confirm password"
              accessibilityHint="Re-enter your password to confirm"
            />

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setAgreeToTerms(!agreeToTerms);
                if (errors.terms) setErrors({ ...errors, terms: undefined });
              }}
              accessible={true}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreeToTerms }}
              accessibilityLabel="Agree to terms and conditions"
              accessibilityHint="Toggle agreement to terms and privacy policy"
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && <Ionicons name="checkmark" size={16} color="#fff" importantForAccessibility="no" accessible={false} />}
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodySmall" color="secondary">
                  I agree to the{' '}
                  <Typography variant="bodySmall" color="primary" style={styles.link}>
                    Terms & Conditions
                  </Typography>{' '}
                  and{' '}
                  <Typography variant="bodySmall" color="primary" style={styles.link}>
                    Privacy Policy
                  </Typography>
                </Typography>
              </View>
            </TouchableOpacity>
            {errors.terms && (
              <>
                <Typography variant="caption" color="error" style={styles.errorMargin}>
                  {errors.terms}
                </Typography>
                <Spacing size="sm" />
              </>
            )}

            <Spacing size="md" />

            {/* Register Button */}
            <Button
              variant="primary"
              size="large"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              fullWidth={true}
              accessibilityLabel="Create account"
              accessibilityHint="Register with your email and password"
            >
              Create Account
            </Button>

            <Spacing size="md" />

            {/* Sign In Link */}
            <View style={styles.signinContainer}>
              <Typography variant="bodySmall" color="secondary">
                Already have an account?{' '}
              </Typography>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                accessibilityLabel="Sign in"
                accessibilityRole="button"
                accessibilityHint="Go to login screen if you already have an account"
              >
                <Typography variant="bodySmall" color="primary" style={styles.signinLink}>
                  Sign In
                </Typography>
              </TouchableOpacity>
            </View>
          </Card>

          <Spacing size="xl" />
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#667eea',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
  },
  link: {
    fontWeight: '600',
  },
  errorMargin: {
    marginTop: 4,
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinLink: {
    fontWeight: '600',
  },
});

export default ModernRegisterScreen;
