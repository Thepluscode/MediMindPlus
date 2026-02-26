import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner } from '../components/ui';
import axios from 'axios';

type PrivacyPolicyScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;
};

interface PrivacyPolicyData {
  version: string;
  effectiveDate: string;
  content: string;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<PrivacyPolicyData | null>(null);

  useEffect(() => {
    loadPrivacyPolicy();
  }, []);

  const loadPrivacyPolicy = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/settings/legal/privacy-policy');
      setPolicy(response.data);
    } catch (error) {
      // Error loading privacy policy
      // Set fallback content
      setPolicy({
        version: '1.0.0',
        effectiveDate: '2024-01-01',
        content: 'Privacy policy content is currently unavailable. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!policy) return null;

    // Split content by headers (lines starting with #)
    const lines = policy.content.split('\n');
    const sections: { title: string; content: string[] }[] = [];
    let currentSection: { title: string; content: string[] } | null = null;

    lines.forEach((line) => {
      if (line.startsWith('# ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace('# ', '').trim(),
          content: [],
        };
      } else if (line.startsWith('## ')) {
        if (currentSection) {
          currentSection.content.push(line.replace('## ', '').trim());
        }
      } else if (line.trim() && currentSection) {
        currentSection.content.push(line.trim());
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.map((section, index) => (
      <View key={index} style={styles.sectionCard}>
        <Typography variant="h3" weight="bold" style={styles.sectionTitle}>{section.title}</Typography>
        <View style={styles.divider} />
        {section.content.map((text, i) => (
          <Typography key={i} variant="body" style={styles.sectionText}>
            {text}
          </Typography>
        ))}
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Typography variant="body" style={styles.loadingText}>Loading privacy policy...</Typography>
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
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>Privacy Policy</Typography>
        <Typography variant="body" style={styles.headerSubtitle}>How we protect your data</Typography>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {policy && (
            <View style={styles.metaInfo}>
              <View style={styles.metaRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.colors.textSecondary}
                  style={styles.metaIcon}
                />
                <Typography variant="body" style={styles.metaText}>
                  Effective Date: {new Date(policy.effectiveDate).toLocaleDateString()}
                </Typography>
              </View>
              <View style={styles.metaRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={theme.colors.textSecondary}
                  style={styles.metaIcon}
                />
                <Typography variant="body" style={styles.metaText}>Version {policy.version}</Typography>
              </View>
            </View>
          )}

          <View style={styles.hipaaCard}>
            <View style={styles.hipaaHeader}>
              <Ionicons name="shield-checkmark" color="#4CAF50" size={28} />
              <Typography variant="h3" weight="bold" style={styles.hipaaTitle}>HIPAA Compliant</Typography>
            </View>
            <Typography variant="body" style={styles.hipaaText}>
              We are committed to protecting your health information in accordance with HIPAA
              regulations and maintaining the highest standards of data privacy and security.
            </Typography>
          </View>

          {renderContent()}

          <View style={styles.contactCard}>
            <Typography variant="h3" weight="bold" style={styles.contactTitle}>Questions About Privacy?</Typography>
            <View style={styles.divider} />
            <Typography variant="body" style={styles.contactText}>
              If you have any questions about our privacy practices, please contact us:
            </Typography>
            <View style={styles.contactMethod}>
              <Ionicons name="mail" size={20} color={theme.colors.primary} />
              <Typography variant="body" style={styles.contactMethodText}>privacy@medimind.com</Typography>
            </View>
            <View style={styles.contactMethod}>
              <Ionicons name="call" size={20} color={theme.colors.primary} />
              <Typography variant="body" style={styles.contactMethodText}>1-800-MEDIMIND</Typography>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="I understand the privacy policy"
            >
              <LinearGradient
                colors={theme.gradients.primary.colors}
                start={theme.gradients.primary.start}
                end={theme.gradients.primary.end}
                style={styles.backButton}
              >
                <Ionicons name="checkmark" color="white" size={20} style={{ marginRight: theme.spacing.sm }} />
                <Typography variant="body" weight="bold" style={styles.backButtonText}>I Understand</Typography>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
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
    color: 'white',
    marginBottom: theme.spacing.xs,
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
  },
  metaInfo: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  metaIcon: {
    marginRight: theme.spacing.xs,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  hipaaCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    ...theme.shadows.small,
  },
  hipaaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  hipaaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginLeft: theme.spacing.sm,
  },
  hipaaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'left',
    marginBottom: theme.spacing.sm,
  },
  sectionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  contactCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  contactMethodText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PrivacyPolicyScreen;
