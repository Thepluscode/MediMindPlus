import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Typography, LoadingSpinner } from '../components/ui';
import providerAPI, { Prescription, PatientSummary } from '../services/providerAPI';
import { theme } from '../theme/theme';

interface PrescriptionManagementScreenProps {
  navigation: any;
  route?: any;
}

const PrescriptionManagementScreen: React.FC<PrescriptionManagementScreenProps> = ({
  navigation,
  route,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [filter, setFilter] = useState<string>(route?.params?.filter || 'active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patients, setPatients] = useState<PatientSummary[]>([]);

  // Create prescription form state
  const [newPrescription, setNewPrescription] = useState<Prescription>({
    patientId: route?.params?.patientId || '',
    medication: '',
    dosage: '',
    frequency: '',
    route: 'oral',
    duration: '',
    quantity: 0,
    refills: 0,
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active',
  });

  useEffect(() => {
    loadPrescriptions();
    loadPatients();

    if (route?.params?.action === 'create') {
      setShowCreateModal(true);
    }
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, filter]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await providerAPI.getPrescriptions();
      setPrescriptions(data);
    } catch (error) {
      // Error loading prescriptions
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await providerAPI.getPatients();
      setPatients(data);
    } catch (error) {
      // Error loading patients
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrescriptions();
    setRefreshing(false);
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    if (filter === 'active') {
      filtered = filtered.filter((rx) => rx.status === 'active');
    } else if (filter === 'pending') {
      filtered = filtered.filter((rx) => rx.status === 'active' && !rx.filledDate);
    } else if (filter === 'completed') {
      filtered = filtered.filter((rx) => rx.status === 'completed');
    } else if (filter === 'cancelled') {
      filtered = filtered.filter((rx) => rx.status === 'cancelled');
    }

    // Sort by prescribedDate (most recent first)
    filtered.sort((a, b) => {
      const dateA = a.prescribedDate ? new Date(a.prescribedDate).getTime() : 0;
      const dateB = b.prescribedDate ? new Date(b.prescribedDate).getTime() : 0;
      return dateB - dateA;
    });

    setFilteredPrescriptions(filtered);
  };

  const handleCreatePrescription = async () => {
    try {
      if (!newPrescription.patientId) {
        Alert.alert('Error', 'Please select a patient');
        return;
      }
      if (!newPrescription.medication) {
        Alert.alert('Error', 'Medication name is required');
        return;
      }
      if (!newPrescription.dosage) {
        Alert.alert('Error', 'Dosage is required');
        return;
      }
      if (!newPrescription.frequency) {
        Alert.alert('Error', 'Frequency is required');
        return;
      }

      await providerAPI.createPrescription(newPrescription);
      Alert.alert('Success', 'Prescription created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadPrescriptions();
    } catch (error) {
      // Error creating prescription
      Alert.alert('Error', 'Failed to create prescription');
    }
  };

  const handleUpdateStatus = async (prescriptionId: string, status: string) => {
    try {
      await providerAPI.updatePrescription(prescriptionId, { status: status as any });
      Alert.alert('Success', 'Prescription status updated');
      await loadPrescriptions();
    } catch (error) {
      // Error updating prescription
      Alert.alert('Error', 'Failed to update prescription');
    }
  };

  const resetForm = () => {
    setNewPrescription({
      patientId: route?.params?.patientId || '',
      medication: '',
      dosage: '',
      frequency: '',
      route: 'oral',
      duration: '',
      quantity: 0,
      refills: 0,
      instructions: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#9E9E9E';
      case 'cancelled':
        return '#F44336';
      case 'expired':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LoadingSpinner size="large" />
        <Typography variant="body" style={styles.loadingText}>Loading prescriptions...</Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.gradientHeader}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Return to previous screen"
          >
            <Ionicons
              name="arrow-back"
              color="white"
              size={28}
              importantForAccessibility="no"
              accessible={false}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Create new prescription"
            accessibilityHint="Open form to write a new prescription"
          >
            <Ionicons
              name="add-circle"
              color="white"
              size={28}
              importantForAccessibility="no"
              accessible={false}
            />
          </TouchableOpacity>
        </View>
        <View
          style={styles.iconContainer}
          importantForAccessibility="no"
          accessible={false}
        >
          <Ionicons
            name="medical"
            color="white"
            size={60}
            importantForAccessibility="no"
            accessible={false}
          />
        </View>
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>Prescriptions</Typography>
        <Typography variant="body" style={styles.headerSubtitle}>Manage patient prescriptions</Typography>
      </LinearGradient>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
        accessibilityLabel="Prescription filters"
        accessibilityRole="scrollview"
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
          onPress={() => setFilter('active')}
          accessibilityRole="button"
          accessibilityLabel="Filter active prescriptions"
          accessibilityHint="Show only active prescriptions"
          accessibilityState={{ selected: filter === 'active' }}
        >
          <Typography variant="body" style={[styles.filterChipText, filter === 'active' && styles.filterChipTextActive]}>
            Active
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
          onPress={() => setFilter('pending')}
          accessibilityRole="button"
          accessibilityLabel="Filter pending prescriptions"
          accessibilityHint="Show unfilled prescriptions"
          accessibilityState={{ selected: filter === 'pending' }}
        >
          <Typography variant="body" style={[styles.filterChipText, filter === 'pending' && styles.filterChipTextActive]}>
            Pending
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'completed' && styles.filterChipActive]}
          onPress={() => setFilter('completed')}
          accessibilityRole="button"
          accessibilityLabel="Filter completed prescriptions"
          accessibilityHint="Show completed prescriptions"
          accessibilityState={{ selected: filter === 'completed' }}
        >
          <Typography variant="body" style={[styles.filterChipText, filter === 'completed' && styles.filterChipTextActive]}>
            Completed
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'cancelled' && styles.filterChipActive]}
          onPress={() => setFilter('cancelled')}
          accessibilityRole="button"
          accessibilityLabel="Filter cancelled prescriptions"
          accessibilityHint="Show cancelled prescriptions"
          accessibilityState={{ selected: filter === 'cancelled' }}
        >
          <Typography variant="body" style={[styles.filterChipText, filter === 'cancelled' && styles.filterChipTextActive]}>
            Cancelled
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      {/* Prescription List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        accessibilityLabel="Prescriptions list"
        accessibilityRole="scrollview"
      >
        {filteredPrescriptions.length > 0 ? (
          filteredPrescriptions.map((prescription) => (
            <View key={prescription.id} style={styles.prescriptionCard}>
              <View style={styles.prescriptionContent}>
                <View style={styles.prescriptionHeader}>
                  <View style={styles.prescriptionInfo}>
                    <View style={styles.medicationRow}>
                      <Ionicons
                        name="medical"
                        size={24}
                        color={theme.colors.primary}
                        importantForAccessibility="no"
                        accessible={false}
                      />
                      <Typography variant="body" style={styles.medicationName}>{prescription.medication}</Typography>
                    </View>

                    <Typography variant="body" style={styles.patientName}>{prescription.patientName}</Typography>

                    <View style={styles.prescriptionDetails}>
                      <Typography variant="body" style={styles.detailText}>
                        <Typography variant="body" style={styles.detailLabel}>Dosage: </Typography>
                        {prescription.dosage}
                      </Typography>
                      <Typography variant="body" style={styles.detailText}>
                        <Typography variant="body" style={styles.detailLabel}>Frequency: </Typography>
                        {prescription.frequency}
                      </Typography>
                      <Typography variant="body" style={styles.detailText}>
                        <Typography variant="body" style={styles.detailLabel}>Route: </Typography>
                        {prescription.route}
                      </Typography>
                      <Typography variant="body" style={styles.detailText}>
                        <Typography variant="body" style={styles.detailLabel}>Duration: </Typography>
                        {prescription.duration}
                      </Typography>
                      <Typography variant="body" style={styles.detailText}>
                        <Typography variant="body" style={styles.detailLabel}>Quantity: </Typography>
                        {prescription.quantity} • {prescription.refills} refills
                      </Typography>
                      <Typography variant="body" style={styles.detailText}>
                        <Typography variant="body" style={styles.detailLabel}>Start Date: </Typography>
                        {new Date(prescription.startDate).toLocaleDateString()}
                      </Typography>
                    </View>

                    {prescription.instructions && (
                      <View style={styles.instructionsBox}>
                        <Typography variant="body" style={styles.instructionsLabel}>Instructions:</Typography>
                        <Typography variant="body" style={styles.instructionsText}>{prescription.instructions}</Typography>
                      </View>
                    )}

                    {prescription.filledDate && (
                      <Typography variant="body" style={styles.filledText}>
                        ✓ Filled on {new Date(prescription.filledDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
                    <Typography variant="body" style={styles.statusText}>{prescription.status}</Typography>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('PatientDetails', { patientId: prescription.patientId })}
                    accessibilityRole="button"
                    accessibilityLabel="View patient details"
                    accessibilityHint="Navigate to patient medical records and profile"
                  >
                    <Ionicons
                      name="person"
                      size={18}
                      color={theme.colors.primary}
                      importantForAccessibility="no"
                      accessible={false}
                    />
                    <Typography variant="body" style={styles.actionButtonText}>View Patient</Typography>
                  </TouchableOpacity>

                  {prescription.status === 'active' && !prescription.filledDate && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        handleUpdateStatus(prescription.id!, 'active')
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Mark prescription as filled"
                      accessibilityHint="Update status to indicate pharmacy has filled this prescription"
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#4CAF50"
                        importantForAccessibility="no"
                        accessible={false}
                      />
                      <Typography variant="body" style={styles.actionButtonText}>Mark Filled</Typography>
                    </TouchableOpacity>
                  )}

                  {prescription.status === 'active' && (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleUpdateStatus(prescription.id!, 'completed')}
                        accessibilityRole="button"
                        accessibilityLabel="Mark prescription as completed"
                        accessibilityHint="Mark this prescription as fully completed"
                      >
                        <Ionicons
                          name="checkmark-done"
                          size={18}
                          color="#4CAF50"
                          importantForAccessibility="no"
                          accessible={false}
                        />
                        <Typography variant="body" style={styles.actionButtonText}>Complete</Typography>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleUpdateStatus(prescription.id!, 'cancelled')}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel prescription"
                        accessibilityHint="Cancel this prescription"
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#F44336"
                          importantForAccessibility="no"
                          accessible={false}
                        />
                        <Typography variant="body" style={styles.actionButtonText}>Cancel</Typography>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="medical"
              size={64}
              color="#CCC"
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="body" style={styles.emptyText}>No prescriptions found</Typography>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Write new prescription"
              accessibilityHint="Open form to create a new prescription"
            >
              <LinearGradient
                colors={theme.gradients.primary.colors}
                style={styles.emptyButton}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <Typography variant="body" weight="semibold" style={{ color: 'white' }}>Write Prescription</Typography>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Prescription Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
        accessibilityLabel="Create prescription form"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Typography variant="h4" weight="bold">Write Prescription</Typography>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              accessibilityHint="Close prescription form and return to list"
            >
              <Ionicons
                name="close"
                size={28}
                importantForAccessibility="no"
                accessible={false}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            accessibilityLabel="Prescription form fields"
            accessibilityRole="scrollview"
          >
            {/* Patient Selection */}
            {!route?.params?.patientId && (
              <>
                <Typography variant="body" style={styles.inputLabel}>Patient *</Typography>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newPrescription.patientId}
                    onValueChange={(value) => setNewPrescription({ ...newPrescription, patientId: value })}
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
              </>
            )}

            {/* Medication */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>Medication *</Typography>
            <TextInput
              style={styles.input}
              value={newPrescription.medication}
              onChangeText={(text) => setNewPrescription({ ...newPrescription, medication: text })}
              placeholder="e.g., Lisinopril"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Dosage */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>Dosage *</Typography>
            <TextInput
              style={styles.input}
              value={newPrescription.dosage}
              onChangeText={(text) => setNewPrescription({ ...newPrescription, dosage: text })}
              placeholder="e.g., 10mg"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Frequency */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>Frequency *</Typography>
            <TextInput
              style={styles.input}
              value={newPrescription.frequency}
              onChangeText={(text) => setNewPrescription({ ...newPrescription, frequency: text })}
              placeholder="e.g., Once daily"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Route */}
            <Typography variant="body" style={styles.inputLabel}>Route of Administration</Typography>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newPrescription.route}
                onValueChange={(value) => setNewPrescription({ ...newPrescription, route: value as any })}
                style={styles.picker}
              >
                <Picker.Item label="Oral" value="oral" />
                <Picker.Item label="Topical" value="topical" />
                <Picker.Item label="Injection" value="injection" />
                <Picker.Item label="Inhalation" value="inhalation" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>

            {/* Duration */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>Duration</Typography>
            <TextInput
              style={styles.input}
              value={newPrescription.duration}
              onChangeText={(text) => setNewPrescription({ ...newPrescription, duration: text })}
              placeholder="e.g., 30 days"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Quantity */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>Quantity</Typography>
            <TextInput
              style={styles.input}
              value={newPrescription.quantity.toString()}
              onChangeText={(text) =>
                setNewPrescription({ ...newPrescription, quantity: parseInt(text) || 0 })
              }
              keyboardType="numeric"
              placeholder="e.g., 30"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Refills */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>Refills</Typography>
            <TextInput
              style={styles.input}
              value={newPrescription.refills.toString()}
              onChangeText={(text) =>
                setNewPrescription({ ...newPrescription, refills: parseInt(text) || 0 })
              }
              keyboardType="numeric"
              placeholder="e.g., 3"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Start Date */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>Start Date</Typography>
            <TextInput
              style={styles.input}
              value={newPrescription.startDate}
              onChangeText={(text) => setNewPrescription({ ...newPrescription, startDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Instructions */}
            <Typography variant="body" weight="semibold" style={styles.inputLabel}>Instructions</Typography>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newPrescription.instructions}
              onChangeText={(text) => setNewPrescription({ ...newPrescription, instructions: text })}
              placeholder="Special instructions for the patient"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleCreatePrescription}
              style={styles.createButton}
              accessibilityRole="button"
              accessibilityLabel="Create prescription"
              accessibilityHint="Submit form to create new prescription for patient"
            >
              <LinearGradient
                colors={theme.gradients.primary.colors}
                start={theme.gradients.primary.start}
                end={theme.gradients.primary.end}
                style={styles.createButtonGradient}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <Typography variant="body" weight="bold" style={styles.createButtonText}>
                  Create Prescription
                </Typography>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
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
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  gradientHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    marginRight: theme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  prescriptionCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  prescriptionContent: {
    flex: 1,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  prescriptionInfo: {
    flex: 1,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  medicationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  prescriptionDetails: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: 14,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  detailLabel: {
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  instructionsBox: {
    backgroundColor: '#E3F2FD',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: theme.spacing.xs,
  },
  instructionsText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  filledText: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    height: 32,
    justifyContent: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  actionButtonText: {
    fontSize: 13,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  createButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    color: 'white',
  },
});

export default PrescriptionManagementScreen;
