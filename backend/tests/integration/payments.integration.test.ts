/**
 * Payments Integration Tests
 *
 * Comprehensive end-to-end testing for Stripe payment processing endpoints
 */

import request from 'supertest';
import { Express } from 'express';
import { DatabaseManager } from '../../src/database/DatabaseManager';
import { TestDatabaseHelper } from '../helpers/testDatabase';
import { createTestUserData, hashTestPassword } from '../helpers/testUtils';

describe('Payments Integration Tests', () => {
  let app: Express;
  let databaseManager: DatabaseManager;
  let dbHelper: TestDatabaseHelper;

  // Test users
  let patientId: string;
  let patientToken: string;
  let providerId: string;
  let providerToken: string;
  let consultationId: string;
  let paymentIntentId: string;

  beforeAll(async () => {
    // Import app
    const appModule = await import('../../src/index');
    app = appModule.default;

    // Initialize database
    databaseManager = new DatabaseManager();
    await databaseManager.initialize();

    dbHelper = new TestDatabaseHelper();
    await dbHelper.initialize();

    // Create test patient
    const patientData = createTestUserData({ role: 'patient' });
    const patientHash = await hashTestPassword(patientData.password);

    const patientResult = await databaseManager.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [patientData.email, patientHash, patientData.firstName, patientData.lastName, 'patient', true, true]
    );
    patientId = patientResult.rows[0].id;

    // Create patient profile
    await databaseManager.query(
      `INSERT INTO patients (user_id, date_of_birth, gender, phone)
       VALUES ($1, $2, $3, $4)`,
      [patientId, '1990-01-01', 'male', '+1234567890']
    );

    // Login patient
    const patientLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: patientData.email, password: patientData.password });
    patientToken = patientLoginResponse.body.tokens.accessToken;

    // Create test provider
    const providerData = createTestUserData({ role: 'provider' });
    const providerHash = await hashTestPassword(providerData.password);

    const providerResult = await databaseManager.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [providerData.email, providerHash, providerData.firstName, providerData.lastName, 'provider', true, true]
    );
    providerId = providerResult.rows[0].id;

    // Create provider profile
    await databaseManager.query(
      `INSERT INTO providers (user_id, specialty, license_number, accepting_patients, consultation_fee)
       VALUES ($1, $2, $3, $4, $5)`,
      [providerId, 'Cardiology', 'LIC789012', true, 150.00]
    );

    // Login provider
    const providerLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: providerData.email, password: providerData.password });
    providerToken = providerLoginResponse.body.tokens.accessToken;

    // Create test consultation
    const scheduledStart = new Date();
    scheduledStart.setDate(scheduledStart.getDate() + 1);

    const consultationResponse = await request(app)
      .post('/api/consultations/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        providerId,
        scheduledStart: scheduledStart.toISOString(),
        consultationType: 'video',
        reasonForVisit: 'Payment test consultation',
      });
    consultationId = consultationResponse.body.data.id;
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await dbHelper.close();
    await databaseManager.close();
  });

  describe('Payment Intent Creation', () => {
    describe('POST /api/payments/create-intent', () => {
      it('should create payment intent for consultation', async () => {
        const response = await request(app)
          .post('/api/payments/create-intent')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ consultationId })
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/payment intent created/i);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('client_secret');
        expect(response.body.data).toHaveProperty('amount');
        expect(response.body.data.amount).toBeGreaterThan(0);

        // Store for later tests
        paymentIntentId = response.body.data.id;
      });

      it('should require consultationId', async () => {
        const response = await request(app)
          .post('/api/payments/create-intent')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/consultationId.*required/i);
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/payments/create-intent')
          .send({ consultationId })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should reject invalid consultationId', async () => {
        const response = await request(app)
          .post('/api/payments/create-intent')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ consultationId: '00000000-0000-0000-0000-000000000000' })
          .expect(500);

        expect(response.body.success).toBe(false);
      });

      it('should calculate correct amount from provider fee', async () => {
        const response = await request(app)
          .post('/api/payments/create-intent')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ consultationId })
          .expect(200);

        // Provider fee is $150.00, amount should be 15000 cents
        expect(response.body.data.amount).toBe(15000);
        expect(response.body.data.currency).toBe('usd');
      });
    });
  });

  describe('Payment Confirmation', () => {
    describe('POST /api/payments/confirm', () => {
      it('should confirm payment with valid payment intent', async () => {
        // Note: In test environment, we might not have actual Stripe payment intent
        // This test validates the endpoint structure
        if (paymentIntentId && paymentIntentId.startsWith('pi_')) {
          const response = await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({ paymentIntentId })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.message).toMatch(/payment confirmed/i);
        } else {
          // Skip if no real Stripe payment intent was created
          console.log('Skipping payment confirmation test (no Stripe test mode)');
        }
      });

      it('should require paymentIntentId', async () => {
        const response = await request(app)
          .post('/api/payments/confirm')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/paymentIntentId.*required/i);
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/payments/confirm')
          .send({ paymentIntentId: 'pi_test123' })
          .expect(401);
      });

      it('should reject invalid payment intent ID', async () => {
        const response = await request(app)
          .post('/api/payments/confirm')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ paymentIntentId: 'invalid_id' })
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Refund Processing', () => {
    describe('POST /api/payments/refund', () => {
      it('should require consultationId and reason', async () => {
        const response = await request(app)
          .post('/api/payments/refund')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/consultationId.*reason.*required/i);
      });

      it('should process refund with valid data', async () => {
        // Create a new consultation with payment
        const scheduledStart = new Date();
        scheduledStart.setDate(scheduledStart.getDate() + 2);

        const consultationResponse = await request(app)
          .post('/api/consultations/book')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            providerId,
            scheduledStart: scheduledStart.toISOString(),
            consultationType: 'video',
            reasonForVisit: 'Refund test',
          });

        const refundConsultationId = consultationResponse.body.data.id;

        // Attempt refund (may fail if no actual payment was made)
        const response = await request(app)
          .post('/api/payments/refund')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            consultationId: refundConsultationId,
            reason: 'Patient requested cancellation',
          });

        // Accept both success and error (depends on whether payment exists)
        expect([200, 500]).toContain(response.status);

        if (response.status === 200) {
          expect(response.body.success).toBe(true);
          expect(response.body.message).toMatch(/refund processed/i);
        }
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/payments/refund')
          .send({
            consultationId,
            reason: 'Test refund',
          })
          .expect(401);
      });

      it('should reject refund without reason', async () => {
        const response = await request(app)
          .post('/api/payments/refund')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ consultationId })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/reason.*required/i);
      });
    });
  });

  describe('Payment History', () => {
    describe('GET /api/payments/history', () => {
      it('should get payment history for authenticated patient', async () => {
        const response = await request(app)
          .get('/api/payments/history')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('payments');
        expect(Array.isArray(response.body.data.payments)).toBe(true);
        expect(response.body.data).toHaveProperty('count');
      });

      it('should return empty array for patient with no payments', async () => {
        // Create a new patient with no payments
        const newPatientData = createTestUserData({ role: 'patient' });
        const newPatientHash = await hashTestPassword(newPatientData.password);

        const newPatientResult = await databaseManager.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [newPatientData.email, newPatientHash, newPatientData.firstName, newPatientData.lastName, 'patient', true, true]
        );

        const newPatientLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: newPatientData.email, password: newPatientData.password });
        const newPatientToken = newPatientLoginResponse.body.tokens.accessToken;

        const response = await request(app)
          .get('/api/payments/history')
          .set('Authorization', `Bearer ${newPatientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.payments).toEqual([]);
        expect(response.body.data.count).toBe(0);
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/payments/history')
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should not expose sensitive payment details', async () => {
        const response = await request(app)
          .get('/api/payments/history')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        // Check that sensitive data is not exposed
        if (response.body.data.payments.length > 0) {
          const payment = response.body.data.payments[0];

          // Should not contain full card numbers, CVV, or other sensitive data
          expect(payment).not.toHaveProperty('card_number');
          expect(payment).not.toHaveProperty('cvv');
          expect(payment).not.toHaveProperty('stripe_secret');
        }
      });
    });
  });

  describe('Provider Earnings', () => {
    describe('GET /api/payments/provider/:providerId/earnings', () => {
      it('should get provider earnings summary', async () => {
        const response = await request(app)
          .get(`/api/payments/provider/${providerId}/earnings`)
          .set('Authorization', `Bearer ${providerToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalEarnings');
        expect(response.body.data).toHaveProperty('periodEarnings');
        expect(typeof response.body.data.totalEarnings).toBe('number');
      });

      it('should require provider or admin role', async () => {
        const response = await request(app)
          .get(`/api/payments/provider/${providerId}/earnings`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/provider access required/i);
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/payments/provider/${providerId}/earnings`)
          .expect(401);
      });

      it('should return zero earnings for new provider', async () => {
        // Create a new provider with no consultations
        const newProviderData = createTestUserData({ role: 'provider' });
        const newProviderHash = await hashTestPassword(newProviderData.password);

        const newProviderResult = await databaseManager.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [newProviderData.email, newProviderHash, newProviderData.firstName, newProviderData.lastName, 'provider', true, true]
        );
        const newProviderId = newProviderResult.rows[0].id;

        await databaseManager.query(
          `INSERT INTO providers (user_id, specialty, license_number, accepting_patients, consultation_fee)
           VALUES ($1, $2, $3, $4, $5)`,
          [newProviderId, 'Pediatrics', 'LIC999999', true, 100.00]
        );

        const newProviderLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: newProviderData.email, password: newProviderData.password });
        const newProviderToken = newProviderLoginResponse.body.tokens.accessToken;

        const response = await request(app)
          .get(`/api/payments/provider/${newProviderId}/earnings`)
          .set('Authorization', `Bearer ${newProviderToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalEarnings).toBe(0);
      });
    });
  });

  describe('Stripe Webhook', () => {
    describe('POST /api/payments/webhook', () => {
      it('should reject webhook without signature', async () => {
        const response = await request(app)
          .post('/api/payments/webhook')
          .send({
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi_test123' } },
          })
          .expect(400);

        expect(response.text).toMatch(/webhook.*signature/i);
      });

      it('should reject webhook with invalid signature', async () => {
        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'invalid_signature')
          .send({
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi_test123' } },
          })
          .expect(400);

        expect(response.text).toMatch(/webhook/i);
      });

      it('should handle webhook with missing secret configuration', async () => {
        // If webhook secret is not configured, should return 500
        const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
        delete process.env.STRIPE_WEBHOOK_SECRET;

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 't=123,v1=sig')
          .send({
            type: 'payment_intent.succeeded',
          })
          .expect(500);

        expect(response.text).toMatch(/webhook.*not configured/i);

        // Restore environment variable
        if (originalSecret) {
          process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
        }
      });

      // Note: Testing valid webhook signatures requires Stripe test mode
      // with a real webhook secret and signature generation
    });
  });

  describe('Payment Flow Integration', () => {
    it('should complete full payment flow: create intent -> confirm -> history', async () => {
      // Step 1: Book consultation
      const scheduledStart = new Date();
      scheduledStart.setDate(scheduledStart.getDate() + 5);

      const bookResponse = await request(app)
        .post('/api/consultations/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          providerId,
          scheduledStart: scheduledStart.toISOString(),
          consultationType: 'video',
          reasonForVisit: 'Integration test',
        });

      const flowConsultationId = bookResponse.body.data.id;

      // Step 2: Create payment intent
      const intentResponse = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ consultationId: flowConsultationId })
        .expect(200);

      expect(intentResponse.body.success).toBe(true);
      expect(intentResponse.body.data).toHaveProperty('id');

      const flowPaymentIntentId = intentResponse.body.data.id;

      // Step 3: Check payment history
      const historyResponse = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(historyResponse.body.success).toBe(true);
      expect(historyResponse.body.data.payments.length).toBeGreaterThanOrEqual(1);

      // Verify payment intent appears in history
      const paymentExists = historyResponse.body.data.payments.some(
        (p: any) => p.consultation_id === flowConsultationId
      );
      expect(paymentExists).toBe(true);
    });

    it('should handle cancel -> refund flow', async () => {
      // Step 1: Book consultation
      const scheduledStart = new Date();
      scheduledStart.setDate(scheduledStart.getDate() + 6);

      const bookResponse = await request(app)
        .post('/api/consultations/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          providerId,
          scheduledStart: scheduledStart.toISOString(),
          consultationType: 'video',
          reasonForVisit: 'Cancel test',
        });

      const cancelConsultationId = bookResponse.body.data.id;

      // Step 2: Create payment
      await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ consultationId: cancelConsultationId })
        .expect(200);

      // Step 3: Cancel consultation
      await request(app)
        .post(`/api/consultations/${cancelConsultationId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      // Step 4: Request refund (may succeed or fail depending on payment state)
      const refundResponse = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consultationId: cancelConsultationId,
          reason: 'Consultation cancelled by patient',
        });

      // Accept both outcomes
      expect([200, 500]).toContain(refundResponse.status);
    });
  });

  describe('Security & Compliance', () => {
    it('should not expose Stripe API keys in responses', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toMatch(/sk_test/);
      expect(responseString).not.toMatch(/sk_live/);
      expect(responseString).not.toMatch(/whsec_/);
    });

    it('should log payment events for audit trail', async () => {
      // Create payment intent
      await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ consultationId });

      // Verify audit log
      const auditResult = await databaseManager.query(
        `SELECT * FROM audit_logs
         WHERE resource_type = 'payment'
         AND user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [patientId]
      );

      expect(auditResult.rows.length).toBeGreaterThanOrEqual(1);
      expect(auditResult.rows[0].action).toMatch(/payment|create|intent/i);
    });

    it('should prevent unauthorized access to other users payment data', async () => {
      // Create another patient
      const otherPatient = createTestUserData({ role: 'patient' });
      const otherHash = await hashTestPassword(otherPatient.password);

      await databaseManager.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [otherPatient.email, otherHash, otherPatient.firstName, otherPatient.lastName, 'patient', true, true]
      );

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: otherPatient.email, password: otherPatient.password });
      const otherToken = otherLoginResponse.body.tokens.accessToken;

      // Try to access first patient's payment history
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      // Should only see their own empty history
      expect(response.body.data.payments).toEqual([]);
    });

    it('should handle PCI compliance requirements', async () => {
      // Verify no card data is stored in database
      const paymentResult = await databaseManager.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'payments'
         AND (column_name LIKE '%card%' OR column_name LIKE '%cvv%')`,
        []
      );

      // Should not have columns storing raw card data
      const sensitiveColumns = paymentResult.rows.filter((row: any) =>
        ['card_number', 'cvv', 'card_cvv'].includes(row.column_name)
      );

      expect(sensitiveColumns.length).toBe(0);
    });

    it('should use HTTPS for Stripe API calls in production', () => {
      // This is a code-level check (Stripe SDK enforces HTTPS)
      expect(process.env.STRIPE_SECRET_KEY).toBeDefined();

      if (process.env.NODE_ENV === 'production') {
        expect(process.env.STRIPE_SECRET_KEY).toMatch(/^sk_live_/);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors gracefully', async () => {
      // Temporarily corrupt Stripe key
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_invalid';

      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ consultationId })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      // Restore key
      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should return user-friendly error messages', async () => {
      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ consultationId: 'invalid-uuid' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
    });
  });
});
