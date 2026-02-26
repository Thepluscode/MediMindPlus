import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button, Icon, Card } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

type TermsOfServiceScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'TermsOfService'>;
};

interface TermsData {
  version: string;
  effectiveDate: string;
  content: string;
}

const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<TermsData | null>(null);

  useEffect(() => {
    loadTermsOfService();
  }, []);

  const loadTermsOfService = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/settings/legal/terms');
      setTerms(response.data);
    } catch (error) {
      console.error('Error loading terms of service:', error);
      // Set fallback content
      setTerms({
        version: '1.0.0',
        effectiveDate: '2024-01-01',
        content: 'Terms of Service content is currently unavailable. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!terms) return null;

    // Split content by headers (lines starting with #)
    const lines = terms.content.split('\n');
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
      <Card key={index} containerStyle={styles.sectionCard}>
        <Card.Title style={styles.sectionTitle}>{section.title}</Card.Title>
        <Card.Divider />
        {section.content.map((text, i) => (
          <Text key={i} style={styles.sectionText}>
            {text}
          </Text>
        ))}
      </Card>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading terms of service...</Text>
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
          <Icon name="description" type="material" color="white" size={60} importantForAccessibility="no" accessible={false} />
        </View>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <Text style={styles.headerSubtitle}>Legal agreements and conditions</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Terms of service content" accessibilityRole="scrollview">
        <View style={styles.content}>
          {terms && (
            <View style={styles.metaInfo}>
              <View style={styles.metaRow}>
                <Icon
                  name="update"
                  type="material"
                  size={18}
                  color={theme.colors.textSecondary}
                  containerStyle={styles.metaIcon}
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Text style={styles.metaText}>
                  Effective Date: {new Date(terms.effectiveDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Icon
                  name="info-outline"
                  type="material"
                  size={18}
                  color={theme.colors.textSecondary}
                  containerStyle={styles.metaIcon}
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Text style={styles.metaText}>Version {terms.version}</Text>
              </View>
            </View>
          )}

          <Card containerStyle={styles.importantCard}>
            <View style={styles.importantHeader}>
              <Icon name="warning" type="material" color="#FF9800" size={28} importantForAccessibility="no" accessible={false} />
              <Text style={styles.importantTitle}>Important Notice</Text>
            </View>
            <Text style={styles.importantText}>
              By using MediMind, you agree to these terms. Please read them carefully. If you do
              not agree to these terms, you may not use our services.
            </Text>
          </Card>

          {renderContent()}

          <Card containerStyle={styles.highlightCard}>
            <Card.Title style={styles.highlightTitle}>Key Points to Remember</Card.Title>
            <Card.Divider />
            <View style={styles.keyPoint}>
              <Icon name="check-circle" type="material" size={20} color="#4CAF50" importantForAccessibility="no" accessible={false} />
              <Text style={styles.keyPointText}>
                You are responsible for maintaining account security
              </Text>
            </View>
            <View style={styles.keyPoint}>
              <Icon name="check-circle" type="material" size={20} color="#4CAF50" importantForAccessibility="no" accessible={false} />
              <Text style={styles.keyPointText}>
                Health information is for informational purposes only
              </Text>
            </View>
            <View style={styles.keyPoint}>
              <Icon name="check-circle" type="material" size={20} color="#4CAF50" importantForAccessibility="no" accessible={false} />
              <Text style={styles.keyPointText}>
                We reserve the right to modify these terms
              </Text>
            </View>
            <View style={styles.keyPoint}>
              <Icon name="check-circle" type="material" size={20} color="#4CAF50" importantForAccessibility="no" accessible={false} />
              <Text style={styles.keyPointText}>Always consult healthcare professionals</Text>
            </View>
          </Card>

          <Card containerStyle={styles.contactCard}>
            <Card.Title style={styles.contactTitle}>Questions About These Terms?</Card.Title>
            <Card.Divider />
            <Text style={styles.contactText}>
              If you have questions about our terms of service, please contact our legal team:
            </Text>
            <View style={styles.contactMethod}>
              <Icon name="email" type="material" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
              <Text style={styles.contactMethodText}>legal@medimind.com</Text>
            </View>
            <View style={styles.contactMethod}>
              <Icon name="phone" type="material" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
              <Text style={styles.contactMethodText}>1-800-MEDIMIND</Text>
            </View>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              title="I Agree to Terms"
              onPress={() => navigation.goBack()}
              buttonStyle={styles.backButton}
              icon={
                <Icon
                  name="check"
                  type="material"
                  color="white"
                  size={20}
                  containerStyle={{ marginRight: 10 }}
                  importantForAccessibility="no"
                  accessible={false}
                />
              }
              accessibilityHint="Agree to terms of service and return to previous screen"
            />
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
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  metaInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaIcon: {
    marginRight: 8,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  importantCard: {
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  importantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  importantTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 12,
  },
  importantText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  sectionCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'left',
  },
  sectionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  highlightCard: {
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    marginBottom: 20,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 12,
    backgroundColor: '#F3E5F5',
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactMethodText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
});

export default TermsOfServiceScreen;
