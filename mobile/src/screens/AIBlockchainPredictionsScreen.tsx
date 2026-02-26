import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Typography, LoadingSpinner } from '../components/ui';
import {
  getAvailableModels,
  getUserPredictions,
  setSelectedModel,
  selectAvailableModels,
  selectExplainablePredictions,
  selectIsLoading,
  selectError,
} from '../store/slices/aiPredictionsSlice';
import type { AppDispatch } from '../store/store';

const { width } = Dimensions.get('window');

const AIBlockchainPredictionsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const models = useSelector(selectAvailableModels);
  const predictions = useSelector(selectExplainablePredictions);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(getAvailableModels()).unwrap(),
        dispatch(getUserPredictions()).unwrap(),
      ]);
    } catch (err) {
      // Error handled by Redux slice
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleModelSelect = (model: any) => {
    dispatch(setSelectedModel(model));
    // Navigate to prediction input screen
    navigation.navigate('AIPredictionInput' as never);
  };

  const handlePredictionPress = (prediction: any) => {
    // Navigate to explainability visualization
    navigation.navigate('ExplainabilityViz' as never, { prediction } as never);
  };

  const getSeverityColor = (confidence: number) => {
    if (confidence >= 0.8) return ['#10b981', '#059669'];
    if (confidence >= 0.6) return ['#f59e0b', '#d97706'];
    return ['#ef4444', '#dc2626'];
  };

  const getRiskLevel = (prediction: any) => {
    const score = prediction.prediction?.risk_score || 0;
    if (score >= 70) return { level: 'High', icon: 'warning', color: '#ef4444' };
    if (score >= 40) return { level: 'Medium', icon: 'alert-circle', color: '#f59e0b' };
    return { level: 'Low', icon: 'checkmark-circle', color: '#10b981' };
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
          <View>
            <Typography variant="h1" weight="bold" style={styles.headerTitle}>
              AI Predictions
            </Typography>
            <Typography variant="body" style={styles.headerSubtitle}>
              Blockchain-Verified Health Insights
            </Typography>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => navigation.navigate('ConsentManagement' as never)}
            accessibilityRole="button"
            accessibilityLabel="View consent management and privacy settings"
            accessibilityHint="Navigate to consent management screen to review privacy settings"
          >
            <Ionicons name="shield-checkmark" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        accessibilityLabel="AI predictions and models list"
        accessibilityRole="scrollview"
      >
        {/* Available Models Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={24} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
            <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
              Available AI Models
            </Typography>
          </View>

          {isLoading && models.length === 0 ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.modelsScroll}
              accessibilityLabel="Available AI models"
              accessibilityRole="scrollview"
            >
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => handleModelSelect(model)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${model.model_name.replace(/_/g, ' ')} model. ${(model.accuracy * 100).toFixed(0)}% accuracy. ${model.status}. Tap to use this model.`}
                >
                  <LinearGradient
                    colors={theme.gradients.primary.colors}
                    style={styles.modelCard}
                    start={theme.gradients.primary.start}
                    end={theme.gradients.primary.end}
                  >
                    <View style={styles.modelCardHeader}>
                      <Ionicons name="analytics" size={32} color="#fff" importantForAccessibility="no" accessible={false} />
                      <View style={styles.accuracyBadge}>
                        <Typography variant="body" weight="bold" style={styles.accuracyText}>
                          {(model.accuracy * 100).toFixed(0)}%
                        </Typography>
                      </View>
                    </View>
                    <Typography variant="body" weight="bold" style={styles.modelName} numberOfLines={2}>
                      {model.model_name.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body" style={styles.modelDescription} numberOfLines={3}>
                      {model.description}
                    </Typography>
                    <View style={styles.modelFooter}>
                      <Typography variant="caption" style={styles.modelVersion}>
                        v{model.version}
                      </Typography>
                      <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Typography variant="caption" weight="semibold" style={styles.statusText}>
                          {model.status}
                        </Typography>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent Predictions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
            <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
              Recent Predictions
            </Typography>
          </View>

          {predictions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={theme.colors.border} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" weight="semibold" style={styles.emptyStateText}>
                No predictions yet
              </Typography>
              <Typography variant="body" color="secondary" style={styles.emptyStateSubtext}>
                Select a model above to start
              </Typography>
            </View>
          ) : (
            predictions.map((prediction) => {
              const risk = getRiskLevel(prediction);
              const confidenceColors = getSeverityColor(prediction.confidence);

              return (
                <TouchableOpacity
                  key={prediction.predictionId}
                  onPress={() => handlePredictionPress(prediction)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${prediction.modelName.replace(/_/g, ' ')} prediction. ${risk.level} risk. ${(prediction.confidence * 100).toFixed(1)}% confidence. Tap to view details.`}
                >
                  <View style={styles.predictionCard}>
                    <View style={styles.predictionHeader}>
                      <View style={styles.predictionTitleRow}>
                        <Ionicons
                          name={risk.icon as any}
                          size={24}
                          color={risk.color}
                          importantForAccessibility="no"
                          accessible={false}
                        />
                        <View style={styles.predictionTitle}>
                          <Typography variant="body" weight="bold" style={styles.predictionModelName}>
                            {prediction.modelName.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="caption" color="secondary" style={styles.predictionDate}>
                            {new Date(prediction.timestamp).toLocaleDateString()}
                          </Typography>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.riskBadge,
                          { backgroundColor: risk.color + '20' },
                        ]}
                      >
                        <Typography variant="caption" weight="bold" style={[styles.riskText, { color: risk.color }]}>
                          {risk.level}
                        </Typography>
                      </View>
                    </View>

                    {/* Confidence Bar */}
                    <View style={styles.confidenceContainer}>
                      <Typography variant="caption" weight="semibold" style={styles.confidenceLabel}>
                        AI Confidence: {(prediction.confidence * 100).toFixed(1)}%
                      </Typography>
                      <View style={styles.confidenceBarBg}>
                        <LinearGradient
                          colors={confidenceColors}
                          style={[
                            styles.confidenceBar,
                            { width: `${prediction.confidence * 100}%` },
                          ]}
                          start={theme.gradients.primary.start}
                          end={{ x: 1, y: 0 }}
                        />
                      </View>
                    </View>

                    {/* Blockchain Verification */}
                    <View style={styles.blockchainBadge}>
                      <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                      <Typography variant="caption" weight="semibold" style={styles.blockchainText}>
                        Blockchain Verified
                      </Typography>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={theme.colors.error} importantForAccessibility="no" accessible={false} />
            <Typography variant="body" style={styles.errorText}>{error}</Typography>
          </View>
        )}
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
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.primaryLight,
  },
  infoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelsScroll: {
    marginBottom: theme.spacing.lg,
  },
  modelCard: {
    width: width * 0.7,
    marginRight: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  accuracyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
  modelName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  modelDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  modelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelVersion: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: 11,
    color: theme.colors.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  predictionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  predictionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  predictionTitle: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  predictionModelName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textTransform: 'capitalize',
  },
  predictionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confidenceContainer: {
    marginBottom: theme.spacing.md,
  },
  confidenceLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  confidenceBarBg: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.xs,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    borderRadius: theme.borderRadius.xs,
  },
  blockchainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  blockchainText: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
});

export default AIBlockchainPredictionsScreen;
