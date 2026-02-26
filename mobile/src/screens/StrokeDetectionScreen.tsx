import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface StrokeAnalysis {
  stroke_detected: boolean;
  stroke_type: string;
  confidence: number;
  time_since_onset: string;
  treatment_eligible: boolean;
  affected_region: string;
  infarct_volume: string;
  location: {
    hemisphere: string;
    territory: string;
    specific_areas: string[];
  };
  vessel_occlusion: {
    detected: boolean;
    location: string;
    severity: string;
  };
  recommendations: {
    tpa_eligible: boolean;
    thrombectomy_eligible: boolean;
    urgency: string;
    next_steps: string[];
  };
  prognosis: {
    modified_rankin_score_prediction: string;
    functional_outcome: string;
    recovery_timeline: string;
  };
}

const StrokeDetectionScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload-scan' | 'analysis' | 'metrics'>('overview');
  const [scanUploaded, setScanUploaded] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const strokeAnalysis: StrokeAnalysis = {
    stroke_detected: true,
    stroke_type: 'Ischemic',
    confidence: 96.8,
    time_since_onset: '2.5 hours',
    treatment_eligible: true,
    affected_region: 'Left Middle Cerebral Artery (MCA) territory',
    infarct_volume: '42 mL',
    location: {
      hemisphere: 'Left',
      territory: 'MCA',
      specific_areas: ['Frontal lobe', 'Temporal lobe', 'Basal ganglia'],
    },
    vessel_occlusion: {
      detected: true,
      location: 'Left M1 segment',
      severity: 'Complete occlusion',
    },
    recommendations: {
      tpa_eligible: true,
      thrombectomy_eligible: true,
      urgency: 'IMMEDIATE',
      next_steps: [
        'Immediate neurology consultation',
        'Prepare for IV tPA administration',
        'Alert interventional radiology for possible thrombectomy',
        'Continuous neurological monitoring',
        'Repeat imaging in 24 hours',
      ],
    },
    prognosis: {
      modified_rankin_score_prediction: '2-3',
      functional_outcome: 'Moderate disability expected with treatment',
      recovery_timeline: '3-6 months for substantial improvement',
    },
  };

  const performanceMetrics = {
    sensitivity: 94.2,
    specificity: 96.8,
    accuracy: 95.7,
    human_comparison: '+200%',
    processing_time: '18 seconds',
  };

  const handleUploadScan = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setScanUploaded(true);
      setIsAnalyzing(true);

      // Simulate AI analysis
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisComplete(true);
      }, 3000);
    }
  };

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      accessibilityLabel="Overview of stroke detection capabilities"
      accessibilityRole="scrollview"
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Clinical Capabilities</Text>
        <View style={styles.capabilitiesGrid}>
          {[
            {
              title: 'Stroke Detection',
              items: ['Ischemic stroke identification', 'Hemorrhagic stroke detection', 'Transient ischemic attack (TIA)', 'Stroke mimics differentiation'],
            },
            {
              title: 'Critical Timing',
              items: ['Time since onset estimation', '4.5-hour tPA window determination', '24-hour thrombectomy window', 'Treatment eligibility assessment'],
            },
            {
              title: 'Anatomical Analysis',
              items: ['Infarct volume calculation', 'Vessel occlusion localization', 'Affected brain region mapping', 'Penumbra vs core identification'],
            },
            {
              title: 'Clinical Decision Support',
              items: ['Treatment recommendations', 'Outcome prediction modeling', 'Risk stratification', 'Follow-up imaging protocols'],
            },
          ].map((category, idx) => (
            <View
              key={idx}
              style={styles.capabilityCard}
              accessibilityLabel={`${category.title} capabilities: ${category.items.join(', ')}`}
              accessibilityRole="text"
            >
              <Text style={styles.capabilityTitle}>{category.title}</Text>
              {category.items.map((item, i) => (
                <View key={i} style={styles.capabilityItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#10b981"
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Text style={styles.capabilityText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <LinearGradient
        colors={theme.gradients.primary.colors}
        style={styles.gradientCard}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.gradientTitle}>Clinical Impact</Text>
        <View style={styles.impactGrid}>
          {[
            { value: '795,000', label: 'Annual US Strokes', sublabel: 'Every 40 seconds someone has a stroke' },
            { value: '30%', label: 'Missed Diagnoses Reduced', sublabel: 'AI catches subtle findings' },
            { value: '$10M+', label: 'Annual Revenue Potential', sublabel: 'From 100 hospitals' },
          ].map((stat, idx) => (
            <View key={idx} style={styles.impactStat}>
              <Text style={styles.impactValue}>{stat.value}</Text>
              <Text style={styles.impactLabel}>{stat.label}</Text>
              <Text style={styles.impactSublabel}>{stat.sublabel}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </ScrollView>
  );

  const renderUploadTab = () => (
    <ScrollView
      style={styles.tabContent}
      accessibilityLabel="Upload brain scan for analysis"
      accessibilityRole="scrollview"
    >
      {!scanUploaded ? (
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={handleUploadScan}
            accessibilityRole="button"
            accessibilityLabel="Upload CT or MRI scan"
            accessibilityHint="Select a brain imaging file for AI stroke detection analysis"
          >
            <Ionicons
              name="cloud-upload-outline"
              size={64}
              color="#9ca3af"
              importantForAccessibility="no"
              accessible={false}
            />
            <Text style={styles.uploadTitle}>Upload CT or MRI Scan</Text>
            <Text style={styles.uploadSubtitle}>Supports DICOM, NIfTI, and standard image formats</Text>
            <View style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Select Files or Drag & Drop</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : isAnalyzing ? (
        <View
          style={styles.analyzingContainer}
          accessibilityLabel="AI analysis in progress, processing brain imaging with deep learning models"
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.analyzingTitle}>AI Analysis in Progress</Text>
          <Text style={styles.analyzingSubtitle}>Processing brain imaging with deep learning models...</Text>
        </View>
      ) : (
        <View style={styles.completeContainer}>
          <View
            style={styles.alertIcon}
            importantForAccessibility="no"
            accessible={false}
          >
            <Ionicons
              name="warning"
              size={48}
              color="#ef4444"
              importantForAccessibility="no"
              accessible={false}
            />
          </View>
          <Text style={styles.completeTitle}>Analysis Complete</Text>
          <View
            style={styles.detectionAlert}
            accessibilityLabel="Critical: Stroke detected. Ischemic stroke in left MCA territory, Confidence 96.8 percent"
            accessibilityRole="alert"
          >
            <Text style={styles.detectionText}>STROKE DETECTED</Text>
            <Text style={styles.detectionSubtext}>Ischemic stroke in left MCA territory</Text>
            <Text style={styles.confidenceText}>Confidence: 96.8%</Text>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setActiveTab('analysis')}
            accessibilityRole="button"
            accessibilityLabel="View detailed analysis"
            accessibilityHint="Navigate to analysis tab to see full stroke detection results"
          >
            <Text style={styles.viewButtonText}>View Detailed Analysis →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderAnalysisTab = () => (
    <ScrollView
      style={styles.tabContent}
      accessibilityLabel="Detailed stroke analysis results"
      accessibilityRole="scrollview"
    >
      <LinearGradient
        colors={theme.gradients.primary.colors}
        style={styles.criticalAlert}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <View
          style={styles.alertHeader}
          accessibilityLabel="Critical alert: Acute stroke detected, immediate intervention recommended"
          accessibilityRole="alert"
        >
          <Ionicons
            name="warning"
            size={40}
            color="#fff"
            importantForAccessibility="no"
            accessible={false}
          />
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>ACUTE STROKE DETECTED</Text>
            <Text style={styles.alertSubtitle}>Immediate intervention recommended</Text>
          </View>
        </View>
        <View style={styles.alertStats}>
          {[
            { label: 'Time Since Onset', value: strokeAnalysis.time_since_onset },
            { label: 'tPA Eligible', value: 'YES' },
            { label: 'Confidence', value: `${strokeAnalysis.confidence}%` },
          ].map((stat, idx) => (
            <View
              key={idx}
              style={styles.alertStat}
              accessibilityLabel={`${stat.label}: ${stat.value}`}
              accessibilityRole="text"
            >
              <Text style={styles.alertStatLabel}>{stat.label}</Text>
              <Text style={styles.alertStatValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Detailed Analysis</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Stroke Classification</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{strokeAnalysis.stroke_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{strokeAnalysis.affected_region}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Volume:</Text>
              <Text style={styles.detailValue}>{strokeAnalysis.infarct_volume}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Treatment Recommendations</Text>
            {strokeAnalysis.recommendations.next_steps.map((step, idx) => (
              <View key={idx} style={styles.recommendationItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.recommendationText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderMetricsTab = () => (
    <ScrollView
      style={styles.tabContent}
      accessibilityLabel="Clinical performance metrics"
      accessibilityRole="scrollview"
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Clinical Performance</Text>
        <View style={styles.metricsGrid}>
          {[
            { metric: 'Sensitivity', value: performanceMetrics.sensitivity, color: '#10b981' },
            { metric: 'Specificity', value: performanceMetrics.specificity, color: '#3b82f6' },
            { metric: 'Overall Accuracy', value: performanceMetrics.accuracy, color: '#8b5cf6' },
          ].map((item, idx) => (
            <View
              key={idx}
              style={styles.metricCard}
              accessibilityLabel={`${item.metric}: ${item.value} percent`}
              accessibilityRole="text"
            >
              <Text style={styles.metricLabel}>{item.metric}</Text>
              <Text style={[styles.metricValue, { color: item.color }]}>{item.value}%</Text>
              <View
                style={styles.progressBar}
                importantForAccessibility="no"
                accessible={false}
              >
                <View style={[styles.progressFill, { width: `${item.value}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fef2f2', '#ffffff', '#fff7ed']}
        style={styles.gradient}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View
              style={styles.iconContainer}
              importantForAccessibility="no"
              accessible={false}
            >
              <Ionicons
                name="brain"
                size={32}
                color="#ef4444"
                importantForAccessibility="no"
                accessible={false}
              />
            </View>
            <View>
              <Text style={styles.title}>AI Stroke Detection</Text>
              <Text style={styles.subtitle}>2x more accurate • 18-second analysis</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {[
            { icon: 'trending-up', label: 'Accuracy vs Humans', value: '+200%', color: '#ef4444' },
            { icon: 'time', label: 'Analysis Time', value: '18 sec', color: '#f97316' },
            { icon: 'checkmark-circle', label: 'Sensitivity', value: '94.2%', color: '#10b981' },
            { icon: 'flash', label: 'Treatment Window ID', value: '99.1%', color: '#3b82f6' },
          ].map((stat, idx) => (
            <View
              key={idx}
              style={styles.statCard}
              accessibilityLabel={`${stat.label}: ${stat.value}`}
              accessibilityRole="text"
            >
              <Ionicons
                name={stat.icon as any}
                size={24}
                color={stat.color}
                importantForAccessibility="no"
                accessible={false}
              />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabsContainer}>
          {(['overview', 'upload-scan', 'analysis', 'metrics'] as const).map((tab) => {
            const tabLabel = tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="button"
                accessibilityLabel={`${tabLabel} tab`}
                accessibilityHint={`View ${tabLabel.toLowerCase()} information`}
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tabLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'upload-scan' && renderUploadTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ef4444',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  capabilitiesGrid: {
    gap: 16,
  },
  capabilityCard: {
    borderWidth: 2,
    borderColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
  },
  capabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  capabilityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
  gradientCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  gradientTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  impactGrid: {
    gap: 16,
  },
  impactStat: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  impactValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  impactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  impactSublabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  uploadContainer: {
    padding: 20,
  },
  uploadBox: {
    borderWidth: 4,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 8,
  },
  analyzingSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  completeContainer: {
    padding: 20,
    alignItems: 'center',
  },
  alertIcon: {
    backgroundColor: '#fee2e2',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  detectionAlert: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    width: '100%',
  },
  detectionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  detectionSubtext: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  viewButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  criticalAlert: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  alertStats: {
    flexDirection: 'row',
    gap: 12,
  },
  alertStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  alertStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  alertStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailsGrid: {
    gap: 16,
  },
  detailCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  metricsGrid: {
    gap: 16,
  },
  metricCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
});

export default StrokeDetectionScreen;
