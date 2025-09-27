import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  AIPredictionDemo, 
  ServicesDashboard, 
  ROICalculator 
} from '../components/enterprise';

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
          >
            {activeTab === tab.id ? (
              <View style={styles.activeTabGradient}>
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color="white"
                />
                <Text style={styles.activeTabText}>{tab.title}</Text>
              </View>
            ) : (
              <View style={styles.inactiveTabContent}>
                <Ionicons 
                  name={tab.icon as any} 
                  size={20} 
                  color="#666" 
                />
                <Text style={styles.inactiveTabText}>{tab.title}</Text>
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
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  tab: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeTab: {
    elevation: 2,
  },
  activeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#667eea',
  },
  activeTabText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inactiveTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
  },
  inactiveTabText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
});

export default EnterpriseScreen;
