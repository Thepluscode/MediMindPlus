import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { 
  Text, 
  ListItem, 
  Icon, 
  Button, 
  Divider,
  Overlay 
} from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { updateSettings } from '../store/slices/settingsSlice';
import { theme } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import { RootState } from '../store/store';
import { ScreenProps } from '../types/navigation';

type AppSettings = {
  notifications: boolean;
  biometrics: boolean;
  darkMode: boolean;
  autoSync: boolean;
  dataSaver: boolean;
  language: string;
};

const SettingsScreen: React.FC<ScreenProps<'Settings'>> = ({ navigation }) => {
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
      setLocalSettings(prev => ({
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
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    }
  };

  // Load settings from AsyncStorage
  const loadSettings = async (): Promise<void> => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as Partial<AppSettings>;
        setLocalSettings(prev => ({
          ...prev,
          ...parsedSettings,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to AsyncStorage and Redux
  const saveSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...localSettings, ...newSettings };
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      dispatch(updateSettings(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
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
        console.error('Biometric authentication error:', error);
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

  // Handle language change
  const handleLanguageChange = async (language: string): Promise<void> => {
    const updatedSettings = { ...localSettings, language };
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
      console.error('Logout failed:', error);
    }
  };

  // Render a settings item with toggle
  const renderToggleItem = (title: string, description: string, setting: keyof AppSettings) => (
    <ListItem bottomDivider>
      <Icon name={getIconForSetting(setting)} type="material" color={theme.colors.primary} />
      <ListItem.Content>
        <ListItem.Title style={styles.settingTitle}>{title}</ListItem.Title>
        <ListItem.Subtitle style={styles.settingSubtitle}>{description}</ListItem.Subtitle>
      </ListItem.Content>
      <Switch
        value={localSettings[setting] as boolean}
        onValueChange={() => handleToggle(setting)}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor="white"
      />
    </ListItem>
  );

  // Get icon for setting
  const getIconForSetting = (setting: string): string => {
    switch (setting) {
      case 'notifications':
        return 'notifications';
      case 'biometrics':
        return 'fingerprint';
      case 'darkMode':
        return 'brightness-4';
      case 'autoSync':
        return 'sync';
      case 'dataSaver':
        return 'data-saver-off';
      case 'language':
        return 'language';
      default:
        return 'settings';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ListItem bottomDivider onPress={() => navigation.navigate('EditProfile')}>
            <Icon name="person" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Edit Profile</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem bottomDivider onPress={() => navigation.navigate('ChangePassword')}>
            <Icon name="lock" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Change Password</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem onPress={() => navigation.navigate('PrivacySettings')}>
            <Icon name="privacy-tip" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Privacy Settings</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>

        <Divider style={styles.divider} />

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderToggleItem(
            'Push Notifications',
            'Receive alerts and updates',
            'notifications'
          )}
          {isBiometricAvailable && renderToggleItem(
            'Biometric Authentication',
            'Use fingerprint or face ID to log in',
            'biometrics'
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          {renderToggleItem(
            'Dark Mode',
            'Switch between light and dark theme',
            'darkMode'
          )}
          <ListItem bottomDivider>
            <Icon name="language" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Language</ListItem.Title>
              <ListItem.Subtitle style={styles.settingSubtitle}>
                {localSettings.language === 'en' ? 'English' : 'Español'}
              </ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>

        <Divider style={styles.divider} />

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          {renderToggleItem(
            'Auto Sync',
            'Automatically sync data when online',
            'autoSync'
          )}
          {renderToggleItem(
            'Data Saver',
            'Reduce data usage',
            'dataSaver'
          )}
          <ListItem bottomDivider onPress={() => navigation.navigate('ClearCache')}>
            <Icon name="cached" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Clear Cache</ListItem.Title>
              <ListItem.Subtitle style={styles.settingSubtitle}>Free up storage space</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>

        <Divider style={styles.divider} />

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <ListItem bottomDivider onPress={() => navigation.navigate('HelpCenter')}>
            <Icon name="help" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Help Center</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem bottomDivider onPress={() => navigation.navigate('ContactUs')}>
            <Icon name="email" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Contact Us</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem bottomDivider onPress={() => navigation.navigate('TermsOfService')}>
            <Icon name="description" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Terms of Service</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Icon name="privacy-tip" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title style={styles.settingTitle}>Privacy Policy</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>

        <Divider style={styles.divider} />

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>MediMind v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2023 MediMind. All rights reserved.</Text>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Logout"
            onPress={() => setIsLogoutVisible(true)}
            buttonStyle={styles.logoutButton}
            titleStyle={styles.logoutButtonText}
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation */}
      <Overlay
        isVisible={isLogoutVisible}
        onBackdropPress={() => setIsLogoutVisible(false)}
        overlayStyle={styles.overlay}
      >
        <View style={styles.overlayContent}>
          <Icon
            name="logout"
            type="material"
            color={theme.colors.error}
            size={40}
            containerStyle={styles.overlayIcon}
          />
          <Text style={styles.overlayTitle}>Logout</Text>
          <Text style={styles.overlayMessage}>
            Are you sure you want to logout?
          </Text>
          <View style={styles.overlayButtons}>
            <Button
              title="Cancel"
              onPress={() => setIsLogoutVisible(false)}
              type="outline"
              buttonStyle={styles.overlayButton}
              titleStyle={styles.overlayButtonText}
              containerStyle={[styles.overlayButtonContainer, { marginRight: 10 }]}
            />
            <Button
              title="Logout"
              onPress={handleLogout}
              loading={isLoading}
              buttonStyle={[styles.overlayButton, { backgroundColor: theme.colors.error }]}
              titleStyle={styles.overlayButtonText}
              containerStyle={styles.overlayButtonContainer}
            />
          </View>
        </View>
      </Overlay>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    padding: 16,
    paddingBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    color: theme.colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 8,
    backgroundColor: theme.colors.background,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  versionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  logoutContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    paddingVertical: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
  },
  overlayContent: {
    width: '100%',
    alignItems: 'center',
  },
  overlayIcon: {
    marginBottom: 16,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  overlayMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  overlayButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  overlayButtonContainer: {
    flex: 1,
  },
  overlayButton: {
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  overlayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
