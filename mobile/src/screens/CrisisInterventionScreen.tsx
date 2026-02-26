/**
 * 988 Crisis Intervention Screen
 * Revenue Impact: +$20K implementation cost
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/ui';
import { theme } from '../theme/theme';

export default function CrisisInterventionScreen({ navigation }: any) {
  const [safetyPlan, setSafetyPlan] = useState<any>(null);
  const [localResources, setLocalResources] = useState<any[]>([]);

  useEffect(() => {
    loadSafetyPlan();
    loadLocalResources();
  }, []);

  const loadSafetyPlan = async () => {
    // Mock safety plan
    setSafetyPlan({
      warningSigns: ['Feeling hopeless', 'Withdrawing from others', 'Increased substance use'],
      copingStrategies: ['Deep breathing', 'Go for a walk', 'Listen to music'],
      supportContacts: [
        { name: 'John Doe', relationship: 'Brother', phone: '555-0123' },
        { name: 'Dr. Smith', relationship: 'Therapist', phone: '555-0456' }
      ]
    });
  };

  const loadLocalResources = async () => {
    // Mock local resources
    setLocalResources([
      { name: 'City Mental Health Crisis Center', phone: '555-CRISIS', distance: 2.3 },
      { name: 'General Hospital Psychiatric Emergency', phone: '555-PSYCH', distance: 5.7 }
    ]);
  };

  const call988 = () => {
    Alert.alert(
      '988 Suicide & Crisis Lifeline',
      'You will be connected to trained crisis counselors 24/7. Do you want to call now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            if (Platform.OS === 'web') {
              window.open('tel:988', '_self');
            } else {
              Linking.openURL('tel:988');
            }
          }
        }
      ]
    );
  };

  const text988 = () => {
    Alert.alert(
      'Text 988',
      'You can text 988 to connect with a crisis counselor. Do you want to open your messaging app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Text Now',
          onPress: () => {
            if (Platform.OS === 'web') {
              Alert.alert('SMS Support', 'Please use your phone to text 988');
            } else {
              Linking.openURL('sms:988&body=CRISIS');
            }
          }
        }
      ]
    );
  };

  const openCrisisChat = () => {
    Linking.openURL('https://988lifeline.org/chat');
  };

  const callEmergency = () => {
    Alert.alert(
      'Call 911',
      'This will connect you to emergency services. Use this if you are in immediate danger.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'web') {
              window.open('tel:911', '_self');
            } else {
              Linking.openURL('tel:911');
            }
          }
        }
      ]
    );
  };

  const callContact = (name: string, phone: string) => {
    Alert.alert(
      `Call ${name}`,
      'Connect with your support person?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            if (Platform.OS === 'web') {
              window.open(`tel:${phone}`, '_self');
            } else {
              Linking.openURL(`tel:${phone}`);
            }
          }
        }
      ]
    );
  };

  const callLocalResource = (name: string, phone: string) => {
    if (Platform.OS === 'web') {
      window.open(`tel:${phone}`, '_self');
    } else {
      Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.primary.colors} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Return to previous screen"
          >
            <Ionicons name="arrow-back" size={24} color="white" importantForAccessibility="no" accessible={false} />
          </TouchableOpacity>
          <Typography variant="h2" weight="bold" style={styles.headerTitle}>
            Crisis Support
          </Typography>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} accessibilityLabel="Crisis intervention resources" accessibilityRole="scrollview">
        {/* Emergency Actions */}
        <View style={styles.section}>
          <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
            Immediate Help
          </Typography>

          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={call988}
            accessibilityRole="button"
            accessibilityLabel="Call 988 Suicide and Crisis Lifeline"
            accessibilityHint="Connect to trained crisis counselors 24/7"
          >
            <LinearGradient colors={theme.gradients.primary.colors} style={styles.emergencyGradient}>
              <Ionicons name="call" size={32} color="white" importantForAccessibility="no" accessible={false} />
              <View style={styles.emergencyTextContainer}>
                <Typography variant="h3" weight="bold" style={styles.emergencyTitle}>
                  Call 988
                </Typography>
                <Typography variant="body" style={styles.emergencySubtitle}>
                  24/7 Suicide & Crisis Lifeline
                </Typography>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.alternativeActions}>
            <TouchableOpacity
              style={styles.altButton}
              onPress={text988}
              accessibilityRole="button"
              accessibilityLabel="Text 988"
              accessibilityHint="Send a text message to connect with a crisis counselor"
            >
              <Ionicons name="chatbubble" size={24} color="#dc2626" importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.altButtonText}>
                Text 988
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.altButton}
              onPress={openCrisisChat}
              accessibilityRole="button"
              accessibilityLabel="Chat online with crisis counselor"
              accessibilityHint="Open web chat to connect with a crisis counselor"
            >
              <Ionicons name="laptop" size={24} color="#dc2626" importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.altButtonText}>
                Chat Online
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.altButton}
              onPress={callEmergency}
              accessibilityRole="button"
              accessibilityLabel="Call 911 emergency services"
              accessibilityHint="Connect to emergency services for immediate danger"
            >
              <Ionicons name="warning" size={24} color="#dc2626" importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.altButtonText}>
                Call 911
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Other National Resources */}
        <View style={styles.section}>
          <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
            Other Resources
          </Typography>

          <View style={styles.resourceCard}>
            <Ionicons name="heart" size={24} color="#8b5cf6" importantForAccessibility="no" accessible={false} />
            <View style={styles.resourceInfo}>
              <Typography variant="body" style={styles.resourceName}>Trevor Project (LGBTQ Youth)</Typography>
              <Typography variant="body" style={styles.resourcePhone}>1-866-488-7386 | Text: 678678</Typography>
            </View>
          </View>

          <View style={styles.resourceCard}>
            <Ionicons name="shield" size={24} color="#3b82f6" importantForAccessibility="no" accessible={false} />
            <View style={styles.resourceInfo}>
              <Typography variant="body" style={styles.resourceName}>Veterans Crisis Line</Typography>
              <Typography variant="body" style={styles.resourcePhone}>Press 1 after dialing 988</Typography>
            </View>
          </View>

          <View style={styles.resourceCard}>
            <Ionicons name="people" size={24} color="#10b981" importantForAccessibility="no" accessible={false} />
            <View style={styles.resourceInfo}>
              <Typography variant="body" style={styles.resourceName}>SAMHSA Helpline</Typography>
              <Typography variant="body" style={styles.resourcePhone}>1-800-662-4357 (Substance Abuse)</Typography>
            </View>
          </View>
        </View>

        {/* Safety Plan */}
        {safetyPlan && (
          <View style={styles.section}>
            <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
              Your Safety Plan
            </Typography>

            <View style={styles.safetyCard}>
              <Typography variant="body" weight="semibold" style={styles.safetyCardTitle}>
                Warning Signs
              </Typography>
              {safetyPlan.warningSigns.map((sign: string, i: number) => (
                <Typography variant="body" key={i} style={styles.safetyItem}>• {sign}</Typography>
              ))}
            </View>

            <View style={styles.safetyCard}>
              <Typography variant="body" weight="semibold" style={styles.safetyCardTitle}>
                Coping Strategies
              </Typography>
              {safetyPlan.copingStrategies.map((strategy: string, i: number) => (
                <View key={i} style={styles.copingItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" importantForAccessibility="no" accessible={false} />
                  <Typography variant="body" style={styles.copingText}>
                    {strategy}
                  </Typography>
                </View>
              ))}
            </View>

            <View style={styles.safetyCard}>
              <Typography variant="body" weight="semibold" style={styles.safetyCardTitle}>
                Support Contacts
              </Typography>
              {safetyPlan.supportContacts.map((contact: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={styles.contactItem}
                  onPress={() => callContact(contact.name, contact.phone)}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${contact.name}, ${contact.relationship}`}
                  accessibilityHint={`Call your support contact at ${contact.phone}`}
                >
                  <View style={styles.contactInfo}>
                    <Typography variant="body" style={styles.contactName}>
                      {contact.name}
                    </Typography>
                    <Typography variant="body" style={styles.contactRelationship}>
                      {contact.relationship}
                    </Typography>
                  </View>
                  <View style={styles.contactAction}>
                    <Typography variant="body" style={styles.contactPhone}>
                      {contact.phone}
                    </Typography>
                    <Ionicons name="call" size={20} color="#06b6d4" importantForAccessibility="no" accessible={false} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Local Resources */}
        {localResources.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
              Nearby Crisis Centers
            </Typography>
            {localResources.map((resource, i) => (
              <TouchableOpacity
                key={i}
                style={styles.localResourceCard}
                onPress={() => callLocalResource(resource.name, resource.phone)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${resource.name}, ${resource.distance} miles away`}
                accessibilityHint={`Call local crisis center at ${resource.phone}`}
              >
                <Ionicons name="location" size={24} color="#06b6d4" importantForAccessibility="no" accessible={false} />
                <View style={styles.localResourceInfo}>
                  <Typography variant="body" style={styles.localResourceName}>
                    {resource.name}
                  </Typography>
                  <Typography variant="body" style={styles.localResourceDistance}>
                    {resource.distance} miles away
                  </Typography>
                </View>
                <Ionicons name="call" size={20} color="#06b6d4" importantForAccessibility="no" accessible={false} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Important Information */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" importantForAccessibility="no" accessible={false} />
          <View style={styles.infoContent}>
            <Typography variant="body" weight="semibold" style={styles.infoTitle}>
              You Are Not Alone
            </Typography>
            <Typography variant="body" style={styles.infoText}>
              Crisis counselors are available 24/7 to provide free, confidential support.
              All calls, texts, and chats are anonymous unless you choose to share your information.
            </Typography>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: theme.spacing.lg },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: 'white', flex: 1, marginLeft: theme.spacing.md },
  content: { flex: 1 },
  section: { padding: theme.spacing.lg },
  sectionTitle: { color: theme.colors.text, marginBottom: theme.spacing.md },

  // Emergency Button
  emergencyButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginBottom: theme.spacing.md },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md
  },
  emergencyTextContainer: { flex: 1 },
  emergencyTitle: { color: 'white', marginBottom: theme.spacing.xs },
  emergencySubtitle: { color: '#fef2f2' },

  // Alternative Actions
  alternativeActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  altButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 2,
    borderColor: '#dc2626'
  },
  altButtonText: { color: '#dc2626', textAlign: 'center' },

  // Resource Cards
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm
  },
  resourceInfo: { flex: 1 },
  resourceName: { color: theme.colors.text, marginBottom: theme.spacing.xs },
  resourcePhone: { color: theme.colors.textSecondary },

  // Safety Plan
  safetyCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm
  },
  safetyCardTitle: { color: theme.colors.text, marginBottom: theme.spacing.sm },
  safetyItem: { color: theme.colors.textSecondary, lineHeight: 24 },

  copingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs, gap: theme.spacing.xs },
  copingText: { flex: 1, color: theme.colors.textSecondary },

  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  contactInfo: { flex: 1 },
  contactName: { color: theme.colors.text, marginBottom: 2 },
  contactRelationship: { color: theme.colors.textSecondary },
  contactAction: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  contactPhone: { color: '#06b6d4' },

  // Local Resources
  localResourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm
  },
  localResourceInfo: { flex: 1 },
  localResourceName: { color: theme.colors.text, marginBottom: theme.spacing.xs },
  localResourceDistance: { color: theme.colors.textSecondary },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  infoContent: { flex: 1 },
  infoTitle: { color: '#1e40af', marginBottom: theme.spacing.xs },
  infoText: { color: '#1e40af', lineHeight: 20 }
});
