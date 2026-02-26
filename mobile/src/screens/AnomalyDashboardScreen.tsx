import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';
import {
  getPatientAnomalies,
  selectAnomalies,
  selectUnresolvedCount,
  selectCriticalCount,
  selectAnomalyIsLoading,
  selectAnomalyError,
} from '../store/slices/anomalySlice';
import type { AppDispatch } from '../store/store';

const { width } = Dimensions.get('window');

const AnomalyDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const anomalies = useSelector(selectAnomalies);
  const unresolvedCount = useSelector(selectUnresolvedCount);
  const criticalCount = useSelector(selectCriticalCount);
  const isLoading = useSelector(selectAnomalyIsLoading);
  const error = useSelector(selectAnomalyError);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unresolved' | 'critical'>('all');

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    try {
      // Using 'me' as placeholder - backend should resolve to actual patient DID
      await dispatch(getPatientAnomalies('me')).unwrap();
    } catch (err) {
      Alert.alert('Error', 'Failed to load anomalies. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnomalies();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'warning';
      case 'low':
        return 'information-circle';
      default:
        return 'help-circle';
    }
  };

  const getAnomalyTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('heart') || lowerType.includes('cardiac')) return 'heart';
    if (lowerType.includes('blood') || lowerType.includes('pressure')) return 'water';
    if (lowerType.includes('temperature') || lowerType.includes('fever')) return 'thermometer';
    if (lowerType.includes('oxygen') || lowerType.includes('spo2')) return 'pulse';
    if (lowerType.includes('glucose') || lowerType.includes('sugar')) return 'nutrition';
    if (lowerType.includes('activity') || lowerType.includes('movement')) return 'walk';
    return 'fitness';
  };

  const filteredAnomalies = anomalies.filter((anomaly) => {
    if (selectedFilter === 'unresolved') return !anomaly.resolved;
    if (selectedFilter === 'critical') return anomaly.severity === 'critical';
    return true;
  });

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const detected = new Date(timestamp);
    const diffMs = now.getTime() - detected.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary.colors}
        style={styles.header}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Return to previous screen"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Typography variant="h1" color="inverse" weight="bold">
              Anomaly Monitor
            </Typography>
            <Typography variant="bodySmall" color="inverse" style={styles.headerSubtitle}>
              Real-time Health Monitoring
            </Typography>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            accessibilityHint="Configure anomaly detection settings"
          >
            <Ionicons name="settings" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Typography variant="h1" color="inverse" weight="bold">
              {anomalies.length}
            </Typography>
            <Typography variant="caption" color="inverse" style={styles.statLabel}>
              Total
            </Typography>
          </View>
          <View style={styles.statCard}>
            <Typography variant="h1" weight="bold" style={{ color: '#fbbf24' }}>
              {unresolvedCount}
            </Typography>
            <Typography variant="caption" color="inverse" style={styles.statLabel}>
              Unresolved
            </Typography>
          </View>
          <View style={styles.statCard}>
            <Typography variant="h1" weight="bold" style={{ color: '#ef4444' }}>
              {criticalCount}
            </Typography>
            <Typography variant="caption" color="inverse" style={styles.statLabel}>
              Critical
            </Typography>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
          accessibilityRole="button"
          accessibilityLabel="Show all anomalies"
          accessibilityState={{ selected: selectedFilter === 'all' }}
          accessibilityHint="Display all detected health anomalies"
        >
          <Typography
            variant="bodySmall"
            weight="semibold"
            style={[
              styles.filterText,
              selectedFilter === 'all' && styles.filterTextActive
            ]}
          >
            All Anomalies
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'unresolved' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('unresolved')}
          accessibilityRole="button"
          accessibilityLabel="Show unresolved anomalies"
          accessibilityState={{ selected: selectedFilter === 'unresolved' }}
          accessibilityHint="Display anomalies that require attention"
        >
          <Typography
            variant="bodySmall"
            weight="semibold"
            style={[
              styles.filterText,
              selectedFilter === 'unresolved' && styles.filterTextActive
            ]}
          >
            Unresolved
          </Typography>
          {unresolvedCount > 0 && (
            <View style={styles.badge} importantForAccessibility="no" accessible={false}>
              <Typography variant="caption" weight="bold" color="inverse">
                {unresolvedCount}
              </Typography>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'critical' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('critical')}
          accessibilityRole="button"
          accessibilityLabel="Show critical anomalies"
          accessibilityState={{ selected: selectedFilter === 'critical' }}
          accessibilityHint="Display only high-priority critical anomalies"
        >
          <Typography
            variant="bodySmall"
            weight="semibold"
            style={[
              styles.filterText,
              selectedFilter === 'critical' && styles.filterTextActive
            ]}
          >
            Critical
          </Typography>
          {criticalCount > 0 && (
            <View style={[styles.badge, styles.badgeCritical]} importantForAccessibility="no" accessible={false}>
              <Typography variant="caption" weight="bold" color="inverse">
                {criticalCount}
              </Typography>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        accessibilityLabel="Health anomalies list"
        accessibilityRole="scrollview"
      >
        {isLoading && anomalies.length === 0 ? (
          <LoadingSpinner
            fullScreen={false}
            size="large"
            text="Loading anomalies..."
            color={theme.colors.primary}
            style={styles.loadingContainer}
          />
        ) : filteredAnomalies.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer} importantForAccessibility="no" accessible={false}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" importantForAccessibility="no" accessible={false} />
            </View>
            <Typography variant="h2" weight="bold" color="primary">
              All Clear!
            </Typography>
            <Typography variant="body" color="secondary" align="center" style={styles.emptyStateText}>
              {selectedFilter === 'all'
                ? 'No anomalies detected yet'
                : selectedFilter === 'unresolved'
                ? 'All anomalies have been resolved'
                : 'No critical anomalies detected'}
            </Typography>
          </View>
        ) : (
          <View style={styles.anomaliesContainer}>
            {filteredAnomalies.map((anomaly) => {
              const severityColor = getSeverityColor(anomaly.severity);
              const severityIcon = getSeverityIcon(anomaly.severity);
              const typeIcon = getAnomalyTypeIcon(anomaly.anomaly_type);

              return (
                <Card
                  key={anomaly.id}
                  elevated
                  elevation="sm"
                  padding="lg"
                  style={styles.anomalyCard}
                  onPress={() => {}}
                  accessibilityRole="button"
                  accessibilityLabel={`${anomaly.anomaly_type.replace(/_/g, ' ')}, ${anomaly.severity} severity, detected ${getTimeAgo(anomaly.detected_at)}, AI confidence ${(anomaly.ai_confidence * 100).toFixed(1)} percent`}
                  accessibilityHint="View detailed anomaly information and take action"
                >
                  <View style={styles.anomalyHeader}>
                    <View style={[styles.anomalyIconContainer, { backgroundColor: severityColor + '20' }]} importantForAccessibility="no" accessible={false}>
                      <Ionicons name={typeIcon as any} size={28} color={severityColor} importantForAccessibility="no" accessible={false} />
                    </View>
                    <View style={styles.anomalyTitleContainer}>
                      <Typography variant="body" weight="bold" color="primary" style={styles.anomalyType}>
                        {anomaly.anomaly_type.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {getTimeAgo(anomaly.detected_at)}
                      </Typography>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]} importantForAccessibility="no-hide-descendants">
                      <Ionicons name={severityIcon as any} size={16} color={severityColor} importantForAccessibility="no" accessible={false} />
                      <Typography variant="caption" weight="bold" style={{ color: severityColor }}>
                        {anomaly.severity.toUpperCase()}
                      </Typography>
                    </View>
                  </View>

                  {/* Sensor Data */}
                  <View style={styles.sensorDataContainer}>
                    <Typography variant="bodySmall" weight="bold" color="secondary" style={styles.sensorDataTitle}>
                      Sensor Readings:
                    </Typography>
                    <View style={styles.sensorDataGrid}>
                      {Object.entries(anomaly.sensor_data || {}).map(([key, value]) => (
                        <View key={key} style={styles.sensorDataItem}>
                          <Typography variant="caption" color="secondary" style={styles.sensorDataKey}>
                            {key.replace(/_/g, ' ')}:
                          </Typography>
                          <Typography variant="caption" weight="semibold" color="primary">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* AI Confidence */}
                  <View style={styles.confidenceContainer}>
                    <Typography variant="caption" color="secondary" weight="semibold">
                      AI Confidence:
                    </Typography>
                    <View style={styles.confidenceBarBg}>
                      <LinearGradient
                        colors={theme.gradients.primary.colors}
                        style={[
                          styles.confidenceBar,
                          { width: `${anomaly.ai_confidence * 100}%` },
                        ]}
                        start={theme.gradients.primary.start}
                        end={{ x: 1, y: 0 }}
                        accessible={false}
                        importantForAccessibility="no"
                      />
                    </View>
                    <Typography variant="caption" weight="bold" style={styles.confidenceValue}>
                      {(anomaly.ai_confidence * 100).toFixed(1)}%
                    </Typography>
                  </View>

                  {/* Action Taken */}
                  {anomaly.action_taken && (
                    <View style={styles.actionContainer}>
                      <Ionicons name="medical" size={16} color="#10b981" importantForAccessibility="no" accessible={false} />
                      <Typography variant="caption" style={styles.actionText}>
                        {anomaly.action_taken}
                      </Typography>
                    </View>
                  )}

                  {/* Footer */}
                  <View style={styles.anomalyFooter}>
                    <View style={styles.deviceInfo}>
                      <Ionicons name="watch" size={16} color="#64748b" importantForAccessibility="no" accessible={false} />
                      <Typography variant="caption" color="secondary">
                        Device: {anomaly.device_id.substring(0, 8)}...
                      </Typography>
                    </View>
                    <View style={styles.blockchainBadge}>
                      <Ionicons name="shield-checkmark" size={14} color="#10b981" importantForAccessibility="no" accessible={false} />
                      <Typography variant="caption" weight="semibold" style={styles.blockchainText}>
                        Verified
                      </Typography>
                    </View>
                    {anomaly.resolved ? (
                      <View style={styles.resolvedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10b981" importantForAccessibility="no" accessible={false} />
                        <Typography variant="caption" weight="semibold" style={styles.resolvedText}>
                          Resolved
                        </Typography>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.resolveButton}
                        accessibilityRole="button"
                        accessibilityLabel="Mark anomaly as resolved"
                        accessibilityHint="Mark this health anomaly as addressed and resolved"
                      >
                        <Typography variant="caption" weight="bold" style={styles.resolveButtonText}>
                          Mark Resolved
                        </Typography>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" importantForAccessibility="no" accessible={false} />
            <Typography variant="body" style={styles.errorText}>
              {error}
            </Typography>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    opacity: 0.9,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xxs,
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.9,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xxs,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  filterText: {
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.primary,
  },
  badge: {
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    marginLeft: theme.spacing.xs,
  },
  badgeCritical: {
    backgroundColor: '#ef4444',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.lg,
  },
  emptyStateText: {
    marginTop: theme.spacing.xs,
  },
  anomaliesContainer: {
    padding: theme.spacing.lg,
  },
  anomalyCard: {
    marginBottom: theme.spacing.md,
  },
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  anomalyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  anomalyTitleContainer: {
    flex: 1,
  },
  anomalyType: {
    textTransform: 'capitalize',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  sensorDataContainer: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
  },
  sensorDataTitle: {
    marginBottom: theme.spacing.sm,
  },
  sensorDataGrid: {
    gap: theme.spacing.xs,
  },
  sensorDataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensorDataKey: {
    textTransform: 'capitalize',
  },
  confidenceContainer: {
    marginBottom: theme.spacing.sm,
  },
  confidenceBarBg: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginVertical: theme.spacing.xs,
  },
  confidenceBar: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  confidenceValue: {
    color: theme.colors.primary,
    textAlign: 'right',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  actionText: {
    color: '#065f46',
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  anomalyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  deviceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  blockchainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  blockchainText: {
    color: '#10b981',
    marginLeft: theme.spacing.xxs,
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resolvedText: {
    color: '#10b981',
    marginLeft: theme.spacing.xxs,
  },
  resolveButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  resolveButtonText: {
    color: theme.colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
});

export default AnomalyDashboardScreen;
