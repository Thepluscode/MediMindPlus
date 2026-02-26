/**
 * Biological Age Calculator Screen
 *
 * Calculate your biological age using advanced algorithms
 * Part of Longevity Optimization Platform
 * Revenue: $120M Year 1 (high-value demographic)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { longevityAPI } from '../services/revolutionaryFeaturesAPI';
import { authService } from '../services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

export default function BiologicalAgeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [biologicalAge, setBiologicalAge] = useState<any>(null);
  const [hallmarksData, setHallmarksData] = useState<any>(null);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    loadBiologicalAge();
  }, []);

  useEffect(() => {
    if (biologicalAge) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [biologicalAge]);

  const loadBiologicalAge = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      const userId = user.id;

      const [ageResponse, hallmarksResponse] = await Promise.all([
        longevityAPI.calculateBiologicalAge(userId),
        longevityAPI.getAgingHallmarks(userId),
      ]);

      setBiologicalAge(ageResponse.data || ageResponse);
      setHallmarksData(hallmarksResponse.data || hallmarksResponse);
    } catch (error) {
      Alert.alert('Error', 'Failed to load biological age. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBiologicalAge = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      const userId = user.id;

      const response = await longevityAPI.calculateBiologicalAge(userId);

      setBiologicalAge(response.data || response);
      Alert.alert('Success', 'Your biological age has been calculated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate biological age');
    } finally {
      setLoading(false);
    }
  };

  const renderAgeComparison = () => {
    if (!biologicalAge) return null;

    const ageDifference = biologicalAge.chronologicalAge - biologicalAge.biologicalAge;
    const isYounger = ageDifference > 0;
    const percentile = biologicalAge.percentile;

    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View style={[styles.ageCard, { transform: [{ scale }] }]}>
        <View style={styles.ageHeader}>
          <Typography variant="h3" weight="bold" color="primary">
            Your Biological Age
          </Typography>
          {isYounger && (
            <Icon
              name="trophy"
              size={28}
              color="#FFD700"
              importantForAccessibility="no"
              accessible={false}
            />
          )}
        </View>

        <View style={styles.ageComparisonRow}>
          <View style={styles.ageColumn}>
            <Typography variant="body" color="secondary">
              Chronological
            </Typography>
            <Typography variant="h1" weight="bold" color="secondary" style={styles.chronologicalAge}>
              {biologicalAge.chronologicalAge}
            </Typography>
          </View>

          <View style={styles.ageDivider}>
            <Icon
              name={isYounger ? 'arrow-left-bold' : 'arrow-right-bold'}
              size={40}
              color={isYounger ? theme.colors.success : theme.colors.error}
              importantForAccessibility="no"
              accessible={false}
            />
          </View>

          <View style={styles.ageColumn}>
            <Typography variant="body" color="secondary">
              Biological
            </Typography>
            <Typography
              variant="h1"
              weight="bold"
              style={[
                styles.biologicalAge,
                { color: isYounger ? theme.colors.success : theme.colors.error }
              ]}
            >
              {biologicalAge.biologicalAge.toFixed(1)}
            </Typography>
          </View>
        </View>

        <View style={styles.ageDifferenceCard}>
          {isYounger ? (
            <>
              <Icon
                name="emoticon-excited"
                size={32}
                color={theme.colors.success}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" weight="semibold" style={styles.ageDifferenceGood}>
                You're {Math.abs(ageDifference).toFixed(1)} years YOUNGER biologically!
              </Typography>
            </>
          ) : (
            <>
              <Icon
                name="alert-circle"
                size={32}
                color={theme.colors.error}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" weight="semibold" style={styles.ageDifferenceBad}>
                You're {Math.abs(ageDifference).toFixed(1)} years OLDER biologically
              </Typography>
            </>
          )}
        </View>

        <View style={styles.percentileCard}>
          <Typography variant="body" color="primary" align="center">
            You're in the <Typography variant="body" weight="bold" color="info">{percentile}th percentile</Typography>
          </Typography>
          <Typography variant="body" color="secondary" align="center" style={styles.percentileSubtext}>
            {percentile > 75
              ? 'Better than most people your age!'
              : percentile > 50
              ? 'Average for your age group'
              : 'Room for improvement with our interventions'}
          </Typography>
        </View>

        {/* Aging Pace */}
        <View style={styles.agingPaceCard}>
          <Typography variant="body" weight="semibold" color="primary">
            Aging Pace
          </Typography>
          <View style={styles.agingPaceRow}>
            <View style={styles.agingPaceIndicator}>
              <Typography variant="h2" weight="bold" color="info">
                {biologicalAge.agingPace.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="secondary" style={styles.agingPaceLabel}>
                years per year
              </Typography>
            </View>
            <View style={styles.agingPaceInfo}>
              <Typography variant="body" color="primary">
                {biologicalAge.agingPace < 1.0
                  ? '🎉 You\'re aging slower than calendar time!'
                  : biologicalAge.agingPace === 1.0
                  ? '⏱️ You\'re aging at normal pace'
                  : '⚠️ You\'re aging faster than calendar time'}
              </Typography>
            </View>
          </View>
        </View>

        {/* Lifespan Prediction */}
        <View style={styles.lifespanCard}>
          <Typography variant="body" weight="semibold" color="primary">
            Lifespan Prediction
          </Typography>
          <View style={styles.lifespanRow}>
            <View style={styles.lifespanBox}>
              <Icon
                name="calendar-range"
                size={24}
                color={theme.colors.info}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="h2" weight="bold" color="primary" style={styles.lifespanValue}>
                {biologicalAge.lifespanPrediction.predictedLifespan}
              </Typography>
              <Typography variant="caption" color="secondary" style={styles.lifespanLabel}>
                years
              </Typography>
            </View>
            <View style={styles.lifespanBox}>
              <Icon
                name="heart-pulse"
                size={24}
                color="#E91E63"
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="h2" weight="bold" color="primary" style={styles.lifespanValue}>
                {biologicalAge.lifespanPrediction.healthspan}
              </Typography>
              <Typography variant="caption" color="secondary" style={styles.lifespanLabel}>
                healthy years
              </Typography>
            </View>
          </View>
          <Typography variant="caption" color="secondary" align="center">
            Confidence interval: {biologicalAge.lifespanPrediction.confidenceInterval.lower} - {biologicalAge.lifespanPrediction.confidenceInterval.upper} years
          </Typography>
        </View>
      </Animated.View>
    );
  };

  const renderAlgorithms = () => {
    if (!biologicalAge || !biologicalAge.algorithms) return null;

    return (
      <Card elevated elevation="md" padding="lg" style={styles.algorithmsCard}>
        <Typography variant="body" weight="bold" color="primary" style={styles.sectionTitle}>
          CALCULATION ALGORITHMS
        </Typography>
        <Typography variant="body" color="secondary" style={styles.algorithmsSubtitle}>
          We use 4 state-of-the-art algorithms for maximum accuracy
        </Typography>

        {Object.entries(biologicalAge.algorithms).map(([name, data]: [string, any]) => (
          <View key={name} style={styles.algorithmItem}>
            <View style={styles.algorithmHeader}>
              <Typography variant="body" weight="semibold" color="primary">
                {name.toUpperCase()}
              </Typography>
              <Typography variant="h4" weight="bold" color="info">
                {data.age.toFixed(1)} years
              </Typography>
            </View>
            <Typography variant="caption" color="secondary" style={styles.algorithmBasis}>
              {data.basis}
            </Typography>
            <View style={styles.algorithmBar}>
              <View
                style={[
                  styles.algorithmBarFill,
                  {
                    width: `${(data.age / biologicalAge.chronologicalAge) * 100}%`,
                    backgroundColor: data.age < biologicalAge.chronologicalAge ? theme.colors.success : theme.colors.error,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </Card>
    );
  };

  const renderHallmarksOfAging = () => {
    if (!hallmarksData) return null;

    const primaryHallmarks = hallmarksData.hallmarks.filter((h: any) => h.category === 'Primary');
    const antagonisticHallmarks = hallmarksData.hallmarks.filter((h: any) => h.category === 'Antagonistic');
    const integrativeHallmarks = hallmarksData.hallmarks.filter((h: any) => h.category === 'Integrative');

    const renderHallmarkCategory = (title: string, hallmarks: any[], color: string) => (
      <View style={styles.hallmarkCategory}>
        <Typography variant="body" weight="bold" style={[styles.hallmarkCategoryTitle, { color }]}>
          {title}
        </Typography>
        {hallmarks.map((hallmark: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.hallmarkItem}
            onPress={() => showHallmarkDetails(hallmark)}
            accessibilityRole="button"
            accessibilityLabel={`${hallmark.name} hallmark details`}
            accessibilityHint="View detailed information and recommended interventions for this aging hallmark"
          >
            <View style={styles.hallmarkInfo}>
              <Typography variant="body" weight="semibold" color="primary">
                {hallmark.name}
              </Typography>
              <Typography variant="caption" color="secondary">
                {hallmark.markers.join(' • ')}
              </Typography>
            </View>
            <View style={styles.hallmarkScore}>
              <Typography
                variant="h3"
                weight="bold"
                style={{ color: hallmark.score >= 7 ? theme.colors.success : hallmark.score >= 5 ? theme.colors.warning : theme.colors.error }}
              >
                {hallmark.score.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="secondary">
                /10
              </Typography>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );

    return (
      <Card elevated elevation="md" padding="lg" style={styles.hallmarksCard}>
        <Typography variant="body" weight="bold" color="primary" style={styles.sectionTitle}>
          12 HALLMARKS OF AGING
        </Typography>
        <Typography variant="caption" color="secondary" style={styles.hallmarksSubtitle}>
          Based on López-Otín et al. Cell 2013 & 2023 update
        </Typography>

        <View style={styles.overallScoreCard}>
          <Typography variant="body" color="secondary">
            Overall Aging Score
          </Typography>
          <Typography
            variant="h1"
            weight="bold"
            style={{ color: hallmarksData.overallScore >= 7 ? theme.colors.success : hallmarksData.overallScore >= 5 ? theme.colors.warning : theme.colors.error }}
          >
            {hallmarksData.overallScore.toFixed(1)}/10
          </Typography>
        </View>

        {renderHallmarkCategory('Primary Hallmarks', primaryHallmarks, '#E91E63')}
        {renderHallmarkCategory('Antagonistic Hallmarks', antagonisticHallmarks, '#FF9800')}
        {renderHallmarkCategory('Integrative Hallmarks', integrativeHallmarks, '#9C27B0')}
      </Card>
    );
  };

  const showHallmarkDetails = (hallmark: any) => {
    Alert.alert(
      hallmark.name,
      `Markers: ${hallmark.markers.join(', ')}\n\nRecommended Interventions:\n${hallmark.interventions.join('\n• ')}`,
      [{ text: 'View Interventions', onPress: () => navigation.navigate('LongevityInterventions' as never) }]
    );
  };

  const renderCuttingEdgeTherapies = () => {
    return (
      <Card elevated elevation="md" padding="lg" style={styles.therapiesCard}>
        <Typography variant="body" weight="bold" color="primary" style={styles.sectionTitle}>
          CUTTING-EDGE THERAPIES
        </Typography>
        <Typography variant="body" color="secondary" style={styles.therapiesSubtitle}>
          Access the latest longevity interventions
        </Typography>

        <View style={styles.therapyButtons}>
          <TouchableOpacity
            style={styles.therapyButton}
            onPress={() => navigation.navigate('LongevityTherapies' as never)}
            accessibilityRole="button"
            accessibilityLabel="Learn about Senolytics therapy"
            accessibilityHint="View information about senolytics for clearing senescent cells"
          >
            <Icon
              name="pill"
              size={32}
              color={theme.colors.info}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="body" weight="semibold" color="primary" style={styles.therapyButtonTitle}>
              Senolytics
            </Typography>
            <Typography variant="caption" color="secondary">
              Clear senescent cells
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.therapyButton}
            onPress={() => navigation.navigate('LongevityTherapies' as never)}
            accessibilityRole="button"
            accessibilityLabel="Learn about NAD+ Boosters therapy"
            accessibilityHint="View information about NAD+ boosters for cellular energy"
          >
            <Icon
              name="atom"
              size={32}
              color={theme.colors.success}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="body" weight="semibold" color="primary" style={styles.therapyButtonTitle}>
              NAD+ Boosters
            </Typography>
            <Typography variant="caption" color="secondary">
              Cellular energy
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.therapyButton}
            onPress={() => navigation.navigate('LongevityTherapies' as never)}
            accessibilityRole="button"
            accessibilityLabel="Learn about Rapamycin therapy"
            accessibilityHint="View information about Rapamycin for mTOR inhibition"
          >
            <Icon
              name="dna"
              size={32}
              color="#9C27B0"
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="body" weight="semibold" color="primary" style={styles.therapyButtonTitle}>
              Rapamycin
            </Typography>
            <Typography variant="caption" color="secondary">
              mTOR inhibition
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.therapyButton}
            onPress={() => navigation.navigate('LongevityTherapies' as never)}
            accessibilityRole="button"
            accessibilityLabel="Learn about Young Plasma therapy"
            accessibilityHint="View information about young plasma for rejuvenation factors"
          >
            <Icon
              name="heart-pulse"
              size={32}
              color="#E91E63"
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="body" weight="semibold" color="primary" style={styles.therapyButtonTitle}>
              Young Plasma
            </Typography>
            <Typography variant="caption" color="secondary">
              Rejuvenation factors
            </Typography>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('LongevityTherapies' as never)}
          accessibilityRole="button"
          accessibilityLabel="View all therapies"
          accessibilityHint="View complete list of longevity therapies and interventions"
        >
          <Typography variant="body" weight="semibold" color="info" style={styles.viewAllButtonText}>
            View All 10+ Therapies
          </Typography>
          <Icon
            name="arrow-right"
            size={20}
            color={theme.colors.info}
            importantForAccessibility="no"
            accessible={false}
          />
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Calculating your biological age..."
        color={theme.colors.info}
      />
    );
  }

  if (!biologicalAge) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={theme.gradients.primary.colors}
          start={theme.gradients.primary.start}
          end={theme.gradients.primary.end}
          style={styles.gradientHeader}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <Typography variant="h2" weight="bold" color="inverse" align="center">
            Biological Age Calculator
          </Typography>
          <Typography variant="body" color="inverse" align="center" style={styles.gradientHeaderSubtitle}>
            Discover Your True Age
          </Typography>
        </LinearGradient>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          accessibilityLabel="Biological age calculator introduction"
          accessibilityRole="scrollview"
        >
          <Icon
            name="chart-line"
            size={120}
            color={theme.colors.border}
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography variant="h3" weight="bold" color="primary" align="center" style={styles.emptyTitle}>
            Discover Your Biological Age
          </Typography>
          <Typography variant="body" color="secondary" align="center" style={styles.emptyDescription}>
            Find out how old you really are at the cellular level.
            Our advanced algorithms use 4 different methods to calculate your true biological age.
          </Typography>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size={24}
                color={theme.colors.success}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" color="primary">
                4 validation algorithms
              </Typography>
            </View>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size={24}
                color={theme.colors.success}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" color="primary">
                12 Hallmarks of Aging assessment
              </Typography>
            </View>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size={24}
                color={theme.colors.success}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" color="primary">
                Lifespan prediction
              </Typography>
            </View>
            <View style={styles.featureItem}>
              <Icon
                name="check-circle"
                size={24}
                color={theme.colors.success}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" color="primary">
                Personalized interventions
              </Typography>
            </View>
          </View>

          <TouchableOpacity
            style={styles.calculateButton}
            onPress={calculateBiologicalAge}
            accessibilityRole="button"
            accessibilityLabel="Calculate my biological age"
            accessibilityHint="Start analysis to calculate your biological age using 4 advanced algorithms"
          >
            <Typography variant="h4" weight="bold" color="inverse" style={styles.calculateButtonText}>
              Calculate My Biological Age
            </Typography>
            <Icon
              name="arrow-right"
              size={24}
              color="#fff"
              importantForAccessibility="no"
              accessible={false}
            />
          </TouchableOpacity>

          <Typography variant="body" color="secondary" align="center" style={styles.pricingText}>
            $99 one-time • Part of Longevity Optimization ($200/month)
          </Typography>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.gradientHeader}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <Typography variant="h2" weight="bold" color="inverse" align="center">
          Biological Age Results
        </Typography>
        <Typography variant="body" color="inverse" align="center" style={styles.gradientHeaderSubtitle}>
          Your Cellular Health Analysis
        </Typography>
      </LinearGradient>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        accessibilityLabel="Biological age analysis results"
        accessibilityRole="scrollview"
      >
        {renderAgeComparison()}
        {renderAlgorithms()}
        {renderHallmarksOfAging()}
        {renderCuttingEdgeTherapies()}

        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('LongevityProfile' as never)}
            accessibilityRole="button"
            accessibilityLabel="View full longevity profile"
            accessibilityHint="Navigate to your complete longevity health profile and recommendations"
          >
            <Icon
              name="account-details"
              size={24}
              color="#fff"
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="body" weight="semibold" color="inverse" style={styles.actionButtonText}>
              Full Longevity Profile
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => loadBiologicalAge()}
            accessibilityRole="button"
            accessibilityLabel="Recalculate biological age"
            accessibilityHint="Refresh and recalculate your biological age with latest data"
          >
            <Icon
              name="refresh"
              size={24}
              color={theme.colors.info}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="body" weight="semibold" color="info" style={styles.actionButtonText}>
              Recalculate
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientHeader: {
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  gradientHeaderSubtitle: {
    marginTop: theme.spacing.xs,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  ageCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.xl,
    borderRadius: 20,
    ...theme.shadows.medium,
  },
  ageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  ageComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  ageColumn: {
    alignItems: 'center',
  },
  chronologicalAge: {
    marginTop: theme.spacing.xs,
  },
  biologicalAge: {
    marginTop: theme.spacing.xs,
  },
  ageDivider: {
    marginHorizontal: theme.spacing.md,
  },
  ageDifferenceCard: {
    backgroundColor: theme.colors.backgroundAlt,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  ageDifferenceGood: {
    color: theme.colors.success,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  ageDifferenceBad: {
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  percentileCard: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  percentileSubtext: {
    marginTop: theme.spacing.xxs,
  },
  agingPaceCard: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  agingPaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  agingPaceIndicator: {
    backgroundColor: theme.colors.backgroundAlt,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  agingPaceLabel: {
    marginTop: theme.spacing.xxs,
  },
  agingPaceInfo: {
    flex: 1,
  },
  lifespanCard: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  lifespanRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  lifespanBox: {
    alignItems: 'center',
  },
  lifespanValue: {
    marginTop: theme.spacing.xs,
  },
  lifespanLabel: {
    marginTop: theme.spacing.xxs,
  },
  algorithmsCard: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  algorithmsSubtitle: {
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.md,
  },
  algorithmItem: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  algorithmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxs,
  },
  algorithmBasis: {
    marginBottom: theme.spacing.xs,
  },
  algorithmBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  algorithmBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  hallmarksCard: {
    margin: theme.spacing.md,
  },
  hallmarksSubtitle: {
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.md,
  },
  overallScoreCard: {
    backgroundColor: theme.colors.backgroundAlt,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  hallmarkCategory: {
    marginBottom: theme.spacing.xl,
  },
  hallmarkCategoryTitle: {
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  hallmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  hallmarkInfo: {
    flex: 1,
  },
  hallmarkScore: {
    alignItems: 'center',
  },
  therapiesCard: {
    margin: theme.spacing.md,
  },
  therapiesSubtitle: {
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.md,
  },
  therapyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  therapyButton: {
    width: '48%',
    backgroundColor: theme.colors.backgroundAlt,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  therapyButtonTitle: {
    marginTop: theme.spacing.xs,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.info,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  viewAllButtonText: {
    marginRight: theme.spacing.xs,
  },
  actionsCard: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    backgroundColor: theme.colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  actionButtonText: {
    marginLeft: theme.spacing.xs,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.info,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    marginTop: theme.spacing.xl,
  },
  emptyDescription: {
    marginTop: theme.spacing.md,
    lineHeight: 24,
  },
  featuresContainer: {
    marginTop: theme.spacing.xxl,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  calculateButton: {
    backgroundColor: theme.colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xxl,
    ...theme.shadows.large,
  },
  calculateButtonText: {
    marginRight: theme.spacing.xs,
  },
  pricingText: {
    marginTop: theme.spacing.md,
  },
});
