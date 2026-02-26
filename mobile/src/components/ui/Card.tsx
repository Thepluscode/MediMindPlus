import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardElevation = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  elevation?: CardElevation;
  padding?: CardPadding;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Card Component
 *
 * A container component with rounded corners and optional elevation/shadow.
 * Following the MediMindPlus design system specifications.
 *
 * @example
 * ```tsx
 * <Card elevated={true} padding="md" onPress={handlePress}>
 *   <Text>Card content</Text>
 * </Card>
 * ```
 */
const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  elevation = 'md',
  padding = 'md',
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const cardStyle: ViewStyle = {
    ...styles.base,
    ...styles[`padding_${padding}`],
    ...(elevated && styles[`elevation_${elevation}`]),
    ...style,
  };

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        testID={testID}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Otherwise, use a regular View
  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={cardStyle}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Padding variants (8pt grid system)
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: 8,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 24,
  },

  // Elevation/Shadow variants
  elevation_none: {},
  elevation_sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  elevation_md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  elevation_lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});

export default Card;
