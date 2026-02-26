import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type HealthStatus = 'normal' | 'warning' | 'critical';
type HealthTrend = 'up' | 'down' | 'stable';

interface HealthMetricProps {
  value: string | number;
  unit: string;
  label: string;
  status?: HealthStatus;
  trend?: HealthTrend;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * HealthMetric Component
 *
 * Displays health metrics with status indicators and trend arrows.
 * Specialized component for health data visualization.
 *
 * @example
 * ```tsx
 * <HealthMetric
 *   value="72"
 *   unit="bpm"
 *   label="Heart Rate"
 *   status="normal"
 *   trend="up"
 *   icon={<HeartIcon />}
 * />
 * ```
 */
const HealthMetric: React.FC<HealthMetricProps> = ({
  value,
  unit,
  label,
  status = 'normal',
  trend,
  icon,
  containerStyle,
  accessibilityLabel,
}) => {
  const statusColor = getStatusColor(status);
  const trendIcon = getTrendIcon(trend);

  const accessibilityText =
    accessibilityLabel ||
    `${label}: ${value} ${unit}. Status: ${status}${
      trend ? `, trending ${trend}` : ''
    }`;

  return (
    <View
      style={[styles.container, containerStyle]}
      accessible={true}
      accessibilityLabel={accessibilityText}
      accessibilityRole="text"
    >
      {/* Header Row: Icon and Status */}
      <View style={styles.headerRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.statusDot}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
        </View>
      </View>

      {/* Value and Trend */}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
        {trend && trendIcon && (
          <View style={styles.trendContainer}>{trendIcon}</View>
        )}
      </View>

      {/* Label */}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

// Helper function to get status color
const getStatusColor = (status: HealthStatus): string => {
  switch (status) {
    case 'normal':
      return '#48bb78'; // success green
    case 'warning':
      return '#ed8936'; // warning orange
    case 'critical':
      return '#f56565'; // error red
    default:
      return '#48bb78';
  }
};

// Helper function to get trend icon
const getTrendIcon = (trend?: HealthTrend): React.ReactNode => {
  if (!trend) return null;

  const iconColor = '#718096';
  const iconSize = 20;

  switch (trend) {
    case 'up':
      return (
        <Ionicons
          name="trending-up-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case 'down':
      return (
        <Ionicons
          name="trending-down-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case 'stable':
      return (
        <Ionicons name="remove-outline" size={iconSize} color={iconColor} />
      );
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },

  value: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    color: '#1a202c',
    fontFamily: 'monospace',
  },

  unit: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#718096',
    marginLeft: 4,
  },

  trendContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },

  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default HealthMetric;
