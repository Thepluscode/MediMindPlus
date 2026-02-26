/**
 * Wearable Vitals Dashboard
 * Displays real-time health data from connected wearable devices
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

const API_URL = 'http://localhost:3000/api';

interface VitalSigns {
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodGlucose?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  bodyTemperature?: number;
  timestamp: Date;
}

interface ActivityData {
  steps: number;
  distance: number;
  activeEnergyBurned: number;
  timestamp: Date;
}

interface BodyMetrics {
  weight?: number;
  height?: number;
  bmi?: number;
  timestamp: Date;
}

interface DashboardData {
  latestVitals: VitalSigns | null;
  todayActivity: ActivityData | null;
  latestBodyMetrics: BodyMetrics | null;
  weeklyStepsAverage: number;
  weeklySleepAverage: number;
}

export default function WearableVitalsDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    checkConnectionStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        Alert.alert('Authentication Error', 'Please log in to view your health data.');
        return;
      }

      const response = await axios.get(
        `${API_URL}/wearable/${userId}/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load health data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) return;

      const response = await axios.get(
        `${API_URL}/wearable/${userId}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setConnected(response.data.data.connected);
        setLastSync(response.data.data.lastSync);
      }
    } catch (error) {
      // Silently fail for connection status check
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    checkConnectionStatus();
  };

  const syncNow = async () => {
    // This would trigger a sync with Apple Health or other wearable
    // For now, just refresh the data
    onRefresh();
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading your health data..."
        color={theme.colors.info}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      accessibilityLabel="Wearable health data dashboard"
      accessibilityRole="scrollview"
    >
      {/* Header with Connection Status */}
      <Card padding="lg" style={styles.header}>
        <Typography variant="h2" weight="bold" color="primary">
          Health Dashboard
        </Typography>
        <View
          style={styles.connectionStatus}
          accessibilityLabel={connected ? 'Wearable device connected' : 'Wearable device not connected'}
          accessibilityRole="text"
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: connected ? theme.colors.success : theme.colors.error },
            ]}
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography variant="body" color="secondary">
            {connected ? 'Connected' : 'Not Connected'}
          </Typography>
        </View>
        {lastSync && (
          <Typography variant="caption" color="secondary" style={styles.lastSyncText}>
            Last synced: {new Date(lastSync).toLocaleTimeString()}
          </Typography>
        )}
      </Card>

      {/* Sync Button */}
      <TouchableOpacity
        style={styles.syncButton}
        onPress={syncNow}
        accessibilityRole="button"
        accessibilityLabel="Sync health data now"
        accessibilityHint="Sync your latest health data from connected wearable devices"
      >
        <Ionicons
          name="sync"
          size={20}
          color="#FFF"
          importantForAccessibility="no"
          accessible={false}
        />
        <Typography variant="body" weight="semibold" color="inverse">
          Sync Now
        </Typography>
      </TouchableOpacity>

      {/* Vital Signs Section */}
      {dashboard?.latestVitals && (
        <View style={styles.section}>
          <Typography variant="h3" weight="semibold" color="primary" style={styles.sectionTitle}>
            Latest Vitals
          </Typography>
          <View style={styles.vitalsGrid}>
            {dashboard.latestVitals.heartRate && (
              <VitalCard
                icon="heart"
                label="Heart Rate"
                value={`${dashboard.latestVitals.heartRate}`}
                unit="bpm"
                color="#FF3B30"
              />
            )}
            {dashboard.latestVitals.bloodPressure && (
              <VitalCard
                icon="pulse"
                label="Blood Pressure"
                value={`${dashboard.latestVitals.bloodPressure.systolic}/${dashboard.latestVitals.bloodPressure.diastolic}`}
                unit="mmHg"
                color="#FF9500"
              />
            )}
            {dashboard.latestVitals.oxygenSaturation && (
              <VitalCard
                icon="water"
                label="O2 Saturation"
                value={`${dashboard.latestVitals.oxygenSaturation}`}
                unit="%"
                color="#007AFF"
              />
            )}
            {dashboard.latestVitals.bloodGlucose && (
              <VitalCard
                icon="analytics"
                label="Blood Glucose"
                value={`${dashboard.latestVitals.bloodGlucose}`}
                unit="mg/dL"
                color="#34C759"
              />
            )}
          </View>
        </View>
      )}

      {/* Activity Section */}
      {dashboard?.todayActivity && (
        <View style={styles.section}>
          <Typography variant="h3" weight="semibold" color="primary" style={styles.sectionTitle}>
            Today's Activity
          </Typography>
          <View style={styles.activityCard}>
            <ActivityMetric
              icon="walk"
              label="Steps"
              value={dashboard.todayActivity.steps.toLocaleString()}
              color="#5856D6"
            />
            <ActivityMetric
              icon="navigate"
              label="Distance"
              value={`${(dashboard.todayActivity.distance / 1000).toFixed(2)}`}
              unit="km"
              color="#FF2D55"
            />
            <ActivityMetric
              icon="flame"
              label="Calories"
              value={Math.round(
                dashboard.todayActivity.activeEnergyBurned
              ).toString()}
              unit="kcal"
              color="#FF9500"
            />
          </View>
        </View>
      )}

      {/* Weekly Averages */}
      <View style={styles.section}>
        <Typography variant="h3" weight="semibold" color="primary" style={styles.sectionTitle}>
          Weekly Averages
        </Typography>
        <View style={styles.averagesCard}>
          <View
            style={styles.averageItem}
            accessibilityLabel={`Average steps per day: ${dashboard?.weeklyStepsAverage?.toLocaleString() || '0'}`}
            accessibilityRole="text"
          >
            <Ionicons
              name="footsteps"
              size={32}
              color={theme.colors.primary}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="h2" weight="bold" color="primary" style={styles.averageValue}>
              {dashboard?.weeklyStepsAverage?.toLocaleString() || '0'}
            </Typography>
            <Typography variant="caption" color="secondary" align="center">
              Avg Steps/Day
            </Typography>
          </View>
          <View style={styles.divider} importantForAccessibility="no" accessible={false} />
          <View
            style={styles.averageItem}
            accessibilityLabel={`Average sleep per night: ${dashboard?.weeklySleepAverage || '0'} hours`}
            accessibilityRole="text"
          >
            <Ionicons
              name="moon"
              size={32}
              color={theme.colors.warning}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="h2" weight="bold" color="primary" style={styles.averageValue}>
              {dashboard?.weeklySleepAverage || '0'}h
            </Typography>
            <Typography variant="caption" color="secondary" align="center">
              Avg Sleep
            </Typography>
          </View>
        </View>
      </View>

      {/* Body Metrics */}
      {dashboard?.latestBodyMetrics && (
        <View style={styles.section}>
          <Typography variant="h3" weight="semibold" color="primary" style={styles.sectionTitle}>
            Body Metrics
          </Typography>
          <View style={styles.metricsCard}>
            {dashboard.latestBodyMetrics.weight && (
              <MetricRow
                label="Weight"
                value={`${dashboard.latestBodyMetrics.weight.toFixed(1)} kg`}
              />
            )}
            {dashboard.latestBodyMetrics.height && (
              <MetricRow
                label="Height"
                value={`${dashboard.latestBodyMetrics.height.toFixed(0)} cm`}
              />
            )}
            {dashboard.latestBodyMetrics.bmi && (
              <MetricRow
                label="BMI"
                value={dashboard.latestBodyMetrics.bmi.toFixed(1)}
              />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

interface VitalCardProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  color: string;
}

function VitalCard({ icon, label, value, unit, color }: VitalCardProps) {
  return (
    <View
      style={styles.vitalCard}
      accessibilityLabel={`${label}: ${value} ${unit || ''}`}
      accessibilityRole="text"
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={color}
        importantForAccessibility="no"
        accessible={false}
      />
      <View style={styles.vitalValueRow}>
        <Typography variant="h2" weight="bold" color="primary">
          {value}
        </Typography>
        {unit && (
          <Typography variant="body" color="secondary" style={styles.vitalUnit}>
            {' '}{unit}
          </Typography>
        )}
      </View>
      <Typography variant="caption" color="secondary" align="center">
        {label}
      </Typography>
    </View>
  );
}

interface ActivityMetricProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  color: string;
}

function ActivityMetric({
  icon,
  label,
  value,
  unit,
  color,
}: ActivityMetricProps) {
  return (
    <View
      style={styles.activityMetric}
      accessibilityLabel={`${label}: ${value} ${unit || ''}`}
      accessibilityRole="text"
    >
      <Ionicons
        name={icon as any}
        size={28}
        color={color}
        importantForAccessibility="no"
        accessible={false}
      />
      <View style={styles.activityValueRow}>
        <Typography variant="h3" weight="bold" color="primary">
          {value}
        </Typography>
        {unit && (
          <Typography variant="body" color="secondary" style={styles.activityUnit}>
            {' '}{unit}
          </Typography>
        )}
      </View>
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
    </View>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <View style={styles.metricRow}>
      <Typography variant="body" color="primary">{label}</Typography>
      <Typography variant="body" weight="semibold" style={styles.metricValue}>
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  lastSyncText: {
    marginTop: theme.spacing.xxs,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.info,
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.xs,
  },
  vitalCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    margin: theme.spacing.xs,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: theme.spacing.xs,
  },
  vitalUnit: {
    marginLeft: theme.spacing.xxs,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityMetric: {
    alignItems: 'center',
  },
  activityValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: theme.spacing.xs,
  },
  activityUnit: {
    marginLeft: theme.spacing.xxs,
  },
  averagesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  averageItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: theme.colors.border,
  },
  averageValue: {
    marginTop: theme.spacing.sm,
  },
  metricsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundAlt,
  },
  metricValue: {
    color: theme.colors.info,
  },
});
