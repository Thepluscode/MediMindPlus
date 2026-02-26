import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, updateProfile } from '../store/slices/authSlice';
import { theme } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { authService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store/store';
import { ScreenProps } from '../types/navigation';
import {
  Button,
  Card,
  Input,
  Typography,
  Spacing,
  LoadingSpinner,
  SettingsItem,
} from '../components/ui';

type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  bloodType: string;
};

const ProfileScreen: React.FC<ScreenProps<'Profile'>> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    bloodType: '',
  });
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        height: user.healthProfile?.height?.toString() || '',
        weight: user.healthProfile?.weight?.toString() || '',
        bloodType: user.healthProfile?.bloodType || '',
      });
    }
  }, [user]);

  // Handle input changes
  const handleChange = <K extends keyof ProfileFormData>(
    name: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile picture update
  const handleUpdatePhoto = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please enable media library access to update your profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const { uri } = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Update profile picture in backend
        await authService.updateProfilePicture(`data:image/jpeg;base64,${base64}`);

        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  // Handle save profile
  const handleSaveProfile = async (): Promise<void> => {
    try {
      setIsSaving(true);
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        healthProfile: {
          height: parseFloat(formData.height) || 0,
          weight: parseFloat(formData.weight) || 0,
          bloodType: formData.bloodType,
        },
      };

      await dispatch(updateProfile(profileData)).unwrap();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    try {
      await dispatch(logoutUser()).unwrap();
      setIsLogoutVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // Render option buttons (for gender, blood type)
  const renderOptionButtons = (
    field: keyof ProfileFormData,
    options: string[]
  ) => (
    <View style={styles.optionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            formData[field] === option && styles.optionButtonSelected,
          ]}
          onPress={() => handleChange(field, option as any)}
          accessibilityRole="button"
          accessibilityLabel={option}
          accessibilityHint={`Select ${option} as your ${field}`}
          accessibilityState={{ selected: formData[field] === option }}
        >
          <Typography
            variant="bodySmall"
            color={formData[field] === option ? 'inverse' : 'primary'}
          >
            {option}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading profile..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        accessibilityLabel="Profile information"
        accessibilityRole="scrollview"
      >
        {/* Profile Header */}
        <Card elevated={true} elevation="md" padding="lg" style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                user.profilePicture
                  ? { uri: user.profilePicture }
                  : require('../../assets/default-avatar.png')
              }
              style={styles.avatar}
              accessibilityLabel="Profile picture"
              accessibilityRole="image"
            />
            {isEditing && (
              <TouchableOpacity
                style={styles.editPhotoButton}
                onPress={handleUpdatePhoto}
                accessibilityLabel="Change profile picture"
                accessibilityRole="button"
                accessibilityHint="Select a new photo from your library"
              >
                <Ionicons
                  name="camera"
                  size={20}
                  color="#ffffff"
                  importantForAccessibility="no"
                  accessible={false}
                />
              </TouchableOpacity>
            )}
          </View>

          <Spacing size="md" />

          <Typography variant="h2" color="primary" align="center">
            {user.name}
          </Typography>
          <Spacing size="xs" />
          <Typography variant="body" color="secondary" align="center">
            {user.email}
          </Typography>

          <Spacing size="lg" />

          {!isEditing ? (
            <Button
              variant="primary"
              size="medium"
              onPress={() => setIsEditing(true)}
              accessibilityLabel="Edit profile"
            >
              Edit Profile
            </Button>
          ) : (
            <View style={styles.actionButtons}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button
                  variant="secondary"
                  size="medium"
                  fullWidth={true}
                  onPress={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Button
                  variant="primary"
                  size="medium"
                  fullWidth={true}
                  onPress={handleSaveProfile}
                  loading={isSaving}
                  disabled={isSaving}
                >
                  Save Changes
                </Button>
              </View>
            </View>
          )}
        </Card>

        {/* Personal Information */}
        {isEditing ? (
          <>
            <Spacing size="md" />
            <Card elevated={true} elevation="sm" padding="lg">
              <Typography variant="h3" color="primary">
                Personal Information
              </Typography>
              <Spacing size="md" />

              <Input
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Enter your full name"
                required={true}
              />

              <Input
                label="Email"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="Enter your email"
                keyboardType="email-address"
                editable={false}
                required={true}
              />

              <Input
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />

              <Input
                label="Date of Birth"
                value={formData.dateOfBirth}
                onChangeText={(text) => handleChange('dateOfBirth', text)}
                placeholder="YYYY-MM-DD"
              />

              <View style={{ marginBottom: 16 }}>
                <Typography variant="bodySmall" color="secondary" style={{ marginBottom: 8 }}>
                  Gender
                </Typography>
                {renderOptionButtons('gender', [
                  'Male',
                  'Female',
                  'Other',
                  'Prefer not to say',
                ])}
              </View>
            </Card>

            <Spacing size="md" />
            <Card elevated={true} elevation="sm" padding="lg">
              <Typography variant="h3" color="primary">
                Health Information
              </Typography>
              <Spacing size="md" />

              <Input
                label="Height (cm)"
                value={formData.height}
                onChangeText={(text) => handleChange('height', text)}
                placeholder="Enter your height"
                keyboardType="numeric"
              />

              <Input
                label="Weight (kg)"
                value={formData.weight}
                onChangeText={(text) => handleChange('weight', text)}
                placeholder="Enter your weight"
                keyboardType="numeric"
              />

              <View style={{ marginBottom: 16 }}>
                <Typography variant="bodySmall" color="secondary" style={{ marginBottom: 8 }}>
                  Blood Type
                </Typography>
                {renderOptionButtons('bloodType', [
                  'A+',
                  'A-',
                  'B+',
                  'B-',
                  'AB+',
                  'AB-',
                  'O+',
                  'O-',
                ])}
              </View>
            </Card>
          </>
        ) : (
          <>
            {/* Health Information Navigation */}
            <Spacing size="md" />
            <Card elevation="sm" padding="none">
              <View style={styles.sectionHeader}>
                <Typography variant="overline" color="secondary">
                  Health Records
                </Typography>
              </View>
              <SettingsItem
                icon="medical-outline"
                title="Medical History"
                subtitle="Manage conditions, allergies & medications"
                rightElement="chevron"
                onPress={() => (navigation as any).navigate('MedicalHistory')}
              />
              <SettingsItem
                icon="fitness-outline"
                title="Lifestyle Assessment"
                subtitle="Track habits, exercise, sleep & stress"
                rightElement="chevron"
                onPress={() => (navigation as any).navigate('LifestyleAssessment')}
              />
            </Card>

            {/* AI Health Detection */}
            <Spacing size="md" />
            <Card elevation="sm" padding="none">
              <View style={styles.sectionHeader}>
                <Typography variant="overline" color="secondary">
                  AI Health Detection
                </Typography>
              </View>
              <SettingsItem
                icon="camera-outline"
                title="Camera Health Scan"
                subtitle="Scan skin, eyes, tongue for health insights"
                rightElement="chevron"
                onPress={() => (navigation as any).navigate('CameraHealth')}
              />
              <SettingsItem
                icon="bug-outline"
                title="Flu & Infection Detection"
                subtitle="AI-powered symptom analysis & diagnosis"
                rightElement="chevron"
                onPress={() => (navigation as any).navigate('FluInfectiousDiseaseDetection')}
              />
              <SettingsItem
                icon="ribbon-outline"
                title="Cancer Screening"
                subtitle="Early detection imaging & biomarker analysis"
                rightElement="chevron"
                onPress={() => (navigation as any).navigate('CancerDetectionSystem')}
              />
            </Card>

            {/* Provider Portal */}
            <Spacing size="md" />
            <Card elevation="sm" padding="none" style={styles.providerCard}>
              <View style={styles.sectionHeader}>
                <Typography variant="overline" color="primary">
                  For Healthcare Providers
                </Typography>
              </View>
              <SettingsItem
                icon="medkit-outline"
                title="Provider Portal"
                subtitle="Manage patients, appointments & prescriptions"
                rightElement="chevron"
                onPress={() => (navigation as any).navigate('ProviderDashboard')}
              />
            </Card>

            {/* Account Actions */}
            <Spacing size="md" />
            <Card elevation="sm" padding="none">
              <View style={styles.sectionHeader}>
                <Typography variant="overline" color="secondary">
                  Account
                </Typography>
              </View>
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
              <TouchableOpacity
                style={styles.logoutItem}
                onPress={() => setIsLogoutVisible(true)}
                accessibilityLabel="Logout"
                accessibilityRole="button"
                accessibilityHint="Sign out of your account"
              >
                <View style={styles.logoutItemContent}>
                  <Ionicons
                    name="log-out-outline"
                    size={24}
                    color="#f56565"
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Spacing size="md" horizontal />
                  <Typography variant="body" color="error">
                    Logout
                  </Typography>
                </View>
              </TouchableOpacity>
            </Card>
          </>
        )}

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
                    disabled={isLoading}
                    accessibilityLabel="Cancel"
                    accessibilityHint="Dismiss logout dialog and return to profile"
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
                    loading={isLoading}
                    disabled={isLoading}
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
  headerCard: {
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  providerCard: {
    backgroundColor: '#F0F4FF',
  },
  logoutItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  logoutItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
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

export default ProfileScreen;
