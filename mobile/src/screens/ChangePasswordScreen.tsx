import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner } from '../components/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type ChangePasswordScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ChangePassword'>;
};

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getPasswordStrength = (password: string): { strength: string; color: string; width: string } => {
    if (password.length === 0) {
      return { strength: '', color: '#E0E0E0', width: '0%' };
    }

    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      return { strength: 'Weak', color: '#F44336', width: '33%' };
    } else if (strength <= 3) {
      return { strength: 'Medium', color: '#FF9800', width: '66%' };
    } else {
      return { strength: 'Strong', color: '#4CAF50', width: '100%' };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const validateForm = (): boolean => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    let isValid = true;

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      await axios.post(
        'http://localhost:3000/api/settings/password/change',
        {
          currentPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Success', 'Password changed successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={theme.gradients.primary.colors}
          start={theme.gradients.primary.start}
          end={theme.gradients.primary.end}
          style={styles.header}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" color="white" size={60} />
          </View>
          <Typography variant="h2" weight="bold" style={styles.headerTitle}>
            Change Password
          </Typography>
          <Typography variant="body" style={styles.headerSubtitle}>
            Update your account security
          </Typography>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.securityTip}>
            <Ionicons
              name="information-circle"
              color={theme.colors.primary}
              size={20}
              style={{ marginRight: 10 }}
            />
            <Typography variant="body" style={styles.securityTipText}>
              Use a strong password with letters, numbers, and symbols
            </Typography>
          </View>

          <View style={styles.inputContainer}>
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>
              Current Password
            </Typography>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setErrors({ ...errors, currentPassword: '' });
                }}
                secureTextEntry={!showCurrentPassword}
                placeholderTextColor={theme.colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                accessibilityRole="button"
                accessibilityLabel={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword ? (
              <View accessibilityLiveRegion="polite">
                <Typography variant="caption" style={styles.errorText}>{errors.currentPassword}</Typography>
              </View>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>
              New Password
            </Typography>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={24} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrors({ ...errors, newPassword: '' });
                }}
                secureTextEntry={!showNewPassword}
                placeholderTextColor={theme.colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                accessibilityRole="button"
                accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <View accessibilityLiveRegion="polite">
                <Typography variant="caption" style={styles.errorText}>{errors.newPassword}</Typography>
              </View>
            ) : null}
          </View>

          {newPassword.length > 0 && (
            <View style={styles.strengthContainer} accessibilityLiveRegion="polite" accessibilityLabel={`Password strength: ${passwordStrength.strength}`}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthBarFill,
                    {
                      backgroundColor: passwordStrength.color,
                      width: passwordStrength.width,
                    },
                  ]}
                />
              </View>
              <Typography variant="caption" weight="semibold" style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.strength}
              </Typography>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>
              Confirm New Password
            </Typography>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors({ ...errors, confirmPassword: '' });
                }}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor={theme.colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <View accessibilityLiveRegion="polite">
                <Typography variant="caption" style={styles.errorText}>{errors.confirmPassword}</Typography>
              </View>
            ) : null}
          </View>

          <View style={styles.passwordRequirements}>
            <Typography variant="body" weight="semibold" style={styles.requirementsTitle}>
              Password Requirements:
            </Typography>
            <View style={styles.requirementRow}>
              <Ionicons
                name={newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={newPassword.length >= 8 ? theme.colors.success : theme.colors.textSecondary}
              />
              <Typography variant="body" style={styles.requirementText}>
                At least 8 characters
              </Typography>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Typography variant="body" style={styles.requirementText}>
                Upper and lowercase letters
              </Typography>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name={/\d/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={/\d/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Typography variant="body" style={styles.requirementText}>
                At least one number
              </Typography>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name={/[^a-zA-Z0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={/[^a-zA-Z0-9]/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Typography variant="body" style={styles.requirementText}>
                At least one special character
              </Typography>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.changeButton, loading && styles.changeButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Change password"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 10 }} />
                  <Typography variant="body" weight="bold" style={styles.changeButtonText}>
                    Change Password
                  </Typography>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.cancelButtonDisabled]}
              onPress={() => navigation.goBack()}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Cancel and go back"
              accessibilityState={{ disabled: loading }}
            >
              <Typography variant="body" weight="semibold" style={styles.cancelButtonText}>
                Cancel
              </Typography>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    padding: 20,
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  securityTipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    marginLeft: 10,
  },
  strengthContainer: {
    marginTop: -10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  passwordRequirements: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  changeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  changeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cancelButton: {
    borderColor: theme.colors.textSecondary,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
});

export default ChangePasswordScreen;
