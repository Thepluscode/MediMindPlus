const { ethers } = require('ethers');
const { create } = require('ipfs-http-client');
const crypto = require('crypto');
const HealthDataManagerABI = require('../../build/contracts/HealthDataManager.json');

/**
 * Service for interacting with the HealthDataManager smart contract
 * and managing health data on the blockchain.
 */
class BlockchainHealthService {
    /**
     * Initialize the BlockchainHealthService
     * @param {string} providerUrl - URL of the Ethereum node
     * @param {string} contractAddress - Address of the deployed HealthDataManager contract
     * @param {string} privateKey - Private key for signing transactions
     */
    constructor(providerUrl, contractAddress, privateKey) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.contractAddress = contractAddress;
        this.contract = null;
        this.ipfs = create({ host: 'localhost', port: '5001', protocol: 'http' });
        
        this.initializeContract();
    }
    
    /**
     * Initialize the contract instance with the ABI
     */
    async initializeContract() {
        this.contract = new ethers.Contract(
            this.contractAddress,
            HealthDataManagerABI.abi,
            this.wallet
        );
    }
    
    /**
     * Encrypt and store health data on IPFS, then record the hash on the blockchain
     * @param {Object} healthData - Health data to store
     * @param {string} patientPublicKey - Patient's public key for encryption
     * @returns {Promise<Object>} Transaction details and record information
     */
    async encryptAndStoreHealthData(healthData, patientPublicKey) {
        try {
            // Encrypt health data
            const encryptedData = this.encryptData(JSON.stringify(healthData), patientPublicKey);
            
            // Store on IPFS
            const ipfsResult = await this.ipfs.add(JSON.stringify(encryptedData));
            const dataHash = ipfsResult.path;
            
            // Create metadata
            const metadata = {
                timestamp: Date.now(),
                dataTypes: Object.keys(healthData),
                version: '1.0',
                encryption: 'AES-256-GCM'
            };
            
            const metadataResult = await this.ipfs.add(JSON.stringify(metadata));
            const metadataHash = metadataResult.path;
            
            // Record on blockchain
            const tx = await this.contract.createHealthRecord(dataHash, metadataHash);
            const receipt = await tx.wait();
            
            const event = receipt.events?.find(e => e.event === 'HealthRecordCreated');
            const tokenId = event?.args?.tokenId;
            
            return {
                tokenId: tokenId.toString(),
                dataHash,
                metadataHash,
                txHash: receipt.transactionHash
            };
            
        } catch (error) {
            console.error('Error storing health data:', error);
            throw error;
        }
    }
    
    /**
     * Grant consent for data access to a healthcare provider
     * @param {string} providerAddress - Address of the healthcare provider
     * @param {string} purpose - Purpose of the data access
     * @param {number} duration - Duration of consent in seconds
     * @param {string[]} dataTypes - Array of data types being accessed
     * @param {number} compensation - Compensation amount in ETH
     * @returns {Promise<string>} Transaction hash
     */
    async grantDataAccess(providerAddress, purpose, duration, dataTypes, compensation = 0) {
        try {
            const tx = await this.contract.grantConsent(
                providerAddress,
                purpose,
                duration,
                dataTypes,
                ethers.parseEther(compensation.toString()),
                false // autoRenew
            );
            
            const receipt = await tx.wait();
            return receipt.transactionHash;
            
        } catch (error) {
            console.error('Error granting consent:', error);
            throw error;
        }
    }
    
    /**
     * Access patient health data with proper authorization
     * @param {string} tokenId - ID of the health record
     * @param {string} purpose - Purpose of the access
     * @param {string} providerPrivateKey - Private key of the healthcare provider
     * @returns {Promise<Object>} Decrypted health data and access information
     */
    async accessPatientData(tokenId, purpose, providerPrivateKey) {
        try {
            // Switch to provider wallet
            const providerWallet = new ethers.Wallet(providerPrivateKey, this.provider);
            const providerContract = this.contract.connect(providerWallet);
            
            // Access data hash from blockchain
            const dataHash = await providerContract.accessHealthData(tokenId, purpose);
            
            // Retrieve encrypted data from IPFS
            const chunks = [];
            for await (const chunk of this.ipfs.cat(dataHash)) {
                chunks.push(chunk);
            }
            const encryptedData = JSON.parse(Buffer.concat(chunks).toString());
            
            // Decrypt data (provider would need patient's permission and decryption key)
            const decryptedData = this.decryptData(encryptedData, providerPrivateKey);
            
            return {
                data: JSON.parse(decryptedData),
                accessTimestamp: Date.now(),
                purpose
            };
            
        } catch (error) {
            console.error('Error accessing patient data:', error);
            throw error;
        }
    }
    
    /**
     * Record an AI prediction on the blockchain
     * @param {string} patientAddress - Address of the patient
     * @param {Object} predictionData - Prediction data to record
     * @param {string} modelVersion - Version of the AI model
     * @param {number} confidence - Confidence score (0-1)
     * @returns {Promise<Object>} Record ID and transaction details
     */
    async recordAIPrediction(patientAddress, predictionData, modelVersion, confidence) {
        try {
            // Encrypt prediction data
            const encryptedPrediction = this.encryptData(JSON.stringify(predictionData));
            
            // Store on IPFS
            const ipfsResult = await this.ipfs.add(JSON.stringify(encryptedPrediction));
            const predictionHash = ipfsResult.path;
            
            // Record on blockchain
            const tx = await this.contract.recordPrediction(
                patientAddress,
                modelVersion,
                predictionHash,
                Math.floor(confidence * 100) // Convert to integer percentage
            );
            
            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === 'PredictionRecorded');
            const recordId = event?.args?.recordId;
            
            return {
                recordId: recordId.toString(),
                predictionHash,
                txHash: receipt.transactionHash
            };
            
        } catch (error) {
            console.error('Error recording AI prediction:', error);
            throw error;
        }
    }
    
    /**
     * Create a new research study
     * @param {Object} studyProtocol - Study protocol details
     * @param {number} maxParticipants - Maximum number of participants
     * @param {number} compensationPerParticipant - Compensation per participant in ETH
     * @returns {Promise<Object>} Study ID and transaction details
     */
    async createResearchStudy(studyProtocol, maxParticipants, compensationPerParticipant) {
        try {
            // Store study protocol on IPFS
            const ipfsResult = await this.ipfs.add(JSON.stringify(studyProtocol));
            const studyHash = ipfsResult.path;
            
            const totalCompensation = maxParticipants * compensationPerParticipant;
            
            const tx = await this.contract.createResearchStudy(
                studyHash,
                maxParticipants,
                ethers.parseEther(compensationPerParticipant.toString()),
                { value: ethers.parseEther(totalCompensation.toString()) }
            );
            
            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === 'ResearchStudyCreated');
            const studyId = event?.args?.studyId;
            
            return {
                studyId: studyId.toString(),
                studyHash,
                txHash: receipt.transactionHash
            };
            
        } catch (error) {
            console.error('Error creating research study:', error);
            throw error;
        }
    }
    
    /**
     * Join a research study
     * @param {string} studyId - ID of the study to join
     * @returns {Promise<string>} Transaction hash
     */
    async joinResearchStudy(studyId) {
        try {
            const tx = await this.contract.joinResearchStudy(studyId);
            const receipt = await tx.wait();
            
            return receipt.transactionHash;
            
        } catch (error) {
            console.error('Error joining research study:', error);
            throw error;
        }
    }
    
    /**
     * Get all health records for a patient
     * @param {string} patientAddress - Address of the patient
     * @returns {Promise<Array>} Array of health record details
     */
    async getPatientRecords(patientAddress) {
        try {
            const recordIds = await this.contract.getPatientRecords(patientAddress);
            const records = [];
            
            for (const recordId of recordIds) {
                const record = await this.contract.healthRecords(recordId);
                records.push({
                    tokenId: record.tokenId.toString(),
                    patient: record.patient,
                    dataHash: record.dataHash,
                    metadataHash: record.metadataHash,
                    timestamp: new Date(record.timestamp.toNumber() * 1000),
                    isActive: record.isActive
                });
            }
            
            return records;
            
        } catch (error) {
            console.error('Error retrieving patient records:', error);
            throw error;
        }
    }
    
    /**
     * Get the reputation score of a user
     * @param {string} userAddress - Address of the user
     * @returns {Promise<number>} Reputation score
     */
    async getReputationScore(userAddress) {
        try {
            const score = await this.contract.getReputationScore(userAddress);
            return score.toNumber();
            
        } catch (error) {
            console.error('Error retrieving reputation score:', error);
            throw error;
        }
    }
    
    /**
     * Monitor contract events
     */
    monitorContractEvents() {
        // Listen for important events
        this.contract.on('HealthRecordCreated', (tokenId, patient, dataHash, event) => {
            console.log(`New health record created: ${tokenId} for patient ${patient}`);
            this.handleHealthRecordCreated(tokenId, patient, dataHash);
        });
        
        this.contract.on('ConsentGranted', (consentId, patient, provider, event) => {
            console.log(`Consent granted: ${consentId} by ${patient} to ${provider}`);
            this.handleConsentGranted(consentId, patient, provider);
        });
        
        this.contract.on('DataAccessed', (tokenId, accessor, purpose, event) => {
            console.log(`Data accessed: Record ${tokenId} by ${accessor} for ${purpose}`);
            this.handleDataAccessed(tokenId, accessor, purpose);
        });
        
        this.contract.on('PredictionRecorded', (recordId, patient, modelVersion, event) => {
            console.log(`AI prediction recorded: ${recordId} for ${patient} using ${modelVersion}`);
            this.handlePredictionRecorded(recordId, patient, modelVersion);
        });
    }
    
    // Event handlers (to be implemented by the application)
    
    /**
     * Handle health record creation
     * @param {string} tokenId - ID of the health record
     * @param {string} patient - Address of the patient
     * @param {string} dataHash - IPFS hash of the health data
     */
    async handleHealthRecordCreated(tokenId, patient, dataHash) {
        // Notify patient of successful record creation
        // Update local database
        // Trigger any automated processes
    }
    
    /**
     * Handle consent granted event
     * @param {string} consentId - ID of the consent
     * @param {string} patient - Address of the patient
     * @param {string} provider - Address of the healthcare provider
     */
    async handleConsentGranted(consentId, patient, provider) {
        // Update consent tracking system
        // Notify provider of granted access
        // Set up automated compliance monitoring
    }
    
    /**
     * Handle data access event
     * @param {string} tokenId - ID of the health record
     * @param {string} accessor - Address of the entity accessing the data
     * @param {string} purpose - Purpose of the access
     */
    async handleDataAccessed(tokenId, accessor, purpose) {
        // Log access for audit trail
        // Update usage analytics
        // Check for any policy violations
    }
    
    /**
     * Handle prediction recorded event
     * @param {string} recordId - ID of the prediction record
     * @param {string} patient - Address of the patient
     * @param {string} modelVersion - Version of the AI model
     */
    async handlePredictionRecorded(recordId, patient, modelVersion) {
        // Notify patient of new prediction
        // Update clinical decision support systems
        // Trigger follow-up recommendations
    }
    
    // Encryption utilities
    
    /**
     * Encrypt data using AES-256-GCM or RSA
     * @param {string} data - Data to encrypt
     * @param {string} [publicKey] - Optional public key for asymmetric encryption
     * @returns {Object|Buffer} Encrypted data and metadata or buffer
     */
    encryptData(data, publicKey = null) {
        // Use patient's public key if provided, otherwise use symmetric encryption
        if (publicKey) {
            // Asymmetric encryption for sharing
            return crypto.publicEncrypt(publicKey, Buffer.from(data));
        } else {
            // Symmetric encryption for storage
            const algorithm = 'aes-256-gcm';
            const key = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipher(algorithm, key);
            cipher.setAAD(Buffer.from('health-data'));
            
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                key: key.toString('hex'),
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm
            };
        }
    }
    
    /**
     * Decrypt data using AES-256-GCM or RSA
     * @param {Object|Buffer} encryptedData - Encrypted data to decrypt
     * @param {string} [privateKey] - Optional private key for decryption
     * @returns {string} Decrypted data
     */
    decryptData(encryptedData, privateKey = null) {
        if (privateKey && typeof encryptedData === 'object' && encryptedData.encrypted) {
            // Asymmetric decryption
            return crypto.privateDecrypt(privateKey, encryptedData).toString();
        } else if (typeof encryptedData === 'object') {
            // Symmetric decryption
            const { encrypted, key, iv, authTag, algorithm } = encryptedData;
            
            const decipher = crypto.createDecipher(algorithm, Buffer.from(key, 'hex'));
            decipher.setAAD(Buffer.from('health-data'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        }
        
        throw new Error('Invalid encrypted data format');
    }
    
    /**
     * Audit data access for compliance
     * @param {number} startDate - Start timestamp
     * @param {number} endDate - End timestamp
     * @returns {Promise<Array>} Audit log entries
     */
    async auditDataAccess(startDate, endDate) {
        try {
            const filter = this.contract.filters.DataAccessed();
            const events = await this.contract.queryFilter(filter, startDate, endDate);
            
            const auditLog = events.map(event => ({
                tokenId: event.args.tokenId.toString(),
                accessor: event.args.accessor,
                purpose: event.args.purpose,
                timestamp: new Date(event.blockNumber * 1000), // Approximate
                txHash: event.transactionHash
            }));
            
            return auditLog;
            
        } catch (error) {
            console.error('Error auditing data access:', error);
            throw error;
        }
    }
    
    /**
     * Generate a compliance report for a patient
     * @param {string} patientAddress - Address of the patient
     * @param {number} startDate - Start timestamp
     * @param {number} endDate - End timestamp
     * @returns {Promise<Object>} Compliance report
     */
    async generateComplianceReport(patientAddress, startDate, endDate) {
        try {
            const records = await this.getPatientRecords(patientAddress);
            const auditLog = await this.auditDataAccess(startDate, endDate);
            
            const patientAuditLog = auditLog.filter(log => 
                records.some(record => record.tokenId === log.tokenId)
            );
            
            const accessByProvider = patientAuditLog.reduce((acc, log) => {
                if (!acc[log.accessor]) {
                    acc[log.accessor] = [];
                }
                acc[log.accessor].push(log);
                return acc;
            }, {});
            
            return {
                patient: patientAddress,
                reportPeriod: { startDate, endDate },
                totalRecords: records.length,
                totalAccesses: patientAuditLog.length,
                accessByProvider,
                complianceStatus: 'compliant', // Would include actual compliance checks
                recommendations: []
            };
            
        } catch (error) {
            console.error('Error generating compliance report:', error);
            throw error;
        }
    }
}

module.exports = BlockchainHealthService;
