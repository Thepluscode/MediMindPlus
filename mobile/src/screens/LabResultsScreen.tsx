/**
 * Lab Results & Testing Screen
 * At-home lab test ordering and comprehensive results visualization
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

interface LabTest {
  id: string;
  name: string;
  description: string;
  category: string;
  biomarkers: string[];
  price: number;
  estimatedTurnaroundDays: number;
  provider: string;
  sampleType: string;
}

interface BiomarkerResult {
  name: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
    optimalMin?: number;
    optimalMax?: number;
  };
  status: 'low' | 'normal' | 'high' | 'critical';
  interpretation: string;
  trendAnalysis?: {
    previousValue?: number;
    percentChange?: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

interface LabResults {
  resultId: string;
  testName: string;
  collectionDate: Date;
  biomarkers: BiomarkerResult[];
  overallAssessment: string;
  physicianNotes?: string;
}

const LabResultsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tests' | 'results' | 'trends'>('results');
  const [isLoading, setIsLoading] = useState(true);
  const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
  const [labResults, setLabResults] = useState<LabResults | null>(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Simulate API calls
    setTimeout(() => {
      // Mock available tests
      setAvailableTests([
        {
          id: 'ew-metabolic',
          name: 'Comprehensive Metabolic Panel',
          description: 'Complete metabolic health assessment',
          category: 'Comprehensive',
          biomarkers: ['Glucose', 'HbA1c', 'Cholesterol', 'Liver', 'Kidney'],
          price: 149,
          estimatedTurnaroundDays: 5,
          provider: 'Everlywell',
          sampleType: 'Finger-prick',
        },
        {
          id: 'ew-heart',
          name: 'Heart Health Test',
          description: 'Cardiovascular risk markers',
          category: 'Cardiovascular',
          biomarkers: ['Cholesterol', 'Triglycerides', 'hs-CRP'],
          price: 99,
          estimatedTurnaroundDays: 5,
          provider: 'Everlywell',
          sampleType: 'Finger-prick',
        },
        {
          id: 'quest-comprehensive',
          name: 'Quest Health & Wellness Panel',
          description: '40+ biomarkers comprehensive screening',
          category: 'Comprehensive',
          biomarkers: ['CBC', 'CMP', 'Lipids', 'Thyroid', 'Vitamins'],
          price: 299,
          estimatedTurnaroundDays: 3,
          provider: 'Quest',
          sampleType: 'Blood draw',
        },
      ]);

      // Mock lab results
      setLabResults({
        resultId: 'RESULT-123',
        testName: 'Comprehensive Metabolic Panel',
        collectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        biomarkers: [
          {
            name: 'Glucose',
            value: 95,
            unit: 'mg/dL',
            referenceRange: { min: 70, max: 99, optimalMin: 70, optimalMax: 85 },
            status: 'normal',
            interpretation: 'Fasting glucose within normal range, indicating good blood sugar control.',
            trendAnalysis: { previousValue: 102, percentChange: -6.9, trend: 'improving' },
          },
          {
            name: 'HbA1c',
            value: 5.4,
            unit: '%',
            referenceRange: { min: 4.0, max: 5.6, optimalMin: 4.0, optimalMax: 5.0 },
            status: 'normal',
            interpretation: '3-month average blood sugar optimal. Low diabetes risk.',
            trendAnalysis: { previousValue: 5.8, percentChange: -6.9, trend: 'improving' },
          },
          {
            name: 'Total Cholesterol',
            value: 195,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 200, optimalMin: 150, optimalMax: 180 },
            status: 'normal',
            interpretation: 'Total cholesterol within desirable range.',
            trendAnalysis: { previousValue: 210, percentChange: -7.1, trend: 'improving' },
          },
          {
            name: 'LDL Cholesterol',
            value: 115,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 100, optimalMin: 0, optimalMax: 70 },
            status: 'high',
            interpretation: 'LDL slightly elevated. Consider dietary changes.',
            trendAnalysis: { previousValue: 125, percentChange: -8.0, trend: 'improving' },
          },
          {
            name: 'HDL Cholesterol',
            value: 55,
            unit: 'mg/dL',
            referenceRange: { min: 40, max: 200, optimalMin: 60, optimalMax: 100 },
            status: 'normal',
            interpretation: 'HDL acceptable. Higher levels are protective.',
            trendAnalysis: { previousValue: 52, percentChange: 5.8, trend: 'improving' },
          },
          {
            name: 'Triglycerides',
            value: 125,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 150, optimalMin: 0, optimalMax: 100 },
            status: 'normal',
            interpretation: 'Triglycerides within normal range.',
            trendAnalysis: { previousValue: 140, percentChange: -10.7, trend: 'improving' },
          },
        ],
        overallAssessment: 'normal',
        physicianNotes:
          'Overall metabolic health is good. LDL cholesterol slightly elevated - recommend dietary modifications. All other markers optimal. Continue lifestyle habits and recheck in 3 months.',
      });

      setIsLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'low':
        return '#3b82f6';
      case 'normal':
        return '#10b981';
      case 'high':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving':
        return 'trending-down';
      case 'declining':
        return 'trending-up';
      default:
        return 'trending-flat';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'improving':
        return '#10b981';
      case 'declining':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const orderTest = (testId: string) => {
    Alert.alert(
      'Order Lab Test',
      'Are you sure you want to order this test?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Order',
          onPress: () => {
            Alert.alert('Success', 'Test ordered successfully! Kit will ship within 24 hours.');
          },
        },
      ]
    );
  };

  const renderBiomarkerChart = (biomarker: BiomarkerResult) => {
    const chartWidth = width - 80;
    const chartHeight = 100;

    const { value, referenceRange } = biomarker;
    const min = referenceRange.optimalMin || referenceRange.min;
    const max = referenceRange.optimalMax || referenceRange.max;
    const range = max - min;
    const normalizedValue = ((value - min) / range) * chartWidth;

    const optimalStart = referenceRange.optimalMin
      ? ((referenceRange.optimalMin - min) / range) * chartWidth
      : 0;
    const optimalEnd = referenceRange.optimalMax
      ? ((referenceRange.optimalMax - min) / range) * chartWidth
      : chartWidth;

    return (
      <View style={styles.biomarkerChartContainer} importantForAccessibility="no" accessible={false}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Reference range bar */}
          <Line
            x1={0}
            y1={50}
            x2={chartWidth}
            y2={50}
            stroke="#e2e8f0"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Optimal range */}
          <Line
            x1={optimalStart}
            y1={50}
            x2={optimalEnd}
            y2={50}
            stroke="#d1fae5"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Current value indicator */}
          <Circle cx={Math.min(chartWidth, Math.max(0, normalizedValue))} cy={50} r="12" fill={getStatusColor(biomarker.status)} />
          <Circle cx={Math.min(chartWidth, Math.max(0, normalizedValue))} cy={50} r="6" fill="#fff" />

          {/* Range labels */}
          <SvgText x={0} y={75} fontSize="10" fill="#64748b">
            {min}
          </SvgText>
          <SvgText x={chartWidth} y={75} fontSize="10" fill="#64748b" textAnchor="end">
            {max}
          </SvgText>
        </Svg>
      </View>
    );
  };

  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading lab data..."
        color={theme.colors.success}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={theme.gradients.primary.colors} style={styles.header} accessible={false} importantForAccessibility="no-hide-descendants">
        <Typography variant="h1" color="inverse" weight="bold">
          Lab Tests & Results
        </Typography>
        <Typography variant="bodySmall" color="inverse" style={styles.headerSubtitle}>
          At-home CLIA-certified testing
        </Typography>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tests' && styles.tabActive]}
          onPress={() => setActiveTab('tests')}
          accessibilityRole="tab"
          accessibilityLabel="Order tests tab"
          accessibilityState={{ selected: activeTab === 'tests' }}
          accessibilityHint="View available at-home lab tests to order"
        >
          <Ionicons name="flask" size={20} color={activeTab === 'tests' ? theme.colors.success : theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
          <Typography
            variant="bodySmall"
            weight="semibold"
            style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}
          >
            Order Tests
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.tabActive]}
          onPress={() => setActiveTab('results')}
          accessibilityRole="tab"
          accessibilityLabel="Results tab"
          accessibilityState={{ selected: activeTab === 'results' }}
          accessibilityHint="View your latest lab test results"
        >
          <Ionicons name="document-text" size={20} color={activeTab === 'results' ? theme.colors.success : theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
          <Typography
            variant="bodySmall"
            weight="semibold"
            style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}
          >
            Results
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'trends' && styles.tabActive]}
          onPress={() => setActiveTab('trends')}
          accessibilityRole="tab"
          accessibilityLabel="Trends tab"
          accessibilityState={{ selected: activeTab === 'trends' }}
          accessibilityHint="View biomarker trends over time"
        >
          <Ionicons name="trending-up" size={20} color={activeTab === 'trends' ? theme.colors.success : theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
          <Typography
            variant="bodySmall"
            weight="semibold"
            style={[styles.tabText, activeTab === 'trends' && styles.tabTextActive]}
          >
            Trends
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Lab tests and results" accessibilityRole="scrollview">
        {/* Order Tests Tab */}
        {activeTab === 'tests' && (
          <View>
            {availableTests.map((test) => (
              <Card key={test.id} elevated elevation="sm" padding="lg" style={styles.testCard}>
                <View style={styles.testHeader}>
                  <View style={styles.providerBadge}>
                    <Typography variant="caption" weight="semibold" style={styles.providerText}>
                      {test.provider}
                    </Typography>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Typography variant="caption" weight="semibold" style={styles.categoryText}>
                      {test.category}
                    </Typography>
                  </View>
                </View>

                <Typography variant="h4" weight="bold" color="primary" style={styles.testName}>
                  {test.name}
                </Typography>
                <Typography variant="body" color="secondary" style={styles.testDescription}>
                  {test.description}
                </Typography>

                <View style={styles.biomarkersContainer}>
                  <Ionicons name="water" size={16} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                  <Typography variant="bodySmall" weight="semibold" style={styles.biomarkersText}>
                    {test.biomarkers.length} Biomarkers:
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.biomarkersList}>
                    {test.biomarkers.join(', ')}
                  </Typography>
                </View>

                <View style={styles.testDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                    <Typography variant="caption" color="secondary">
                      {test.estimatedTurnaroundDays} days
                    </Typography>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="finger-print" size={16} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                    <Typography variant="caption" color="secondary">
                      {test.sampleType}
                    </Typography>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash" size={16} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                    <Typography variant="body" weight="bold" style={styles.priceText}>
                      ${test.price}
                    </Typography>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={() => orderTest(test.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Order ${test.name}`}
                  accessibilityHint={`Order at-home lab test for ${test.price} dollars with ${test.estimatedTurnaroundDays} days turnaround`}
                >
                  <LinearGradient colors={theme.gradients.primary.colors} style={styles.orderButtonGradient} accessible={false} importantForAccessibility="no-hide-descendants">
                    <Ionicons name="cart" size={20} color="#fff" importantForAccessibility="no" accessible={false} />
                    <Typography variant="body" weight="semibold" color="inverse">
                      Order Test
                    </Typography>
                  </LinearGradient>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && labResults && (
          <View>
            {/* Overall Assessment */}
            <Card elevated elevation="sm" padding="lg" style={styles.assessmentCard}>
              <View style={styles.assessmentHeader}>
                <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                <View style={styles.assessmentInfo}>
                  <Typography variant="body" color="secondary">
                    Overall Assessment
                  </Typography>
                  <Typography variant="h3" weight="bold" style={styles.assessmentStatus}>
                    {labResults.overallAssessment.toUpperCase()}
                  </Typography>
                </View>
              </View>

              <Typography variant="body" weight="semibold" color="primary" style={styles.testNameText}>
                {labResults.testName}
              </Typography>
              <Typography variant="bodySmall" color="secondary" style={styles.collectionDateText}>
                Collected: {labResults.collectionDate.toLocaleDateString()}
              </Typography>

              {labResults.physicianNotes && (
                <View style={styles.physicianNotesCard}>
                  <View style={styles.physicianHeader}>
                    <Ionicons name="medical" size={20} color={theme.colors.info} importantForAccessibility="no" accessible={false} />
                    <Typography variant="body" weight="semibold" style={styles.physicianTitle}>
                      Physician Notes
                    </Typography>
                  </View>
                  <Typography variant="bodySmall" style={styles.physicianNotes}>
                    {labResults.physicianNotes}
                  </Typography>
                </View>
              )}
            </Card>

            {/* Biomarker Results */}
            <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
              Biomarker Results
            </Typography>

            {labResults.biomarkers.map((biomarker, index) => (
              <Card key={index} elevated elevation="sm" padding="lg" style={styles.biomarkerCard}>
                <View style={styles.biomarkerHeader}>
                  <View style={styles.biomarkerTitleRow}>
                    <Typography variant="body" weight="bold" color="primary">
                      {biomarker.name}
                    </Typography>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(biomarker.status) + '20' }]}>
                      <Typography variant="caption" weight="semibold" style={{ color: getStatusColor(biomarker.status) }}>
                        {biomarker.status.toUpperCase()}
                      </Typography>
                    </View>
                  </View>

                  <View style={styles.biomarkerValueRow}>
                    <Typography variant="h1" weight="bold" style={{ color: getStatusColor(biomarker.status) }}>
                      {biomarker.value}
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.biomarkerUnit}>
                      {biomarker.unit}
                    </Typography>
                  </View>
                </View>

                {renderBiomarkerChart(biomarker)}

                <View style={styles.referenceRow}>
                  <Typography variant="caption" color="secondary">
                    Reference: {biomarker.referenceRange.min}-{biomarker.referenceRange.max} {biomarker.unit}
                  </Typography>
                  {biomarker.referenceRange.optimalMin && (
                    <Typography variant="caption" style={styles.optimalText}>
                      Optimal: {biomarker.referenceRange.optimalMin}-{biomarker.referenceRange.optimalMax}{' '}
                      {biomarker.unit}
                    </Typography>
                  )}
                </View>

                <Typography variant="bodySmall" color="secondary" style={styles.interpretationText}>
                  {biomarker.interpretation}
                </Typography>

                {biomarker.trendAnalysis && (
                  <View style={styles.trendContainer}>
                    <Ionicons
                      name={getTrendIcon(biomarker.trendAnalysis.trend)}
                      size={20}
                      color={getTrendColor(biomarker.trendAnalysis.trend)}
                      importantForAccessibility="no"
                      accessible={false}
                    />
                    <Typography variant="bodySmall" color="secondary" style={styles.trendText}>
                      {biomarker.trendAnalysis.percentChange > 0 ? '+' : ''}
                      {biomarker.trendAnalysis.percentChange.toFixed(1)}% vs. previous
                    </Typography>
                    <View
                      style={[
                        styles.trendBadge,
                        { backgroundColor: getTrendColor(biomarker.trendAnalysis.trend) + '20' },
                      ]}
                    >
                      <Typography variant="caption" weight="semibold" style={{ color: getTrendColor(biomarker.trendAnalysis.trend) }}>
                        {biomarker.trendAnalysis.trend}
                      </Typography>
                    </View>
                  </View>
                )}
              </Card>
            ))}

            {/* Download Report */}
            <TouchableOpacity
              style={styles.downloadButton}
              accessibilityRole="button"
              accessibilityLabel="Download full report as PDF"
              accessibilityHint="Download complete lab results report as PDF document"
            >
              <Ionicons name="download" size={20} color={theme.colors.info} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" weight="semibold" style={styles.downloadText}>
                Download Full Report (PDF)
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && labResults && (
          <View>
            <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
              6-Month Biomarker Trends
            </Typography>

            {labResults.biomarkers
              .filter((b) => b.trendAnalysis)
              .map((biomarker, index) => (
                <Card key={index} elevated elevation="sm" padding="lg" style={styles.trendCard}>
                  <View style={styles.trendCardHeader}>
                    <Typography variant="body" weight="bold" color="primary">
                      {biomarker.name}
                    </Typography>
                    <Ionicons
                      name={getTrendIcon(biomarker.trendAnalysis!.trend)}
                      size={24}
                      color={getTrendColor(biomarker.trendAnalysis!.trend)}
                      importantForAccessibility="no"
                      accessible={false}
                    />
                  </View>

                  <View style={styles.trendStatsRow}>
                    <View style={styles.trendStat}>
                      <Typography variant="caption" color="secondary" style={styles.trendStatLabel}>
                        Previous
                      </Typography>
                      <Typography variant="h3" weight="bold" color="primary">
                        {biomarker.trendAnalysis!.previousValue}
                      </Typography>
                    </View>
                    <View style={styles.trendStat}>
                      <Typography variant="caption" color="secondary" style={styles.trendStatLabel}>
                        Current
                      </Typography>
                      <Typography variant="h3" weight="bold" style={{ color: getStatusColor(biomarker.status) }}>
                        {biomarker.value}
                      </Typography>
                    </View>
                    <View style={styles.trendStat}>
                      <Typography variant="caption" color="secondary" style={styles.trendStatLabel}>
                        Change
                      </Typography>
                      <Typography
                        variant="h3"
                        weight="bold"
                        style={{ color: getTrendColor(biomarker.trendAnalysis!.trend) }}
                      >
                        {biomarker.trendAnalysis!.percentChange > 0 ? '+' : ''}
                        {biomarker.trendAnalysis!.percentChange.toFixed(1)}%
                      </Typography>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.trendStatusBar,
                      { backgroundColor: getTrendColor(biomarker.trendAnalysis!.trend) + '20' },
                    ]}
                  >
                    <Typography variant="bodySmall" weight="semibold" align="center" style={{ color: getTrendColor(biomarker.trendAnalysis!.trend) }}>
                      {biomarker.trendAnalysis!.trend === 'improving'
                        ? '✓ Improving - Keep up the good work!'
                        : biomarker.trendAnalysis!.trend === 'declining'
                        ? '⚠ Declining - Consider lifestyle changes'
                        : '→ Stable'}
                    </Typography>
                  </View>
                </Card>
              ))}
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
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerSubtitle: {
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  tabActive: {
    backgroundColor: '#d1fae5',
  },
  tabText: {
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.success,
  },
  scrollView: {
    flex: 1,
  },
  testCard: {
    margin: theme.spacing.md,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  providerBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
  },
  providerText: {
    color: theme.colors.info,
  },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
  },
  categoryText: {
    color: theme.colors.success,
  },
  testName: {
    marginBottom: theme.spacing.xs,
  },
  testDescription: {
    marginBottom: theme.spacing.sm,
  },
  biomarkersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.backgroundAlt,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  biomarkersText: {
    color: theme.colors.success,
  },
  biomarkersList: {
    flex: 1,
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  priceText: {
    color: theme.colors.success,
  },
  orderButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  orderButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  assessmentCard: {
    margin: theme.spacing.md,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentStatus: {
    color: theme.colors.success,
  },
  testNameText: {
    marginBottom: theme.spacing.xxs,
  },
  collectionDateText: {
    marginBottom: theme.spacing.md,
  },
  physicianNotesCard: {
    backgroundColor: '#eff6ff',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  physicianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  physicianTitle: {
    color: '#1e40af',
  },
  physicianNotes: {
    color: '#1e40af',
    lineHeight: 20,
  },
  sectionTitle: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  biomarkerCard: {
    margin: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  biomarkerHeader: {
    marginBottom: theme.spacing.md,
  },
  biomarkerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
  },
  biomarkerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  biomarkerUnit: {
    marginLeft: theme.spacing.xs,
  },
  biomarkerChartContainer: {
    marginVertical: theme.spacing.md,
  },
  referenceRow: {
    marginBottom: theme.spacing.sm,
  },
  optimalText: {
    color: theme.colors.success,
  },
  interpretationText: {
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundAlt,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  trendText: {
    flex: 1,
  },
  trendBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.info,
    gap: theme.spacing.xs,
  },
  downloadText: {
    color: theme.colors.info,
  },
  trendCard: {
    margin: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  trendCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  trendStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  trendStat: {
    alignItems: 'center',
  },
  trendStatLabel: {
    marginBottom: theme.spacing.xxs,
  },
  trendStatusBar: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
});

export default LabResultsScreen;
