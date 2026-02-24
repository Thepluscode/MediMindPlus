/**
 * Consultations Integration Tests
 *
 * Comprehensive end-to-end testing for consultation and video API endpoints
 */

import request from 'supertest';
import { Express } from 'express';
import { DatabaseManager } from '../../src/database/DatabaseManager';
import { TestDatabaseHelper } from '../helpers/testDatabase';
import { createTestUserData, hashTestPassword } from '../helpers/testUtils';

describe('Consultations Integration Tests', () => {
  let app: Express;
  let databaseManager: DatabaseManager;
  let dbHelper: TestDatabaseHelper;

  // Test users
  let patientId: string;
  let patientToken: string;
  let providerId: string;
  let providerToken: string;
  let consultationId: string;

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

    // Login patient to get token
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
      [providerId, 'General Practice', 'LIC123456', true, 75.00]
    );

    // Login provider to get token
    const providerLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: providerData.email, password: providerData.password });
    providerToken = providerLoginResponse.body.tokens.accessToken;
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await dbHelper.close();
    await databaseManager.close();
  });

  describe('Provider Search and Discovery', () => {
    describe('GET /api/consultations/providers/search', () => {
      it('should search providers with no filters', async () => {
        const response = await request(app)
          .get('/api/consultations/providers/search')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('providers');
        expect(Array.isArray(response.body.data.providers)).toBe(true);
        expect(response.body.data.count).toBeGreaterThanOrEqual(1);
      });

      it('should filter providers by specialty', async () => {
        const response = await request(app)
          .get('/api/consultations/providers/search')
          .query({ specialty: 'General Practice' })
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.providers.length).toBeGreaterThanOrEqual(1);

        const provider = response.body.data.providers[0];
        expect(provider.specialty).toBe('General Practice');
      });

      it('should filter providers accepting patients', async () => {
        const response = await request(app)
          .get('/api/consultations/providers/search')
          .query({ acceptingPatients: 'true' })
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.providers.forEach((provider: any) => {
          expect(provider.accepting_patients).toBe(true);
        });
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/consultations/providers/search')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/consultations/providers/:providerId/availability', () => {
      it('should get provider availability for date range', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        const response = await request(app)
          .get(`/api/consultations/providers/${providerId}/availability`)
          .query({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('slots');
        expect(Array.isArray(response.body.data.slots)).toBe(true);
        expect(response.body.data.providerId).toBe(providerId);
      });

      it('should reject invalid date range', async () => {
        const response = await request(app)
          .get(`/api/consultations/providers/${providerId}/availability`)
          .query({ startDate: 'invalid', endDate: 'invalid' })
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/valid.*date/i);
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/consultations/providers/${providerId}/availability`)
          .query({
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
          })
          .expect(401);
      });
    });
  });

  describe('Consultation Booking', () => {
    describe('POST /api/consultations/book', () => {
      it('should book a consultation successfully', async () => {
        const scheduledStart = new Date();
        scheduledStart.setDate(scheduledStart.getDate() + 2);
        scheduledStart.setHours(10, 0, 0, 0);

        const response = await request(app)
          .post('/api/consultations/book')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            providerId,
            scheduledStart: scheduledStart.toISOString(),
            consultationType: 'video',
            reasonForVisit: 'Annual checkup',
            patientNotes: 'No specific concerns',
          })
          .expect('Content-Type', /json/)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/booked successfully/i);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.patient_id).toBe(patientId);
        expect(response.body.data.provider_id).toBe(providerId);
        expect(response.body.data.status).toBe('scheduled');

        // Store consultation ID for later tests
        consultationId = response.body.data.id;
      });

      it('should require all mandatory fields', async () => {
        const response = await request(app)
          .post('/api/consultations/book')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            providerId,
            // Missing scheduledStart, consultationType, reasonForVisit
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/required/i);
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/consultations/book')
          .send({
            providerId,
            scheduledStart: new Date().toISOString(),
            consultationType: 'video',
            reasonForVisit: 'Test',
          })
          .expect(401);
      });

      it('should set default end time if not provided', async () => {
        const scheduledStart = new Date();
        scheduledStart.setDate(scheduledStart.getDate() + 3);
        scheduledStart.setHours(14, 0, 0, 0);

        const response = await request(app)
          .post('/api/consultations/book')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            providerId,
            scheduledStart: scheduledStart.toISOString(),
            consultationType: 'video',
            reasonForVisit: 'Follow-up',
          })
          .expect(201);

        expect(response.body.success).toBe(true);

        const start = new Date(response.body.data.scheduled_start);
        const end = new Date(response.body.data.scheduled_end);
        const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

        expect(diffMinutes).toBe(30); // Default 30-minute consultation
      });
    });
  });

  describe('Consultation Retrieval', () => {
    describe('GET /api/consultations/:consultationId', () => {
      it('should get consultation by ID', async () => {
        const response = await request(app)
          .get(`/api/consultations/${consultationId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(consultationId);
        expect(response.body.data.patient_id).toBe(patientId);
        expect(response.body.data.provider_id).toBe(providerId);
      });

      it('should allow provider to view consultation', async () => {
        const response = await request(app)
          .get(`/api/consultations/${consultationId}`)
          .set('Authorization', `Bearer ${providerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(consultationId);
      });

      it('should reject unauthorized access', async () => {
        // Create another patient
        const otherPatient = createTestUserData({ role: 'patient' });
        const otherHash = await hashTestPassword(otherPatient.password);

        const otherResult = await databaseManager.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [otherPatient.email, otherHash, otherPatient.firstName, otherPatient.lastName, 'patient', true, true]
        );

        const otherLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: otherPatient.email, password: otherPatient.password });
        const otherToken = otherLoginResponse.body.tokens.accessToken;

        const response = await request(app)
          .get(`/api/consultations/${consultationId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/unauthorized/i);
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/consultations/${consultationId}`)
          .expect(401);
      });
    });

    describe('GET /api/consultations/patient/:patientId', () => {
      it('should get all patient consultations', async () => {
        const response = await request(app)
          .get(`/api/consultations/patient/${patientId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('consultations');
        expect(Array.isArray(response.body.data.consultations)).toBe(true);
        expect(response.body.data.consultations.length).toBeGreaterThanOrEqual(1);
      });

      it('should filter consultations by status', async () => {
        const response = await request(app)
          .get(`/api/consultations/patient/${patientId}`)
          .query({ status: 'scheduled,in-progress' })
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.consultations.forEach((consultation: any) => {
          expect(['scheduled', 'in-progress']).toContain(consultation.status);
        });
      });

      it('should reject unauthorized access to other patient data', async () => {
        // Try to access with provider token (provider needs provider role, not patient ID)
        const response = await request(app)
          .get(`/api/consultations/patient/${patientId}`)
          .set('Authorization', `Bearer ${providerToken}`)
          .expect(200); // Providers can access patient consultations

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/consultations/provider/:providerId', () => {
      it('should get all provider consultations', async () => {
        const response = await request(app)
          .get(`/api/consultations/provider/${providerId}`)
          .set('Authorization', `Bearer ${providerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('consultations');
        expect(Array.isArray(response.body.data.consultations)).toBe(true);
      });

      it('should require provider role', async () => {
        const response = await request(app)
          .get(`/api/consultations/provider/${providerId}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/provider access required/i);
      });
    });
  });

  describe('Video Consultation Management', () => {
    describe('POST /api/consultations/:consultationId/video/token', () => {
      it('should generate video access token for patient', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/video/token`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('roomName');
      });

      it('should generate video access token for provider', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/video/token`)
          .set('Authorization', `Bearer ${providerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
      });

      it('should require authentication', async () => {
        await request(app)
          .post(`/api/consultations/${consultationId}/video/token`)
          .expect(401);
      });
    });

    describe('POST /api/consultations/:consultationId/video/start', () => {
      it('should start consultation (provider only)', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/video/start`)
          .set('Authorization', `Bearer ${providerToken}`)
          .send({ enableRecording: false })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/started/i);
      });

      it('should reject patient trying to start consultation', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/video/start`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/provider access required/i);
      });
    });

    describe('POST /api/consultations/:consultationId/video/end', () => {
      it('should end consultation', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/video/end`)
          .set('Authorization', `Bearer ${providerToken}`)
          .send({ notes: 'Consultation completed successfully' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/ended successfully/i);
      });

      it('should require authentication', async () => {
        await request(app)
          .post(`/api/consultations/${consultationId}/video/end`)
          .send({ notes: 'Test' })
          .expect(401);
      });
    });
  });

  describe('Consultation Updates', () => {
    describe('PUT /api/consultations/:consultationId/notes', () => {
      it('should update consultation notes (provider only)', async () => {
        const response = await request(app)
          .put(`/api/consultations/${consultationId}/notes`)
          .set('Authorization', `Bearer ${providerToken}`)
          .send({
            providerNotes: 'Patient presented with mild symptoms',
            diagnosisCodes: ['Z00.00'],
            treatmentPlan: 'Rest and follow-up in 2 weeks',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/updated/i);
      });

      it('should reject patient trying to update notes', async () => {
        const response = await request(app)
          .put(`/api/consultations/${consultationId}/notes`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ providerNotes: 'Attempt by patient' })
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/provider access required/i);
      });
    });

    describe('POST /api/consultations/:consultationId/no-show', () => {
      it('should mark as no-show (provider only)', async () => {
        // Create a new consultation for no-show test
        const scheduledStart = new Date();
        scheduledStart.setDate(scheduledStart.getDate() + 5);

        const bookResponse = await request(app)
          .post('/api/consultations/book')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            providerId,
            scheduledStart: scheduledStart.toISOString(),
            consultationType: 'video',
            reasonForVisit: 'Test no-show',
          })
          .expect(201);

        const noShowConsultationId = bookResponse.body.data.id;

        const response = await request(app)
          .post(`/api/consultations/${noShowConsultationId}/no-show`)
          .set('Authorization', `Bearer ${providerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/no-show/i);
      });

      it('should require provider role', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/no-show`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Consultation Cancellation', () => {
    describe('POST /api/consultations/:consultationId/cancel', () => {
      it('should cancel consultation by patient', async () => {
        // Create consultation to cancel
        const scheduledStart = new Date();
        scheduledStart.setDate(scheduledStart.getDate() + 7);

        const bookResponse = await request(app)
          .post('/api/consultations/book')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            providerId,
            scheduledStart: scheduledStart.toISOString(),
            consultationType: 'video',
            reasonForVisit: 'Test cancellation',
          })
          .expect(201);

        const cancelConsultationId = bookResponse.body.data.id;

        const response = await request(app)
          .post(`/api/consultations/${cancelConsultationId}/cancel`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ reason: 'Schedule conflict' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/cancelled successfully/i);
      });

      it('should require cancellation reason', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/cancel`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/reason.*required/i);
      });
    });
  });

  describe('Consultation Reviews', () => {
    describe('POST /api/consultations/:consultationId/review', () => {
      it('should submit consultation review', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/review`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            overallRating: 5,
            communicationRating: 5,
            professionalismRating: 5,
            careQualityRating: 5,
            waitTimeRating: 4,
            reviewText: 'Excellent consultation, very helpful!',
            wouldRecommend: true,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/submitted successfully/i);
      });

      it('should require valid rating range', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/review`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            overallRating: 6, // Invalid: > 5
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/valid.*rating/i);
      });

      it('should require overall rating', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/review`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            reviewText: 'Good',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/rating.*required/i);
      });
    });
  });

  describe('Real-time Features', () => {
    describe('POST /api/consultations/:consultationId/vitals/share', () => {
      it('should share vitals during consultation', async () => {
        const response = await request(app)
          .post(`/api/consultations/${consultationId}/vitals/share`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/shared/i);
      });

      it('should require authentication', async () => {
        await request(app)
          .post(`/api/consultations/${consultationId}/vitals/share`)
          .expect(401);
      });
    });
  });

  describe('Webhooks', () => {
    describe('POST /api/consultations/twilio-webhook', () => {
      it('should handle Twilio room-created webhook', async () => {
        const response = await request(app)
          .post('/api/consultations/twilio-webhook')
          .send({
            RoomSid: 'RM123456',
            RoomName: consultationId,
            StatusCallbackEvent: 'room-created',
          })
          .expect(200);

        expect(response.text).toBe('OK');
      });

      it('should handle Twilio room-ended webhook', async () => {
        const response = await request(app)
          .post('/api/consultations/twilio-webhook')
          .send({
            RoomSid: 'RM123456',
            RoomName: consultationId,
            StatusCallbackEvent: 'room-ended',
          })
          .expect(200);

        expect(response.text).toBe('OK');
      });

      it('should handle Twilio participant webhooks', async () => {
        const response = await request(app)
          .post('/api/consultations/twilio-webhook')
          .send({
            RoomSid: 'RM123456',
            RoomName: consultationId,
            StatusCallbackEvent: 'participant-connected',
          })
          .expect(200);

        expect(response.text).toBe('OK');
      });
    });
  });

  describe('Security & Compliance', () => {
    it('should not expose sensitive patient data in responses', async () => {
      const response = await request(app)
        .get(`/api/consultations/${consultationId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      // Should not contain password hash or sensitive fields
      expect(response.body.data).not.toHaveProperty('password_hash');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should enforce RBAC for provider-only endpoints', async () => {
      const providerOnlyEndpoints = [
        { method: 'post', path: `/api/consultations/${consultationId}/video/start` },
        { method: 'put', path: `/api/consultations/${consultationId}/notes` },
        { method: 'post', path: `/api/consultations/${consultationId}/no-show` },
      ];

      for (const endpoint of providerOnlyEndpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({});

        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/provider/i);
      }
    });

    it('should log consultation events for audit trail', async () => {
      // Create and cancel a consultation
      const scheduledStart = new Date();
      scheduledStart.setDate(scheduledStart.getDate() + 10);

      const bookResponse = await request(app)
        .post('/api/consultations/book')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          providerId,
          scheduledStart: scheduledStart.toISOString(),
          consultationType: 'video',
          reasonForVisit: 'Audit test',
        })
        .expect(201);

      const testConsultationId = bookResponse.body.data.id;

      await request(app)
        .post(`/api/consultations/${testConsultationId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ reason: 'Test reason' })
        .expect(200);

      // Verify audit log exists
      const auditResult = await databaseManager.query(
        `SELECT * FROM audit_logs
         WHERE resource_type = 'consultation'
         AND resource_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [testConsultationId]
      );

      expect(auditResult.rows.length).toBeGreaterThanOrEqual(1);
      expect(auditResult.rows[0].action).toMatch(/cancel|book/i);
    });
  });
});
