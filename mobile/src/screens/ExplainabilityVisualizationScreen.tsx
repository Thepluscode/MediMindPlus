import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { verifyPrediction } from '../store/slices/aiPredictionsSlice';
import type { AppDispatch } from '../store/store';
import { Typography } from '../components/ui';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

interface RouteParams {
  prediction: any;
}

const ExplainabilityVisualizationScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const { prediction } = (route.params as RouteParams) || {};
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(prediction?.verifiable || false);

  if (!prediction) {
    return (
      <View style={styles.container}>
        <Typography variant="body">No prediction data available</Typography>
      </View>
    );
  }

  const features = prediction.explanation?.features || [];
  const reasoning = prediction.explanation?.reasoning || '';

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await dispatch(verifyPrediction(prediction.predictionId)).unwrap();
      setVerified(true);
    } catch (error) {
      // Verification failed - silently handle
    } finally {
      setVerifying(false);
    }
  };

  const getFeatureIcon = (featureName: string) => {
    const name = featureName.toLowerCase();
    if (name.includes('age')) return 'calendar';
    if (name.includes('bmi') || name.includes('weight')) return 'fitness';
    if (name.includes('pressure') || name.includes('blood')) return 'water';
    if (name.includes('glucose') || name.includes('sugar')) return 'nutrition';
    if (name.includes('cholesterol')) return 'heart';
    if (name.includes('family') || name.includes('history')) return 'people';
    return 'analytics';
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 0.3) return '#ef4444';
    if (importance >= 0.2) return '#f59e0b';
    if (importance >= 0.1) return '#eab308';
    return '#10b981';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary.colors}
        style={styles.header}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Return to previous screen"
          >
            <Ionicons name="arrow-back" size={24} color="white" importantForAccessibility="no" accessible={false} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Typography variant="h2" weight="bold" style={styles.headerTitle}>
              AI Explanation
            </Typography>
            <Typography variant="body" style={styles.headerSubtitle}>
              Understanding Your Results
            </Typography>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="AI explanation details" accessibilityRole="scrollview">
        {/* Prediction Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={theme.gradients.primary.colors}
            style={styles.summaryGradient}
            start={theme.gradients.primary.start}
            end={theme.gradients.primary.end}
          >
            <View style={styles.summaryHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.summaryTitle}>Prediction Result</Typography>
            </View>

            <View style={styles.confidenceCircle}>
              <Typography variant="body" style={styles.confidenceValue}>
                {(prediction.confidence * 100).toFixed(0)}%
              </Typography>
              <Typography variant="body" style={styles.confidenceLabel}>Confidence</Typography>
            </View>

            <Typography variant="body" style={styles.modelName}>
              Model: {prediction.modelName.replace(/_/g, ' ')}
            </Typography>
          </LinearGradient>
        </View>

        {/* Blockchain Verification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={24} color="#667eea" importantForAccessibility="no" accessible={false} />
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>Blockchain Verification</Typography>
          </View>

          <View style={styles.verificationCard}>
            <View style={styles.hashContainer}>
              <Typography variant="body" style={styles.hashLabel}>Transaction Hash:</Typography>
              <Typography variant="body" style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                {prediction.blockchainHash}
              </Typography>
            </View>

            {!verified ? (
              <TouchableOpacity
                style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
                onPress={handleVerify}
                disabled={verifying}
                accessibilityRole="button"
                accessibilityLabel="Verify prediction on blockchain"
                accessibilityHint="Verify this prediction's authenticity using blockchain"
                accessibilityState={{ disabled: verifying }}
              >
                <LinearGradient
                  colors={theme.gradients.primary.colors}
                  style={styles.verifyButtonGradient}
                  start={theme.gradients.primary.start}
                  end={{ x: 1, y: 0 }}
                >
                  {verifying ? (
                    <Typography variant="body" weight="bold" style={styles.verifyButtonText}>
                      Verifying...
                    </Typography>
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={20} color="white" importantForAccessibility="no" accessible={false} />
                      <Typography variant="body" weight="bold" style={styles.verifyButtonText}>
                        Verify on Blockchain
                      </Typography>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" importantForAccessibility="no" accessible={false} />
                <Typography variant="body" weight="bold" style={styles.verifiedText}>
                  Verified on Blockchain
                </Typography>
              </View>
            )}
          </View>
        </View>

        {/* AI Reasoning */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color="#667eea" importantForAccessibility="no" accessible={false} />
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>AI Reasoning</Typography>
          </View>

          <View style={styles.reasoningCard}>
            <Typography variant="body" style={styles.reasoningText}>{reasoning}</Typography>
          </View>
        </View>

        {/* Feature Importance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={24} color="#667eea" importantForAccessibility="no" accessible={false} />
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>Feature Importance</Typography>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature: any, index: number) => {
              const importanceColor = getImportanceColor(feature.importance);
              const barWidth = feature.importance * width * 0.5;

              return (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureHeader}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons
                        name={getFeatureIcon(feature.name) as any}
                        size={24}
                        color={importanceColor}
                        importantForAccessibility="no"
                        accessible={false}
                      />
                    </View>
                    <View style={styles.featureInfo}>
                      <Typography variant="body" style={styles.featureName}>
                        {feature.name.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="body" style={styles.featureValue}>
                        Value: {typeof feature.value === 'boolean'
                          ? feature.value ? 'Yes' : 'No'
                          : feature.value}
                      </Typography>
                    </View>
                    <View style={styles.importanceContainer}>
                      <Typography variant="body" style={[styles.importanceValue, { color: importanceColor }]}>
                        {(feature.importance * 100).toFixed(0)}%
                      </Typography>
                    </View>
                  </View>

                  {/* Importance Bar */}
                  <View style={styles.barContainer}>
                    <View style={styles.barBackground}>
                      <Animated.View
                        style={[
                          styles.bar,
                          {
                            width: barWidth,
                            backgroundColor: importanceColor,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Contribution Info */}
                  <View style={styles.contributionContainer}>
                    <Typography variant="body" style={styles.contributionLabel}>
                      Impact: {(feature.contribution * 100).toFixed(1)}%
                    </Typography>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Prediction Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#667eea" importantForAccessibility="no" accessible={false} />
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>Prediction Details</Typography>
          </View>

          <View style={styles.detailsCard}>
            {Object.entries(prediction.prediction || {}).map(([key, value]: [string, any]) => (
              <View key={key} style={styles.detailRow}>
                <Typography variant="body" style={styles.detailKey}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                </Typography>
                <Typography variant="body" style={styles.detailValue}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Typography>
              </View>
            ))}
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.timestampContainer}>
          <Ionicons name="time" size={16} color="#94a3b8" importantForAccessibility="no" accessible={false} />
          <Typography variant="body" style={styles.timestampText}>
            Generated: {new Date(prediction.timestamp).toLocaleString()}
          </Typography>
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    color: '#e0e7ff',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  summaryGradient: {
    padding: theme.spacing.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    fontSize: 20,
    color: 'white',
    marginLeft: theme.spacing.sm,
  },
  confidenceCircle: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  confidenceValue: {
    fontSize: 42,
    color: 'white',
  },
  confidenceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: theme.spacing.xs,
  },
  modelName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  verificationCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  hashContainer: {
    marginBottom: theme.spacing.md,
  },
  hashLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  hashValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontFamily: 'monospace',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  verifyButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  verifyButtonText: {
    fontSize: 16,
    color: 'white',
    marginLeft: theme.spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  verifiedText: {
    fontSize: 16,
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
  },
  reasoningCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  reasoningText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  featuresContainer: {
    gap: theme.spacing.sm,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  featureName: {
    fontSize: 15,
    color: theme.colors.text,
    textTransform: 'capitalize',
    marginBottom: theme.spacing.xs,
  },
  featureValue: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  importanceContainer: {
    alignItems: 'flex-end',
  },
  importanceValue: {
    fontSize: 18,
  },
  barContainer: {
    marginBottom: theme.spacing.xs,
  },
  barBackground: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  contributionContainer: {
    alignItems: 'flex-end',
  },
  contributionLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailKey: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  timestampText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
});

export default ExplainabilityVisualizationScreen;
