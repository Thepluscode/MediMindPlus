import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData
} from 'react-native';
import { Text, Input, Button, Icon } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { theme } from '../theme/theme';
import { RootState } from '../store/store';
import { ScreenProps } from '../types/navigation';

type LoginFormErrors = {
  email?: string;
  password?: string;
};

const LoginScreen: React.FC<ScreenProps<'Login'>> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  
  const dispatch = useDispatch();
  const { isLoading, error: authError } = useSelector((state: RootState) => state.auth);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      setErrors({});
    };
  }, []);

  // Handle form validation
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;
    
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Navigation is handled by the auth state change in App.tsx
    } catch (error) {
      // Error is already handled by the auth slice
      console.error('Login failed:', error);
    }
  };

  const handleSubmit = (): void => {
    handleLogin();
  };

  // Demo login for testing purposes
  const handleDemoLogin = (): void => {
    // Simulate successful authentication by dispatching a mock login
    const mockUser = {
      id: 'demo-user-123',
      email: 'demo@medimind.com',
      name: 'Demo User',
      firstName: 'Demo',
      lastName: 'User',
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Manually set authentication state
    dispatch({
      type: 'auth/loginUser/fulfilled',
      payload: {
        user: mockUser,
        token: 'demo-token-123',
        refreshToken: 'demo-refresh-token-123'
      }
    });
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
        <View style={styles.logoContainer}>
          <Icon
            name="favorite"
            size={80}
            color={theme.colors.primary}
          />
          <Text h3 style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.formContainer}>
          {authError && (
            <View style={styles.errorContainer}>
              <Icon name="error" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

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
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            errorMessage={errors.email}
            containerStyle={styles.inputContainer}
            inputContainerStyle={errors.email ? styles.inputError : {}}
            onSubmitEditing={handleSubmit}
            returnKeyType="next"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
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
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            errorMessage={errors.password}
            containerStyle={styles.inputContainer}
            inputContainerStyle={errors.password ? styles.inputError : {}}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            buttonStyle={styles.loginButton}
            titleStyle={styles.loginButtonText}
            containerStyle={styles.buttonContainer}
          />

          <Button
            title="🚀 Demo Login (Skip Auth)"
            onPress={handleDemoLogin}
            buttonStyle={[styles.loginButton, styles.demoButton]}
            titleStyle={styles.loginButtonText}
            containerStyle={styles.buttonContainer}
          />

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: theme.spacing.xs,
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
    flex: 1,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: theme.spacing.sm,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoButton: {
    backgroundColor: '#FF6B35',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  signupText: {
    color: theme.colors.textSecondary,
  },
  signupLink: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
