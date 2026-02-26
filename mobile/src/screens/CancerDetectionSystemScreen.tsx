import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

interface CancerType {
  id: string;
  name: string;
  riskScore: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  biomarkers: Biomarker[];
  screeningStatus: {
    lastScreening: string | null;
    nextDue: string;
    overdue: boolean;
  };
  riskFactors: RiskFactor[];
}

interface Biomarker {
  name: string;
  value: number;
  unit: string;
  normalRange: string;
  status: 'normal' | 'borderline' | 'elevated';
}

interface RiskFactor {
  name: string;
  present: boolean;
  impact: 'low' | 'moderate' | 'high';
}

interface GeneticRisk {
  tested: boolean;
  mutations: {
    gene: string;
    status: 'positive' | 'negative' | 'vus';
    description: string;
  }[];
}

const CancerDetectionSystemScreen: React.FC = () => {
  const navigation = useNavigation();
  const [cancerTypes, setCancerTypes] = useState<CancerType[]>([]);
  const [geneticRisk, setGeneticRisk] = useState<GeneticRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCancer, setSelectedCancer] = useState<CancerType | null>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchCancerData();
  }, []);

  const fetchCancerData = async () => {
    try {
      const [cancerResponse, geneticResponse] = await Promise.all([
        axios.get(`${API_URL}/api/cancer/screening`),
        axios.get(`${API_URL}/api/cancer/genetic-risk`),
      ]);

      setCancerTypes(cancerResponse.data.cancers);
      setGeneticRisk(geneticResponse.data);
    } catch (error) {
      // Use mock data for demo
      if (__DEV__) {
        setCancerTypes(mockCancerData);
        setGeneticRisk(mockGeneticData);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'low':
        return theme.colors.success;
      case 'moderate':
        return theme.colors.warning;
      case 'high':
        return '#FF9800';
      case 'very_high':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getBiomarkerStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return theme.colors.success;
      case 'borderline':
        return theme.colors.warning;
      case 'elevated':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const scheduleScreening = (cancerType: string) => {
    Alert.alert(
      'Schedule Screening',
      `Would you like to schedule a ${cancerType} screening?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule',
          onPress: () => {
            // Navigate to appointment scheduling
            Alert.alert('Success', 'Screening appointment request sent to your provider.');
          },
        },
      ]
    );
  };

  const renderCancerCard = (cancer: CancerType) => (
    <Card
      key={cancer.id}
      elevated
      elevation="md"
      padding="lg"
      style={[styles.cancerCard, { borderLeftColor: cancer.color }]}
      onPress={() => setSelectedCancer(cancer)}
      accessibilityRole="button"
      accessibilityLabel={`${cancer.name} risk assessment card`}
    >
      <View style={styles.cancerHeader}>
        <View style={[styles.cancerIconContainer, { backgroundColor: cancer.color + '20' }]}>
          <Ionicons name={cancer.icon} size={32} color={cancer.color} importantForAccessibility="no" accessible={false} />
        </View>
        <View style={styles.cancerInfo}>
          <Typography variant="body" weight="bold" style={styles.cancerName}>
            {cancer.name}
          </Typography>
          <Typography
            variant="caption"
            weight="semibold"
            style={[styles.riskCategory, { color: getRiskColor(cancer.riskCategory) }]}
          >
            {cancer.riskCategory.replace('_', ' ').toUpperCase()} RISK
          </Typography>
        </View>
        <Typography
          variant="h2"
          weight="bold"
          style={[styles.riskScore, { color: getRiskColor(cancer.riskCategory) }]}
        >
          {cancer.riskScore}%
        </Typography>
      </View>

      <View style={styles.screeningStatus}>
        <View style={styles.statusItem}>
          <Typography variant="body" color="secondary">
            Last Screening:
          </Typography>
          <Typography variant="body" weight="semibold">
            {cancer.screeningStatus.lastScreening
              ? new Date(cancer.screeningStatus.lastScreening).toLocaleDateString()
              : 'Never'}
          </Typography>
        </View>
        <View style={styles.statusItem}>
          <Typography variant="body" color="secondary">
            Next Due:
          </Typography>
          <Typography
            variant="body"
            weight="semibold"
            style={cancer.screeningStatus.overdue && { color: theme.colors.error }}
          >
            {new Date(cancer.screeningStatus.nextDue).toLocaleDateString()}
            {cancer.screeningStatus.overdue && ' (Overdue)'}
          </Typography>
        </View>
      </View>

      {cancer.screeningStatus.overdue && (
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() => scheduleScreening(cancer.name)}
          accessibilityRole="button"
          accessibilityLabel={`Schedule ${cancer.name} screening`}
          accessibilityHint="Request appointment for overdue cancer screening"
        >
          <Ionicons name="calendar" size={16} color="#FFFFFF" importantForAccessibility="no" accessible={false} />
          <Typography variant="body" weight="bold" style={styles.scheduleButtonText}>
            Schedule Screening
          </Typography>
        </TouchableOpacity>
      )}
    </Card>
  );

  const renderCancerDetails = () => {
    if (!selectedCancer) return null;

    return (
      <View style={styles.detailsOverlay}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <Typography variant="h3" weight="bold" style={styles.detailsTitle}>
              {selectedCancer.name}
            </Typography>
            <TouchableOpacity
              onPress={() => setSelectedCancer(null)}
              accessibilityRole="button"
              accessibilityLabel="Close cancer details"
              accessibilityHint="Dismiss detailed cancer information modal"
            >
              <Ionicons name="close" size={28} color={theme.colors.textPrimary} importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false} accessibilityLabel="Cancer details" accessibilityRole="scrollview">
            {/* Risk Score */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
                Risk Assessment
              </Typography>
              <View style={styles.riskScoreCard}>
                <Typography
                  style={[
                    styles.detailsRiskScore,
                    { color: getRiskColor(selectedCancer.riskCategory) },
                  ]}
                >
                  {selectedCancer.riskScore}%
                </Typography>
                <Typography
                  variant="body"
                  weight="semibold"
                  style={[
                    styles.detailsRiskCategory,
                    { color: getRiskColor(selectedCancer.riskCategory) },
                  ]}
                >
                  {selectedCancer.riskCategory.replace('_', ' ').toUpperCase()} RISK
                </Typography>
                <View style={styles.riskBar}>
                  <View
                    style={[
                      styles.riskBarFill,
                      {
                        width: `${selectedCancer.riskScore}%`,
                        backgroundColor: getRiskColor(selectedCancer.riskCategory),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Biomarkers */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
                Biomarkers
              </Typography>
              {selectedCancer.biomarkers.map((biomarker, index) => (
                <View key={index} style={styles.biomarkerCard}>
                  <View style={styles.biomarkerHeader}>
                    <Typography variant="body" weight="semibold" style={styles.biomarkerName}>
                      {biomarker.name}
                    </Typography>
                    <View
                      style={[
                        styles.biomarkerStatus,
                        { backgroundColor: getBiomarkerStatusColor(biomarker.status) },
                      ]}
                    >
                      <Typography variant="caption" weight="bold" style={styles.biomarkerStatusText}>
                        {biomarker.status.toUpperCase()}
                      </Typography>
                    </View>
                  </View>
                  <View style={styles.biomarkerInfo}>
                    <Typography variant="body" weight="bold" style={styles.biomarkerValue}>
                      {biomarker.value} {biomarker.unit}
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.biomarkerRange}>
                      Normal: {biomarker.normalRange}
                    </Typography>
                  </View>
                </View>
              ))}
            </View>

            {/* Risk Factors */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
                Risk Factors
              </Typography>
              {selectedCancer.riskFactors.map((factor, index) => (
                <View key={index} style={styles.riskFactorItem}>
                  <Ionicons
                    name={factor.present ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={factor.present ? theme.colors.error : theme.colors.textSecondary}
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Typography
                    variant="body"
                    style={[
                      styles.riskFactorText,
                      factor.present && { color: theme.colors.error, fontWeight: '600' },
                    ]}
                  >
                    {factor.name}
                  </Typography>
                  {factor.present && (
                    <View
                      style={[
                        styles.impactBadge,
                        {
                          backgroundColor:
                            factor.impact === 'high'
                              ? theme.colors.error
                              : factor.impact === 'moderate'
                              ? theme.colors.warning
                              : theme.colors.success,
                        },
                      ]}
                    >
                      <Typography variant="caption" weight="bold" style={styles.impactText}>
                        {factor.impact}
                      </Typography>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Prevention Strategies */}
            <View style={styles.detailsSection}>
              <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
                Prevention Strategies
              </Typography>
              <View style={styles.preventionList}>
                <Typography variant="body" color="secondary" style={styles.preventionItem}>
                  • Regular screening as recommended
                </Typography>
                <Typography variant="body" color="secondary" style={styles.preventionItem}>
                  • Maintain healthy weight (BMI 18.5-24.9)
                </Typography>
                <Typography variant="body" color="secondary" style={styles.preventionItem}>
                  • Exercise 150+ minutes per week
                </Typography>
                <Typography variant="body" color="secondary" style={styles.preventionItem}>
                  • Limit alcohol consumption
                </Typography>
                <Typography variant="body" color="secondary" style={styles.preventionItem}>
                  • Avoid tobacco and smoking
                </Typography>
                <Typography variant="body" color="secondary" style={styles.preventionItem}>
                  • Eat a balanced diet rich in fruits/vegetables
                </Typography>
                <Typography variant="body" color="secondary" style={styles.preventionItem}>
                  • Manage stress levels
                </Typography>
                <Typography variant="body" color="secondary" style={styles.preventionItem}>
                  • Get adequate sleep (7-9 hours)
                </Typography>
              </View>
            </View>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => scheduleScreening(selectedCancer.name)}
              accessibilityRole="button"
              accessibilityLabel={`Schedule ${selectedCancer.name} screening`}
              accessibilityHint="Request appointment with healthcare provider for cancer screening"
            >
              <Typography variant="body" weight="bold" style={styles.detailsButtonText}>
                Schedule Screening
              </Typography>
            </TouchableOpacity>
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
        text="Loading cancer screening data..."
        color="#9C27B0"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold" color="primary">
          Cancer Detection
        </Typography>
        <TouchableOpacity
          onPress={fetchCancerData}
          accessibilityRole="button"
          accessibilityLabel="Refresh cancer data"
          accessibilityHint="Reload cancer screening and risk assessment data"
        >
          <Ionicons name="refresh" size={24} color={theme.colors.textPrimary} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Cancer screening dashboard" accessibilityRole="scrollview">
        {/* Overview Stats */}
        <Card elevated elevation="sm" padding="lg" style={styles.overviewCard}>
          <Typography variant="h4" weight="bold" color="primary" style={styles.overviewTitle}>
            Screening Overview
          </Typography>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Typography variant="h2" weight="bold" color="info">
                {cancerTypes.length}
              </Typography>
              <Typography variant="body" color="secondary">
                Cancer Types
              </Typography>
            </View>
            <View style={styles.overviewStat}>
              <Typography variant="h2" weight="bold" style={{ color: theme.colors.error }}>
                {cancerTypes.filter((c) => c.screeningStatus.overdue).length}
              </Typography>
              <Typography variant="body" color="secondary">
                Overdue
              </Typography>
            </View>
            <View style={styles.overviewStat}>
              <Typography variant="h2" weight="bold" style={{ color: theme.colors.success }}>
                {cancerTypes.filter((c) => !c.screeningStatus.overdue).length}
              </Typography>
              <Typography variant="body" color="secondary">
                Up to Date
              </Typography>
            </View>
          </View>
        </Card>

        {/* Cancer Types */}
        <Typography variant="h3" weight="bold" color="primary" style={styles.sectionHeader}>
          Cancer Screening Status
        </Typography>
        {cancerTypes.map(renderCancerCard)}

        {/* Genetic Risk */}
        {geneticRisk && (
          <Card elevated elevation="sm" padding="lg" style={styles.geneticCard}>
            <Typography variant="h3" weight="bold" color="primary" style={styles.sectionHeader}>
              Genetic Risk Assessment
            </Typography>
            {!geneticRisk.tested ? (
              <View style={styles.geneticNotTested}>
                <Ionicons name="dna" size={48} color="#9C27B0" importantForAccessibility="no" accessible={false} />
                <Typography variant="body" weight="bold" style={styles.geneticNotTestedText}>
                  No genetic testing on file
                </Typography>
                <Typography variant="body" color="secondary" style={styles.geneticNotTestedDesc}>
                  Genetic testing can identify inherited mutations that increase cancer risk
                </Typography>
                <TouchableOpacity
                  style={styles.geneticTestButton}
                  onPress={() =>
                    Alert.alert(
                      'Genetic Testing',
                      'Contact your healthcare provider to discuss genetic testing options.'
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Learn about genetic testing"
                  accessibilityHint="View information about genetic cancer risk testing options"
                >
                  <Typography variant="body" weight="semibold" style={styles.geneticTestButtonText}>
                    Learn About Genetic Testing
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.geneticTested}>
                {geneticRisk.mutations.map((mutation, index) => (
                  <View key={index} style={styles.mutationCard}>
                    <View style={styles.mutationHeader}>
                      <Typography variant="body" weight="bold" style={styles.mutationGene}>
                        {mutation.gene}
                      </Typography>
                      <View
                        style={[
                          styles.mutationStatus,
                          {
                            backgroundColor:
                              mutation.status === 'positive'
                                ? theme.colors.error
                                : mutation.status === 'negative'
                                ? theme.colors.success
                                : theme.colors.warning,
                          },
                        ]}
                      >
                        <Typography variant="caption" weight="bold" style={styles.mutationStatusText}>
                          {mutation.status.toUpperCase()}
                        </Typography>
                      </View>
                    </View>
                    <Typography variant="body" color="secondary" style={styles.mutationDesc}>
                      {mutation.description}
                    </Typography>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Multi-Cancer Blood Test Info */}
        <Card padding="lg" style={styles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="flask" size={20} color={theme.colors.info} style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="body" weight="bold" style={styles.infoTitle}>
              Multi-Cancer Early Detection
            </Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.infoText}>
            New blood tests like Galleri can detect signals from 50+ types of cancer, often
            before symptoms appear. Ask your doctor if this test is right for you.
          </Typography>
          <View style={styles.infoFeatures}>
            <Typography variant="body" color="primary" style={styles.infoFeature}>
              ✓ Single blood draw
            </Typography>
            <Typography variant="body" color="primary" style={styles.infoFeature}>
              ✓ Detects 50+ cancer types
            </Typography>
            <Typography variant="body" color="primary" style={styles.infoFeature}>
              ✓ Identifies tissue of origin
            </Typography>
            <Typography variant="body" color="primary" style={styles.infoFeature}>
              ✓ 99.5% specificity
            </Typography>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            accessibilityRole="button"
            accessibilityLabel="Learn more about multi-cancer early detection"
            accessibilityHint="View detailed information about multi-cancer blood screening tests"
          >
            <Typography variant="body" weight="semibold" style={styles.infoButtonText}>
              Learn More
            </Typography>
          </TouchableOpacity>
        </Card>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Cancer Details Modal */}
      {selectedCancer && renderCancerDetails()}
    </View>
  );
};

// Mock data
const mockCancerData: CancerType[] = [
  {
    id: '1',
    name: 'Breast Cancer',
    riskScore: 15,
    riskCategory: 'low',
    icon: 'ribbon',
    color: '#E91E63',
    biomarkers: [
      { name: 'CA 15-3', value: 22, unit: 'U/mL', normalRange: '<30', status: 'normal' },
      { name: 'CA 27-29', value: 28, unit: 'U/mL', normalRange: '<38', status: 'normal' },
    ],
    screeningStatus: {
      lastScreening: '2024-03-15T00:00:00Z',
      nextDue: '2025-03-15T00:00:00Z',
      overdue: false,
    },
    riskFactors: [
      { name: 'Family history', present: false, impact: 'high' },
      { name: 'Age over 50', present: false, impact: 'moderate' },
      { name: 'Dense breast tissue', present: true, impact: 'moderate' },
      { name: 'Early menstruation', present: false, impact: 'low' },
    ],
  },
  {
    id: '2',
    name: 'Colorectal Cancer',
    riskScore: 22,
    riskCategory: 'moderate',
    icon: 'fitness',
    color: '#3F51B5',
    biomarkers: [
      { name: 'CEA', value: 3.2, unit: 'ng/mL', normalRange: '<3.0', status: 'borderline' },
      { name: 'CA 19-9', value: 24, unit: 'U/mL', normalRange: '<37', status: 'normal' },
    ],
    screeningStatus: {
      lastScreening: '2022-08-10T00:00:00Z',
      nextDue: '2024-08-10T00:00:00Z',
      overdue: true,
    },
    riskFactors: [
      { name: 'Age over 45', present: true, impact: 'moderate' },
      { name: 'Family history', present: true, impact: 'high' },
      { name: 'Low fiber diet', present: true, impact: 'moderate' },
      { name: 'Sedentary lifestyle', present: false, impact: 'moderate' },
    ],
  },
  {
    id: '3',
    name: 'Lung Cancer',
    riskScore: 8,
    riskCategory: 'low',
    icon: 'fitness-outline',
    color: '#00BCD4',
    biomarkers: [
      { name: 'CEA', value: 2.1, unit: 'ng/mL', normalRange: '<5.0', status: 'normal' },
      { name: 'CYFRA 21-1', value: 1.8, unit: 'ng/mL', normalRange: '<3.3', status: 'normal' },
    ],
    screeningStatus: {
      lastScreening: null,
      nextDue: '2025-01-01T00:00:00Z',
      overdue: false,
    },
    riskFactors: [
      { name: 'Smoking history', present: false, impact: 'high' },
      { name: 'Radon exposure', present: false, impact: 'moderate' },
      { name: 'Family history', present: false, impact: 'moderate' },
      { name: 'Age over 55', present: false, impact: 'moderate' },
    ],
  },
  {
    id: '4',
    name: 'Prostate Cancer',
    riskScore: 18,
    riskCategory: 'low',
    icon: 'male',
    color: '#2196F3',
    biomarkers: [
      { name: 'PSA', value: 2.8, unit: 'ng/mL', normalRange: '<4.0', status: 'normal' },
      { name: 'Free PSA', value: 22, unit: '%', normalRange: '>25%', status: 'borderline' },
    ],
    screeningStatus: {
      lastScreening: '2024-06-20T00:00:00Z',
      nextDue: '2025-06-20T00:00:00Z',
      overdue: false,
    },
    riskFactors: [
      { name: 'Age over 50', present: false, impact: 'high' },
      { name: 'Family history', present: true, impact: 'high' },
      { name: 'African American', present: false, impact: 'high' },
      { name: 'High-fat diet', present: false, impact: 'low' },
    ],
  },
  {
    id: '5',
    name: 'Skin Cancer',
    riskScore: 35,
    riskCategory: 'moderate',
    icon: 'sunny',
    color: '#FF9800',
    biomarkers: [
      { name: 'S100', value: 0.08, unit: 'μg/L', normalRange: '<0.1', status: 'normal' },
      { name: 'LDH', value: 185, unit: 'U/L', normalRange: '140-280', status: 'normal' },
    ],
    screeningStatus: {
      lastScreening: '2023-11-05T00:00:00Z',
      nextDue: '2024-11-05T00:00:00Z',
      overdue: false,
    },
    riskFactors: [
      { name: 'Fair skin', present: true, impact: 'high' },
      { name: 'Sun exposure history', present: true, impact: 'high' },
      { name: 'Many moles', present: true, impact: 'moderate' },
      { name: 'Family history', present: false, impact: 'moderate' },
      { name: 'History of sunburns', present: true, impact: 'high' },
    ],
  },
];

const mockGeneticData: GeneticRisk = {
  tested: true,
  mutations: [
    {
      gene: 'BRCA1',
      status: 'negative',
      description: 'No pathogenic mutations detected in BRCA1 gene',
    },
    {
      gene: 'BRCA2',
      status: 'negative',
      description: 'No pathogenic mutations detected in BRCA2 gene',
    },
    {
      gene: 'TP53',
      status: 'negative',
      description: 'No Li-Fraumeni syndrome mutations detected',
    },
  ],
};

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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  overviewCard: {
    marginBottom: theme.spacing.lg,
  },
  overviewTitle: {
    marginBottom: theme.spacing.md,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  cancerCard: {
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
  },
  cancerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cancerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  cancerInfo: {
    flex: 1,
  },
  cancerName: {
    marginBottom: theme.spacing.xs,
  },
  riskCategory: {},
  riskScore: {},
  screeningStatus: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  scheduleButtonText: {
    color: theme.colors.textInverse,
  },
  geneticCard: {
    marginBottom: theme.spacing.lg,
  },
  geneticNotTested: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  geneticNotTestedText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  geneticNotTestedDesc: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  geneticTestButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  geneticTestButtonText: {
    color: theme.colors.textInverse,
  },
  geneticTested: {
    gap: theme.spacing.sm,
  },
  mutationCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  mutationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  mutationGene: {},
  mutationStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  mutationStatusText: {
    color: theme.colors.textInverse,
  },
  mutationDesc: {
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    marginBottom: theme.spacing.lg,
  },
  infoTitle: {},
  infoText: {
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  infoFeatures: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  infoFeature: {},
  infoButton: {
    backgroundColor: theme.colors.info,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  infoButtonText: {
    color: theme.colors.textInverse,
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
    backgroundColor: theme.colors.surface,
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
    flex: 1,
  },
  detailsContent: {
    padding: theme.spacing.lg,
  },
  detailsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  riskScoreCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  detailsRiskScore: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  detailsRiskCategory: {
    marginBottom: theme.spacing.md,
  },
  riskBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
  },
  biomarkerCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  biomarkerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  biomarkerName: {},
  biomarkerStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  biomarkerStatusText: {
    color: theme.colors.textInverse,
  },
  biomarkerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  biomarkerValue: {},
  biomarkerRange: {},
  riskFactorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  riskFactorText: {
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  impactText: {
    color: theme.colors.textInverse,
  },
  preventionList: {
    gap: theme.spacing.sm,
  },
  preventionItem: {
    lineHeight: 20,
  },
  detailsButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  detailsButtonText: {
    color: theme.colors.textInverse,
  },
});

export default CancerDetectionSystemScreen;
