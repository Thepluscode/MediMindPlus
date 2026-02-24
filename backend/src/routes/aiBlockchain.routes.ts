/**
 * AI-Blockchain Hybrid System API Routes
 * Endpoints for explainable AI, federated learning, anomaly detection, and smart contracts
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authorization';
import { body, param, validationResult } from 'express-validator';
import logger from '../utils/logger';

const router = Router();

// Service will be injected via dependency injection in app.ts
let aiBlockchainService: any;

export const setAIBlockchainService = (service: any) => {
  aiBlockchainService = service;
};

/**
 * POST /ai-blockchain/predict
 * Make an explainable AI prediction with blockchain verification
 */
router.post(
  '/predict',
  authenticate,
  [
    body('modelName').isString().notEmpty(),
    body('inputData').isObject().notEmpty(),
    body('storeOnBlockchain').optional().isBoolean(),
    body('requireConsent').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user?.id;
      const { modelName, inputData, storeOnBlockchain, requireConsent } = req.body;

      if (!aiBlockchainService) {
        return res.status(503).json({
          success: false,
          error: 'AI-Blockchain service not initialized'
        });
      }

      const prediction = await aiBlockchainService.makeExplainablePrediction(
        userId,
        modelName,
        inputData,
        {
          storeOnBlockchain: storeOnBlockchain !== false,
          requireConsent: requireConsent !== false
        }
      );

      res.json({
        success: true,
        data: prediction
      });
    } catch (error: any) {
      logger.error('AI prediction error:', error);
      res.status(error.message.includes('consent') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to make prediction'
      });
    }
  }
);

/**
 * GET /ai-blockchain/predictions/:predictionId
 * Retrieve a specific AI prediction with verification
 */
router.get(
  '/predictions/:predictionId',
  authenticate,
  [param('predictionId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { predictionId } = req.params;
      const userId = req.user?.id;

      // Query database directly for now
      const db = req.app.locals.db;
      const prediction = await db('ai_predictions_blockchain')
        .where({ id: predictionId })
        .first();

      if (!prediction) {
        return res.status(404).json({
          success: false,
          error: 'Prediction not found'
        });
      }

      // Verify user has access to this prediction
      if (prediction.user_id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to prediction'
        });
      }

      res.json({
        success: true,
        data: {
          predictionId: prediction.id,
          userId: prediction.user_id,
          modelName: prediction.model_name,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          explanation: prediction.explanation,
          blockchainHash: prediction.blockchain_hash,
          verifiable: prediction.verifiable,
          createdAt: prediction.created_at
        }
      });
    } catch (error: any) {
      logger.error('Error retrieving prediction:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve prediction'
      });
    }
  }
);

/**
 * GET /ai-blockchain/predictions/user/:userId
 * Get all predictions for a user
 */
router.get(
  '/predictions/user/:userId',
  authenticate,
  [param('userId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { userId } = req.params;

      // Verify authorization
      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to user predictions'
        });
      }

      const db = req.app.locals.db;
      const predictions = await db('ai_predictions_blockchain')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .limit(50);

      res.json({
        success: true,
        data: predictions.map((p: any) => ({
          predictionId: p.id,
          modelName: p.model_name,
          prediction: p.prediction,
          confidence: p.confidence,
          blockchainHash: p.blockchain_hash,
          createdAt: p.created_at
        }))
      });
    } catch (error: any) {
      logger.error('Error retrieving user predictions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve predictions'
      });
    }
  }
);

/**
 * POST /ai-blockchain/verify/:predictionId
 * Verify the authenticity of an AI prediction via blockchain hash
 */
router.post(
  '/verify/:predictionId',
  authenticate,
  [param('predictionId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { predictionId } = req.params;
      const db = req.app.locals.db;

      const prediction = await db('ai_predictions_blockchain')
        .where({ id: predictionId })
        .first();

      if (!prediction) {
        return res.status(404).json({
          success: false,
          error: 'Prediction not found'
        });
      }

      // Recompute hash to verify integrity
      const crypto = require('crypto');
      const dataToHash = {
        predictionId: prediction.id,
        userId: prediction.user_id,
        modelName: prediction.model_name,
        inputHash: crypto.createHash('sha256').update(JSON.stringify(prediction.prediction)).digest('hex'),
        prediction: prediction.prediction,
        confidence: prediction.confidence,
        timestamp: prediction.created_at
      };
      const computedHash = crypto.createHash('sha256').update(JSON.stringify(dataToHash)).digest('hex');

      const verified = computedHash === prediction.blockchain_hash;

      res.json({
        success: true,
        data: {
          predictionId,
          verified,
          blockchainHash: prediction.blockchain_hash,
          computedHash,
          message: verified ? 'Prediction verified successfully' : 'Hash mismatch - prediction may have been tampered with'
        }
      });
    } catch (error: any) {
      logger.error('Error verifying prediction:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify prediction'
      });
    }
  }
);

/**
 * POST /ai-blockchain/federated-learning
 * Initiate a federated learning session across institutions
 */
router.post(
  '/federated-learning',
  authenticate,
  [
    body('modelType').isString().notEmpty(),
    body('participantDIDs').isArray().notEmpty(),
    body('privacyPreserving').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Only admins or researchers can initiate federated learning
      if (req.user?.role !== 'admin' && req.user?.role !== 'researcher') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to initiate federated learning'
        });
      }

      const { modelType, participantDIDs, privacyPreserving } = req.body;

      if (!aiBlockchainService) {
        return res.status(503).json({
          success: false,
          error: 'AI-Blockchain service not initialized'
        });
      }

      const sessionId = await aiBlockchainService.initiateFederatedLearning(
        modelType,
        participantDIDs,
        privacyPreserving !== false
      );

      res.json({
        success: true,
        data: {
          sessionId,
          modelType,
          participants: participantDIDs.length,
          status: 'initiated'
        }
      });
    } catch (error: any) {
      logger.error('Federated learning error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to initiate federated learning'
      });
    }
  }
);

/**
 * POST /ai-blockchain/federated-learning/:sessionId/submit
 * Submit a local model to a federated learning session
 */
router.post(
  '/federated-learning/:sessionId/submit',
  authenticate,
  [
    param('sessionId').isUUID(),
    body('localModel').isObject().notEmpty(),
    body('participantDID').isString().notEmpty()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { localModel, participantDID } = req.body;

      if (!aiBlockchainService) {
        return res.status(503).json({
          success: false,
          error: 'AI-Blockchain service not initialized'
        });
      }

      await aiBlockchainService.submitLocalModel(
        sessionId,
        participantDID,
        localModel
      );

      res.json({
        success: true,
        message: 'Local model submitted successfully'
      });
    } catch (error: any) {
      logger.error('Model submission error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit local model'
      });
    }
  }
);

/**
 * GET /ai-blockchain/federated-learning/:sessionId
 * Get federated learning session status
 */
router.get(
  '/federated-learning/:sessionId',
  authenticate,
  [param('sessionId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const db = req.app.locals.db;

      const session = await db('federated_learning_sessions')
        .where({ session_id: sessionId })
        .first();

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: {
          sessionId: session.session_id,
          modelType: session.model_type,
          participants: session.participants,
          consensusReached: session.consensus_reached,
          aggregatedModelHash: session.aggregated_model_hash,
          status: session.status,
          createdAt: session.created_at,
          completedAt: session.completed_at
        }
      });
    } catch (error: any) {
      logger.error('Error retrieving session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve session'
      });
    }
  }
);

/**
 * POST /ai-blockchain/iomt/detect-anomaly
 * Detect anomalies in IoMT device data
 */
router.post(
  '/iomt/detect-anomaly',
  authenticate,
  [
    body('deviceId').isString().notEmpty(),
    body('patientDID').isString().notEmpty(),
    body('sensorData').isObject().notEmpty()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { deviceId, patientDID, sensorData } = req.body;

      // Verify user has access to this patient's data
      if (req.user?.id !== patientDID && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to patient data'
        });
      }

      if (!aiBlockchainService) {
        return res.status(503).json({
          success: false,
          error: 'AI-Blockchain service not initialized'
        });
      }

      const anomaly = await aiBlockchainService.detectAnomaliesInIoMTData(
        deviceId,
        patientDID,
        sensorData
      );

      if (!anomaly) {
        return res.json({
          success: true,
          data: {
            anomalyDetected: false,
            message: 'No anomalies detected in sensor data'
          }
        });
      }

      res.json({
        success: true,
        data: {
          anomalyDetected: true,
          ...anomaly
        }
      });
    } catch (error: any) {
      logger.error('Anomaly detection error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to detect anomalies'
      });
    }
  }
);

/**
 * GET /ai-blockchain/iomt/anomalies/:patientDID
 * Get all anomalies detected for a patient
 */
router.get(
  '/iomt/anomalies/:patientDID',
  authenticate,
  [param('patientDID').isString()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { patientDID } = req.params;

      // Verify authorization
      if (req.user?.id !== patientDID && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to patient anomalies'
        });
      }

      const db = req.app.locals.db;
      const anomalies = await db('iomt_anomalies')
        .where({ patient_did: patientDID })
        .orderBy('detected_at', 'desc')
        .limit(100);

      res.json({
        success: true,
        data: anomalies
      });
    } catch (error: any) {
      logger.error('Error retrieving anomalies:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve anomalies'
      });
    }
  }
);

/**
 * POST /ai-blockchain/smart-contracts
 * Create a smart health contract
 */
router.post(
  '/smart-contracts',
  authenticate,
  [
    body('contractType').isIn(['consent', 'insurance_claim', 'prescription', 'clinical_trial', 'data_sharing']),
    body('parties').isArray().notEmpty(),
    body('conditions').isArray().notEmpty()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { contractType, parties, conditions } = req.body;

      if (!aiBlockchainService) {
        return res.status(503).json({
          success: false,
          error: 'AI-Blockchain service not initialized'
        });
      }

      const contractId = await aiBlockchainService.createSmartHealthContract(
        contractType,
        parties,
        conditions
      );

      res.json({
        success: true,
        data: {
          contractId,
          contractType,
          status: 'created'
        }
      });
    } catch (error: any) {
      logger.error('Smart contract creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create smart contract'
      });
    }
  }
);

/**
 * GET /ai-blockchain/smart-contracts/:contractId
 * Get smart contract details
 */
router.get(
  '/smart-contracts/:contractId',
  authenticate,
  [param('contractId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { contractId } = req.params;
      const db = req.app.locals.db;

      const contract = await db('smart_health_contracts')
        .where({ id: contractId })
        .first();

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: 'Contract not found'
        });
      }

      res.json({
        success: true,
        data: contract
      });
    } catch (error: any) {
      logger.error('Error retrieving contract:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve contract'
      });
    }
  }
);

/**
 * GET /ai-blockchain/models
 * Get list of available AI models
 */
router.get(
  '/models',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const db = req.app.locals.db;
      const models = await db('ai_models_registry')
        .where({ status: 'active' })
        .select('id', 'model_name', 'model_type', 'version', 'description', 'accuracy', 'input_schema', 'output_schema');

      res.json({
        success: true,
        data: models
      });
    } catch (error: any) {
      logger.error('Error retrieving models:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve models'
      });
    }
  }
);

/**
 * POST /ai-blockchain/consent
 * Grant or revoke AI analysis consent
 */
router.post(
  '/consent',
  authenticate,
  [
    body('consentGiven').isBoolean(),
    body('consentScope').optional().isArray()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user?.id;
      const { consentGiven, consentScope } = req.body;
      const db = req.app.locals.db;

      // Check if consent record exists
      const existing = await db('patient_ai_consent')
        .where({ user_id: userId })
        .first();

      const crypto = require('crypto');
      const consentData = {
        userId,
        consentGiven,
        consentScope: consentScope || [],
        timestamp: new Date().toISOString()
      };
      const blockchainHash = crypto.createHash('sha256').update(JSON.stringify(consentData)).digest('hex');

      if (existing) {
        // Update existing consent
        await db('patient_ai_consent')
          .where({ user_id: userId })
          .update({
            consent_given: consentGiven,
            consent_scope: JSON.stringify(consentScope || []),
            blockchain_hash: blockchainHash,
            given_at: consentGiven ? new Date() : null,
            revoked_at: consentGiven ? null : new Date()
          });
      } else {
        // Create new consent record
        const { v4: uuidv4 } = require('uuid');
        await db('patient_ai_consent').insert({
          id: uuidv4(),
          user_id: userId,
          consent_given: consentGiven,
          consent_scope: JSON.stringify(consentScope || []),
          blockchain_hash: blockchainHash,
          given_at: consentGiven ? new Date() : null,
          revoked_at: consentGiven ? null : new Date()
        });
      }

      res.json({
        success: true,
        data: {
          userId,
          consentGiven,
          blockchainHash
        }
      });
    } catch (error: any) {
      logger.error('Consent update error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update consent'
      });
    }
  }
);

/**
 * GET /ai-blockchain/consent/:userId
 * Get AI consent status for a user
 */
router.get(
  '/consent/:userId',
  authenticate,
  [param('userId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { userId } = req.params;

      // Verify authorization
      if (req.user?.id !== userId && req.user?.role !== 'provider') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to consent data'
        });
      }

      const db = req.app.locals.db;
      const consent = await db('patient_ai_consent')
        .where({ user_id: userId })
        .first();

      if (!consent) {
        return res.json({
          success: true,
          data: {
            userId,
            consentGiven: false,
            consentScope: [],
            message: 'No consent record found'
          }
        });
      }

      res.json({
        success: true,
        data: {
          userId: consent.user_id,
          consentGiven: consent.consent_given,
          consentScope: consent.consent_scope,
          givenAt: consent.given_at,
          revokedAt: consent.revoked_at,
          blockchainHash: consent.blockchain_hash
        }
      });
    } catch (error: any) {
      logger.error('Error retrieving consent:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve consent'
      });
    }
  }
);

export default router;
