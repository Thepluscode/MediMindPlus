import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Card } from 'react-native-elements';
// import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ServiceStatus {
  name: string;
  port: number;
  status: 'healthy' | 'error' | 'loading';
  icon: string;
  description: string;
  revenueModel: string;
  targetPartners: string[];
  capabilities?: string[];
}

const ServicesDashboard: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Insurance API Service',
      port: 8002,
      status: 'loading',
      icon: 'medical',
      description: 'Comprehensive health monitoring for insurance members with predictive analytics and early disease detection.',
      revenueModel: '$20/member/month • 5M+ users = $100M/month potential',
      targetPartners: ['UnitedHealthcare', 'Aetna', 'Anthem', 'Blue Cross Blue Shield'],
    },
    {
      name: 'Pharma Research API',
      port: 8003,
      status: 'loading',
      icon: 'flask',
      description: 'Early detection cohorts and clinical trial optimization for pharmaceutical research partnerships.',
      revenueModel: '$10M/study for early detection cohorts',
      targetPartners: ['Pfizer', 'Roche', 'Novartis', 'Merck', 'Johnson & Johnson'],
    },
    {
      name: 'Enterprise Demo Automation',
      port: 8005,
      status: 'loading',
      icon: 'rocket',
      description: 'Self-service demo provisioning and ROI calculation tools that accelerate enterprise sales by 10x.',
      revenueModel: '⚡ 10x faster enterprise sales cycles',
      targetPartners: [],
      capabilities: ['Automated onboarding', 'ROI calculation', 'White-label solutions'],
    },
    {
      name: 'AI/ML Prediction Engine',
      port: 8001,
      status: 'loading',
      icon: 'brain',
      description: 'Advanced machine learning models providing risk assessments for 10+ diseases with real-time predictions.',
      revenueModel: '🧠 10+ Disease Risk Models • 70%+ Accuracy',
      targetPartners: [],
      capabilities: ['Cardiovascular', 'Diabetes', 'Hypertension', 'Depression', 'Sleep Disorders'],
    },
  ]);

  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Check service health
    checkServicesHealth();
  }, []);

  const checkServicesHealth = async () => {
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        try {
          const response = await fetch(`http://localhost:${service.port}/health`, {
            timeout: 5000,
          });
          return {
            ...service,
            status: response.ok ? 'healthy' : 'error',
          };
        } catch (error) {
          return {
            ...service,
            status: 'error' as const,
          };
        }
      })
    );
    setServices(updatedServices);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'error': return '#F44336';
      case 'loading': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'loading': return 'time';
      default: return 'help-circle';
    }
  };

  const ServiceCard: React.FC<{ service: ServiceStatus; index: number }> = ({ service, index }) => (
    <Card containerStyle={[styles.serviceCard, { marginTop: index === 0 ? 0 : 15 }]}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIconContainer}>
          <View style={styles.serviceIconGradient}>
            <Ionicons name={service.icon as any} size={30} color="white" />
          </View>
        </View>
        
        <View style={styles.serviceInfo}>
          <View style={styles.serviceTitleRow}>
            <Text style={styles.serviceTitle}>{service.name}</Text>
            <View style={styles.statusContainer}>
              <Animated.View style={[
                styles.statusIndicator,
                { 
                  backgroundColor: getStatusColor(service.status),
                  opacity: service.status === 'loading' ? pulseAnim : 1,
                }
              ]} />
              <Ionicons 
                name={getStatusIcon(service.status) as any} 
                size={16} 
                color={getStatusColor(service.status)} 
              />
            </View>
          </View>
          <Text style={styles.servicePort}>Port {service.port} • {service.status}</Text>
        </View>
      </View>

      <Text style={styles.serviceDescription}>{service.description}</Text>

      <View style={styles.revenueContainer}>
        <View style={styles.revenueGradient}>
          <Text style={styles.revenueText}>{service.revenueModel}</Text>
        </View>
      </View>

      {service.targetPartners.length > 0 && (
        <View style={styles.partnersContainer}>
          <Text style={styles.partnersLabel}>Target Partners:</Text>
          <Text style={styles.partnersText}>{service.targetPartners.join(', ')}</Text>
        </View>
      )}

      {service.capabilities && (
        <View style={styles.capabilitiesContainer}>
          <Text style={styles.capabilitiesLabel}>Capabilities:</Text>
          <Text style={styles.capabilitiesText}>{service.capabilities.join(', ')}</Text>
        </View>
      )}
    </Card>
  );

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalServices = services.length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="business" size={40} color="white" />
          <Text style={styles.headerTitle}>Enterprise Platform</Text>
          <Text style={styles.headerSubtitle}>
            AI-Powered Health Monitoring for Insurance, Pharma & Health Systems
          </Text>

          <View style={styles.statusSummary}>
            <Text style={styles.statusText}>
              {healthyCount}/{totalServices} Services Running
            </Text>
            <View style={styles.statusBar}>
              <View
                style={[
                  styles.statusBarFill,
                  { width: `${(healthyCount / totalServices) * 100}%` }
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Services Grid */}
      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <ServiceCard key={service.name} service={service} index={index} />
        ))}
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={checkServicesHealth}>
        <View style={styles.refreshGradient}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.refreshText}>Refresh Status</Text>
        </View>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🌟 MediMind Enterprise Platform - Revolutionizing Healthcare with AI
        </Text>
        <Text style={styles.footerSubtext}>
          Ready for enterprise partnerships and multi-million dollar deals
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 30,
    paddingTop: 50,
    backgroundColor: '#667eea',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusSummary: {
    marginTop: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusBar: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  servicesContainer: {
    padding: 15,
  },
  serviceCard: {
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 20,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceIconContainer: {
    marginRight: 15,
  },
  serviceIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  servicePort: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  revenueContainer: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  revenueGradient: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  revenueText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  partnersContainer: {
    marginBottom: 10,
  },
  partnersLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  partnersText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  capabilitiesContainer: {
    marginBottom: 5,
  },
  capabilitiesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  capabilitiesText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  refreshButton: {
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  refreshGradient: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
  },
  refreshText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default ServicesDashboard;
