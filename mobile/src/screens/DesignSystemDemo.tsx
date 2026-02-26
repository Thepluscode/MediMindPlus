import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  Input,
  HealthMetric,
  Typography,
  Spacing,
  AlertCard,
  LoadingSpinner,
} from '../components/ui';
import { theme } from '../theme/theme';

/**
 * Design System Demo Screen
 *
 * Demonstrates all UI components from the MediMindPlus design system.
 * Use this screen for visual testing and as a reference for component usage.
 */
const DesignSystemDemo: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const handleButtonPress = (variant: string) => {
    Alert.alert('Button Pressed', `You pressed the ${variant} button`);
  };

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <Typography variant="h1" align="center" color="primary">
          Design System Demo
        </Typography>
        <Typography variant="body" align="center" color="secondary">
          MediMindPlus Component Library
        </Typography>

        <Spacing size="xl" />

        {/* Typography Section */}
        <Card elevated={true} padding="lg">
          <Typography variant="h2" color="primary">
            Typography
          </Typography>
          <Spacing size="md" />

          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Spacing size="sm" />
          <Typography variant="bodyLarge">Large body text</Typography>
          <Typography variant="body">Regular body text</Typography>
          <Typography variant="bodySmall">Small body text</Typography>
          <Spacing size="sm" />
          <Typography variant="caption" color="tertiary">
            Caption text
          </Typography>
          <Typography variant="overline" color="tertiary">
            Overline Text
          </Typography>
        </Card>

        <Spacing size="lg" />

        {/* Button Section */}
        <Card elevated={true} padding="lg">
          <Typography variant="h2" color="primary">
            Buttons
          </Typography>
          <Spacing size="md" />

          <Button
            variant="primary"
            size="large"
            onPress={() => handleButtonPress('primary large')}
            fullWidth={true}
          >
            Primary Large Button
          </Button>

          <Spacing size="sm" />

          <Button
            variant="secondary"
            size="medium"
            onPress={() => handleButtonPress('secondary medium')}
            fullWidth={true}
          >
            Secondary Medium Button
          </Button>

          <Spacing size="sm" />

          <Button
            variant="text"
            size="small"
            onPress={() => handleButtonPress('text small')}
          >
            Text Small Button
          </Button>

          <Spacing size="sm" />

          <Button
            variant="primary"
            disabled={true}
            fullWidth={true}
          >
            Disabled Button
          </Button>

          <Spacing size="sm" />

          <Button
            variant="primary"
            loading={loading}
            onPress={handleLoadingTest}
            fullWidth={true}
          >
            Test Loading State
          </Button>
        </Card>

        <Spacing size="lg" />

        {/* Input Section */}
        <Card elevated={true} padding="lg">
          <Typography variant="h2" color="primary">
            Input Fields
          </Typography>
          <Spacing size="md" />

          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required={true}
            helperText="We'll never share your email"
            leftIcon={<Ionicons name="mail-outline" size={20} color="#718096" />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            required={true}
            helperText="Minimum 8 characters"
          />

          <Input
            label="Blood Pressure"
            placeholder="120/80"
            error="Value seems high. Please verify."
            helperText="Enter systolic/diastolic"
          />
        </Card>

        <Spacing size="lg" />

        {/* Health Metrics Section */}
        <Card elevated={true} padding="lg">
          <Typography variant="h2" color="primary">
            Health Metrics
          </Typography>
          <Spacing size="md" />

          <HealthMetric
            value="72"
            unit="bpm"
            label="Heart Rate"
            status="normal"
            trend="stable"
            icon={<Ionicons name="heart" size={24} color="#e53e3e" />}
          />

          <Spacing size="md" />

          <HealthMetric
            value="145/92"
            unit="mmHg"
            label="Blood Pressure"
            status="warning"
            trend="up"
            icon={<Ionicons name="pulse" size={24} color="#dd6b20" />}
          />

          <Spacing size="md" />

          <HealthMetric
            value="98.6"
            unit="°F"
            label="Temperature"
            status="normal"
            trend="stable"
            icon={<Ionicons name="thermometer" size={24} color="#f6ad55" />}
          />
        </Card>

        <Spacing size="lg" />

        {/* Alert Cards Section */}
        {showAlert && (
          <>
            <AlertCard
              severity="info"
              title="Appointment Reminder"
              message="You have a telehealth appointment scheduled for tomorrow at 2:00 PM."
              actionLabel="View Details"
              onActionPress={() => Alert.alert('Info', 'Viewing appointment details')}
              onDismiss={() => setShowAlert(false)}
            />

            <Spacing size="md" />

            <AlertCard
              severity="success"
              title="Health Goal Achieved"
              message="Congratulations! You've reached your daily step goal of 10,000 steps."
              actionLabel="View Progress"
              onActionPress={() => Alert.alert('Success', 'Viewing progress')}
            />

            <Spacing size="md" />

            <AlertCard
              severity="warning"
              title="Blood Pressure Elevated"
              message="Your last reading (145/92) is above normal range. Consider consulting your doctor."
              actionLabel="Schedule Appointment"
              onActionPress={() => Alert.alert('Warning', 'Scheduling appointment')}
            />

            <Spacing size="md" />

            <AlertCard
              severity="critical"
              title="Medication Reminder"
              message="You have missed 2 doses of Lisinopril. Please take your medication as prescribed."
              actionLabel="Mark as Taken"
              onActionPress={() => Alert.alert('Critical', 'Marking medication as taken')}
            />

            <Spacing size="lg" />
          </>
        )}

        {/* Loading States */}
        <Card elevated={true} padding="lg">
          <Typography variant="h2" color="primary">
            Loading States
          </Typography>
          <Spacing size="md" />

          <LoadingSpinner
            size="large"
            text="Loading health data..."
          />

          <Spacing size="lg" />

          <LoadingSpinner
            size="small"
            color="#48bb78"
            text="Syncing with server..."
          />
        </Card>

        <Spacing size="xl" />

        {/* Cards with Different Elevations */}
        <Typography variant="h2" color="primary">
          Card Elevations
        </Typography>
        <Spacing size="md" />

        <Card elevation="sm" padding="md">
          <Typography variant="body">Small Elevation Card</Typography>
        </Card>

        <Spacing size="md" />

        <Card elevated={true} elevation="md" padding="md">
          <Typography variant="body">Medium Elevation Card (Default)</Typography>
        </Card>

        <Spacing size="md" />

        <Card elevated={true} elevation="lg" padding="lg">
          <Typography variant="body">Large Elevation Card</Typography>
        </Card>

        <Spacing size="xl" />

        {/* Pressable Card */}
        <Card
          elevated={true}
          padding="lg"
          onPress={() => Alert.alert('Card Pressed', 'This card is interactive!')}
        >
          <View style={styles.pressableCard}>
            <Ionicons name="finger-print" size={32} color="#667eea" />
            <Spacing size="md" horizontal />
            <View style={{ flex: 1 }}>
              <Typography variant="h4" color="primary">
                Tap This Card
              </Typography>
              <Typography variant="bodySmall" color="secondary">
                This is a pressable card component
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#a0aec0" />
          </View>
        </Card>

        <Spacing size="xxxl" />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  pressableCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DesignSystemDemo;
