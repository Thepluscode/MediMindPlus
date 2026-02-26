import React, { useState, useEffect } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import HealthDashboard from './HealthDashboard';
import { LoadingSpinner } from './ui';

type HealthDashboardWrapperProps = {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
};

/**
 * Wrapper component that progressively loads the HealthDashboard
 * This prevents blocking the navigation transition by:
 * 1. First showing a loading screen (immediate)
 * 2. Then rendering the dashboard after navigation completes (300ms delay)
 * 3. Dashboard hooks load data asynchronously without blocking
 */
const HealthDashboardWrapper: React.FC<HealthDashboardWrapperProps> = ({ navigation }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Defer rendering the actual dashboard to prevent blocking
    // This gives React Navigation time to complete the transition animation
    const timeoutId = setTimeout(() => {
      setShouldRender(true);
    }, 300); // 300ms delay to let navigation animation complete smoothly

    return () => clearTimeout(timeoutId);
  }, []);

  if (!shouldRender) {
    return (
      <LoadingSpinner
        fullScreen={true}
        size="large"
        text="Loading Health Dashboard..."
        color="#667eea"
      />
    );
  }

  return <HealthDashboard navigation={navigation} />;
};

export default HealthDashboardWrapper;
