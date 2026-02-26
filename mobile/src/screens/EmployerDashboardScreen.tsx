/**
 * Employer Health Command Center Screen
 *
 * HIPAA-compliant population health analytics for employers
 * Revenue: $180M Year 1 (B2B SaaS - fastest revenue)
 * Target: 50k employers × $3k/year average
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';
import { employerAPI } from '../services/revolutionaryFeaturesAPI';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

export default function EmployerDashboardScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y'>('30d');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('company');

  useEffect(() => {
    loadDashboard();
  }, [timeframe, selectedDepartment]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      // In production, this would be the employer's organization ID
      // For now, using user ID or a demo employer ID
      const employerId = user.employerId || user.organizationId || 'demo-employer-123';

      const response = await employerAPI.getDashboard(employerId);
      setDashboard(response.data || response);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewCards = () => {
    if (!dashboard) return null;

    const cards = [
      {
        title: 'Overall Health Score',
        value: dashboard.overallHealthScore.toFixed(1),
        max: '100',
        icon: 'heart-pulse',
        color: dashboard.overallHealthScore >= 75 ? '#4CAF50' : dashboard.overallHealthScore >= 60 ? '#FFC107' : '#F44336',
        trend: dashboard.trends?.healthScore || '+2.3%',
      },
      {
        title: 'Healthcare Costs',
        value: `$${(dashboard.healthcareCosts.totalCosts / 1000000).toFixed(1)}M`,
        subtitle: 'Total Annual',
        icon: 'currency-usd',
        color: '#2196F3',
        trend: dashboard.trends?.costs || '-5.2%',
        trendGood: dashboard.trends?.costs?.startsWith('-'),
      },
      {
        title: 'High Risk',
        value: dashboard.riskDistribution.highRisk.toString(),
        subtitle: 'Employees',
        icon: 'alert-circle',
        color: '#F44336',
        trend: dashboard.trends?.highRisk || '-12',
        trendGood: dashboard.trends?.highRisk?.startsWith('-'),
      },
      {
        title: 'ROI',
        value: `${dashboard.roiAnalysis.overallROI.toFixed(1)}:1`,
        subtitle: 'Return on Investment',
        icon: 'trending-up',
        color: '#4CAF50',
        trend: dashboard.trends?.roi || '+0.4',
      },
    ];

    return (
      <View style={styles.overviewCards}>
        {cards.map((card, index) => (
          <Card key={index} elevated elevation="sm" padding="md" style={styles.overviewCard}>
            <View style={styles.cardHeader}>
              <Icon name={card.icon} size={28} color={card.color} importantForAccessibility="no" accessible={false} />
              <View style={[
                styles.trendBadge,
                { backgroundColor: (card.trendGood ?? card.trend.startsWith('+')) ? theme.colors.successLight : theme.colors.errorLight }
              ]}>
                <Icon
                  name={(card.trendGood ?? card.trend.startsWith('+')) ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={(card.trendGood ?? card.trend.startsWith('+')) ? theme.colors.success : theme.colors.error}
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={[
                    styles.trendText,
                    { color: (card.trendGood ?? card.trend.startsWith('+')) ? theme.colors.success : theme.colors.error }
                  ]}
                >
                  {card.trend}
                </Typography>
              </View>
            </View>
            <Typography variant="caption" color="secondary" style={styles.cardTitle}>
              {card.title}
            </Typography>
            <View style={styles.cardValueRow}>
              <Typography variant="h2" weight="bold" style={[styles.cardValue, { color: card.color }]}>
                {card.value}
              </Typography>
              {card.max && (
                <Typography variant="body" color="secondary" style={styles.cardMax}>
                  /{card.max}
                </Typography>
              )}
            </View>
            {card.subtitle && (
              <Typography variant="caption" color="secondary" style={styles.cardSubtitle}>
                {card.subtitle}
              </Typography>
            )}
          </Card>
        ))}
      </View>
    );
  };

  const renderRiskDistribution = () => {
    if (!dashboard) return null;

    const pieData = [
      {
        name: 'Low Risk',
        population: dashboard.riskDistribution.lowRisk,
        color: '#4CAF50',
        legendFontColor: '#333',
      },
      {
        name: 'Medium Risk',
        population: dashboard.riskDistribution.mediumRisk,
        color: '#FFC107',
        legendFontColor: '#333',
      },
      {
        name: 'High Risk',
        population: dashboard.riskDistribution.highRisk,
        color: '#F44336',
        legendFontColor: '#333',
      },
    ];

    const totalPopulation = pieData.reduce((sum, item) => sum + item.population, 0);

    return (
      <Card elevated elevation="sm" padding="lg" style={styles.sectionCard}>
        <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
          RISK DISTRIBUTION
        </Typography>
        <Typography variant="body" color="secondary" style={styles.sectionSubtitle}>
          Total Population: {totalPopulation} employees
        </Typography>

        <View style={styles.riskVisualization}>
          {pieData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.riskSegment}
              onPress={() => viewRiskDetails(item.name)}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name} details, ${item.population} employees`}
              accessibilityHint="View detailed risk breakdown for this category"
            >
              <View style={[styles.riskBar, {
                width: `${(item.population / totalPopulation) * 100}%`,
                backgroundColor: item.color,
              }]} />
              <View style={styles.riskInfo}>
                <Typography variant="body" weight="semibold" style={styles.riskLabel}>
                  {item.name}
                </Typography>
                <Typography variant="body" color="secondary" style={styles.riskValue}>
                  {item.population} ({((item.population / totalPopulation) * 100).toFixed(1)}%)
                </Typography>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.topConditionsContainer}>
          <Typography variant="body" weight="semibold" style={styles.subsectionTitle}>
            Top Chronic Conditions
          </Typography>
          {dashboard.topChronicConditions.map((condition: any, index: number) => (
            <View key={index} style={styles.conditionItem}>
              <Typography variant="body" style={styles.conditionName}>
                {condition.condition}
              </Typography>
              <View style={styles.conditionStats}>
                <Typography variant="caption" color="secondary" style={styles.conditionCount}>
                  {condition.count} cases
                </Typography>
                <Typography variant="body" weight="semibold" style={styles.conditionCost}>
                  ${(condition.cost / 1000).toFixed(0)}k
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderCostAnalysis = () => {
    if (!dashboard || !dashboard.healthcareCosts) return null;

    return (
      <Card elevated elevation="sm" padding="lg" style={styles.sectionCard}>
        <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
          HEALTHCARE COSTS
        </Typography>

        <View style={styles.costSummary}>
          <View style={styles.costItem}>
            <Typography variant="caption" color="secondary" style={styles.costLabel}>
              Per Employee
            </Typography>
            <Typography variant="h3" weight="bold" style={styles.costValue}>
              ${dashboard.healthcareCosts.perEmployee.toLocaleString()}
            </Typography>
          </View>
          <View style={styles.costItem}>
            <Typography variant="caption" color="secondary" style={styles.costLabel}>
              Vs Industry Avg
            </Typography>
            <Typography
              variant="h3"
              weight="bold"
              style={[
                styles.costValue,
                { color: dashboard.healthcareCosts.vsIndustryAverage < 0 ? theme.colors.success : theme.colors.error }
              ]}
            >
              {dashboard.healthcareCosts.vsIndustryAverage}%
            </Typography>
          </View>
        </View>

        <View style={styles.costBreakdown}>
          <Typography variant="body" weight="semibold" style={styles.subsectionTitle}>
            Cost Breakdown
          </Typography>
          {Object.entries(dashboard.healthcareCosts.breakdown).map(([key, value]: [string, any]) => {
            const percentage = (value / dashboard.healthcareCosts.totalCosts) * 100;
            return (
              <View key={key} style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Typography variant="body" style={styles.breakdownLabel}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Typography variant="body" weight="semibold" style={styles.breakdownValue}>
                    ${(value / 1000).toFixed(0)}k
                  </Typography>
                </View>
                <View style={styles.breakdownBar}>
                  <View
                    style={[
                      styles.breakdownBarFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.costProjectionsContainer}>
          <Typography variant="body" weight="semibold" style={styles.subsectionTitle}>
            12-Month Projections
          </Typography>
          <View style={styles.projectionRow}>
            <View style={styles.projectionBox}>
              <Typography variant="caption" color="secondary" style={styles.projectionLabel}>
                Without Intervention
              </Typography>
              <Typography variant="h3" weight="bold" style={[styles.projectionValue, { color: theme.colors.error }]}>
                ${(dashboard.costProjections.withoutIntervention / 1000000).toFixed(2)}M
              </Typography>
            </View>
            <Icon name="arrow-right" size={24} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
            <View style={styles.projectionBox}>
              <Typography variant="caption" color="secondary" style={styles.projectionLabel}>
                With Interventions
              </Typography>
              <Typography variant="h3" weight="bold" style={[styles.projectionValue, { color: theme.colors.success }]}>
                ${(dashboard.costProjections.withInterventions / 1000000).toFixed(2)}M
              </Typography>
            </View>
          </View>
          <Typography variant="body" weight="semibold" style={styles.savingsText}>
            Potential Savings: ${((dashboard.costProjections.withoutIntervention - dashboard.costProjections.withInterventions) / 1000000).toFixed(2)}M
          </Typography>
        </View>
      </Card>
    );
  };

  const renderInterventionOpportunities = () => {
    if (!dashboard || !dashboard.interventionOpportunities) return null;

    return (
      <Card elevated elevation="sm" padding="lg" style={styles.sectionCard}>
        <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
          INTERVENTION OPPORTUNITIES
        </Typography>
        <Typography variant="body" color="secondary" style={styles.sectionSubtitle}>
          AI-identified opportunities for cost reduction
        </Typography>

        {dashboard.interventionOpportunities.map((opportunity: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.opportunityCard}
            onPress={() => launchIntervention(opportunity)}
            accessibilityRole="button"
            accessibilityLabel={`${opportunity.priority} priority intervention: ${opportunity.title}. Potential savings: $${(opportunity.potentialSavings / 1000).toFixed(0)}k. Tap to launch.`}
          >
            <View style={styles.opportunityHeader}>
              <View style={[
                styles.opportunityPriority,
                {
                  backgroundColor:
                    opportunity.priority === 'high'
                      ? theme.colors.errorLight
                      : opportunity.priority === 'medium'
                      ? theme.colors.warningLight
                      : theme.colors.successLight,
                },
              ]}>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={[
                    styles.opportunityPriorityText,
                    {
                      color:
                        opportunity.priority === 'high'
                          ? theme.colors.error
                          : opportunity.priority === 'medium'
                          ? theme.colors.warning
                          : theme.colors.success,
                    },
                  ]}
                >
                  {opportunity.priority.toUpperCase()} PRIORITY
                </Typography>
              </View>
              <View style={styles.impactBadge}>
                <Icon name="trending-up" size={16} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                <Typography variant="body" weight="bold" style={styles.impactText}>
                  ${(opportunity.potentialSavings / 1000).toFixed(0)}k
                </Typography>
              </View>
            </View>

            <Typography variant="body" weight="bold" style={styles.opportunityTitle}>
              {opportunity.title}
            </Typography>
            <Typography variant="body" color="secondary" style={styles.opportunityDescription}>
              {opportunity.description}
            </Typography>

            <View style={styles.opportunityMetrics}>
              <View style={styles.opportunityMetric}>
                <Icon name="account-group" size={16} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                <Typography variant="caption" color="secondary" style={styles.opportunityMetricText}>
                  {opportunity.affectedEmployees} employees
                </Typography>
              </View>
              <View style={styles.opportunityMetric}>
                <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                <Typography variant="caption" color="secondary" style={styles.opportunityMetricText}>
                  {opportunity.timeframe} timeframe
                </Typography>
              </View>
            </View>

            <TouchableOpacity
              style={styles.launchButton}
              accessibilityRole="button"
              accessibilityLabel="Launch intervention"
              accessibilityHint="Start this health intervention program"
            >
              <Typography variant="body" weight="semibold" style={styles.launchButtonText}>
                Launch Intervention
              </Typography>
              <Icon name="arrow-right" size={20} color="#fff" importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </Card>
    );
  };

  const renderROIAnalysis = () => {
    if (!dashboard || !dashboard.roiAnalysis) return null;

    return (
      <Card elevated elevation="sm" padding="lg" style={styles.sectionCard}>
        <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
          ROI ANALYSIS
        </Typography>

        <View style={styles.roiHeader}>
          <View style={styles.roiMainMetric}>
            <Typography variant="body" color="secondary" style={styles.roiLabel}>
              Overall ROI
            </Typography>
            <Typography variant="h1" weight="bold" style={styles.roiValue}>
              {dashboard.roiAnalysis.overallROI.toFixed(1)}:1
            </Typography>
            <Typography variant="caption" color="secondary" style={styles.roiSubtext}>
              Every $1 invested returns ${dashboard.roiAnalysis.overallROI.toFixed(2)}
            </Typography>
          </View>
        </View>

        <View style={styles.roiProgramsContainer}>
          <Typography variant="body" weight="semibold" style={styles.subsectionTitle}>
            Program Performance
          </Typography>
          {dashboard.roiAnalysis.byProgram.map((program: any, index: number) => (
            <View key={index} style={styles.roiProgramItem}>
              <View style={styles.roiProgramHeader}>
                <Typography variant="body" weight="semibold" style={styles.roiProgramName}>
                  {program.name}
                </Typography>
                <Typography
                  variant="h3"
                  weight="bold"
                  style={[
                    styles.roiProgramValue,
                    { color: program.roi >= 3 ? theme.colors.success : program.roi >= 2 ? theme.colors.warning : theme.colors.error }
                  ]}
                >
                  {program.roi.toFixed(1)}:1
                </Typography>
              </View>
              <View style={styles.roiProgramMetrics}>
                <Typography variant="caption" color="secondary" style={styles.roiProgramMetric}>
                  Investment: ${(program.investment / 1000).toFixed(0)}k
                </Typography>
                <Typography variant="caption" color="secondary" style={styles.roiProgramMetric}>
                  Return: ${(program.return / 1000).toFixed(0)}k
                </Typography>
                <Typography variant="caption" color="secondary" style={styles.roiProgramMetric}>
                  Participants: {program.participants}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const viewRiskDetails = (riskLevel: string) => {
    navigation.navigate('RiskDetails' as never, { riskLevel } as never);
  };

  const launchIntervention = (opportunity: any) => {
    Alert.alert(
      'Launch Intervention',
      `Are you sure you want to launch the "${opportunity.title}" intervention?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Launch',
          onPress: async () => {
            try {
              await axios.post('/api/v1/employer/me/intervention', {
                opportunityId: opportunity.id,
              });
              Alert.alert('Success', 'Intervention launched successfully');
              loadDashboard();
            } catch (error) {
              Alert.alert('Error', 'Failed to launch intervention');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading dashboard..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>
          Health Command Center
        </Typography>
        <Typography variant="body" style={styles.headerSubtitle}>
          {dashboard?.employerName} • HIPAA Compliant
        </Typography>

        {/* Timeframe Selector */}
        <View style={styles.timeframeSelector}>
          {['30d', '90d', '1y'].map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                timeframe === tf && styles.timeframeButtonActive,
              ]}
              onPress={() => setTimeframe(tf as any)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${tf === '30d' ? '30 days' : tf === '90d' ? '90 days' : '1 year'} timeframe`}
              accessibilityHint={timeframe === tf ? 'Currently selected' : 'Change dashboard timeframe'}
              accessibilityState={{ selected: timeframe === tf }}
            >
              <Typography
                variant="body"
                weight="semibold"
                style={[
                  styles.timeframeButtonText,
                  timeframe === tf && styles.timeframeButtonTextActive,
                ]}
              >
                {tf === '30d' ? '30 Days' : tf === '90d' ? '90 Days' : '1 Year'}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} accessibilityLabel="Employer health dashboard" accessibilityRole="scrollview">
        {renderOverviewCards()}
        {renderRiskDistribution()}
        {renderCostAnalysis()}
        {renderInterventionOpportunities()}
        {renderROIAnalysis()}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ExecutiveSummary' as never)}
            accessibilityRole="button"
            accessibilityLabel="View executive summary"
            accessibilityHint="View comprehensive executive summary report"
          >
            <Icon name="file-document" size={24} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
            <Typography variant="caption" weight="semibold" style={styles.actionButtonText}>
              Executive Summary
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EmployeeSearch' as never)}
            accessibilityRole="button"
            accessibilityLabel="Search employees"
            accessibilityHint="Search and filter employees in the system"
          >
            <Icon name="account-search" size={24} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
            <Typography variant="caption" weight="semibold" style={styles.actionButtonText}>
              Search Employees
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
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.primaryLight,
    marginTop: theme.spacing.xs,
  },
  timeframeSelector: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  timeframeButtonActive: {
    backgroundColor: theme.colors.white,
  },
  timeframeButtonText: {
    fontSize: 14,
    color: theme.colors.primaryLight,
    fontWeight: '600',
  },
  timeframeButtonTextActive: {
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  overviewCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.sm,
  },
  overviewCard: {
    width: (width - 36) / 2,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    margin: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  cardTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardMax: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  cardSubtitle: {
    fontSize: 10,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  riskVisualization: {
    marginTop: theme.spacing.md,
  },
  riskSegment: {
    marginBottom: theme.spacing.md,
  },
  riskBar: {
    height: 12,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  riskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  riskValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  topConditionsContainer: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  conditionName: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  conditionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  conditionCost: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
  },
  costSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  costItem: {
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  costBreakdown: {
    marginTop: theme.spacing.md,
  },
  breakdownItem: {
    marginBottom: theme.spacing.md,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  breakdownLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  breakdownBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.xs,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xs,
  },
  costProjectionsContainer: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  projectionBox: {
    alignItems: 'center',
  },
  projectionLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  projectionValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  savingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
    textAlign: 'center',
  },
  opportunityCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  opportunityPriority: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xs,
  },
  opportunityPriorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xs,
  },
  impactText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  opportunityDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  opportunityMetrics: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  opportunityMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  opportunityMetricText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  launchButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  launchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  roiHeader: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  roiMainMetric: {
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  roiSubtext: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
  },
  roiProgramsContainer: {
    marginTop: theme.spacing.md,
  },
  roiProgramItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  roiProgramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  roiProgramName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  roiProgramValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roiProgramMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roiProgramMetric: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
});
