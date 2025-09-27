import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity
} from 'react-native';
import {
  Card,
  Icon,
  useTheme,
  Badge,
  Button,
  Divider
} from 'react-native-elements';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment';

// Import async thunks and selectors from healthDataSlice
import {
  fetchHealthMetrics,
  fetchVitalSigns,
  selectVitalSigns,
  selectBloodPressureReadings,
  selectSleepData,
  selectActivityData,
  selectVoiceRecordings,
  selectHealthMetrics,
  selectCurrentSession,
  selectIsLoading,
  selectIsUploading,
  selectError,
  selectLastSyncTime,
  selectLastUpdated
} from '../store/slices/healthDataSlice';

// Import types
import type { RootState } from '../store/types';
import type {
  HealthDataState,
  HealthDataPoint,
  BloodPressureReading,
  SleepData,
  ActivityData,
  VoiceData,
  HealthMetrics,
  VitalSigns
} from '../types/models/health';

// Import useAppDispatch for proper typing with thunks
import { useAppDispatch, useAppSelector } from '../store/hooks';

import { getRiskPredictions, selectPredictions, selectIsLoading as selectIsPredictionsLoading } from '../store/slices/aiPredictionsSlice';
import { sensorService } from '../services/sensorService';
import { theme } from '../theme/theme';

// Import analytics components and hooks
import {
  AnalyticsSummary,
  ForecastChart,
  AnomalyAlert,
  HealthInsights
} from './analytics';
import {
  useAnalytics,
  useHealthInsights,
  useAnomalyDetection,
  useAnalyticsSummary
} from '../hooks/useAnalytics';
import { convertHealthDataForAnalytics } from '../utils/analyticsUtils';

type HealthDashboardProps = {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HealthDashboard: React.FC<HealthDashboardProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useAppDispatch();
  
  // Get health data from Redux store using selectors with proper typing
  const vitalSigns = useAppSelector(selectVitalSigns);
  const bloodPressureReadings = useAppSelector(selectBloodPressureReadings);
  const sleepData = useAppSelector(selectSleepData);
  const activityData = useAppSelector(selectActivityData);
  const voiceRecordings = useAppSelector(selectVoiceRecordings);
  const healthMetrics = useAppSelector(selectHealthMetrics);
  const currentSession = useAppSelector(selectCurrentSession);
  const isLoading = useAppSelector(selectIsLoading);
  const isUploading = useAppSelector(selectIsUploading);
  const error = useAppSelector(selectError);
  const lastSyncTime = useAppSelector(selectLastSyncTime);
  const lastUpdated = useAppSelector(selectLastUpdated);

  const predictions = useAppSelector(selectPredictions);
  const isPredictionsLoading = useAppSelector(selectIsPredictionsLoading);
  const predictionsError = useAppSelector((state) => state.aiPredictions.error);

  const { user } = useSelector((state: RootState) => state.auth);

  // Create a mock latest prediction since predictions is now RiskPredictions object
  const latestPrediction = predictions ? {
    status: 'completed' as const,
    confidence: Math.max(...Object.values(predictions)) * 100,
    timestamp: new Date().toISOString()
  } : null;

  // Analytics hooks
  const userId = user?.id || 'demo-user';

  // Convert HealthMetrics to HealthDataPoint format
  const convertHealthMetricsToDataPoints = (metrics: HealthMetrics[]): HealthDataPoint[] => {
    const dataPoints: HealthDataPoint[] = [];

    metrics.forEach(metric => {
      // Convert each metric property to a HealthDataPoint
      if (metric.heartRate !== undefined) {
        dataPoints.push({
          value: metric.heartRate,
          timestamp: metric.timestamp,
          unit: 'bpm'
        });
      }
      if (metric.systolicBp !== undefined) {
        dataPoints.push({
          value: metric.systolicBp,
          timestamp: metric.timestamp,
          unit: 'mmHg'
        });
      }
      if (metric.diastolicBp !== undefined) {
        dataPoints.push({
          value: metric.diastolicBp,
          timestamp: metric.timestamp,
          unit: 'mmHg'
        });
      }
      if (metric.temperature !== undefined) {
        dataPoints.push({
          value: metric.temperature,
          timestamp: metric.timestamp,
          unit: '°C'
        });
      }
      if (metric.respiratoryRate !== undefined) {
        dataPoints.push({
          value: metric.respiratoryRate,
          timestamp: metric.timestamp,
          unit: 'breaths/min'
        });
      }
      if (metric.oxygenSaturation !== undefined) {
        dataPoints.push({
          value: metric.oxygenSaturation,
          timestamp: metric.timestamp,
          unit: '%'
        });
      }
    });

    return dataPoints;
  };

  const healthDataPoints = convertHealthMetricsToDataPoints(healthMetrics);
  const analyticsData = convertHealthDataForAnalytics(vitalSigns, healthDataPoints);

  const {
    forecasts,
    isLoadingForecasts,
    createForecast
  } = useAnalytics();

  const {
    insights,
    recommendations,
    riskFactors,
    isLoading: isLoadingInsights,
    refresh: refreshInsights
  } = useHealthInsights(userId, analyticsData);

  const {
    anomalies,
    criticalAnomalies,
    detectAnomalies
  } = useAnomalyDetection(userId);

  const {
    summary: analyticsSummary
  } = useAnalyticsSummary(userId);

  // Load initial data
  useEffect(() => {
    loadData();

    // Clean up sensor service on unmount
    return () => {
      sensorService.stopMonitoring();
    };
  }, []);

  // Function to load all data
  const loadData = useCallback(async () => {
    if (isLoading) return;

    try {
      setRefreshing(true);

      // Fetch health data using the async thunks
      await Promise.all([
        dispatch(fetchVitalSigns({
          startDate: moment().subtract(7, 'days').toISOString(),
          endDate: moment().toISOString(),
          limit: 7
        })),
        dispatch(fetchHealthMetrics({
          startDate: moment().subtract(7, 'days').toISOString(),
          endDate: moment().toISOString(),
          interval: 'day' as const
        }))
      ]);

      // Get risk predictions
      // await dispatch(fetchRiskPredictions());

      // Run analytics if we have data
      if (analyticsData.length > 0) {
        // Detect anomalies in the latest data
        detectAnomalies(analyticsData);

        // Generate forecast for heart rate if we have enough data
        if (vitalSigns.length >= 3) {
          createForecast(userId, 'heart_rate', '7-days');
        }
      }
    } catch (err) {
      console.error('Error loading health data:', err);
      // Handle error appropriately
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, isLoading]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await dispatch(fetchVitalSigns({
        startDate: moment().subtract(7, 'days').toISOString(),
        endDate: moment().toISOString(),
        limit: 7
      }));
      await dispatch(fetchHealthMetrics({
        startDate: moment().subtract(7, 'days').toISOString(),
        endDate: moment().toISOString(),
        interval: 'day' as const
      }));
      await dispatch(getRiskPredictions());
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Calculate activity score (example: based on steps and active minutes)
  const activityScore = activityData && activityData[0]?.steps
    ? Math.min(1, (activityData[0].steps / 10000) * 0.7 + ((activityData[0]?.activeMinutes || 0) / 60) * 0.3)
    : 0;

  // Calculate sleep score (example: based on sleep quality and duration)
  const sleepScore = sleepData && sleepData[0]?.quality ?
    Math.min(Math.max(0, sleepData[0].quality / 10), 1) : 0;

  // Get latest vital signs for display
  const latestHeartRate = vitalSigns && vitalSigns.length > 0
    ? vitalSigns[0].heartRate
    : 0;

  const latestBloodPressure = bloodPressureReadings && bloodPressureReadings.length > 0
    ? bloodPressureReadings[0]
    : { systolic: 0, diastolic: 0, timestamp: new Date().toISOString() };

  const latestOxygenLevel = vitalSigns && vitalSigns.length > 0
    ? vitalSigns[0].oxygenSaturation
    : 0;

  // Prepare chart data
  const heartRateData = {
    labels: vitalSigns.slice(-7).map((_, i) => `Day ${i + 1}`),
    datasets: [{
      data: vitalSigns.slice(-7).map(vs => vs.value || 0),
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      strokeWidth: 2
    }]
  };

  // Get latest blood pressure reading
  const latestBP = bloodPressureReadings[0];

  // Prepare risk assessment data
  const riskData = {
    labels: ['Heart', 'Diabetes', 'Cancer'],
    data: [0.3, 0.45, 0.2], // Example data, replace with actual predictions
  };

  // Render loading state
  if (isLoading || isPredictionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your health data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Health Summary Card */}
      {/* @ts-ignore */}
      <Card containerStyle={styles.card}>
        <Card.Title style={[styles.cardTitle, { fontSize: 20, fontWeight: '600', marginBottom: 10 }]}>Health Summary</Card.Title>
        <Card.Divider style={styles.divider} />

        {/* Vital Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>
          {vitalSigns.length > 0 ? (
            <View>
              <Text>Heart Rate: {vitalSigns[vitalSigns.length - 1].heartRate} bpm</Text>
              <Text>Blood Pressure: {bloodPressureReadings.length > 0 ?
                `${bloodPressureReadings[bloodPressureReadings.length - 1].systolic}/${bloodPressureReadings[bloodPressureReadings.length - 1].diastolic}` : 'N/A'}</Text>
            </View>
          ) : (
            <Text>No vital signs data available</Text>
          )}
        </View>

        {/* AI Prediction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Health Prediction</Text>
          {latestPrediction ? (
            <View>
              <Text>Status: {latestPrediction.status}</Text>
              <Text>Confidence: {latestPrediction.confidence}%</Text>
              <Text>Timestamp: {formatDate(latestPrediction.timestamp)}</Text>
            </View>
          ) : (
            <Text>No prediction data available</Text>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activityData.length > 0 ? (
            <View>
              <Text>Steps: {activityData[0].steps || 0}</Text>
              <Text>Active Minutes: {activityData[0]?.activeMinutes || 0}</Text>
            </View>
          ) : (
            <Text>No activity data available</Text>
          )}
        </View>
      </Card>
      
      {/* Health Metrics Chart */}
      {/* @ts-ignore */}
      <Card containerStyle={styles.card}>
        <Card.Title style={[styles.cardTitle, { fontSize: 20, fontWeight: '600', marginBottom: 10 }]}>Health Trends</Card.Title>
        <Card.Divider style={styles.divider} />
        {vitalSigns.length > 0 ? (
          <LineChart
            data={{
              labels: vitalSigns.slice(-7).map((_, index) => `${index + 1}d`),
              datasets: [
                {
                  data: vitalSigns.slice(-7).map(v => v.heartRate)
                }
              ]
            }}
            width={SCREEN_WIDTH - 40}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.primary,
              backgroundGradientFrom: theme.colors.primary,
              backgroundGradientTo: theme.colors.secondary,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text>No chart data available</Text>
        )}
      </Card>
      
      {/* Quick Actions */ }
      <View style={styles.quickActions}>
        <Button
          title="Log Health Data"
          icon={{
            name: 'add-circle-outline',
            type: 'material',
            color: 'white',
          }}
          buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          containerStyle={styles.actionButtonContainer}
          onPress={() => navigation.navigate('LogHealthData')}
        />
        <Button
          title="Talk to AI"
          icon={{
            name: 'chatbubble-ellipses-outline',
            type: 'ionicon',
            color: 'white',
          }}
          buttonStyle={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          containerStyle={styles.actionButtonContainer}
          onPress={() => navigation.navigate('AIDoctorChat')}
        />
      </View>

      {/* Analytics Section */}
      <AnalyticsSummary
        summary={analyticsSummary}
        onViewForecasts={() => {
          // Navigate to forecasts screen or show modal
          console.log('View forecasts');
        }}
        onViewAnomalies={() => {
          // Navigate to anomalies screen or show modal
          console.log('View anomalies');
        }}
        onViewBaselines={() => {
          // Navigate to baselines screen or show modal
          console.log('View baselines');
        }}
      />

      {/* Health Insights */}
      <HealthInsights
        insights={insights}
        recommendations={recommendations}
        riskFactors={riskFactors}
        isLoading={isLoadingInsights}
        onRefresh={refreshInsights}
      />

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <AnomalyAlert
          anomalies={anomalies}
          onAnomalyPress={(anomaly) => {
            // Handle anomaly press - show details or navigate
            console.log('Anomaly pressed:', anomaly);
          }}
          maxDisplay={3}
        />
      )}

      {/* Forecast Charts */}
      {forecasts.map((forecast, index) => (
        <ForecastChart
          key={`forecast-${index}`}
          forecast={forecast}
          title={`${forecast.metric} Prediction`}
          showAccuracy={true}
        />
      ))}
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 4,
  },
  statUnit: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: '#4CAF50',
  },
  noDataText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    margin: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  detailsButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  insightText: {
    color: theme.colors.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  highlightText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  buttonContainer: {
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  divider: {
    marginVertical: 10,
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
});

export default HealthDashboard;
