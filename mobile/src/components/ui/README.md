# MediMindPlus UI Component Library

A comprehensive, accessible, and HIPAA-compliant component library for the MediMindPlus mobile application.

## Overview

This component library implements the MediMindPlus Design System (see `/mobile/DESIGN_SYSTEM.md`). All components follow:

- **8pt Grid System** for consistent spacing
- **WCAG 2.1 AA Accessibility** standards (minimum 44pt touch targets, proper contrast ratios)
- **HIPAA Compliance** patterns for health data display
- **Cross-Platform Consistency** (iOS and Android)
- **Type Safety** with full TypeScript support

---

## Components

### Button

A flexible button component with three variants and three sizes.

**Import:**
```tsx
import { Button } from '@/components/ui';
```

**Usage:**
```tsx
// Primary button (default)
<Button
  variant="primary"
  size="large"
  onPress={handleSubmit}
  accessibilityLabel="Submit health data"
>
  Submit
</Button>

// Secondary button
<Button variant="secondary" size="medium" onPress={handleCancel}>
  Cancel
</Button>

// Text button
<Button variant="text" onPress={handleLearnMore}>
  Learn More
</Button>

// Loading state
<Button loading={true} disabled={true}>
  Processing...
</Button>

// Full width
<Button fullWidth={true}>
  Continue
</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'text'` (default: `'primary'`)
- `size`: `'small' | 'medium' | 'large'` (default: `'medium'`)
- `disabled`: `boolean` (default: `false`)
- `loading`: `boolean` (default: `false`)
- `fullWidth`: `boolean` (default: `false`)
- `onPress`: `(event) => void` (required)
- `accessibilityLabel`: `string`
- `accessibilityHint`: `string`

---

### Card

A container component with rounded corners and optional elevation.

**Import:**
```tsx
import { Card } from '@/components/ui';
```

**Usage:**
```tsx
// Basic card
<Card padding="md">
  <Text>Card content</Text>
</Card>

// Elevated card
<Card elevated={true} elevation="md" padding="lg">
  <Text>Elevated card</Text>
</Card>

// Pressable card
<Card onPress={handleCardPress} padding="md">
  <Text>Tap me</Text>
</Card>
```

**Props:**
- `elevated`: `boolean` (default: `false`)
- `elevation`: `'none' | 'sm' | 'md' | 'lg'` (default: `'md'`)
- `padding`: `'none' | 'sm' | 'md' | 'lg'` (default: `'md'`)
- `onPress`: `(event) => void` (optional, makes card pressable)
- `style`: `ViewStyle`

---

### Input

A text input component with label, error states, and helper text.

**Import:**
```tsx
import { Input } from '@/components/ui';
```

**Usage:**
```tsx
// Basic input
<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
/>

// Input with validation
<Input
  label="Blood Pressure"
  placeholder="120/80"
  value={bloodPressure}
  onChangeText={setBloodPressure}
  error={errorMessage}
  helperText="Enter systolic/diastolic"
  required={true}
/>

// Password input
<Input
  label="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={true}
  required={true}
/>

// Input with icons
<Input
  label="Search"
  leftIcon={<Ionicons name="search" size={20} color="#718096" />}
  placeholder="Search medications..."
/>
```

**Props:**
- All standard `TextInputProps` plus:
- `label`: `string`
- `error`: `string`
- `helperText`: `string`
- `required`: `boolean` (default: `false`)
- `secureTextEntry`: `boolean` (default: `false`, auto-adds show/hide toggle)
- `leftIcon`: `React.ReactNode`
- `rightIcon`: `React.ReactNode`

---

### HealthMetric

A specialized component for displaying health metrics with status and trend indicators.

**Import:**
```tsx
import { HealthMetric } from '@/components/ui';
```

**Usage:**
```tsx
<HealthMetric
  value="72"
  unit="bpm"
  label="Heart Rate"
  status="normal"
  trend="up"
  icon={<Ionicons name="heart" size={24} color="#e53e3e" />}
/>

<HealthMetric
  value="145/92"
  unit="mmHg"
  label="Blood Pressure"
  status="warning"
  trend="stable"
/>
```

**Props:**
- `value`: `string | number` (required)
- `unit`: `string` (required)
- `label`: `string` (required)
- `status`: `'normal' | 'warning' | 'critical'` (default: `'normal'`)
- `trend`: `'up' | 'down' | 'stable'` (optional)
- `icon`: `React.ReactNode` (optional)
- `containerStyle`: `ViewStyle`

---

### Typography

Provides consistent text styling across the app.

**Import:**
```tsx
import { Typography } from '@/components/ui';
```

**Usage:**
```tsx
<Typography variant="h1" color="primary" align="center">
  Welcome to MediMindPlus
</Typography>

<Typography variant="body" color="secondary">
  Track your health metrics in real-time.
</Typography>

<Typography variant="caption" color="tertiary">
  Last updated 5 minutes ago
</Typography>
```

**Props:**
- `variant`: `'h1' | 'h2' | 'h3' | 'h4' | 'bodyLarge' | 'body' | 'bodySmall' | 'button' | 'caption' | 'overline'` (default: `'body'`)
- `color`: `'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'warning'` (default: `'primary'`)
- `align`: `'left' | 'center' | 'right'` (default: `'left'`)
- All standard `TextProps`

---

### Spacing

Provides consistent spacing following the 8pt grid system.

**Import:**
```tsx
import { Spacing, spacing } from '@/components/ui';
```

**Usage:**
```tsx
// Vertical spacing
<Spacing size="md" />

// Horizontal spacing
<Spacing size="lg" horizontal />

// Use spacing values in custom styles
const styles = StyleSheet.create({
  container: {
    padding: spacing.md, // 16
    marginVertical: spacing.lg, // 24
  },
});
```

**Props:**
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'` (default: `'md'`)
- `horizontal`: `boolean` (default: `false`)
- `vertical`: `boolean` (default: `false`)

**Spacing Values:**
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `xxl`: 48px
- `xxxl`: 64px

---

### AlertCard

Displays health alerts with color-coded severity levels.

**Import:**
```tsx
import { AlertCard } from '@/components/ui';
```

**Usage:**
```tsx
<AlertCard
  severity="warning"
  title="Blood Pressure Elevated"
  message="Your last reading (145/92) is above normal range. Consider consulting your doctor."
  actionLabel="Schedule Appointment"
  onActionPress={handleSchedule}
  onDismiss={handleDismiss}
/>

<AlertCard
  severity="success"
  title="Health Goal Achieved"
  message="You've reached your daily step goal of 10,000 steps!"
/>
```

**Props:**
- `severity`: `'info' | 'success' | 'warning' | 'critical'` (required)
- `title`: `string` (required)
- `message`: `string` (required)
- `actionLabel`: `string` (optional)
- `onActionPress`: `(event) => void` (optional)
- `onDismiss`: `() => void` (optional, shows dismiss button)
- `containerStyle`: `ViewStyle`

---

### LoadingSpinner

Displays a loading indicator with optional text.

**Import:**
```tsx
import { LoadingSpinner } from '@/components/ui';
```

**Usage:**
```tsx
// Inline loading
<LoadingSpinner size="large" text="Loading health data..." />

// Full screen loading
<LoadingSpinner fullScreen={true} />

// Custom color
<LoadingSpinner color="#48bb78" text="Syncing..." />
```

**Props:**
- `size`: `'small' | 'large'` (default: `'large'`)
- `color`: `string` (default: `'#667eea'`)
- `text`: `string` (optional)
- `fullScreen`: `boolean` (default: `false`)
- `containerStyle`: `ViewStyle`

---

### SettingsItem

A reusable settings list item with icon, title, subtitle, and optional right element (chevron or switch).

**Import:**
```tsx
import { SettingsItem } from '@/components/ui';
```

**Usage:**
```tsx
// Navigation item
<SettingsItem
  icon="person-outline"
  title="Edit Profile"
  subtitle="Update your information"
  rightElement="chevron"
  onPress={handlePress}
/>

// Toggle switch item
<SettingsItem
  icon="notifications-outline"
  title="Push Notifications"
  subtitle="Receive alerts and updates"
  rightElement="switch"
  switchValue={isEnabled}
  onSwitchChange={handleToggle}
/>

// Simple item (no right element)
<SettingsItem
  icon="information-circle-outline"
  title="App Version"
  subtitle="1.0.0"
/>
```

**Props:**
- `icon`: `keyof typeof Ionicons.glyphMap` (required, Ionicons name)
- `title`: `string` (required)
- `subtitle`: `string` (optional)
- `onPress`: `(event) => void` (optional, for navigation items)
- `rightElement`: `'chevron' | 'switch'` (optional)
- `switchValue`: `boolean` (required if rightElement is 'switch')
- `onSwitchChange`: `(value: boolean) => void` (required if rightElement is 'switch')
- `disabled`: `boolean` (default: `false`)
- `accessibilityLabel`: `string`
- `accessibilityHint`: `string`

---

## Accessibility Features

All components include:

✅ **Screen Reader Support** - Proper `accessibilityLabel`, `accessibilityHint`, and `accessibilityRole`
✅ **Touch Target Size** - Minimum 44x44pt (iOS) / 48x48dp (Android)
✅ **Color Contrast** - WCAG 2.1 AA compliant (4.5:1 for normal text, 3:1 for large text)
✅ **Keyboard Navigation** - Focusable and keyboard-accessible where applicable
✅ **Live Regions** - Dynamic content announced to screen readers

---

## HIPAA Compliance

Components handling Protected Health Information (PHI) follow:

- **Data Masking** - Sensitive data can be masked in HealthMetric
- **Audit Logging** - All PHI displays should be logged (implement in parent components)
- **Secure Display** - No PHI exposed in accessibility labels unless necessary
- **Alert Patterns** - AlertCard follows clinical alert color standards

---

## Examples

### Health Dashboard Card

```tsx
import { Card, HealthMetric, Spacing, Typography } from '@/components/ui';

<Card elevated={true} padding="lg">
  <Typography variant="h3" color="primary">
    Today's Vitals
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
    value="120/80"
    unit="mmHg"
    label="Blood Pressure"
    status="normal"
  />
</Card>
```

### Login Form

```tsx
import { Button, Input, Spacing, Typography } from '@/components/ui';

<View style={{ padding: 16 }}>
  <Typography variant="h2" align="center">
    Sign In
  </Typography>

  <Spacing size="xl" />

  <Input
    label="Email"
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
    required={true}
  />

  <Input
    label="Password"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={true}
    required={true}
  />

  <Spacing size="lg" />

  <Button
    variant="primary"
    size="large"
    fullWidth={true}
    onPress={handleLogin}
    loading={isLoading}
  >
    Sign In
  </Button>
</View>
```

---

## Design Tokens

For custom components, import design tokens from the theme:

```tsx
import { theme } from '@/theme/theme';
import { spacing } from '@/components/ui';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: spacing.md,
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
});
```

---

## Contributing

When creating new components:

1. Follow the design system specifications in `/mobile/DESIGN_SYSTEM.md`
2. Include full TypeScript typing
3. Add comprehensive accessibility props
4. Document with JSDoc comments
5. Provide usage examples
6. Export from `index.tsx`

---

## Questions?

See the main [Design System Documentation](/mobile/DESIGN_SYSTEM.md) or contact the development team.
