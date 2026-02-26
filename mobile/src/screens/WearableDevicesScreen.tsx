import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface WearableDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  status: 'connected' | 'syncing' | 'disconnected';
  battery: number;
  last_sync: string;
  data_points_today: number;
  capabilities: string[];
  icon: string;
  color: string;
}

interface BiometricData {
  heart_rate: {
    current: number;
    min_today: number;
    max_today: number;
    avg_today: number;
    source: string;
    trend: number[];
    last_update: string;
  };
  steps: {
    current: number;
    goal: number;
    source: string;
    calories: number;
    distance: number;
    active_minutes: number;
  };
  sleep: {
    last_night: number;
    deep_sleep: number;
    light_sleep: number;
    rem_sleep: number;
    awakenings: number;
    quality: number;
    source: string;
  };
  hrv: {
    current: number;
    avg_7day: number;
    trend: string;
    source: string;
    interpretation: string;
  };
}

const WearableDevicesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connected' | 'realtime-data' | 'add-device' | 'settings'>('connected');
  const [refreshing, setRefreshing] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<WearableDevice[]>([
    {
      id: 'apple_watch',
      name: 'Apple Watch Series 9',
      manufacturer: 'Apple',
      type: 'Smartwatch',
      status: 'connected',
      battery: 78,
      last_sync: '2 minutes ago',
      data_points_today: 8543,
      capabilities: ['Heart Rate', 'ECG', 'Blood Oxygen', 'Activity', 'Sleep', 'Temperature'],
      icon: '⌚',
      color: '#3b82f6',
    },
    {
      id: 'oura_ring',
      name: 'Oura Ring Gen 3',
      manufacturer: 'Oura',
      type: 'Smart Ring',
      status: 'connected',
      battery: 45,
      last_sync: '15 minutes ago',
      data_points_today: 2441,
      capabilities: ['HRV', 'Sleep Stages', 'Temperature', 'Readiness', 'Activity'],
      icon: '💍',
      color: '#8b5cf6',
    },
  ]);

  const [realtimeData, setRealtimeData] = useState<BiometricData>({
    heart_rate: {
      current: 72,
      min_today: 52,
      max_today: 142,
      avg_today: 68,
      source: 'Apple Watch',
      trend: [65, 67, 68, 70, 72, 71, 72, 73, 72],
      last_update: 'Just now',
    },
    steps: {
      current: 8543,
      goal: 10000,
      source: 'Apple Watch',
      calories: 342,
      distance: 6.2,
      active_minutes: 47,
    },
    sleep: {
      last_night: 7.8,
      deep_sleep: 2.1,
      light_sleep: 4.3,
      rem_sleep: 1.4,
      awakenings: 3,
      quality: 87,
      source: 'Oura Ring',
    },
    hrv: {
      current: 68,
      avg_7day: 65,
      trend: 'improving',
      source: 'Oura Ring',
      interpretation: 'Good recovery status',
    },
  });

  const handleSync = async (deviceId: string) => {
    const deviceIndex = connectedDevices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
      const updatedDevices = [...connectedDevices];
      updatedDevices[deviceIndex].status = 'syncing';
      setConnectedDevices(updatedDevices);

      // Simulate sync
      setTimeout(() => {
        updatedDevices[deviceIndex].status = 'connected';
        updatedDevices[deviceIndex].last_sync = 'Just now';
        setConnectedDevices([...updatedDevices]);
        Alert.alert('Sync Complete', 'Device data has been synchronized successfully.');
      }, 2000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleAddDevice = (deviceName: string, deviceType: string) => {
    Alert.alert(
      `Connect ${deviceName}`,
      `Would you like to connect your ${deviceName} (${deviceType})?\n\nThis will:\n• Sync health data automatically\n• Enable real-time monitoring\n• Improve health insights accuracy`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Connect',
          onPress: () => {
            // Simulate device connection
            Alert.alert(
              'Device Connected!',
              `${deviceName} has been successfully connected. Data synchronization will begin shortly.`,
              [
                {
                  text: 'View Devices',
                  onPress: () => setActiveTab('connected'),
                },
                {
                  text: 'OK',
                  style: 'default',
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderConnectedDevices = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      accessibilityLabel="Connected devices list"
      accessibilityRole="scrollview"
    >
      {connectedDevices.map((device) => (
        <View key={device.id} style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceIcon}>{device.icon}</Text>
              <View style={styles.deviceDetails}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceMeta}>{device.manufacturer} • {device.type}</Text>
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              device.status === 'connected' ? styles.statusConnected :
              device.status === 'syncing' ? styles.statusSyncing :
              styles.statusDisconnected
            ]}>
              <Ionicons
                name={device.status === 'connected' ? 'checkmark-circle' : 'refresh'}
                size={16}
                color={device.status === 'connected' ? '#10b981' : '#3b82f6'}
                importantForAccessibility="no"
                accessible={false}
              />
              <Text style={[
                styles.statusText,
                device.status === 'connected' ? styles.statusConnectedText :
                styles.statusSyncingText
              ]}>
                {device.status}
              </Text>
            </View>
          </View>

          <View style={styles.deviceMetrics}>
            <View style={styles.metricBox}>
              <View style={styles.metricHeader}>
                <Ionicons name="battery-charging" size={20} color="#6b7280" importantForAccessibility="no" accessible={false} />
                <Text style={styles.metricLabel}>Battery</Text>
              </View>
              <Text style={styles.metricValue}>{device.battery}%</Text>
              <View style={styles.batteryBar}>
                <View style={[
                  styles.batteryFill,
                  { width: `${device.battery}%` },
                  device.battery > 50 ? styles.batteryHigh :
                  device.battery > 20 ? styles.batteryMedium :
                  styles.batteryLow
                ]} />
              </View>
            </View>

            <View style={styles.metricBox}>
              <View style={styles.metricHeader}>
                <Ionicons name="wifi" size={20} color="#6b7280" importantForAccessibility="no" accessible={false} />
                <Text style={styles.metricLabel}>Last Sync</Text>
              </View>
              <Text style={styles.metricValueSmall}>{device.last_sync}</Text>
            </View>

            <View style={styles.metricBox}>
              <View style={styles.metricHeader}>
                <Ionicons name="stats-chart" size={20} color="#6b7280" importantForAccessibility="no" accessible={false} />
                <Text style={styles.metricLabel}>Data Points</Text>
              </View>
              <Text style={styles.metricValueSmall}>{device.data_points_today.toLocaleString()}</Text>
              <Text style={styles.metricSubtext}>today</Text>
            </View>

            <TouchableOpacity
              style={[styles.metricBox, styles.syncButton]}
              onPress={() => handleSync(device.id)}
              disabled={device.status === 'syncing'}
              accessibilityRole="button"
              accessibilityLabel={device.status === 'syncing' ? 'Syncing device' : 'Sync device now'}
              accessibilityHint={device.status === 'syncing' ? 'Device is currently syncing' : 'Tap to sync device data'}
            >
              <Text style={styles.syncButtonText}>
                {device.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.capabilitiesContainer}>
            <Text style={styles.capabilitiesTitle}>Capabilities</Text>
            <View style={styles.capabilitiesGrid}>
              {device.capabilities.map((capability, idx) => (
                <View key={idx} style={[styles.capabilityChip, { borderColor: device.color }]}>
                  <Text style={[styles.capabilityText, { color: device.color }]}>{capability}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderRealtimeData = () => (
    <ScrollView style={styles.tabContent} accessibilityLabel="Real-time health metrics" accessibilityRole="scrollview">
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Live Health Metrics</Text>

        {/* Heart Rate */}
        <View style={styles.biometricCard}>
          <View style={styles.biometricHeader}>
            <Text style={styles.biometricTitle}>Heart Rate</Text>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{realtimeData.heart_rate.source}</Text>
            </View>
          </View>
          <View style={styles.biometricValue}>
            <Text style={styles.biometricNumber}>{realtimeData.heart_rate.current}</Text>
            <Text style={styles.biometricUnit}>bpm</Text>
          </View>
          <View style={styles.biometricStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Min</Text>
              <Text style={styles.statValue}>{realtimeData.heart_rate.min_today}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg</Text>
              <Text style={styles.statValue}>{realtimeData.heart_rate.avg_today}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Max</Text>
              <Text style={styles.statValue}>{realtimeData.heart_rate.max_today}</Text>
            </View>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.biometricCard}>
          <View style={styles.biometricHeader}>
            <Text style={styles.biometricTitle}>Activity</Text>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{realtimeData.steps.source}</Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressValue}>{realtimeData.steps.current.toLocaleString()}</Text>
                <Text style={styles.progressLabel}>of {realtimeData.steps.goal.toLocaleString()} steps</Text>
              </View>
              <Text style={styles.progressPercent}>
                {Math.round((realtimeData.steps.current / realtimeData.steps.goal) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${(realtimeData.steps.current / realtimeData.steps.goal) * 100}%` }
              ]} />
            </View>
          </View>
          <View style={styles.activityMetrics}>
            <View style={styles.activityMetric}>
              <Text style={styles.activityLabel}>Calories</Text>
              <Text style={styles.activityValue}>{realtimeData.steps.calories}</Text>
            </View>
            <View style={styles.activityMetric}>
              <Text style={styles.activityLabel}>Distance</Text>
              <Text style={styles.activityValue}>{realtimeData.steps.distance} mi</Text>
            </View>
            <View style={styles.activityMetric}>
              <Text style={styles.activityLabel}>Active Min</Text>
              <Text style={styles.activityValue}>{realtimeData.steps.active_minutes}</Text>
            </View>
          </View>
        </View>

        {/* Sleep */}
        <View style={styles.biometricCard}>
          <View style={styles.biometricHeader}>
            <Text style={styles.biometricTitle}>Sleep (Last Night)</Text>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{realtimeData.sleep.source}</Text>
            </View>
          </View>
          <Text style={styles.sleepTotal}>{realtimeData.sleep.last_night}h</Text>
          <Text style={styles.sleepLabel}>Total Sleep</Text>
          <View style={styles.sleepStages}>
            {[
              { label: 'Deep Sleep', value: realtimeData.sleep.deep_sleep, color: '#4f46e5' },
              { label: 'Light Sleep', value: realtimeData.sleep.light_sleep, color: '#3b82f6' },
              { label: 'REM Sleep', value: realtimeData.sleep.rem_sleep, color: '#8b5cf6' },
            ].map((stage, idx) => (
              <View key={idx} style={styles.sleepStage}>
                <View style={styles.sleepStageHeader}>
                  <Text style={styles.sleepStageLabel}>{stage.label}</Text>
                  <Text style={styles.sleepStageValue}>{stage.value}h</Text>
                </View>
                <View style={styles.sleepProgressBar}>
                  <View style={[
                    styles.sleepProgressFill,
                    {
                      width: `${(stage.value / realtimeData.sleep.last_night) * 100}%`,
                      backgroundColor: stage.color
                    }
                  ]} />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.sleepQuality}>
            <Text style={styles.sleepQualityLabel}>Sleep Quality</Text>
            <Text style={styles.sleepQualityValue}>{realtimeData.sleep.quality}/100</Text>
          </View>
        </View>

        {/* HRV */}
        <View style={styles.biometricCard}>
          <View style={styles.biometricHeader}>
            <Text style={styles.biometricTitle}>Heart Rate Variability</Text>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{realtimeData.hrv.source}</Text>
            </View>
          </View>
          <View style={styles.biometricValue}>
            <Text style={styles.biometricNumber}>{realtimeData.hrv.current}</Text>
            <Text style={styles.biometricUnit}>ms</Text>
          </View>
          <View style={styles.hrvDetails}>
            <View style={styles.hrvDetail}>
              <Text style={styles.hrvDetailLabel}>7-Day Average</Text>
              <Text style={styles.hrvDetailValue}>{realtimeData.hrv.avg_7day} ms</Text>
            </View>
            <View style={styles.hrvDetail}>
              <Text style={styles.hrvDetailLabel}>Trend</Text>
              <Text style={[styles.hrvDetailValue, styles.trendPositive]}>
                {realtimeData.hrv.trend}
              </Text>
            </View>
          </View>
          <View style={styles.interpretation}>
            <Text style={styles.interpretationText}>{realtimeData.hrv.interpretation}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderAddDevice = () => (
    <ScrollView style={styles.tabContent} accessibilityLabel="Add new device" accessibilityRole="scrollview">
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add New Device</Text>
        <Text style={styles.sectionSubtitle}>
          Connect your favorite wearables to get comprehensive health insights
        </Text>
        <View style={styles.deviceList}>
          {[
            { name: 'Apple Watch', icon: '⌚', type: 'Smartwatch' },
            { name: 'Fitbit', icon: '⌚', type: 'Fitness Tracker' },
            { name: 'Garmin', icon: '⌚', type: 'Sports Watch' },
            { name: 'Oura Ring', icon: '💍', type: 'Smart Ring' },
            { name: 'Whoop', icon: '🏃', type: 'Recovery Band' },
            { name: 'Dexcom G7', icon: '💉', type: 'CGM' },
          ].map((device, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.deviceListItem}
              onPress={() => handleAddDevice(device.name, device.type)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${device.name}`}
              accessibilityHint={`Tap to connect your ${device.name} ${device.type}`}
            >
              <Text style={styles.deviceListIcon}>{device.icon}</Text>
              <View style={styles.deviceListInfo}>
                <Text style={styles.deviceListName}>{device.name}</Text>
                <Text style={styles.deviceListType}>{device.type}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.light.colors} start={theme.gradients.light.start} end={theme.gradients.light.end} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="watch" size={32} color="#6366f1" importantForAccessibility="no" accessible={false} />
            </View>
            <View>
              <Text style={styles.title}>Wearable Device Hub</Text>
              <Text style={styles.subtitle}>Universal integration • Real-time sync</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {[
            { icon: 'watch', label: 'Connected Devices', value: connectedDevices.length, color: '#6366f1' },
            { icon: 'stats-chart', label: 'Data Points Today', value: '29K+', color: '#8b5cf6' },
            { icon: 'bluetooth', label: 'Active Syncs', value: '4/4', color: '#3b82f6' },
            { icon: 'battery-charging', label: 'Battery Health', value: 'Good', color: '#10b981' },
          ].map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} importantForAccessibility="no" accessible={false} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabsContainer}>
          {(['connected', 'realtime-data', 'add-device', 'settings'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="button"
              accessibilityLabel={tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              accessibilityHint={`Switch to ${tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} tab`}
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'connected' && renderConnectedDevices()}
        {activeTab === 'realtime-data' && renderRealtimeData()}
        {activeTab === 'add-device' && renderAddDevice()}
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
    backgroundColor: '#e0e7ff',
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
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 11,
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
  deviceCard: {
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
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  deviceMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusConnected: {
    backgroundColor: '#d1fae5',
  },
  statusSyncing: {
    backgroundColor: '#dbeafe',
  },
  statusDisconnected: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusConnectedText: {
    color: '#047857',
  },
  statusSyncingText: {
    color: '#1e40af',
  },
  deviceMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  metricValueSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  metricSubtext: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  batteryBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 4,
  },
  batteryHigh: {
    backgroundColor: '#10b981',
  },
  batteryMedium: {
    backgroundColor: '#f59e0b',
  },
  batteryLow: {
    backgroundColor: '#ef4444',
  },
  syncButton: {
    backgroundColor: '#e0e7ff',
    borderColor: '#c7d2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  capabilitiesContainer: {
    marginTop: 8,
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  capabilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capabilityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  capabilityText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  biometricCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  biometricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sourceBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  biometricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  biometricNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  biometricUnit: {
    fontSize: 20,
    color: '#6b7280',
    marginLeft: 8,
  },
  biometricStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  activityMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  activityMetric: {
    flex: 1,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 12,
  },
  activityLabel: {
    fontSize: 10,
    color: '#059669',
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#047857',
  },
  sleepTotal: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 4,
  },
  sleepLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  sleepStages: {
    marginBottom: 16,
  },
  sleepStage: {
    marginBottom: 8,
  },
  sleepStageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sleepStageLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  sleepStageValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  sleepProgressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sleepProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sleepQuality: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
    padding: 12,
  },
  sleepQualityLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  sleepQualityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  hrvDetails: {
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  hrvDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hrvDetailLabel: {
    fontSize: 12,
    color: '#0f766e',
  },
  hrvDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#115e59',
  },
  trendPositive: {
    color: '#10b981',
    textTransform: 'capitalize',
  },
  interpretation: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 8,
    padding: 12,
  },
  interpretationText: {
    fontSize: 12,
    color: '#047857',
  },
  deviceList: {
    gap: 12,
  },
  deviceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  deviceListIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  deviceListInfo: {
    flex: 1,
  },
  deviceListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  deviceListType: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default WearableDevicesScreen;
