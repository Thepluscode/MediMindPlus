# Component Library Quick Start

**One-page reference for the MediMindPlus UI component library**

---

## Import Components

```tsx
import {
  Button,
  Card,
  Input,
  HealthMetric,
  Typography,
  Spacing,
  AlertCard,
  LoadingSpinner
} from '@/components/ui';
```

---

## Button

```tsx
// Primary button
<Button variant="primary" size="large" onPress={handlePress}>
  Submit
</Button>

// Secondary button
<Button variant="secondary" onPress={handleCancel}>
  Cancel
</Button>

// Loading button
<Button loading={isLoading} disabled={isLoading}>
  Processing...
</Button>
```

**Props:** `variant` (primary|secondary|text), `size` (small|medium|large), `disabled`, `loading`, `fullWidth`

---

## Card

```tsx
// Basic card
<Card padding="md">
  <Typography variant="h3">Card Title</Typography>
  <Typography variant="body">Card content</Typography>
</Card>

// Elevated card
<Card elevated={true} elevation="md" padding="lg">
  <Text>Content</Text>
</Card>

// Pressable card
<Card onPress={handlePress}>
  <Text>Tap me</Text>
</Card>
```

**Props:** `elevated`, `elevation` (none|sm|md|lg), `padding` (none|sm|md|lg), `onPress`

---

## Input

```tsx
// Basic input
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter email"
  required={true}
/>

// Password input (auto-adds show/hide toggle)
<Input
  label="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={true}
/>

// Input with error
<Input
  label="Blood Pressure"
  value={bp}
  onChangeText={setBP}
  error="Value seems high"
  helperText="Enter systolic/diastolic"
/>
```

**Props:** `label`, `value`, `onChangeText`, `error`, `helperText`, `required`, `secureTextEntry`, `leftIcon`, `rightIcon`

---

## HealthMetric

```tsx
<HealthMetric
  value="72"
  unit="bpm"
  label="Heart Rate"
  status="normal"
  trend="stable"
  icon={<Ionicons name="heart" size={24} color="#e53e3e" />}
/>
```

**Props:** `value`, `unit`, `label`, `status` (normal|warning|critical), `trend` (up|down|stable), `icon`

---

## Typography

```tsx
<Typography variant="h1" align="center">
  Welcome
</Typography>

<Typography variant="body" color="secondary">
  Track your health metrics
</Typography>

<Typography variant="caption" color="tertiary">
  Last updated 5 min ago
</Typography>
```

**Variants:** h1, h2, h3, h4, bodyLarge, body, bodySmall, button, caption, overline
**Colors:** primary, secondary, tertiary, inverse, error, success, warning

---

## Spacing

```tsx
// Vertical spacing
<Spacing size="md" />

// Horizontal spacing
<Spacing size="lg" horizontal />

// In custom styles
import { spacing } from '@/components/ui';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md, // 16px
    marginVertical: spacing.lg, // 24px
  }
});
```

**Sizes:** xs (4), sm (8), md (16), lg (24), xl (32), xxl (48), xxxl (64)

---

## AlertCard

```tsx
<AlertCard
  severity="warning"
  title="Blood Pressure Elevated"
  message="Your reading is above normal range."
  actionLabel="Schedule Appointment"
  onActionPress={handleSchedule}
  onDismiss={handleDismiss}
/>
```

**Severities:** info (blue), success (green), warning (orange), critical (red)

---

## LoadingSpinner

```tsx
// Inline loading
<LoadingSpinner size="large" text="Loading health data..." />

// Full screen
<LoadingSpinner fullScreen={true} />

// Custom color
<LoadingSpinner color="#48bb78" text="Syncing..." />
```

---

## SettingsItem

```tsx
// Navigation item
<SettingsItem
  icon="person-outline"
  title="Edit Profile"
  subtitle="Update your information"
  rightElement="chevron"
  onPress={handlePress}
/>

// Toggle switch
<SettingsItem
  icon="notifications-outline"
  title="Notifications"
  subtitle="Receive alerts"
  rightElement="switch"
  switchValue={enabled}
  onSwitchChange={setEnabled}
/>
```

---

## Common Patterns

### Health Dashboard Card
```tsx
<Card elevated={true} padding="lg">
  <Typography variant="h3">Today's Vitals</Typography>
  <Spacing size="md" />

  <HealthMetric
    value="72"
    unit="bpm"
    label="Heart Rate"
    status="normal"
  />
</Card>
```

### Login Form
```tsx
<View style={{ padding: 16 }}>
  <Typography variant="h2" align="center">Sign In</Typography>
  <Spacing size="xl" />

  <Input
    label="Email"
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
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

### Error State
```tsx
<Card padding="lg">
  <AlertCard
    severity="critical"
    title="Connection Error"
    message="Unable to sync health data. Please check your connection."
    actionLabel="Retry"
    onActionPress={handleRetry}
  />
</Card>
```

### Loading State
```tsx
{isLoading ? (
  <LoadingSpinner text="Loading patient data..." />
) : (
  <Card padding="lg">
    {/* Content */}
  </Card>
)}
```

---

## Accessibility Checklist

✅ Add `accessibilityLabel` to Buttons
✅ Mark required inputs with `required={true}`
✅ Provide `helperText` for complex inputs
✅ Use semantic color meanings (error=red, success=green)
✅ Ensure 44x44pt minimum touch targets
✅ Test with VoiceOver (iOS) / TalkBack (Android)

---

## View Demo

Navigate to **Design System Demo** screen to see all components in action:

```tsx
navigation.navigate('DesignSystemDemo');
```

---

## Full Documentation

- **Design System:** `/mobile/DESIGN_SYSTEM.md`
- **Component API:** `/mobile/src/components/ui/README.md`
- **Implementation Summary:** `/mobile/COMPONENT_LIBRARY_SUMMARY.md`

---

**Questions?** Check the README or contact the dev team.
