import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'button'
  | 'caption'
  | 'overline';

type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'error'
  | 'success'
  | 'warning';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

/**
 * Typography Component
 *
 * Provides consistent text styling across the app following the design system.
 *
 * @example
 * ```tsx
 * <Typography variant="h1" color="primary" align="center">
 *   Welcome to MediMindPlus
 * </Typography>
 * ```
 */
const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...textProps
}) => {
  const textStyle: TextStyle = {
    ...styles[variant],
    ...styles[`color_${color}`],
    textAlign: align,
  };

  return (
    <Text {...textProps} style={[textStyle, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Heading variants
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: 0,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0,
  },

  // Body text variants
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },

  // UI element variants
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  overline: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Color variants
  color_primary: {
    color: '#1a202c',
  },
  color_secondary: {
    color: '#4a5568',
  },
  color_tertiary: {
    color: '#a0aec0',
  },
  color_inverse: {
    color: '#ffffff',
  },
  color_error: {
    color: '#f56565',
  },
  color_success: {
    color: '#48bb78',
  },
  color_warning: {
    color: '#ed8936',
  },
});

export default Typography;
