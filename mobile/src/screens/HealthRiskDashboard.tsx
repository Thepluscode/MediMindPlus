/**
 * Health Risk Assessment Dashboard
 * Displays AI-powered disease risk predictions with visualizations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');
const API_URL = 'http://localhost:3000/api';

interface RiskAssessment {
  disease: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  probability: number;
  timeframe: string;
  recommendations: string[];
  nextScreening?: string;
  details: Record<string, any>;
}

interface ComprehensiveReport {
  userId: string;
  generatedAt: string;
  overallRiskScore: number;
  assessments: RiskAssessment[];
  topRisks: RiskAssessment[];
  actionableInsights: string[];
  screeningSchedule: ScreeningRecommendation[];
}

interface ScreeningRecommendation {
  test: string;
  reason: string;
  urgency: 'ROUTINE' | 'SOON' | 'URGENT';
  recommendedDate: string;
  frequency: string;
}

export default function HealthRiskDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState<ComprehensiveReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchComprehensiveReport();
    }
  }, [userId]);

  const loadUserId = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setUserId(userData.id);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load user information. Please try again.');
    }
  };

  const fetchComprehensiveReport = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('accessToken');

      const response = await axios.get(
        `${API_URL}/health-risk/${userId}/comprehensive`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReport(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load health risk assessment';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchComprehensiveReport();
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return '#10B981'; // Green
      case 'MODERATE':
        return '#F59E0B'; // Yellow
      case 'HIGH':
        return '#EF4444'; // Red
      case 'CRITICAL':
        return '#991B1B'; // Dark Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getOverallRiskColor = (score: number) => {
    if (score >= 75) return '#991B1B';
    if (score >= 50) return '#EF4444';
    if (score >= 25) return '#F59E0B';
    return '#10B981';
  };

  const getDiseaseIcon = (disease: string) => {
    switch (disease) {
      case 'TYPE_2_DIABETES':
        return 'water-outline';
      case 'CARDIOVASCULAR_DISEASE':
        return 'heart-outline';
      case 'HYPERTENSION':
        return 'speedometer-outline';
      case 'MENTAL_HEALTH_DISORDER':
        return 'happy-outline';
      case 'CANCER':
        return 'shield-outline';
      default:
        return 'medical-outline';
    }
  };

  const getDiseaseName = (disease: string) => {
    switch (disease) {
      case 'TYPE_2_DIABETES':
        return 'Type 2 Diabetes';
      case 'CARDIOVASCULAR_DISEASE':
        return 'Cardiovascular Disease';
      case 'HYPERTENSION':
        return 'Hypertension';
      case 'MENTAL_HEALTH_DISORDER':
        return 'Mental Health';
      case 'CANCER':
        return 'Cancer Screening';
      default:
        return disease.replace(/_/g, ' ');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return '#EF4444';
      case 'SOON':
        return '#F59E0B';
      case 'ROUTINE':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const RiskMeter = ({ score, size = 120 }: { score: number; size?: number }) => {
    const color = getOverallRiskColor(score);
    const percentage = score;

    return (
      <View style={[styles.riskMeter, { width: size, height: size }]}>
        <View
          style={[
            styles.riskMeterInner,
            {
              borderColor: color,
              borderWidth: 8,
            },
          ]}
        >
          <Typography variant="h1" weight="bold" style={{ color }}>
            {score}
          </Typography>
          <Typography variant="body" color="secondary">
            Risk Score
          </Typography>
        </View>
      </View>
    );
  };

  const RiskCard = ({ assessment }: { assessment: RiskAssessment }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <TouchableOpacity
        style={styles.riskCard}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${getDiseaseName(assessment.disease)} risk card`}
        accessibilityState={{ expanded }}
      >
        <View style={styles.riskCardHeader}>
          <View style={styles.riskCardIcon}>
            <Ionicons
              name={getDiseaseIcon(assessment.disease) as any}
              size={32}
              color={getRiskColor(assessment.riskLevel)}
              importantForAccessibility="no"
              accessible={false}
            />
          </View>
          <View style={styles.riskCardInfo}>
            <Typography variant="h4" weight="semibold" color="primary">
              {getDiseaseName(assessment.disease)}
            </Typography>
            <Typography variant="body" color="secondary">
              {assessment.timeframe} risk
            </Typography>
          </View>
          <View style={styles.riskCardScore}>
            <Typography
              variant="h2"
              weight="bold"
              style={{ color: getRiskColor(assessment.riskLevel) }}
            >
              {assessment.riskScore}
            </Typography>
            <View
              style={[
                styles.riskBadge,
                { backgroundColor: getRiskColor(assessment.riskLevel) },
              ]}
            >
              <Typography variant="caption" weight="semibold" color="inverse">
                {assessment.riskLevel}
              </Typography>
            </View>
          </View>
        </View>

        {expanded && (
          <View style={styles.riskCardDetails}>
            <View style={styles.probabilitySection}>
              <Typography variant="body" weight="semibold" color="secondary">
                Probability:
              </Typography>
              <Typography variant="body" weight="semibold" color="primary">
                {(assessment.probability * 100).toFixed(1)}% over {assessment.timeframe}
              </Typography>
            </View>

            <View style={styles.recommendationsSection}>
              <Typography variant="h4" weight="bold" color="primary" style={styles.recommendationsTitle}>
                Recommendations:
              </Typography>
              {assessment.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.colors.success}
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Typography variant="body" color="primary" style={styles.recommendationText}>
                    {rec}
                  </Typography>
                </View>
              ))}
            </View>

            {assessment.nextScreening && (
              <View style={styles.screeningSection}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography variant="body" weight="medium" color="primary" style={styles.screeningText}>
                  Next screening: {new Date(assessment.nextScreening).toLocaleDateString()}
                </Typography>
              </View>
            )}
          </View>
        )}

        <View style={styles.expandIndicator}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textSecondary}
            importantForAccessibility="no"
            accessible={false}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Analyzing your health data..."
        color={theme.colors.info}
      />
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.error}
          importantForAccessibility="no"
          accessible={false}
        />
        <Typography variant="body" color="error" align="center" style={styles.errorText}>
          {error}
        </Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchComprehensiveReport}
          accessibilityRole="button"
          accessibilityLabel="Retry loading health risk data"
        >
          <Typography variant="body" weight="semibold" color="inverse">
            Retry
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centerContainer}>
        <Typography variant="body" color="error" align="center">
          No health risk data available
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      accessibilityLabel="Health risk assessment dashboard"
      accessibilityRole="scrollview"
    >
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary.colors}
        style={styles.header}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <Typography variant="h2" weight="bold" color="inverse">
          Health Risk Assessment
        </Typography>
        <Typography variant="body" color="inverse" style={styles.headerSubtitle}>
          AI-Powered Disease Prediction & Prevention
        </Typography>
      </LinearGradient>

      {/* Overall Risk Score */}
      <Card elevated elevation="md" padding="lg" style={styles.overallRiskSection}>
        <Typography variant="h3" weight="bold" color="primary" align="center">
          Overall Health Risk
        </Typography>
        <RiskMeter score={report.overallRiskScore} size={140} />
        <Typography variant="body" color="secondary" align="center">
          Based on analysis of 5 major health conditions
        </Typography>
        <Typography variant="caption" color="secondary" align="center" style={styles.generatedDate}>
          Generated: {new Date(report.generatedAt).toLocaleString()}
        </Typography>
      </Card>

      {/* Top Risks */}
      <View style={styles.section}>
        <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
          Top 3 Health Risks
        </Typography>
        {report.topRisks.map((risk, index) => (
          <RiskCard key={index} assessment={risk} />
        ))}
      </View>

      {/* All Assessments */}
      <View style={styles.section}>
        <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
          Detailed Risk Analysis
        </Typography>
        {report.assessments.map((assessment, index) => (
          <RiskCard key={index} assessment={assessment} />
        ))}
      </View>

      {/* Actionable Insights */}
      <View style={styles.section}>
        <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
          Key Insights & Actions
        </Typography>
        <Card elevated elevation="sm" padding="md">
          {report.actionableInsights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={theme.colors.warning}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" color="primary" style={styles.insightText}>
                {insight}
              </Typography>
            </View>
          ))}
        </Card>
      </View>

      {/* Screening Schedule */}
      <View style={styles.section}>
        <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
          Recommended Screening Schedule
        </Typography>
        {report.screeningSchedule.map((screening, index) => (
          <Card key={index} elevated elevation="sm" padding="md" style={styles.screeningCard}>
            <View style={styles.screeningHeader}>
              <View
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: getUrgencyColor(screening.urgency) },
                ]}
              >
                <Typography variant="caption" weight="semibold" color="inverse">
                  {screening.urgency}
                </Typography>
              </View>
              <Typography variant="caption" weight="medium" color="secondary">
                {screening.frequency}
              </Typography>
            </View>
            <Typography variant="h4" weight="semibold" color="primary" style={styles.screeningTest}>
              {screening.test}
            </Typography>
            <Typography variant="body" color="secondary" style={styles.screeningReason}>
              {screening.reason}
            </Typography>
            <View style={styles.screeningDate}>
              <Ionicons
                name="calendar"
                size={16}
                color={theme.colors.info}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" weight="medium" color="info" style={styles.screeningDateText}>
                {new Date(screening.recommendedDate).toLocaleDateString()}
              </Typography>
            </View>
          </Card>
        ))}
      </View>

      {/* Call to Action */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.ctaButton}
          accessibilityRole="button"
          accessibilityLabel="Schedule appointments"
          accessibilityHint="Book appointments with healthcare providers"
        >
          <Ionicons
            name="calendar-outline"
            size={24}
            color="white"
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography variant="body" weight="semibold" color="inverse" style={styles.ctaButtonText}>
            Schedule Appointments
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaButtonSecondary}
          accessibilityRole="button"
          accessibilityLabel="Share report with provider"
          accessibilityHint="Share this health risk assessment with your healthcare provider"
        >
          <Ionicons
            name="share-outline"
            size={24}
            color={theme.colors.info}
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography variant="body" weight="semibold" color="info" style={styles.ctaButtonText}>
            Share with Provider
          </Typography>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Typography variant="caption" color="secondary" align="center">
          Powered by AI • Results are for informational purposes only
        </Typography>
        <Typography variant="caption" color="secondary" align="center">
          Always consult with your healthcare provider
        </Typography>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSubtitle: {
    marginTop: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  overallRiskSection: {
    alignItems: 'center',
    margin: theme.spacing.lg,
  },
  riskMeter: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  riskMeterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  generatedDate: {
    marginTop: theme.spacing.sm,
  },
  riskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  riskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  riskCardInfo: {
    flex: 1,
  },
  riskCardScore: {
    alignItems: 'flex-end',
  },
  riskBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xxs,
  },
  riskCardDetails: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  probabilitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  recommendationsSection: {
    marginBottom: theme.spacing.md,
  },
  recommendationsTitle: {
    marginBottom: theme.spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  recommendationText: {
    flex: 1,
    marginLeft: theme.spacing.xs,
    lineHeight: 20,
  },
  screeningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.sm,
  },
  screeningText: {
    marginLeft: theme.spacing.xs,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  insightText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  screeningCard: {
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  screeningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  urgencyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
  },
  screeningTest: {
    marginBottom: theme.spacing.xxs,
  },
  screeningReason: {
    marginBottom: theme.spacing.xs,
  },
  screeningDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screeningDateText: {
    marginLeft: theme.spacing.xs,
  },
  ctaSection: {
    padding: theme.spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ctaButtonText: {
    marginLeft: theme.spacing.xs,
  },
  ctaButtonSecondary: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.info,
  },
  footer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  errorText: {
    marginTop: theme.spacing.md,
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.info,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
});
