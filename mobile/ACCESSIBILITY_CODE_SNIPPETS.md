# MediMindPlus - Accessibility Code Snippets Library

## Quick Reference for Common Accessibility Patterns

This library provides copy-paste ready code snippets for implementing accessibility features in the MediMindPlus mobile application.

---

## Table of Contents

1. [Buttons](#buttons)
2. [Form Inputs](#form-inputs)
3. [Lists & ScrollViews](#lists--scrollviews)
4. [Live Regions](#live-regions)
5. [Navigation](#navigation)
6. [Modals & Dialogs](#modals--dialogs)
7. [Images & Icons](#images--icons)
8. [Custom Components](#custom-components)
9. [Testing Utilities](#testing-utilities)

---

## Buttons

### Basic Button
```typescript
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Save changes"
  accessibilityHint="Saves your profile updates to the server"
>
  <Text>Save</Text>
</TouchableOpacity>
```

### Button with State (Disabled)
```typescript
<TouchableOpacity
  onPress={handleSubmit}
  disabled={isLoading || !isValid}
  accessibilityRole="button"
  accessibilityLabel="Submit form"
  accessibilityHint="Submits your health data entry"
  accessibilityState={{ disabled: isLoading || !isValid }}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

### Button with State (Loading)
```typescript
<TouchableOpacity
  onPress={handlePayment}
  disabled={loading}
  accessibilityRole="button"
  accessibilityLabel="Pay $50.00"
  accessibilityHint="Processes payment for consultation"
  accessibilityState={{ busy: loading }}
>
  {loading ? (
    <LoadingSpinner />
  ) : (
    <Text>Pay $50.00</Text>
  )}
</TouchableOpacity>
```

### Button with State (Selected)
```typescript
<TouchableOpacity
  onPress={() => setSelectedCategory('vitals')}
  accessibilityRole="button"
  accessibilityLabel="Vitals category"
  accessibilityHint="Filter health metrics by vital signs"
  accessibilityState={{ selected: selectedCategory === 'vitals' }}
>
  <Text>Vitals</Text>
</TouchableOpacity>
```

### Icon-Only Button
```typescript
<TouchableOpacity
  onPress={handleDelete}
  accessibilityRole="button"
  accessibilityLabel="Delete item"
  accessibilityHint="Removes this entry from your health records"
>
  <Ionicons
    name="trash"
    size={24}
    color="red"
    importantForAccessibility="no"
    accessible={false}
  />
</TouchableOpacity>
```

### Button with Confirmation
```typescript
const handleDelete = () => {
  Alert.alert(
    'Delete Entry',
    'Are you sure you want to delete this health record?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
        accessibilityLabel: 'Cancel deletion',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: confirmDelete,
        accessibilityLabel: 'Confirm deletion',
      },
    ],
    { cancelable: true }
  );
};

<TouchableOpacity
  onPress={handleDelete}
  accessibilityRole="button"
  accessibilityLabel="Delete health record"
  accessibilityHint="Opens confirmation dialog"
>
  <Text>Delete</Text>
</TouchableOpacity>
```

---

## Form Inputs

### Basic Text Input
```typescript
<Input
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  placeholder="your.email@example.com"
  keyboardType="email-address"
  autoCapitalize="none"
  required
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email for account login"
/>
```

### Input with Error
```typescript
<Input
  label="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
  error={passwordError}
  required
  accessibilityLabel="Password"
  accessibilityHint="Enter your account password"
/>

// Input component automatically adds live region for errors:
{error && (
  <View accessibilityLiveRegion="polite">
    <Text style={styles.error}>{error}</Text>
  </View>
)}
```

### Password Input with Toggle
```typescript
const [showPassword, setShowPassword] = useState(false);

<View style={styles.inputWrapper}>
  <TextInput
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}
    accessibilityLabel="Password"
    accessibilityHint="Enter your password"
  />
  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
    accessibilityRole="button"
    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
    accessibilityHint="Toggles password visibility"
  >
    <Ionicons
      name={showPassword ? 'eye-off' : 'eye'}
      size={24}
      importantForAccessibility="no"
      accessible={false}
    />
  </TouchableOpacity>
</View>
```

### Multi-Line Input
```typescript
<TextInput
  style={styles.textArea}
  value={notes}
  onChangeText={setNotes}
  placeholder="Add any additional notes..."
  multiline
  numberOfLines={4}
  textAlignVertical="top"
  accessibilityLabel="Additional notes"
  accessibilityHint="Enter any additional information about your symptoms"
/>
```

### Input with Live Validation
```typescript
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const validateEmail = (text: string) => {
  setEmail(text);
  if (text && !isValidEmail(text)) {
    setEmailError('Invalid email format');
  } else {
    setEmailError('');
  }
};

<Input
  label="Email"
  value={email}
  onChangeText={validateEmail}
  error={emailError}
/>

// Error announced immediately via live region
```

### Checkbox/Toggle
```typescript
<View style={styles.checkboxRow}>
  <Switch
    value={isEnabled}
    onValueChange={setIsEnabled}
    accessibilityRole="switch"
    accessibilityLabel="Enable notifications"
    accessibilityHint="Toggles health alert notifications"
    accessibilityState={{ checked: isEnabled }}
  />
  <Text>Enable Notifications</Text>
</View>
```

### Radio Button Group
```typescript
const options = ['Option A', 'Option B', 'Option C'];

{options.map((option) => (
  <TouchableOpacity
    key={option}
    onPress={() => setSelected(option)}
    accessibilityRole="radio"
    accessibilityLabel={option}
    accessibilityState={{ checked: selected === option }}
  >
    <View style={styles.radio}>
      {selected === option && <View style={styles.radioSelected} />}
    </View>
    <Text>{option}</Text>
  </TouchableOpacity>
))}
```

---

## Lists & ScrollViews

### Accessible FlatList
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  accessibilityLabel="Payment history list"
  accessibilityRole="list"
  accessibilityHint="List of your past payments and transactions"
/>
```

### List Item with Action
```typescript
const renderItem = ({ item, index }) => (
  <TouchableOpacity
    style={styles.listItem}
    onPress={() => navigateToDetail(item)}
    accessibilityRole="button"
    accessibilityLabel={`${item.title}, ${item.subtitle}`}
    accessibilityHint="View detailed information"
  >
    <Text>{item.title}</Text>
    <Text>{item.subtitle}</Text>
  </TouchableOpacity>
);
```

### SectionList with Headers
```typescript
<SectionList
  sections={sections}
  renderItem={renderItem}
  renderSectionHeader={({ section }) => (
    <View
      style={styles.sectionHeader}
      accessibilityRole="header"
      accessibilityLabel={`${section.title} section`}
    >
      <Text>{section.title}</Text>
    </View>
  )}
  accessibilityRole="list"
/>
```

### ScrollView with Accessibility
```typescript
<ScrollView
  style={styles.container}
  showsVerticalScrollIndicator={false}
  accessibilityLabel="Health dashboard content"
  accessibilityRole="scrollview"
>
  {/* Content */}
</ScrollView>
```

### Empty List State
```typescript
const renderEmptyState = () => (
  <View
    style={styles.emptyState}
    accessibilityLabel="No items found"
    accessibilityRole="text"
  >
    <Ionicons
      name="folder-open-outline"
      size={64}
      color={theme.colors.textSecondary}
      importantForAccessibility="no"
      accessible={false}
    />
    <Typography>No items found</Typography>
    <Typography color="secondary">
      Try adjusting your filters
    </Typography>
  </View>
);
```

---

## Live Regions

### Form Error Announcement
```typescript
{error && (
  <View accessibilityLiveRegion="polite">
    <Text style={styles.error}>{error}</Text>
  </View>
)}
```

### Success Message Announcement
```typescript
{successMessage && (
  <View
    accessibilityLiveRegion="polite"
    accessibilityLabel={successMessage}
  >
    <Text style={styles.success}>{successMessage}</Text>
  </View>
)}
```

### Critical Alert (Assertive)
```typescript
{criticalAlert && (
  <View
    accessibilityLiveRegion="assertive"
    accessibilityLabel={`Critical: ${criticalAlert}`}
  >
    <Ionicons name="warning" size={24} color="red" />
    <Text style={styles.critical}>{criticalAlert}</Text>
  </View>
)}
```

### Loading State
```typescript
<View accessibilityLiveRegion="polite">
  {loading ? (
    <View accessibilityLabel="Loading data, please wait">
      <LoadingSpinner />
      <Text>Loading...</Text>
    </View>
  ) : (
    <View>{/* Content */}</View>
  )}
</View>
```

### Search Results Count
```typescript
<ScrollView
  accessibilityLabel={`${results.length} result${results.length !== 1 ? 's' : ''} found`}
  accessibilityLiveRegion="polite"
>
  {results.map(renderResult)}
</ScrollView>
```

### Payment Processing
```typescript
<View accessibilityLiveRegion="polite">
  <TouchableOpacity
    onPress={handlePayment}
    disabled={processing}
  >
    {processing ? (
      <View accessibilityLabel="Processing payment, please wait">
        <LoadingSpinner />
      </View>
    ) : (
      <Text>Pay ${amount}</Text>
    )}
  </TouchableOpacity>
</View>
```

### AI Analysis Progress
```typescript
{analyzing && (
  <View
    style={styles.progressSection}
    accessibilityLiveRegion="polite"
    accessibilityLabel="Analyzing chest X-ray with AI"
  >
    <ProgressBar progress={progress} />
    <Text>Analyzing...</Text>
  </View>
)}
```

### Critical Medical Findings
```typescript
{criticalFindings.length > 0 && (
  <View
    accessibilityLiveRegion="assertive"
    accessibilityLabel={`Critical findings detected: ${criticalFindings.join(', ')}`}
  >
    <Text style={styles.critical}>CRITICAL FINDINGS</Text>
    {criticalFindings.map((finding, i) => (
      <Text key={i}>• {finding}</Text>
    ))}
  </View>
)}
```

---

## Navigation

### Tab Navigation
```typescript
<TouchableOpacity
  onPress={() => navigation.navigate('Dashboard')}
  accessibilityRole="tab"
  accessibilityLabel="Dashboard"
  accessibilityHint="Navigate to health dashboard"
  accessibilityState={{ selected: currentRoute === 'Dashboard' }}
>
  <Ionicons
    name="home"
    size={24}
    importantForAccessibility="no"
    accessible={false}
  />
  <Text>Dashboard</Text>
</TouchableOpacity>
```

### Back Button
```typescript
<TouchableOpacity
  onPress={() => navigation.goBack()}
  style={styles.backButton}
  accessibilityRole="button"
  accessibilityLabel="Go back"
  accessibilityHint="Return to previous screen"
>
  <Ionicons
    name="arrow-back"
    size={24}
    importantForAccessibility="no"
    accessible={false}
  />
</TouchableOpacity>
```

### Breadcrumb Navigation
```typescript
<View style={styles.breadcrumb}>
  <TouchableOpacity
    onPress={() => navigation.navigate('Home')}
    accessibilityRole="link"
    accessibilityLabel="Home"
  >
    <Text>Home</Text>
  </TouchableOpacity>
  <Text> / </Text>
  <TouchableOpacity
    onPress={() => navigation.navigate('Settings')}
    accessibilityRole="link"
    accessibilityLabel="Settings"
  >
    <Text>Settings</Text>
  </TouchableOpacity>
  <Text> / </Text>
  <Text
    accessibilityRole="text"
    accessibilityLabel="Current page: Profile"
  >
    Profile
  </Text>
</View>
```

### Menu Item
```typescript
<TouchableOpacity
  onPress={() => navigation.navigate('Profile')}
  style={styles.menuItem}
  accessibilityRole="button"
  accessibilityLabel="Edit profile"
  accessibilityHint="Navigate to profile settings"
>
  <Ionicons
    name="person"
    size={24}
    importantForAccessibility="no"
    accessible={false}
  />
  <Text>Edit Profile</Text>
  <Ionicons
    name="chevron-forward"
    size={24}
    importantForAccessibility="no"
    accessible={false}
  />
</TouchableOpacity>
```

---

## Modals & Dialogs

### Basic Modal
```typescript
<Modal
  visible={isVisible}
  transparent
  animationType="fade"
  onRequestClose={handleClose}
  accessibilityViewIsModal={true}
>
  <View style={styles.modalOverlay}>
    <View
      style={styles.modalContent}
      accessibilityRole="dialog"
      accessibilityLabel="Confirmation dialog"
    >
      <Text>Are you sure?</Text>
      <TouchableOpacity
        onPress={handleConfirm}
        accessibilityRole="button"
        accessibilityLabel="Confirm"
      >
        <Text>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
      >
        <Text>No</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

### Alert Dialog with AccessibilityInfo
```typescript
import { AccessibilityInfo } from 'react-native';

const showAccessibleAlert = (title: string, message: string) => {
  // Announce to screen readers
  AccessibilityInfo.announceForAccessibility(`${title}. ${message}`);

  Alert.alert(
    title,
    message,
    [
      {
        text: 'OK',
        accessibilityLabel: 'Dismiss alert',
      },
    ]
  );
};
```

### Bottom Sheet
```typescript
<Modal
  visible={isVisible}
  transparent
  animationType="slide"
  accessibilityViewIsModal={true}
>
  <TouchableOpacity
    style={styles.backdrop}
    activeOpacity={1}
    onPress={handleClose}
    accessibilityRole="button"
    accessibilityLabel="Close bottom sheet"
  >
    <View
      style={styles.bottomSheet}
      accessibilityRole="menu"
      onStartShouldSetResponder={() => true}
    >
      {/* Menu items */}
    </View>
  </TouchableOpacity>
</Modal>
```

---

## Images & Icons

### Decorative Icon
```typescript
<Ionicons
  name="checkmark-circle"
  size={24}
  color="green"
  importantForAccessibility="no"
  accessible={false}
/>
```

### Informational Icon
```typescript
<View
  style={styles.statusBadge}
  accessibilityLabel="Payment status: Paid"
  accessibilityRole="text"
>
  <Ionicons
    name="checkmark-circle"
    size={20}
    color="green"
    importantForAccessibility="no"
    accessible={false}
  />
  <Text>Paid</Text>
</View>
```

### Image with Alt Text
```typescript
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  accessibilityLabel="Profile picture of Dr. Jane Smith"
  accessibilityRole="image"
/>
```

### Decorative Image
```typescript
<Image
  source={require('./assets/background.png')}
  style={styles.background}
  importantForAccessibility="no"
  accessible={false}
/>
```

### Medical Image with Description
```typescript
<View>
  <Image
    source={{ uri: xrayUrl }}
    style={styles.xray}
    accessibilityLabel="Chest X-ray image"
    accessibilityRole="image"
    accessibilityHint="Medical scan image, see detailed findings below"
  />
  <Text
    accessibilityRole="text"
    accessibilityLabel="Image description: Frontal chest X-ray showing clear lung fields"
  >
    Frontal chest X-ray showing clear lung fields
  </Text>
</View>
```

---

## Custom Components

### Alert Card with Priority
```typescript
<View
  style={styles.alert}
  accessibilityRole="alert"
  accessibilityLabel={`${severity} alert: ${title}. ${message}`}
  accessibilityLiveRegion={severity === 'critical' ? 'assertive' : 'polite'}
>
  <Ionicons
    name={getIconName(severity)}
    size={24}
    importantForAccessibility="no"
    accessible={false}
  />
  <View>
    <Text style={styles.title}>{title}</Text>
    <Text>{message}</Text>
  </View>
  {onDismiss && (
    <TouchableOpacity
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel="Dismiss alert"
      accessibilityHint="Remove this alert from view"
    >
      <Ionicons
        name="close"
        size={20}
        importantForAccessibility="no"
        accessible={false}
      />
    </TouchableOpacity>
  )}
</View>
```

### Expandable Section
```typescript
const [isExpanded, setIsExpanded] = useState(false);

<View>
  <TouchableOpacity
    onPress={() => setIsExpanded(!isExpanded)}
    accessibilityRole="button"
    accessibilityLabel="Medical history section"
    accessibilityHint={`${isExpanded ? 'Collapse' : 'Expand'} medical history`}
    accessibilityState={{ expanded: isExpanded }}
  >
    <Text>Medical History</Text>
    <Ionicons
      name={isExpanded ? 'chevron-up' : 'chevron-down'}
      size={24}
      importantForAccessibility="no"
      accessible={false}
    />
  </TouchableOpacity>
  {isExpanded && (
    <View accessible={true}>
      {/* Expanded content */}
    </View>
  )}
</View>
```

### Card with Action
```typescript
<TouchableOpacity
  style={styles.card}
  onPress={() => navigateToDetails(item)}
  accessibilityRole="button"
  accessibilityLabel={`${item.title}. ${item.description}`}
  accessibilityHint="View full details"
>
  <Image
    source={{ uri: item.image }}
    style={styles.cardImage}
    importantForAccessibility="no"
    accessible={false}
  />
  <View style={styles.cardContent}>
    <Text style={styles.cardTitle}>{item.title}</Text>
    <Text>{item.description}</Text>
  </View>
</TouchableOpacity>
```

### Status Badge
```typescript
<View
  style={[styles.badge, { backgroundColor: getStatusColor(status) }]}
  accessibilityLabel={`Status: ${status}`}
  accessibilityRole="text"
>
  <Text style={styles.badgeText}>{status}</Text>
</View>
```

---

## Testing Utilities

### Test Helper: Check Accessibility
```typescript
import { render } from '@testing-library/react-native';

const testAccessibility = (component: React.ReactElement) => {
  const { getAllByRole } = render(component);

  // Check all buttons have labels
  const buttons = getAllByRole('button');
  buttons.forEach(button => {
    expect(button.props.accessibilityLabel).toBeTruthy();
  });
};

// Usage
testAccessibility(<MyComponent />);
```

### Test Helper: Verify Live Region
```typescript
const { getByText } = render(<FormWithValidation />);

const errorText = getByText('Invalid email format');
expect(errorText.parent?.props.accessibilityLiveRegion).toBe('polite');
```

### Test Helper: Check Focus Order
```typescript
const { UNSAFE_getAllByType } = render(<MyForm />);

const inputs = UNSAFE_getAllByType('TextInput');
inputs.forEach((input, index) => {
  expect(input.props.accessibilityLabel).toBeTruthy();
  // Verify focus order matches visual order
});
```

### Manual Test: Screen Reader Announcement
```typescript
import { AccessibilityInfo } from 'react-native';

// Manually announce to screen reader
AccessibilityInfo.announceForAccessibility(
  'Payment successful! Your consultation is confirmed.'
);
```

### Debug: Check Accessible Elements
```typescript
import { AccessibilityInfo } from 'react-native';

// Check if screen reader is running
const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
console.log('Screen reader enabled:', isScreenReaderEnabled);

// Listen for screen reader state changes
AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
  console.log('Screen reader changed:', enabled);
});
```

---

## Best Practices Checklist

### Every Button Should Have:
```typescript
<TouchableOpacity
  accessibilityRole="button"           // ✅ What it is
  accessibilityLabel="Save changes"     // ✅ Clear label
  accessibilityHint="Saves your data"   // ✅ What it does
  accessibilityState={{ disabled }}     // ✅ Current state
  onPress={handlePress}
>
```

### Every Input Should Have:
```typescript
<TextInput
  accessibilityLabel="Email address"    // ✅ What it is
  accessibilityHint="Enter your email"  // ✅ Guidance
  accessibilityRequired={true}          // ✅ Required flag
  // Error handling with live region ✅
/>
```

### Every List Should Have:
```typescript
<FlatList
  accessibilityRole="list"              // ✅ Semantic role
  accessibilityLabel="Payment history"  // ✅ What it contains
  // ✅ Each item accessible
/>
```

### Every Dynamic Content Should Have:
```typescript
<View accessibilityLiveRegion="polite">  // ✅ Live region
  {/* Dynamic content */}
</View>
```

### Every Decorative Element Should Have:
```typescript
<Ionicons
  importantForAccessibility="no"         // ✅ Hidden
  accessible={false}                     // ✅ Not focusable
/>
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Use generic labels
```typescript
<TouchableOpacity accessibilityLabel="Button">
  <Text>Delete</Text>
</TouchableOpacity>
```

### ✅ DO: Use descriptive labels
```typescript
<TouchableOpacity accessibilityLabel="Delete health record">
  <Text>Delete</Text>
</TouchableOpacity>
```

---

### ❌ DON'T: Announce visual appearance
```typescript
<TouchableOpacity accessibilityLabel="Red delete button">
```

### ✅ DO: Announce purpose
```typescript
<TouchableOpacity accessibilityLabel="Delete entry">
```

---

### ❌ DON'T: Forget live regions for errors
```typescript
{error && <Text>{error}</Text>}
```

### ✅ DO: Use live regions
```typescript
{error && (
  <View accessibilityLiveRegion="polite">
    <Text>{error}</Text>
  </View>
)}
```

---

### ❌ DON'T: Make decorative icons focusable
```typescript
<Ionicons name="arrow-forward" size={24} />
```

### ✅ DO: Hide decorative icons
```typescript
<Ionicons
  name="arrow-forward"
  size={24}
  importantForAccessibility="no"
  accessible={false}
/>
```

---

## Quick Reference Card

**Copy this to your desk:**

```
ACCESSIBILITY QUICK REFERENCE

Every Interactive Element Needs:
□ accessibilityRole="button" (or appropriate role)
□ accessibilityLabel="What it is"
□ accessibilityHint="What it does"
□ accessibilityState={{ disabled, selected, etc }}

Live Regions:
□ Polite: Form errors, status updates
□ Assertive: Critical alerts, urgent warnings

Hide Decorative Elements:
□ importantForAccessibility="no"
□ accessible={false}

Test With:
□ VoiceOver (iOS): Settings → Accessibility → VoiceOver
□ TalkBack (Android): Settings → Accessibility → TalkBack

Questions? See ACCESSIBILITY_README.md
```

---

**This snippets library provides ready-to-use code for all common accessibility patterns in MediMindPlus.**

**Last Updated:** February 9, 2026 | **Version:** 1.0
