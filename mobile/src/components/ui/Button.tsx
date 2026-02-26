import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ButtonVariant = 'primary' | 'secondary' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: React.ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Button Component
 *
 * A flexible button component following the MediMindPlus design system.
 *
 * @example
 * ```tsx
 * <Button
 *   variant="primary"
 *   size="large"
 *   onPress={handleSubmit}
 *   accessibilityLabel="Submit health data"
 * >
 *   Submit
 * </Button>
 * ```
 */
const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const buttonStyle: ViewStyle = {
    ...styles.base,
    ...styles[`size_${size}`],
    ...(fullWidth && styles.fullWidth),
    ...(disabled && styles.disabled),
  };

  const textStyle: TextStyle = {
    ...styles.text,
    ...styles[`text_${variant}`],
    ...styles[`textSize_${size}`],
    ...(disabled && styles.textDisabled),
  };

  // Primary variant uses gradient
  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        testID={testID}
        style={[buttonStyle, styles.primary]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={textStyle}>{children}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Secondary and text variants
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
      style={[buttonStyle, styles[variant]]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? '#667eea' : '#667eea'}
        />
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Size variants
  size_small: {
    height: 32,
    paddingHorizontal: 12,
  },
  size_medium: {
    height: 40,
    paddingHorizontal: 16,
  },
  size_large: {
    height: 48,
    paddingHorizontal: 20,
  },

  // Variant styles
  primary: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  secondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  text: {
    backgroundColor: 'transparent',
  },

  // Gradient container
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text styles
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  text_primary: {
    color: '#ffffff',
  },
  text_secondary: {
    color: '#667eea',
  },
  text_text: {
    color: '#667eea',
  },

  // Text size variants
  textSize_small: {
    fontSize: 14,
    lineHeight: 20,
  },
  textSize_medium: {
    fontSize: 16,
    lineHeight: 24,
  },
  textSize_large: {
    fontSize: 16,
    lineHeight: 24,
  },

  // Disabled states
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.5,
  },

  // Full width
  fullWidth: {
    width: '100%',
  },
});

export default Button;
