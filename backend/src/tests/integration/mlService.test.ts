import request from 'supertest';
import app from '../../app';
import { MLService } from '../../services/MLService';
import { logger } from '../../utils/logger';

// Mock the MLService
jest.mock('../../services/MLService');

const mockMLService = MLService as jest.MockedClass<typeof MLService>;

describe('ML Service Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/ml/health', () => {
    it('should return 200 and healthy status when ML service is available', async () => {
      // Mock the health check to return true
      mockMLService.prototype.getHealth.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/ml/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        service: 'ml',
      });
    });

    it('should return 503 when ML service is unavailable', async () => {
      // Mock the health check to return false
      mockMLService.prototype.getHealth.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/ml/health')
        .expect('Content-Type', /json/)
        .expect(503);

      expect(response.body).toEqual({
        status: 'unavailable',
        service: 'ml',
      });
    });
  });

  describe('POST /api/ml/analyze', () => {
    const mockPatientData = {
      user_id: 'test-user-123',
      age: 35,
      gender: 'male',
      bmi: 24.5,
      heart_rate: [72, 73, 71, 70, 72],
      blood_pressure: [{ systolic: 120, diastolic: 80 }],
      sleep_data: { duration: 7.5, efficiency: 0.85 },
      activity_data: { steps: 8500, calories: 2400 },
      voice_features: { pitch_mean: 150, jitter: 0.01 },
      genetic_markers: { BRCA1: 0.0, APOE_E4: 0.0 },
      lab_results: { glucose: 95, cholesterol: 180 },
    };

    it('should return 200 and prediction for valid request', async () => {
      const mockPrediction = {
        user_id: 'test-user-123',
        disease_risks: {
          cardiovascular_disease: 0.15,
          diabetes_type2: 0.08,
          // ... other diseases
        },
        overall_risk_score: 0.12,
        confidence_level: 0.85,
        risk_factors: ['elevated_ldl', 'family_history'],
        recommendations: ['exercise_regularly', 'reduce_salt_intake'],
        prediction_timestamp: new Date().toISOString(),
        model_version: '1.0.0',
      };

      mockMLService.prototype.analyzePatient.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ml/analyze')
        .send(mockPatientData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        user_id: 'test-user-123',
        overall_risk_score: expect.any(Number),
        confidence_level: expect.any(Number),
        risk_factors: expect.any(Array),
        recommendations: expect.any(Array),
      });
    });

    it('should return 400 for invalid request', async () => {
      const invalidData = { ...mockPatientData, age: 'not-a-number' };

      const response = await request(app)
        .post('/api/ml/analyze')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('errors');
    });
  });

  // Add more test cases for other endpoints...
});
