import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Input, ButtonGroup } from 'react-native-elements';
// import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface ROICalculation {
  annual_savings: number;
  implementation_cost: number;
  roi_percentage: number;
  payback_period_months: number;
  five_year_value: number;
  cost_breakdown: {
    prevented_er_visits: number;
    reduced_hospitalizations: number;
    early_intervention_savings: number;
    administrative_efficiency: number;
  };
}

const ROICalculator: React.FC = () => {
  const [partnerType, setPartnerType] = useState(0); // 0: Insurance, 1: Pharma, 2: Health System
  const [formData, setFormData] = useState({
    organizationSize: '1000000',
    currentCosts: '50000000',
    memberCount: '500000',
    avgClaimCost: '5000',
  });
  
  const [results, setResults] = useState<ROICalculation | null>(null);

  const partnerTypes = ['Insurance', 'Pharma', 'Health System'];

  const calculateROI = () => {
    const orgSize = parseInt(formData.organizationSize);
    const currentCosts = parseInt(formData.currentCosts);
    const memberCount = parseInt(formData.memberCount);
    const avgClaim = parseInt(formData.avgClaimCost);

    let calculation: ROICalculation;

    switch (partnerType) {
      case 0: // Insurance
        calculation = calculateInsuranceROI(memberCount, avgClaim, currentCosts);
        break;
      case 1: // Pharma
        calculation = calculatePharmaROI(orgSize, currentCosts);
        break;
      case 2: // Health System
        calculation = calculateHealthSystemROI(orgSize, currentCosts);
        break;
      default:
        calculation = calculateInsuranceROI(memberCount, avgClaim, currentCosts);
    }

    setResults(calculation);
  };

  const calculateInsuranceROI = (members: number, avgClaim: number, currentCosts: number): ROICalculation => {
    const annualPlatformCost = members * 20 * 12; // $20/member/month
    const preventedERVisits = members * 0.15 * 2000; // 15% reduction, $2000/visit
    const reducedHospitalizations = members * 0.08 * 15000; // 8% reduction, $15000/stay
    const earlyIntervention = members * 0.12 * 3000; // 12% early intervention, $3000 savings
    const adminEfficiency = currentCosts * 0.05; // 5% admin cost reduction

    const totalSavings = preventedERVisits + reducedHospitalizations + earlyIntervention + adminEfficiency;
    const netSavings = totalSavings - annualPlatformCost;
    const roiPercentage = (netSavings / annualPlatformCost) * 100;
    const paybackMonths = (annualPlatformCost / (totalSavings / 12));

    return {
      annual_savings: netSavings,
      implementation_cost: annualPlatformCost,
      roi_percentage: roiPercentage,
      payback_period_months: paybackMonths,
      five_year_value: netSavings * 5,
      cost_breakdown: {
        prevented_er_visits: preventedERVisits,
        reduced_hospitalizations: reducedHospitalizations,
        early_intervention_savings: earlyIntervention,
        administrative_efficiency: adminEfficiency,
      },
    };
  };

  const calculatePharmaROI = (orgSize: number, currentCosts: number): ROICalculation => {
    const studyCost = 10000000; // $10M per study
    const recruitmentEfficiency = currentCosts * 0.30; // 30% faster recruitment
    const targetedCohorts = currentCosts * 0.25; // 25% better targeting
    const regulatoryAdvantage = currentCosts * 0.15; // 15% regulatory advantage
    const timeToMarket = currentCosts * 0.20; // 20% faster time to market

    const totalSavings = recruitmentEfficiency + targetedCohorts + regulatoryAdvantage + timeToMarket;
    const netSavings = totalSavings - studyCost;
    const roiPercentage = (netSavings / studyCost) * 100;

    return {
      annual_savings: netSavings,
      implementation_cost: studyCost,
      roi_percentage: roiPercentage,
      payback_period_months: 18, // Typical pharma study duration
      five_year_value: netSavings * 2, // Multiple studies over 5 years
      cost_breakdown: {
        prevented_er_visits: recruitmentEfficiency,
        reduced_hospitalizations: targetedCohorts,
        early_intervention_savings: regulatoryAdvantage,
        administrative_efficiency: timeToMarket,
      },
    };
  };

  const calculateHealthSystemROI = (orgSize: number, currentCosts: number): ROICalculation => {
    const implementationCost = orgSize * 50; // $50 per patient
    const readmissionReduction = currentCosts * 0.20; // 20% readmission reduction
    const staffEfficiency = currentCosts * 0.15; // 15% staff efficiency
    const preventiveCare = currentCosts * 0.18; // 18% preventive care savings
    const qualityBonuses = currentCosts * 0.08; // 8% quality bonuses

    const totalSavings = readmissionReduction + staffEfficiency + preventiveCare + qualityBonuses;
    const netSavings = totalSavings - implementationCost;
    const roiPercentage = (netSavings / implementationCost) * 100;
    const paybackMonths = (implementationCost / (totalSavings / 12));

    return {
      annual_savings: netSavings,
      implementation_cost: implementationCost,
      roi_percentage: roiPercentage,
      payback_period_months: paybackMonths,
      five_year_value: netSavings * 5,
      cost_breakdown: {
        prevented_er_visits: readmissionReduction,
        reduced_hospitalizations: staffEfficiency,
        early_intervention_savings: preventiveCare,
        administrative_efficiency: qualityBonuses,
      },
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChartData = () => {
    if (!results) return [];

    const breakdown = results.cost_breakdown;
    const labels = partnerType === 0 
      ? ['ER Visits', 'Hospitalizations', 'Early Intervention', 'Admin Efficiency']
      : partnerType === 1
      ? ['Recruitment', 'Targeting', 'Regulatory', 'Time to Market']
      : ['Readmissions', 'Staff Efficiency', 'Preventive Care', 'Quality Bonuses'];

    return [
      {
        name: labels[0],
        population: breakdown.prevented_er_visits,
        color: '#FF6B6B',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
      {
        name: labels[1],
        population: breakdown.reduced_hospitalizations,
        color: '#4ECDC4',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
      {
        name: labels[2],
        population: breakdown.early_intervention_savings,
        color: '#45B7D1',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
      {
        name: labels[3],
        population: breakdown.administrative_efficiency,
        color: '#96CEB4',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
    ];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="calculator" size={40} color="white" />
          <Text style={styles.headerTitle}>Enterprise ROI Calculator</Text>
          <Text style={styles.headerSubtitle}>
            Calculate your return on investment with MediMind
          </Text>
        </View>
      </View>

      {/* Partner Type Selection */}
      <Card containerStyle={styles.card}>
        <Text style={styles.sectionTitle}>Partner Type</Text>
        <ButtonGroup
          onPress={setPartnerType}
          selectedIndex={partnerType}
          buttons={partnerTypes}
          containerStyle={styles.buttonGroup}
          selectedButtonStyle={styles.selectedButton}
          textStyle={styles.buttonText}
        />
      </Card>

      {/* Input Form */}
      <Card containerStyle={styles.card}>
        <Text style={styles.sectionTitle}>Organization Details</Text>
        
        {partnerType === 0 && (
          <>
            <Input
              label="Number of Members"
              value={formData.memberCount}
              onChangeText={(text) => setFormData({...formData, memberCount: text})}
              keyboardType="numeric"
              leftIcon={<Ionicons name="people" size={20} color="#666" />}
            />
            <Input
              label="Average Claim Cost ($)"
              value={formData.avgClaimCost}
              onChangeText={(text) => setFormData({...formData, avgClaimCost: text})}
              keyboardType="numeric"
              leftIcon={<Ionicons name="card" size={20} color="#666" />}
            />
          </>
        )}

        <Input
          label={partnerType === 1 ? "Annual R&D Budget ($)" : "Organization Size (Patients)"}
          value={formData.organizationSize}
          onChangeText={(text) => setFormData({...formData, organizationSize: text})}
          keyboardType="numeric"
          leftIcon={<Ionicons name="business" size={20} color="#666" />}
        />

        <Input
          label="Current Annual Costs ($)"
          value={formData.currentCosts}
          onChangeText={(text) => setFormData({...formData, currentCosts: text})}
          keyboardType="numeric"
          leftIcon={<Ionicons name="cash" size={20} color="#666" />}
        />

        <TouchableOpacity style={styles.calculateButton} onPress={calculateROI}>
          <View style={styles.calculateGradient}>
            <Ionicons name="analytics" size={20} color="white" />
            <Text style={styles.calculateText}>Calculate ROI</Text>
          </View>
        </TouchableOpacity>
      </Card>

      {/* Results */}
      {results && (
        <>
          <Card containerStyle={styles.card}>
            <Text style={styles.resultsTitle}>💰 ROI Analysis Results</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{formatCurrency(results.annual_savings)}</Text>
                <Text style={styles.metricLabel}>Annual Savings</Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                  {results.roi_percentage.toFixed(0)}%
                </Text>
                <Text style={styles.metricLabel}>ROI</Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {results.payback_period_months.toFixed(0)} mo
                </Text>
                <Text style={styles.metricLabel}>Payback Period</Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{formatCurrency(results.five_year_value)}</Text>
                <Text style={styles.metricLabel}>5-Year Value</Text>
              </View>
            </View>
          </Card>

          <Card containerStyle={styles.card}>
            <Text style={styles.sectionTitle}>Savings Breakdown</Text>
            <PieChart
              data={getChartData()}
              width={width - 60}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card>
        </>
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
    paddingTop: 50,
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
  card: {
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
  },
  buttonGroup: {
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedButton: {
    backgroundColor: '#667eea',
  },
  buttonText: {
    fontSize: 14,
  },
  calculateButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  calculateGradient: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
  },
  calculateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default ROICalculator;
