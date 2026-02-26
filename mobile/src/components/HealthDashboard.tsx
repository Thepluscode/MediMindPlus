import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Icon } from 'react-native-elements';
import { LineChart } from 'react-native-chart-kit';
import { useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { RootStackParamList, TabParamList } from '../types/navigation';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import design system components
import {
  Button,
  Card,
  Typography,
  Spacing,
  LoadingSpinner,
  HealthMetric,
  AlertCard
} from './ui';

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

// Define composite navigation prop to handle both Tab and Stack navigators
type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;

type HealthDashboardProps = {
  navigation: DashboardNavigationProp;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HealthDashboard: React.FC<HealthDashboardProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [healthDataPoints, setHealthDataPoints] = useState<HealthDataPoint[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
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

  // NOTE: Hooks must always be called (cannot be conditional)
  // Pass empty data initially, then real data after it's loaded

  // Use empty arrays for initial render, then populate with real data
  const analyticsDataForHooks = analyticsEnabled ? analyticsData : [];

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
  } = useHealthInsights(userId, analyticsDataForHooks);

  const {
    anomalies,
    criticalAnomalies,
    detectAnomalies
  } = useAnomalyDetection(userId);

  const {
    summary: analyticsSummary
  } = useAnalyticsSummary(userId);

  // DEFERRED: Convert data after initial render
  useEffect(() => {
    if (healthMetrics.length > 0 || vitalSigns.length > 0) {
      const dataPoints = convertHealthMetricsToDataPoints(healthMetrics);
      setHealthDataPoints(dataPoints);
      setAnalyticsData(convertHealthDataForAnalytics(vitalSigns, dataPoints));
    }
  }, [healthMetrics, vitalSigns]);

  // DEFERRED: Enable analytics after data is loaded and converted
  useEffect(() => {
    if (analyticsData.length > 0 && !analyticsEnabled) {
      const timeoutId = setTimeout(() => {
        setAnalyticsEnabled(true);
      }, 1000); // 1 second delay to ensure UI is responsive

      return () => clearTimeout(timeoutId);
    }
  }, [analyticsData, analyticsEnabled]);

  // DEFERRED: Load initial data after component mounts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500); // 500ms delay

    // Clean up sensor service on unmount
    return () => {
      clearTimeout(timeoutId);
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
      // Error will be handled by Redux state
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
      // Error will be handled by Redux state
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
      <LoadingSpinner
        fullScreen={true}
        size="large"
        text="Loading your health data..."
        color={theme.colors.primary}
      />
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
      <Card elevated={true} elevation="md" padding="lg" style={styles.card}>
        <Typography variant="h3" color="primary">Health Summary</Typography>
        <Spacing size="md" />

        {/* Vital Signs */}
        <Typography variant="h4" color="primary">Vital Signs</Typography>
        <Spacing size="sm" />
        {vitalSigns.length > 0 ? (
          <View style={styles.metricsGrid}>
            <HealthMetric
              value={String(vitalSigns[vitalSigns.length - 1].heartRate || 0)}
              unit="bpm"
              label="Heart Rate"
              status={vitalSigns[vitalSigns.length - 1].heartRate > 100 ? 'warning' : 'normal'}
              icon={<Ionicons name="heart" size={24} color="#e53e3e" />}
            />
            {bloodPressureReadings.length > 0 && (
              <HealthMetric
                value={`${bloodPressureReadings[bloodPressureReadings.length - 1].systolic}/${bloodPressureReadings[bloodPressureReadings.length - 1].diastolic}`}
                unit="mmHg"
                label="Blood Pressure"
                status={bloodPressureReadings[bloodPressureReadings.length - 1].systolic > 140 ? 'warning' : 'normal'}
                icon={<Ionicons name="fitness" size={24} color="#667eea" />}
              />
            )}
            {latestOxygenLevel > 0 && (
              <HealthMetric
                value={String(latestOxygenLevel)}
                unit="%"
                label="Oxygen Level"
                status={latestOxygenLevel < 95 ? 'warning' : 'normal'}
                icon={<Ionicons name="water" size={24} color="#4299e1" />}
              />
            )}
          </View>
        ) : (
          <Typography variant="body" color="secondary">No vital signs data available</Typography>
        )}

        <Spacing size="lg" />

        {/* AI Prediction */}
        <Typography variant="h4" color="primary">AI Health Prediction</Typography>
        <Spacing size="sm" />
        {latestPrediction ? (
          <View>
            <Typography variant="body" color="secondary">Status: {latestPrediction.status}</Typography>
            <Typography variant="body" color="secondary">Confidence: {latestPrediction.confidence.toFixed(1)}%</Typography>
            <Typography variant="bodySmall" color="tertiary">Updated: {formatDate(latestPrediction.timestamp)}</Typography>
          </View>
        ) : (
          <Typography variant="body" color="secondary">No prediction data available</Typography>
        )}

        <Spacing size="lg" />

        {/* Recent Activity */}
        <Typography variant="h4" color="primary">Recent Activity</Typography>
        <Spacing size="sm" />
        {activityData.length > 0 ? (
          <View style={styles.metricsGrid}>
            <HealthMetric
              value={String(activityData[0].steps || 0)}
              unit="steps"
              label="Daily Steps"
              status={activityData[0].steps >= 10000 ? 'normal' : 'warning'}
              icon={<Ionicons name="footsteps" size={24} color="#48bb78" />}
            />
            <HealthMetric
              value={String(activityData[0]?.activeMinutes || 0)}
              unit="min"
              label="Active Time"
              status={(activityData[0]?.activeMinutes || 0) >= 30 ? 'normal' : 'warning'}
              icon={<Ionicons name="time" size={24} color="#667eea" />}
            />
          </View>
        ) : (
          <Typography variant="body" color="secondary">No activity data available</Typography>
        )}
      </Card>
      
      {/* Health Metrics Chart */}
      <Card elevated={true} elevation="md" padding="lg" style={styles.card}>
        <Typography variant="h3" color="primary">Health Trends</Typography>
        <Spacing size="md" />
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
            width={SCREEN_WIDTH - 64}
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
          <Typography variant="body" color="secondary">No chart data available</Typography>
        )}
      </Card>
      
      {/* Quick Actions */ }
      <View style={styles.quickActions}>
        <View style={styles.actionButtonContainer}>
          <Button
            variant="primary"
            size="large"
            fullWidth={true}
            onPress={() => {
              try {
                navigation.navigate('LogHealthData' as any);
              } catch (error) {
                // Navigation error handled silently
              }
            }}
            accessibilityLabel="Log Health Data"
          >
            Log Health Data
          </Button>
        </View>
        <Spacing size="md" horizontal />
        <View style={styles.actionButtonContainer}>
          <Button
            variant="secondary"
            size="large"
            fullWidth={true}
            onPress={() => {
              try {
                navigation.navigate('AIDoctorChat' as any);
              } catch (error) {
                // Navigation error handled silently
              }
            }}
            accessibilityLabel="Talk to AI Doctor"
          >
            Talk to AI
          </Button>
        </View>
      </View>

      {/* Features Scroll Indicator */}
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <Typography variant="h4" color="primary" align="center">
          Scroll Down for More Features ↓
        </Typography>
        <Spacing size="xs" />
        <Typography variant="caption" color="secondary" align="center">
          48 advanced features available below
        </Typography>
      </View>

      {/* AI & Prediction Features */}
      <Card elevated={true} elevation="sm" padding="lg" style={styles.card}>
        <Typography variant="h3" color="primary">AI & Prediction Features</Typography>
        <Spacing size="md" />
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('AIPredictionModels')}>
            <Icon name="analytics" size={32} color="#667eea" />
            <Typography variant="bodySmall" color="primary" align="center" style={{ marginTop: 8 }}>AI Models</Typography>
            <Typography variant="caption" color="secondary" align="center" style={{ marginTop: 4 }}>View all prediction models</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('VoiceAnalysis')}>
            <Icon name="mic" size={32} color="#667eea" />
            <Typography variant="bodySmall" color="primary" align="center" style={{ marginTop: 8 }}>Voice Analysis</Typography>
            <Typography variant="caption" color="secondary" align="center" style={{ marginTop: 4 }}>Detect diseases from voice</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('AnomalyDashboard')}>
            <Icon name="warning" size={32} color="#667eea" />
            <Typography variant="bodySmall" color="primary" align="center" style={{ marginTop: 8 }}>Anomalies</Typography>
            <Typography variant="caption" color="secondary" align="center" style={{ marginTop: 4 }}>Track health anomalies</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('PredictiveTimeline')}>
            <Icon name="timeline" size={32} color="#667eea" />
            <Typography variant="bodySmall" color="primary" align="center" style={{ marginTop: 8 }}>Health Timeline</Typography>
            <Typography variant="caption" color="secondary" align="center" style={{ marginTop: 4 }}>3-5 year predictions</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('StrokeDetection')}>
            <Icon name="favorite-border" size={32} color="#667eea" />
            <Typography variant="bodySmall" color="primary" align="center" style={{ marginTop: 8 }}>Stroke Detection</Typography>
            <Typography variant="caption" color="secondary" align="center" style={{ marginTop: 4 }}>AI stroke risk analysis</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('CancerDetectionSystem')}>
            <Icon name="medical-services" size={32} color="#667eea" />
            <Typography variant="bodySmall" color="primary" align="center" style={{ marginTop: 8 }}>Cancer Detection</Typography>
            <Typography variant="caption" color="secondary" align="center" style={{ marginTop: 4 }}>AI cancer screening</Typography>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Health Monitoring */}
      <Card elevated={true} elevation="sm" padding="lg" style={styles.card}>
        <Typography variant="h3" color="primary">Health Monitoring</Typography>
        <Spacing size="md" />
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('WearableDevices')}>
            <Icon name="watch" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Wearables</Text>
            <Text style={styles.featureDescription}>Connect devices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('VirtualHealthTwin')}>
            <Icon name="person-outline" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Health Twin</Text>
            <Text style={styles.featureDescription}>Digital body simulation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('BiologicalAge')}>
            <Icon name="schedule" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Biological Age</Text>
            <Text style={styles.featureDescription}>Calculate your real age</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('LabResults')}>
            <Icon name="science" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Lab Results</Text>
            <Text style={styles.featureDescription}>At-home lab tests</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('CameraHealth')}>
            <Icon name="camera-alt" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Camera Health</Text>
            <Text style={styles.featureDescription}>Health via camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('MedicalHistory')}>
            <Icon name="history" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Medical History</Text>
            <Text style={styles.featureDescription}>View past records</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Mental Health */}
      <Card elevated={true} elevation="sm" padding="lg" style={styles.card}>
        <Typography variant="h3" color="primary">Mental Health</Typography>
        <Spacing size="md" />
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('CBTChatbot')}>
            <Icon name="psychology" size={32} color="#9C27B0" />
            <Text style={styles.featureTitle}>CBT Chatbot</Text>
            <Text style={styles.featureDescription}>Therapy chatbot</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('CrisisIntervention')}>
            <Icon name="emergency" size={32} color="#9C27B0" />
            <Text style={styles.featureTitle}>Crisis Support</Text>
            <Text style={styles.featureDescription}>988 crisis hotline</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Medical Imaging */}
      <Card elevated={true} elevation="sm" padding="lg" style={styles.card}>
        <Typography variant="h3" color="primary">Medical Imaging</Typography>
        <Spacing size="md" />
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('ChestXrayAnalysis')}>
            <Icon name="medical-services" size={32} color="#FF5722" />
            <Text style={styles.featureTitle}>Chest X-Ray</Text>
            <Text style={styles.featureDescription}>AI X-ray analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('MammographyScreening')}>
            <Icon name="medical-services" size={32} color="#FF5722" />
            <Text style={styles.featureTitle}>Mammography</Text>
            <Text style={styles.featureDescription}>Breast cancer screening</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('RetinalImaging')}>
            <Icon name="visibility" size={32} color="#FF5722" />
            <Text style={styles.featureTitle}>Retinal Scan</Text>
            <Text style={styles.featureDescription}>Eye disease detection</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('BrainTumorDetection')}>
            <Icon name="medical-services" size={32} color="#FF5722" />
            <Text style={styles.featureTitle}>Brain MRI</Text>
            <Text style={styles.featureDescription}>Tumor detection</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Clinical Tools */}
      <Card elevated={true} elevation="sm" padding="lg" style={styles.card}>
        <Typography variant="h3" color="primary">Clinical Tools</Typography>
        <Spacing size="md" />
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('DrugInteraction')}>
            <Icon name="medication" size={32} color="#FF9800" />
            <Text style={styles.featureTitle}>Drug Checker</Text>
            <Text style={styles.featureDescription}>Interaction warnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('DrugDosing')}>
            <Icon name="medication-liquid" size={32} color="#FF9800" />
            <Text style={styles.featureTitle}>Dosing Guide</Text>
            <Text style={styles.featureDescription}>Dosage calculator</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('PrescriptionManagement')}>
            <Icon name="receipt" size={32} color="#FF9800" />
            <Text style={styles.featureTitle}>Prescriptions</Text>
            <Text style={styles.featureDescription}>Manage medications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('SecureMessaging')}>
            <Icon name="message" size={32} color="#FF9800" />
            <Text style={styles.featureTitle}>Messages</Text>
            <Text style={styles.featureDescription}>Secure chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('AppointmentManagement')}>
            <Icon name="event" size={32} color="#FF9800" />
            <Text style={styles.featureTitle}>Appointments</Text>
            <Text style={styles.featureDescription}>Schedule visits</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Billing')}>
            <Icon name="payment" size={32} color="#FF9800" />
            <Text style={styles.featureTitle}>Billing</Text>
            <Text style={styles.featureDescription}>Manage payments</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Analytics Section - Only render when analytics are enabled and summary is available */}
      {analyticsEnabled && analyticsSummary && (
        <AnalyticsSummary
          summary={analyticsSummary}
          onViewForecasts={() => {
            // Navigate to forecasts screen or show modal
          }}
          onViewAnomalies={() => {
            // Navigate to anomalies screen or show modal
          }}
          onViewBaselines={() => {
            // Navigate to baselines screen or show modal
          }}
        />
      )}

      {/* Health Insights - Only render when analytics are enabled */}
      {analyticsEnabled && (
        <HealthInsights
          insights={insights}
          recommendations={recommendations}
          riskFactors={riskFactors}
          isLoading={isLoadingInsights}
          onRefresh={refreshInsights}
        />
      )}

      {/* Anomaly Alerts - Only render when analytics are enabled */}
      {analyticsEnabled && anomalies.length > 0 && (
        <AnomalyAlert
          anomalies={anomalies}
          onAnomalyPress={(anomaly) => {
            // Handle anomaly press - show details or navigate
          }}
          maxDisplay={3}
        />
      )}

      {/* Forecast Charts - Only render when analytics are enabled */}
      {analyticsEnabled && forecasts.map((forecast, index) => (
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
  card: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  actionButtonContainer: {
    flex: 1,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default HealthDashboard;
