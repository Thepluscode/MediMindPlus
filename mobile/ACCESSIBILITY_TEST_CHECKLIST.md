# MediMindPlus Mobile - Quick Accessibility Test Checklist

## VoiceOver Testing (iOS)

### Setup
- [ ] VoiceOver enabled (Settings → Accessibility → VoiceOver)
- [ ] Rotor configured for efficient navigation
- [ ] Test device: iPhone 8+ running iOS 14.0+

### General Tests
- [ ] All buttons and links are focusable
- [ ] Focus order is logical (top to bottom, left to right)
- [ ] All interactive elements have clear labels
- [ ] Decorative icons are hidden from VoiceOver
- [ ] Images have appropriate alt text or are marked decorative

### Dynamic Content
- [ ] Form errors announce immediately (polite)
- [ ] Loading states announce "loading" or "busy"
- [ ] Success messages announce after save
- [ ] Password strength updates announce
- [ ] Search results count announces
- [ ] Critical medical findings announce assertively

### Navigation
- [ ] Can navigate to all visible elements
- [ ] Can navigate away from all elements (no focus traps)
- [ ] Modal dialogs trap focus appropriately
- [ ] Closing modals returns focus correctly
- [ ] Swipe gestures work for all navigation

---

## TalkBack Testing (Android)

### Setup
- [ ] TalkBack enabled (Settings → Accessibility → TalkBack)
- [ ] Reading controls configured
- [ ] Test device: Android 8.0+ (API 26+)

### General Tests
- [ ] All buttons and links are focusable
- [ ] Explore by touch works correctly
- [ ] All interactive elements have clear labels
- [ ] Decorative icons hidden (importantForAccessibility="no")
- [ ] Images have meaningful content descriptions

### Dynamic Content
- [ ] Form errors interrupt with polite live region
- [ ] Critical alerts use assertive live region
- [ ] Loading spinners announce loading state
- [ ] Payment processing states announce
- [ ] AI analysis progress announces
- [ ] Results completion announces

### Navigation
- [ ] Swipe left/right navigation is logical
- [ ] Local context menu accessible (swipe up then right)
- [ ] Global context menu accessible (swipe down then left)
- [ ] Back button works as expected
- [ ] ScrollViews scroll smoothly

---

## Critical User Flow Tests

### 1. Login Flow
- [ ] Email field: "Email address text field"
- [ ] Password field: "Password secure text field"
- [ ] Show password toggle announces state
- [ ] Login errors announce immediately
- [ ] Login success announces

### 2. Health Data Entry
- [ ] Category selection announces category
- [ ] Metric selection announces metric
- [ ] Input fields have clear labels
- [ ] Date picker is accessible
- [ ] Save success announces

### 3. Provider Search
- [ ] Search input is clearly labeled
- [ ] Specialty filters announce selected state
- [ ] Results count announces after search
- [ ] Provider cards announce name, specialty, rating, fee
- [ ] Empty state announces clearly

### 4. Payment Flow
- [ ] Payment amount is announced clearly
- [ ] Pay button announces amount
- [ ] Processing state announces "Processing payment, please wait"
- [ ] Success announces assertively
- [ ] Failure announces with details

### 5. AI Medical Analysis
- [ ] Upload button announces purpose
- [ ] Analysis progress announces with live region
- [ ] Results completion announces
- [ ] Critical findings announce assertively
- [ ] All pathology findings readable

### 6. AI Chat
- [ ] Welcome message reads on load
- [ ] Message input clearly labeled
- [ ] AI typing indicator announces
- [ ] Messages distinguish user vs AI
- [ ] Send button state changes announce

---

## Component-Specific Tests

### Forms
- [ ] All inputs have labels (not just placeholders)
- [ ] Required fields marked as required
- [ ] Error messages linked to fields
- [ ] Validation errors announce immediately
- [ ] Success confirmations announce

### Buttons
- [ ] All buttons announce as "button"
- [ ] Disabled state announced
- [ ] Loading state announced ("busy")
- [ ] Icon-only buttons have descriptive labels

### Lists
- [ ] Lists announce as "list" with item count
- [ ] List items announce all key information
- [ ] Pull-to-refresh announces action
- [ ] Empty states announce clearly
- [ ] Loading more announces

### Modals/Dialogs
- [ ] Modal opening announces modal title
- [ ] Focus trapped within modal
- [ ] Close button is accessible
- [ ] Closing returns focus to trigger

---

## Common Issues to Check

### Focus Issues
- [ ] Focus not stuck in any area
- [ ] No invisible elements in focus order
- [ ] Focus order matches visual layout
- [ ] Focus visible (if using external keyboard)

### Announcement Issues
- [ ] No generic labels like "Button"
- [ ] No technical IDs announced
- [ ] Icons don't announce appearance
- [ ] Dynamic changes are announced
- [ ] Announcements not too verbose

### Control Issues
- [ ] All buttons activatable with double-tap
- [ ] Switches announce state changes
- [ ] Text inputs show keyboard on focus
- [ ] Custom controls work as expected

### Navigation Issues
- [ ] All visible elements are reachable
- [ ] Can escape from all UI sections
- [ ] Headers distinguishable from content
- [ ] Tab order is logical

---

## Priority Screens to Test

### P0 (Critical - Must Pass)
- [ ] ModernLoginScreen
- [ ] ModernRegisterScreen
- [ ] PaymentCheckoutScreen
- [ ] ChestXrayAnalysisScreen (critical findings)
- [ ] AIDoctorChatScreen

### P1 (High Priority)
- [ ] LogHealthDataScreen
- [ ] ProviderSearchScreen
- [ ] PaymentHistoryScreen
- [ ] HealthRiskDashboard
- [ ] ChangePasswordScreen

### P2 (Important)
- [ ] EditProfileScreen
- [ ] ConsentManagementScreen
- [ ] SettingsScreen
- [ ] MedicalHistoryScreen
- [ ] PrescriptionManagementScreen

---

## Quick Reference: Screen Reader Gestures

### VoiceOver (iOS)
- **Navigate:** Swipe right/left
- **Activate:** Double tap
- **Read all:** Two-finger swipe up
- **Pause:** Two-finger tap
- **Rotor:** Two fingers, twist
- **Scroll:** Three-finger swipe up/down

### TalkBack (Android)
- **Navigate:** Swipe right/left
- **Activate:** Double tap
- **Read all:** Swipe down then right
- **Local menu:** Swipe up then right
- **Global menu:** Swipe down then left
- **Scroll:** Two-finger swipe up/down

---

## Sign-Off

**Tester Name:** _________________

**Date:** _________________

**Device/OS:** _________________

**Screen Reader:** [ ] VoiceOver [ ] TalkBack

**Overall Status:** [ ] Pass [ ] Pass with Issues [ ] Fail

**Critical Issues Found:** _________________

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

**Quick Stats:**
- Total Screens Tested: _____ / 66
- Critical Issues: _____
- High Priority Issues: _____
- Medium/Low Issues: _____
- Passed: [ ] Yes [ ] No
