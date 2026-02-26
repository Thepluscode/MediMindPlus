/**
 * Blockchain-based Health Data Management Service
 * Implements secure, immutable health records with smart contracts
 */

interface HealthRecord {
  id: string;
  patientId: string;
  providerId: string;
  recordType: 'vital_signs' | 'diagnosis' | 'prescription' | 'lab_result' | 'imaging';
  data: any;
  timestamp: Date;
  hash: string;
  previousHash: string;
  signature: string;
  accessPermissions: AccessPermission[];
}

interface AccessPermission {
  grantedTo: string; // Provider ID or patient ID
  permissionType: 'read' | 'write' | 'admin';
  expiresAt: Date;
  purpose: string;
  consentHash: string;
}

interface SmartContract {
  id: string;
  type: 'consent' | 'access_control' | 'data_sharing' | 'audit';
  code: string;
  deployedAt: Date;
  owner: string;
  isActive: boolean;
}

interface ConsentRecord {
  id: string;
  patientId: string;
  providerId: string;
  dataTypes: string[];
  permissions: string[];
  grantedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  purpose: string;
  legalBasis: string;
}

interface AuditLog {
  id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'share';
  recordId: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
}

class CryptographicEngine {
  private keyPairs: Map<string, { publicKey: string; privateKey: string }> = new Map();

  async generateKeyPair(userId: string): Promise<{ publicKey: string; privateKey: string }> {
    // Simulate key generation (in real implementation would use Web Crypto API)
    const keyPair = {
      publicKey: `pub_${userId}_${Date.now()}`,
      privateKey: `priv_${userId}_${Date.now()}`
    };
    
    this.keyPairs.set(userId, keyPair);
    console.log(`🔑 Generated key pair for user: ${userId}`);
    
    return keyPair;
  }

  async signData(data: any, privateKey: string): Promise<string> {
    // Simulate digital signature (in real implementation would use ECDSA)
    const dataString = JSON.stringify(data);
    const signature = btoa(`${privateKey}_${dataString}_${Date.now()}`);
    return signature;
  }

  async verifySignature(data: any, signature: string, publicKey: string): Promise<boolean> {
    // Simulate signature verification
    const dataString = JSON.stringify(data);
    const decodedSig = atob(signature);
    return decodedSig.includes(publicKey.replace('pub_', 'priv_'));
  }

  async hashData(data: any): Promise<string> {
    // Simulate SHA-256 hashing (in real implementation would use Web Crypto API)
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  async encryptData(data: any, publicKey: string): Promise<string> {
    // Simulate encryption (in real implementation would use RSA/AES)
    const dataString = JSON.stringify(data);
    return btoa(`${publicKey}_${dataString}`);
  }

  async decryptData(encryptedData: string, privateKey: string): Promise<any> {
    // Simulate decryption
    const decoded = atob(encryptedData);
    const parts = decoded.split('_');
    if (parts.length >= 2) {
      const dataString = parts.slice(1).join('_');
      return JSON.parse(dataString);
    }
    throw new Error('Decryption failed');
  }
}

class SmartContractEngine {
  private contracts: Map<string, SmartContract> = new Map();
  private contractExecutions: Map<string, any[]> = new Map();

  async deployContract(contract: Omit<SmartContract, 'id' | 'deployedAt'>): Promise<string> {
    const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const deployedContract: SmartContract = {
      ...contract,
      id: contractId,
      deployedAt: new Date()
    };
    
    this.contracts.set(contractId, deployedContract);
    console.log(`📜 Smart contract deployed: ${contractId} (${contract.type})`);
    
    return contractId;
  }

  async executeContract(contractId: string, params: any): Promise<any> {
    const contract = this.contracts.get(contractId);
    
    if (!contract || !contract.isActive) {
      throw new Error('Contract not found or inactive');
    }
    
    // Simulate contract execution
    const execution = {
      contractId,
      params,
      timestamp: new Date(),
      result: this.simulateContractExecution(contract, params)
    };
    
    const executions = this.contractExecutions.get(contractId) || [];
    executions.push(execution);
    this.contractExecutions.set(contractId, executions);
    
    console.log(`⚡ Contract executed: ${contractId}`);
    return execution.result;
  }

  private simulateContractExecution(contract: SmartContract, params: any): any {
    switch (contract.type) {
      case 'consent':
        return this.executeConsentContract(params);
      case 'access_control':
        return this.executeAccessControlContract(params);
      case 'data_sharing':
        return this.executeDataSharingContract(params);
      case 'audit':
        return this.executeAuditContract(params);
      default:
        return { success: false, error: 'Unknown contract type' };
    }
  }

  private executeConsentContract(params: any): any {
    // Simulate consent management logic
    if (params.action === 'grant') {
      return {
        success: true,
        consentId: `consent_${Date.now()}`,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };
    } else if (params.action === 'revoke') {
      return {
        success: true,
        revokedAt: new Date(),
        reason: params.reason || 'Patient request'
      };
    }
    return { success: false, error: 'Invalid consent action' };
  }

  private executeAccessControlContract(params: any): any {
    // Simulate access control logic
    const hasPermission = Math.random() > 0.1; // 90% success rate for demo
    
    return {
      success: hasPermission,
      accessGranted: hasPermission,
      reason: hasPermission ? 'Access granted' : 'Insufficient permissions',
      timestamp: new Date()
    };
  }

  private executeDataSharingContract(params: any): any {
    // Simulate data sharing logic
    return {
      success: true,
      sharingId: `share_${Date.now()}`,
      sharedWith: params.recipient,
      dataTypes: params.dataTypes,
      purpose: params.purpose,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  private executeAuditContract(params: any): any {
    // Simulate audit logging
    return {
      success: true,
      auditId: `audit_${Date.now()}`,
      action: params.action,
      timestamp: new Date(),
      logged: true
    };
  }

  getContract(contractId: string): SmartContract | undefined {
    return this.contracts.get(contractId);
  }

  getContractExecutions(contractId: string): any[] {
    return this.contractExecutions.get(contractId) || [];
  }
}

export class HealthDataBlockchainService {
  private static instance: HealthDataBlockchainService;
  private isInitialized = false;
  private cryptoEngine: CryptographicEngine = new CryptographicEngine();
  private contractEngine: SmartContractEngine = new SmartContractEngine();
  private healthRecords: Map<string, HealthRecord> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private auditLogs: AuditLog[] = [];
  private blockchain: HealthRecord[] = []; // Simplified blockchain structure

  static getInstance(): HealthDataBlockchainService {
    if (!HealthDataBlockchainService.instance) {
      HealthDataBlockchainService.instance = new HealthDataBlockchainService();
    }
    return HealthDataBlockchainService.instance;
  }

  static async initialize(): Promise<void> {
    const instance = HealthDataBlockchainService.getInstance();
    await instance.initialize();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔗 Initializing Blockchain Health Data Management...');
      
      // Deploy core smart contracts
      await this.deployConsentContract();
      await this.deployAccessControlContract();
      await this.deployDataSharingContract();
      await this.deployAuditContract();
      
      // Initialize genesis block
      await this.createGenesisBlock();
      
      this.isInitialized = true;
      console.log('✅ Blockchain Health Data Management initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Blockchain Health Data Management:', error);
      throw error;
    }
  }

  private async deployConsentContract(): Promise<void> {
    await this.contractEngine.deployContract({
      type: 'consent',
      code: 'consent_management_v1',
      owner: 'system',
      isActive: true
    });
  }

  private async deployAccessControlContract(): Promise<void> {
    await this.contractEngine.deployContract({
      type: 'access_control',
      code: 'access_control_v1',
      owner: 'system',
      isActive: true
    });
  }

  private async deployDataSharingContract(): Promise<void> {
    await this.contractEngine.deployContract({
      type: 'data_sharing',
      code: 'data_sharing_v1',
      owner: 'system',
      isActive: true
    });
  }

  private async deployAuditContract(): Promise<void> {
    await this.contractEngine.deployContract({
      type: 'audit',
      code: 'audit_logging_v1',
      owner: 'system',
      isActive: true
    });
  }

  private async createGenesisBlock(): Promise<void> {
    const genesisRecord: HealthRecord = {
      id: 'genesis',
      patientId: 'system',
      providerId: 'system',
      recordType: 'vital_signs',
      data: { message: 'MediMind Blockchain Genesis Block' },
      timestamp: new Date(),
      hash: await this.cryptoEngine.hashData('genesis'),
      previousHash: '0',
      signature: 'genesis_signature',
      accessPermissions: []
    };

    this.blockchain.push(genesisRecord);
    console.log('🎯 Genesis block created');
  }

  /**
   * Create a new health record on the blockchain
   */
  async createHealthRecord(
    patientId: string,
    providerId: string,
    recordType: HealthRecord['recordType'],
    data: any,
    requesterPrivateKey: string
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Generate record ID
      const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get previous block hash
      const previousHash = this.blockchain.length > 0
        ? this.blockchain[this.blockchain.length - 1].hash
        : '0';

      // Create record data
      const recordData = {
        id: recordId,
        patientId,
        providerId,
        recordType,
        data,
        timestamp: new Date(),
        previousHash
      };

      // Generate hash and signature
      const hash = await this.cryptoEngine.hashData(recordData);
      const signature = await this.cryptoEngine.signData(recordData, requesterPrivateKey);

      // Create health record
      const healthRecord: HealthRecord = {
        ...recordData,
        hash,
        signature,
        accessPermissions: [
          {
            grantedTo: patientId,
            permissionType: 'admin',
            expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
            purpose: 'Patient ownership',
            consentHash: await this.cryptoEngine.hashData({ patientId, purpose: 'ownership' })
          },
          {
            grantedTo: providerId,
            permissionType: 'write',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            purpose: 'Healthcare provider access',
            consentHash: await this.cryptoEngine.hashData({ providerId, purpose: 'treatment' })
          }
        ]
      };

      // Add to blockchain
      this.blockchain.push(healthRecord);
      this.healthRecords.set(recordId, healthRecord);

      // Log audit trail
      await this.logAudit('create', recordId, providerId, true);

      console.log(`📝 Health record created: ${recordId}`);
      return recordId;

    } catch (error) {
      console.error('❌ Failed to create health record:', error);
      throw error;
    }
  }

  /**
   * Retrieve health record with access control
   */
  async getHealthRecord(recordId: string, requesterId: string): Promise<HealthRecord | null> {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const record = this.healthRecords.get(recordId);

      if (!record) {
        await this.logAudit('read', recordId, requesterId, false, 'Record not found');
        return null;
      }

      // Check access permissions
      const hasAccess = await this.checkAccess(record, requesterId, 'read');

      if (!hasAccess) {
        await this.logAudit('read', recordId, requesterId, false, 'Access denied');
        throw new Error('Access denied');
      }

      // Log successful access
      await this.logAudit('read', recordId, requesterId, true);

      return record;

    } catch (error) {
      console.error('❌ Failed to retrieve health record:', error);
      throw error;
    }
  }

  /**
   * Grant consent for data access
   */
  async grantConsent(
    patientId: string,
    providerId: string,
    dataTypes: string[],
    permissions: string[],
    purpose: string,
    expiresAt: Date,
    patientPrivateKey: string
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const consentData = {
        id: consentId,
        patientId,
        providerId,
        dataTypes,
        permissions,
        grantedAt: new Date(),
        expiresAt,
        purpose,
        legalBasis: 'Patient consent'
      };

      // Execute consent smart contract
      const contractResult = await this.contractEngine.executeContract('consent_contract', {
        action: 'grant',
        ...consentData
      });

      if (!contractResult.success) {
        throw new Error('Consent contract execution failed');
      }

      // Create consent record
      const consentRecord: ConsentRecord = {
        ...consentData,
        isRevoked: false
      };

      this.consentRecords.set(consentId, consentRecord);

      // Log audit trail
      await this.logAudit('create', consentId, patientId, true, 'Consent granted');

      console.log(`✅ Consent granted: ${consentId}`);
      return consentId;

    } catch (error) {
      console.error('❌ Failed to grant consent:', error);
      throw error;
    }
  }

  /**
   * Revoke consent
   */
  async revokeConsent(consentId: string, patientId: string, reason: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const consentRecord = this.consentRecords.get(consentId);

      if (!consentRecord) {
        throw new Error('Consent record not found');
      }

      if (consentRecord.patientId !== patientId) {
        throw new Error('Unauthorized to revoke this consent');
      }

      // Execute consent revocation contract
      const contractResult = await this.contractEngine.executeContract('consent_contract', {
        action: 'revoke',
        consentId,
        reason
      });

      if (!contractResult.success) {
        throw new Error('Consent revocation contract execution failed');
      }

      // Update consent record
      consentRecord.isRevoked = true;
      consentRecord.revokedAt = new Date();
      this.consentRecords.set(consentId, consentRecord);

      // Log audit trail
      await this.logAudit('update', consentId, patientId, true, `Consent revoked: ${reason}`);

      console.log(`🚫 Consent revoked: ${consentId}`);

    } catch (error) {
      console.error('❌ Failed to revoke consent:', error);
      throw error;
    }
  }

  /**
   * Check access permissions
   */
  private async checkAccess(record: HealthRecord, requesterId: string, action: 'read' | 'write'): Promise<boolean> {
    // Check direct permissions
    const permission = record.accessPermissions.find(p =>
      p.grantedTo === requesterId &&
      (p.permissionType === action || p.permissionType === 'admin') &&
      p.expiresAt > new Date()
    );

    if (permission) {
      return true;
    }

    // Check consent-based permissions
    const relevantConsents = Array.from(this.consentRecords.values()).filter(consent =>
      consent.patientId === record.patientId &&
      consent.providerId === requesterId &&
      !consent.isRevoked &&
      consent.expiresAt > new Date() &&
      consent.permissions.includes(action)
    );

    return relevantConsents.length > 0;
  }

  /**
   * Log audit trail
   */
  private async logAudit(
    action: AuditLog['action'],
    recordId: string,
    userId: string,
    success: boolean,
    reason?: string
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      recordId,
      userId,
      timestamp: new Date(),
      ipAddress: '127.0.0.1', // Would be actual IP in real implementation
      userAgent: 'MediMind-App',
      success,
      reason
    };

    this.auditLogs.push(auditLog);

    // Execute audit smart contract
    await this.contractEngine.executeContract('audit_contract', auditLog);
  }

  /**
   * Get audit logs for a record
   */
  async getAuditLogs(recordId: string, requesterId: string): Promise<AuditLog[]> {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    // Check if requester has admin access to the record
    const record = this.healthRecords.get(recordId);
    if (!record) {
      throw new Error('Record not found');
    }

    const hasAdminAccess = await this.checkAccess(record, requesterId, 'read');
    if (!hasAdminAccess && record.patientId !== requesterId) {
      throw new Error('Insufficient permissions to view audit logs');
    }

    return this.auditLogs.filter(log => log.recordId === recordId);
  }

  /**
   * Verify blockchain integrity
   */
  async verifyBlockchainIntegrity(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (let i = 1; i < this.blockchain.length; i++) {
      const currentBlock = this.blockchain[i];
      const previousBlock = this.blockchain[i - 1];

      // Verify previous hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        errors.push(`Block ${i}: Previous hash mismatch`);
      }

      // Verify current hash
      const expectedHash = await this.cryptoEngine.hashData({
        id: currentBlock.id,
        patientId: currentBlock.patientId,
        providerId: currentBlock.providerId,
        recordType: currentBlock.recordType,
        data: currentBlock.data,
        timestamp: currentBlock.timestamp,
        previousHash: currentBlock.previousHash
      });

      if (currentBlock.hash !== expectedHash) {
        errors.push(`Block ${i}: Hash verification failed`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get blockchain statistics
   */
  getBlockchainStats(): any {
    return {
      totalBlocks: this.blockchain.length,
      totalRecords: this.healthRecords.size,
      totalConsents: this.consentRecords.size,
      totalAuditLogs: this.auditLogs.length,
      activeConsents: Array.from(this.consentRecords.values()).filter(c => !c.isRevoked && c.expiresAt > new Date()).length,
      lastBlockTimestamp: this.blockchain.length > 0 ? this.blockchain[this.blockchain.length - 1].timestamp : null
    };
  }
}
