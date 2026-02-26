import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import design system components
import {
  Button,
  Input,
  Typography,
  Spacing,
  LoadingSpinner,
  Card,
  AlertCard
} from '../components/ui';

type EditProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'EditProfile'>;
};

interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  avatar_url: string;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      const response = await axios.get('http://localhost:3000/api/settings/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setPhone(data.phone || '');
      setDateOfBirth(data.date_of_birth || '');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
    };

    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
      newErrors.phone = 'Invalid phone number format';
      isValid = false;
    }

    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      newErrors.dateOfBirth = 'Date format should be YYYY-MM-DD';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      await axios.put(
        'http://localhost:3000/api/settings/profile',
        {
          firstName,
          lastName,
          phone,
          dateOfBirth,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingAvatar(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // In production, you would upload to a cloud storage service
      // For now, we'll just send the URI
      await axios.post(
        'http://localhost:3000/api/settings/profile/avatar',
        { avatarUrl: uri },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Reload profile to get updated avatar
      await loadProfile();
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        size="large"
        text="Loading profile..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Edit profile form" accessibilityRole="scrollview">
        <LinearGradient
          colors={theme.gradients.primary.colors}
          start={theme.gradients.primary.start}
          end={theme.gradients.primary.end}
          style={styles.header}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}
            disabled={uploadingAvatar}
            accessibilityRole="button"
            accessibilityLabel={profile?.avatar_url ? "Change profile picture" : "Add profile picture"}
            accessibilityHint="Select a new photo from your device"
            accessibilityState={{ disabled: uploadingAvatar, busy: uploadingAvatar }}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} accessibilityIgnoresInvertColors accessible={false} importantForAccessibility="no" />
            ) : (
              <View style={styles.avatarPlaceholder} importantForAccessibility="no" accessible={false}>
                <Icon name="person" type="material" color="white" size={60} importantForAccessibility="no" accessible={false} />
              </View>
            )}

            <View style={styles.cameraIconContainer} importantForAccessibility="no" accessible={false}>
              {uploadingAvatar ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <Icon name="camera-alt" type="material" color="white" size={20} importantForAccessibility="no" accessible={false} />
              )}
            </View>
          </TouchableOpacity>

          <Typography variant="h1" color="inverse" align="center">Edit Profile</Typography>
          <Spacing size="xs" />
          <Typography variant="body" color="inverse" align="center" style={{ opacity: 0.9 }}>
            Update your personal information
          </Typography>
        </LinearGradient>

        <Card elevated={true} elevation="md" padding="lg" style={styles.formContainer}>
          <Input
            label="First Name"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setErrors({ ...errors, firstName: '' });
            }}
            leftIcon={<Icon name="person" type="material" size={24} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />}
            error={errors.firstName}
            required
            accessibilityLabel="First name"
            accessibilityHint="Enter your first name"
          />

          <Input
            label="Last Name"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setErrors({ ...errors, lastName: '' });
            }}
            leftIcon={<Icon name="person-outline" type="material" size={24} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />}
            error={errors.lastName}
            required
            accessibilityLabel="Last name"
            accessibilityHint="Enter your last name"
          />

          <Input
            label="Email"
            placeholder="Email"
            value={profile?.email || ''}
            editable={false}
            leftIcon={<Icon name="email" type="material" size={24} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />}
            helperText="Email cannot be changed"
            accessibilityLabel="Email address"
            accessibilityHint="Email address cannot be changed"
          />

          <Input
            label="Phone Number"
            placeholder="e.g., +1 234 567 8900"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setErrors({ ...errors, phone: '' });
            }}
            keyboardType="phone-pad"
            leftIcon={<Icon name="phone" type="material" size={24} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />}
            error={errors.phone}
            accessibilityLabel="Phone number"
            accessibilityHint="Enter your phone number"
          />

          <Input
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={(text) => {
              setDateOfBirth(text);
              setErrors({ ...errors, dateOfBirth: '' });
            }}
            leftIcon={<Icon name="cake" type="material" size={24} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />}
            error={errors.dateOfBirth}
            helperText="Format: YYYY-MM-DD"
            accessibilityLabel="Date of birth"
            accessibilityHint="Enter your date of birth in format year month day"
          />

          <Spacing size="lg" />

          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            accessibilityLabel="Save profile changes"
            accessibilityHint="Save your updated profile information"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>

          <Spacing size="sm" />

          <Button
            variant="secondary"
            size="large"
            fullWidth
            onPress={() => navigation.goBack()}
            disabled={saving}
            accessibilityLabel="Cancel editing"
            accessibilityHint="Discard changes and return to previous screen"
          >
            Cancel
          </Button>
        </Card>
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  formContainer: {
    margin: 20,
    marginTop: -30,
  },
});

export default EditProfileScreen;
