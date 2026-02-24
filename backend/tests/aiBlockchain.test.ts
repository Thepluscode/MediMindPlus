import request from 'supertest';
import { MLInferenceService } from '../src/services/ml/MLInferenceService';
import { blockchainService } from '../src/services/blockchain/BlockchainService';

describe('AI-Blockchain Integration Tests', () => {

  describe('ML Inference Service', () => {
    let mlService: MLInferenceService;

    beforeAll(async () => {
      mlService = new MLInferenceService();
      await mlService.initialize();
    });

    test('should initialize ML service successfully', () => {
      expect(mlService).toBeDefined();
    });

    test('should predict diabetes risk with valid input', async () => {
      const inputData = {
        age: 45,
        bmi: 28.5,
        bloodPressure: 130,
        glucose: 110,
        familyHistory: true
      };

      const result = await mlService.predict('diabetes_risk_model', inputData);

      expect(result).toHaveProperty('prediction');
      expect(result).toHaveProperty('confidence');
      expect(result.prediction).toHaveProperty('risk_score');
      expect(result.prediction).toHaveProperty('category');
      expect(result.prediction).toHaveProperty('recommended_action');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should predict heart disease risk with valid input', async () => {
      const inputData = {
        age: 55,
        cholesterol: 240,
        bloodPressure: 140,
        smoking: true,
        exercise: 'low'
      };

      const result = await mlService.predict('heart_disease_model', inputData);

      expect(result).toHaveProperty('prediction');
      expect(result.prediction).toHaveProperty('risk_score');
      expect(result.prediction.risk_score).toBeGreaterThanOrEqual(0);
      expect(result.prediction.risk_score).toBeLessThanOrEqual(100);
    });

    test('should predict mental health crisis with valid input', async () => {
      const inputData = {
        sentiment: -0.8,
        keywords: ['hopeless', 'worthless', 'alone'],
        frequency: 15,
        severity: 'high'
      };

      const result = await mlService.predict('mental_health_crisis_model', inputData);

      expect(result).toHaveProperty('prediction');
      expect(result.prediction).toHaveProperty('crisis_probability');
      expect(result.prediction).toHaveProperty('severity');
    });

    test('should generate SHAP-like explanation for prediction', async () => {
      const inputData = {
        age: 45,
        bmi: 28.5,
        bloodPressure: 130,
        glucose: 110,
        familyHistory: true
      };

      const predictionResult = await mlService.predict('diabetes_risk_model', inputData);
      const explanation = await mlService.explainPrediction(
        'diabetes_risk_model',
        inputData,
        predictionResult
      );

      expect(explanation).toHaveProperty('features');
      expect(explanation).toHaveProperty('reasoning');
      expect(explanation).toHaveProperty('confidence');
      expect(Array.isArray(explanation.features)).toBe(true);
      expect(explanation.features.length).toBeGreaterThan(0);

      // Check feature structure
      const firstFeature = explanation.features[0];
      expect(firstFeature).toHaveProperty('name');
      expect(firstFeature).toHaveProperty('value');
      expect(firstFeature).toHaveProperty('importance');
      expect(firstFeature).toHaveProperty('contribution');
    });

    test('should throw error for invalid model name', async () => {
      const inputData = { age: 45 };

      await expect(
        mlService.predict('invalid_model_name', inputData)
      ).rejects.toThrow();
    });

    test('should handle missing required input fields gracefully', async () => {
      const inputData = {
        age: 45
        // Missing other required fields
      };

      const result = await mlService.predict('diabetes_risk_model', inputData);

      // Should still return a prediction (with default/null handling)
      expect(result).toHaveProperty('prediction');
      expect(result).toHaveProperty('confidence');
    });
  });

  describe('Blockchain Service', () => {
    test('should initialize blockchain service', () => {
      expect(blockchainService).toBeDefined();
    });

    test('should generate consistent SHA-256 hashes', () => {
      const data = { test: 'data', value: 123 };
      const hash1 = blockchainService.createHash(data);
      const hash2 = blockchainService.createHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
    });

    test('should store prediction on blockchain (mock)', async () => {
      const predictionData = {
        predictionId: 'test-pred-' + Date.now(),
        userId: 'user-123',
        modelName: 'diabetes_risk_model',
        prediction: { risk_score: 45.5, category: 'moderate_risk' },
        confidence: 0.85
      };

      const result = await blockchainService.storePrediction(predictionData);

      expect(result).toHaveProperty('txHash');
      expect(result).toHaveProperty('blockchainHash');
      expect(result.txHash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.blockchainHash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    test('should verify prediction on blockchain (mock)', async () => {
      const predictionId = 'test-pred-verify';

      const result = await blockchainService.verifyPrediction(predictionId);

      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('onChainData');
      expect(result.verified).toBe(true);
    });

    test('should update consent on blockchain (mock)', async () => {
      const consentData = {
        userId: 'user-123',
        consentGiven: true,
        consentScope: ['ai_predictions', 'data_storage', 'federated_learning']
      };

      const result = await blockchainService.updateConsent(consentData);

      expect(result).toHaveProperty('txHash');
      expect(result).toHaveProperty('blockchainHash');
    });

    test('should record anomaly on blockchain (mock)', async () => {
      const anomalyData = {
        anomalyId: 'anomaly-' + Date.now(),
        patientDID: 'did:example:patient123',
        deviceId: 'device-001',
        anomalyType: 'heart_rate_spike',
        severity: 'high' as const,
        sensorData: { heartRate: 180, timestamp: Date.now() },
        aiConfidence: 0.92
      };

      const result = await blockchainService.recordAnomaly(anomalyData);

      expect(result).toHaveProperty('txHash');
      expect(result).toHaveProperty('blockchainProof');
    });

    test('should get connection status', () => {
      const status = blockchainService.getConnectionStatus();

      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('network');
      expect(status).toHaveProperty('contractAddress');
    });
  });

  describe('End-to-End AI-Blockchain Flow', () => {
    let mlService: MLInferenceService;

    beforeAll(async () => {
      mlService = new MLInferenceService();
      await mlService.initialize();
    });

    test('should complete full prediction workflow with blockchain verification', async () => {
      // Step 1: Make AI prediction
      const inputData = {
        age: 50,
        bmi: 30,
        bloodPressure: 140,
        glucose: 120,
        familyHistory: true
      };

      const prediction = await mlService.predict('diabetes_risk_model', inputData);
      expect(prediction).toHaveProperty('prediction');
      expect(prediction).toHaveProperty('confidence');

      // Step 2: Generate explanation
      const explanation = await mlService.explainPrediction(
        'diabetes_risk_model',
        inputData,
        prediction
      );
      expect(explanation).toHaveProperty('features');
      expect(explanation).toHaveProperty('reasoning');

      // Step 3: Store on blockchain
      const predictionId = 'e2e-test-' + Date.now();
      const blockchainResult = await blockchainService.storePrediction({
        predictionId,
        userId: 'test-user-123',
        modelName: 'diabetes_risk_model',
        prediction: prediction.prediction,
        confidence: prediction.confidence
      });

      expect(blockchainResult).toHaveProperty('txHash');
      expect(blockchainResult).toHaveProperty('blockchainHash');

      // Step 4: Verify on blockchain
      const verification = await blockchainService.verifyPrediction(predictionId);
      expect(verification.verified).toBe(true);
    });

    test('should handle consent workflow end-to-end', async () => {
      // Step 1: Update consent
      const consentData = {
        userId: 'test-user-456',
        consentGiven: true,
        consentScope: ['ai_predictions', 'anomaly_detection']
      };

      const consentResult = await blockchainService.updateConsent(consentData);
      expect(consentResult).toHaveProperty('txHash');

      // Step 2: Make prediction with consent
      const inputData = {
        age: 35,
        cholesterol: 200,
        bloodPressure: 120,
        smoking: false,
        exercise: 'moderate'
      };

      const prediction = await mlService.predict('heart_disease_model', inputData);
      expect(prediction).toHaveProperty('prediction');

      // Step 3: Store with blockchain verification
      const blockchainResult = await blockchainService.storePrediction({
        predictionId: 'consent-test-' + Date.now(),
        userId: consentData.userId,
        modelName: 'heart_disease_model',
        prediction: prediction.prediction,
        confidence: prediction.confidence
      });

      expect(blockchainResult).toHaveProperty('blockchainHash');
    });
  });

  describe('Performance Tests', () => {
    let mlService: MLInferenceService;

    beforeAll(async () => {
      mlService = new MLInferenceService();
      await mlService.initialize();
    });

    test('should handle multiple concurrent predictions', async () => {
      const predictions = await Promise.all([
        mlService.predict('diabetes_risk_model', { age: 45, bmi: 28, bloodPressure: 130, glucose: 110, familyHistory: true }),
        mlService.predict('heart_disease_model', { age: 55, cholesterol: 240, bloodPressure: 140, smoking: true, exercise: 'low' }),
        mlService.predict('mental_health_crisis_model', { sentiment: -0.5, keywords: ['stress'], frequency: 5, severity: 'medium' })
      ]);

      expect(predictions).toHaveLength(3);
      predictions.forEach(pred => {
        expect(pred).toHaveProperty('prediction');
        expect(pred).toHaveProperty('confidence');
      });
    });

    test('prediction should complete within reasonable time (<1000ms)', async () => {
      const startTime = Date.now();

      await mlService.predict('diabetes_risk_model', {
        age: 45,
        bmi: 28,
        bloodPressure: 130,
        glucose: 110,
        familyHistory: true
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });
});

describe('Feature Importance Tests', () => {
  let mlService: MLInferenceService;

  beforeAll(async () => {
    mlService = new MLInferenceService();
    await mlService.initialize();
  });

  test('glucose should be most important feature for diabetes', async () => {
    const inputData = {
      age: 45,
      bmi: 28,
      bloodPressure: 130,
      glucose: 110,
      familyHistory: true
    };

    const prediction = await mlService.predict('diabetes_risk_model', inputData);
    const explanation = await mlService.explainPrediction('diabetes_risk_model', inputData, prediction);

    const glucoseFeature = explanation.features.find(f => f.name === 'glucose');
    expect(glucoseFeature).toBeDefined();

    // Glucose should be in top 2 most important features
    const topFeatures = explanation.features.slice(0, 2);
    const glucoseInTop = topFeatures.some(f => f.name === 'glucose');
    expect(glucoseInTop).toBe(true);
  });

  test('features should be sorted by importance', async () => {
    const inputData = {
      age: 45,
      bmi: 28,
      bloodPressure: 130,
      glucose: 110,
      familyHistory: true
    };

    const prediction = await mlService.predict('diabetes_risk_model', inputData);
    const explanation = await mlService.explainPrediction('diabetes_risk_model', inputData, prediction);

    // Check that features are sorted in descending order of importance
    for (let i = 0; i < explanation.features.length - 1; i++) {
      expect(explanation.features[i].importance).toBeGreaterThanOrEqual(
        explanation.features[i + 1].importance
      );
    }
  });
});
