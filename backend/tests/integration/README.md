# MediMindPlus Integration Tests

Comprehensive integration test suite for the MediMindPlus healthcare platform backend API.

## Overview

This test suite provides end-to-end testing for all critical backend endpoints:
- **Authentication** - User registration, login, token management
- **Consultations** - Telemedicine appointments and video sessions
- **Payments** - Stripe payment processing and billing
- **Health Risk** - AI-powered disease risk predictions
- Security features (rate limiting, audit logging)
- HIPAA compliance verification

## Test Suites

### 1. Authentication Tests (`auth.integration.test.ts`)

**Coverage: 37 test cases**

#### Registration Tests (`POST /api/auth/register`)
- ✅ Successful user registration
- ✅ Patient profile creation
- ✅ Duplicate email rejection
- ✅ Weak password validation
- ✅ Invalid email format validation
- ✅ Terms acceptance requirement
- ✅ Required fields validation
- ✅ Password hashing verification
- ✅ Email normalization (lowercase)
- ✅ Audit log creation

#### Login Tests (`POST /api/auth/login`)
- ✅ Successful login with valid credentials
- ✅ Invalid password rejection
- ✅ Non-existent user rejection
- ✅ Case-insensitive email handling
- ✅ Session creation
- ✅ Rate limiting after failed attempts
- ✅ Inactive user rejection
- ✅ Remember me functionality
- ✅ Audit log creation

#### Token Refresh Tests (`POST /api/auth/refresh`)
- ✅ Successful token refresh
- ✅ Invalid refresh token rejection
- ✅ Expired token rejection
- ✅ Unregistered token rejection
- ✅ Inactive user rejection
- ✅ Audit log creation

#### Logout Tests (`POST /api/auth/logout`)
- ✅ Successful logout
- ✅ Session invalidation
- ✅ Refresh token removal
- ✅ Graceful handling without auth header
- ✅ Expired token handling
- ✅ Audit log creation

#### Security & Compliance Tests
- ✅ No sensitive data exposure in responses
- ✅ SQL injection prevention
- ✅ Authentication event audit logging
- ✅ Unique session ID generation
- ✅ Required JWT claims validation

### 2. Consultations Tests (`consultations.integration.test.ts`)

**Coverage: 42+ test cases**

#### Provider Search & Discovery
- ✅ Search providers with filters (specialty, rating, fee)
- ✅ Get provider availability by date range
- ✅ Filter accepting patients
- ✅ Invalid date range handling
- ✅ Authentication requirements

#### Consultation Booking
- ✅ Book consultation successfully
- ✅ Required fields validation
- ✅ Default consultation duration (30 min)
- ✅ Authorization enforcement

#### Consultation Retrieval
- ✅ Get consultation by ID
- ✅ Get patient consultations with status filters
- ✅ Get provider consultations (provider-only)
- ✅ Prevent unauthorized access
- ✅ RBAC enforcement

#### Video Consultation Management
- ✅ Generate Twilio video access tokens
- ✅ Start consultation (provider-only)
- ✅ End consultation with notes
- ✅ Real-time vitals sharing
- ✅ Twilio webhook handling

#### Consultation Updates
- ✅ Update consultation notes (provider-only)
- ✅ Mark patient as no-show (provider-only)
- ✅ Cancel consultation with reason
- ✅ Submit patient review with ratings

#### Security & Compliance
- ✅ No PHI exposure in responses
- ✅ RBAC for provider-only endpoints
- ✅ Audit trail for all consultation events
- ✅ Authorization checks for cross-user access

### 3. Payments Tests (`payments.integration.test.ts`)

**Coverage: 35+ test cases**

#### Payment Intent Creation
- ✅ Create payment intent for consultation
- ✅ Calculate amount from provider fee
- ✅ Required fields validation
- ✅ Invalid consultationId rejection
- ✅ Correct currency (USD)

#### Payment Confirmation
- ✅ Confirm payment with valid intent
- ✅ Required paymentIntentId validation
- ✅ Invalid payment intent handling
- ✅ Authentication requirements

#### Refund Processing
- ✅ Process refund with reason
- ✅ Required fields validation
- ✅ Refund for cancelled consultations
- ✅ Authorization enforcement

#### Payment History
- ✅ Get payment history for patient
- ✅ Empty history for new patients
- ✅ No sensitive payment data exposure
- ✅ Prevent cross-user data access

#### Provider Earnings
- ✅ Get earnings summary for provider
- ✅ Require provider/admin role
- ✅ Zero earnings for new providers
- ✅ RBAC enforcement

#### Stripe Webhook
- ✅ Reject webhooks without signature
- ✅ Validate webhook signatures
- ✅ Handle missing webhook secret
- ✅ Process payment events

#### Payment Flow Integration
- ✅ Full flow: book → create intent → confirm → history
- ✅ Cancel → refund flow
- ✅ Concurrent payment operations

#### Security & Compliance
- ✅ No Stripe API keys in responses
- ✅ Audit logging for payment events
- ✅ PCI compliance (no card data stored)
- ✅ HTTPS enforcement in production

### 4. Health Risk Tests (`health-risk.integration.test.ts`)

**Coverage: 40+ test cases**

#### Diabetes Risk Assessment
- ✅ Get Type 2 Diabetes risk assessment
- ✅ Risk score (0-100) and level (low/moderate/high/very-high)
- ✅ Risk factors identification
- ✅ Personalized recommendations
- ✅ Provider access to patient data
- ✅ Authorization enforcement

#### Cardiovascular Risk Assessment
- ✅ Get cardiovascular disease risk
- ✅ Framingham Risk Score calculation
- ✅ Risk factors (age, BP, cholesterol, etc.)
- ✅ Evidence-based recommendations

#### Hypertension Risk Assessment
- ✅ Get hypertension risk assessment
- ✅ Blood pressure categorization (normal/elevated/stage1/stage2/crisis)
- ✅ Current BP readings (systolic/diastolic)
- ✅ Management recommendations

#### Mental Health Risk Assessment
- ✅ Get mental health risk assessment
- ✅ PHQ-9 depression screening
- ✅ GAD-7 anxiety screening
- ✅ Severity categorization
- ✅ Mental health resources

#### Cancer Screening Recommendations
- ✅ Get cancer screening recommendations
- ✅ Age-appropriate screenings
- ✅ Gender-specific screenings (prostate, breast, etc.)
- ✅ Screening rationale and frequency

#### Comprehensive Risk Report
- ✅ Generate comprehensive report (all assessments)
- ✅ Overall risk score calculation
- ✅ Top health risks identification
- ✅ Prioritized recommendations (high/medium/low)
- ✅ Report timestamp
- ✅ Provider access

#### Performance & Caching
- ✅ Cache risk assessment results
- ✅ Handle concurrent assessment requests
- ✅ Response time optimization

#### Security & Compliance
- ✅ No PHI in error messages
- ✅ HIPAA audit logging for all accesses
- ✅ RBAC enforcement
- ✅ Secure ML service communication (HTTPS)

#### Error Handling
- ✅ ML service unavailability handling
- ✅ Incomplete patient data handling
- ✅ Meaningful error messages

## Prerequisites

Before running the tests, ensure you have:

1. **Test Database Setup**
   ```bash
   # Create test database
   createdb medimind_test

   # Run migrations
   npm run db:migrate
   ```

2. **Environment Variables**
   Create a `.env.test` file:
   ```
   NODE_ENV=test
   DB_NAME=medimind_test
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   JWT_SECRET=test_jwt_secret_key_32_chars_min
   JWT_REFRESH_SECRET=test_refresh_secret_key_32_chars
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Redis Running**
   ```bash
   # macOS
   brew services start redis

   # Linux
   sudo systemctl start redis

   # Docker
   docker run -d -p 6379:6379 redis:latest
   ```

4. **PostgreSQL Running**
   ```bash
   # macOS
   brew services start postgresql

   # Linux
   sudo systemctl start postgresql

   # Docker
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
   ```

## Running the Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Specific Test Suites
```bash
# Authentication tests only
npm run test:integration -- auth.integration.test

# Consultations tests only
npm run test:integration -- consultations.integration.test

# Payments tests only
npm run test:integration -- payments.integration.test

# Health risk tests only
npm run test:integration -- health-risk.integration.test
```

### Run with Coverage
```bash
npm run test:integration:coverage
```

### Run in Watch Mode
```bash
npm run test:integration:watch
```

### Run with Verbose Output
```bash
npm run test:integration -- --verbose
```

## Test Structure

```
tests/
├── integration/
│   ├── auth.integration.test.ts              # Authentication test suite (37 tests)
│   ├── consultations.integration.test.ts     # Consultations test suite (42+ tests)
│   ├── payments.integration.test.ts          # Payments test suite (35+ tests)
│   ├── health-risk.integration.test.ts       # Health risk test suite (40+ tests)
│   ├── setup.ts                               # Test environment setup & matchers
│   ├── globalSetup.ts                         # Global before-all setup
│   ├── globalTeardown.ts                      # Global after-all cleanup
│   └── README.md                              # This file
├── helpers/
│   ├── testDatabase.ts                        # Database helper utilities
│   └── testUtils.ts                           # Common test utilities
└── ...
```

**Total Integration Test Coverage: 150+ test cases**

## Writing New Tests

### Basic Test Template

```typescript
import request from 'supertest';
import { Express } from 'express';

describe('Feature Tests', () => {
  let app: Express;
  let testUserId: string;

  beforeAll(async () => {
    const appModule = await import('../../src/index');
    app = appModule.default;
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should do something', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' })
      .expect(200);

    expect(response.body).toHaveProperty('expectedField');
  });
});
```

### Using Test Helpers

```typescript
import { createTestUserData, hashTestPassword } from '../helpers/testUtils';
import { TestDatabaseHelper } from '../helpers/testDatabase';

describe('Advanced Tests', () => {
  const dbHelper = new TestDatabaseHelper();

  beforeAll(async () => {
    await dbHelper.initialize();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await dbHelper.close();
  });

  it('should use helpers', async () => {
    const userData = createTestUserData({ role: 'provider' });
    const passwordHash = await hashTestPassword(userData.password);

    const user = await dbHelper.createTestUser({
      ...userData,
      passwordHash,
    });

    expect(user).toHaveProperty('id');
  });
});
```

### Custom Matchers

The test suite includes custom Jest matchers:

```typescript
it('should return valid tokens', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials)
    .expect(200);

  // Custom matchers
  expect(response.body.tokens.accessToken).toBeValidJWT();
  expect(response.body.user.id).toBeValidUUID();
  expect(response.body.user.createdAt).toBeISO8601();
});
```

## Test Data Management

### Automatic Cleanup

Tests automatically clean up their data in `afterEach` and `afterAll` hooks.

### Manual Cleanup

```bash
# Clean all test data
npm run db:cleanup:test
```

### Reset Test Database

```bash
# Reset and reseed test database
npm run db:reset:test
```

## Debugging Tests

### Run Single Test

```bash
npm run test:integration -- --testNamePattern="should register a new patient"
```

### Enable Debug Logging

```bash
DEBUG=* npm run test:integration
```

### Use Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --config jest.integration.config.js --runInBand
```

Then open `chrome://inspect` in Chrome.

## Continuous Integration

### GitHub Actions

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: medimind_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:latest
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate

      - name: Run integration tests
        run: npm run test:integration:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/integration/lcov.info
```

## Performance Benchmarks

Target performance metrics:
- Registration: < 500ms
- Login: < 300ms
- Token Refresh: < 100ms
- Logout: < 100ms

## Security Considerations

### Test Isolation
- Each test runs in isolation
- Database transactions are rolled back
- Redis keys are namespace
d
- No cross-test contamination

### Secrets Management
- Never commit real secrets
- Use test-specific environment variables
- Rotate test credentials regularly

### HIPAA Compliance
- Audit all data access
- Encrypt sensitive test data
- Log all security events
- No PHI in test data

## Troubleshooting

### Tests Timeout

Increase timeout in jest.config:
```javascript
testTimeout: 60000 // 60 seconds
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep medimind_test

# Recreate database
dropdb medimind_test && createdb medimind_test
```

### Redis Connection Errors

```bash
# Check Redis is running
redis-cli ping

# Restart Redis
brew services restart redis
```

### Port Conflicts

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names (it should...)
3. Include both positive and negative test cases
4. Test edge cases and error handling
5. Add comments for complex test logic
6. Update this README with new test categories

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)
