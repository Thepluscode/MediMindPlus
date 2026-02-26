import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Switch,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from './Typography';

type SettingsItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: (event: GestureResponderEvent) => void;
  rightElement?: 'chevron' | 'switch';
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * SettingsItem Component
 *
 * A reusable settings list item with icon, title, subtitle, and optional right element.
 *
 * @example
 * ```tsx
 * <SettingsItem
 *   icon="person-outline"
 *   title="Edit Profile"
 *   rightElement="chevron"
 *   onPress={handlePress}
 * />
 * ```
 */
const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  switchValue = false,
  onSwitchChange,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled && onPress) {
      onPress(event);
    }
  };

  const content = (
    <View style={[styles.container, disabled && styles.disabled]}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="#667eea" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Typography variant="body" color="primary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="bodySmall" color="secondary" style={styles.subtitle}>
            {subtitle}
          </Typography>
        )}
      </View>

      {/* Right Element */}
      {rightElement === 'chevron' && (
        <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
      )}
      {rightElement === 'switch' && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          disabled={disabled}
          trackColor={{ false: '#e2e8f0', true: '#667eea' }}
          thumbColor="#ffffff"
          accessibilityLabel={`${title} toggle`}
          accessibilityRole="switch"
        />
      )}
    </View>
  );

  if (onPress && rightElement !== 'switch') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel || title}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
});

export default SettingsItem;
