import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Icon } from 'react-native-elements';
import { LineChart } from 'react-native-chart-kit';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVitalSigns } from '../store/slices/healthDataSlice';
import { theme } from '../theme/theme';
import moment from 'moment';
import { RootState } from '../store/store';
import { HealthRecord } from '../types/models/health';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import design system components
import {
  Card,
  Typography,
  Spacing,
  LoadingSpinner
} from '../components/ui';

type TimeRange = 'week' | 'month' | '3months' | 'year';
type MetricType = 'heartRate' | 'bloodPressure' | 'activity' | 'sleep';

interface ReportType {
  key: MetricType;
  name: string;
  icon: string;
}

interface TimeRangeOption {
  label: string;
  value: TimeRange;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ReportsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { vitalSigns: history, isLoading } = useSelector((state: RootState) => state.healthData);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [activeMetric, setActiveMetric] = useState<MetricType>('heartRate');
  
  // Available report types
  const reportTypes: ReportType[] = [
    { key: 'heartRate', name: 'Heart Rate', icon: 'favorite' },
    { key: 'bloodPressure', name: 'Blood Pressure', icon: 'speed' },
    { key: 'activity', name: 'Activity', icon: 'directions-walk' },
    { key: 'sleep', name: 'Sleep', icon: 'hotel' },
  ];
  
  // Time range options
  const timeRanges: TimeRangeOption[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: '3 Months', value: '3months' },
    { label: 'Year', value: 'year' },
  ];
  
  // Fetch health data when component mounts or time range changes
  useEffect(() => {
    const endDate = moment().endOf('day').toISOString();
    let startDate: string;
    
    switch (timeRange) {
      case 'week':
        startDate = moment().subtract(7, 'days').startOf('day').toISOString();
        break;
      case 'month':
        startDate = moment().subtract(1, 'month').startOf('day').toISOString();
        break;
      case '3months':
        startDate = moment().subtract(3, 'months').startOf('day').toISOString();
        break;
      case 'year':
        startDate = moment().subtract(1, 'year').startOf('day').toISOString();
        break;
      default:
        startDate = moment().subtract(7, 'days').startOf('day').toISOString();
    }
    
    dispatch(fetchVitalSigns({ startDate, endDate }));
  }, [timeRange, dispatch]);
  
  // Filter and prepare data for charts
  const prepareChartData = (): ChartData => {
    if (!history || history.length === 0) {
      return { labels: [], datasets: [{ data: [] }] };
    }
    
    // Sort history by date
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Group data by day for the selected time range
    const groupedData: Record<string, HealthRecord[]> = {};
    const labels: string[] = [];
    
    sortedHistory.forEach(record => {
      const date = moment(record.timestamp).format('MMM D');
      
      if (!groupedData[date]) {
        groupedData[date] = [];
        labels.push(date);
      }
      
      groupedData[date].push(record);
    });
    
    // Process data based on active metric
    let data: number[] = [];
    let chartConfig = {};
    
    switch (activeMetric) {
      case 'heartRate':
        data = labels.map(date => {
          const readings = groupedData[date] || [];
          const heartRates = readings
            .filter(r => r.heartRate !== undefined)
            .map(r => r.heartRate as number);
          const avg = heartRates.length > 0 
            ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
            : 0;
          return avg;
        });
        chartConfig = {
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          strokeWidth: 2,
        };
        break;
        
      case 'bloodPressure':
        const systolicData = labels.map(date => {
          const readings = groupedData[date] || [];
          const bpReadings = readings
            .filter(r => r.bloodPressure?.systolic)
            .map(r => r.bloodPressure?.systolic as number);
          return bpReadings.length > 0 
            ? Math.round(bpReadings.reduce((a, b) => a + b, 0) / bpReadings.length)
            : 0;
        });
        
        const diastolicData = labels.map(date => {
          const readings = groupedData[date] || [];
          const bpReadings = readings
            .filter(r => r.bloodPressure?.diastolic)
            .map(r => r.bloodPressure?.diastolic as number);
          return bpReadings.length > 0 
            ? Math.round(bpReadings.reduce((a, b) => a + b, 0) / bpReadings.length)
            : 0;
        });
        
        return {
          labels,
          datasets: [
            {
              data: systolicData,
              color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`,
              strokeWidth: 2,
            },
            {
              data: diastolicData,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              strokeWidth: 2,
            },
          ],
          legend: ['Systolic', 'Diastolic'],
        };
        
      case 'activity':
        data = labels.map(date => {
          const readings = groupedData[date] || [];
          const steps = readings
            .filter(r => r.steps !== undefined)
            .map(r => r.steps as number);
          return steps.length > 0 
            ? Math.round(steps.reduce((a, b) => a + b, 0))
            : 0;
        });
        chartConfig = {
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        };
        break;
        
      case 'sleep':
        data = labels.map(date => {
          const readings = groupedData[date] || [];
          const sleepDurations = readings
            .filter(r => r.sleep?.duration)
            .map(r => r.sleep?.duration as number);
          return sleepDurations.length > 0 
            ? Math.round(sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length * 10) / 10
            : 0;
        });
        chartConfig = {
          color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
          strokeWidth: 2,
        };
        break;
        
      default:
        return { labels: [], datasets: [{ data: [] }] };
    }
    
    return {
      labels,
      datasets: [{
        data,
        ...chartConfig,
      }],
    };
  };
  
  // Get chart configuration based on active metric
  const getChartConfig = () => {
    const baseConfig = {
      backgroundColor: theme.colors.background,
      backgroundGradientFrom: theme.colors.background,
      backgroundGradientTo: theme.colors.background,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: theme.colors.primary,
      },
    };
    
    switch (activeMetric) {
      case 'heartRate':
        return {
          ...baseConfig,
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          label: 'BPM',
        };
        
      case 'bloodPressure':
        return {
          ...baseConfig,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          label: 'mmHg',
        };
        
      case 'activity':
        return {
          ...baseConfig,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          label: 'Steps',
        };
        
      case 'sleep':
        return {
          ...baseConfig,
          color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
          label: 'Hours',
        };
        
      default:
        return baseConfig;
    }
  };
  
  // Get current metric value (latest reading)
  const getCurrentValue = (): string => {
    if (!history || history.length === 0) return '--';
    
    const latestRecord = [...history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    
    switch (activeMetric) {
      case 'heartRate':
        return latestRecord.heartRate ? `${latestRecord.heartRate} BPM` : '--';
        
      case 'bloodPressure':
        return latestRecord.bloodPressure 
          ? `${latestRecord.bloodPressure.systolic}/${latestRecord.bloodPressure.diastolic} mmHg` 
          : '--';
          
      case 'activity':
        return latestRecord.steps ? `${latestRecord.steps} steps` : '--';
        
      case 'sleep':
        return latestRecord.sleep?.duration 
          ? `${latestRecord.sleep.duration} hours` 
          : '--';
          
      default:
        return '--';
    }
  };
  
  // Get change percentage compared to previous period
  const getChangePercentage = (): string => {
    if (!history || history.length < 2) return '0%';
    
    const sortedRecords = [...history].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Split records into two halves for comparison
    const midPoint = Math.floor(sortedRecords.length / 2);
    const firstHalf = sortedRecords.slice(0, midPoint);
    const secondHalf = sortedRecords.slice(midPoint);
    
    const getAverage = (records: HealthRecord[]): number => {
      switch (activeMetric) {
        case 'heartRate':
          const heartRates = records
            .filter(r => r.heartRate !== undefined)
            .map(r => r.heartRate as number);
          return heartRates.length > 0 
            ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length 
            : 0;
            
        case 'bloodPressure':
          const sysReadings = records
            .filter(r => r.bloodPressure?.systolic)
            .map(r => r.bloodPressure?.systolic as number);
          const diaReadings = records
            .filter(r => r.bloodPressure?.diastolic)
            .map(r => r.bloodPressure?.diastolic as number);
          const avgSys = sysReadings.length > 0 
            ? sysReadings.reduce((a, b) => a + b, 0) / sysReadings.length 
            : 0;
          const avgDia = diaReadings.length > 0 
            ? diaReadings.reduce((a, b) => a + b, 0) / diaReadings.length 
            : 0;
          return (avgSys + avgDia) / 2; // Average of systolic and diastolic
          
        case 'activity':
          const steps = records
            .filter(r => r.steps !== undefined)
            .map(r => r.steps as number);
          return steps.length > 0 
            ? steps.reduce((a, b) => a + b, 0) / steps.length 
            : 0;
            
        case 'sleep':
          const sleepDurations = records
            .filter(r => r.sleep?.duration)
            .map(r => r.sleep?.duration as number);
          return sleepDurations.length > 0 
            ? sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length 
            : 0;
            
        default:
          return 0;
      }
    };
    
    const firstAvg = getAverage(firstHalf);
    const secondAvg = getAverage(secondHalf);
    
    if (firstAvg === 0) return '0%';
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    return `${change > 0 ? '+' : ''}${Math.round(change)}%`;
  };
  
  // Get icon color based on metric
  const getMetricIconColor = (): string => {
    switch (activeMetric) {
      case 'heartRate':
        return '#f44336';
      case 'bloodPressure':
        return '#2196F3';
      case 'activity':
        return '#4CAF50';
      case 'sleep':
        return '#9C27B0';
      default:
        return theme.colors.primary;
    }
  };
  
  const chartData = prepareChartData();
  const chartConfigData = getChartConfig();
  const currentValue = getCurrentValue();
  const changePercentage = getChangePercentage();
  const isPositiveChange = !changePercentage.startsWith('-');
  
  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        size="large"
        text="Loading health reports..."
        color={theme.colors.primary}
      />
    );
  }
  
  return (
    <ScrollView
      style={styles.container}
      accessibilityLabel="Health reports"
      accessibilityRole="scrollview"
    >
      {/* Report Type Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reportTypeContainer}
        accessibilityLabel="Report type selector"
        accessibilityRole="scrollview"
      >
        {reportTypes.map((type, index) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.reportTypeButton,
              activeMetric === type.key && styles.activeReportType,
            ]}
            onPress={() => setActiveMetric(type.key)}
            accessibilityLabel={type.name}
            accessibilityHint={`View ${type.name.toLowerCase()} report`}
            accessibilityRole="button"
            accessibilityState={{ selected: activeMetric === type.key }}
          >
            <Icon
              name={type.icon}
              size={24}
              color={activeMetric === type.key ? 'white' : theme.colors.primary}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography
              variant="bodySmall"
              color={activeMetric === type.key ? 'inverse' : 'primary'}
              style={{ marginLeft: theme.spacing.xs }}
            >
              {type.name}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <View style={styles.timeRangeButtons}>
          {timeRanges.map((tr, index) => (
            <TouchableOpacity
              key={tr.value}
              style={[
                styles.timeRangeButton,
                timeRange === tr.value && styles.selectedTimeRange,
                index === 0 && styles.firstButton,
                index === timeRanges.length - 1 && styles.lastButton,
              ]}
              onPress={() => setTimeRange(tr.value)}
              accessibilityLabel={`${tr.label} time range`}
              accessibilityHint={`Show data for the last ${tr.label.toLowerCase()}`}
              accessibilityRole="button"
              accessibilityState={{ selected: timeRange === tr.value }}
            >
              <Typography
                variant="bodySmall"
                color={timeRange === tr.value ? 'inverse' : 'primary'}
              >
                {tr.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Current Value Card */}
      <Card elevated={true} elevation="md" padding="lg" style={styles.currentValueCard}>
        <View style={styles.currentValueHeader}>
          <Typography variant="h4" color="secondary">
            {reportTypes.find(t => t.key === activeMetric)?.name}
          </Typography>
          <View
            style={[
              styles.changeChip,
              isPositiveChange ? styles.positiveChange : styles.negativeChange
            ]}
            accessibilityLabel={`${changePercentage} change from previous period`}
            accessibilityRole="text"
          >
            <Icon
              name={isPositiveChange ? 'arrow-upward' : 'arrow-downward'}
              size={14}
              color="white"
              style={styles.changeIcon}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="caption" color="inverse" style={{ fontWeight: '600' }}>
              {changePercentage}
            </Typography>
          </View>
        </View>

        <Spacing size="sm" />

        <View style={styles.currentValueContent}>
          <Icon
            name={reportTypes.find(t => t.key === activeMetric)?.icon}
            size={40}
            color={getMetricIconColor()}
            containerStyle={styles.metricIcon}
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography variant="h1" color="primary">
            {currentValue}
          </Typography>
        </View>

        <Spacing size="sm" />

        <Typography variant="caption" color="tertiary">
          Last updated {moment(history[history.length - 1]?.timestamp).fromNow()}
        </Typography>
      </Card>
      
      {/* Chart */}
      <Card elevated={true} elevation="md" padding="lg" style={styles.chartCard}>
        <Typography variant="h4" color="primary">Trend</Typography>
        <Spacing size="md" />
        {activeMetric === 'bloodPressure' && 'datasets' in chartData && chartData.datasets.length > 1 ? (
          <LineChart
            data={chartData as any}
            width={SCREEN_WIDTH - 64}
            height={220}
            chartConfig={{
              ...chartConfigData,
              backgroundGradientFrom: theme.colors.background,
              backgroundGradientTo: theme.colors.background,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - 64}
            height={220}
            chartConfig={chartConfigData}
            bezier
            style={styles.chart}
          />
        )}
      </Card>
      
      {/* Additional Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Typography variant="h2" color="primary">24</Typography>
          <Spacing size="xs" />
          <Typography variant="caption" color="secondary">Avg Daily</Typography>
        </View>
        <View style={styles.statCard}>
          <Typography variant="h2" color="primary">156</Typography>
          <Spacing size="xs" />
          <Typography variant="caption" color="secondary">Max</Typography>
        </View>
        <View style={styles.statCard}>
          <Typography variant="h2" color="primary">72</Typography>
          <Spacing size="xs" />
          <Typography variant="caption" color="secondary">Min</Typography>
        </View>
      </View>

      {/* Recent Readings */}
      <Card elevated={true} elevation="md" padding="lg" style={styles.readingsCard}>
        <Typography variant="h4" color="primary">Recent Readings</Typography>
        <Spacing size="md" />
        {history.slice(0, 5).map((record, index) => (
          <View key={index} style={styles.readingItem}>
            <Typography variant="body" color="secondary">
              {moment(record.timestamp).format('MMM D, h:mm A')}
            </Typography>
            <Typography variant="body" color="primary" style={{ fontWeight: '500' }}>
              {activeMetric === 'heartRate'
                ? `${record.heartRate} BPM`
                : activeMetric === 'bloodPressure'
                ? `${record.bloodPressure?.systolic}/${record.bloodPressure?.diastolic} mmHg`
                : activeMetric === 'activity'
                ? `${record.steps} steps`
                : `${record.sleep?.duration} hours`
              }
            </Typography>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  reportTypeContainer: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  reportTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeReportType: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeRangeContainer: {
    marginVertical: theme.spacing.md,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  timeRangeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  firstButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastButton: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderRightWidth: 0,
  },
  selectedTimeRange: {
    backgroundColor: theme.colors.primary,
  },
  currentValueCard: {
    marginBottom: theme.spacing.md,
  },
  currentValueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  positiveChange: {
    backgroundColor: '#4CAF50',
  },
  negativeChange: {
    backgroundColor: '#F44336',
  },
  changeIcon: {
    marginRight: 2,
  },
  currentValueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    marginRight: theme.spacing.md,
  },
  chartCard: {
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: theme.spacing.md,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  readingsCard: {
    marginBottom: theme.spacing.md,
  },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});

export default ReportsScreen;
