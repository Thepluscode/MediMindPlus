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

type ContactUsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ContactUs'>;
};

interface SubjectCategory {
  id: string;
  label: string;
  icon: string;
}

const SUBJECT_CATEGORIES: SubjectCategory[] = [
  { id: 'general', label: 'General Inquiry', icon: 'help-circle-outline' },
  { id: 'technical', label: 'Technical Support', icon: 'construct-outline' },
  { id: 'account', label: 'Account Issue', icon: 'person-outline' },
  { id: 'billing', label: 'Billing Question', icon: 'card-outline' },
  { id: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const ContactUsScreen: React.FC<ContactUsScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectCategory | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      email: '',
      subject: '',
      message: '',
    };

    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    if (!selectedSubject) {
      newErrors.subject = 'Please select a subject';
      isValid = false;
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
      isValid = false;
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      await axios.post(
        'http://localhost:3000/api/settings/contact',
        {
          name: name.trim(),
          email: email.trim(),
          subject: selectedSubject!.label,
          message: message.trim(),
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      Alert.alert(
        'Message Sent',
        'Thank you for contacting us. We will get back to you within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Contact form" accessibilityRole="scrollview">
        <LinearGradient
          colors={theme.gradients.primary.colors}
          start={theme.gradients.primary.start}
          end={theme.gradients.primary.end}
          style={styles.header}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" color="white" size={60} importantForAccessibility="no" accessible={false} />
          </View>
          <Typography variant="h2" weight="bold" style={styles.headerTitle}>
            Contact Us
          </Typography>
          <Typography variant="body" style={styles.headerSubtitle}>
            We're here to help you
          </Typography>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" color={theme.colors.primary} size={20} style={{ marginRight: 10 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="body" weight="semibold" style={styles.infoText}>
              Response time: 24-48 hours
            </Typography>
          </View>

          <View style={styles.inputContainer}>
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>
              Your Name
            </Typography>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={24} color={theme.colors.textSecondary} style={styles.inputIcon} importantForAccessibility="no" accessible={false} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrors({ ...errors, name: '' });
                }}
                placeholderTextColor={theme.colors.textSecondary}
                accessibilityLabel="Your name"
              />
            </View>
            {errors.name ? (
              <Typography variant="caption" style={styles.errorText}>{errors.name}</Typography>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>
              Email Address
            </Typography>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={24} color={theme.colors.textSecondary} style={styles.inputIcon} importantForAccessibility="no" accessible={false} />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: '' });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.colors.textSecondary}
                accessibilityLabel="Email address"
              />
            </View>
            {errors.email ? (
              <Typography variant="caption" style={styles.errorText}>{errors.email}</Typography>
            ) : null}
          </View>

          <View style={styles.subjectContainer}>
            <Typography variant="body" weight="semibold" style={styles.subjectLabel}>
              Subject Category
            </Typography>
            <View style={styles.categoryGrid}>
              {SUBJECT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedSubject?.id === category.id && styles.categoryCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedSubject(category);
                    setErrors({ ...errors, subject: '' });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${category.label}`}
                  accessibilityHint={selectedSubject?.id === category.id ? 'Currently selected' : `Tap to select ${category.label} as your subject category`}
                  accessibilityState={{ selected: selectedSubject?.id === category.id }}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={28}
                    color={
                      selectedSubject?.id === category.id
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Typography
                    variant="caption"
                    weight={selectedSubject?.id === category.id ? 'semibold' : 'medium'}
                    style={[
                      styles.categoryText,
                      selectedSubject?.id === category.id && styles.categoryTextSelected,
                    ]}
                  >
                    {category.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
            {errors.subject ? (
              <Typography variant="caption" style={styles.errorText}>{errors.subject}</Typography>
            ) : null}
          </View>

          <View style={styles.messageContainer}>
            <Typography variant="body" weight="semibold" style={styles.messageLabel}>
              Message
            </Typography>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textAreaText}
                placeholder="Describe your issue or question in detail..."
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  setErrors({ ...errors, message: '' });
                }}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor={theme.colors.textSecondary}
                accessibilityLabel="Message"
              />
              <View style={styles.characterCount}>
                <Typography variant="caption" color="secondary" style={styles.characterCountText}>
                  {message.length} characters
                </Typography>
              </View>
            </View>
            {errors.message ? (
              <Typography variant="caption" style={styles.errorText}>{errors.message}</Typography>
            ) : null}
          </View>

          <View style={styles.contactMethods}>
            <Typography variant="body" weight="semibold" style={styles.contactMethodsTitle}>
              Other Ways to Reach Us
            </Typography>
            <View style={styles.contactMethod}>
              <Ionicons name="call-outline" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.contactMethodText}>
                1-800-MEDIMIND
              </Typography>
            </View>
            <View style={styles.contactMethod}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.contactMethodText}>
                support@medimind.com
              </Typography>
            </View>
            <View style={styles.contactMethod}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.contactMethodText}>
                Mon-Fri: 9AM - 5PM EST
              </Typography>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Send message to support"
              accessibilityHint="Submit your contact form to our support team"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="white" style={{ marginRight: 10 }} importantForAccessibility="no" accessible={false} />
                  <Typography variant="body" weight="bold" style={styles.sendButtonText}>
                    Send Message
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
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
    borderColor: '#E0E0E0',
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
  subjectContainer: {
    marginBottom: 20,
  },
  subjectLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryCard: {
    width: '31%',
    margin: '1%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  categoryCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F3E5F5',
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
    marginLeft: 10,
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  textAreaContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textAreaInputContainer: {
    paddingHorizontal: 0,
  },
  textAreaInput: {
    borderBottomWidth: 0,
  },
  textAreaText: {
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 120,
  },
  characterCount: {
    alignItems: 'flex-end',
    paddingTop: 4,
  },
  characterCountText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  contactMethods: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  contactMethodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactMethodText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
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

export default ContactUsScreen;
