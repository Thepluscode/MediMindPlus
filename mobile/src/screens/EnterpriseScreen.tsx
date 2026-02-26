import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AIPredictionDemo,
  ServicesDashboard,
  ROICalculator
} from '../components/enterprise';
import { Typography } from '../components/ui';
import { theme } from '../theme/theme';

type TabType = 'services' | 'prediction' | 'roi';

const EnterpriseScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('services');

  const tabs = [
    {
      id: 'services' as TabType,
      title: 'Services',
      icon: 'business',
      component: ServicesDashboard,
    },
    {
      id: 'prediction' as TabType,
      title: 'AI Demo',
      icon: 'brain',
      component: AIPredictionDemo,
    },
    {
      id: 'roi' as TabType,
      title: 'ROI Calculator',
      icon: 'calculator',
      component: ROICalculator,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ServicesDashboard;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.id }}
            accessibilityLabel={`${tab.title} tab`}
            accessibilityHint={`Switch to ${tab.title} view`}
          >
            {activeTab === tab.id ? (
              <View style={styles.activeTabGradient}>
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color="white"
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography variant="buttonSmall" color="inverse" style={styles.tabTextMargin}>
                  {tab.title}
                </Typography>
              </View>
            ) : (
              <View style={styles.inactiveTabContent}>
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={theme.colors.textSecondary}
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography variant="bodySmall" color="secondary" style={styles.tabTextMargin}>
                  {tab.title}
                </Typography>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ActiveComponent />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.small,
  },
  tab: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  activeTab: {
    ...theme.shadows.small,
  },
  activeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  inactiveTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  tabTextMargin: {
    marginLeft: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
});

export default EnterpriseScreen;
