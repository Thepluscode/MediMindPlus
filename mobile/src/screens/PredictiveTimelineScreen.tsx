/**
 * Predictive Timeline Screen
 * Interactive 3-5 year health trajectory visualization with stunning charts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

const { width, height } = Dimensions.get('window');

interface TimelineData {
  diseaseRisks: {
    diabetes: HealthTrajectory;
    heartDisease: HealthTrajectory;
    stroke: HealthTrajectory;
    hypertension: HealthTrajectory;
    obesity: HealthTrajectory;
  };
  biomarkerTrajectories: {
    bmi: HealthTrajectory;
    bloodPressure: HealthTrajectory;
    glucose: HealthTrajectory;
    cholesterol: HealthTrajectory;
  };
  overallHealthScore: HealthTrajectory;
  keyRiskFactors: RiskFactor[];
  interventionScenarios: InterventionScenario[];
}

interface HealthTrajectory {
  metric: string;
  currentValue: number;
  predictions: {
    year1: Prediction;
    year2: Prediction;
    year3: Prediction;
    year4: Prediction;
    year5: Prediction;
  };
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

interface Prediction {
  value: number;
  confidence: number;
  range: [number, number];
}

interface RiskFactor {
  factor: string;
  currentImpact: number;
  projectedImpact: number;
  modifiable: boolean;
  recommendations: string[];
}

interface InterventionScenario {
  scenario: string;
  description: string;
  projectedImprovements: {
    year3: number;
    year5: number;
  };
}

const PredictiveTimelineScreen: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedMetric, setSelectedMetric] = useState<'diseases' | 'biomarkers' | 'overall'>('overall');
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string>('diabetes');
  const [showInterventions, setShowInterventions] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPredictiveData();
  }, []);

  const loadPredictiveData = async () => {
    setIsLoading(true);

    // Simulate API call - in production, call LongitudinalPredictionService
    setTimeout(() => {
      const mockData: TimelineData = {
        diseaseRisks: {
          diabetes: {
            metric: 'Diabetes Risk',
            currentValue: 25,
            predictions: {
              year1: { value: 28, confidence: 0.85, range: [23, 33] },
              year2: { value: 32, confidence: 0.80, range: [24, 40] },
              year3: { value: 38, confidence: 0.75, range: [28, 48] },
              year4: { value: 42, confidence: 0.70, range: [30, 54] },
              year5: { value: 45, confidence: 0.65, range: [30, 60] },
            },
            trend: 'declining',
            riskLevel: 'moderate',
          },
          heartDisease: {
            metric: 'Heart Disease Risk',
            currentValue: 18,
            predictions: {
              year1: { value: 20, confidence: 0.88, range: [15, 25] },
              year2: { value: 23, confidence: 0.83, range: [15, 31] },
              year3: { value: 27, confidence: 0.78, range: [17, 37] },
              year4: { value: 30, confidence: 0.73, range: [18, 42] },
              year5: { value: 32, confidence: 0.68, range: [17, 47] },
            },
            trend: 'declining',
            riskLevel: 'moderate',
          },
          stroke: {
            metric: 'Stroke Risk',
            currentValue: 12,
            predictions: {
              year1: { value: 13, confidence: 0.87, range: [8, 18] },
              year2: { value: 15, confidence: 0.82, range: [7, 23] },
              year3: { value: 18, confidence: 0.77, range: [8, 28] },
              year4: { value: 20, confidence: 0.72, range: [8, 32] },
              year5: { value: 22, confidence: 0.67, range: [7, 37] },
            },
            trend: 'declining',
            riskLevel: 'low',
          },
          hypertension: {
            metric: 'Hypertension Risk',
            currentValue: 35,
            predictions: {
              year1: { value: 38, confidence: 0.86, range: [33, 43] },
              year2: { value: 42, confidence: 0.81, range: [34, 50] },
              year3: { value: 47, confidence: 0.76, range: [37, 57] },
              year4: { value: 50, confidence: 0.71, range: [38, 62] },
              year5: { value: 52, confidence: 0.66, range: [37, 67] },
            },
            trend: 'declining',
            riskLevel: 'high',
          },
          obesity: {
            metric: 'Obesity Risk',
            currentValue: 40,
            predictions: {
              year1: { value: 42, confidence: 0.89, range: [37, 47] },
              year2: { value: 45, confidence: 0.84, range: [37, 53] },
              year3: { value: 48, confidence: 0.79, range: [38, 58] },
              year4: { value: 50, confidence: 0.74, range: [38, 62] },
              year5: { value: 52, confidence: 0.69, range: [37, 67] },
            },
            trend: 'declining',
            riskLevel: 'high',
          },
        },
        biomarkerTrajectories: {
          bmi: {
            metric: 'BMI',
            currentValue: 28.5,
            predictions: {
              year1: { value: 29.0, confidence: 0.90, range: [27.6, 30.4] },
              year2: { value: 29.8, confidence: 0.85, range: [27.5, 32.1] },
              year3: { value: 30.5, confidence: 0.80, range: [27.5, 33.5] },
              year4: { value: 31.0, confidence: 0.75, range: [27.3, 34.7] },
              year5: { value: 31.5, confidence: 0.70, range: [27.0, 36.0] },
            },
            trend: 'declining',
            riskLevel: 'moderate',
          },
          bloodPressure: {
            metric: 'Blood Pressure',
            currentValue: 135,
            predictions: {
              year1: { value: 137, confidence: 0.88, range: [130, 144] },
              year2: { value: 140, confidence: 0.83, range: [129, 151] },
              year3: { value: 143, confidence: 0.78, range: [128, 158] },
              year4: { value: 145, confidence: 0.73, range: [127, 163] },
              year5: { value: 147, confidence: 0.68, range: [125, 169] },
            },
            trend: 'declining',
            riskLevel: 'moderate',
          },
          glucose: {
            metric: 'Glucose',
            currentValue: 105,
            predictions: {
              year1: { value: 108, confidence: 0.87, range: [98, 118] },
              year2: { value: 112, confidence: 0.82, range: [96, 128] },
              year3: { value: 116, confidence: 0.77, range: [94, 138] },
              year4: { value: 119, confidence: 0.72, range: [92, 146] },
              year5: { value: 122, confidence: 0.67, range: [90, 154] },
            },
            trend: 'declining',
            riskLevel: 'moderate',
          },
          cholesterol: {
            metric: 'Cholesterol',
            currentValue: 210,
            predictions: {
              year1: { value: 215, confidence: 0.89, range: [200, 230] },
              year2: { value: 220, confidence: 0.84, range: [198, 242] },
              year3: { value: 225, confidence: 0.79, range: [196, 254] },
              year4: { value: 228, confidence: 0.74, range: [194, 262] },
              year5: { value: 230, confidence: 0.69, range: [192, 268] },
            },
            trend: 'declining',
            riskLevel: 'moderate',
          },
        },
        overallHealthScore: {
          metric: 'Overall Health Score',
          currentValue: 72,
          predictions: {
            year1: { value: 70, confidence: 0.88, range: [65, 75] },
            year2: { value: 67, confidence: 0.83, range: [60, 74] },
            year3: { value: 63, confidence: 0.78, range: [54, 72] },
            year4: { value: 60, confidence: 0.73, range: [49, 71] },
            year5: { value: 58, confidence: 0.68, range: [45, 71] },
          },
          trend: 'declining',
          riskLevel: 'moderate',
        },
        keyRiskFactors: [
          {
            factor: 'Elevated BMI',
            currentImpact: 0.45,
            projectedImpact: 0.58,
            modifiable: true,
            recommendations: [
              'Increase physical activity to 150 minutes per week',
              'Adopt Mediterranean or DASH diet',
              'Aim for 5-10% weight reduction over 6 months',
            ],
          },
          {
            factor: 'High Blood Pressure',
            currentImpact: 0.38,
            projectedImpact: 0.52,
            modifiable: true,
            recommendations: [
              'Reduce sodium to <2300mg per day',
              'Increase potassium-rich foods',
              'Practice stress-reduction techniques',
            ],
          },
          {
            factor: 'Chronic Stress',
            currentImpact: 0.42,
            projectedImpact: 0.48,
            modifiable: true,
            recommendations: [
              'Practice mindfulness meditation 10 minutes daily',
              'Improve work-life balance',
              'Ensure adequate sleep (7-9 hours)',
            ],
          },
        ],
        interventionScenarios: [
          {
            scenario: 'Lifestyle Optimization',
            description: 'Diet, exercise, stress management, sleep improvement',
            projectedImprovements: { year3: 35, year5: 55 },
          },
          {
            scenario: 'Medical Management',
            description: 'Medication for BP, cholesterol, glucose',
            projectedImprovements: { year3: 40, year5: 50 },
          },
          {
            scenario: 'Combined Approach',
            description: 'Lifestyle + medical interventions',
            projectedImprovements: { year3: 50, year5: 70 },
          },
        ],
      };

      setTimelineData(mockData);
      setIsLoading(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1500);
  };

  const renderTimelineChart = () => {
    if (!timelineData) return null;

    const chartWidth = width - 40;
    const chartHeight = 200;
    const padding = 20;

    let data: HealthTrajectory;
    if (selectedMetric === 'overall') {
      data = timelineData.overallHealthScore;
    } else if (selectedMetric === 'diseases') {
      data = timelineData.diseaseRisks[selectedDisease as keyof typeof timelineData.diseaseRisks];
    } else {
      data = timelineData.biomarkerTrajectories[selectedDisease as keyof typeof timelineData.biomarkerTrajectories];
    }

    const years = ['Now', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const values = [
      data.currentValue,
      data.predictions.year1.value,
      data.predictions.year2.value,
      data.predictions.year3.value,
      data.predictions.year4.value,
      data.predictions.year5.value,
    ];

    const maxValue = Math.max(...values) * 1.2;
    const xStep = (chartWidth - 2 * padding) / 5;
    const yScale = (chartHeight - 2 * padding) / maxValue;

    // Calculate path
    let pathData = `M ${padding} ${chartHeight - padding - values[0] * yScale}`;
    for (let i = 1; i < values.length; i++) {
      pathData += ` L ${padding + i * xStep} ${chartHeight - padding - values[i] * yScale}`;
    }

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <Line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (i * (chartHeight - 2 * padding)) / 4}
              x2={chartWidth - padding}
              y2={padding + (i * (chartHeight - 2 * padding)) / 4}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))}

          {/* Confidence ranges (shaded areas) */}
          {values.map((value, index) => {
            if (index === 0) return null;
            const prediction = data.predictions[`year${index}` as keyof typeof data.predictions];
            const x = padding + index * xStep;
            const yMin = chartHeight - padding - prediction.range[0] * yScale;
            const yMax = chartHeight - padding - prediction.range[1] * yScale;
            return (
              <Rect
                key={`range-${index}`}
                x={x - 5}
                y={yMax}
                width={10}
                height={yMin - yMax}
                fill="#8b5cf6"
                opacity={0.1}
              />
            );
          })}

          {/* Trend line */}
          <Path
            d={pathData}
            stroke={data.trend === 'improving' ? '#10b981' : data.trend === 'declining' ? '#ef4444' : '#f59e0b'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Data points */}
          {values.map((value, index) => {
            const x = padding + index * xStep;
            const y = chartHeight - padding - value * yScale;
            return (
              <React.Fragment key={`point-${index}`}>
                <Circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={data.trend === 'improving' ? '#10b981' : data.trend === 'declining' ? '#ef4444' : '#f59e0b'}
                />
                <Circle cx={x} cy={y} r="3" fill="#fff" />
              </React.Fragment>
            );
          })}

          {/* X-axis labels */}
          {years.map((year, index) => (
            <SvgText
              key={`label-${index}`}
              x={padding + index * xStep}
              y={chartHeight - 5}
              fontSize="10"
              fill="#64748b"
              textAnchor="middle"
            >
              {year}
            </SvgText>
          ))}
        </Svg>
      </View>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'trending-down';
      case 'declining':
        return 'trending-up';
      default:
        return 'trending-flat';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '#10b981';
      case 'declining':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return '#10b981';
      case 'moderate':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      case 'critical':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={theme.gradients.primary.colors} style={styles.loadingGradient} accessible={false} importantForAccessibility="no-hide-descendants">
          <LoadingSpinner size="large" color="#fff" />
          <Typography variant="h4" color="inverse" weight="bold">
            Analyzing 5-Year Health Trajectory...
          </Typography>
          <Typography variant="bodySmall" color="inverse" style={styles.loadingSubtext}>
            Running longitudinal ML models
          </Typography>
        </LinearGradient>
      </View>
    );
  }

  if (!timelineData) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={theme.gradients.primary.colors} style={styles.header} accessible={false} importantForAccessibility="no-hide-descendants">
        <Typography variant="h1" color="inverse" weight="bold">
          Your Health Future
        </Typography>
        <Typography variant="bodySmall" color="inverse" style={styles.headerSubtitle}>
          3-5 Year Predictive Timeline
        </Typography>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Health predictive timeline" accessibilityRole="scrollview">
        {/* Metric Selector */}
        <View style={styles.metricSelectorContainer}>
          <TouchableOpacity
            style={[styles.metricButton, selectedMetric === 'overall' && styles.metricButtonActive]}
            onPress={() => setSelectedMetric('overall')}
            accessibilityRole="button"
            accessibilityLabel="Show overall health score"
            accessibilityState={{ selected: selectedMetric === 'overall' }}
            accessibilityHint="View 5-year overall health score trajectory"
          >
            <Typography
              variant="bodySmall"
              weight="semibold"
              style={[styles.metricButtonText, selectedMetric === 'overall' && styles.metricButtonTextActive]}
            >
              Overall Score
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.metricButton, selectedMetric === 'diseases' && styles.metricButtonActive]}
            onPress={() => setSelectedMetric('diseases')}
            accessibilityRole="button"
            accessibilityLabel="Show disease risks"
            accessibilityState={{ selected: selectedMetric === 'diseases' }}
            accessibilityHint="View 5-year disease risk predictions"
          >
            <Typography
              variant="bodySmall"
              weight="semibold"
              style={[styles.metricButtonText, selectedMetric === 'diseases' && styles.metricButtonTextActive]}
            >
              Disease Risks
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.metricButton, selectedMetric === 'biomarkers' && styles.metricButtonActive]}
            onPress={() => setSelectedMetric('biomarkers')}
            accessibilityRole="button"
            accessibilityLabel="Show biomarker trajectories"
            accessibilityState={{ selected: selectedMetric === 'biomarkers' }}
            accessibilityHint="View 5-year biomarker predictions"
          >
            <Typography
              variant="bodySmall"
              weight="semibold"
              style={[styles.metricButtonText, selectedMetric === 'biomarkers' && styles.metricButtonTextActive]}
            >
              Biomarkers
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Disease/Biomarker Selector (if not overall) */}
        {selectedMetric !== 'overall' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subSelectorContainer} accessibilityLabel="Select specific metric" accessibilityRole="scrollview">
            {selectedMetric === 'diseases'
              ? Object.keys(timelineData.diseaseRisks).map((disease) => (
                  <TouchableOpacity
                    key={disease}
                    style={[styles.subButton, selectedDisease === disease && styles.subButtonActive]}
                    onPress={() => setSelectedDisease(disease)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${disease}`}
                    accessibilityState={{ selected: selectedDisease === disease }}
                    accessibilityHint={`View ${disease} risk trajectory`}
                  >
                    <Typography
                      variant="caption"
                      weight="semibold"
                      style={[styles.subButtonText, selectedDisease === disease && styles.subButtonTextActive]}
                    >
                      {disease.charAt(0).toUpperCase() + disease.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Typography>
                  </TouchableOpacity>
                ))
              : Object.keys(timelineData.biomarkerTrajectories).map((biomarker) => (
                  <TouchableOpacity
                    key={biomarker}
                    style={[styles.subButton, selectedDisease === biomarker && styles.subButtonActive]}
                    onPress={() => setSelectedDisease(biomarker)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${biomarker}`}
                    accessibilityState={{ selected: selectedDisease === biomarker }}
                    accessibilityHint={`View ${biomarker} trajectory`}
                  >
                    <Typography
                      variant="caption"
                      weight="semibold"
                      style={[styles.subButtonText, selectedDisease === biomarker && styles.subButtonTextActive]}
                    >
                      {biomarker.charAt(0).toUpperCase() + biomarker.slice(1)}
                    </Typography>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        )}

        {/* Timeline Chart */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>{renderTimelineChart()}</Animated.View>

        {/* Current Status */}
        <Card elevated elevation="sm" padding="lg" style={styles.statusCard}>
          <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
            Current Status
          </Typography>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Typography variant="caption" color="secondary" style={styles.statusLabel}>
                Current Value
              </Typography>
              <Typography variant="h2" weight="bold" color="primary">
                {selectedMetric === 'overall'
                  ? timelineData.overallHealthScore.currentValue.toFixed(0)
                  : selectedMetric === 'diseases'
                  ? timelineData.diseaseRisks[selectedDisease as keyof typeof timelineData.diseaseRisks].currentValue.toFixed(0) + '%'
                  : timelineData.biomarkerTrajectories[
                      selectedDisease as keyof typeof timelineData.biomarkerTrajectories
                    ].currentValue.toFixed(1)}
              </Typography>
            </View>
            <View style={styles.statusItem}>
              <Typography variant="caption" color="secondary" style={styles.statusLabel}>
                5-Year Projection
              </Typography>
              <Typography variant="h2" weight="bold" style={{ color: getTrendColor(
                selectedMetric === 'overall'
                  ? timelineData.overallHealthScore.trend
                  : selectedMetric === 'diseases'
                  ? timelineData.diseaseRisks[selectedDisease as keyof typeof timelineData.diseaseRisks].trend
                  : timelineData.biomarkerTrajectories[selectedDisease as keyof typeof timelineData.biomarkerTrajectories].trend
              ) }}>
                {selectedMetric === 'overall'
                  ? timelineData.overallHealthScore.predictions.year5.value.toFixed(0)
                  : selectedMetric === 'diseases'
                  ? timelineData.diseaseRisks[selectedDisease as keyof typeof timelineData.diseaseRisks].predictions.year5.value.toFixed(0) + '%'
                  : timelineData.biomarkerTrajectories[
                      selectedDisease as keyof typeof timelineData.biomarkerTrajectories
                    ].predictions.year5.value.toFixed(1)}
              </Typography>
            </View>
            <View style={styles.statusItem}>
              <Ionicons
                name={getTrendIcon(
                  selectedMetric === 'overall'
                    ? timelineData.overallHealthScore.trend
                    : selectedMetric === 'diseases'
                    ? timelineData.diseaseRisks[selectedDisease as keyof typeof timelineData.diseaseRisks].trend
                    : timelineData.biomarkerTrajectories[selectedDisease as keyof typeof timelineData.biomarkerTrajectories].trend
                )}
                size={32}
                color={getTrendColor(
                  selectedMetric === 'overall'
                    ? timelineData.overallHealthScore.trend
                    : selectedMetric === 'diseases'
                    ? timelineData.diseaseRisks[selectedDisease as keyof typeof timelineData.diseaseRisks].trend
                    : timelineData.biomarkerTrajectories[selectedDisease as keyof typeof timelineData.biomarkerTrajectories].trend
                )}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="caption" color="secondary" align="center" style={styles.trendLabel}>
                {selectedMetric === 'overall'
                  ? timelineData.overallHealthScore.trend
                  : selectedMetric === 'diseases'
                  ? timelineData.diseaseRisks[selectedDisease as keyof typeof timelineData.diseaseRisks].trend
                  : timelineData.biomarkerTrajectories[selectedDisease as keyof typeof timelineData.biomarkerTrajectories].trend}
              </Typography>
            </View>
          </View>
        </Card>

        {/* Key Risk Factors */}
        <Card elevated elevation="sm" padding="lg" style={styles.riskFactorsCard}>
          <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
            Key Risk Factors
          </Typography>
          {timelineData.keyRiskFactors.map((factor, index) => (
            <View key={index} style={styles.riskFactorCard}>
              <View style={styles.riskFactorHeader}>
                <View style={styles.riskFactorInfo}>
                  <Typography variant="body" weight="semibold" color="primary">
                    {factor.factor}
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.riskFactorImpact}>
                    Current: {Math.round(factor.currentImpact * 100)}% → 5-Year: {Math.round(factor.projectedImpact * 100)}%
                  </Typography>
                </View>
                {factor.modifiable && (
                  <View style={styles.modifiableBadge}>
                    <Typography variant="caption" weight="semibold" style={styles.modifiableBadgeText}>
                      Modifiable
                    </Typography>
                  </View>
                )}
              </View>
              <View style={styles.impactBar}>
                <View style={[styles.impactBarCurrent, { width: `${factor.currentImpact * 100}%` }]} />
                <View style={[styles.impactBarProjected, { width: `${factor.projectedImpact * 100}%` }]} />
              </View>
              {factor.recommendations.map((rec, recIndex) => (
                <View key={recIndex} style={styles.recommendationRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" importantForAccessibility="no" accessible={false} />
                  <Typography variant="bodySmall" color="secondary" style={styles.recommendationText}>
                    {rec}
                  </Typography>
                </View>
              ))}
            </View>
          ))}
        </Card>

        {/* Intervention Scenarios */}
        <Card elevated elevation="sm" padding="lg" style={styles.interventionCard}>
          <View style={styles.sectionHeader}>
            <Typography variant="h4" weight="bold" color="primary">
              Intervention Scenarios
            </Typography>
            <TouchableOpacity
              onPress={() => setShowInterventions(!showInterventions)}
              accessibilityRole="button"
              accessibilityLabel={showInterventions ? 'Hide intervention scenarios' : 'Show intervention scenarios'}
              accessibilityState={{ expanded: showInterventions }}
              accessibilityHint={showInterventions ? 'Collapse intervention scenarios section' : 'Expand to view possible intervention outcomes'}
            >
              <Ionicons name={showInterventions ? 'chevron-up' : 'chevron-down'} size={24} color="#8b5cf6" importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          </View>

          {showInterventions &&
            timelineData.interventionScenarios.map((scenario, index) => (
              <View key={index} style={styles.scenarioCard}>
                <LinearGradient
                  colors={index === 2 ? ['#8b5cf6', '#7c3aed'] : ['#f8fafc', '#e2e8f0']}
                  style={styles.scenarioGradient}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  <View style={styles.scenarioHeader}>
                    <Typography
                      variant="body"
                      weight="bold"
                      color={index === 2 ? 'inverse' : 'primary'}
                    >
                      {scenario.scenario}
                    </Typography>
                    {index === 2 && (
                      <View style={styles.recommendedBadge}>
                        <Typography variant="caption" weight="semibold" color="inverse">
                          Recommended
                        </Typography>
                      </View>
                    )}
                  </View>
                  <Typography
                    variant="bodySmall"
                    color={index === 2 ? 'inverse' : 'secondary'}
                    style={styles.scenarioDescription}
                  >
                    {scenario.description}
                  </Typography>
                  <View style={styles.improvementsRow}>
                    <View style={styles.improvementItem}>
                      <Typography
                        variant="caption"
                        color={index === 2 ? 'inverse' : 'secondary'}
                        style={index === 2 && styles.improvementLabelInverse}
                      >
                        Year 3
                      </Typography>
                      <Typography
                        variant="h3"
                        weight="bold"
                        color={index === 2 ? 'inverse' : 'primary'}
                      >
                        +{scenario.projectedImprovements.year3}%
                      </Typography>
                    </View>
                    <View style={styles.improvementItem}>
                      <Typography
                        variant="caption"
                        color={index === 2 ? 'inverse' : 'secondary'}
                        style={index === 2 && styles.improvementLabelInverse}
                      >
                        Year 5
                      </Typography>
                      <Typography
                        variant="h3"
                        weight="bold"
                        color={index === 2 ? 'inverse' : 'primary'}
                      >
                        +{scenario.projectedImprovements.year5}%
                      </Typography>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
        </Card>

        {/* Confidence Note */}
        <View style={styles.confidenceCard}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info} importantForAccessibility="no" accessible={false} />
          <Typography variant="bodySmall" style={styles.confidenceText}>
            Predictions based on LSTM + Transformer models with 68-88% confidence. Uncertainty increases with time horizon.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingSubtext: {
    opacity: 0.9,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerSubtitle: {
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  metricSelectorContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  metricButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  metricButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  metricButtonText: {
    color: theme.colors.textSecondary,
  },
  metricButtonTextActive: {
    color: theme.colors.textInverse,
  },
  subSelectorContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  subButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundAlt,
    marginRight: theme.spacing.xs,
  },
  subButtonActive: {
    backgroundColor: '#ddd6fe',
  },
  subButtonText: {
    color: theme.colors.textSecondary,
  },
  subButtonTextActive: {
    color: '#6b21a8',
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    marginTop: 0,
    borderRadius: theme.borderRadius.lg,
  },
  statusCard: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  riskFactorsCard: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  interventionCard: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing.sm,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  trendLabel: {
    marginTop: theme.spacing.xxs,
  },
  riskFactorCard: {
    backgroundColor: theme.colors.backgroundAlt,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  riskFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  riskFactorInfo: {
    flex: 1,
  },
  riskFactorImpact: {
    marginTop: theme.spacing.xxs,
  },
  modifiableBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
  },
  modifiableBadgeText: {
    color: '#065f46',
  },
  impactBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.xs,
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  impactBarCurrent: {
    position: 'absolute',
    height: 8,
    backgroundColor: theme.colors.warning,
    borderRadius: theme.borderRadius.xs,
    opacity: 0.5,
  },
  impactBarProjected: {
    position: 'absolute',
    height: 8,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.xs,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  recommendationText: {
    flex: 1,
    lineHeight: 18,
  },
  scenarioCard: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  scenarioGradient: {
    padding: theme.spacing.md,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
  },
  scenarioDescription: {
    marginBottom: theme.spacing.sm,
  },
  improvementsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  improvementItem: {
    alignItems: 'center',
  },
  improvementLabelInverse: {
    opacity: 0.8,
  },
  confidenceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    margin: theme.spacing.md,
    marginTop: 0,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  confidenceText: {
    flex: 1,
    color: '#1e40af',
    lineHeight: 18,
  },
});

export default PredictiveTimelineScreen;
