import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { Text, Input, Button, Icon, CheckBox } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/slices/authSlice';
import { theme } from '../theme/theme';
import { RootState } from '../store/store';
import { ScreenProps } from '../types/navigation';

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

type RegisterFormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
};

const RegisterScreen: React.FC<ScreenProps<'Register'>> = ({ navigation }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const dispatch = useDispatch();
  const { isLoading, error: authError } = useSelector((state: RootState) => state.auth);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      setErrors({});
    };
  }, []);

  // Handle input changes
  const handleChange = <K extends keyof RegisterFormData>(
    name: K, 
    value: RegisterFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name as keyof RegisterFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle form validation
  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration
  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;
    
    try {
      const { confirmPassword, agreeToTerms, ...userData } = formData;
      await dispatch(registerUser(userData)).unwrap();
      // Navigation is handled by the auth state change in App.tsx
    } catch (error) {
      // Error is already handled by the auth slice
      console.error('Registration failed:', error);
    }
  };

  const showTermsAlert = (): void => {
    Alert.alert(
      'Terms and Conditions',
      'By creating an account, you agree to our Terms of Service and Privacy Policy. We may send you service-related notifications and updates.',
      [
        { 
          text: 'I Understand', 
          style: 'default' 
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text h2 style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in your details to get started</Text>
        </View>

        <View style={styles.formContainer}>
          {authError && (
            <View style={styles.errorContainer}>
              <Icon name="error" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            leftIcon={
              <Icon
                name="person"
                size={24}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
            }
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            errorMessage={errors.name}
            containerStyle={styles.inputContainer}
            inputContainerStyle={errors.name ? styles.inputError : {}}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Input
            label="Email Address"
            placeholder="Enter your email"
            leftIcon={
              <Icon
                name="email"
                size={24}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
            }
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            errorMessage={errors.email}
            containerStyle={styles.inputContainer}
            inputContainerStyle={errors.email ? styles.inputError : {}}
            returnKeyType="next"
          />

          <Input
            label="Password"
            placeholder="Create a password"
            leftIcon={
              <Icon
                name="lock"
                size={24}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
            }
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            }
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry={!showPassword}
            errorMessage={errors.password}
            containerStyle={styles.inputContainer}
            inputContainerStyle={errors.password ? styles.inputError : {}}
            returnKeyType="next"
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            leftIcon={
              <Icon
                name="lock-outline"
                size={24}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
            }
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            }
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            secureTextEntry={!showConfirmPassword}
            errorMessage={errors.confirmPassword}
            containerStyle={styles.inputContainer}
            inputContainerStyle={errors.confirmPassword ? styles.inputError : {}}
            onSubmitEditing={handleRegister}
            returnKeyType="done"
          />

          <View style={styles.termsContainer}>
            <CheckBox
              checked={formData.agreeToTerms}
              onPress={() => handleChange('agreeToTerms', !formData.agreeToTerms)}
              containerStyle={styles.checkboxContainer}
              checkedIcon="check-square"
              uncheckedIcon="square"
              checkedColor={theme.colors.primary}
              uncheckedColor={theme.colors.border}
            />
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={showTermsAlert}>
                Terms & Conditions
              </Text>
            </Text>
          </View>
          {errors.agreeToTerms && (
            <Text style={styles.errorText}>{errors.agreeToTerms}</Text>
          )}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            buttonStyle={styles.registerButton}
            titleStyle={styles.registerButtonText}
            containerStyle={styles.buttonContainer}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
    fontSize: 12,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    marginRight: -10,
  },
  termsText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: theme.spacing.sm,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  loginText: {
    color: theme.colors.textSecondary,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
