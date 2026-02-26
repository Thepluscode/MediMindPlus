import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import type { TimeSeriesForecast } from '../../services/analytics/advancedAnalytics';
import { formatForecastForChart } from '../../utils/analyticsUtils';
import { theme } from '../../theme/theme';

interface ForecastChartProps {
  forecast: TimeSeriesForecast;
  title?: string;
  height?: number;
  showAccuracy?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ForecastChart: React.FC<ForecastChartProps> = ({
  forecast,
  title,
  height = 220,
  showAccuracy = true
}) => {
  const chartData = formatForecastForChart(forecast);

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return theme.colors.success;
    if (accuracy >= 0.7) return theme.colors.warning;
    return theme.colors.error;
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 0.9) return 'check-circle';
    if (accuracy >= 0.7) return 'warning';
    return 'error';
  };

  return (
    <Card containerStyle={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="trending-up" size={24} color={theme.colors.primary} />
          <Text style={styles.title}>
            {title || `${forecast.metric} Forecast`}
          </Text>
        </View>
        {showAccuracy && (
          <View style={styles.accuracyContainer}>
            <Icon 
              name={getAccuracyIcon(forecast.accuracy)} 
              size={16} 
              color={getAccuracyColor(forecast.accuracy)} 
            />
            <Text style={[styles.accuracy, { color: getAccuracyColor(forecast.accuracy) }]}>
              {Math.round(forecast.accuracy * 100)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 60}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          withDots={true}
          withShadow={false}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.metricInfo}>
          <Text style={styles.metricLabel}>Model:</Text>
          <Text style={styles.metricValue}>{forecast.model}</Text>
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricLabel}>Horizon:</Text>
          <Text style={styles.metricValue}>{forecast.horizon}</Text>
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricLabel}>Predictions:</Text>
          <Text style={styles.metricValue}>{forecast.predictions.length}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.legendText}>Predicted Values</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: `${theme.colors.primary}30` }]} />
          <Text style={styles.legendText}>Confidence Bounds</Text>
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
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accuracy: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  metricInfo: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default ForecastChart;
