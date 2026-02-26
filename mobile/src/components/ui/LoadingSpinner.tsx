import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

type LoadingSize = 'small' | 'large';

interface LoadingSpinnerProps {
  size?: LoadingSize;
  color?: string;
  text?: string;
  fullScreen?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * LoadingSpinner Component
 *
 * Displays a loading indicator with optional text.
 * Can be used inline or as a full-screen overlay.
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="large" text="Loading health data..." />
 * <LoadingSpinner fullScreen={true} />
 * ```
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#667eea',
  text,
  fullScreen = false,
  containerStyle,
}) => {
  const containerStyles = [
    fullScreen ? styles.fullScreenContainer : styles.inlineContainer,
    containerStyle,
  ];

  return (
    <View
      style={containerStyles}
      accessible={true}
      accessibilityLabel={text || 'Loading'}
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  inlineContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  text: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#4a5568',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
