import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import type { AnomalyDetection } from '../../services/analytics/advancedAnalytics';
import { 
  formatAnomaliesForDisplay,
  getAnomalySeverityColor,
  getAnomalySeverityIcon 
} from '../../utils/analyticsUtils';
import { theme } from '../../theme/theme';

interface AnomalyAlertProps {
  anomalies: AnomalyDetection[];
  onAnomalyPress?: (anomaly: AnomalyDetection) => void;
  maxDisplay?: number;
  showAll?: boolean;
}

interface AnomalyItemProps {
  anomaly: AnomalyDetection & {
    color: string;
    icon: string;
    formattedTimestamp: string;
    scorePercentage: number;
  };
  onPress?: (anomaly: AnomalyDetection) => void;
}

const AnomalyItem: React.FC<AnomalyItemProps> = ({ anomaly, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.anomalyItem, { borderLeftColor: anomaly.color }]}
      onPress={() => onPress?.(anomaly)}
      activeOpacity={0.7}
    >
      <View style={styles.anomalyHeader}>
        <View style={styles.anomalyTitleContainer}>
          <Icon name={anomaly.icon} size={20} color={anomaly.color} />
          <Text style={styles.anomalyMetric}>{anomaly.metric}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: anomaly.color }]}>
          <Text style={styles.severityText}>{anomaly.severity.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.anomalyExplanation}>{anomaly.explanation}</Text>

      <View style={styles.anomalyDetails}>
        <View style={styles.anomalyDetailItem}>
          <Text style={styles.anomalyDetailLabel}>Value:</Text>
          <Text style={styles.anomalyDetailValue}>{anomaly.value.toFixed(2)}</Text>
        </View>
        <View style={styles.anomalyDetailItem}>
          <Text style={styles.anomalyDetailLabel}>Score:</Text>
          <Text style={styles.anomalyDetailValue}>{anomaly.scorePercentage}%</Text>
        </View>
        <View style={styles.anomalyDetailItem}>
          <Text style={styles.anomalyDetailLabel}>Time:</Text>
          <Text style={styles.anomalyDetailValue}>{anomaly.formattedTimestamp}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const AnomalyAlert: React.FC<AnomalyAlertProps> = ({
  anomalies,
  onAnomalyPress,
  maxDisplay = 5,
  showAll = false
}) => {
  const formattedAnomalies = formatAnomaliesForDisplay(anomalies);
  const displayAnomalies = showAll ? formattedAnomalies : formattedAnomalies.slice(0, maxDisplay);

  // Group anomalies by severity
  const criticalAnomalies = formattedAnomalies.filter(a => a.severity === 'critical');
  const highAnomalies = formattedAnomalies.filter(a => a.severity === 'high');
  const mediumAnomalies = formattedAnomalies.filter(a => a.severity === 'medium');
  const lowAnomalies = formattedAnomalies.filter(a => a.severity === 'low');

  const getSummaryColor = () => {
    if (criticalAnomalies.length > 0) return theme.colors.error;
    if (highAnomalies.length > 0) return theme.colors.warning;
    if (mediumAnomalies.length > 0) return '#FFC107';
    return theme.colors.success;
  };

  const getSummaryIcon = () => {
    if (criticalAnomalies.length > 0) return 'error';
    if (highAnomalies.length > 0) return 'warning';
    if (mediumAnomalies.length > 0) return 'info';
    return 'check-circle';
  };

  if (anomalies.length === 0) {
    return (
      <Card containerStyle={styles.card}>
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={48} color={theme.colors.success} />
          <Text style={styles.emptyTitle}>No Anomalies Detected</Text>
          <Text style={styles.emptySubtitle}>
            Your health metrics are within normal ranges
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card containerStyle={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name={getSummaryIcon()} size={24} color={getSummaryColor()} />
          <Text style={styles.title}>Health Anomalies</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: getSummaryColor() }]}>
          <Text style={styles.countText}>{anomalies.length}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        {criticalAnomalies.length > 0 && (
          <View style={styles.summaryItem}>
            <Icon name="error" size={16} color={theme.colors.error} />
            <Text style={[styles.summaryText, { color: theme.colors.error }]}>
              {criticalAnomalies.length} Critical
            </Text>
          </View>
        )}
        {highAnomalies.length > 0 && (
          <View style={styles.summaryItem}>
            <Icon name="warning" size={16} color={theme.colors.warning} />
            <Text style={[styles.summaryText, { color: theme.colors.warning }]}>
              {highAnomalies.length} High
            </Text>
          </View>
        )}
        {mediumAnomalies.length > 0 && (
          <View style={styles.summaryItem}>
            <Icon name="info" size={16} color="#FFC107" />
            <Text style={[styles.summaryText, { color: '#FFC107' }]}>
              {mediumAnomalies.length} Medium
            </Text>
          </View>
        )}
        {lowAnomalies.length > 0 && (
          <View style={styles.summaryItem}>
            <Icon name="info" size={16} color={theme.colors.success} />
            <Text style={[styles.summaryText, { color: theme.colors.success }]}>
              {lowAnomalies.length} Low
            </Text>
          </View>
        )}
      </View>

      {/* Anomaly List */}
      <FlatList
        data={displayAnomalies}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        renderItem={({ item }) => (
          <AnomalyItem anomaly={item} onPress={onAnomalyPress} />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.anomalyList}
      />

      {!showAll && formattedAnomalies.length > maxDisplay && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Showing {maxDisplay} of {formattedAnomalies.length} anomalies
          </Text>
        </View>
      )}
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
    marginBottom: 16,
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
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  anomalyList: {
    maxHeight: 300,
  },
  anomalyItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  anomalyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  anomalyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  anomalyMetric: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  anomalyExplanation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  anomalyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  anomalyDetailItem: {
    flex: 1,
  },
  anomalyDetailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  anomalyDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AnomalyAlert;
