import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { 
  Avatar, 
  Text, 
  ListItem, 
  Icon, 
  Button, 
  Divider, 
  Overlay,
  Input
} from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, updateProfile } from '../store/slices/authSlice';
import { theme } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { authService } from '../services/authService';
import { RootState } from '../store/store';
import { ScreenProps } from '../types/navigation';
import { UserProfile, HealthProfile } from '../types/models/user';

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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile picture update
  const handleUpdatePhoto = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable media library access to update your profile picture.');
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
      console.error('Error updating profile picture:', error);
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
      console.error('Error updating profile:', error);
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
      console.error('Logout failed:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Render form field
  const renderFormField = (
    label: string, 
    field: keyof ProfileFormData, 
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    options?: string[]
  ) => {
    if (!isEditing) {
      return (
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title style={styles.label}>{label}</ListItem.Title>
            <ListItem.Subtitle style={styles.value}>
              {formData[field] || 'Not set'}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      );
    }

    if (options) {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{label}</Text>
          <View style={styles.optionsContainer}>
            {options.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  formData[field] === option && styles.optionButtonSelected,
                ]}
                onPress={() => handleChange(field, option as any)}
              >
                <Text 
                  style={[
                    styles.optionText,
                    formData[field] === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Input
          value={formData[field]}
          onChangeText={(text) => handleChange(field, text as any)}
          keyboardType={keyboardType}
          inputContainerStyle={styles.input}
          containerStyle={{ paddingHorizontal: 0 }}
        />
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar
              rounded
              size="xlarge"
              source={user.profilePicture ? { uri: user.profilePicture } : require('../../assets/default-avatar.png')}
              containerStyle={styles.avatar}
            />
            {isEditing && (
              <TouchableOpacity 
                style={styles.editPhotoButton}
                onPress={handleUpdatePhoto}
              >
                <Icon name="camera-alt" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          <Text h4 style={styles.name}>
            {user.name}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          
          {!isEditing ? (
            <Button
              title="Edit Profile"
              onPress={() => setIsEditing(true)}
              buttonStyle={styles.editButton}
              titleStyle={styles.editButtonText}
              containerStyle={styles.buttonContainer}
            />
          ) : (
            <View style={styles.actionButtons}>
              <Button
                title="Cancel"
                onPress={() => setIsEditing(false)}
                type="outline"
                buttonStyle={styles.cancelButton}
                titleStyle={styles.cancelButtonText}
                containerStyle={[styles.buttonContainer, { marginRight: 10 }]}
                disabled={isSaving}
              />
              <Button
                title={isSaving ? 'Saving...' : 'Save Changes'}
                onPress={handleSaveProfile}
                loading={isSaving}
                disabled={isSaving}
                buttonStyle={styles.saveButton}
                titleStyle={styles.saveButtonText}
                containerStyle={styles.buttonContainer}
              />
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderFormField('Full Name', 'name')}
          {renderFormField('Email', 'email', 'email-address')}
          {renderFormField('Phone', 'phone', 'numeric')}
          {renderFormField('Date of Birth', 'dateOfBirth')}
          {renderFormField('Gender', 'gender', 'default', ['Male', 'Female', 'Other', 'Prefer not to say'])}
        </View>

        <Divider style={styles.divider} />

        {/* Health Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Information</Text>
          {renderFormField('Height (cm)', 'height', 'numeric')}
          {renderFormField('Weight (kg)', 'weight', 'numeric')}
          {renderFormField('Blood Type', 'bloodType', 'default', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])}
        </View>

        <Divider style={styles.divider} />

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ListItem bottomDivider onPress={() => navigation.navigate('ChangePassword')}>
            <Icon name="lock" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title>Change Password</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem bottomDivider onPress={() => navigation.navigate('PrivacySettings')}>
            <Icon name="privacy-tip" type="material" color={theme.colors.primary} />
            <ListItem.Content>
              <ListItem.Title>Privacy Settings</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem onPress={() => setIsLogoutVisible(true)}>
            <Icon name="logout" type="material" color={theme.colors.error} />
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.colors.error }}>Logout</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </View>
      </ScrollView>

      {/* Logout Confirmation */}
      <Overlay
        isVisible={isLogoutVisible}
        onBackdropPress={() => setIsLogoutVisible(false)}
        overlayStyle={styles.overlay}
      >
        <View style={styles.overlayContent}>
          <Text style={styles.overlayTitle}>Logout</Text>
          <Text style={styles.overlayMessage}>Are you sure you want to logout?</Text>
          <View style={styles.overlayButtons}>
            <Button
              title="Cancel"
              onPress={() => setIsLogoutVisible(false)}
              type="outline"
              buttonStyle={styles.overlayButton}
              titleStyle={styles.overlayButtonText}
              containerStyle={[styles.overlayButtonContainer, { marginRight: 10 }]}
              disabled={isLoading}
            />
            <Button
              title="Logout"
              onPress={handleLogout}
              loading={isLoading}
              disabled={isLoading}
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
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'white',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  email: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  buttonContainer: {
    width: 150,
    marginTop: theme.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderColor: theme.colors.error,
    borderWidth: 1,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  cancelButtonText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  section: {
    backgroundColor: 'white',
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  value: {
    color: theme.colors.text,
    fontSize: 16,
    marginTop: 2,
  },
  inputContainer: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    height: 40,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: 'white',
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    color: theme.colors.text,
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  overlay: {
    width: '85%',
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  overlayContent: {
    width: '100%',
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  overlayMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  overlayButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  overlayButtonContainer: {
    flex: 1,
  },
  overlayButton: {
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  overlayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
