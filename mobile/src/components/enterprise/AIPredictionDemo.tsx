import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, Button, Input, Badge } from 'react-native-elements';
// import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface VitalSigns {
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
}

interface PredictionRequest {
  user_id: string;
  age: number;
  gender: 'male' | 'female';
  symptoms: string[];
  vital_signs: VitalSigns;
}

interface DiseaseRisk {
  disease: string;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high';
  confidence: number;
}

interface PredictionResult {
  prediction_id: string;
  overall_risk_score: number;
  overall_risk_level: string;
  disease_risks: DiseaseRisk[];
  confidence_score: number;
  model_version: string;
}

const AIPredictionDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    age: '45',
    gender: 'female' as 'male' | 'female',
    heartRate: '85',
    systolic: '140',
    diastolic: '90',
  });
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getRiskBadgeStyle = (level: string) => ({
    backgroundColor: getRiskColor(level),
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  });

  const formatDiseaseName = (disease: string) => {
    return disease
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const runPrediction = async () => {
    setLoading(true);
    
    const requestData: PredictionRequest = {
      user_id: `enterprise-demo-${Date.now()}`,
      age: parseInt(formData.age),
      gender: formData.gender,
      symptoms: ['general_checkup'],
      vital_signs: {
        heart_rate: parseInt(formData.heartRate),
        blood_pressure_systolic: parseInt(formData.systolic),
        blood_pressure_diastolic: parseInt(formData.diastolic),
      },
    };

    try {
      const response = await fetch('http://localhost:8001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data: PredictionResult = await response.json();
      setResults(data);
    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Unable to connect to AI service. Please ensure the ML service is running on port 8001.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="brain" size={40} color="white" />
          <Text style={styles.headerTitle}>AI Health Risk Assessment</Text>
          <Text style={styles.headerSubtitle}>
            Enterprise-grade predictive analytics
          </Text>
        </View>
      </View>

      {/* Input Form */}
      <Card containerStyle={styles.formCard}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Age</Text>
            <Input
              value={formData.age}
              onChangeText={(text) => setFormData({...formData, age: text})}
              keyboardType="numeric"
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'female' && styles.genderButtonActive
                ]}
                onPress={() => setFormData({...formData, gender: 'female'})}
              >
                <Text style={[
                  styles.genderText,
                  formData.gender === 'female' && styles.genderTextActive
                ]}>Female</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'male' && styles.genderButtonActive
                ]}
                onPress={() => setFormData({...formData, gender: 'male'})}
              >
                <Text style={[
                  styles.genderText,
                  formData.gender === 'male' && styles.genderTextActive
                ]}>Male</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Vital Signs</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Heart Rate (BPM)</Text>
            <Input
              value={formData.heartRate}
              onChangeText={(text) => setFormData({...formData, heartRate: text})}
              keyboardType="numeric"
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Systolic BP</Text>
            <Input
              value={formData.systolic}
              onChangeText={(text) => setFormData({...formData, systolic: text})}
              keyboardType="numeric"
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Diastolic BP</Text>
          <Input
            value={formData.diastolic}
            onChangeText={(text) => setFormData({...formData, diastolic: text})}
            keyboardType="numeric"
            containerStyle={styles.input}
            inputStyle={styles.inputText}
          />
        </View>

        <TouchableOpacity
          style={styles.predictButton}
          onPress={runPrediction}
          disabled={loading}
        >
          <View style={styles.predictButtonGradient}>
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={styles.predictButtonContent}>
                <Ionicons name="analytics" size={20} color="white" />
                <Text style={styles.predictButtonText}>Generate AI Assessment</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Card>

      {/* Results */}
      {results && (
        <Card containerStyle={styles.resultsCard}>
          <Text style={styles.resultsTitle}>🎯 AI Prediction Results</Text>
          
          {/* Overall Risk */}
          <View style={styles.overallRiskContainer}>
            <Text style={styles.overallRiskLabel}>Overall Risk Score</Text>
            <View style={styles.overallRiskContent}>
              <Text style={styles.overallRiskScore}>
                {(results.overall_risk_score * 100).toFixed(1)}%
              </Text>
              <Badge
                value={results.overall_risk_level.toUpperCase()}
                badgeStyle={getRiskBadgeStyle(results.overall_risk_level)}
                textStyle={styles.badgeText}
              />
            </View>
          </View>

          {/* Disease Risks */}
          <Text style={styles.diseaseRisksTitle}>Disease-Specific Risk Assessment</Text>
          {results.disease_risks.map((risk, index) => (
            <View key={index} style={styles.riskItem}>
              <View style={styles.riskItemLeft}>
                <Text style={styles.diseaseName}>
                  {formatDiseaseName(risk.disease)}
                </Text>
                <Text style={styles.riskPercentage}>
                  {(risk.risk_score * 100).toFixed(1)}%
                </Text>
              </View>
              <Badge
                value={risk.risk_level.toUpperCase()}
                badgeStyle={getRiskBadgeStyle(risk.risk_level)}
                textStyle={styles.badgeText}
              />
            </View>
          ))}

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataText}>
              <Text style={styles.metadataLabel}>Prediction ID:</Text> {results.prediction_id}
            </Text>
            <Text style={styles.metadataText}>
              <Text style={styles.metadataLabel}>Model Version:</Text> {results.model_version}
            </Text>
            <Text style={styles.metadataText}>
              <Text style={styles.metadataLabel}>Confidence Score:</Text> {(results.confidence_score * 100).toFixed(1)}%
            </Text>
          </View>
        </Card>
      )}
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
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
    textAlign: 'center',
  },
  formCard: {
    margin: 15,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    marginBottom: 10,
  },
  inputText: {
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  genderButtonActive: {
    borderColor: '#667eea',
    backgroundColor: '#667eea',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
  },
  genderTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  predictButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  predictButtonGradient: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  predictButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultsCard: {
    margin: 15,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  overallRiskContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  overallRiskLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  overallRiskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallRiskScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  diseaseRisksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  riskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  riskItemLeft: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  riskPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  metadataContainer: {
    backgroundColor: '#f3e5f5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  metadataLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AIPredictionDemo;
