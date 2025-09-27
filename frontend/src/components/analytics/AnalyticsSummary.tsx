import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { formatAnalyticsSummary } from '../../utils/analyticsUtils';
import { theme } from '../../theme/theme';

interface AnalyticsSummaryProps {
  summary: {
    totalForecasts: number;
    activeAnomalies: number;
    personalizedBaselines: number;
    lastAnalysisDate: string | null;
  };
  onViewForecasts?: () => void;
  onViewAnomalies?: () => void;
  onViewBaselines?: () => void;
  isLoading?: boolean;
}

interface SummaryItemProps {
  icon: string;
  title: string;
  value: number | string;
  subtitle?: string;
  color: string;
  onPress?: () => void;
}

const SummaryItem: React.FC<SummaryItemProps> = ({
  icon,
  title,
  value,
  subtitle,
  color,
  onPress
}) => {
  return (
    <TouchableOpacity
      style={[styles.summaryItem, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryTitle}>{title}</Text>
        {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
      </View>
      {onPress && (
        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
};

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({
  summary,
  onViewForecasts,
  onViewAnomalies,
  onViewBaselines,
  isLoading = false
}) => {
  const formattedSummary = formatAnalyticsSummary(summary);

  const getAnomalyColor = (count: number) => {
    if (count === 0) return theme.colors.success;
    if (count <= 2) return theme.colors.warning;
    return theme.colors.error;
  };

  const getAnalysisStatusColor = (hasRecent: boolean) => {
    return hasRecent ? theme.colors.success : theme.colors.warning;
  };

  const getAnalysisStatusText = (hasRecent: boolean, lastAnalysis: string) => {
    if (lastAnalysis === 'Never') return 'No analysis yet';
    return hasRecent ? 'Recently analyzed' : 'Analysis needed';
  };

  if (isLoading) {
    return (
      <Card containerStyle={styles.card}>
        <View style={styles.loadingContainer}>
          <Icon name="analytics" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.loadingText}>Loading analytics summary...</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card containerStyle={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="analytics" size={24} color={theme.colors.primary} />
          <Text style={styles.title}>Analytics Overview</Text>
        </View>
        <View style={styles.statusContainer}>
          <Icon 
            name={formattedSummary.hasRecentAnalysis ? 'check-circle' : 'schedule'} 
            size={16} 
            color={getAnalysisStatusColor(formattedSummary.hasRecentAnalysis)} 
          />
          <Text style={[
            styles.statusText, 
            { color: getAnalysisStatusColor(formattedSummary.hasRecentAnalysis) }
          ]}>
            {getAnalysisStatusText(formattedSummary.hasRecentAnalysis, formattedSummary.lastAnalysisFormatted)}
          </Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryItem
          icon="trending-up"
          title="Active Forecasts"
          value={summary.totalForecasts}
          subtitle="Predictive models"
          color={theme.colors.primary}
          onPress={onViewForecasts}
        />

        <SummaryItem
          icon="warning"
          title="Anomalies"
          value={summary.activeAnomalies}
          subtitle={summary.activeAnomalies === 0 ? "All normal" : "Need attention"}
          color={getAnomalyColor(summary.activeAnomalies)}
          onPress={onViewAnomalies}
        />

        <SummaryItem
          icon="person"
          title="Baselines"
          value={summary.personalizedBaselines}
          subtitle="Personal metrics"
          color={theme.colors.info}
          onPress={onViewBaselines}
        />

        <SummaryItem
          icon="schedule"
          title="Last Analysis"
          value={formattedSummary.lastAnalysisFormatted}
          subtitle="Data freshness"
          color={getAnalysisStatusColor(formattedSummary.hasRecentAnalysis)}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onViewForecasts}>
            <Icon name="trending-up" size={16} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>View Forecasts</Text>
          </TouchableOpacity>
          
          {summary.activeAnomalies > 0 && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.warningButton]} 
              onPress={onViewAnomalies}
            >
              <Icon name="warning" size={16} color={theme.colors.warning} />
              <Text style={[styles.actionButtonText, { color: theme.colors.warning }]}>
                Check Anomalies
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  quickActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  warningButton: {
    borderColor: theme.colors.warning,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
});

export default AnalyticsSummary;
