/**
 * Medical History Collection Screen
 * Comprehensive medical history form with backend integration
 *
 * Backend endpoints:
 * - PUT /api/onboarding/medical-history
 * - PUT /api/onboarding/profile (for basic health metrics)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button, CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';
import onboardingAPI, { MedicalHistoryData } from '../services/onboardingAPI';

type MedicalHistoryScreenProps = {
  navigation: any;
};

const MedicalHistoryScreen: React.FC<MedicalHistoryScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Medical History State
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryData>({
    conditions: [],
    allergies: [],
    medications: [],
    surgeries: [],
    familyHistory: [],
  });

  // Form inputs for adding new items
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newSurgery, setNewSurgery] = useState({ name: '', date: '', notes: '' });
  const [newFamilyHistory, setNewFamilyHistory] = useState({ condition: '', relationship: '', notes: '' });

  // Common conditions for quick selection
  const commonConditions = [
    'Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'Depression',
    'Anxiety', 'High Cholesterol', 'Heart Disease', 'Obesity', 'Migraines'
  ];

  const commonAllergies = [
    'Penicillin', 'Peanuts', 'Shellfish', 'Latex', 'Pollen',
    'Dust', 'Pet Dander', 'Eggs', 'Milk', 'Soy'
  ];

  useEffect(() => {
    // Load existing medical history if available
    loadMedicalHistory();
  }, []);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      // In a real app, we'd have a GET endpoint for medical history
      // For now, we'll start with an empty form
    } catch (error) {
      // Error loading medical history
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onboardingAPI.saveMedicalHistory(medicalHistory);
      Alert.alert('Success', 'Medical history saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save medical history. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addCondition = (condition: string) => {
    if (condition && !medicalHistory.conditions?.includes(condition)) {
      setMedicalHistory({
        ...medicalHistory,
        conditions: [...(medicalHistory.conditions || []), condition],
      });
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setMedicalHistory({
      ...medicalHistory,
      conditions: medicalHistory.conditions?.filter(c => c !== condition),
    });
  };

  const addAllergy = (allergy: string) => {
    if (allergy && !medicalHistory.allergies?.includes(allergy)) {
      setMedicalHistory({
        ...medicalHistory,
        allergies: [...(medicalHistory.allergies || []), allergy],
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setMedicalHistory({
      ...medicalHistory,
      allergies: medicalHistory.allergies?.filter(a => a !== allergy),
    });
  };

  const addMedication = (medication: string) => {
    if (medication && !medicalHistory.medications?.includes(medication)) {
      setMedicalHistory({
        ...medicalHistory,
        medications: [...(medicalHistory.medications || []), medication],
      });
      setNewMedication('');
    }
  };

  const removeMedication = (medication: string) => {
    setMedicalHistory({
      ...medicalHistory,
      medications: medicalHistory.medications?.filter(m => m !== medication),
    });
  };

  const addSurgery = () => {
    if (newSurgery.name && newSurgery.date) {
      setMedicalHistory({
        ...medicalHistory,
        surgeries: [...(medicalHistory.surgeries || []), newSurgery],
      });
      setNewSurgery({ name: '', date: '', notes: '' });
    }
  };

  const removeSurgery = (index: number) => {
    setMedicalHistory({
      ...medicalHistory,
      surgeries: medicalHistory.surgeries?.filter((_, i) => i !== index),
    });
  };

  const addFamilyHistory = () => {
    if (newFamilyHistory.condition && newFamilyHistory.relationship) {
      setMedicalHistory({
        ...medicalHistory,
        familyHistory: [...(medicalHistory.familyHistory || []), newFamilyHistory],
      });
      setNewFamilyHistory({ condition: '', relationship: '', notes: '' });
    }
  };

  const removeFamilyHistory = (index: number) => {
    setMedicalHistory({
      ...medicalHistory,
      familyHistory: medicalHistory.familyHistory?.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading medical history..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Icon name="arrow-back" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold" style={styles.headerTitle}>
          Medical History
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} accessibilityLabel="Medical history form" accessibilityRole="scrollview">
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="info" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
          <Typography variant="body" color="primary" style={styles.infoBannerText}>
            This information helps our AI provide personalized health insights and risk predictions.
          </Typography>
        </View>

        {/* Medical Conditions */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
            Medical Conditions
          </Typography>
          <Typography variant="body" color="secondary" style={styles.sectionSubtitle}>
            Current or past health conditions
          </Typography>

          {/* Quick Select Common Conditions */}
          <View style={styles.chipContainer}>
            {commonConditions.map((condition, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.chip,
                  medicalHistory.conditions?.includes(condition) && styles.chipSelected
                ]}
                onPress={() => {
                  if (medicalHistory.conditions?.includes(condition)) {
                    removeCondition(condition);
                  } else {
                    addCondition(condition);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`${condition} ${medicalHistory.conditions?.includes(condition) ? 'selected' : 'not selected'}`}
                accessibilityHint={medicalHistory.conditions?.includes(condition) ? 'Tap to deselect this condition' : 'Tap to add this condition to your medical history'}
                accessibilityState={{ selected: medicalHistory.conditions?.includes(condition) }}
              >
                <Typography
                  variant="body"
                  style={[
                    styles.chipText,
                    medicalHistory.conditions?.includes(condition) && styles.chipTextSelected
                  ]}
                >
                  {condition}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Condition Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add other condition..."
              value={newCondition}
              onChangeText={setNewCondition}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addCondition(newCondition)}
              accessibilityRole="button"
              accessibilityLabel="Add custom medical condition"
              accessibilityHint="Add the entered condition to your medical history"
            >
              <Icon name="add" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          </View>

          {/* Selected Conditions */}
          {medicalHistory.conditions && medicalHistory.conditions.length > 0 && (
            <View style={styles.selectedItems}>
              {medicalHistory.conditions.map((condition, idx) => (
                <View key={idx} style={styles.selectedItem}>
                  <Typography variant="body" style={styles.selectedItemText}>
                    {condition}
                  </Typography>
                  <TouchableOpacity
                    onPress={() => removeCondition(condition)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${condition}`}
                    accessibilityHint="Remove this condition from your medical history"
                  >
                    <Icon name="close" size={20} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Allergies */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
            Allergies
          </Typography>
          <Typography variant="body" color="secondary" style={styles.sectionSubtitle}>
            Drug, food, or environmental allergies
          </Typography>

          {/* Quick Select Common Allergies */}
          <View style={styles.chipContainer}>
            {commonAllergies.map((allergy, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.chip,
                  medicalHistory.allergies?.includes(allergy) && styles.chipSelected
                ]}
                onPress={() => {
                  if (medicalHistory.allergies?.includes(allergy)) {
                    removeAllergy(allergy);
                  } else {
                    addAllergy(allergy);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`${allergy} allergy ${medicalHistory.allergies?.includes(allergy) ? 'selected' : 'not selected'}`}
                accessibilityHint={medicalHistory.allergies?.includes(allergy) ? 'Tap to deselect this allergy' : 'Tap to add this allergy to your medical history'}
                accessibilityState={{ selected: medicalHistory.allergies?.includes(allergy) }}
              >
                <Typography
                  variant="body"
                  style={[
                    styles.chipText,
                    medicalHistory.allergies?.includes(allergy) && styles.chipTextSelected
                  ]}
                >
                  {allergy}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Allergy Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add other allergy..."
              value={newAllergy}
              onChangeText={setNewAllergy}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addAllergy(newAllergy)}
              accessibilityRole="button"
              accessibilityLabel="Add custom allergy"
              accessibilityHint="Add the entered allergy to your medical history"
            >
              <Icon name="add" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          </View>

          {/* Selected Allergies */}
          {medicalHistory.allergies && medicalHistory.allergies.length > 0 && (
            <View style={styles.selectedItems}>
              {medicalHistory.allergies.map((allergy, idx) => (
                <View key={idx} style={styles.selectedItem}>
                  <Typography variant="body" style={styles.selectedItemText}>
                    {allergy}
                  </Typography>
                  <TouchableOpacity
                    onPress={() => removeAllergy(allergy)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${allergy}`}
                    accessibilityHint="Remove this allergy from your medical history"
                  >
                    <Icon name="close" size={20} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Current Medications */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
            Current Medications
          </Typography>
          <Typography variant="body" color="secondary" style={styles.sectionSubtitle}>
            List all medications you're currently taking
          </Typography>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Medication name and dosage..."
              value={newMedication}
              onChangeText={setNewMedication}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addMedication(newMedication)}
              accessibilityRole="button"
              accessibilityLabel="Add medication"
              accessibilityHint="Add the entered medication to your current medication list"
            >
              <Icon name="add" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
            </TouchableOpacity>
          </View>

          {medicalHistory.medications && medicalHistory.medications.length > 0 && (
            <View style={styles.selectedItems}>
              {medicalHistory.medications.map((medication, idx) => (
                <View key={idx} style={styles.selectedItem}>
                  <Typography variant="body" style={styles.selectedItemText}>
                    {medication}
                  </Typography>
                  <TouchableOpacity
                    onPress={() => removeMedication(medication)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${medication}`}
                    accessibilityHint="Remove this medication from your current medication list"
                  >
                    <Icon name="close" size={20} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Past Surgeries */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
            Past Surgeries
          </Typography>
          <Typography variant="body" color="secondary" style={styles.sectionSubtitle}>
            Any surgeries or major procedures
          </Typography>

          <TextInput
            style={styles.input}
            placeholder="Surgery name"
            value={newSurgery.name}
            onChangeText={(text) => setNewSurgery({ ...newSurgery, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={newSurgery.date}
            onChangeText={(text) => setNewSurgery({ ...newSurgery, date: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Notes (optional)"
            value={newSurgery.notes}
            onChangeText={(text) => setNewSurgery({ ...newSurgery, notes: text })}
            multiline
          />
          <Button
            title="Add Surgery"
            onPress={addSurgery}
            buttonStyle={styles.addSurgeryButton}
            disabled={!newSurgery.name || !newSurgery.date}
          />

          {medicalHistory.surgeries && medicalHistory.surgeries.length > 0 && (
            <View style={styles.surgeryList}>
              {medicalHistory.surgeries.map((surgery, idx) => (
                <View key={idx} style={styles.surgeryItem}>
                  <View style={styles.surgeryInfo}>
                    <Typography variant="body" weight="bold" style={styles.surgeryName}>
                      {surgery.name}
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.surgeryDate}>
                      {surgery.date}
                    </Typography>
                    {surgery.notes && (
                      <Typography variant="caption" color="secondary" style={styles.surgeryNotes}>
                        {surgery.notes}
                      </Typography>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeSurgery(idx)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${surgery.name} surgery`}
                    accessibilityHint="Remove this surgery from your medical history"
                  >
                    <Icon name="delete" size={24} color={theme.colors.error} importantForAccessibility="no" accessible={false} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Family History */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
            Family History
          </Typography>
          <Typography variant="body" color="secondary" style={styles.sectionSubtitle}>
            Health conditions in your family
          </Typography>

          <TextInput
            style={styles.input}
            placeholder="Condition"
            value={newFamilyHistory.condition}
            onChangeText={(text) => setNewFamilyHistory({ ...newFamilyHistory, condition: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Relationship (e.g., Father, Mother, Sibling)"
            value={newFamilyHistory.relationship}
            onChangeText={(text) => setNewFamilyHistory({ ...newFamilyHistory, relationship: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Notes (optional)"
            value={newFamilyHistory.notes}
            onChangeText={(text) => setNewFamilyHistory({ ...newFamilyHistory, notes: text })}
            multiline
          />
          <Button
            title="Add Family History"
            onPress={addFamilyHistory}
            buttonStyle={styles.addSurgeryButton}
            disabled={!newFamilyHistory.condition || !newFamilyHistory.relationship}
          />

          {medicalHistory.familyHistory && medicalHistory.familyHistory.length > 0 && (
            <View style={styles.surgeryList}>
              {medicalHistory.familyHistory.map((history, idx) => (
                <View key={idx} style={styles.surgeryItem}>
                  <View style={styles.surgeryInfo}>
                    <Typography variant="body" weight="bold" style={styles.surgeryName}>
                      {history.condition}
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.surgeryDate}>
                      {history.relationship}
                    </Typography>
                    {history.notes && (
                      <Typography variant="caption" color="secondary" style={styles.surgeryNotes}>
                        {history.notes}
                      </Typography>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFamilyHistory(idx)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${history.condition} family history`}
                    accessibilityHint="Remove this family history entry from your medical record"
                  >
                    <Icon name="delete" size={24} color={theme.colors.error} importantForAccessibility="no" accessible={false} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Button
          title={saving ? "Saving..." : "Save Medical History"}
          onPress={handleSave}
          disabled={saving}
          buttonStyle={styles.saveButton}
          titleStyle={styles.saveButtonText}
          icon={<Icon name="save" size={20} color="#fff" style={{ marginRight: 10 }} importantForAccessibility="no" accessible={false} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    paddingTop: 50,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    color: theme.colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  section: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: theme.spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {},
  chipTextSelected: {
    color: theme.colors.textInverse,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: 15,
    marginBottom: theme.spacing.sm,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectedItems: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  selectedItemText: {
    flex: 1,
  },
  addSurgeryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  surgeryList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  surgeryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#9b59b6',
  },
  surgeryInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  surgeryName: {
    marginBottom: theme.spacing.xs,
  },
  surgeryDate: {
    marginBottom: theme.spacing.xs,
  },
  surgeryNotes: {
    fontStyle: 'italic',
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MedicalHistoryScreen;
