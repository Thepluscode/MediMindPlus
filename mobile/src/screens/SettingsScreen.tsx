import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateSettings } from '../store/slices/settingsSlice';
import { theme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store/store';
import { RootStackParamList, TabParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import {
  Typography,
  Spacing,
  LoadingSpinner,
  SettingsItem,
  Button,
  Card,
} from '../components/ui';

type AppSettings = {
  notifications: boolean;
  biometrics: boolean;
  darkMode: boolean;
  autoSync: boolean;
  dataSaver: boolean;
  language: string;
};

type SettingsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Settings'>,
  StackNavigationProp<RootStackParamList>
>;

type SettingsScreenProps = {
  navigation: SettingsNavigationProp;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { settings } = useSelector((state: RootState) => state.settings);
  const [localSettings, setLocalSettings] = useState<AppSettings>({
    notifications: true,
    biometrics: false,
    darkMode: false,
    autoSync: true,
    dataSaver: false,
    language: 'en',
  });
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // Load settings when component mounts
  useEffect(() => {
    const initializeSettings = async () => {
      await loadSettings();
      await checkBiometricAvailability();
      setIsLoading(false);
    };

    initializeSettings();
  }, []);

  // Update local settings when Redux settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings((prev) => ({
        ...prev,
        ...settings,
      }));
    }
  }, [settings]);

  // Check if biometric authentication is available
  const checkBiometricAvailability = async (): Promise<void> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled);
    } catch (error) {
      setIsBiometricAvailable(false);
    }
  };

  // Load settings from AsyncStorage
  const loadSettings = async (): Promise<void> => {
    try {
      let savedSettings: string | null;

      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        savedSettings = (globalThis as any).localStorage.getItem('appSettings');
      } else {
        // Use AsyncStorage on mobile
        savedSettings = await AsyncStorage.getItem('appSettings');
      }

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as Partial<AppSettings>;
        setLocalSettings((prev) => ({
          ...prev,
          ...parsedSettings,
        }));
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // Save settings to AsyncStorage and Redux
  const saveSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...localSettings, ...newSettings };

      // Use localStorage on web to avoid blocking
      if (typeof (globalThis as any).window !== 'undefined') {
        (globalThis as any).localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      } else {
        // Use AsyncStorage on mobile
        await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      }

      dispatch(updateSettings(updatedSettings));
    } catch (error) {
      // Error handled silently
    }
  };

  // Handle setting toggle
  const handleToggle = async (setting: keyof AppSettings): Promise<void> => {
    const newValue = !localSettings[setting];

    // Special handling for notifications
    if (setting === 'notifications') {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive alerts.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
    }

    // Special handling for biometrics
    if (setting === 'biometrics' && !localSettings.biometrics) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
        });

        if (!result.success) {
          Alert.alert(
            'Authentication Failed',
            'Could not verify your identity. Please try again.',
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        Alert.alert(
          'Error',
          'An error occurred during biometric authentication. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Update the setting
    const updatedSettings = { ...localSettings, [setting]: newValue };
    setLocalSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    try {
      // This would be handled by your auth slice
      // await dispatch(logoutUser()).unwrap();
      setIsLogoutVisible(false);
      // Navigation would be handled by the auth state change
    } catch (error) {
      // Error handled silently
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading settings..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.header}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <View
          style={styles.iconContainer}
          importantForAccessibility="no"
          accessible={false}
        >
          <Ionicons
            name="settings"
            size={60}
            color="#ffffff"
            importantForAccessibility="no"
            accessible={false}
          />
        </View>
        <Typography variant="h1" color="inverse">
          Settings
        </Typography>
        <Spacing size="xs" />
        <Typography variant="body" color="inverse">
          Manage your preferences
        </Typography>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        accessibilityLabel="Settings options"
        accessibilityRole="scrollview"
      >
        {/* Account Section */}
        <Spacing size="md" />
        <Card elevation="sm" padding="none">
          <View style={styles.sectionHeader}>
            <Typography variant="overline" color="secondary">
              Account
            </Typography>
          </View>
          <SettingsItem
            icon="person-outline"
            title="Edit Profile"
            rightElement="chevron"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingsItem
            icon="lock-closed-outline"
            title="Change Password"
            rightElement="chevron"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsItem
            icon="shield-outline"
            title="Privacy Settings"
            rightElement="chevron"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
        </Card>

        {/* Notifications Section */}
        <Spacing size="md" />
        <Card elevation="sm" padding="none">
          <View style={styles.sectionHeader}>
            <Typography variant="overline" color="secondary">
              Notifications
            </Typography>
          </View>
          <SettingsItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive alerts and updates"
            rightElement="switch"
            switchValue={localSettings.notifications}
            onSwitchChange={() => handleToggle('notifications')}
          />
          {isBiometricAvailable && (
            <SettingsItem
              icon="finger-print"
              title="Biometric Authentication"
              subtitle="Use fingerprint or face ID to log in"
              rightElement="switch"
              switchValue={localSettings.biometrics}
              onSwitchChange={() => handleToggle('biometrics')}
            />
          )}
        </Card>

        {/* Display Section */}
        <Spacing size="md" />
        <Card elevation="sm" padding="none">
          <View style={styles.sectionHeader}>
            <Typography variant="overline" color="secondary">
              Display
            </Typography>
          </View>
          <SettingsItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Switch between light and dark theme"
            rightElement="switch"
            switchValue={localSettings.darkMode}
            onSwitchChange={() => handleToggle('darkMode')}
          />
          <SettingsItem
            icon="language-outline"
            title="Language"
            subtitle={localSettings.language === 'en' ? 'English' : 'Español'}
            rightElement="chevron"
            onPress={() => {
              // TODO: Implement language selection
            }}
          />
        </Card>

        {/* Data Section */}
        <Spacing size="md" />
        <Card elevation="sm" padding="none">
          <View style={styles.sectionHeader}>
            <Typography variant="overline" color="secondary">
              Data
            </Typography>
          </View>
          <SettingsItem
            icon="sync-outline"
            title="Auto Sync"
            subtitle="Automatically sync data when online"
            rightElement="switch"
            switchValue={localSettings.autoSync}
            onSwitchChange={() => handleToggle('autoSync')}
          />
          <SettingsItem
            icon="cellular-outline"
            title="Data Saver"
            subtitle="Reduce data usage"
            rightElement="switch"
            switchValue={localSettings.dataSaver}
            onSwitchChange={() => handleToggle('dataSaver')}
          />
          <SettingsItem
            icon="trash-outline"
            title="Clear Cache"
            subtitle="Free up storage space"
            rightElement="chevron"
            onPress={() => navigation.navigate('ClearCache')}
          />
        </Card>

        {/* About Section */}
        <Spacing size="md" />
        <Card elevation="sm" padding="none">
          <View style={styles.sectionHeader}>
            <Typography variant="overline" color="secondary">
              About
            </Typography>
          </View>
          <SettingsItem
            icon="help-circle-outline"
            title="Help Center"
            rightElement="chevron"
            onPress={() => navigation.navigate('HelpCenter')}
          />
          <SettingsItem
            icon="mail-outline"
            title="Contact Us"
            rightElement="chevron"
            onPress={() => navigation.navigate('ContactUs')}
          />
          <SettingsItem
            icon="document-text-outline"
            title="Terms of Service"
            rightElement="chevron"
            onPress={() => navigation.navigate('TermsOfService')}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            rightElement="chevron"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </Card>

        {/* App Version */}
        <Spacing size="lg" />
        <View style={styles.versionContainer}>
          <Typography variant="bodySmall" color="tertiary" align="center">
            MediMind v1.0.0
          </Typography>
          <Spacing size="xs" />
          <Typography variant="caption" color="tertiary" align="center">
            © 2023 MediMind. All rights reserved.
          </Typography>
        </View>

        {/* Logout Button */}
        <Spacing size="lg" />
        <View style={styles.logoutContainer}>
          <Button
            variant="secondary"
            size="large"
            fullWidth={true}
            onPress={() => setIsLogoutVisible(true)}
            accessibilityLabel="Logout"
          >
            Logout
          </Button>
        </View>

        <Spacing size="xl" />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutVisible(false)}
        accessibilityLabel="Logout confirmation dialog"
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsLogoutVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          accessibilityHint="Dismiss logout confirmation"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            accessible={false}
          >
            <Card elevated={true} elevation="lg" padding="lg" style={styles.modalCard}>
              <View
                style={styles.modalIcon}
                importantForAccessibility="no"
                accessible={false}
              >
                <Ionicons
                  name="log-out-outline"
                  size={48}
                  color="#f56565"
                  importantForAccessibility="no"
                  accessible={false}
                />
              </View>
              <Spacing size="md" />
              <Typography variant="h3" color="primary" align="center">
                Logout
              </Typography>
              <Spacing size="sm" />
              <Typography variant="body" color="secondary" align="center">
                Are you sure you want to logout?
              </Typography>
              <Spacing size="lg" />
              <View style={styles.modalButtons}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Button
                    variant="secondary"
                    size="medium"
                    fullWidth={true}
                    onPress={() => setIsLogoutVisible(false)}
                    accessibilityLabel="Cancel"
                    accessibilityHint="Dismiss logout dialog and return to settings"
                  >
                    Cancel
                  </Button>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Button
                    variant="primary"
                    size="medium"
                    fullWidth={true}
                    onPress={handleLogout}
                    accessibilityLabel="Confirm logout"
                    accessibilityHint="Sign out of your account"
                  >
                    Logout
                  </Button>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  versionContainer: {
    alignItems: 'center',
  },
  logoutContainer: {
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
  },
  modalIcon: {
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default SettingsScreen;
