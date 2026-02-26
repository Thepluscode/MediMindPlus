import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useHealthData } from '../context/HealthDataProvider';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

interface BiometricData {
  temperature: number;
  heartRate: number;
  heartRateVariability: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  timestamp: string;
}

interface InfectionRiskScore {
  overall: number;
  flu: number;
  covid: number;
  respiratory: number;
  category: 'low' | 'moderate' | 'high' | 'critical';
}

interface EarlyWarning {
  id: string;
  type: 'temperature_spike' | 'hr_elevated' | 'hrv_low' | 'respiratory_abnormal';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  recommendations: string[];
}

interface CommunityOutbreak {
  location: string;
  disease: string;
  cases: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  riskLevel: 'low' | 'moderate' | 'high';
  distance: number;
}

const FluInfectiousDiseaseDetectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { healthData, syncHealthData, loading: healthLoading } = useHealthData();

  const [biometrics, setBiometrics] = useState<BiometricData[]>([]);
  const [riskScore, setRiskScore] = useState<InfectionRiskScore | null>(null);
  const [earlyWarnings, setEarlyWarnings] = useState<EarlyWarning[]>([]);
  const [outbreaks, setOutbreaks] = useState<CommunityOutbreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchInfectionData();
    syncHealthData();

    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchInfectionData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchInfectionData = async () => {
    try {
      const [riskResponse, warningsResponse, outbreaksResponse] = await Promise.all([
        axios.get(`${API_URL}/api/infection/risk-score`),
        axios.get(`${API_URL}/api/infection/early-warnings`),
        axios.get(`${API_URL}/api/infection/outbreaks`),
      ]);

      setRiskScore(riskResponse.data);
      setEarlyWarnings(warningsResponse.data.warnings);
      setOutbreaks(outbreaksResponse.data.outbreaks);

      // Fetch biometric history
      const biometricsResponse = await axios.get(`${API_URL}/api/infection/biometrics`, {
        params: { days: 7 },
      });
      setBiometrics(biometricsResponse.data.biometrics);
    } catch (error) {
      // Use mock data for demo
      if (__DEV__) {
        setRiskScore({
          overall: 25,
          flu: 18,
          covid: 12,
          respiratory: 30,
          category: 'low',
        });

        setEarlyWarnings([
          {
            id: '1',
            type: 'temperature_spike',
            severity: 'info',
            message: 'Slight temperature elevation detected',
            timestamp: new Date().toISOString(),
            recommendations: [
              'Monitor temperature regularly',
              'Stay hydrated',
              'Get adequate rest',
            ],
          },
        ]);

        setOutbreaks([
          {
            location: 'Downtown Area',
            disease: 'Influenza A',
            cases: 45,
            trend: 'increasing',
            riskLevel: 'moderate',
            distance: 2.5,
          },
          {
            location: 'University Campus',
            disease: 'COVID-19',
            cases: 12,
            trend: 'stable',
            riskLevel: 'low',
            distance: 5.8,
          },
        ]);

        // Generate mock biometrics
        const mockBiometrics: BiometricData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockBiometrics.push({
            temperature: 36.5 + Math.random() * 0.8,
            heartRate: 68 + Math.random() * 10,
            heartRateVariability: 45 + Math.random() * 15,
            respiratoryRate: 14 + Math.random() * 4,
            oxygenSaturation: 97 + Math.random() * 2,
            timestamp: date.toISOString(),
          });
        }
        setBiometrics(mockBiometrics);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInfectionData();
    syncHealthData();
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'low':
        return theme.colors.success;
      case 'moderate':
        return theme.colors.warning;
      case 'high':
        return '#FF9800';
      case 'critical':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return theme.colors.info;
      case 'warning':
        return theme.colors.warning;
      case 'critical':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getSeverityIcon = (severity: string): keyof typeof Ionicons.glyphMap => {
    switch (severity) {
      case 'info':
        return 'information-circle';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getTrendIcon = (trend: string): keyof typeof Ionicons.glyphMap => {
    switch (trend) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const renderBiometricChart = () => {
    if (biometrics.length === 0) return null;

    const screenWidth = Dimensions.get('window').width;
    const chartConfig = {
      backgroundColor: '#FFFFFF',
      backgroundGradientFrom: '#FFFFFF',
      backgroundGradientTo: '#FFFFFF',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: '#F44336',
      },
    };

    return (
      <Card elevated elevation="sm" padding="lg" style={styles.chartCard}>
        <Typography variant="h4" weight="bold" color="primary" style={styles.chartTitle}>
          Temperature Trend (7 Days)
        </Typography>
        <View importantForAccessibility="no" accessible={false}>
          <LineChart
            data={{
            labels: biometrics.map((b) => {
              const date = new Date(b.timestamp);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }),
            datasets: [
              {
                data: biometrics.map((b) => b.temperature),
              },
            ],
          }}
          width={screenWidth - 60}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisSuffix="°C"
          fromZero={false}
          />
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading infection monitoring data..."
        color={theme.colors.error}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold" color="primary">
          Infection Detection
        </Typography>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel="Refresh data"
          accessibilityState={{ disabled: refreshing }}
          accessibilityHint="Reload infection monitoring and biometric data"
        >
          <Ionicons
            name="refresh"
            size={24}
            color={refreshing ? theme.colors.textSecondary : theme.colors.textPrimary}
            style={refreshing ? { transform: [{ rotate: '360deg' }] } : undefined}
            importantForAccessibility="no"
            accessible={false}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Infection monitoring dashboard" accessibilityRole="scrollview">
        {/* Risk Score */}
        {riskScore && (
          <Card elevated elevation="sm" padding="lg" style={styles.riskCard}>
            <View style={styles.riskHeader}>
              <Ionicons name="shield-checkmark" size={32} color={getRiskColor(riskScore.category)} importantForAccessibility="no" accessible={false} />
              <View style={styles.riskInfo}>
                <Typography variant="body" color="secondary">
                  Infection Risk Score
                </Typography>
                <Typography
                  variant="h4"
                  weight="bold"
                  style={{ color: getRiskColor(riskScore.category) }}
                >
                  {riskScore.category.toUpperCase()}
                </Typography>
              </View>
              <Typography
                variant="h1"
                weight="bold"
                style={{ color: getRiskColor(riskScore.category) }}
              >
                {riskScore.overall}%
              </Typography>
            </View>

            <View style={styles.riskBreakdown}>
              <View style={styles.riskItem}>
                <Typography variant="body" color="secondary">Flu Risk</Typography>
                <View style={styles.riskBar}>
                  <View
                    style={[
                      styles.riskBarFill,
                      {
                        width: `${riskScore.flu}%`,
                        backgroundColor: getRiskColor(
                          riskScore.flu > 50 ? 'high' : riskScore.flu > 30 ? 'moderate' : 'low'
                        ),
                      },
                    ]}
                  />
                </View>
                <Typography variant="caption" color="secondary" align="right">
                  {riskScore.flu}%
                </Typography>
              </View>

              <View style={styles.riskItem}>
                <Typography variant="body" color="secondary">COVID-19 Risk</Typography>
                <View style={styles.riskBar}>
                  <View
                    style={[
                      styles.riskBarFill,
                      {
                        width: `${riskScore.covid}%`,
                        backgroundColor: getRiskColor(
                          riskScore.covid > 50 ? 'high' : riskScore.covid > 30 ? 'moderate' : 'low'
                        ),
                      },
                    ]}
                  />
                </View>
                <Typography variant="caption" color="secondary" align="right">
                  {riskScore.covid}%
                </Typography>
              </View>

              <View style={styles.riskItem}>
                <Typography variant="body" color="secondary">Respiratory Infection</Typography>
                <View style={styles.riskBar}>
                  <View
                    style={[
                      styles.riskBarFill,
                      {
                        width: `${riskScore.respiratory}%`,
                        backgroundColor: getRiskColor(
                          riskScore.respiratory > 50
                            ? 'high'
                            : riskScore.respiratory > 30
                            ? 'moderate'
                            : 'low'
                        ),
                      },
                    ]}
                  />
                </View>
                <Typography variant="caption" color="secondary" align="right">
                  {riskScore.respiratory}%
                </Typography>
              </View>
            </View>
          </Card>
        )}

        {/* Real-time Biometrics */}
        <Card elevated elevation="sm" padding="lg" style={styles.biometricsCard}>
          <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
            Current Biometrics
          </Typography>
          <View style={styles.biometricsGrid}>
            <View style={styles.biometricItem}>
              <Ionicons name="thermometer" size={28} color={theme.colors.error} importantForAccessibility="no" accessible={false} />
              <Typography variant="h3" weight="bold" color="primary" style={styles.biometricValue}>
                {healthData.bodyTemperature?.toFixed(1) || '--'}°C
              </Typography>
              <Typography variant="caption" color="secondary" align="center">
                Temperature
              </Typography>
            </View>

            <View style={styles.biometricItem}>
              <Ionicons name="heart" size={28} color="#E91E63" importantForAccessibility="no" accessible={false} />
              <Typography variant="h3" weight="bold" color="primary" style={styles.biometricValue}>
                {healthData.heartRate?.toFixed(0) || '--'}
              </Typography>
              <Typography variant="caption" color="secondary" align="center">
                Heart Rate
              </Typography>
            </View>

            <View style={styles.biometricItem}>
              <Ionicons name="pulse" size={28} color="#9C27B0" importantForAccessibility="no" accessible={false} />
              <Typography variant="h3" weight="bold" color="primary" style={styles.biometricValue}>
                {healthData.heartRateVariability?.toFixed(0) || '--'}
              </Typography>
              <Typography variant="caption" color="secondary" align="center">
                HRV
              </Typography>
            </View>

            <View style={styles.biometricItem}>
              <Ionicons name="fitness" size={28} color={theme.colors.info} importantForAccessibility="no" accessible={false} />
              <Typography variant="h3" weight="bold" color="primary" style={styles.biometricValue}>
                {healthData.respiratoryRate?.toFixed(0) || '--'}
              </Typography>
              <Typography variant="caption" color="secondary" align="center">
                Resp. Rate
              </Typography>
            </View>

            <View style={styles.biometricItem}>
              <Ionicons name="water" size={28} color="#00BCD4" importantForAccessibility="no" accessible={false} />
              <Typography variant="h3" weight="bold" color="primary" style={styles.biometricValue}>
                {healthData.oxygenSaturation?.toFixed(0) || '--'}%
              </Typography>
              <Typography variant="caption" color="secondary" align="center">
                SpO2
              </Typography>
            </View>
          </View>
        </Card>

        {/* Biometric Chart */}
        {renderBiometricChart()}

        {/* Early Warning Signals */}
        {earlyWarnings.length > 0 && (
          <View style={styles.warningsCard}>
            <Text style={styles.sectionTitle}>Early Warning Signals</Text>
            {earlyWarnings.map((warning) => (
              <View
                key={warning.id}
                style={[
                  styles.warningItem,
                  { borderLeftColor: getSeverityColor(warning.severity) },
                ]}
              >
                <View style={styles.warningHeader}>
                  <Ionicons
                    name={getSeverityIcon(warning.severity)}
                    size={24}
                    color={getSeverityColor(warning.severity)}
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Text style={styles.warningMessage}>{warning.message}</Text>
                </View>
                <Text style={styles.warningTime}>
                  {new Date(warning.timestamp).toLocaleString()}
                </Text>
                <View style={styles.recommendationsContainer}>
                  {warning.recommendations.map((rec, index) => (
                    <Text key={index} style={styles.recommendationItem}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Community Outbreaks */}
        {outbreaks.length > 0 && (
          <View style={styles.outbreaksCard}>
            <Text style={styles.sectionTitle}>Nearby Outbreaks</Text>
            {outbreaks.map((outbreak, index) => (
              <View key={index} style={styles.outbreakItem}>
                <View style={styles.outbreakHeader}>
                  <View style={styles.outbreakInfo}>
                    <Text style={styles.outbreakDisease}>{outbreak.disease}</Text>
                    <Text style={styles.outbreakLocation}>
                      <Ionicons name="location" size={14} color="#999" importantForAccessibility="no" accessible={false} /> {outbreak.location}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.riskBadge,
                      { backgroundColor: getRiskColor(outbreak.riskLevel) },
                    ]}
                  >
                    <Text style={styles.riskBadgeText}>
                      {outbreak.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.outbreakStats}>
                  <View style={styles.outbreakStat}>
                    <Ionicons name="people" size={20} color="#666" importantForAccessibility="no" accessible={false} />
                    <Text style={styles.outbreakStatText}>{outbreak.cases} cases</Text>
                  </View>

                  <View style={styles.outbreakStat}>
                    <Ionicons
                      name={getTrendIcon(outbreak.trend)}
                      size={20}
                      color={
                        outbreak.trend === 'increasing'
                          ? '#F44336'
                          : outbreak.trend === 'decreasing'
                          ? '#4CAF50'
                          : '#999'
                      }
                      importantForAccessibility="no"
                      accessible={false}
                    />
                    <Text style={styles.outbreakStatText}>{outbreak.trend}</Text>
                  </View>

                  <View style={styles.outbreakStat}>
                    <Ionicons name="navigate" size={20} color="#666" importantForAccessibility="no" accessible={false} />
                    <Text style={styles.outbreakStatText}>{outbreak.distance} km away</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Prevention & Treatment */}
        <View style={styles.preventionCard}>
          <Text style={styles.sectionTitle}>Prevention & Treatment</Text>

          <View style={styles.preventionSection}>
            <Text style={styles.preventionSubtitle}>
              <Ionicons name="shield" size={18} color="#4CAF50" importantForAccessibility="no" accessible={false} /> Prevention
            </Text>
            <View style={styles.preventionList}>
              <Text style={styles.preventionItem}>• Wash hands frequently for 20+ seconds</Text>
              <Text style={styles.preventionItem}>• Wear a mask in crowded areas</Text>
              <Text style={styles.preventionItem}>• Maintain social distancing (6 feet)</Text>
              <Text style={styles.preventionItem}>• Get vaccinated and boosted</Text>
              <Text style={styles.preventionItem}>• Avoid touching face, eyes, nose</Text>
            </View>
          </View>

          <View style={styles.preventionSection}>
            <Text style={styles.preventionSubtitle}>
              <Ionicons name="medical" size={18} color="#2196F3" importantForAccessibility="no" accessible={false} /> If You Feel Sick
            </Text>
            <View style={styles.preventionList}>
              <Text style={styles.preventionItem}>• Stay home and isolate</Text>
              <Text style={styles.preventionItem}>• Monitor symptoms closely</Text>
              <Text style={styles.preventionItem}>• Stay hydrated and rest</Text>
              <Text style={styles.preventionItem}>• Contact healthcare provider if worsening</Text>
              <Text style={styles.preventionItem}>• Get tested if exposed or symptomatic</Text>
            </View>
          </View>

          <View style={styles.preventionSection}>
            <Text style={styles.preventionSubtitle}>
              <Ionicons name="heart" size={18} color="#FF9800" importantForAccessibility="no" accessible={false} /> Immune Support
            </Text>
            <View style={styles.preventionList}>
              <Text style={styles.preventionItem}>• Vitamin C: 500-1000mg daily</Text>
              <Text style={styles.preventionItem}>• Vitamin D: 2000-4000 IU daily</Text>
              <Text style={styles.preventionItem}>• Zinc: 15-30mg daily</Text>
              <Text style={styles.preventionItem}>• Adequate sleep (7-9 hours)</Text>
              <Text style={styles.preventionItem}>• Regular exercise (30 min/day)</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  riskCard: {
    marginBottom: theme.spacing.lg,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  riskInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  riskBreakdown: {
    gap: theme.spacing.md,
  },
  riskItem: {
    gap: theme.spacing.xs,
  },
  riskBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.xs,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
  },
  biometricsCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  biometricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  biometricItem: {
    width: '30%',
    alignItems: 'center',
  },
  biometricValue: {
    marginTop: theme.spacing.xs,
  },
  chartCard: {
    marginBottom: theme.spacing.lg,
  },
  chartTitle: {
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  warningsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  warningItem: {
    borderLeftWidth: 4,
    paddingLeft: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.md,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  warningMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  warningTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  recommendationsContainer: {
    gap: theme.spacing.xs,
  },
  recommendationItem: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  outbreaksCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  outbreakItem: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  outbreakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  outbreakInfo: {
    flex: 1,
  },
  outbreakDisease: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  outbreakLocation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  riskBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.lg,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  outbreakStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  outbreakStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  outbreakStatText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  preventionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  preventionSection: {
    marginBottom: theme.spacing.lg,
  },
  preventionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  preventionList: {
    gap: theme.spacing.xs,
  },
  preventionItem: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default FluInfectiousDiseaseDetectionScreen;
