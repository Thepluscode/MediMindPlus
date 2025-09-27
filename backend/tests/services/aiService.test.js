const { MediMindAI, PatientData } = require('../../../src/ai/medimind_ai');

describe('AI Service', () => {
  let aiEngine;

  beforeAll(() => {
    aiEngine = new MediMindAI();
  });

  describe('PatientData Processing', () => {
    it('should process complete patient data', async () => {
      const patientData = {
        user_id: 'test-user-001',
        age: 45,
        gender: 'male',
        bmi: 28.5,
        heart_rate: [72, 75, 68, 80, 77],
        blood_pressure: [[120, 80], [125, 82], [118, 78]],
        sleep_data: {
          sleep_duration: 7.5,
          sleep_efficiency: 0.85,
          deep_sleep_ratio: 0.25,
          rem_sleep_ratio: 0.20
        },
        activity_data: {
          steps: 8500,
          distance: 6.2,
          calories: 2400,
          active_minutes: 45
        },
        voice_features: {
          pitch_mean: 150.0,
          pitch_std: 25.0,
          jitter: 0.01,
          shimmer: 0.03,
          hnr: 20.0
        },
        genetic_markers: {
          APOE_E4: 0.0,
          BRCA1: 0.0,
          MTHFR_C677T: 1.0
        },
        lab_results: {
          GLUCOSE: 95.0,
          CHOLESTEROL: 180.0,
          CRP: 1.2
        },
        timestamp: new Date()
      };

      const processed = aiEngine.data_processor.process(patientData);

      expect(processed).toBeDefined();
      expect(processed.genomics).toBeDefined();
      expect(processed.proteomics).toBeDefined();
      expect(processed.metabolomics).toBeDefined();
      expect(processed.digital_biomarkers).toBeDefined();
      expect(processed.combined_features).toBeDefined();
      expect(processed.combined_features.length).toBeGreaterThan(0);
    });

    it('should handle missing data gracefully', async () => {
      const incompleteData = {
        user_id: 'test-user-002',
        age: 35,
        gender: 'female',
        bmi: 22.0,
        heart_rate: [],
        blood_pressure: [],
        sleep_data: {},
        activity_data: {},
        voice_features: {},
        genetic_markers: {},
        lab_results: {},
        timestamp: new Date()
      };

      const processed = aiEngine.data_processor.process(incompleteData);

      expect(processed).toBeDefined();
      expect(processed.combined_features).toBeDefined();
      // Should not throw errors even with missing data
    });
  });

  describe('Risk Prediction', () => {
    it('should generate risk predictions', async () => {
      // Mock processed data
      const processedData = {
        combined_features: new Array(50).fill(0).map(() => Math.random())
      };

      // Mock disease risks (would normally come from trained models)
      const mockRisks = {
        cardiovascular_disease: { risk_score: 0.3, confidence: 0.8 },
        diabetes_type2: { risk_score: 0.2, confidence: 0.7 },
        alzheimer_disease: { risk_score: 0.1, confidence: 0.6 }
      };

      // Override predict method for testing
      aiEngine.risk_predictor.predict = jest.fn().mockReturnValue(mockRisks);

      const risks = aiEngine.risk_predictor.predict(processedData);

      expect(risks).toBeDefined();
      expect(risks.cardiovascular_disease).toBeDefined();
      expect(risks.cardiovascular_disease.risk_score).toBeGreaterThanOrEqual(0);
      expect(risks.cardiovascular_disease.risk_score).toBeLessThanOrEqual(1);
      expect(risks.cardiovascular_disease.confidence).toBeGreaterThanOrEqual(0);
      expect(risks.cardiovascular_disease.confidence).toBeLessThanOrEqual(1);
    });
  });
});
