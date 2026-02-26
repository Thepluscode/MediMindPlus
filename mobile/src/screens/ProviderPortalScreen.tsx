import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Typography, Card } from '../components/ui';
import { theme } from '../theme/theme';

interface Patient {
  id: number;
  name: string;
  age: number;
  mrn: string;
  risk_category: string;
  risk_score: number;
  risk_level: 'critical' | 'high' | 'moderate' | 'low';
  predicted_event?: string;
  timeframe?: string;
  last_visit: string;
  key_factors?: string[];
  recommended_actions?: string[];
  wearable_data?: {
    hr_avg: number;
    hrv_trend: string;
    activity: string;
    sleep: string;
  };
  engagement?: number;
}

interface Alert {
  patient: string;
  type: string;
  message: string;
  time: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface Appointment {
  patient: string;
  type: string;
  date: string;
  time: string;
  reason: string;
}

const ProviderPortalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'high-risk' | 'patients' | 'alerts'>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState('');

  const providerStats = {
    total_patients: 247,
    active_patients: 189,
    high_risk_alerts: 12,
    pending_reviews: 8,
    avg_engagement: 78,
    predictions_this_week: 145,
  };

  const highRiskPatients: Patient[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      age: 58,
      mrn: 'MRN-10234',
      risk_category: 'Cardiovascular',
      risk_score: 92,
      risk_level: 'critical',
      predicted_event: 'MI risk',
      timeframe: '6-12 months',
      last_visit: '2025-09-15',
      key_factors: ['LDL 187 mg/dL', 'BP 158/96', 'Family history', 'Sedentary lifestyle'],
      recommended_actions: ['Statin therapy', 'BP medication adjustment', 'Cardiology referral', 'Lifestyle counseling'],
      wearable_data: { hr_avg: 82, hrv_trend: 'declining', activity: 'low', sleep: 'poor' },
    },
    {
      id: 2,
      name: 'Michael Chen',
      age: 63,
      mrn: 'MRN-10567',
      risk_category: 'Diabetes',
      risk_score: 88,
      risk_level: 'high',
      predicted_event: 'Type 2 Diabetes',
      timeframe: '12-18 months',
      last_visit: '2025-08-22',
      key_factors: ['HbA1c 6.2%', 'Fasting glucose 118', 'BMI 32', 'Pre-diabetes'],
      recommended_actions: ['Metformin consideration', 'Nutrition referral', 'Weight loss program', 'Glucose monitoring'],
      wearable_data: { hr_avg: 76, hrv_trend: 'stable', activity: 'moderate', sleep: 'fair' },
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      age: 52,
      mrn: 'MRN-10892',
      risk_category: 'Cancer',
      risk_score: 85,
      risk_level: 'high',
      predicted_event: 'Multi-cancer signal',
      timeframe: '24-36 months',
      last_visit: '2025-09-28',
      key_factors: ['Elevated DNA methylation', 'Protein biomarkers abnormal', 'Family history breast CA', 'BRCA2 positive'],
      recommended_actions: ['Enhanced screening protocol', 'Oncology consultation', 'MRI breast screening', 'Genetic counseling'],
      wearable_data: { hr_avg: 72, hrv_trend: 'stable', activity: 'high', sleep: 'good' },
    },
  ];

  const allPatients: Patient[] = [
    ...highRiskPatients,
    {
      id: 5,
      name: 'Lisa Anderson',
      age: 45,
      mrn: 'MRN-10445',
      risk_category: 'Metabolic',
      risk_score: 65,
      risk_level: 'moderate',
      engagement: 92,
      last_visit: '2025-09-20',
    },
    {
      id: 6,
      name: 'David Thompson',
      age: 38,
      mrn: 'MRN-10678',
      risk_category: 'Wellness',
      risk_score: 28,
      risk_level: 'low',
      engagement: 88,
      last_visit: '2025-09-25',
    },
  ];

  const recentAlerts: Alert[] = [
    {
      patient: 'Sarah Johnson',
      type: 'Critical Risk',
      message: 'Cardiovascular risk score increased from 85 → 92',
      time: '2 hours ago',
      priority: 'critical',
    },
    {
      patient: 'Michael Chen',
      type: 'Lab Result',
      message: 'HbA1c elevated to 6.2% (pre-diabetic range)',
      time: '5 hours ago',
      priority: 'high',
    },
    {
      patient: 'Emily Rodriguez',
      type: 'Abnormal Finding',
      message: 'Multi-cancer detection signal - requires follow-up',
      time: '1 day ago',
      priority: 'high',
    },
    {
      patient: 'Lisa Anderson',
      type: 'Positive Trend',
      message: 'Weight loss goal achieved: -12 lbs in 8 weeks',
      time: '2 days ago',
      priority: 'low',
    },
  ];

  const upcomingAppointments: Appointment[] = [
    { patient: 'Sarah Johnson', type: 'Follow-up', date: '2025-10-08', time: '09:00 AM', reason: 'CVD risk discussion' },
    { patient: 'Emily Rodriguez', type: 'Consultation', date: '2025-10-09', time: '02:30 PM', reason: 'Cancer screening review' },
    { patient: 'Michael Chen', type: 'Follow-up', date: '2025-10-15', time: '11:00 AM', reason: 'Diabetes prevention' },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning;
      case 'moderate':
        return '#fbc02d';
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return '#fbc02d';
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent} accessibilityLabel="Provider dashboard" accessibilityRole="scrollview">
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Patients', value: providerStats.total_patients, icon: 'people', color: '#2196F3', change: '+12' },
          { label: 'Active', value: providerStats.active_patients, icon: 'trending-up', color: '#4CAF50', change: '+5' },
          { label: 'High Risk', value: providerStats.high_risk_alerts, icon: 'warning', color: '#f44336', change: '+3' },
          { label: 'Pending', value: providerStats.pending_reviews, icon: 'description', color: '#FF9800', change: '-2' },
          { label: 'Engagement', value: `${providerStats.avg_engagement}%`, icon: 'show-chart', color: '#9C27B0', change: '+8%' },
          { label: 'Predictions', value: providerStats.predictions_this_week, icon: 'psychology', color: '#3F51B5', change: '+23' },
        ].map((stat, idx) => (
          <Card key={idx} elevated elevation="xs" padding="md" style={styles.statCard}>
            <View style={styles.statHeader}>
              <Icon name={stat.icon} size={20} color={stat.color} importantForAccessibility="no" accessible={false} />
              <Typography variant="caption" color="secondary" style={styles.statLabel}>
                {stat.label}
              </Typography>
            </View>
            <View style={styles.statContent}>
              <Typography variant="h3" weight="bold" color="primary">
                {stat.value}
              </Typography>
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: stat.change.startsWith('+') ? theme.colors.success : theme.colors.textSecondary }}
              >
                {stat.change}
              </Typography>
            </View>
          </Card>
        ))}
      </View>

      {/* High Risk Patients */}
      <Card elevated elevation="sm" padding="lg" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Typography variant="h4" weight="bold" color="primary">
            High Risk Patients Requiring Action
          </Typography>
          <View style={styles.badge}>
            <Typography variant="caption" weight="semibold" color="inverse">
              {highRiskPatients.length} Patients
            </Typography>
          </View>
        </View>

        {highRiskPatients.slice(0, 3).map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={styles.patientCard}
            onPress={() => setSelectedPatient(patient)}
            accessibilityRole="button"
            accessibilityLabel={`${patient.name}, age ${patient.age}, risk score ${patient.risk_score}, predicted event: ${patient.predicted_event}`}
            accessibilityHint="View detailed patient risk profile and recommended actions"
          >
            <View style={styles.patientHeader}>
              <View>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientInfo}>Age {patient.age} • {patient.mrn}</Text>
              </View>
              <View style={styles.riskScoreContainer}>
                <Text style={[styles.riskScore, { color: getRiskColor(patient.risk_level) }]}>
                  {patient.risk_score}
                </Text>
                <Text style={styles.riskLabel}>Risk Score</Text>
              </View>
            </View>

            <View style={styles.riskAlert}>
              <Icon name="warning" size={16} color="#d32f2f" importantForAccessibility="no" accessible={false} />
              <View style={{ marginLeft: 8, flex: 1 }} importantForAccessibility="no-hide-descendants">
                <Text style={styles.riskAlertTitle}>{patient.predicted_event}</Text>
                <Text style={styles.riskAlertSubtitle}>Predicted timeframe: {patient.timeframe}</Text>
              </View>
            </View>

            <View style={styles.factorsGrid}>
              {patient.key_factors?.slice(0, 2).map((factor, idx) => (
                <View key={idx} style={styles.factorTag}>
                  <Text style={styles.factorText}>{factor}</Text>
                </View>
              ))}
            </View>

            <View style={styles.patientActions}>
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => setSelectedPatient(patient)}
                accessibilityRole="button"
                accessibilityLabel={`Review details for ${patient.name}`}
                accessibilityHint="View full risk assessment and recommended interventions"
              >
                <Typography variant="body" weight="semibold" color="inverse">
                  Review Details
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={() => {}}
                accessibilityRole="button"
                accessibilityLabel={`Schedule appointment for ${patient.name}`}
                accessibilityHint="Schedule a follow-up appointment with this patient"
              >
                <Typography variant="body" weight="semibold" color="secondary">
                  Schedule
                </Typography>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Recent Alerts */}
      <Card elevated elevation="sm" padding="lg" style={styles.section}>
        <Typography variant="h4" weight="bold" color="primary" style={styles.sectionTitle}>
          Recent Alerts
        </Typography>
        {recentAlerts.slice(0, 4).map((alert, idx) => (
          <View key={idx} style={[styles.alertCard, { borderLeftColor: getPriorityColor(alert.priority) }]}>
            <Typography variant="body" weight="bold" color="primary">
              {alert.patient}
            </Typography>
            <Typography variant="body" color="secondary" style={styles.alertMessage}>
              {alert.message}
            </Typography>
            <Typography variant="caption" color="secondary">
              {alert.time}
            </Typography>
          </View>
        ))}
      </Card>

      {/* Upcoming Appointments */}
      <Card elevated elevation="sm" padding="lg" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="event" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
          <Typography variant="h4" weight="bold" color="primary" style={{ marginLeft: theme.spacing.xs }}>
            Upcoming Appointments
          </Typography>
        </View>
        {upcomingAppointments.map((apt, idx) => (
          <View key={idx} style={styles.appointmentCard}>
            <Typography variant="body" weight="bold" color="primary">
              {apt.patient}
            </Typography>
            <Typography variant="body" color="secondary" style={styles.appointmentDateTime}>
              {apt.date} at {apt.time}
            </Typography>
            <Typography variant="body" color="info" style={styles.appointmentReason}>
              {apt.reason}
            </Typography>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderHighRisk = () => (
    <ScrollView style={styles.tabContent} accessibilityLabel="High risk patients list" accessibilityRole="scrollview">
      {highRiskPatients.map((patient) => (
        <View key={patient.id} style={styles.detailedPatientCard}>
          <View style={styles.patientProfileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {patient.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailedPatientName}>{patient.name}</Text>
              <Text style={styles.detailedPatientInfo}>Age {patient.age} • {patient.mrn}</Text>
              <Text style={styles.detailedPatientVisit}>Last Visit: {patient.last_visit}</Text>
            </View>
          </View>

          <View style={styles.riskScoreSection}>
            <Text style={styles.riskScoreLabel}>Overall Risk Score</Text>
            <Text style={[styles.largeRiskScore, { color: getRiskColor(patient.risk_level) }]}>
              {patient.risk_score}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${patient.risk_score}%`, backgroundColor: getRiskColor(patient.risk_level) }]} />
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Predicted Risk</Text>
            <View style={styles.predictedRiskBox}>
              <Icon name="warning" size={20} color="#f57c00" importantForAccessibility="no" accessible={false} />
              <View style={{ marginLeft: 8, flex: 1 }} importantForAccessibility="no-hide-descendants">
                <Text style={styles.predictedEventText}>{patient.predicted_event}</Text>
                <Text style={styles.predictedTimeText}>Timeframe: {patient.timeframe}</Text>
              </View>
            </View>

            <Text style={styles.detailSectionTitle}>Key Risk Factors</Text>
            {patient.key_factors?.map((factor, idx) => (
              <View key={idx} style={styles.factorItem}>
                <View style={styles.factorBullet} />
                <Text style={styles.factorItemText}>{factor}</Text>
              </View>
            ))}

            <Text style={styles.detailSectionTitle}>AI-Recommended Actions</Text>
            {patient.recommended_actions?.map((action, idx) => (
              <View key={idx} style={styles.actionItem}>
                <Icon name="check-circle" size={16} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}

            <View style={styles.actionButtons}>
              <Button
                title="Create Action Plan"
                buttonStyle={styles.primaryActionButton}
                titleStyle={styles.primaryActionButtonText}
                onPress={() => {}}
              />
              <Button
                title="Schedule Appointment"
                buttonStyle={styles.secondaryActionButton}
                titleStyle={styles.secondaryActionButtonText}
                onPress={() => {}}
              />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderPatients = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search patients..."
          onChangeText={setSearch}
          value={search}
          style={styles.searchInput}
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel="Search patients"
          accessibilityHint="Search patients by name, MRN, or condition"
        />
      </View>

      <FlatList
        data={allPatients}
        keyExtractor={(item) => item.id.toString()}
        accessibilityLabel="All patients list"
        accessibilityRole="list"
        renderItem={({ item }) => (
          <View style={styles.patientListItem}>
            <View style={styles.patientListInfo}>
              <Text style={styles.patientListName}>{item.name}</Text>
              <Text style={styles.patientListDetails}>{item.mrn} • Age {item.age}</Text>
              <View style={styles.patientListBadge}>
                <Text style={styles.patientListBadgeText}>{item.risk_category}</Text>
              </View>
            </View>
            <View style={styles.patientListRight}>
              <Text style={[styles.patientListScore, { color: getRiskColor(item.risk_level) }]}>
                {item.risk_score}
              </Text>
              <Button
                title="View"
                buttonStyle={styles.viewButton}
                titleStyle={styles.viewButtonText}
                onPress={() => setSelectedPatient(item)}
              />
            </View>
          </View>
        )}
      />
    </View>
  );

  const renderAlerts = () => (
    <ScrollView style={styles.tabContent} accessibilityLabel="Patient alerts list" accessibilityRole="scrollview">
      <View style={styles.filterContainer}>
        {['All', 'Critical', 'High', 'Medium', 'Low'].map((filter) => (
          <TouchableOpacity key={filter} style={styles.filterButton} accessibilityRole="button" accessibilityLabel={`Filter by ${filter} priority`} accessibilityHint={`Show ${filter.toLowerCase()} priority alerts`}>
            <Text style={styles.filterButtonText}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {recentAlerts.map((alert, idx) => (
        <View key={idx} style={[styles.fullAlertCard, { borderLeftColor: getPriorityColor(alert.priority) }]}>
          <View style={styles.alertHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alert.priority) + '20' }]}>
              <Text style={[styles.priorityBadgeText, { color: getPriorityColor(alert.priority) }]}>
                {alert.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.fullAlertPatient}>{alert.patient}</Text>
          </View>
          <Text style={styles.fullAlertType}>{alert.type}</Text>
          <Text style={styles.fullAlertMessage}>{alert.message}</Text>
          <Text style={styles.fullAlertTime}>{alert.time}</Text>
          <View style={styles.alertActions}>
            <Button
              title="Review"
              buttonStyle={styles.alertReviewButton}
              titleStyle={styles.alertReviewButtonText}
              onPress={() => {}}
            />
            <Button
              title="Dismiss"
              buttonStyle={styles.alertDismissButton}
              titleStyle={styles.alertDismissButtonText}
              onPress={() => {}}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer} importantForAccessibility="no" accessible={false}>
            <Icon name="psychology" size={32} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
          </View>
          <View>
            <Typography variant="h4" weight="bold" color="primary">
              MediMind Provider Portal
            </Typography>
            <Typography variant="caption" color="secondary" style={styles.headerSubtitle}>
              Dr. Jennifer Martinez, MD • Internal Medicine
            </Typography>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          accessibilityRole="button"
          accessibilityLabel={`${recentAlerts.length} unread alerts`}
          accessibilityHint="View all patient alerts and notifications"
        >
          <Icon name="notifications" size={24} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
          <View style={styles.notificationBadge} importantForAccessibility="no" accessible={false}>
            <Typography variant="caption" weight="bold" color="inverse" style={styles.notificationBadgeText}>
              {recentAlerts.length}
            </Typography>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
          { key: 'high-risk', label: 'High Risk', icon: 'warning' },
          { key: 'patients', label: 'Patients', icon: 'people' },
          { key: 'alerts', label: 'Alerts', icon: 'notifications' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityHint={`Switch to ${tab.label} view`}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? theme.colors.white : theme.colors.textSecondary}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography
              variant="caption"
              weight="semibold"
              color={activeTab === tab.key ? 'inverse' : 'secondary'}
              style={styles.tabLabel}
            >
              {tab.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'high-risk' && renderHighRisk()}
      {activeTab === 'patients' && renderPatients()}
      {activeTab === 'alerts' && renderAlerts()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundAlt,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: theme.spacing.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabLabel: {
    marginLeft: 6,
  },
  tabContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    marginLeft: 4,
    flex: 1,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  section: {
    marginTop: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  badge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.lg,
  },
  searchContainer: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  patientCard: {
    borderWidth: 2,
    borderColor: '#ffcdd2',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  patientInfo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  riskScoreContainer: {
    alignItems: 'center',
  },
  riskScore: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  riskLabel: {
    fontSize: 10,
    color: '#666',
  },
  riskAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  riskAlertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c62828',
  },
  riskAlertSubtitle: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 2,
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  factorTag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  factorText: {
    fontSize: 11,
    color: '#333',
  },
  patientActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  reviewButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  scheduleButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderLeftWidth: 4,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.xs,
  },
  alertMessage: {
    marginBottom: 4,
  },
  appointmentCard: {
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  appointmentDateTime: {
    marginTop: 4,
  },
  appointmentReason: {
    marginTop: 4,
  },
  detailedPatientCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 20,
  },
  patientProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  detailedPatientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailedPatientInfo: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  detailedPatientVisit: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  riskScoreSection: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  riskScoreLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  largeRiskScore: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#ffcdd2',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  detailSection: {
    gap: 16,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  predictedRiskBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffe0b2',
  },
  predictedEventText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e65100',
  },
  predictedTimeText: {
    fontSize: 12,
    color: '#f57c00',
    marginTop: 4,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  factorBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f44336',
    marginTop: 6,
    marginRight: 8,
  },
  factorItemText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
  },
  actionButtons: {
    gap: 8,
    marginTop: 8,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  primaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  patientListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  patientListInfo: {
    flex: 1,
  },
  patientListName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  patientListDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  patientListBadge: {
    backgroundColor: theme.colors.primary + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  patientListBadgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  patientListRight: {
    alignItems: 'center',
    marginLeft: 12,
  },
  patientListScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  viewButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  fullAlertCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  fullAlertPatient: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  fullAlertType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fullAlertMessage: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
  },
  fullAlertTime: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertReviewButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  alertReviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertDismissButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 8,
  },
  alertDismissButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});

export default ProviderPortalScreen;
