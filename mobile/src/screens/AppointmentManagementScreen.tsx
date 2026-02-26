import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Card, Icon, Button, Input } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import providerAPI, { Appointment, PatientSummary } from '../services/providerAPI';
import { LinearGradient } from 'expo-linear-gradient';
import { theme as appTheme } from '../theme/theme';
import { Typography, LoadingSpinner } from '../components/ui';

interface AppointmentManagementScreenProps {
  navigation: any;
  route?: any;
}

const AppointmentManagementScreen: React.FC<AppointmentManagementScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>(route?.params?.filter || 'upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patients, setPatients] = useState<PatientSummary[]>([]);

  // Create appointment form state
  const [newAppointment, setNewAppointment] = useState<Appointment>({
    patientId: route?.params?.patientId || '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:00',
    duration: 30,
    type: 'checkup',
    status: 'scheduled',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadAppointments();
    loadPatients();

    if (route?.params?.action === 'create') {
      setShowCreateModal(true);
    }
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await providerAPI.getAppointments();
      setAppointments(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await providerAPI.getPatients();
      setPatients(data);
    } catch (error) {
      // Error handled silently
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const filterAppointments = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let filtered = [...appointments];

    if (filter === 'today') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate.toDateString() === today.toDateString();
      });
    } else if (filter === 'upcoming') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
      });
      filtered.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    } else if (filter === 'past') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate < today || apt.status === 'completed';
      });
      filtered.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    } else if (filter === 'cancelled') {
      filtered = filtered.filter((apt) => apt.status === 'cancelled');
    }

    setFilteredAppointments(filtered);
  };

  const handleCreateAppointment = async () => {
    try {
      if (!newAppointment.patientId) {
        Alert.alert('Error', 'Please select a patient');
        return;
      }

      await providerAPI.createAppointment(newAppointment);
      Alert.alert('Success', 'Appointment created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadAppointments();
    } catch (error) {
      Alert.alert('Error', 'Failed to create appointment');
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      await providerAPI.updateAppointment(appointmentId, { status: status as any });
      Alert.alert('Success', 'Appointment status updated');
      await loadAppointments();
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await providerAPI.cancelAppointment(appointmentId);
              Alert.alert('Success', 'Appointment cancelled');
              await loadAppointments();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewAppointment({
      patientId: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '09:00',
      duration: 30,
      type: 'checkup',
      status: 'scheduled',
      reason: '',
      notes: '',
    });
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

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading appointments..."
        color={appTheme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={appTheme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Icon
            name="arrow-back"
            type="material"
            color="#fff"
            importantForAccessibility="no"
            accessible={false}
          />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold" style={styles.headerTitle}>
          Appointments
        </Typography>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Create new appointment"
          accessibilityHint="Open form to schedule a new appointment"
        >
          <Icon
            name="add-circle"
            type="material"
            color="#fff"
            size={28}
            importantForAccessibility="no"
            accessible={false}
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
        accessibilityLabel="Appointment filters"
        accessibilityRole="scrollview"
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === 'today' && styles.filterChipActive]}
          onPress={() => setFilter('today')}
          accessibilityRole="button"
          accessibilityLabel="Filter today's appointments"
          accessibilityHint="Show only appointments scheduled for today"
          accessibilityState={{ selected: filter === 'today' }}
        >
          <Typography
            variant="body"
            weight="semibold"
            style={[styles.filterChipText, filter === 'today' && styles.filterChipTextActive]}
          >
            Today
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'upcoming' && styles.filterChipActive]}
          onPress={() => setFilter('upcoming')}
          accessibilityRole="button"
          accessibilityLabel="Filter upcoming appointments"
          accessibilityHint="Show all future appointments that are scheduled or confirmed"
          accessibilityState={{ selected: filter === 'upcoming' }}
        >
          <Typography
            variant="body"
            weight="semibold"
            style={[styles.filterChipText, filter === 'upcoming' && styles.filterChipTextActive]}
          >
            Upcoming
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'past' && styles.filterChipActive]}
          onPress={() => setFilter('past')}
          accessibilityRole="button"
          accessibilityLabel="Filter past appointments"
          accessibilityHint="Show all completed or past appointments"
          accessibilityState={{ selected: filter === 'past' }}
        >
          <Typography
            variant="body"
            weight="semibold"
            style={[styles.filterChipText, filter === 'past' && styles.filterChipTextActive]}
          >
            Past
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'cancelled' && styles.filterChipActive]}
          onPress={() => setFilter('cancelled')}
          accessibilityRole="button"
          accessibilityLabel="Filter cancelled appointments"
          accessibilityHint="Show only cancelled appointments"
          accessibilityState={{ selected: filter === 'cancelled' }}
        >
          <Typography
            variant="body"
            weight="semibold"
            style={[styles.filterChipText, filter === 'cancelled' && styles.filterChipTextActive]}
          >
            Cancelled
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      {/* Appointment List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        accessibilityLabel="Appointment list"
        accessibilityRole="scrollview"
      >
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} containerStyle={styles.appointmentCard}>
              <View style={styles.appointmentContent}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentInfo}>
                    <Typography variant="body" weight="bold" style={styles.patientName}>
                      {appointment.patientName}
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.appointmentDateTime}>
                      {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                    </Typography>
                    <View style={styles.appointmentMeta}>
                      <Icon
                        name="schedule"
                        type="material"
                        size={16}
                        color="#666"
                        importantForAccessibility="no"
                        accessible={false}
                      />
                      <Typography variant="caption" color="secondary" style={styles.appointmentDuration}>
                        {appointment.duration} min
                      </Typography>
                      <Typography variant="caption" color="secondary" style={styles.appointmentType}>
                        {' • '}{appointment.type}
                      </Typography>
                    </View>
                    {appointment.reason && (
                      <Typography variant="body" style={styles.appointmentReason}>
                        Reason: {appointment.reason}
                      </Typography>
                    )}
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Typography variant="caption" weight="semibold" style={styles.statusText}>
                      {appointment.status}
                    </Typography>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('PatientDetails', { patientId: appointment.patientId })}
                    accessibilityRole="button"
                    accessibilityLabel={`View patient details for ${appointment.patientName}`}
                    accessibilityHint="Navigate to patient's medical history and profile"
                  >
                    <Icon
                      name="person"
                      type="material"
                      size={18}
                      color={appTheme.colors.primary}
                      importantForAccessibility="no"
                      accessible={false}
                    />
                    <Typography variant="caption" weight="semibold" style={styles.actionButtonText}>
                      View Patient
                    </Typography>
                  </TouchableOpacity>

                  {appointment.status === 'scheduled' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUpdateStatus(appointment.id!, 'confirmed')}
                      accessibilityRole="button"
                      accessibilityLabel="Confirm appointment"
                      accessibilityHint="Change appointment status to confirmed"
                    >
                      <Icon
                        name="check-circle"
                        type="material"
                        size={18}
                        color="#4CAF50"
                        importantForAccessibility="no"
                        accessible={false}
                      />
                      <Typography variant="caption" weight="semibold" style={styles.actionButtonText}>
                        Confirm
                      </Typography>
                    </TouchableOpacity>
                  )}

                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleUpdateStatus(appointment.id!, 'in-progress')}
                        accessibilityRole="button"
                        accessibilityLabel="Start appointment"
                        accessibilityHint="Mark appointment as in progress and begin consultation"
                      >
                        <Icon
                          name="play-circle"
                          type="material"
                          size={18}
                          color="#FF9800"
                          importantForAccessibility="no"
                          accessible={false}
                        />
                        <Typography variant="caption" weight="semibold" style={styles.actionButtonText}>
                          Start
                        </Typography>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleCancelAppointment(appointment.id!)}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel appointment"
                        accessibilityHint="Cancel this appointment with confirmation prompt"
                      >
                        <Icon
                          name="cancel"
                          type="material"
                          size={18}
                          color="#F44336"
                          importantForAccessibility="no"
                          accessible={false}
                        />
                        <Typography variant="caption" weight="semibold" style={styles.actionButtonText}>
                          Cancel
                        </Typography>
                      </TouchableOpacity>
                    </>
                  )}

                  {appointment.status === 'in-progress' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUpdateStatus(appointment.id!, 'completed')}
                      accessibilityRole="button"
                      accessibilityLabel="Complete appointment"
                      accessibilityHint="Mark appointment as completed"
                    >
                      <Icon
                        name="check-circle"
                        type="material"
                        size={18}
                        color="#4CAF50"
                        importantForAccessibility="no"
                        accessible={false}
                      />
                      <Typography variant="caption" weight="semibold" style={styles.actionButtonText}>
                        Complete
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Card>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon
              name="event-busy"
              type="material"
              size={64}
              color="#CCC"
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="body" weight="semibold" style={styles.emptyText}>
              No appointments found
            </Typography>
            <Button
              title="Create Appointment"
              onPress={() => setShowCreateModal(true)}
              containerStyle={styles.emptyButton}
            />
          </View>
        )}
      </ScrollView>

      {/* Create Appointment Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
        accessibilityLabel="Create appointment form"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Typography variant="h4" weight="bold">Create Appointment</Typography>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              accessibilityHint="Close appointment form and return to appointment list"
            >
              <Icon
                name="close"
                type="material"
                size={28}
                importantForAccessibility="no"
                accessible={false}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            accessibilityLabel="Appointment form fields"
            accessibilityRole="scrollview"
          >
            {/* Patient Selection */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>
              Patient *
            </Typography>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newAppointment.patientId}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, patientId: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select a patient" value="" />
                {patients.map((patient) => (
                  <Picker.Item
                    key={patient.id}
                    label={`${patient.firstName} ${patient.lastName}`}
                    value={patient.id}
                  />
                ))}
              </Picker>
            </View>

            {/* Date */}
            <Input
              label="Date *"
              value={newAppointment.appointmentDate}
              onChangeText={(text) => setNewAppointment({ ...newAppointment, appointmentDate: text })}
              placeholder="YYYY-MM-DD"
              leftIcon={
                <Icon
                  name="calendar-today"
                  type="material"
                  size={20}
                  importantForAccessibility="no"
                  accessible={false}
                />
              }
            />

            {/* Time */}
            <Input
              label="Time *"
              value={newAppointment.appointmentTime}
              onChangeText={(text) => setNewAppointment({ ...newAppointment, appointmentTime: text })}
              placeholder="HH:MM"
              leftIcon={
                <Icon
                  name="access-time"
                  type="material"
                  size={20}
                  importantForAccessibility="no"
                  accessible={false}
                />
              }
            />

            {/* Duration */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>
              Duration (minutes)
            </Typography>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newAppointment.duration}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, duration: value })}
                style={styles.picker}
              >
                <Picker.Item label="15 minutes" value={15} />
                <Picker.Item label="30 minutes" value={30} />
                <Picker.Item label="45 minutes" value={45} />
                <Picker.Item label="60 minutes" value={60} />
                <Picker.Item label="90 minutes" value={90} />
              </Picker>
            </View>

            {/* Type */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>
              Appointment Type
            </Typography>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newAppointment.type}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value as any })}
                style={styles.picker}
              >
                <Picker.Item label="Check-up" value="checkup" />
                <Picker.Item label="Follow-up" value="follow-up" />
                <Picker.Item label="Urgent" value="urgent" />
                <Picker.Item label="Consultation" value="consultation" />
                <Picker.Item label="Procedure" value="procedure" />
              </Picker>
            </View>

            {/* Reason */}
            <Input
              label="Reason"
              value={newAppointment.reason}
              onChangeText={(text) => setNewAppointment({ ...newAppointment, reason: text })}
              placeholder="Chief complaint or reason for visit"
              multiline
              numberOfLines={2}
            />

            {/* Notes */}
            <Input
              label="Notes"
              value={newAppointment.notes}
              onChangeText={(text) => setNewAppointment({ ...newAppointment, notes: text })}
              placeholder="Additional notes"
              multiline
              numberOfLines={3}
            />

            <Button
              title="Create Appointment"
              onPress={handleCreateAppointment}
              containerStyle={styles.createButton}
              buttonStyle={{ backgroundColor: appTheme.colors.primary }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: appTheme.spacing.sm,
    fontSize: 16,
    color: appTheme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: appTheme.spacing.lg,
  },
  backButton: {
    padding: appTheme.spacing.xs,
  },
  headerTitle: {
    marginBottom: 0,
    fontWeight: 'bold',
    color: appTheme.colors.white,
  },
  filterScroll: {
    backgroundColor: appTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.sm,
    borderRadius: 20,
    backgroundColor: appTheme.colors.background,
    marginRight: appTheme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: appTheme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: appTheme.colors.white,
  },
  listContainer: {
    flex: 1,
  },
  appointmentCard: {
    borderRadius: appTheme.borderRadius.lg,
    marginHorizontal: appTheme.spacing.lg,
    marginVertical: appTheme.spacing.sm,
    padding: appTheme.spacing.lg,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: appTheme.spacing.sm,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: appTheme.spacing.xs,
  },
  appointmentDateTime: {
    fontSize: 16,
    color: appTheme.colors.textSecondary,
    marginBottom: appTheme.spacing.xs,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: appTheme.spacing.xs,
  },
  appointmentDuration: {
    fontSize: 14,
    color: appTheme.colors.textSecondary,
    marginLeft: appTheme.spacing.xs,
  },
  appointmentType: {
    fontSize: 14,
    color: appTheme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  appointmentReason: {
    fontSize: 14,
    color: appTheme.colors.textPrimary,
    marginTop: appTheme.spacing.xs,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.xs,
    borderRadius: appTheme.borderRadius.lg,
    height: 32,
    justifyContent: 'center',
  },
  statusText: {
    color: appTheme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.xs,
    marginRight: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
    borderRadius: appTheme.borderRadius.md,
    backgroundColor: appTheme.colors.background,
  },
  actionButtonText: {
    fontSize: 13,
    marginLeft: appTheme.spacing.xs,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.textSecondary,
    marginTop: appTheme.spacing.lg,
    marginBottom: appTheme.spacing.xl,
  },
  emptyButton: {
    width: 200,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: appTheme.colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: appTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  modalContent: {
    flex: 1,
    padding: appTheme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appTheme.colors.textSecondary,
    marginLeft: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.borderRadius.md,
    marginHorizontal: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.md,
  },
  picker: {
    height: 50,
  },
  createButton: {
    marginTop: appTheme.spacing.lg,
    marginBottom: appTheme.spacing.xxl,
  },
});

export default AppointmentManagementScreen;
