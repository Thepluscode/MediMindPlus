import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { StackNavigationProp } from '@react-navigation/stack';

type SimpleDashboardProps = {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
};

/**
 * Simplified, lightweight Health Dashboard
 * This version removes all heavy analytics hooks to prevent freezing
 */
const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.firstName || 'User'}!</Text>
        <Text style={styles.subtitle}>Your Health Dashboard</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Stats</Text>
        <Text style={styles.cardText}>Email: {user?.email}</Text>
        <Text style={styles.cardText}>Status: Active</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Getting Started</Text>
        <Text style={styles.cardText}>
          Your health dashboard is ready! Start by exploring the features below.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => console.log('Log Health Data clicked')}
        >
          <Text style={styles.buttonText}>Log Health Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => console.log('View Reports clicked')}
        >
          <Text style={styles.buttonText}>View Reports</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          This is a simplified dashboard. The full featured dashboard with advanced analytics
          is being optimized for better performance.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 8,
    lineHeight: 24,
  },
  buttonContainer: {
    padding: 16,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#EBF4FF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
  },
  infoText: {
    fontSize: 14,
    color: '#2C5282',
    lineHeight: 20,
  },
});

export default SimpleDashboard;
