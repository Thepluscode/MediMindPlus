import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { Typography, LoadingSpinner } from '../components/ui';

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface AIModel {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  status: 'active' | 'training' | 'deprecated';
  metrics: ModelMetrics;
  featureImportance: FeatureImportance[];
  lastUpdated: string;
  trainingDataSize: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const AIPredictionModelsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/ml/models`);
      setModels(response.data.models);
    } catch (error) {
      // Use mock data for demo
      setModels(mockModels);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'training':
        return '#FFC107';
      case 'deprecated':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 0.9) return '#4CAF50';
    if (value >= 0.75) return '#8BC34A';
    if (value >= 0.6) return '#FFC107';
    return '#F44336';
  };

  const renderModelCard = (model: AIModel) => (
    <TouchableOpacity
      key={model.id}
      style={[styles.modelCard, { borderLeftColor: model.color }]}
      onPress={() => {
        setSelectedModel(model);
        setShowDetails(true);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${model.name}. ${model.category}. ${model.status} status. ${(model.metrics.accuracy * 100).toFixed(1)}% accuracy. Tap to view details.`}
    >
      <View style={styles.modelHeader}>
        <View style={[styles.iconContainer, { backgroundColor: model.color + '20' }]}>
          <Ionicons name={model.icon} size={32} color={model.color} importantForAccessibility="no" accessible={false} />
        </View>
        <View style={styles.modelInfo}>
          <Typography variant="body" weight="bold" style={styles.modelName}>
            {model.name}
          </Typography>
          <Typography variant="caption" color="secondary" style={styles.modelCategory}>
            {model.category}
          </Typography>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(model.status) }]}>
          <Typography variant="caption" weight="bold" style={styles.statusText}>
            {model.status.toUpperCase()}
          </Typography>
        </View>
      </View>

      <Typography variant="body" color="secondary" style={styles.modelDescription}>
        {model.description}
      </Typography>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Typography variant="caption" color="secondary" style={styles.metricLabel}>
            Accuracy
          </Typography>
          <Typography variant="body" weight="bold" style={[styles.metricValue, { color: getMetricColor(model.metrics.accuracy) }]}>
            {(model.metrics.accuracy * 100).toFixed(1)}%
          </Typography>
        </View>
        <View style={styles.metricItem}>
          <Typography variant="caption" color="secondary" style={styles.metricLabel}>
            Precision
          </Typography>
          <Typography variant="body" weight="bold" style={[styles.metricValue, { color: getMetricColor(model.metrics.precision) }]}>
            {(model.metrics.precision * 100).toFixed(1)}%
          </Typography>
        </View>
        <View style={styles.metricItem}>
          <Typography variant="caption" color="secondary" style={styles.metricLabel}>
            AUC
          </Typography>
          <Typography variant="body" weight="bold" style={[styles.metricValue, { color: getMetricColor(model.metrics.auc) }]}>
            {model.metrics.auc.toFixed(3)}
          </Typography>
        </View>
      </View>

      <View style={styles.modelFooter}>
        <Typography variant="caption" weight="semibold" style={styles.versionText}>
          v{model.version}
        </Typography>
        <Typography variant="caption" color="secondary" style={styles.updatedText}>
          Updated: {new Date(model.lastUpdated).toLocaleDateString()}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const renderModelDetails = () => {
    if (!selectedModel) return null;

    const screenWidth = Dimensions.get('window').width;
    const chartConfig = {
      backgroundColor: '#FFFFFF',
      backgroundGradientFrom: '#FFFFFF',
      backgroundGradientTo: '#FFFFFF',
      decimalPlaces: 2,
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#2196F3',
      },
    };

    return (
      <View style={styles.detailsOverlay}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <Typography variant="h3" weight="bold" style={styles.detailsTitle}>
              {selectedModel.name}
            </Typography>
            <TouchableOpacity
              onPress={() => setShowDetails(false)}
              accessibilityRole="button"
              accessibilityLabel="Close model details"
              accessibilityHint="Close modal and return to models list"
            >
              <Ionicons name="close" size={28} color={theme.colors.textPrimary} importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false} accessibilityLabel="Model details and metrics" accessibilityRole="scrollview">
            {/* Model Overview */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
                Model Overview
              </Typography>
              <View style={styles.overviewGrid}>
                <View style={styles.overviewItem}>
                  <Typography variant="caption" color="secondary" style={styles.overviewLabel}>
                    Version
                  </Typography>
                  <Typography variant="body" weight="bold" style={styles.overviewValue}>
                    {selectedModel.version}
                  </Typography>
                </View>
                <View style={styles.overviewItem}>
                  <Typography variant="caption" color="secondary" style={styles.overviewLabel}>
                    Status
                  </Typography>
                  <Typography
                    variant="body"
                    weight="bold"
                    style={[
                      styles.overviewValue,
                      { color: getStatusColor(selectedModel.status) },
                    ]}
                  >
                    {selectedModel.status}
                  </Typography>
                </View>
                <View style={styles.overviewItem}>
                  <Typography variant="caption" color="secondary" style={styles.overviewLabel}>
                    Training Data
                  </Typography>
                  <Typography variant="body" weight="bold" style={styles.overviewValue}>
                    {selectedModel.trainingDataSize.toLocaleString()}
                  </Typography>
                </View>
                <View style={styles.overviewItem}>
                  <Typography variant="caption" color="secondary" style={styles.overviewLabel}>
                    Last Updated
                  </Typography>
                  <Typography variant="body" weight="bold" style={styles.overviewValue}>
                    {new Date(selectedModel.lastUpdated).toLocaleDateString()}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
                Performance Metrics
              </Typography>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Typography variant="body" color="secondary" style={styles.metricCardLabel}>
                    Accuracy
                  </Typography>
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={[
                      styles.metricCardValue,
                      { color: getMetricColor(selectedModel.metrics.accuracy) },
                    ]}
                  >
                    {(selectedModel.metrics.accuracy * 100).toFixed(2)}%
                  </Typography>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        {
                          width: `${selectedModel.metrics.accuracy * 100}%`,
                          backgroundColor: getMetricColor(selectedModel.metrics.accuracy),
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metricCard}>
                  <Typography variant="body" color="secondary" style={styles.metricCardLabel}>
                    Precision
                  </Typography>
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={[
                      styles.metricCardValue,
                      { color: getMetricColor(selectedModel.metrics.precision) },
                    ]}
                  >
                    {(selectedModel.metrics.precision * 100).toFixed(2)}%
                  </Typography>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        {
                          width: `${selectedModel.metrics.precision * 100}%`,
                          backgroundColor: getMetricColor(selectedModel.metrics.precision),
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metricCard}>
                  <Typography variant="body" color="secondary" style={styles.metricCardLabel}>
                    Recall
                  </Typography>
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={[
                      styles.metricCardValue,
                      { color: getMetricColor(selectedModel.metrics.recall) },
                    ]}
                  >
                    {(selectedModel.metrics.recall * 100).toFixed(2)}%
                  </Typography>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        {
                          width: `${selectedModel.metrics.recall * 100}%`,
                          backgroundColor: getMetricColor(selectedModel.metrics.recall),
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metricCard}>
                  <Typography variant="body" color="secondary" style={styles.metricCardLabel}>
                    F1 Score
                  </Typography>
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={[
                      styles.metricCardValue,
                      { color: getMetricColor(selectedModel.metrics.f1Score) },
                    ]}
                  >
                    {selectedModel.metrics.f1Score.toFixed(3)}
                  </Typography>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        {
                          width: `${selectedModel.metrics.f1Score * 100}%`,
                          backgroundColor: getMetricColor(selectedModel.metrics.f1Score),
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metricCard}>
                  <Typography variant="body" color="secondary" style={styles.metricCardLabel}>
                    AUC-ROC
                  </Typography>
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={[
                      styles.metricCardValue,
                      { color: getMetricColor(selectedModel.metrics.auc) },
                    ]}
                  >
                    {selectedModel.metrics.auc.toFixed(3)}
                  </Typography>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        {
                          width: `${selectedModel.metrics.auc * 100}%`,
                          backgroundColor: getMetricColor(selectedModel.metrics.auc),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Feature Importance */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
                Feature Importance
              </Typography>
              <BarChart
                data={{
                  labels: selectedModel.featureImportance.slice(0, 5).map((f) => f.feature),
                  datasets: [
                    {
                      data: selectedModel.featureImportance.slice(0, 5).map((f) => f.importance),
                    },
                  ],
                }}
                width={screenWidth - 80}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
              />
            </View>

            {/* ML Pipeline */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
                ML Pipeline
              </Typography>
              <View style={styles.pipelineContainer}>
                <View style={styles.pipelineStep}>
                  <View style={[styles.pipelineIcon, { backgroundColor: theme.colors.primaryLight }]}>
                    <Ionicons name="document-text" size={24} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
                  </View>
                  <Typography variant="caption" weight="semibold" style={styles.pipelineStepTitle}>
                    Data Collection
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.pipelineStepDesc}>
                    Aggregate health records
                  </Typography>
                </View>

                <Ionicons name="arrow-forward" size={20} color={theme.colors.textLight} style={{ marginTop: 20 }} importantForAccessibility="no" accessible={false} />

                <View style={styles.pipelineStep}>
                  <View style={[styles.pipelineIcon, { backgroundColor: theme.colors.warningLight }]}>
                    <Ionicons name="build" size={24} color={theme.colors.warning} importantForAccessibility="no" accessible={false} />
                  </View>
                  <Typography variant="caption" weight="semibold" style={styles.pipelineStepTitle}>
                    Preprocessing
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.pipelineStepDesc}>
                    Clean & normalize
                  </Typography>
                </View>

                <Ionicons name="arrow-forward" size={20} color={theme.colors.textLight} style={{ marginTop: 20 }} importantForAccessibility="no" accessible={false} />

                <View style={styles.pipelineStep}>
                  <View style={[styles.pipelineIcon, { backgroundColor: '#F3E5F5' }]}>
                    <Ionicons name="analytics" size={24} color="#9C27B0" importantForAccessibility="no" accessible={false} />
                  </View>
                  <Typography variant="caption" weight="semibold" style={styles.pipelineStepTitle}>
                    Training
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.pipelineStepDesc}>
                    Model optimization
                  </Typography>
                </View>

                <Ionicons name="arrow-forward" size={20} color={theme.colors.textLight} style={{ marginTop: 20 }} importantForAccessibility="no" accessible={false} />

                <View style={styles.pipelineStep}>
                  <View style={[styles.pipelineIcon, { backgroundColor: theme.colors.successLight }]}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                  </View>
                  <Typography variant="caption" weight="semibold" style={styles.pipelineStepTitle}>
                    Deployment
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.pipelineStepDesc}>
                    Production ready
                  </Typography>
                </View>
              </View>
            </View>

            {/* Explainability */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
                Model Explainability
              </Typography>
              <View style={styles.explainabilityContainer}>
                <View style={styles.explainabilityMethod}>
                  <Ionicons name="bulb" size={24} color={theme.colors.warning} importantForAccessibility="no" accessible={false} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="semibold" style={styles.explainabilityTitle}>
                      SHAP Values
                    </Typography>
                    <Typography variant="caption" color="secondary" style={styles.explainabilityDesc}>
                      Shapley Additive Explanations for individual predictions
                    </Typography>
                  </View>
                </View>

                <View style={styles.explainabilityMethod}>
                  <Ionicons name="eye" size={24} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="semibold" style={styles.explainabilityTitle}>
                      LIME
                    </Typography>
                    <Typography variant="caption" color="secondary" style={styles.explainabilityDesc}>
                      Local Interpretable Model-agnostic Explanations
                    </Typography>
                  </View>
                </View>

                <View style={styles.explainabilityMethod}>
                  <Ionicons name="stats-chart" size={24} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="semibold" style={styles.explainabilityTitle}>
                      Feature Attribution
                    </Typography>
                    <Typography variant="caption" color="secondary" style={styles.explainabilityDesc}>
                      Contribution analysis for each input feature
                    </Typography>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading AI models..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold" style={styles.headerTitle}>
          AI Prediction Models
        </Typography>
        <TouchableOpacity
          onPress={fetchModels}
          accessibilityRole="button"
          accessibilityLabel="Refresh models"
          accessibilityHint="Reload AI models list from server"
        >
          <Ionicons name="refresh" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Typography variant="h3" weight="bold" style={styles.statValue}>
            {models.length}
          </Typography>
          <Typography variant="caption" color="secondary" style={styles.statLabel}>
            Total Models
          </Typography>
        </View>
        <View style={styles.statCard}>
          <Typography variant="h3" weight="bold" style={styles.statValue}>
            {models.filter((m) => m.status === 'active').length}
          </Typography>
          <Typography variant="caption" color="secondary" style={styles.statLabel}>
            Active
          </Typography>
        </View>
        <View style={styles.statCard}>
          <Typography variant="h3" weight="bold" style={styles.statValue}>
            {(
              models.reduce((sum, m) => sum + m.metrics.accuracy, 0) / models.length
            ).toFixed(1)}
            %
          </Typography>
          <Typography variant="caption" color="secondary" style={styles.statLabel}>
            Avg Accuracy
          </Typography>
        </View>
      </View>

      {/* Models List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="AI prediction models list" accessibilityRole="scrollview">
        <Typography variant="h3" weight="bold" style={styles.sectionHeader}>
          Available Models
        </Typography>
        {models.map(renderModelCard)}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Model Details Modal */}
      {showDetails && renderModelDetails()}
    </View>
  );
};

// Mock data for demo
const mockModels: AIModel[] = [
  {
    id: '1',
    name: 'Cardiovascular Risk Predictor',
    category: 'Cardiovascular',
    description: 'Predicts 10-year risk of heart disease using clinical and lifestyle factors',
    version: '2.3.1',
    status: 'active',
    metrics: {
      accuracy: 0.92,
      precision: 0.89,
      recall: 0.87,
      f1Score: 0.88,
      auc: 0.94,
    },
    featureImportance: [
      { feature: 'Age', importance: 0.25 },
      { feature: 'Blood Pressure', importance: 0.22 },
      { feature: 'Cholesterol', importance: 0.18 },
      { feature: 'Smoking', importance: 0.15 },
      { feature: 'BMI', importance: 0.12 },
      { feature: 'Exercise', importance: 0.08 },
    ],
    lastUpdated: '2024-10-01T00:00:00Z',
    trainingDataSize: 125000,
    icon: 'heart',
    color: '#F44336',
  },
  {
    id: '2',
    name: 'Diabetes Risk Assessment',
    category: 'Metabolic',
    description: 'Early detection of Type 2 diabetes using metabolic biomarkers',
    version: '3.1.0',
    status: 'active',
    metrics: {
      accuracy: 0.88,
      precision: 0.85,
      recall: 0.83,
      f1Score: 0.84,
      auc: 0.91,
    },
    featureImportance: [
      { feature: 'Glucose', importance: 0.28 },
      { feature: 'HbA1c', importance: 0.24 },
      { feature: 'BMI', importance: 0.19 },
      { feature: 'Family History', importance: 0.14 },
      { feature: 'Age', importance: 0.10 },
      { feature: 'Waist Circumference', importance: 0.05 },
    ],
    lastUpdated: '2024-09-28T00:00:00Z',
    trainingDataSize: 98000,
    icon: 'water',
    color: '#2196F3',
  },
  {
    id: '3',
    name: 'Cancer Screening AI',
    category: 'Oncology',
    description: 'Multi-cancer detection from imaging and biomarker data',
    version: '1.8.2',
    status: 'active',
    metrics: {
      accuracy: 0.95,
      precision: 0.93,
      recall: 0.91,
      f1Score: 0.92,
      auc: 0.96,
    },
    featureImportance: [
      { feature: 'Tumor Markers', importance: 0.32 },
      { feature: 'Imaging Features', importance: 0.28 },
      { feature: 'Age', importance: 0.15 },
      { feature: 'Genetic Markers', importance: 0.12 },
      { feature: 'Lifestyle Factors', importance: 0.08 },
      { feature: 'Environmental', importance: 0.05 },
    ],
    lastUpdated: '2024-10-05T00:00:00Z',
    trainingDataSize: 215000,
    icon: 'cellular',
    color: '#9C27B0',
  },
  {
    id: '4',
    name: 'Cognitive Decline Detector',
    category: 'Neurology',
    description: 'Early warning system for dementia and cognitive impairment',
    version: '2.0.5',
    status: 'active',
    metrics: {
      accuracy: 0.86,
      precision: 0.84,
      recall: 0.82,
      f1Score: 0.83,
      auc: 0.89,
    },
    featureImportance: [
      { feature: 'Memory Tests', importance: 0.30 },
      { feature: 'Age', importance: 0.22 },
      { feature: 'Brain MRI', importance: 0.18 },
      { feature: 'Genetics', importance: 0.15 },
      { feature: 'Education', importance: 0.10 },
      { feature: 'Social Activity', importance: 0.05 },
    ],
    lastUpdated: '2024-09-22T00:00:00Z',
    trainingDataSize: 67000,
    icon: 'brain',
    color: '#FF9800',
  },
  {
    id: '5',
    name: 'Mental Health Monitor',
    category: 'Psychiatry',
    description: 'Depression and anxiety risk assessment from behavioral patterns',
    version: '1.5.3',
    status: 'active',
    metrics: {
      accuracy: 0.81,
      precision: 0.79,
      recall: 0.77,
      f1Score: 0.78,
      auc: 0.85,
    },
    featureImportance: [
      { feature: 'Sleep Patterns', importance: 0.26 },
      { feature: 'Activity Level', importance: 0.22 },
      { feature: 'Social Interaction', importance: 0.18 },
      { feature: 'Heart Rate Variability', importance: 0.15 },
      { feature: 'Screen Time', importance: 0.12 },
      { feature: 'Voice Patterns', importance: 0.07 },
    ],
    lastUpdated: '2024-09-30T00:00:00Z',
    trainingDataSize: 54000,
    icon: 'happy',
    color: '#4CAF50',
  },
  {
    id: '6',
    name: 'Infectious Disease Predictor',
    category: 'Infectious Disease',
    description: 'Early detection of flu, COVID-19, and other infections',
    version: '3.2.1',
    status: 'active',
    metrics: {
      accuracy: 0.90,
      precision: 0.88,
      recall: 0.86,
      f1Score: 0.87,
      auc: 0.92,
    },
    featureImportance: [
      { feature: 'Temperature', importance: 0.28 },
      { feature: 'Symptoms', importance: 0.24 },
      { feature: 'Heart Rate', importance: 0.18 },
      { feature: 'Respiratory Rate', importance: 0.16 },
      { feature: 'Exposure Risk', importance: 0.10 },
      { feature: 'Immune Markers', importance: 0.04 },
    ],
    lastUpdated: '2024-10-07T00:00:00Z',
    trainingDataSize: 180000,
    icon: 'shield-checkmark',
    color: '#00BCD4',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  modelCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  modelCategory: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  modelDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  updatedText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  detailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  detailsContent: {
    padding: theme.spacing.lg,
  },
  detailsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  overviewItem: {
    width: '48%',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  overviewLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  metricsGrid: {
    gap: theme.spacing.sm,
  },
  metricCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  metricCardLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  metricCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  metricBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.xs,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
  },
  pipelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  pipelineStep: {
    alignItems: 'center',
    width: 70,
  },
  pipelineIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  pipelineStepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  pipelineStepDesc: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  explainabilityContainer: {
    gap: theme.spacing.md,
  },
  explainabilityMethod: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  explainabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  explainabilityDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
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
});

export default AIPredictionModelsScreen;
