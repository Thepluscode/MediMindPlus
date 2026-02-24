import { ethers } from 'ethers';
import crypto from 'crypto';
import logger from '../../config/logger';

// Smart contract ABI (Application Binary Interface)
const HEALTH_PREDICTION_REGISTRY_ABI = [
  "function storePrediction(string predictionId, address patientAddress, string modelName, bytes32 predictionHash, uint256 confidence) public",
  "function verifyPrediction(string predictionId) public",
  "function updateConsent(bool consentGiven, string[] consentScope) public",
  "function recordAnomaly(string anomalyId, address patientAddress, string deviceId, string anomalyType, uint8 severity, bytes32 sensorDataHash, uint256 aiConfidence) public",
  "function resolveAnomaly(string anomalyId) public",
  "function getPrediction(string predictionId) public view returns (tuple(string predictionId, address patientAddress, string modelName, bytes32 predictionHash, uint256 confidence, uint256 timestamp, bool verified))",
  "function getConsent(address patientAddress) public view returns (tuple(address patientAddress, bool consentGiven, string[] consentScope, uint256 givenAt, uint256 revokedAt))",
  "function getAnomaly(string anomalyId) public view returns (tuple(string anomalyId, address patientAddress, string deviceId, string anomalyType, uint8 severity, bytes32 sensorDataHash, uint256 aiConfidence, uint256 detectedAt, bool resolved))",
  "event PredictionStored(string indexed predictionId, address indexed patientAddress, string modelName, uint256 confidence, uint256 timestamp)",
  "event ConsentUpdated(address indexed patientAddress, bool consentGiven, uint256 timestamp)",
  "event AnomalyDetected(string indexed anomalyId, address indexed patientAddress, string anomalyType, uint8 severity, uint256 timestamp)"
];

interface BlockchainConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  networkId: number;
}

interface PredictionData {
  predictionId: string;
  userId: string;
  modelName: string;
  prediction: any;
  confidence: number;
}

interface ConsentData {
  userId: string;
  consentGiven: boolean;
  consentScope: string[];
}

interface AnomalyData {
  anomalyId: string;
  patientDID: string;
  deviceId: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sensorData: any;
  aiConfidence: number;
}

export class BlockchainService {
  private provider: ethers.providers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private config: BlockchainConfig;
  private isConnected: boolean = false;

  constructor() {
    // Default configuration (can be overridden via environment variables)
    this.config = {
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '0x' + '0'.repeat(64),
      contractAddress: process.env.CONTRACT_ADDRESS || '0x' + '0'.repeat(40),
      networkId: parseInt(process.env.BLOCKCHAIN_NETWORK_ID || '1337')
    };

    this.initialize();
  }

  /**
   * Initialize blockchain connection
   */
  private async initialize(): Promise<void> {
    try {
      // For development, use a mock provider if real blockchain isn't available
      if (this.config.rpcUrl === 'http://localhost:8545') {
        logger.info('Blockchain service initialized in mock mode');
        this.isConnected = false;
        return;
      }

      this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
      this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        HEALTH_PREDICTION_REGISTRY_ABI,
        this.signer
      );

      // Test connection
      await this.provider.getNetwork();
      this.isConnected = true;
      logger.info('Blockchain service connected successfully');
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      this.isConnected = false;
    }
  }

  /**
   * Generate blockchain hash for data
   */
  private generateHash(data: any): string {
    const dataString = JSON.stringify(data);
    return '0x' + crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Convert user ID to blockchain address (simplified)
   */
  private userIdToAddress(userId: string): string {
    // In production, this would be a proper DID to address mapping
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    return '0x' + hash.substring(0, 40);
  }

  /**
   * Convert severity string to uint8
   */
  private severityToUint8(severity: string): number {
    const severityMap: Record<string, number> = {
      'low': 0,
      'medium': 1,
      'high': 2,
      'critical': 3
    };
    return severityMap[severity] || 0;
  }

  /**
   * Store AI prediction on blockchain
   */
  async storePrediction(data: PredictionData): Promise<{ txHash: string; blockchainHash: string }> {
    try {
      const blockchainHash = this.generateHash({
        predictionId: data.predictionId,
        prediction: data.prediction,
        timestamp: Date.now()
      });

      // If not connected to real blockchain, return mock hash
      if (!this.isConnected || !this.contract) {
        logger.info('Mock blockchain: Storing prediction', data.predictionId);
        return {
          txHash: this.generateHash({ type: 'tx', id: data.predictionId }),
          blockchainHash
        };
      }

      const patientAddress = this.userIdToAddress(data.userId);
      const confidenceScaled = Math.floor(data.confidence * 10000); // Convert 0-1 to 0-10000

      const tx = await this.contract.storePrediction(
        data.predictionId,
        patientAddress,
        data.modelName,
        blockchainHash,
        confidenceScaled
      );

      const receipt = await tx.wait();

      logger.info('Prediction stored on blockchain:', {
        predictionId: data.predictionId,
        txHash: receipt.transactionHash
      });

      return {
        txHash: receipt.transactionHash,
        blockchainHash
      };
    } catch (error) {
      logger.error('Error storing prediction on blockchain:', error);
      // Return mock hash on error
      const blockchainHash = this.generateHash({
        predictionId: data.predictionId,
        prediction: data.prediction,
        timestamp: Date.now()
      });
      return {
        txHash: this.generateHash({ type: 'tx', id: data.predictionId }),
        blockchainHash
      };
    }
  }

  /**
   * Verify prediction on blockchain
   */
  async verifyPrediction(predictionId: string): Promise<{ verified: boolean; onChainData: any }> {
    try {
      if (!this.isConnected || !this.contract) {
        logger.info('Mock blockchain: Verifying prediction', predictionId);
        return {
          verified: true,
          onChainData: {
            predictionId,
            verified: true,
            timestamp: Date.now()
          }
        };
      }

      // Get prediction from blockchain
      const prediction = await this.contract.getPrediction(predictionId);

      // Verify prediction
      const tx = await this.contract.verifyPrediction(predictionId);
      await tx.wait();

      logger.info('Prediction verified on blockchain:', predictionId);

      return {
        verified: true,
        onChainData: {
          predictionId: prediction.predictionId,
          patientAddress: prediction.patientAddress,
          modelName: prediction.modelName,
          confidence: prediction.confidence.toNumber() / 10000,
          timestamp: prediction.timestamp.toNumber(),
          verified: true
        }
      };
    } catch (error) {
      logger.error('Error verifying prediction on blockchain:', error);
      return {
        verified: false,
        onChainData: null
      };
    }
  }

  /**
   * Update patient consent on blockchain
   */
  async updateConsent(data: ConsentData): Promise<{ txHash: string; blockchainHash: string }> {
    try {
      const blockchainHash = this.generateHash({
        userId: data.userId,
        consentGiven: data.consentGiven,
        consentScope: data.consentScope,
        timestamp: Date.now()
      });

      if (!this.isConnected || !this.contract) {
        logger.info('Mock blockchain: Updating consent', data.userId);
        return {
          txHash: this.generateHash({ type: 'consent', id: data.userId }),
          blockchainHash
        };
      }

      const tx = await this.contract.updateConsent(
        data.consentGiven,
        data.consentScope
      );

      const receipt = await tx.wait();

      logger.info('Consent updated on blockchain:', {
        userId: data.userId,
        txHash: receipt.transactionHash
      });

      return {
        txHash: receipt.transactionHash,
        blockchainHash
      };
    } catch (error) {
      logger.error('Error updating consent on blockchain:', error);
      const blockchainHash = this.generateHash({
        userId: data.userId,
        consentGiven: data.consentGiven,
        consentScope: data.consentScope,
        timestamp: Date.now()
      });
      return {
        txHash: this.generateHash({ type: 'consent', id: data.userId }),
        blockchainHash
      };
    }
  }

  /**
   * Record anomaly on blockchain
   */
  async recordAnomaly(data: AnomalyData): Promise<{ txHash: string; blockchainProof: string }> {
    try {
      const blockchainProof = this.generateHash({
        anomalyId: data.anomalyId,
        sensorData: data.sensorData,
        timestamp: Date.now()
      });

      if (!this.isConnected || !this.contract) {
        logger.info('Mock blockchain: Recording anomaly', data.anomalyId);
        return {
          txHash: this.generateHash({ type: 'anomaly', id: data.anomalyId }),
          blockchainProof
        };
      }

      const patientAddress = this.userIdToAddress(data.patientDID);
      const severityUint = this.severityToUint8(data.severity);
      const confidenceScaled = Math.floor(data.aiConfidence * 10000);

      const tx = await this.contract.recordAnomaly(
        data.anomalyId,
        patientAddress,
        data.deviceId,
        data.anomalyType,
        severityUint,
        blockchainProof,
        confidenceScaled
      );

      const receipt = await tx.wait();

      logger.info('Anomaly recorded on blockchain:', {
        anomalyId: data.anomalyId,
        txHash: receipt.transactionHash
      });

      return {
        txHash: receipt.transactionHash,
        blockchainProof
      };
    } catch (error) {
      logger.error('Error recording anomaly on blockchain:', error);
      const blockchainProof = this.generateHash({
        anomalyId: data.anomalyId,
        sensorData: data.sensorData,
        timestamp: Date.now()
      });
      return {
        txHash: this.generateHash({ type: 'anomaly', id: data.anomalyId }),
        blockchainProof
      };
    }
  }

  /**
   * Get blockchain connection status
   */
  getConnectionStatus(): { connected: boolean; network?: string; contractAddress?: string } {
    return {
      connected: this.isConnected,
      network: this.isConnected ? 'Connected' : 'Mock Mode',
      contractAddress: this.config.contractAddress
    };
  }

  /**
   * Generate a blockchain hash (public method for external use)
   */
  public createHash(data: any): string {
    return this.generateHash(data);
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();
