import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Button, Spacing, Card } from '../components/ui';
import { theme } from '../theme/theme';

interface HealthMetric {
  id: string;
  name: string;
  icon: string;
  unit: string;
  category: 'vitals' | 'activity' | 'nutrition' | 'mental';
}

const healthMetrics: HealthMetric[] = [
  { id: 'weight', name: 'Weight', icon: 'monitor-weight', unit: 'kg', category: 'vitals' },
  { id: 'blood_pressure', name: 'Blood Pressure', icon: 'favorite', unit: 'mmHg', category: 'vitals' },
  { id: 'heart_rate', name: 'Heart Rate', icon: 'favorite-border', unit: 'bpm', category: 'vitals' },
  { id: 'blood_glucose', name: 'Blood Glucose', icon: 'opacity', unit: 'mg/dL', category: 'vitals' },
  { id: 'temperature', name: 'Temperature', icon: 'thermostat', unit: '°C', category: 'vitals' },
  { id: 'steps', name: 'Steps', icon: 'directions-walk', unit: 'steps', category: 'activity' },
  { id: 'exercise', name: 'Exercise Duration', icon: 'fitness-center', unit: 'min', category: 'activity' },
  { id: 'sleep', name: 'Sleep Duration', icon: 'bedtime', unit: 'hours', category: 'activity' },
  { id: 'water', name: 'Water Intake', icon: 'local-drink', unit: 'ml', category: 'nutrition' },
  { id: 'calories', name: 'Calories', icon: 'restaurant', unit: 'kcal', category: 'nutrition' },
  { id: 'mood', name: 'Mood Rating', icon: 'sentiment-satisfied', unit: '/10', category: 'mental' },
  { id: 'stress', name: 'Stress Level', icon: 'psychology', unit: '/10', category: 'mental' },
];

const LogHealthDataScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<'vitals' | 'activity' | 'nutrition' | 'mental'>('vitals');
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [value, setValue] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  const categories = [
    { id: 'vitals' as const, name: 'Vitals', icon: 'favorite' },
    { id: 'activity' as const, name: 'Activity', icon: 'directions-run' },
    { id: 'nutrition' as const, name: 'Nutrition', icon: 'restaurant' },
    { id: 'mental' as const, name: 'Mental', icon: 'psychology' },
  ];

  const filteredMetrics = healthMetrics.filter(m => m.category === selectedCategory);

  const handleSave = () => {
    if (!selectedMetric || (!value && selectedMetric.id !== 'blood_pressure')) {
      Alert.alert('Validation Error', 'Please select a metric and enter a value');
      return;
    }

    if (selectedMetric.id === 'blood_pressure' && (!systolic || !diastolic)) {
      Alert.alert('Validation Error', 'Please enter both systolic and diastolic values');
      return;
    }

    // TODO: Save to backend
    const dataToSave = {
      metric: selectedMetric.id,
      value: selectedMetric.id === 'blood_pressure' ? `${systolic}/${diastolic}` : value,
      date: date.toISOString(),
      notes,
    };

    // In production, this would call an API endpoint
    Alert.alert('Success', 'Health data saved successfully!');

    // Reset form
    setValue('');
    setSystolic('');
    setDiastolic('');
    setNotes('');
    setSelectedMetric(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Icon
            name="arrow-back"
            size={24}
            color={theme.colors.textPrimary}
            importantForAccessibility="no"
            accessible={false}
          />
        </TouchableOpacity>
        <Typography variant="h3" color="primary">Log Health Data</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} accessibilityLabel="Log health data form" accessibilityRole="scrollview">
        {/* Category Selection */}
        <View style={styles.section}>
          <Typography variant="h4" color="primary" style={styles.sectionTitle}>
            Select Category
          </Typography>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive,
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setSelectedMetric(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select ${category.name} category`}
                accessibilityHint={`Filter health metrics by ${category.name.toLowerCase()}`}
                accessibilityState={{ selected: selectedCategory === category.id }}
              >
                <Icon
                  name={category.icon}
                  size={32}
                  color={selectedCategory === category.id ? theme.colors.primary : theme.colors.textSecondary}
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography
                  variant="bodySmall"
                  color={selectedCategory === category.id ? 'primary' : 'secondary'}
                  weight={selectedCategory === category.id ? 'semibold' : 'medium'}
                  style={styles.categoryName}
                >
                  {category.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Metric Selection */}
        <View style={styles.section}>
          <Typography variant="h4" color="primary" style={styles.sectionTitle}>
            Select Metric
          </Typography>
          <View style={styles.metricsContainer}>
            {filteredMetrics.map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={[
                  styles.metricCard,
                  selectedMetric?.id === metric.id && styles.metricCardActive,
                ]}
                onPress={() => setSelectedMetric(metric)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${metric.name}`}
                accessibilityHint={`Log ${metric.name.toLowerCase()} in ${metric.unit}`}
                accessibilityState={{ selected: selectedMetric?.id === metric.id }}
              >
                <Icon
                  name={metric.icon}
                  size={24}
                  color={selectedMetric?.id === metric.id ? theme.colors.primary : theme.colors.textSecondary}
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography
                  variant="body"
                  color={selectedMetric?.id === metric.id ? 'primary' : 'primary'}
                  weight={selectedMetric?.id === metric.id ? 'semibold' : 'medium'}
                  style={styles.metricName}
                >
                  {metric.name}
                </Typography>
                <Typography variant="bodySmall" color="secondary">
                  {metric.unit}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data Entry Form */}
        {selectedMetric && (
          <View style={styles.section}>
            <Typography variant="h4" color="primary" style={styles.sectionTitle}>
              Enter Value
            </Typography>

            {selectedMetric.id === 'blood_pressure' ? (
              <View style={styles.bloodPressureContainer}>
                <View style={styles.bpInputContainer}>
                  <Typography variant="caption" color="secondary" style={styles.bpLabel}>
                    Systolic
                  </Typography>
                  <TextInput
                    style={styles.bpInput}
                    value={systolic}
                    onChangeText={setSystolic}
                    placeholder="120"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textTertiary}
                    accessibilityLabel="Systolic blood pressure"
                  />
                </View>
                <Typography variant="h1" color="secondary" style={styles.bpSeparator}>
                  /
                </Typography>
                <View style={styles.bpInputContainer}>
                  <Typography variant="caption" color="secondary" style={styles.bpLabel}>
                    Diastolic
                  </Typography>
                  <TextInput
                    style={styles.bpInput}
                    value={diastolic}
                    onChangeText={setDiastolic}
                    placeholder="80"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textTertiary}
                    accessibilityLabel="Diastolic blood pressure"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={setValue}
                  placeholder={`Enter ${selectedMetric.name.toLowerCase()}`}
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textTertiary}
                  accessibilityLabel={`Enter ${selectedMetric.name}`}
                />
                <Typography variant="h4" color="secondary" style={styles.inputUnit}>
                  {selectedMetric.unit}
                </Typography>
              </View>
            )}

            {/* Date/Time Picker */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Select date and time"
              accessibilityHint="Change when this measurement was taken"
            >
              <Icon
                name="event"
                size={20}
                color={theme.colors.primary}
                importantForAccessibility="no"
                accessible={false}
              />
              <Typography variant="body" color="primary" style={styles.dateText}>
                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}

            {/* Notes */}
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes (optional)"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Add notes"
            />

            {/* Save Button */}
            <Button
              variant="primary"
              size="large"
              onPress={handleSave}
              accessibilityLabel="Save health data entry"
              style={styles.saveButton}
            >
              Save Entry
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  categoryCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  categoryName: {
    marginTop: theme.spacing.xs,
  },
  metricsContainer: {
    gap: theme.spacing.xs,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  metricCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  metricName: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  inputUnit: {
    marginLeft: theme.spacing.xs,
  },
  bloodPressureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bpInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bpLabel: {
    marginBottom: theme.spacing.xxs,
  },
  bpInput: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  bpSeparator: {
    marginHorizontal: theme.spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateText: {
    marginLeft: theme.spacing.sm,
  },
  notesInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
    color: theme.colors.textPrimary,
    minHeight: 100,
  },
  saveButton: {
    marginTop: theme.spacing.lg,
  },
});

export default LogHealthDataScreen;
