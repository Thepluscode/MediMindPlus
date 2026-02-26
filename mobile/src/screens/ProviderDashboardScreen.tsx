import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';
import providerAPI, { ProviderDashboardStats } from '../services/providerAPI';

interface ProviderDashboardScreenProps {
  navigation: any;
}

const ProviderDashboardScreen: React.FC<ProviderDashboardScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ProviderDashboardStats | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await providerAPI.getDashboardStats();
      setStats(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading dashboard..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navigationHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" type="material" color="#FFFFFF" size={24} />
          <Typography variant="body" weight="semibold" style={styles.backButtonText}>
            Back
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h3" weight="bold" style={styles.headerTitle}>
            Provider Portal
          </Typography>
          <Typography variant="body" color="secondary" style={styles.headerSubtitle}>
            Welcome back, Doctor
          </Typography>
        </View>

      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('PatientManagement')}
          accessibilityRole="button"
          accessibilityLabel={`Total patients: ${stats?.totalPatients || 0}. Tap to view patient management.`}
        >
          <Icon name="people" type="material" color="#FFFFFF" size={32} />
          <Typography variant="h2" weight="bold" style={styles.statNumber}>
            {stats?.totalPatients || 0}
          </Typography>
          <Typography variant="body" style={styles.statLabel}>
            Total Patients
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.colors.success }]}
          onPress={() => navigation.navigate('AppointmentManagement', { filter: 'today' })}
          accessibilityRole="button"
          accessibilityLabel={`Today's appointments: ${stats?.todayAppointments || 0}. Tap to view.`}
        >
          <Icon name="event" type="material" color="#FFFFFF" size={32} />
          <Typography variant="h2" weight="bold" style={styles.statNumber}>
            {stats?.todayAppointments || 0}
          </Typography>
          <Typography variant="body" style={styles.statLabel}>
            Today's Appointments
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.colors.warning }]}
          onPress={() => navigation.navigate('PrescriptionManagement', { filter: 'pending' })}
          accessibilityRole="button"
          accessibilityLabel={`Pending prescriptions: ${stats?.pendingPrescriptions || 0}. Tap to view.`}
        >
          <Icon name="medication" type="material" color="#FFFFFF" size={32} />
          <Typography variant="h2" weight="bold" style={styles.statNumber}>
            {stats?.pendingPrescriptions || 0}
          </Typography>
          <Typography variant="body" style={styles.statLabel}>
            Pending Prescriptions
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: theme.colors.error }]}
          onPress={() => navigation.navigate('PatientManagement', { filter: 'critical' })}
          accessibilityRole="button"
          accessibilityLabel={`Critical alerts: ${stats?.criticalAlerts || 0}. Tap to view.`}
        >
          <Icon name="warning" type="material" color="#FFFFFF" size={32} />
          <Typography variant="h2" weight="bold" style={styles.statNumber}>
            {stats?.criticalAlerts || 0}
          </Typography>
          <Typography variant="body" style={styles.statLabel}>
            Critical Alerts
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointments */}
      <Card elevated elevation="sm" padding="md" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Icon name="event" type="material" color={theme.colors.primary} size={24} />
            <Typography variant="h4" weight="bold" style={styles.cardTitle}>
              Upcoming Appointments
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AppointmentManagement')}
            accessibilityRole="button"
            accessibilityLabel="View all appointments"
          >
            <Typography variant="body" weight="semibold" style={[styles.linkText, { color: theme.colors.primary }]}>
              View All
            </Typography>
          </TouchableOpacity>
        </View>
        {stats?.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
          stats.upcomingAppointments.slice(0, 5).map((appointment, index) => (
            <TouchableOpacity
              key={appointment.id || index}
              style={styles.appointmentItem}
              onPress={() => navigation.navigate('PatientDetails', { patientId: appointment.patientId })}
              accessibilityRole="button"
              accessibilityLabel={`Appointment with ${appointment.patientName} on ${new Date(appointment.appointmentDate).toLocaleDateString()}`}
            >
              <View style={styles.appointmentInfo}>
                <Typography variant="body" weight="semibold" style={styles.appointmentName}>
                  {appointment.patientName}
                </Typography>
                <Typography variant="body" color="secondary" style={styles.appointmentTime}>
                  {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                </Typography>
                <Typography variant="caption" color="secondary" style={styles.appointmentType}>
                  {appointment.type}
                </Typography>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                <Typography variant="caption" weight="semibold" style={styles.statusText}>
                  {appointment.status}
                </Typography>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Typography variant="body" color="secondary" style={styles.emptyText}>
            No upcoming appointments
          </Typography>
        )}
      </Card>

      {/* Recent Patients */}
      <Card elevated elevation="sm" padding="md" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Icon name="people" type="material" color={theme.colors.primary} size={24} />
            <Typography variant="h4" weight="bold" style={styles.cardTitle}>
              Recent Patients
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('PatientManagement')}
            accessibilityRole="button"
            accessibilityLabel="View all patients"
          >
            <Typography variant="body" weight="semibold" style={[styles.linkText, { color: theme.colors.primary }]}>
              View All
            </Typography>
          </TouchableOpacity>
        </View>
        {stats?.recentPatients && stats.recentPatients.length > 0 ? (
          stats.recentPatients.slice(0, 5).map((patient, index) => (
            <TouchableOpacity
              key={patient.id || index}
              style={styles.patientItem}
              onPress={() => navigation.navigate('PatientDetails', { patientId: patient.id })}
              accessibilityRole="button"
              accessibilityLabel={`View ${patient.firstName} ${patient.lastName} details`}
            >
              <View style={styles.patientAvatar}>
                <Typography variant="body" weight="bold" style={styles.avatarText}>
                  {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                </Typography>
              </View>
              <View style={styles.patientInfo}>
                <Typography variant="body" weight="semibold" style={styles.patientName}>
                  {patient.firstName} {patient.lastName}
                </Typography>
                <Typography variant="body" color="secondary" style={styles.patientDetail}>
                  Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
                </Typography>
                {patient.riskScore && (
                  <View style={styles.riskBadge}>
                    <Typography variant="caption" weight="semibold" style={styles.riskText}>
                      Risk: {patient.riskScore}%
                    </Typography>
                  </View>
                )}
              </View>
              <Icon name="chevron-right" type="material" color={theme.colors.border} />
            </TouchableOpacity>
          ))
        ) : (
          <Typography variant="body" color="secondary" style={styles.emptyText}>
            No recent patients
          </Typography>
        )}
      </Card>

      {/* Quick Actions */}
      <Card elevated elevation="sm" padding="md" style={styles.card}>
        <Typography variant="h4" weight="bold" style={styles.cardTitle}>
          Quick Actions
        </Typography>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('AppointmentManagement', { action: 'create' })}
            accessibilityRole="button"
            accessibilityLabel="Create new appointment"
          >
            <Icon name="add-circle" type="material" color={theme.colors.primary} size={40} />
            <Typography variant="body" weight="semibold" style={styles.quickActionText}>
              New Appointment
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('PrescriptionManagement', { action: 'create' })}
            accessibilityRole="button"
            accessibilityLabel="Write new prescription"
          >
            <Icon name="medication" type="material" color={theme.colors.primary} size={40} />
            <Typography variant="body" weight="semibold" style={styles.quickActionText}>
              Write Prescription
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('ClinicalNotes', { action: 'create' })}
            accessibilityRole="button"
            accessibilityLabel="Add clinical note"
          >
            <Icon name="note-add" type="material" color={theme.colors.primary} size={40} />
            <Typography variant="body" weight="semibold" style={styles.quickActionText}>
              Add Clinical Note
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('PatientManagement')}
            accessibilityRole="button"
            accessibilityLabel="Find patient"
          >
            <Icon name="person-search" type="material" color={theme.colors.primary} size={40} />
            <Typography variant="body" weight="semibold" style={styles.quickActionText}>
              Find Patient
            </Typography>
          </TouchableOpacity>
        </View>
      </Card>
      </ScrollView>
    </View>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return '#4CAF50';
    case 'scheduled':
      return '#2196F3';
    case 'in-progress':
      return '#FF9800';
    case 'completed':
      return '#9E9E9E';
    case 'cancelled':
      return '#F44336';
    default:
      return '#757575';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  navigationHeader: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    marginBottom: theme.spacing.xs,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    width: '48%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    marginLeft: theme.spacing.sm,
    marginBottom: 0,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  appointmentTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  patientDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.warningLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.md,
  },
  riskText: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
    paddingVertical: theme.spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  quickActionButton: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  quickActionText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProviderDashboardScreen;
