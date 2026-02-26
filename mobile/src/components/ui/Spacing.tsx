import React from 'react';
import { View, ViewStyle } from 'react-native';

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';

interface SpacingProps {
  size?: SpacingSize;
  horizontal?: boolean;
  vertical?: boolean;
  style?: ViewStyle;
}

/**
 * Spacing Component
 *
 * Provides consistent spacing following the 8pt grid system.
 *
 * @example
 * ```tsx
 * <Spacing size="md" />
 * <Spacing size="lg" horizontal />
 * ```
 */
const Spacing: React.FC<SpacingProps> = ({
  size = 'md',
  horizontal = false,
  vertical = false,
  style,
}) => {
  const spacingValue = spacingMap[size];

  const spacingStyle: ViewStyle = {
    width: horizontal ? spacingValue : 0,
    height: vertical ? spacingValue : 0,
    // If neither horizontal nor vertical is specified, apply both
    ...(!horizontal && !vertical && { width: spacingValue, height: spacingValue }),
  };

  return <View style={[spacingStyle, style]} />;
};

// 8pt grid spacing scale
const spacingMap: Record<SpacingSize, number> = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export default Spacing;

// Export spacing values for use in custom styles
export const spacing = spacingMap;
