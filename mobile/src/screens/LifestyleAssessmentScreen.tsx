import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';
import onboardingAPI, { LifestyleData } from '../services/onboardingAPI';

interface LifestyleAssessmentScreenProps {
  navigation: any;
}

const LifestyleAssessmentScreen: React.FC<LifestyleAssessmentScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lifestyle data state
  const [lifestyleData, setLifestyleData] = useState<LifestyleData>({
    smokingStatus: undefined,
    alcoholConsumption: undefined,
    exerciseFrequency: undefined,
    dietType: undefined,
    sleepHours: undefined,
    stressLevel: undefined,
    occupation: '',
  });

  // Load existing lifestyle data on mount
  useEffect(() => {
    // TODO: Add GET endpoint to retrieve existing lifestyle data
    // For now, start with empty form
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!lifestyleData.smokingStatus) {
        Alert.alert('Validation Error', 'Please select your smoking status');
        return;
      }

      // Save to backend
      await onboardingAPI.saveLifestyleData(lifestyleData);

      Alert.alert('Success', 'Lifestyle assessment saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save lifestyle assessment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderOptionButton = (
    value: string,
    label: string,
    currentValue: string | undefined,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        currentValue === value && styles.optionButtonSelected,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${currentValue === value ? 'selected' : 'not selected'}`}
      accessibilityHint={currentValue === value ? 'Tap to deselect this option' : 'Tap to select this option'}
      accessibilityState={{ selected: currentValue === value }}
    >
      <Typography
        variant="body"
        weight="medium"
        style={[
          styles.optionButtonText,
          currentValue === value && styles.optionButtonTextSelected,
        ]}
      >
        {label}
      </Typography>
      {currentValue === value && (
        <Icon name="check-circle" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
      )}
    </TouchableOpacity>
  );

  const renderStressLevel = () => {
    const levels = [
      { value: 1, label: 'Very Low', emoji: '😊' },
      { value: 2, label: 'Low', emoji: '🙂' },
      { value: 3, label: 'Moderate', emoji: '😐' },
      { value: 4, label: 'High', emoji: '😟' },
      { value: 5, label: 'Very High', emoji: '😰' },
    ];

    return (
      <View style={styles.stressLevelContainer}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.stressLevelButton,
              lifestyleData.stressLevel === level.value && styles.stressLevelButtonSelected,
            ]}
            onPress={() => setLifestyleData({ ...lifestyleData, stressLevel: level.value as any })}
            accessibilityRole="button"
            accessibilityLabel={`Stress level ${level.label} ${lifestyleData.stressLevel === level.value ? 'selected' : ''}`}
            accessibilityHint={`Rate your stress level as ${level.label}`}
            accessibilityState={{ selected: lifestyleData.stressLevel === level.value }}
          >
            <Typography style={styles.stressEmoji}>{level.emoji}</Typography>
            <Typography
              variant="caption"
              weight="medium"
              style={[
                styles.stressLabel,
                lifestyleData.stressLevel === level.value && styles.stressLabelSelected,
              ]}
            >
              {level.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading lifestyle assessment..."
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
          <Icon name="arrow-back" size={24} color={theme.colors.textPrimary} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
        <Typography variant="h4" weight="semibold" style={styles.headerTitle}>
          Lifestyle Assessment
        </Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} accessibilityLabel="Lifestyle assessment form" accessibilityRole="scrollview">
        {/* Introduction */}
        <Card elevated elevation="sm" padding="lg" style={styles.introSection}>
          <Icon name="psychology" size={48} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
          <Typography variant="h3" weight="bold" color="primary" style={styles.introTitle}>
            Your Lifestyle Matters
          </Typography>
          <Typography variant="body" color="secondary" align="center" style={styles.introText}>
            Understanding your daily habits helps us provide personalized health insights and recommendations.
            All information is confidential and secure.
          </Typography>
        </Card>

        {/* Smoking Status */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Icon name="smoke-free" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="h4" weight="semibold" color="primary">
              Smoking Status
            </Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.sectionDescription}>
            Do you smoke cigarettes, cigars, or use tobacco products?
          </Typography>
          <View style={styles.optionsGrid}>
            {renderOptionButton(
              'never',
              'Never',
              lifestyleData.smokingStatus,
              () => setLifestyleData({ ...lifestyleData, smokingStatus: 'never' })
            )}
            {renderOptionButton(
              'former',
              'Former Smoker',
              lifestyleData.smokingStatus,
              () => setLifestyleData({ ...lifestyleData, smokingStatus: 'former' })
            )}
            {renderOptionButton(
              'current',
              'Current Smoker',
              lifestyleData.smokingStatus,
              () => setLifestyleData({ ...lifestyleData, smokingStatus: 'current' })
            )}
          </View>
        </Card>

        {/* Alcohol Consumption */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Icon name="local-bar" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="h4" weight="semibold" color="primary">
              Alcohol Consumption
            </Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.sectionDescription}>
            How often do you consume alcoholic beverages?
          </Typography>
          <View style={styles.optionsGrid}>
            {renderOptionButton(
              'none',
              'None',
              lifestyleData.alcoholConsumption,
              () => setLifestyleData({ ...lifestyleData, alcoholConsumption: 'none' })
            )}
            {renderOptionButton(
              'occasional',
              'Occasional (1-2x/month)',
              lifestyleData.alcoholConsumption,
              () => setLifestyleData({ ...lifestyleData, alcoholConsumption: 'occasional' })
            )}
            {renderOptionButton(
              'moderate',
              'Moderate (1-2x/week)',
              lifestyleData.alcoholConsumption,
              () => setLifestyleData({ ...lifestyleData, alcoholConsumption: 'moderate' })
            )}
            {renderOptionButton(
              'heavy',
              'Heavy (3+ times/week)',
              lifestyleData.alcoholConsumption,
              () => setLifestyleData({ ...lifestyleData, alcoholConsumption: 'heavy' })
            )}
          </View>
        </Card>

        {/* Exercise Frequency */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Icon name="fitness-center" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="h4" weight="semibold" color="primary">
              Exercise Frequency
            </Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.sectionDescription}>
            How would you describe your physical activity level?
          </Typography>
          <View style={styles.optionsGrid}>
            {renderOptionButton(
              'sedentary',
              'Sedentary (Little/no exercise)',
              lifestyleData.exerciseFrequency,
              () => setLifestyleData({ ...lifestyleData, exerciseFrequency: 'sedentary' })
            )}
            {renderOptionButton(
              'light',
              'Light (1-2 days/week)',
              lifestyleData.exerciseFrequency,
              () => setLifestyleData({ ...lifestyleData, exerciseFrequency: 'light' })
            )}
            {renderOptionButton(
              'moderate',
              'Moderate (3-4 days/week)',
              lifestyleData.exerciseFrequency,
              () => setLifestyleData({ ...lifestyleData, exerciseFrequency: 'moderate' })
            )}
            {renderOptionButton(
              'active',
              'Active (5-6 days/week)',
              lifestyleData.exerciseFrequency,
              () => setLifestyleData({ ...lifestyleData, exerciseFrequency: 'active' })
            )}
            {renderOptionButton(
              'very_active',
              'Very Active (Daily)',
              lifestyleData.exerciseFrequency,
              () => setLifestyleData({ ...lifestyleData, exerciseFrequency: 'very_active' })
            )}
          </View>
        </Card>

        {/* Diet Type */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Icon name="restaurant" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="h4" weight="semibold" color="primary">
              Dietary Preferences
            </Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.sectionDescription}>
            What type of diet do you follow?
          </Typography>
          <View style={styles.optionsGrid}>
            {renderOptionButton(
              'omnivore',
              'Omnivore',
              lifestyleData.dietType,
              () => setLifestyleData({ ...lifestyleData, dietType: 'omnivore' })
            )}
            {renderOptionButton(
              'vegetarian',
              'Vegetarian',
              lifestyleData.dietType,
              () => setLifestyleData({ ...lifestyleData, dietType: 'vegetarian' })
            )}
            {renderOptionButton(
              'vegan',
              'Vegan',
              lifestyleData.dietType,
              () => setLifestyleData({ ...lifestyleData, dietType: 'vegan' })
            )}
            {renderOptionButton(
              'pescatarian',
              'Pescatarian',
              lifestyleData.dietType,
              () => setLifestyleData({ ...lifestyleData, dietType: 'pescatarian' })
            )}
            {renderOptionButton(
              'other',
              'Other',
              lifestyleData.dietType,
              () => setLifestyleData({ ...lifestyleData, dietType: 'other' })
            )}
          </View>
        </Card>

        {/* Sleep Hours */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Icon name="bedtime" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="h4" weight="semibold" color="primary">
              Sleep Duration
            </Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.sectionDescription}>
            How many hours do you typically sleep per night?
          </Typography>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 7.5"
              keyboardType="decimal-pad"
              value={lifestyleData.sleepHours?.toString() || ''}
              onChangeText={(text) => {
                const hours = parseFloat(text);
                setLifestyleData({ ...lifestyleData, sleepHours: isNaN(hours) ? undefined : hours });
              }}
              accessibilityLabel="Sleep hours per night"
              accessibilityHint="Enter the average hours you sleep each night"
            />
            <Typography variant="body" color="secondary" weight="medium">
              hours/night
            </Typography>
          </View>
          <View style={styles.infoBox}>
            <Icon name="info" size={16} color={theme.colors.info} importantForAccessibility="no" accessible={false} />
            <Typography variant="caption" color="secondary" style={styles.infoText}>
              Recommended: 7-9 hours for adults
            </Typography>
          </View>
        </Card>

        {/* Stress Level */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Icon name="psychology" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="h4" weight="semibold" color="primary">
              Stress Level
            </Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.sectionDescription}>
            How would you rate your current stress level?
          </Typography>
          {renderStressLevel()}
        </Card>

        {/* Occupation */}
        <Card elevated elevation="sm" padding="lg" style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Icon name="work" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />
            <Typography variant="h4" weight="semibold" color="primary">
              Occupation (Optional)
            </Typography>
          </View>
          <Typography variant="body" color="secondary" style={styles.sectionDescription}>
            What is your current occupation or field of work?
          </Typography>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Software Engineer, Teacher, Healthcare Worker"
            multiline
            numberOfLines={2}
            value={lifestyleData.occupation}
            onChangeText={(text) => setLifestyleData({ ...lifestyleData, occupation: text })}
            accessibilityLabel="Occupation field"
            accessibilityHint="Enter your current occupation or field of work"
          />
        </Card>

        {/* Health Impact Card */}
        <Card elevated elevation="sm" padding="lg" style={styles.impactCard}>
          <Typography variant="h4" weight="bold" color="primary" style={styles.impactTitle}>
            Why This Matters
          </Typography>
          <View style={styles.impactList}>
            <View style={styles.impactItem}>
              <Icon name="favorite" size={20} color={theme.colors.error} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.impactText}>
                Lifestyle factors account for up to 40% of chronic disease risk
              </Typography>
            </View>
            <View style={styles.impactItem}>
              <Icon name="insights" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.impactText}>
                AI predictions improve by 25% with lifestyle data
              </Typography>
            </View>
            <View style={styles.impactItem}>
              <Icon name="notifications-active" size={20} color={theme.colors.warning} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.impactText}>
                Get personalized alerts and prevention strategies
              </Typography>
            </View>
          </View>
        </Card>

        {/* Save Button */}
        <Button
          title={saving ? 'Saving...' : 'Save Lifestyle Assessment'}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          buttonStyle={styles.saveButton}
          titleStyle={styles.saveButtonText}
          containerStyle={styles.saveButtonContainer}
          icon={!saving && <Icon name="check" size={20} color="#fff" style={{ marginRight: 8 }} importantForAccessibility="no" accessible={false} />}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  introSection: {
    margin: theme.spacing.md,
    alignItems: 'center',
  },
  introTitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  introText: {
    lineHeight: 22,
  },
  section: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionDescription: {
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  optionsGrid: {
    gap: theme.spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionButtonText: {
    color: theme.colors.textPrimary,
  },
  optionButtonTextSelected: {
    color: theme.colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.info + '10',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  infoText: {
    flex: 1,
  },
  stressLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  stressLevelButton: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  stressLevelButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  stressEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  stressLabel: {
    textAlign: 'center',
  },
  stressLabelSelected: {
    color: theme.colors.primary,
  },
  impactCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  impactTitle: {
    marginBottom: theme.spacing.md,
  },
  impactList: {
    gap: theme.spacing.sm,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  impactText: {
    flex: 1,
    lineHeight: 20,
  },
  saveButtonContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LifestyleAssessmentScreen;
