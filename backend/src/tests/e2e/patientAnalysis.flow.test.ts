import request from 'supertest';
import { app } from '../../app';
import { MLService } from '../../services/MLService';
import { createTestUser, getAuthToken } from '../test-utils';

// Mock the MLService
jest.mock('../../services/MLService');

const mockMLService = MLService as jest.MockedClass<typeof MLService>;

describe('Patient Analysis Flow', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user and get auth token
    const { user, token } = await createTestUser({
      email: 'test.patient@example.com',
      password: 'Test@1234',
    });
    testUserId = user.id;
    authToken = token;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete the patient analysis flow successfully', async () => {
    // 1. Mock ML service responses
    mockMLService.prototype.getHealth.mockResolvedValue(true);
    
    const mockPrediction = {
      user_id: testUserId,
      disease_risks: {
        cardiovascular_disease: 0.15,
        diabetes_type2: 0.08,
        alzheimer_disease: 0.05,
      },
      overall_risk_score: 0.09,
      confidence_level: 0.88,
      risk_factors: ['elevated_ldl', 'family_history'],
      recommendations: [
        'exercise_regularly',
        'reduce_salt_intake',
        'annual_checkup',
      ],
      prediction_timestamp: new Date().toISOString(),
      model_version: '1.0.0',
    };
    mockMLService.prototype.analyzePatient.mockResolvedValue(mockPrediction);

    // 2. Submit patient data for analysis
    const patientData = {
      age: 45,
      gender: 'male',
      bmi: 26.8,
      heart_rate: [72, 73, 71, 70, 72],
      blood_pressure: [{ systolic: 125, diastolic: 82 }],
      sleep_data: { duration: 6.5, efficiency: 0.8 },
      activity_data: { steps: 7200, calories: 2200 },
      voice_features: { pitch_mean: 145, jitter: 0.015 },
      genetic_markers: { BRCA1: 0.0, APOE_E4: 0.0 },
      lab_results: { glucose: 98, cholesterol: 195 },
    };

    const analysisResponse = await request(app)
      .post('/api/patients/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send(patientData)
      .expect('Content-Type', /json/)
      .expect(200);

    // 3. Verify analysis response
    expect(analysisResponse.body).toMatchObject({
      success: true,
      data: {
        user_id: testUserId,
        overall_risk_score: expect.any(Number),
        recommendations: expect.any(Array),
      },
    });

    // 4. Check that the ML service was called with the correct data
    expect(mockMLService.prototype.analyzePatient).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: testUserId,
        age: 45,
        gender: 'male',
      })
    );

    // 5. Verify the analysis was saved to the database
    const savedAnalysis = await request(app)
      .get(`/api/patients/${testUserId}/analysis`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(savedAnalysis.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: testUserId,
          risk_score: expect.any(Number),
        }),
      ])
    );
  });

  it('should handle ML service unavailability gracefully', async () => {
    // Mock ML service as unavailable
    mockMLService.prototype.getHealth.mockResolvedValue(false);
    
    const response = await request(app)
      .post('/api/patients/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        // minimal valid data
        age: 30,
        gender: 'female',
        bmi: 22,
      })
      .expect(503);

    expect(response.body).toMatchObject({
      success: false,
      error: 'ML service is currently unavailable',
    });
  });

  // Add more test cases for edge cases and error scenarios
});
