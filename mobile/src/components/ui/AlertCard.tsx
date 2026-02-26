import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertSeverity = 'info' | 'success' | 'warning' | 'critical';

interface AlertCardProps {
  severity: AlertSeverity;
  title: string;
  message: string;
  actionLabel?: string;
  onActionPress?: (event: GestureResponderEvent) => void;
  onDismiss?: () => void;
  containerStyle?: ViewStyle;
}

/**
 * AlertCard Component
 *
 * Displays health alerts with color-coded severity levels.
 * Follows HIPAA-compliant health alert patterns.
 *
 * @example
 * ```tsx
 * <AlertCard
 *   severity="warning"
 *   title="Blood Pressure Elevated"
 *   message="Your last reading (145/92) is above normal range."
 *   actionLabel="Schedule Appointment"
 *   onActionPress={handleAction}
 * />
 * ```
 */
const AlertCard: React.FC<AlertCardProps> = ({
  severity,
  title,
  message,
  actionLabel,
  onActionPress,
  onDismiss,
  containerStyle,
}) => {
  const { backgroundColor, borderColor, iconColor, iconName } =
    getSeverityStyles(severity);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderLeftColor: borderColor },
        containerStyle,
      ]}
      accessible={true}
      accessibilityLabel={`${severity} alert: ${title}. ${message}`}
      accessibilityRole="alert"
    >
      {/* Icon and Dismiss Button Row */}
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor }]} importantForAccessibility="no" accessible={false}>
          <Ionicons name={iconName} size={20} color="#ffffff" importantForAccessibility="no" accessible={false} />
        </View>

        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityLabel="Dismiss alert"
            accessibilityHint="Remove this alert from view"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color="#718096" importantForAccessibility="no" accessible={false} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Action Button */}
      {actionLabel && onActionPress && (
        <TouchableOpacity
          onPress={onActionPress}
          style={[styles.actionButton, { borderColor }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityHint={`Take action on this ${severity} alert`}
        >
          <Text style={[styles.actionButtonText, { color: borderColor }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Helper function to get severity-based styling
const getSeverityStyles = (
  severity: AlertSeverity
): {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
} => {
  switch (severity) {
    case 'info':
      return {
        backgroundColor: '#ebf8ff',
        borderColor: '#4299e1',
        iconColor: '#4299e1',
        iconName: 'information-circle',
      };
    case 'success':
      return {
        backgroundColor: '#f0fff4',
        borderColor: '#48bb78',
        iconColor: '#48bb78',
        iconName: 'checkmark-circle',
      };
    case 'warning':
      return {
        backgroundColor: '#fffaf0',
        borderColor: '#ed8936',
        iconColor: '#ed8936',
        iconName: 'warning',
      };
    case 'critical':
      return {
        backgroundColor: '#fff5f5',
        borderColor: '#f56565',
        iconColor: '#f56565',
        iconName: 'alert-circle',
      };
    default:
      return {
        backgroundColor: '#ebf8ff',
        borderColor: '#4299e1',
        iconColor: '#4299e1',
        iconName: 'information-circle',
      };
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dismissButton: {
    padding: 4,
  },

  title: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4a5568',
    marginBottom: 12,
  },

  actionButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default AlertCard;
