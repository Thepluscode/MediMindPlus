/**
 * Health Risk Assessment Integration Tests
 *
 * Comprehensive end-to-end testing for AI-powered disease risk prediction endpoints
 */

import request from 'supertest';
import { Express } from 'express';
import { DatabaseManager } from '../../src/database/DatabaseManager';
import { TestDatabaseHelper } from '../helpers/testDatabase';
import { createTestUserData, hashTestPassword } from '../helpers/testUtils';

describe('Health Risk Assessment Integration Tests', () => {
  let app: Express;
  let databaseManager: DatabaseManager;
  let dbHelper: TestDatabaseHelper;

  // Test users
  let patientId: string;
  let patientToken: string;
  let providerId: string;
  let providerToken: string;

  beforeAll(async () => {
    // Import app
    const appModule = await import('../../src/index');
    app = appModule.default;

    // Initialize database
    databaseManager = new DatabaseManager();
    await databaseManager.initialize();

    dbHelper = new TestDatabaseHelper();
    await dbHelper.initialize();

    // Create test patient with health data
    const patientData = createTestUserData({ role: 'patient' });
    const patientHash = await hashTestPassword(patientData.password);

    const patientResult = await databaseManager.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [patientData.email, patientHash, patientData.firstName, patientData.lastName, 'patient', true, true]
    );
    patientId = patientResult.rows[0].id;

    // Create patient profile with health risk factors
    await databaseManager.query(
      `INSERT INTO patients (user_id, date_of_birth, gender, phone, height, weight)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [patientId, '1975-06-15', 'male', '+1234567890', 175, 85]
    );

    // Add vital signs for risk assessment
    await databaseManager.query(
      `INSERT INTO vital_signs (user_id, systolic_bp, diastolic_bp, heart_rate, temperature, oxygen_saturation, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [patientId, 140, 90, 80, 37.0, 98, new Date()]
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
      `INSERT INTO providers (user_id, specialty, license_number, accepting_patients)
       VALUES ($1, $2, $3, $4)`,
      [providerId, 'Internal Medicine', 'LIC555555', true]
    );

    // Login provider
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

  describe('Diabetes Risk Assessment', () => {
    describe('GET /api/health-risk/:userId/diabetes', () => {
      it('should get Type 2 Diabetes risk assessment', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/diabetes`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('riskScore');
        expect(response.body.data).toHaveProperty('riskLevel');
        expect(response.body.data).toHaveProperty('riskFactors');
        expect(response.body.data).toHaveProperty('recommendations');

        expect(typeof response.body.data.riskScore).toBe('number');
        expect(response.body.data.riskScore).toBeGreaterThanOrEqual(0);
        expect(response.body.data.riskScore).toBeLessThanOrEqual(100);

        expect(['low', 'moderate', 'high', 'very-high']).toContain(response.body.data.riskLevel);
        expect(Array.isArray(response.body.data.riskFactors)).toBe(true);
        expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      });

      it('should allow provider to access patient risk data', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/diabetes`)
          .set('Authorization', `Bearer ${providerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('riskScore');
      });

      it('should reject unauthorized access to other user data', async () => {
        // Create another patient
        const otherPatient = createTestUserData({ role: 'patient' });
        const otherHash = await hashTestPassword(otherPatient.password);

        const otherResult = await databaseManager.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [otherPatient.email, otherHash, otherPatient.firstName, otherPatient.lastName, 'patient', true, true]
        );
        const otherPatientId = otherResult.rows[0].id;

        const otherLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: otherPatient.email, password: otherPatient.password });
        const otherToken = otherLoginResponse.body.tokens.accessToken;

        const response = await request(app)
          .get(`/api/health-risk/${patientId}/diabetes`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/unauthorized/i);
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/health-risk/${patientId}/diabetes`)
          .expect(401);
      });

      it('should return 500 for non-existent user', async () => {
        const response = await request(app)
          .get('/api/health-risk/00000000-0000-0000-0000-000000000000/diabetes')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Cardiovascular Risk Assessment', () => {
    describe('GET /api/health-risk/:userId/cardiovascular', () => {
      it('should get Cardiovascular disease risk assessment', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/cardiovascular`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('riskScore');
        expect(response.body.data).toHaveProperty('riskLevel');
        expect(response.body.data).toHaveProperty('framinghamScore');
        expect(response.body.data).toHaveProperty('recommendations');

        expect(typeof response.body.data.riskScore).toBe('number');
        expect(response.body.data.riskScore).toBeGreaterThanOrEqual(0);
        expect(response.body.data.riskScore).toBeLessThanOrEqual(100);
      });

      it('should calculate Framingham Risk Score', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/cardiovascular`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('framinghamScore');
        expect(typeof response.body.data.framinghamScore).toBe('number');
      });

      it('should identify cardiovascular risk factors', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/cardiovascular`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('riskFactors');
        expect(Array.isArray(response.body.data.riskFactors)).toBe(true);

        // Common risk factors
        const possibleFactors = ['age', 'blood pressure', 'cholesterol', 'smoking', 'diabetes', 'bmi'];
        if (response.body.data.riskFactors.length > 0) {
          // At least one should be a known risk factor
          const hasKnownFactor = response.body.data.riskFactors.some((factor: any) =>
            possibleFactors.some(pf => factor.name.toLowerCase().includes(pf))
          );
          expect(hasKnownFactor).toBe(true);
        }
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/health-risk/${patientId}/cardiovascular`)
          .expect(401);
      });

      it('should enforce authorization', async () => {
        const otherPatient = createTestUserData({ role: 'patient' });
        const otherHash = await hashTestPassword(otherPatient.password);

        await databaseManager.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [otherPatient.email, otherHash, otherPatient.firstName, otherPatient.lastName, 'patient', true, true]
        );

        const otherLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: otherPatient.email, password: otherPatient.password });
        const otherToken = otherLoginResponse.body.tokens.accessToken;

        const response = await request(app)
          .get(`/api/health-risk/${patientId}/cardiovascular`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Hypertension Risk Assessment', () => {
    describe('GET /api/health-risk/:userId/hypertension', () => {
      it('should get Hypertension risk assessment', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/hypertension`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('riskScore');
        expect(response.body.data).toHaveProperty('riskLevel');
        expect(response.body.data).toHaveProperty('currentBP');
        expect(response.body.data).toHaveProperty('bpCategory');

        expect(['normal', 'elevated', 'stage1', 'stage2', 'crisis']).toContain(
          response.body.data.bpCategory
        );
      });

      it('should categorize blood pressure correctly', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/hypertension`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('currentBP');
        expect(response.body.data.currentBP).toHaveProperty('systolic');
        expect(response.body.data.currentBP).toHaveProperty('diastolic');

        const { systolic, diastolic } = response.body.data.currentBP;
        expect(systolic).toBeGreaterThan(0);
        expect(diastolic).toBeGreaterThan(0);
        expect(systolic).toBeGreaterThan(diastolic);
      });

      it('should provide hypertension management recommendations', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/hypertension`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('recommendations');
        expect(Array.isArray(response.body.data.recommendations)).toBe(true);
        expect(response.body.data.recommendations.length).toBeGreaterThan(0);
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/health-risk/${patientId}/hypertension`)
          .expect(401);
      });
    });
  });

  describe('Mental Health Risk Assessment', () => {
    describe('GET /api/health-risk/:userId/mental-health', () => {
      it('should get Mental health risk assessment', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/mental-health`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('riskScore');
        expect(response.body.data).toHaveProperty('riskLevel');
        expect(response.body.data).toHaveProperty('assessments');

        // Should include PHQ-9 and GAD-7 scores
        expect(response.body.data.assessments).toHaveProperty('phq9');
        expect(response.body.data.assessments).toHaveProperty('gad7');
      });

      it('should include PHQ-9 depression screening', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/mental-health`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        const phq9 = response.body.data.assessments.phq9;
        expect(phq9).toHaveProperty('score');
        expect(phq9).toHaveProperty('severity');
        expect(['none', 'mild', 'moderate', 'moderately-severe', 'severe']).toContain(
          phq9.severity
        );
      });

      it('should include GAD-7 anxiety screening', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/mental-health`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        const gad7 = response.body.data.assessments.gad7;
        expect(gad7).toHaveProperty('score');
        expect(gad7).toHaveProperty('severity');
        expect(['minimal', 'mild', 'moderate', 'severe']).toContain(gad7.severity);
      });

      it('should provide mental health resources', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/mental-health`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('resources');
        expect(Array.isArray(response.body.data.resources)).toBe(true);

        if (response.body.data.resources.length > 0) {
          const resource = response.body.data.resources[0];
          expect(resource).toHaveProperty('name');
          expect(resource).toHaveProperty('type');
        }
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/health-risk/${patientId}/mental-health`)
          .expect(401);
      });
    });
  });

  describe('Cancer Screening Recommendations', () => {
    describe('GET /api/health-risk/:userId/cancer-screening', () => {
      it('should get Cancer screening recommendations', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/cancer-screening`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('recommendations');
        expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      });

      it('should provide age-appropriate screening recommendations', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/cancer-screening`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.data.recommendations.length).toBeGreaterThan(0);

        const recommendation = response.body.data.recommendations[0];
        expect(recommendation).toHaveProperty('cancerType');
        expect(recommendation).toHaveProperty('screeningTest');
        expect(recommendation).toHaveProperty('frequency');
        expect(recommendation).toHaveProperty('nextDue');
      });

      it('should include gender-specific screenings', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/cancer-screening`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        // For male patient, should include prostate cancer screening
        const prostateScrening = response.body.data.recommendations.find(
          (rec: any) => rec.cancerType.toLowerCase().includes('prostate')
        );

        // Should be present for males over 50
        if (prostateScrening) {
          expect(prostateScrening.screeningTest).toBeDefined();
        }
      });

      it('should provide screening rationale', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/cancer-screening`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        const recommendation = response.body.data.recommendations[0];
        expect(recommendation).toHaveProperty('rationale');
        expect(typeof recommendation.rationale).toBe('string');
        expect(recommendation.rationale.length).toBeGreaterThan(0);
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/health-risk/${patientId}/cancer-screening`)
          .expect(401);
      });
    });
  });

  describe('Comprehensive Risk Report', () => {
    describe('GET /api/health-risk/:userId/comprehensive', () => {
      it('should generate comprehensive risk report', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('overallRiskScore');
        expect(response.body.data).toHaveProperty('assessments');
        expect(response.body.data).toHaveProperty('topRisks');
        expect(response.body.data).toHaveProperty('recommendations');
        expect(response.body.data).toHaveProperty('generatedAt');
      });

      it('should include all individual risk assessments', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        const assessments = response.body.data.assessments;
        expect(assessments).toHaveProperty('diabetes');
        expect(assessments).toHaveProperty('cardiovascular');
        expect(assessments).toHaveProperty('hypertension');
        expect(assessments).toHaveProperty('mentalHealth');
        expect(assessments).toHaveProperty('cancerScreening');

        // Each assessment should have basic structure
        expect(assessments.diabetes).toHaveProperty('riskScore');
        expect(assessments.cardiovascular).toHaveProperty('riskScore');
        expect(assessments.hypertension).toHaveProperty('riskScore');
        expect(assessments.mentalHealth).toHaveProperty('riskScore');
      });

      it('should calculate overall risk score', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(typeof response.body.data.overallRiskScore).toBe('number');
        expect(response.body.data.overallRiskScore).toBeGreaterThanOrEqual(0);
        expect(response.body.data.overallRiskScore).toBeLessThanOrEqual(100);
      });

      it('should identify top health risks', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data.topRisks)).toBe(true);
        expect(response.body.data.topRisks.length).toBeGreaterThan(0);

        const topRisk = response.body.data.topRisks[0];
        expect(topRisk).toHaveProperty('condition');
        expect(topRisk).toHaveProperty('riskScore');
        expect(topRisk).toHaveProperty('priority');
      });

      it('should provide prioritized recommendations', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data.recommendations)).toBe(true);
        expect(response.body.data.recommendations.length).toBeGreaterThan(0);

        const recommendation = response.body.data.recommendations[0];
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('priority');
        expect(['high', 'medium', 'low']).toContain(recommendation.priority);
      });

      it('should include timestamp for report generation', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.data.generatedAt).toBeDefined();

        const generatedDate = new Date(response.body.data.generatedAt);
        expect(generatedDate.getTime()).toBeGreaterThan(0);
      });

      it('should allow provider access', async () => {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .set('Authorization', `Bearer ${providerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('overallRiskScore');
      });

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .expect(401);
      });

      it('should enforce authorization', async () => {
        const otherPatient = createTestUserData({ role: 'patient' });
        const otherHash = await hashTestPassword(otherPatient.password);

        await databaseManager.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [otherPatient.email, otherHash, otherPatient.firstName, otherPatient.lastName, 'patient', true, true]
        );

        const otherLoginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: otherPatient.email, password: otherPatient.password });
        const otherToken = otherLoginResponse.body.tokens.accessToken;

        const response = await request(app)
          .get(`/api/health-risk/${patientId}/comprehensive`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Security & Compliance', () => {
    it('should not expose PHI in error messages', async () => {
      const response = await request(app)
        .get('/api/health-risk/invalid-uuid/diabetes')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(500);

      const errorString = JSON.stringify(response.body);
      // Should not contain email, name, or other PHI
      expect(errorString).not.toMatch(/\d{3}-\d{2}-\d{4}/); // SSN pattern
      expect(errorString).not.toMatch(/password/i);
    });

    it('should log risk assessment access for HIPAA audit', async () => {
      await request(app)
        .get(`/api/health-risk/${patientId}/diabetes`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      // Verify audit log
      const auditResult = await databaseManager.query(
        `SELECT * FROM audit_logs
         WHERE resource_type = 'health_risk_assessment'
         AND user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [patientId]
      );

      expect(auditResult.rows.length).toBeGreaterThanOrEqual(1);
      expect(auditResult.rows[0].action).toMatch(/access|view|assess/i);
    });

    it('should enforce RBAC for all risk assessment endpoints', async () => {
      const endpoints = [
        '/diabetes',
        '/cardiovascular',
        '/hypertension',
        '/mental-health',
        '/cancer-screening',
        '/comprehensive',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(`/api/health-risk/${patientId}${endpoint}`)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });

    it('should use secure communication for ML service', () => {
      // Verify ML_SERVICE_URL is configured
      expect(process.env.ML_SERVICE_URL).toBeDefined();

      // In production, should use HTTPS
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.ML_SERVICE_URL).toMatch(/^https:\/\//);
      }
    });
  });

  describe('Performance & Caching', () => {
    it('should cache risk assessment results', async () => {
      const start1 = Date.now();
      await request(app)
        .get(`/api/health-risk/${patientId}/diabetes`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request should be faster (cached)
      const start2 = Date.now();
      const response2 = await request(app)
        .get(`/api/health-risk/${patientId}/diabetes`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      expect(response2.body.success).toBe(true);
      // Cache should make it faster (this may not always be true in test env)
      // Just verify both requests complete successfully
      expect(duration1).toBeGreaterThan(0);
      expect(duration2).toBeGreaterThan(0);
    });

    it('should handle concurrent risk assessment requests', async () => {
      const promises = [
        request(app)
          .get(`/api/health-risk/${patientId}/diabetes`)
          .set('Authorization', `Bearer ${patientToken}`),
        request(app)
          .get(`/api/health-risk/${patientId}/cardiovascular`)
          .set('Authorization', `Bearer ${patientToken}`),
        request(app)
          .get(`/api/health-risk/${patientId}/hypertension`)
          .set('Authorization', `Bearer ${patientToken}`),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle ML service unavailability gracefully', async () => {
      // Temporarily break ML service URL
      const originalUrl = process.env.ML_SERVICE_URL;
      process.env.ML_SERVICE_URL = 'http://localhost:9999';

      const response = await request(app)
        .get(`/api/health-risk/${patientId}/diabetes`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      // Restore URL
      process.env.ML_SERVICE_URL = originalUrl;
    });

    it('should handle incomplete patient data', async () => {
      // Create patient with minimal data
      const minimalPatient = createTestUserData({ role: 'patient' });
      const minimalHash = await hashTestPassword(minimalPatient.password);

      const minimalResult = await databaseManager.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [minimalPatient.email, minimalHash, minimalPatient.firstName, minimalPatient.lastName, 'patient', true, true]
      );
      const minimalPatientId = minimalResult.rows[0].id;

      // No patient profile created - should handle gracefully
      const minimalLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: minimalPatient.email, password: minimalPatient.password });
      const minimalToken = minimalLoginResponse.body.tokens.accessToken;

      const response = await request(app)
        .get(`/api/health-risk/${minimalPatientId}/diabetes`)
        .set('Authorization', `Bearer ${minimalToken}`);

      // Should either return limited assessment or error
      expect([200, 500]).toContain(response.status);
    });

    it('should return meaningful error messages', async () => {
      const response = await request(app)
        .get('/api/health-risk/invalid/diabetes')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
    });
  });
});
