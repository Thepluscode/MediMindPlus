import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Icon, Button, Tab, TabView } from 'react-native-elements';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';
import providerAPI, { PatientDetails } from '../services/providerAPI';

interface PatientDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      patientId: string;
    };
  };
}

const PatientDetailsScreen: React.FC<PatientDetailsScreenProps> = ({ navigation, route }) => {
  const { patientId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    loadPatientDetails();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      setLoading(true);
      const data = await providerAPI.getPatientDetails(patientId);
      setPatient(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientDetails();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading patient details..."
        color={theme.colors.primary}
      />
    );
  }

  if (!patient) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="error-outline" type="material" size={64} color={theme.colors.border} importantForAccessibility="no" accessible={false} />
        <Typography variant="h4" weight="semibold" color="secondary" style={styles.errorText}>
          Patient not found
        </Typography>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" type="material" color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold" style={styles.headerTitle}>
          Patient Details
        </Typography>
        <TouchableOpacity
          onPress={() => Alert.alert('Edit', 'Edit patient info (coming soon)')}
          accessibilityRole="button"
          accessibilityLabel="Edit patient information"
        >
          <Icon name="edit" type="material" color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        accessibilityLabel="Patient details content"
        accessibilityRole="scrollview"
      >
        {/* Patient Header Card */}
        <Card elevated elevation="md" padding="lg" style={styles.headerCard}>
          <View style={styles.patientHeaderContent}>
            <View style={[styles.largeAvatar, { backgroundColor: theme.colors.primary }]}>
              <Typography variant="h2" weight="bold" style={styles.largeAvatarText}>
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </Typography>
            </View>
            <View style={styles.patientHeaderInfo}>
              <Typography variant="h3" weight="bold" style={styles.patientName}>
                {patient.firstName} {patient.lastName}
              </Typography>
              <Typography variant="body" color="secondary" style={styles.patientAge}>
                {calculateAge(patient.dateOfBirth)} years old • {patient.bloodType || 'Blood type N/A'}
              </Typography>
              {patient.riskScore !== undefined && (
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(patient.riskScore) }]}>
                  <Typography variant="body" weight="semibold" style={styles.riskBadgeText}>
                    Risk Score: {patient.riskScore}%
                  </Typography>
                </View>
              )}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <View style={styles.contactRow}>
              <Icon name="email" type="material" size={18} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" color="secondary" style={styles.contactText}>
                {patient.email}
              </Typography>
            </View>
            {patient.phone && (
              <View style={styles.contactRow}>
                <Icon name="phone" type="material" size={18} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                <Typography variant="body" color="secondary" style={styles.contactText}>
                  {patient.phone}
                </Typography>
              </View>
            )}
            {patient.address && (
              <View style={styles.contactRow}>
                <Icon name="location-on" type="material" size={18} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                <Typography variant="body" color="secondary" style={styles.contactText}>
                  {patient.address}
                </Typography>
              </View>
            )}
          </View>

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <View style={styles.emergencySection}>
              <Typography variant="body" weight="semibold" color="secondary" style={styles.sectionSubtitle}>
                Emergency Contact
              </Typography>
              <Typography variant="body" weight="semibold" style={styles.emergencyText}>
                {patient.emergencyContact}
                {patient.emergencyPhone && ` • ${patient.emergencyPhone}`}
              </Typography>
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('AppointmentManagement', { patientId, action: 'create' })}
            accessibilityRole="button"
            accessibilityLabel="Schedule appointment"
            accessibilityHint="Tap to schedule a new appointment for this patient"
          >
            <Icon name="event" type="material" color={theme.colors.primary} size={24} importantForAccessibility="no" accessible={false} />
            <Typography variant="caption" color="secondary" weight="medium" style={styles.quickActionText}>
              Schedule
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('ClinicalNotes', { patientId, action: 'create' })}
            accessibilityRole="button"
            accessibilityLabel="Add clinical note"
            accessibilityHint="Tap to create a new clinical note for this patient"
          >
            <Icon name="note-add" type="material" color={theme.colors.primary} size={24} importantForAccessibility="no" accessible={false} />
            <Typography variant="caption" color="secondary" weight="medium" style={styles.quickActionText}>
              Add Note
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('PrescriptionManagement', { patientId, action: 'create' })}
            accessibilityRole="button"
            accessibilityLabel="Prescribe medication"
            accessibilityHint="Tap to prescribe medication for this patient"
          >
            <Icon name="medication" type="material" color={theme.colors.primary} size={24} importantForAccessibility="no" accessible={false} />
            <Typography variant="caption" color="secondary" weight="medium" style={styles.quickActionText}>
              Prescribe
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <Tab value={tabIndex} onChange={setTabIndex} indicatorStyle={{ backgroundColor: theme.colors.primary }}>
          <Tab.Item title="Overview" titleStyle={styles.tabTitle} />
          <Tab.Item title="Medical" titleStyle={styles.tabTitle} />
          <Tab.Item title="Appointments" titleStyle={styles.tabTitle} />
          <Tab.Item title="Notes" titleStyle={styles.tabTitle} />
        </Tab>

        <TabView value={tabIndex} onChange={setTabIndex}>
          {/* Overview Tab */}
          <TabView.Item style={styles.tabContent}>
            {/* Vital Signs */}
            {patient.vitalSigns && patient.vitalSigns.length > 0 && (
              <Card elevated elevation="sm" padding="md" style={styles.card}>
                <Typography variant="h4" weight="bold" style={styles.cardTitle}>
                  Recent Vital Signs
                </Typography>
                {patient.vitalSigns.slice(0, 1).map((vital, index) => (
                  <View key={index} style={styles.vitalContainer}>
                    <View style={styles.vitalRow}>
                      <Typography variant="body" weight="semibold" color="secondary" style={styles.vitalLabel}>
                        Blood Pressure:
                      </Typography>
                      <Typography variant="body" weight="bold" style={styles.vitalValue}>
                        {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic} mmHg
                      </Typography>
                    </View>
                    <View style={styles.vitalRow}>
                      <Typography variant="body" weight="semibold" color="secondary" style={styles.vitalLabel}>
                        Heart Rate:
                      </Typography>
                      <Typography variant="body" weight="bold" style={styles.vitalValue}>
                        {vital.heartRate} bpm
                      </Typography>
                    </View>
                    <View style={styles.vitalRow}>
                      <Typography variant="body" weight="semibold" color="secondary" style={styles.vitalLabel}>
                        Temperature:
                      </Typography>
                      <Typography variant="body" weight="bold" style={styles.vitalValue}>
                        {vital.temperature}°F
                      </Typography>
                    </View>
                    <View style={styles.vitalRow}>
                      <Typography variant="body" weight="semibold" color="secondary" style={styles.vitalLabel}>
                        Weight:
                      </Typography>
                      <Typography variant="body" weight="bold" style={styles.vitalValue}>
                        {vital.weight} lbs
                      </Typography>
                    </View>
                    <Typography variant="caption" color="secondary" style={styles.vitalDate}>
                      Recorded: {new Date(vital.recordedDate).toLocaleDateString()}
                    </Typography>
                  </View>
                ))}
              </Card>
            )}

            {/* Medications */}
            {patient.medications && patient.medications.length > 0 && (
              <Card elevated elevation="sm" padding="md" style={styles.card}>
                <Typography variant="h4" weight="bold" style={styles.cardTitle}>
                  Current Medications
                </Typography>
                {patient.medications.map((med, index) => (
                  <View key={index} style={styles.listItem}>
                    <Icon name="medication" type="material" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
                    <View style={styles.listItemContent}>
                      <Typography variant="body" weight="semibold" style={styles.listItemTitle}>
                        {med.name}
                      </Typography>
                      <Typography variant="body" color="secondary" style={styles.listItemSubtitle}>
                        {med.dosage}
                      </Typography>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Allergies */}
            {patient.allergies && patient.allergies.length > 0 && (
              <Card elevated elevation="sm" padding="md" style={styles.card}>
                <Typography variant="h4" weight="bold" style={styles.cardTitle}>
                  Allergies
                </Typography>
                <View style={styles.chipsContainer}>
                  {patient.allergies.map((allergy, index) => (
                    <View key={index} style={styles.allergyChip}>
                      <Typography variant="body" weight="semibold" style={styles.allergyText}>
                        {allergy}
                      </Typography>
                    </View>
                  ))}
                </View>
              </Card>
            )}
          </TabView.Item>

          {/* Medical Tab */}
          <TabView.Item style={styles.tabContent}>
            {/* Conditions */}
            {patient.conditions && patient.conditions.length > 0 && (
              <Card elevated elevation="sm" padding="md" style={styles.card}>
                <Typography variant="h4" weight="bold" style={styles.cardTitle}>
                  Medical Conditions
                </Typography>
                {patient.conditions.map((condition, index) => (
                  <View key={index} style={styles.listItem}>
                    <Icon name="local-hospital" type="material" size={20} color={theme.colors.error} importantForAccessibility="no" accessible={false} />
                    <View style={styles.listItemContent}>
                      <Typography variant="body" weight="semibold" style={styles.listItemTitle}>
                        {condition.name}
                      </Typography>
                      {condition.diagnosedDate && (
                        <Typography variant="body" color="secondary" style={styles.listItemSubtitle}>
                          Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Surgeries */}
            {patient.surgeries && patient.surgeries.length > 0 && (
              <Card elevated elevation="sm" padding="md" style={styles.card}>
                <Typography variant="h4" weight="bold" style={styles.cardTitle}>
                  Past Surgeries
                </Typography>
                {patient.surgeries.map((surgery, index) => (
                  <View key={index} style={styles.listItem}>
                    <Icon name="healing" type="material" size={20} color={theme.colors.warning} importantForAccessibility="no" accessible={false} />
                    <View style={styles.listItemContent}>
                      <Typography variant="body" weight="semibold" style={styles.listItemTitle}>
                        {surgery.name}
                      </Typography>
                      <Typography variant="body" color="secondary" style={styles.listItemSubtitle}>
                        {new Date(surgery.date).toLocaleDateString()}
                      </Typography>
                      {surgery.notes && (
                        <Typography variant="caption" color="secondary" style={styles.listItemNotes}>
                          {surgery.notes}
                        </Typography>
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Family History */}
            {patient.familyHistory && patient.familyHistory.length > 0 && (
              <Card elevated elevation="sm" padding="md" style={styles.card}>
                <Typography variant="h4" weight="bold" style={styles.cardTitle}>
                  Family History
                </Typography>
                {patient.familyHistory.map((history, index) => (
                  <View key={index} style={styles.listItem}>
                    <Icon name="family-restroom" type="material" size={20} color="#9C27B0" importantForAccessibility="no" accessible={false} />
                    <View style={styles.listItemContent}>
                      <Typography variant="body" weight="semibold" style={styles.listItemTitle}>
                        {history.condition}
                      </Typography>
                      <Typography variant="body" color="secondary" style={styles.listItemSubtitle}>
                        {history.relationship}
                      </Typography>
                      {history.notes && (
                        <Typography variant="caption" color="secondary" style={styles.listItemNotes}>
                          {history.notes}
                        </Typography>
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Lifestyle */}
            {patient.lifestyle && (
              <Card elevated elevation="sm" padding="md" style={styles.card}>
                <Typography variant="h4" weight="bold" style={styles.cardTitle}>
                  Lifestyle Information
                </Typography>
                <View style={styles.lifestyleGrid}>
                  {patient.lifestyle.smokingStatus && (
                    <View style={styles.lifestyleItem}>
                      <Typography variant="caption" color="secondary" style={styles.lifestyleLabel}>
                        Smoking:
                      </Typography>
                      <Typography variant="body" weight="semibold" style={styles.lifestyleValue}>
                        {patient.lifestyle.smokingStatus}
                      </Typography>
                    </View>
                  )}
                  {patient.lifestyle.alcoholConsumption && (
                    <View style={styles.lifestyleItem}>
                      <Typography variant="caption" color="secondary" style={styles.lifestyleLabel}>
                        Alcohol:
                      </Typography>
                      <Typography variant="body" weight="semibold" style={styles.lifestyleValue}>
                        {patient.lifestyle.alcoholConsumption}
                      </Typography>
                    </View>
                  )}
                  {patient.lifestyle.exerciseFrequency && (
                    <View style={styles.lifestyleItem}>
                      <Typography variant="caption" color="secondary" style={styles.lifestyleLabel}>
                        Exercise:
                      </Typography>
                      <Typography variant="body" weight="semibold" style={styles.lifestyleValue}>
                        {patient.lifestyle.exerciseFrequency}
                      </Typography>
                    </View>
                  )}
                  {patient.lifestyle.diet && (
                    <View style={styles.lifestyleItem}>
                      <Typography variant="caption" color="secondary" style={styles.lifestyleLabel}>
                        Diet:
                      </Typography>
                      <Typography variant="body" weight="semibold" style={styles.lifestyleValue}>
                        {patient.lifestyle.diet}
                      </Typography>
                    </View>
                  )}
                  {patient.lifestyle.sleepHours && (
                    <View style={styles.lifestyleItem}>
                      <Typography variant="caption" color="secondary" style={styles.lifestyleLabel}>
                        Sleep:
                      </Typography>
                      <Typography variant="body" weight="semibold" style={styles.lifestyleValue}>
                        {patient.lifestyle.sleepHours} hrs/night
                      </Typography>
                    </View>
                  )}
                </View>
              </Card>
            )}
          </TabView.Item>

          {/* Appointments Tab */}
          <TabView.Item style={styles.tabContent}>
            {patient.appointments && patient.appointments.length > 0 ? (
              patient.appointments.map((appointment, index) => (
                <Card key={index} elevated elevation="sm" padding="md" style={styles.card}>
                  <View style={styles.appointmentHeader}>
                    <Typography variant="body" weight="semibold" style={styles.appointmentDate}>
                      {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                    </Typography>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                      <Typography variant="caption" weight="semibold" style={styles.statusText}>
                        {appointment.status}
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="body" color="secondary" style={styles.appointmentType}>
                    {appointment.type}
                  </Typography>
                  {appointment.reason && (
                    <Typography variant="body" style={styles.appointmentReason}>
                      {appointment.reason}
                    </Typography>
                  )}
                  {appointment.notes && (
                    <Typography variant="caption" color="secondary" style={styles.appointmentNotes}>
                      {appointment.notes}
                    </Typography>
                  )}
                </Card>
              ))
            ) : (
              <Typography variant="body" color="secondary" style={styles.emptyText}>
                No appointments recorded
              </Typography>
            )}
          </TabView.Item>

          {/* Clinical Notes Tab */}
          <TabView.Item style={styles.tabContent}>
            {patient.clinicalNotes && patient.clinicalNotes.length > 0 ? (
              patient.clinicalNotes.map((note, index) => (
                <Card key={index} elevated elevation="sm" padding="md" style={styles.card}>
                  <View style={styles.noteHeader}>
                    <Typography variant="body" weight="semibold" style={styles.noteType}>
                      {note.noteType}
                    </Typography>
                    <Typography variant="caption" color="secondary" style={styles.noteDate}>
                      {note.createdAt && new Date(note.createdAt).toLocaleDateString()}
                    </Typography>
                  </View>
                  {note.chiefComplaint && (
                    <View style={styles.noteSection}>
                      <Typography variant="body" weight="semibold" style={styles.noteSectionTitle}>
                        Chief Complaint:
                      </Typography>
                      <Typography variant="body" color="secondary" style={styles.noteSectionText}>
                        {note.chiefComplaint}
                      </Typography>
                    </View>
                  )}
                  <View style={styles.noteSection}>
                    <Typography variant="body" weight="semibold" style={styles.noteSectionTitle}>
                      Assessment:
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.noteSectionText}>
                      {note.assessment}
                    </Typography>
                  </View>
                  <View style={styles.noteSection}>
                    <Typography variant="body" weight="semibold" style={styles.noteSectionTitle}>
                      Plan:
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.noteSectionText}>
                      {note.plan}
                    </Typography>
                  </View>
                </Card>
              ))
            ) : (
              <Typography variant="body" color="secondary" style={styles.emptyText}>
                No clinical notes recorded
              </Typography>
            )}
          </TabView.Item>
        </TabView>
      </ScrollView>
    </View>
  );
};

const getRiskColor = (riskScore: number): string => {
  if (riskScore >= 70) return '#F44336';
  if (riskScore >= 40) return '#FF9800';
  return '#4CAF50';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return '#4CAF50';
    case 'scheduled': return '#2196F3';
    case 'in-progress': return '#FF9800';
    case 'completed': return '#9E9E9E';
    case 'cancelled': return '#F44336';
    default: return '#757575';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    marginBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: theme.spacing.md,
  },
  patientHeaderContent: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  largeAvatarText: {
    color: theme.colors.textInverse,
  },
  patientHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    marginBottom: theme.spacing.xs,
  },
  patientAge: {
    marginBottom: theme.spacing.xs,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  riskBadgeText: {
    color: theme.colors.textInverse,
  },
  contactSection: {
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  contactText: {
    marginLeft: theme.spacing.xs,
  },
  emergencySection: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionSubtitle: {
    marginBottom: theme.spacing.xs,
  },
  emergencyText: {
    color: theme.colors.error,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  quickActionBtn: {
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: theme.spacing.xs,
  },
  tabTitle: {
    fontSize: 12,
  },
  tabContent: {
    width: '100%',
  },
  card: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    marginBottom: theme.spacing.sm,
  },
  vitalContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  vitalLabel: {},
  vitalValue: {},
  vitalDate: {
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listItemContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  listItemTitle: {
    marginBottom: theme.spacing.xs,
  },
  listItemSubtitle: {},
  listItemNotes: {
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergyChip: {
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  allergyText: {
    color: theme.colors.error,
  },
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lifestyleItem: {
    width: '50%',
    marginBottom: theme.spacing.sm,
  },
  lifestyleLabel: {
    marginBottom: theme.spacing.xs,
  },
  lifestyleValue: {},
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  appointmentDate: {},
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.lg,
  },
  statusText: {
    color: theme.colors.textInverse,
    textTransform: 'capitalize',
  },
  appointmentType: {
    marginBottom: theme.spacing.xs,
    textTransform: 'capitalize',
  },
  appointmentReason: {
    marginBottom: theme.spacing.xs,
  },
  appointmentNotes: {
    fontStyle: 'italic',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  noteType: {
    color: theme.colors.info,
    textTransform: 'capitalize',
  },
  noteDate: {},
  noteSection: {
    marginBottom: theme.spacing.sm,
  },
  noteSectionTitle: {
    marginBottom: theme.spacing.xs,
  },
  noteSectionText: {
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 40,
  },
});

export default PatientDetailsScreen;
