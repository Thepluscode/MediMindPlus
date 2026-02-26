import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type PrivacySettingsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PrivacySettings'>;
};

interface PrivacySettings {
  share_health_data: boolean;
  share_with_providers: boolean;
  marketing_emails: boolean;
  research_participation: boolean;
  data_retention_days: number;
}

const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      const response = await axios.get('http://localhost:3000/api/settings/privacy/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSettings(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof PrivacySettings) => {
    if (settings) {
      setSettings({ ...settings, [key]: !settings[key] });
      setHasChanges(true);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      await axios.put(
        'http://localhost:3000/api/settings/privacy/settings',
        settings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Success', 'Privacy settings updated successfully');
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      Alert.alert(
        'Export Data',
        'Your data export request has been received. You will receive an email with a download link within 24 hours.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                await axios.get('http://localhost:3000/api/settings/privacy/export', {
                  headers: { Authorization: `Bearer ${token}` },
                });
                Alert.alert('Success', 'Data export request submitted successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to export data');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleDeleteData = async () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your health data, appointments, and account information. This action cannot be undone. Are you sure you want to continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');

              if (!token) {
                Alert.alert('Error', 'Authentication required');
                return;
              }

              await axios.delete('http://localhost:3000/api/settings/privacy/data', {
                headers: { Authorization: `Bearer ${token}` },
              });

              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      AsyncStorage.clear();
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' as any }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading privacy settings..."
        color={theme.colors.primary}
      />
    );
  }

  if (!settings) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
        <Typography variant="body" color="secondary" style={styles.errorText}>
          Failed to load privacy settings
        </Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadPrivacySettings}
          accessibilityRole="button"
          accessibilityLabel="Try again to load privacy settings"
        >
          <Typography variant="body" weight="semibold" style={styles.retryButtonText}>
            Try Again
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.header}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" color="white" size={60} />
        </View>
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>
          Privacy Settings
        </Typography>
        <Typography variant="body" style={styles.headerSubtitle}>
          Control your data and privacy
        </Typography>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Card style={styles.hipaaCard}>
            <View style={styles.hipaaHeader}>
              <Ionicons name="shield-checkmark" color="#4CAF50" size={28} />
              <Typography variant="h3" weight="bold" style={styles.hipaaTitle}>
                HIPAA Protected
              </Typography>
            </View>
            <Typography variant="body" color="secondary" style={styles.hipaaText}>
              Your health information is protected under HIPAA regulations. We maintain the
              highest standards of data privacy and security.
            </Typography>
          </Card>

          <View style={styles.section}>
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
              Data Sharing Preferences
            </Typography>

            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingHeader}>
                    <Ionicons
                      name="share-social-outline"
                      size={24}
                      color={theme.colors.primary}
                      style={styles.settingIcon}
                    />
                    <Typography variant="body" weight="semibold" style={styles.settingLabel}>
                      Share Health Data
                    </Typography>
                  </View>
                  <Typography variant="body" color="secondary" style={styles.settingDescription}>
                    Allow sharing health data with authorized healthcare providers
                  </Typography>
                </View>
                <Switch
                  value={settings.share_health_data}
                  onValueChange={() => handleToggle('share_health_data')}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                />
              </View>
            </Card>

            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingHeader}>
                    <Ionicons
                      name="medical-outline"
                      size={24}
                      color={theme.colors.primary}
                      style={styles.settingIcon}
                    />
                    <Typography variant="body" weight="semibold" style={styles.settingLabel}>
                      Share With Providers
                    </Typography>
                  </View>
                  <Typography variant="body" color="secondary" style={styles.settingDescription}>
                    Allow your healthcare providers to access your medical records
                  </Typography>
                </View>
                <Switch
                  value={settings.share_with_providers}
                  onValueChange={() => handleToggle('share_with_providers')}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                />
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
              Communication Preferences
            </Typography>

            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingHeader}>
                    <Ionicons
                      name="mail-outline"
                      size={24}
                      color={theme.colors.primary}
                      style={styles.settingIcon}
                    />
                    <Typography variant="body" weight="semibold" style={styles.settingLabel}>
                      Marketing Emails
                    </Typography>
                  </View>
                  <Typography variant="body" color="secondary" style={styles.settingDescription}>
                    Receive emails about new features and health tips
                  </Typography>
                </View>
                <Switch
                  value={settings.marketing_emails}
                  onValueChange={() => handleToggle('marketing_emails')}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                />
              </View>
            </Card>

            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingHeader}>
                    <Ionicons
                      name="flask-outline"
                      size={24}
                      color={theme.colors.primary}
                      style={styles.settingIcon}
                    />
                    <Typography variant="body" weight="semibold" style={styles.settingLabel}>
                      Research Participation
                    </Typography>
                  </View>
                  <Typography variant="body" color="secondary" style={styles.settingDescription}>
                    Allow anonymized data to be used for medical research
                  </Typography>
                </View>
                <Switch
                  value={settings.research_participation}
                  onValueChange={() => handleToggle('research_participation')}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                />
              </View>
            </Card>
          </View>

          {hasChanges && (
            <Card style={styles.saveCard}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <Typography variant="body" weight="semibold" style={styles.saveText}>
                You have unsaved changes
              </Typography>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveSettings}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save privacy settings changes"
                accessibilityState={{ disabled: saving }}
              >
                {saving ? (
                  <LoadingSpinner color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="save-outline" color="white" size={20} style={{ marginRight: 10 }} />
                    <Typography variant="body" weight="bold" style={styles.saveButtonText}>
                      Save Changes
                    </Typography>
                  </>
                )}
              </TouchableOpacity>
            </Card>
          )}

          <View style={styles.section}>
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
              Data Management
            </Typography>

            <Card style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <Ionicons name="download-outline" size={28} color={theme.colors.primary} />
                <Typography variant="h3" weight="bold" style={styles.actionTitle}>
                  Export Your Data
                </Typography>
              </View>
              <Typography variant="body" color="secondary" style={styles.actionDescription}>
                Download a copy of all your health data, appointments, and account information
                in JSON format.
              </Typography>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExportData}
                accessibilityRole="button"
                accessibilityLabel="Request data export"
              >
                <Ionicons
                  name="cloud-download-outline"
                  color={theme.colors.primary}
                  size={20}
                  style={{ marginRight: 10 }}
                />
                <Typography variant="body" weight="semibold" style={styles.exportButtonTitle}>
                  Request Data Export
                </Typography>
              </TouchableOpacity>
            </Card>

            <Card style={styles.deleteCard}>
              <View style={styles.deleteHeader}>
                <Ionicons name="trash-bin" size={28} color="#F44336" />
                <Typography variant="h3" weight="bold" style={styles.deleteTitle}>
                  Delete All Data
                </Typography>
              </View>
              <Typography variant="body" color="secondary" style={styles.deleteDescription}>
                Permanently delete your account and all associated data. This action cannot be
                undone and you will need to create a new account to use our services again.
              </Typography>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteData}
                accessibilityRole="button"
                accessibilityLabel="Delete my account"
              >
                <Ionicons
                  name="warning"
                  color="white"
                  size={20}
                  style={{ marginRight: 10 }}
                />
                <Typography variant="body" weight="bold" style={styles.deleteButtonTitle}>
                  Delete My Account
                </Typography>
              </TouchableOpacity>
            </Card>
          </View>

          <Card style={styles.infoCard}>
            <Typography variant="h3" weight="bold" style={styles.infoTitle}>
              Need Help?
            </Typography>
            <View style={styles.infoDivider} />
            <Typography variant="body" color="secondary" style={styles.infoText}>
              If you have questions about your privacy settings or data management, please
              contact our privacy team.
            </Typography>
            <View style={styles.contactMethod}>
              <Ionicons name="mail" size={18} color={theme.colors.primary} />
              <Typography variant="body" weight="semibold" style={styles.contactText}>
                privacy@medimind.com
              </Typography>
            </View>
            <View style={styles.contactMethod}>
              <Ionicons name="call" size={18} color={theme.colors.primary} />
              <Typography variant="body" weight="semibold" style={styles.contactText}>
                1-800-MEDIMIND
              </Typography>
            </View>
          </Card>
        </View>
      </ScrollView>
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
  errorText: {
    marginTop: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.sm,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  hipaaCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xxl,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  hipaaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  hipaaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: theme.spacing.sm,
  },
  hipaaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  settingCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.lg,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  settingIcon: {
    marginRight: theme.spacing.sm,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  saveCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
    marginVertical: theme.spacing.sm,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  actionCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.sm,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  actionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonTitle: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    marginBottom: theme.spacing.sm,
  },
  deleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: theme.spacing.sm,
  },
  deleteDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonTitle: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#F3E5F5',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
});

export default PrivacySettingsScreen;
