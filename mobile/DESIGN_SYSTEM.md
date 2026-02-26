# MediMindPlus Mobile Design System

**Version:** 2.0
**Last Updated:** February 2026
**Platform:** React Native (Expo)

---

## 📐 Design Principles

1. **HIPAA-Compliant First** - All UI decisions prioritize patient privacy and data security
2. **Accessibility by Default** - WCAG 2.1 AA compliance minimum
3. **Performance-Optimized** - 60fps animations, minimal re-renders
4. **Cross-Platform Consistency** - Looks native on both iOS and Android
5. **Data-Dense but Clear** - Healthcare requires lots of information, presented clearly

---

## 🎨 Color System

### Primary Colors

```typescript
const colors = {
  // Brand
  primary: '#667eea',          // Primary brand purple
  primaryDark: '#5a67d8',      // Hover/pressed states
  primaryLight: '#7f9cf5',     // Backgrounds/tints

  secondary: '#764ba2',        // Gradient end
  accent: '#f093fb',           // Call-to-action highlights

  // Semantic Colors
  success: '#48bb78',          // Positive actions, health metrics in range
  warning: '#ed8936',          // Caution, metrics approaching limits
  error: '#f56565',            // Errors, critical health alerts
  info: '#4299e1',             // Informational messages

  // Neutrals
  background: '#f7fafc',       // App background
  surface: '#ffffff',          // Card backgrounds
  surfaceElevated: '#ffffff',  // Elevated cards (with shadow)

  // Text
  textPrimary: '#1a202c',      // Main content
  textSecondary: '#4a5568',    // Supporting content
  textTertiary: '#a0aec0',     // Disabled/placeholder
  textInverse: '#ffffff',      // Text on dark backgrounds

  // Borders
  border: '#e2e8f0',           // Standard borders
  borderDark: '#cbd5e0',       // Emphasized borders

  // Health-Specific
  heartRate: '#e53e3e',        // Heart rate indicators
  bloodPressure: '#dd6b20',    // BP indicators
  oxygenSaturation: '#3182ce', // O2 saturation
  temperature: '#f6ad55',      // Temperature
  glucose: '#9f7aea',          // Blood glucose
};
```

### Gradients

```typescript
const gradients = {
  primary: ['#667eea', '#764ba2'],     // Main brand gradient
  success: ['#48bb78', '#38a169'],     // Success states
  warning: ['#ed8936', '#dd6b20'],     // Warning states
  error: ['#f56565', '#e53e3e'],       // Error states
  health: ['#667eea', '#4299e1'],      // Health data visualizations
};
```

---

## 📏 Spacing Scale

**Based on 8pt grid system for consistency**

```typescript
const spacing = {
  xs: 4,    // Tiny gaps
  sm: 8,    // Small gaps, compact layouts
  md: 16,   // Default spacing
  lg: 24,   // Section spacing
  xl: 32,   // Large sections
  xxl: 48,  // Major sections
  xxxl: 64, // Hero sections
};
```

### Usage Guidelines

- **Component Internal Padding:** `sm` (8px) to `md` (16px)
- **Between Components:** `md` (16px) to `lg` (24px)
- **Section Separation:** `lg` (24px) to `xl` (32px)
- **Screen Margins:** `md` (16px) on mobile, `lg` (24px) on tablet

---

## ✍️ Typography

### Font Families

```typescript
const fonts = {
  regular: 'System',      // SF Pro (iOS), Roboto (Android)
  medium: 'System-Medium',
  semibold: 'System-Semibold',
  bold: 'System-Bold',
  mono: 'Menlo',          // For data/code display
};
```

### Type Scale

```typescript
const typography = {
  // Headings
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: 0,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0,
  },

  // Body Text
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },

  // UI Elements
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  overline: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Data Display
  metric: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    fontFamily: 'mono',
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#718096',
  },
};
```

---

## 🔘 Component Library

### Button Variants

#### Primary Button

```tsx
<Button
  variant="primary"
  size="large"
  onPress={handlePress}
  disabled={false}
>
  Submit Health Data
</Button>
```

**Specs:**
- Background: `colors.primary` with gradient
- Text: `colors.textInverse` (white)
- Height: 48px (large), 40px (medium), 32px (small)
- Border Radius: 8px
- Padding: 16px horizontal
- Shadow: 0px 2px 8px rgba(102, 126, 234, 0.3)

#### Secondary Button

```tsx
<Button
  variant="secondary"
  size="medium"
  onPress={handlePress}
>
  Cancel
</Button>
```

**Specs:**
- Background: `colors.surface` (white)
- Border: 1px solid `colors.border`
- Text: `colors.primary`
- Same sizing as primary

#### Text Button

```tsx
<Button
  variant="text"
  onPress={handlePress}
>
  Learn More
</Button>
```

**Specs:**
- Background: transparent
- Text: `colors.primary`
- No border, no shadow

---

### Card Component

```tsx
<Card
  elevated={true}
  padding="md"
  onPress={handlePress}
>
  <CardTitle>Heart Rate</CardTitle>
  <CardMetric>72 bpm</CardMetric>
  <CardSubtext>Normal Range</CardSubtext>
</Card>
```

**Specs:**
- Background: `colors.surface`
- Border Radius: 12px
- Padding: `spacing.md` (16px)
- Shadow (if elevated):
  - iOS: `shadowOffset: { width: 0, height: 2 }`, `shadowOpacity: 0.1`, `shadowRadius: 8`
  - Android: `elevation: 3`

---

### Input Fields

```tsx
<Input
  label="Blood Pressure"
  placeholder="120/80"
  value={value}
  onChangeText={setValue}
  error={errorMessage}
  helperText="Enter systolic/diastolic"
  required={true}
/>
```

**Specs:**
- Height: 48px
- Border: 1px solid `colors.border`
- Border Radius: 8px
- Padding: 12px horizontal
- Label: `typography.bodySmall`, `colors.textSecondary`
- Error State: Border changes to `colors.error`

---

### Health Metric Display

```tsx
<HealthMetric
  value="72"
  unit="bpm"
  label="Heart Rate"
  status="normal" // normal | warning | critical
  trend="up" // up | down | stable
  icon={<HeartIcon />}
/>
```

**Specs:**
- Value: `typography.metric` (40px, bold, mono)
- Unit: `typography.metricLabel` (12px, gray)
- Status Indicator: Color-coded dot (green/yellow/red)
- Trend Arrow: Small icon next to value

---

## 🎭 Shadows & Elevation

```typescript
const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
};
```

---

## ♿ Accessibility Guidelines

### Minimum Requirements

1. **Touch Targets:** Minimum 44x44pt (iOS) / 48x48dp (Android)
2. **Color Contrast:**
   - Text: Minimum 4.5:1 ratio for normal text
   - Large Text (18pt+): Minimum 3:1 ratio
3. **Screen Reader Support:**
   - All interactive elements have `accessibilityLabel`
   - Form inputs have `accessibilityHint`
   - Loading states announced with `accessibilityLiveRegion`

### Implementation

```tsx
<TouchableOpacity
  accessibilityLabel="Submit health data"
  accessibilityHint="Uploads your vitals to the server"
  accessibilityRole="button"
  accessible={true}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

---

## 🎬 Animation Standards

### Timing Functions

```typescript
const animations = {
  // Durations (milliseconds)
  fast: 150,      // Micro-interactions
  normal: 250,    // Standard transitions
  slow: 350,      // Complex animations

  // Easing
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  spring: 'spring(1, 0.5, 0.3)',
};
```

### Usage Guidelines

- **Button Press:** 150ms scale down to 0.95
- **Card Tap:** 250ms elevation increase + subtle scale
- **Page Transitions:** 350ms slide with fade
- **Loading Indicators:** Continuous smooth rotation

---

## 📱 Responsive Breakpoints

```typescript
const breakpoints = {
  phone: 0,      // 0-599px
  tablet: 600,   // 600-959px
  desktop: 960,  // 960px+
};
```

### Adaptive Layouts

- **Phone:** Single column, compact spacing
- **Tablet:** Two columns for dashboards, increased spacing
- **Desktop Web:** Three columns, maximum width 1200px

---

## 🩺 Health-Specific Patterns

### Health Alert Card

```tsx
<AlertCard severity="warning">
  <AlertIcon name="warning" />
  <AlertTitle>Blood Pressure Elevated</AlertTitle>
  <AlertMessage>
    Your last reading (145/92) is above normal range.
    Consider consulting your doctor.
  </AlertMessage>
  <AlertAction onPress={handleAction}>
    Schedule Appointment
  </AlertAction>
</AlertCard>
```

**Color Coding:**
- **Info:** Blue (`colors.info`)
- **Success:** Green (`colors.success`)
- **Warning:** Orange (`colors.warning`)
- **Critical:** Red (`colors.error`)

---

## 📊 Data Visualization

### Chart Colors

```typescript
const chartColors = {
  primary: '#667eea',
  secondary: '#764ba2',
  gridLines: '#e2e8f0',
  text: '#718096',

  // Multi-series
  series: [
    '#667eea', // Purple
    '#48bb78', // Green
    '#4299e1', // Blue
    '#ed8936', // Orange
    '#9f7aea', // Light purple
  ],
};
```

### Guidelines

- **Line Charts:** 2px stroke, smooth curves
- **Bar Charts:** 8px border radius on top
- **Grid Lines:** 1px, `colors.border`, 20% opacity
- **Labels:** `typography.caption`, `colors.textSecondary`

---

## 🔒 Security & Privacy UI

### Consent Flows

- **Checkbox:** Large (24x24), clear label, link to full text
- **Signature:** Full-width canvas, clear instructions
- **Audit Trail:** Timestamp + user ID + action displayed

### Data Masking

```tsx
<SensitiveData
  value="123-45-6789"
  masked={true}
  maskPattern="***-**-****"
/>
```

---

## 📚 Resources

- **Figma File:** [Link to design files]
- **Component Storybook:** Run `npm run storybook`
- **Accessibility Testing:** `npm run a11y-test`
- **Design Tokens:** `/src/theme/theme.ts`

---

**Questions?** Contact the design team or open an issue in the repo.
