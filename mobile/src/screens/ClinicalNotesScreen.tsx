import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Icon, Button, Input } from 'react-native-elements';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';
import { Picker } from '@react-native-picker/picker';
import providerAPI, { ClinicalNote, PatientSummary } from '../services/providerAPI';

interface ClinicalNotesScreenProps {
  navigation: any;
  route?: any;
}

const ClinicalNotesScreen: React.FC<ClinicalNotesScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(route?.params?.patientId || '');

  // Create note form state
  const [newNote, setNewNote] = useState<ClinicalNote>({
    patientId: route?.params?.patientId || '',
    noteType: 'progress',
    chiefComplaint: '',
    presentIllness: '',
    assessment: '',
    plan: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: undefined,
      temperature: undefined,
      respiratoryRate: undefined,
      oxygenSaturation: undefined,
      weight: undefined,
      height: undefined,
    },
    diagnosis: [],
    prescriptions: [],
    labOrders: [],
    referrals: [],
    followUpDate: '',
  });

  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [prescriptionInput, setPrescriptionInput] = useState('');
  const [labOrderInput, setLabOrderInput] = useState('');
  const [referralInput, setReferralInput] = useState('');

  useEffect(() => {
    loadPatients();
    if (route?.params?.action === 'create') {
      setShowCreateModal(true);
    }
    if (route?.params?.patientId) {
      loadPatientNotes(route.params.patientId);
    }
  }, []);

  const loadPatients = async () => {
    try {
      const data = await providerAPI.getPatients();
      setPatients(data);
    } catch (error) {
      // Silent fail - patients list is optional
    }
  };

  const loadPatientNotes = async (patientId: string) => {
    try {
      setLoading(true);
      const data = await providerAPI.getPatientNotes(patientId);
      setNotes(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load clinical notes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (selectedPatientId) {
      setRefreshing(true);
      await loadPatientNotes(selectedPatientId);
      setRefreshing(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      if (!newNote.patientId) {
        Alert.alert('Error', 'Please select a patient');
        return;
      }
      if (!newNote.assessment) {
        Alert.alert('Error', 'Assessment is required');
        return;
      }
      if (!newNote.plan) {
        Alert.alert('Error', 'Plan is required');
        return;
      }

      await providerAPI.createClinicalNote(newNote);
      Alert.alert('Success', 'Clinical note created successfully!');
      setShowCreateModal(false);
      resetForm();
      if (selectedPatientId) {
        await loadPatientNotes(selectedPatientId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create clinical note');
    }
  };

  const resetForm = () => {
    setNewNote({
      patientId: route?.params?.patientId || '',
      noteType: 'progress',
      chiefComplaint: '',
      presentIllness: '',
      assessment: '',
      plan: '',
      vitalSigns: {
        bloodPressure: '',
        heartRate: undefined,
        temperature: undefined,
        respiratoryRate: undefined,
        oxygenSaturation: undefined,
        weight: undefined,
        height: undefined,
      },
      diagnosis: [],
      prescriptions: [],
      labOrders: [],
      referrals: [],
      followUpDate: '',
    });
    setDiagnosisInput('');
    setPrescriptionInput('');
    setLabOrderInput('');
    setReferralInput('');
  };

  const addDiagnosis = () => {
    if (diagnosisInput.trim()) {
      setNewNote({
        ...newNote,
        diagnosis: [...(newNote.diagnosis || []), diagnosisInput.trim()],
      });
      setDiagnosisInput('');
    }
  };

  const removeDiagnosis = (index: number) => {
    const updated = [...(newNote.diagnosis || [])];
    updated.splice(index, 1);
    setNewNote({ ...newNote, diagnosis: updated });
  };

  const addPrescription = () => {
    if (prescriptionInput.trim()) {
      setNewNote({
        ...newNote,
        prescriptions: [...(newNote.prescriptions || []), prescriptionInput.trim()],
      });
      setPrescriptionInput('');
    }
  };

  const removePrescription = (index: number) => {
    const updated = [...(newNote.prescriptions || [])];
    updated.splice(index, 1);
    setNewNote({ ...newNote, prescriptions: updated });
  };

  const addLabOrder = () => {
    if (labOrderInput.trim()) {
      setNewNote({
        ...newNote,
        labOrders: [...(newNote.labOrders || []), labOrderInput.trim()],
      });
      setLabOrderInput('');
    }
  };

  const removeLabOrder = (index: number) => {
    const updated = [...(newNote.labOrders || [])];
    updated.splice(index, 1);
    setNewNote({ ...newNote, labOrders: updated });
  };

  const addReferral = () => {
    if (referralInput.trim()) {
      setNewNote({
        ...newNote,
        referrals: [...(newNote.referrals || []), referralInput.trim()],
      });
      setReferralInput('');
    }
  };

  const removeReferral = (index: number) => {
    const updated = [...(newNote.referrals || [])];
    updated.splice(index, 1);
    setNewNote({ ...newNote, referrals: updated });
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
        <Typography variant="h3" weight="bold" style={styles.headerTitle}>
          Clinical Notes
        </Typography>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Create new clinical note"
          accessibilityHint="Tap to open form for creating a new clinical note"
        >
          <Icon name="note-add" type="material" color={theme.colors.primary} size={28} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
      </View>

      {/* Patient Selection */}
      {!route?.params?.patientId && (
        <View style={styles.patientSelector}>
          <Typography variant="body" weight="semibold" style={styles.selectorLabel}>
            Select Patient:
          </Typography>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedPatientId}
              onValueChange={(value) => {
                setSelectedPatientId(value);
                if (value) loadPatientNotes(value);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Choose a patient..." value="" />
              {patients.map((patient) => (
                <Picker.Item
                  key={patient.id}
                  label={`${patient.firstName} ${patient.lastName}`}
                  value={patient.id}
                />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Notes List */}
      {loading ? (
        <LoadingSpinner
          fullScreen
          size="large"
          text="Loading notes..."
          color={theme.colors.primary}
        />
      ) : (
        <ScrollView
          style={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          accessibilityLabel="Clinical notes list"
          accessibilityRole="scrollview"
        >
          {notes.length > 0 ? (
            notes.map((note, index) => (
              <Card key={index} elevated elevation="sm" padding="md" style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteTypeContainer}>
                    <Icon name="note" type="material" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
                    <Typography variant="body" weight="bold" style={styles.noteType}>
                      {note.noteType}
                    </Typography>
                  </View>
                  <Typography variant="body" color="secondary" style={styles.noteDate}>
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

                {note.presentIllness && (
                  <View style={styles.noteSection}>
                    <Typography variant="body" weight="semibold" style={styles.noteSectionTitle}>
                      Present Illness:
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.noteSectionText}>
                      {note.presentIllness}
                    </Typography>
                  </View>
                )}

                {note.vitalSigns && (
                  <View style={styles.noteSection}>
                    <Typography variant="body" weight="semibold" style={styles.noteSectionTitle}>
                      Vital Signs:
                    </Typography>
                    <View style={styles.vitalSignsGrid}>
                      {note.vitalSigns.bloodPressure && (
                        <Typography variant="body" color="secondary" style={styles.vitalText}>
                          BP: {note.vitalSigns.bloodPressure}
                        </Typography>
                      )}
                      {note.vitalSigns.heartRate && (
                        <Typography variant="body" color="secondary" style={styles.vitalText}>
                          HR: {note.vitalSigns.heartRate} bpm
                        </Typography>
                      )}
                      {note.vitalSigns.temperature && (
                        <Typography variant="body" color="secondary" style={styles.vitalText}>
                          Temp: {note.vitalSigns.temperature}°F
                        </Typography>
                      )}
                    </View>
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

                {note.diagnosis && note.diagnosis.length > 0 && (
                  <View style={styles.noteSection}>
                    <Typography variant="body" weight="semibold" style={styles.noteSectionTitle}>
                      Diagnosis:
                    </Typography>
                    {note.diagnosis.map((dx, i) => (
                      <Typography key={i} variant="body" color="secondary" style={styles.listItemText}>
                        • {dx}
                      </Typography>
                    ))}
                  </View>
                )}

                {note.followUpDate && (
                  <View style={styles.followUpBadge}>
                    <Icon name="event" type="material" size={16} color={theme.colors.info} importantForAccessibility="no" accessible={false} />
                    <Typography variant="body" weight="semibold" style={styles.followUpText}>
                      Follow-up: {new Date(note.followUpDate).toLocaleDateString()}
                    </Typography>
                  </View>
                )}
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="note" type="material" size={64} color={theme.colors.border} importantForAccessibility="no" accessible={false} />
              <Typography variant="h4" weight="semibold" color="secondary" style={styles.emptyText}>
                {selectedPatientId ? 'No clinical notes recorded' : 'Select a patient to view notes'}
              </Typography>
              {selectedPatientId && (
                <Button
                  title="Create First Note"
                  onPress={() => setShowCreateModal(true)}
                  containerStyle={styles.emptyButton}
                />
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Note Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Typography variant="h4" weight="bold">Create Clinical Note</Typography>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Icon name="close" type="material" size={28} importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} accessibilityLabel="Create note form" accessibilityRole="scrollview">
            {/* Patient Selection */}
            {!route?.params?.patientId && (
              <>
                <Typography variant="body" weight="bold" style={styles.inputLabel}>
                  Patient *
                </Typography>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newNote.patientId}
                    onValueChange={(value) => setNewNote({ ...newNote, patientId: value })}
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

            {/* Note Type */}
            <Typography variant="body" weight="bold" style={styles.inputLabel}>
              Note Type
            </Typography>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newNote.noteType}
                onValueChange={(value) => setNewNote({ ...newNote, noteType: value as any })}
                style={styles.picker}
              >
                <Picker.Item label="Progress Note" value="progress" />
                <Picker.Item label="Consultation" value="consultation" />
                <Picker.Item label="Procedure Note" value="procedure" />
                <Picker.Item label="Diagnosis" value="diagnosis" />
                <Picker.Item label="Treatment Plan" value="treatment-plan" />
                <Picker.Item label="Follow-up" value="follow-up" />
              </Picker>
            </View>

            {/* Chief Complaint */}
            <Input
              label="Chief Complaint"
              value={newNote.chiefComplaint}
              onChangeText={(text) => setNewNote({ ...newNote, chiefComplaint: text })}
              placeholder="Patient's main concern or reason for visit"
              multiline
              numberOfLines={2}
            />

            {/* Present Illness */}
            <Input
              label="History of Present Illness"
              value={newNote.presentIllness}
              onChangeText={(text) => setNewNote({ ...newNote, presentIllness: text })}
              placeholder="Detailed history of current symptoms"
              multiline
              numberOfLines={3}
            />

            {/* Vital Signs */}
            <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
              Vital Signs
            </Typography>
            <Input
              label="Blood Pressure"
              value={newNote.vitalSigns?.bloodPressure}
              onChangeText={(text) =>
                setNewNote({
                  ...newNote,
                  vitalSigns: { ...newNote.vitalSigns, bloodPressure: text },
                })
              }
              placeholder="120/80"
            />
            <Input
              label="Heart Rate (bpm)"
              value={newNote.vitalSigns?.heartRate?.toString()}
              onChangeText={(text) =>
                setNewNote({
                  ...newNote,
                  vitalSigns: { ...newNote.vitalSigns, heartRate: text ? parseFloat(text) : undefined },
                })
              }
              keyboardType="numeric"
              placeholder="72"
            />
            <Input
              label="Temperature (°F)"
              value={newNote.vitalSigns?.temperature?.toString()}
              onChangeText={(text) =>
                setNewNote({
                  ...newNote,
                  vitalSigns: { ...newNote.vitalSigns, temperature: text ? parseFloat(text) : undefined },
                })
              }
              keyboardType="numeric"
              placeholder="98.6"
            />

            {/* Assessment */}
            <Input
              label="Assessment *"
              value={newNote.assessment}
              onChangeText={(text) => setNewNote({ ...newNote, assessment: text })}
              placeholder="Clinical assessment and findings"
              multiline
              numberOfLines={4}
            />

            {/* Plan */}
            <Input
              label="Plan *"
              value={newNote.plan}
              onChangeText={(text) => setNewNote({ ...newNote, plan: text })}
              placeholder="Treatment plan and next steps"
              multiline
              numberOfLines={4}
            />

            {/* Diagnosis */}
            <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
              Diagnosis
            </Typography>
            <View style={styles.addItemContainer}>
              <Input
                value={diagnosisInput}
                onChangeText={setDiagnosisInput}
                placeholder="Add diagnosis"
                containerStyle={{ flex: 1 }}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addDiagnosis}
                accessibilityRole="button"
                accessibilityLabel="Add diagnosis"
                accessibilityHint="Add diagnosis to the note"
              >
                <Icon name="add" type="material" color="#FFFFFF" importantForAccessibility="no" accessible={false} />
              </TouchableOpacity>
            </View>
            {newNote.diagnosis && newNote.diagnosis.length > 0 && (
              <View style={styles.itemsList}>
                {newNote.diagnosis.map((item, index) => (
                  <View key={index} style={styles.itemChip}>
                    <Typography variant="body" style={styles.itemChipText}>
                      {item}
                    </Typography>
                    <TouchableOpacity onPress={() => removeDiagnosis(index)} accessibilityRole="button" accessibilityLabel={`Remove ${item}`} accessibilityHint="Remove this diagnosis from the note">
                      <Icon name="close" type="material" size={18} color="#666" importantForAccessibility="no" accessible={false} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Prescriptions */}
            <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
              Prescriptions
            </Typography>
            <View style={styles.addItemContainer}>
              <Input
                value={prescriptionInput}
                onChangeText={setPrescriptionInput}
                placeholder="Add prescription"
                containerStyle={{ flex: 1 }}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addPrescription}
                accessibilityRole="button"
                accessibilityLabel="Add prescription"
                accessibilityHint="Add prescription to the note"
              >
                <Icon name="add" type="material" color="#FFFFFF" importantForAccessibility="no" accessible={false} />
              </TouchableOpacity>
            </View>
            {newNote.prescriptions && newNote.prescriptions.length > 0 && (
              <View style={styles.itemsList}>
                {newNote.prescriptions.map((item, index) => (
                  <View key={index} style={styles.itemChip}>
                    <Typography variant="body" style={styles.itemChipText}>
                      {item}
                    </Typography>
                    <TouchableOpacity onPress={() => removePrescription(index)} accessibilityRole="button" accessibilityLabel={`Remove ${item}`} accessibilityHint="Remove this prescription from the note">
                      <Icon name="close" type="material" size={18} color="#666" importantForAccessibility="no" accessible={false} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Lab Orders */}
            <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
              Lab Orders
            </Typography>
            <View style={styles.addItemContainer}>
              <Input
                value={labOrderInput}
                onChangeText={setLabOrderInput}
                placeholder="Add lab order"
                containerStyle={{ flex: 1 }}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addLabOrder}
                accessibilityRole="button"
                accessibilityLabel="Add lab order"
                accessibilityHint="Add lab order to the note"
              >
                <Icon name="add" type="material" color="#FFFFFF" importantForAccessibility="no" accessible={false} />
              </TouchableOpacity>
            </View>
            {newNote.labOrders && newNote.labOrders.length > 0 && (
              <View style={styles.itemsList}>
                {newNote.labOrders.map((item, index) => (
                  <View key={index} style={styles.itemChip}>
                    <Typography variant="body" style={styles.itemChipText}>
                      {item}
                    </Typography>
                    <TouchableOpacity onPress={() => removeLabOrder(index)} accessibilityRole="button" accessibilityLabel={`Remove ${item}`} accessibilityHint="Remove this lab order from the note">
                      <Icon name="close" type="material" size={18} color="#666" importantForAccessibility="no" accessible={false} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Referrals */}
            <Typography variant="h4" weight="bold" style={styles.sectionTitle}>
              Referrals
            </Typography>
            <View style={styles.addItemContainer}>
              <Input
                value={referralInput}
                onChangeText={setReferralInput}
                placeholder="Add referral"
                containerStyle={{ flex: 1 }}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addReferral}
                accessibilityRole="button"
                accessibilityLabel="Add referral"
                accessibilityHint="Add referral to the note"
              >
                <Icon name="add" type="material" color="#FFFFFF" importantForAccessibility="no" accessible={false} />
              </TouchableOpacity>
            </View>
            {newNote.referrals && newNote.referrals.length > 0 && (
              <View style={styles.itemsList}>
                {newNote.referrals.map((item, index) => (
                  <View key={index} style={styles.itemChip}>
                    <Typography variant="body" style={styles.itemChipText}>
                      {item}
                    </Typography>
                    <TouchableOpacity onPress={() => removeReferral(index)} accessibilityRole="button" accessibilityLabel={`Remove ${item}`} accessibilityHint="Remove this referral from the note">
                      <Icon name="close" type="material" size={18} color="#666" importantForAccessibility="no" accessible={false} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Follow-up Date */}
            <Input
              label="Follow-up Date"
              value={newNote.followUpDate}
              onChangeText={(text) => setNewNote({ ...newNote, followUpDate: text })}
              placeholder="YYYY-MM-DD"
              leftIcon={<Icon name="event" type="material" size={20} importantForAccessibility="no" accessible={false} />}
            />

            <Button
              title="Create Clinical Note"
              onPress={handleCreateNote}
              containerStyle={styles.createButton}
              buttonStyle={{ backgroundColor: theme.colors.primary }}
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
    backgroundColor: theme.colors.background,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    marginBottom: 0,
    fontWeight: 'bold',
  },
  patientSelector: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  picker: {
    height: 50,
  },
  listContainer: {
    flex: 1,
  },
  noteCard: {
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
    textTransform: 'capitalize',
  },
  noteDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  noteSection: {
    marginBottom: theme.spacing.lg,
  },
  noteSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  noteSectionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  vitalSignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vitalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  listItemText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  followUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.infoLight,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  followUpText: {
    fontSize: 14,
    color: theme.colors.info,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyButton: {
    width: 200,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
    marginLeft: theme.spacing.sm,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.infoLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  itemChipText: {
    fontSize: 14,
    color: theme.colors.info,
    marginRight: theme.spacing.xs,
  },
  createButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});

export default ClinicalNotesScreen;
