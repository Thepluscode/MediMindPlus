import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '../store/slices/authSlice';
import { ScreenProps } from '../types/navigation';
import { theme } from '../theme/theme';
import {
  Button,
  Card,
  Input,
  Typography,
  Spacing,
  AlertCard,
} from '../components/ui';

const ModernLoginScreen: React.FC<ScreenProps<'Login'>> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const dispatch = useDispatch();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Prevent duplicate submissions
    if (isLoading) return;

    // Clear previous errors
    setLoginError(null);

    // Validate form
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Navigation happens automatically via Redux state change
    } catch (error: any) {
      setLoginError(error?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={theme.gradients.primary.colors}
        style={styles.gradient}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Login form"
          accessibilityRole="scrollview"
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={styles.iconContainer}
              importantForAccessibility="no"
              accessible={false}
            >
              <Ionicons
                name="heart"
                size={50}
                color="#fff"
                importantForAccessibility="no"
                accessible={false}
              />
            </View>
            <Typography variant="h1" color="inverse" align="center">
              MediMind+
            </Typography>
            <Spacing size="xs" />
            <Typography variant="body" color="inverse" align="center">
              Your Health, Our Priority
            </Typography>
          </View>

          <Spacing size="xl" />

          {/* Login Card */}
          <Card elevated={true} elevation="lg" padding="lg">
            <Typography variant="h2" color="primary">
              Welcome Back
            </Typography>
            <Spacing size="xs" />
            <Typography variant="bodySmall" color="secondary">
              Sign in to continue your health journey
            </Typography>

            <Spacing size="lg" />

            {/* Login Error Alert */}
            {loginError && (
              <>
                <AlertCard
                  severity="critical"
                  title="Login Failed"
                  message={loginError}
                  onDismiss={() => setLoginError(null)}
                />
                <Spacing size="md" />
              </>
            )}

            {/* Email Input */}
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required={true}
              leftIcon={<Ionicons name="mail-outline" size={20} color="#667eea" importantForAccessibility="no" accessible={false} />}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email to sign in"
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              secureTextEntry={true}
              autoCapitalize="none"
              required={true}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#667eea" importantForAccessibility="no" accessible={false} />}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password to sign in"
            />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => {
                // TODO: Implement forgot password flow
              }}
              accessibilityLabel="Forgot password"
              accessibilityHint="Reset your password"
              accessibilityRole="button"
            >
              <Typography variant="bodySmall" color="primary">
                Forgot Password?
              </Typography>
            </TouchableOpacity>

            <Spacing size="md" />

            {/* Login Button */}
            <Button
              variant="primary"
              size="large"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              fullWidth={true}
              accessibilityLabel="Sign in"
              accessibilityHint="Sign in with your email and password"
            >
              Sign In
            </Button>

            <Spacing size="md" />

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Typography variant="bodySmall" color="secondary">
                Don't have an account?{' '}
              </Typography>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                accessibilityLabel="Sign up"
                accessibilityHint="Create a new account"
                accessibilityRole="button"
              >
                <Typography variant="bodySmall" color="primary" style={styles.signupLink}>
                  Sign Up
                </Typography>
              </TouchableOpacity>
            </View>
          </Card>

          <Spacing size="lg" />

          {/* Footer */}
          <Typography variant="caption" color="inverse" align="center">
            Powered by AI • Secure & HIPAA Compliant
          </Typography>

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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupLink: {
    fontWeight: '600',
  },
});

export default ModernLoginScreen;
