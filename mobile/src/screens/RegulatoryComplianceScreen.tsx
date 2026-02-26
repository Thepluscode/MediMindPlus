/**
 * FDA Regulatory Compliance Dashboard Screen
 * Tracks FDA 510(k) submission, clinical trials, and quality system compliance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

const RegulatoryComplianceScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'submission' | 'clinical' | 'quality'>('overview');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setComplianceData({
        overallReadiness: {
          score: 82,
          submissionReadiness: 86,
          clinicalReadiness: 83,
          qualitySystemReadiness: 94,
          recommendation: 'Nearly ready. Address remaining document reviews and quality issues.',
        },
        submission: {
          submissionId: 'K243857',
          submissionType: '510(k)',
          deviceName: 'MediMind AI Health Prediction System',
          deviceClass: 'Class II',
          status: 'under_review',
          submissionDate: new Date(2024, 8, 15),
          targetDecisionDate: new Date(2025, 2, 15),
          daysInReview: 87,
          approvedDocuments: 6,
          totalDocuments: 7,
          pendingActions: 2,
        },
        clinical: {
          trialName: 'MediMind AI Cardiovascular Risk Prediction Validation',
          nctNumber: 'NCT05429871',
          phase: 'Phase III',
          enrollmentCurrent: 1247,
          enrollmentTarget: 1500,
          primaryEndpointMet: true,
          pValue: 0.0023,
          adverseEvents: 1,
        },
        quality: {
          complianceScore: 94,
          iso13485Certified: true,
          iso13485Expiration: new Date(2026, 2, 15),
          lastAuditDate: new Date(2024, 8, 1),
          openNonConformances: 1,
          openCAPAs: 1,
        },
        timeline: [
          { phase: 'Pre-submission Meeting', status: 'completed', progress: 100 },
          { phase: 'Document Preparation', status: 'completed', progress: 100 },
          { phase: '510(k) Submission', status: 'completed', progress: 100 },
          { phase: 'FDA Administrative Review', status: 'completed', progress: 100 },
          { phase: 'FDA Substantive Review', status: 'current', progress: 65 },
          { phase: 'Additional Information', status: 'upcoming', progress: 40 },
          { phase: 'Final FDA Decision', status: 'upcoming', progress: 0 },
          { phase: 'Market Launch', status: 'upcoming', progress: 0 },
        ],
      });
      setIsLoading(false);
    }, 1000);
  };

  const renderProgressCircle = (progress: number, size: number, strokeWidth: number, color: string) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'current':
        return '#3b82f6';
      case 'upcoming':
        return '#94a3b8';
      default:
        return '#64748b';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Typography variant="body" style={styles.loadingText}>Loading compliance data...</Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={theme.gradients.primary.colors} style={styles.header}>
        <Typography variant="body" style={styles.headerTitle}>FDA Compliance Dashboard</Typography>
        <Typography variant="body" style={styles.headerSubtitle}>510(k) Submission Tracking</Typography>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {['overview', 'submission', 'clinical', 'quality'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Typography variant="body" style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <View>
            {/* Overall Readiness Score */}
            <View style={styles.readinessCard}>
              <Typography variant="body" style={styles.cardTitle}>Regulatory Readiness</Typography>

              <View style={styles.circleContainer}>
                <View style={styles.progressCircleWrapper}>
                  {renderProgressCircle(complianceData.overallReadiness.score, 160, 16, '#6366f1')}
                  <View style={styles.circleCenter}>
                    <Typography variant="body" style={styles.circleScore}>{complianceData.overallReadiness.score}%</Typography>
                    <Typography variant="body" style={styles.circleLabel}>Ready</Typography>
                  </View>
                </View>
              </View>

              <View style={styles.recommendationCard}>
                <Ionicons name="bulb" size={24} color="#f59e0b" />
                <Typography variant="body" style={styles.recommendationText}>{complianceData.overallReadiness.recommendation}</Typography>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Typography variant="body" style={styles.metricValue}>{complianceData.overallReadiness.submissionReadiness}%</Typography>
                  <Typography variant="body" style={styles.metricLabel}>Submission</Typography>
                </View>
                <View style={styles.metricItem}>
                  <Typography variant="body" style={styles.metricValue}>{complianceData.overallReadiness.clinicalReadiness}%</Typography>
                  <Typography variant="body" style={styles.metricLabel}>Clinical</Typography>
                </View>
                <View style={styles.metricItem}>
                  <Typography variant="body" style={styles.metricValue}>{complianceData.overallReadiness.qualitySystemReadiness}%</Typography>
                  <Typography variant="body" style={styles.metricLabel}>Quality</Typography>
                </View>
              </View>
            </View>

            {/* Submission Timeline */}
            <View style={styles.card}>
              <Typography variant="body" style={styles.cardTitle}>Submission Timeline</Typography>

              {complianceData.timeline.map((item: any, index: number) => (
                <View key={index} style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineIndicator,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  >
                    {item.status === 'completed' && <Ionicons name="checkmark" size={16} color="#fff" />}
                    {item.status === 'current' && <Ionicons name="ellipse" size={12} color="#fff" />}
                  </View>

                  <View style={styles.timelineContent}>
                    <Typography variant="body" style={styles.timelinePhase}>{item.phase}</Typography>
                    {item.progress > 0 && (
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
                      </View>
                    )}
                  </View>

                  <Typography variant="body" style={styles.timelineProgress}>{item.progress}%</Typography>
                </View>
              ))}
            </View>

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="document-text" size={32} color="#3b82f6" />
                <Typography variant="body" style={styles.statValue}>{complianceData.submission.daysInReview}</Typography>
                <Typography variant="body" style={styles.statLabel}>Days in Review</Typography>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="people" size={32} color="#10b981" />
                <Typography variant="body" style={styles.statValue}>
                  {complianceData.clinical.enrollmentCurrent}/{complianceData.clinical.enrollmentTarget}
                </Typography>
                <Typography variant="body" style={styles.statLabel}>Enrollment</Typography>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="shield-checkmark" size={32} color="#8b5cf6" />
                <Typography variant="body" style={styles.statValue}>{complianceData.quality.complianceScore}%</Typography>
                <Typography variant="body" style={styles.statLabel}>Quality Score</Typography>
              </View>
            </View>
          </View>
        )}

        {/* Submission Tab */}
        {selectedTab === 'submission' && (
          <View>
            <View style={styles.card}>
              <View style={styles.submissionHeader}>
                <View>
                  <Typography variant="body" style={styles.submissionId}>{complianceData.submission.submissionId}</Typography>
                  <Typography variant="body" style={styles.submissionType}>{complianceData.submission.submissionType}</Typography>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: '#3b82f6' + '20', borderColor: '#3b82f6' },
                  ]}
                >
                  <Typography variant="body" style={[styles.statusText, { color: '#3b82f6' }]}>
                    {complianceData.submission.status.replace('_', ' ').toUpperCase()}
                  </Typography>
                </View>
              </View>

              <Typography variant="body" style={styles.deviceName}>{complianceData.submission.deviceName}</Typography>
              <Typography variant="body" style={styles.deviceClass}>Device Classification: {complianceData.submission.deviceClass}</Typography>

              <View style={styles.dateRow}>
                <View style={styles.dateItem}>
                  <Typography variant="body" style={styles.dateLabel}>Submitted</Typography>
                  <Typography variant="body" style={styles.dateValue}>
                    {complianceData.submission.submissionDate.toLocaleDateString()}
                  </Typography>
                </View>
                <View style={styles.dateItem}>
                  <Typography variant="body" style={styles.dateLabel}>Target Decision</Typography>
                  <Typography variant="body" style={styles.dateValue}>
                    {complianceData.submission.targetDecisionDate.toLocaleDateString()}
                  </Typography>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Typography variant="body" style={styles.cardTitle}>Document Status</Typography>

              <View style={styles.documentProgress}>
                <View style={styles.documentStats}>
                  <Typography variant="body" style={styles.documentCount}>
                    {complianceData.submission.approvedDocuments}/{complianceData.submission.totalDocuments}
                  </Typography>
                  <Typography variant="body" style={styles.documentLabel}>Documents Approved</Typography>
                </View>

                <View style={styles.documentBar}>
                  <View
                    style={[
                      styles.documentBarFill,
                      {
                        width: `${
                          (complianceData.submission.approvedDocuments /
                            complianceData.submission.totalDocuments) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.actionItemsCard}>
                <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                <Typography variant="body" style={styles.actionItemsText}>
                  {complianceData.submission.pendingActions} pending actions require attention
                </Typography>
              </View>
            </View>
          </View>
        )}

        {/* Clinical Tab */}
        {selectedTab === 'clinical' && (
          <View>
            <View style={styles.card}>
              <View style={styles.trialHeader}>
                <Ionicons name="flask" size={32} color="#10b981" />
                <View style={styles.trialInfo}>
                  <Typography variant="body" style={styles.trialName}>{complianceData.clinical.trialName}</Typography>
                  <Typography variant="body" style={styles.nctNumber}>NCT: {complianceData.clinical.nctNumber}</Typography>
                </View>
              </View>

              <View style={[styles.phaseBadge, { backgroundColor: '#d1fae5' }]}>
                <Typography variant="body" style={[styles.phaseText, { color: '#065f46' }]}>{complianceData.clinical.phase}</Typography>
              </View>

              <View style={styles.enrollmentSection}>
                <Typography variant="body" style={styles.sectionTitle}>Patient Enrollment</Typography>
                <View style={styles.enrollmentProgress}>
                  <View style={styles.enrollmentStats}>
                    <Typography variant="body" style={styles.enrollmentCurrent}>{complianceData.clinical.enrollmentCurrent}</Typography>
                    <Typography variant="body" style={styles.enrollmentTarget}>/ {complianceData.clinical.enrollmentTarget} patients</Typography>
                  </View>

                  <View style={styles.enrollmentBar}>
                    <View
                      style={[
                        styles.enrollmentBarFill,
                        {
                          width: `${
                            (complianceData.clinical.enrollmentCurrent /
                              complianceData.clinical.enrollmentTarget) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>

                  <Typography variant="body" style={styles.enrollmentPercent}>
                    {Math.round(
                      (complianceData.clinical.enrollmentCurrent / complianceData.clinical.enrollmentTarget) * 100
                    )}
                    % Complete
                  </Typography>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Typography variant="body" style={styles.cardTitle}>Clinical Results</Typography>

              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: complianceData.clinical.primaryEndpointMet ? '#d1fae5' : '#fee2e2' },
                ]}
              >
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={complianceData.clinical.primaryEndpointMet ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={complianceData.clinical.primaryEndpointMet ? '#10b981' : '#ef4444'}
                  />
                  <Typography variant="body"
                    style={[
                      styles.resultTitle,
                      { color: complianceData.clinical.primaryEndpointMet ? '#065f46' : '#991b1b' },
                    ]}
                  >
                    Primary Endpoint
                  </Typography>
                </View>

                <Typography variant="body"
                  style={[
                    styles.resultStatus,
                    { color: complianceData.clinical.primaryEndpointMet ? '#065f46' : '#991b1b' },
                  ]}
                >
                  {complianceData.clinical.primaryEndpointMet ? 'MET' : 'NOT MET'}
                </Typography>

                <Typography variant="body" style={styles.pValueText}>p-value: {complianceData.clinical.pValue}</Typography>
              </View>

              <View style={styles.adverseEventsCard}>
                <Ionicons name="medical" size={20} color="#3b82f6" />
                <Typography variant="body" style={styles.adverseEventsText}>
                  {complianceData.clinical.adverseEvents} Adverse Events Reported
                </Typography>
              </View>
            </View>
          </View>
        )}

        {/* Quality Tab */}
        {selectedTab === 'quality' && (
          <View>
            <View style={styles.card}>
              <Typography variant="body" style={styles.cardTitle}>Quality System Compliance</Typography>

              <View style={styles.complianceScoreSection}>
                <View style={styles.progressCircleWrapper}>
                  {renderProgressCircle(complianceData.quality.complianceScore, 140, 14, '#8b5cf6')}
                  <View style={styles.circleCenter}>
                    <Typography variant="body" style={styles.circleScore}>{complianceData.quality.complianceScore}%</Typography>
                    <Typography variant="body" style={styles.circleLabel}>Compliant</Typography>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.certificationCard,
                  { backgroundColor: complianceData.quality.iso13485Certified ? '#d1fae5' : '#fee2e2' },
                ]}
              >
                <View style={styles.certificationHeader}>
                  <Ionicons
                    name="ribbon"
                    size={24}
                    color={complianceData.quality.iso13485Certified ? '#10b981' : '#ef4444'}
                  />
                  <Typography variant="body"
                    style={[
                      styles.certificationTitle,
                      { color: complianceData.quality.iso13485Certified ? '#065f46' : '#991b1b' },
                    ]}
                  >
                    ISO 13485 Certification
                  </Typography>
                </View>

                {complianceData.quality.iso13485Certified && (
                  <Typography variant="body" style={styles.certificationExpiry}>
                    Expires: {complianceData.quality.iso13485Expiration.toLocaleDateString()}
                  </Typography>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Typography variant="body" style={styles.cardTitle}>Recent Audit</Typography>

              <View style={styles.auditInfo}>
                <View style={styles.auditRow}>
                  <Ionicons name="calendar" size={20} color="#64748b" />
                  <Typography variant="body" style={styles.auditText}>
                    Last Audit: {complianceData.quality.lastAuditDate.toLocaleDateString()}
                  </Typography>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="alert-circle" size={28} color="#f59e0b" />
                <Typography variant="body" style={styles.statValue}>{complianceData.quality.openNonConformances}</Typography>
                <Typography variant="body" style={styles.statLabel}>Open NCs</Typography>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="construct" size={28} color="#3b82f6" />
                <Typography variant="body" style={styles.statValue}>{complianceData.quality.openCAPAs}</Typography>
                <Typography variant="body" style={styles.statLabel}>Open CAPAs</Typography>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ede9fe',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  scrollView: {
    flex: 1,
  },
  readinessCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  circleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressCircleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  circleScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  circleLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  timelineIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelinePhase: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  timelineProgress: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    width: 50,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  submissionId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  submissionType: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  deviceClass: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 20,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  documentProgress: {
    marginBottom: 16,
  },
  documentStats: {
    alignItems: 'center',
    marginBottom: 12,
  },
  documentCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  documentLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  documentBar: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  documentBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  actionItemsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  actionItemsText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  trialInfo: {
    flex: 1,
  },
  trialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  nctNumber: {
    fontSize: 13,
    color: '#64748b',
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  phaseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  enrollmentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  enrollmentProgress: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  enrollmentStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  enrollmentCurrent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  enrollmentTarget: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  enrollmentBar: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  enrollmentBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 5,
  },
  enrollmentPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pValueText: {
    fontSize: 13,
    color: '#64748b',
  },
  adverseEventsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  adverseEventsText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
  },
  complianceScoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  certificationCard: {
    padding: 16,
    borderRadius: 12,
  },
  certificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  certificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  certificationExpiry: {
    fontSize: 13,
    color: '#065f46',
    marginTop: 4,
  },
  auditInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  auditText: {
    fontSize: 14,
    color: '#1e293b',
  },
});

export default RegulatoryComplianceScreen;
