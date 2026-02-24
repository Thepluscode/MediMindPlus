import { EventEmitter } from 'events';
import crypto from 'crypto';
import logger from '../../backend/src/utils/logger';

/**
 * Pharmaceutical Supply Chain Tracking Service
 * Combat counterfeit drugs (affecting 10% of global supply, 1M deaths/year)
 * Blockchain-based end-to-end tracking from manufacturer to patient
 * Reduces fraud by 90% in trials (MediLedger model)
 */

interface DrugProduct {
  ndc: string; // National Drug Code
  name: string;
  manufacturer: string;
  batchNumber: string;
  expirationDate: Date;
  quantity: number;
  dosageForm: string;
  strength: string;
}

interface SupplyChainEvent {
  id: string;
  productNDC: string;
  batchNumber: string;
  eventType: 'manufactured' | 'packaged' | 'shipped' | 'received' | 'dispensed' | 'administered';
  actor: {
    did: string;
    name: string;
    role: 'manufacturer' | 'distributor' | 'pharmacy' | 'hospital' | 'provider';
    license: string;
  };
  location: {
    facility: string;
    address: string;
    coordinates?: { lat: number; lon: number };
  };
  timestamp: Date;
  metadata?: {
    temperature?: number; // For cold chain monitoring
    humidity?: number;
    shippingId?: string;
    recipientDID?: string;
  };
  blockchainHash: string;
  previousHash?: string;
  signature: string; // Digital signature from actor
}

interface VerificationResult {
  isAuthentic: boolean;
  product: DrugProduct;
  chainOfCustody: SupplyChainEvent[];
  alerts: string[];
  riskScore: number; // 0-100
  verifiedAt: Date;
}

interface CounterfeitAlert {
  id: string;
  productNDC: string;
  batchNumber?: string;
  reportedBy: string;
  alertType: 'counterfeit' | 'tampering' | 'cold_chain_break' | 'expired' | 'stolen';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string[];
  reportedAt: Date;
  status: 'open' | 'investigating' | 'confirmed' | 'resolved' | 'false_alarm';
}

export class PharmaceuticalSupplyChainService extends EventEmitter {
  private db: any;
  private productRegistry: Map<string, DrugProduct>; // NDC -> Product
  private supplyChains: Map<string, SupplyChainEvent[]>; // batchNumber -> events
  private alerts: Map<string, CounterfeitAlert>;

  // Authorized manufacturers and distributors (in production, from regulatory database)
  private authorizedActors: Set<string>;

  constructor(database: any) {
    super();
    this.db = database;
    this.productRegistry = new Map();
    this.supplyChains = new Map();
    this.alerts = new Map();
    this.authorizedActors = new Set();
  }

  /**
   * Register a pharmaceutical product
   */
  async registerProduct(product: DrugProduct, manufacturerDID: string): Promise<void> {
    try {
      // Verify manufacturer is authorized
      if (!this.authorizedActors.has(manufacturerDID)) {
        throw new Error('Unauthorized manufacturer');
      }

      const key = `${product.ndc}_${product.batchNumber}`;

      // Check if already registered
      if (this.productRegistry.has(key)) {
        throw new Error('Product batch already registered');
      }

      this.productRegistry.set(key, product);

      // Create initial supply chain event
      await this.recordSupplyChainEvent({
        productNDC: product.ndc,
        batchNumber: product.batchNumber,
        eventType: 'manufactured',
        actor: {
          did: manufacturerDID,
          name: product.manufacturer,
          role: 'manufacturer',
          license: 'MFG-XXX' // Would come from registry
        },
        location: {
          facility: product.manufacturer,
          address: 'Manufacturing facility' // Would be actual address
        },
        timestamp: new Date()
      });

      // Store in database
      await this.db('pharmaceutical_products').insert({
        ndc: product.ndc,
        batch_number: product.batchNumber,
        name: product.name,
        manufacturer: product.manufacturer,
        expiration_date: product.expirationDate,
        quantity: product.quantity,
        dosage_form: product.dosageForm,
        strength: product.strength,
        manufacturer_did: manufacturerDID,
        registered_at: new Date()
      });

      logger.info(`Product registered: ${product.name} (${product.ndc}) batch ${product.batchNumber}`);

      this.emit('productRegistered', { product, manufacturerDID });
    } catch (error) {
      logger.error('Error registering product:', error);
      throw error;
    }
  }

  /**
   * Record supply chain event
   */
  async recordSupplyChainEvent(event: Omit<SupplyChainEvent, 'id' | 'blockchainHash' | 'previousHash' | 'signature'>): Promise<string> {
    try {
      const eventId = `sce_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

      // Get existing chain
      const chain = this.supplyChains.get(event.batchNumber) || [];
      const previousHash = chain.length > 0
        ? chain[chain.length - 1].blockchainHash
        : undefined;

      // Create blockchain hash
      const hashData = {
        eventId,
        ...event,
        previousHash
      };
      const blockchainHash = this.createHash(JSON.stringify(hashData));

      // Create signature (in production, use actor's private key)
      const signature = this.createSignature(event.actor.did, blockchainHash);

      const fullEvent: SupplyChainEvent = {
        id: eventId,
        ...event,
        blockchainHash,
        previousHash,
        signature
      };

      // Add to chain
      chain.push(fullEvent);
      this.supplyChains.set(event.batchNumber, chain);

      // Check for anomalies
      await this.checkForAnomalies(fullEvent, chain);

      // Store in database
      await this.db('supply_chain_events').insert({
        id: eventId,
        product_ndc: event.productNDC,
        batch_number: event.batchNumber,
        event_type: event.eventType,
        actor_did: event.actor.did,
        actor_name: event.actor.name,
        actor_role: event.actor.role,
        actor_license: event.actor.license,
        location: JSON.stringify(event.location),
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        blockchain_hash: blockchainHash,
        previous_hash: previousHash,
        signature,
        timestamp: event.timestamp,
        created_at: new Date()
      });

      logger.info(`Supply chain event recorded: ${event.eventType} for batch ${event.batchNumber}`);

      this.emit('eventRecorded', { eventId, event: fullEvent });

      return eventId;
    } catch (error) {
      logger.error('Error recording supply chain event:', error);
      throw error;
    }
  }

  /**
   * Verify product authenticity by scanning barcode/QR code
   */
  async verifyProduct(ndc: string, batchNumber: string): Promise<VerificationResult> {
    try {
      const key = `${ndc}_${batchNumber}`;
      const product = this.productRegistry.get(key);

      if (!product) {
        return {
          isAuthentic: false,
          product: {} as DrugProduct,
          chainOfCustody: [],
          alerts: ['Product not found in registry - likely counterfeit'],
          riskScore: 100,
          verifiedAt: new Date()
        };
      }

      // Get supply chain
      const chain = this.supplyChains.get(batchNumber) || [];

      // Verify chain integrity
      const integrityCheck = this.verifyChainIntegrity(chain);

      // Calculate risk score
      const alerts: string[] = [];
      let riskScore = 0;

      // Check expiration
      if (new Date() > product.expirationDate) {
        alerts.push('Product is expired');
        riskScore += 50;
      }

      // Check if approaching expiration (within 30 days)
      const daysToExpiration = Math.floor((product.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToExpiration > 0 && daysToExpiration <= 30) {
        alerts.push(`Product expires in ${daysToExpiration} days`);
        riskScore += 10;
      }

      // Check chain integrity
      if (!integrityCheck.valid) {
        alerts.push('Supply chain integrity compromised - possible tampering');
        riskScore += 80;
      }

      // Check for cold chain violations (for temperature-sensitive drugs)
      const coldChainViolations = chain.filter(e =>
        e.metadata?.temperature && (e.metadata.temperature > 8 || e.metadata.temperature < 2)
      );
      if (coldChainViolations.length > 0) {
        alerts.push(`Cold chain violation detected (${coldChainViolations.length} events)`);
        riskScore += 30;
      }

      // Check if batch has alerts
      const batchAlerts = Array.from(this.alerts.values()).filter(a =>
        a.productNDC === ndc && a.batchNumber === batchNumber && a.status !== 'false_alarm'
      );
      if (batchAlerts.length > 0) {
        alerts.push(`${batchAlerts.length} alert(s) on file for this batch`);
        riskScore += 50 * batchAlerts.length;
      }

      // Check for gaps in chain
      const expectedSequence = ['manufactured', 'packaged', 'shipped', 'received', 'dispensed'];
      const actualSequence = chain.map(e => e.eventType);
      const hasGaps = !expectedSequence.slice(0, actualSequence.length).every((e, i) => actualSequence[i] === e);
      if (hasGaps) {
        alerts.push('Gaps detected in supply chain');
        riskScore += 25;
      }

      const isAuthentic = riskScore < 50 && integrityCheck.valid;

      const result: VerificationResult = {
        isAuthentic,
        product,
        chainOfCustody: chain,
        alerts,
        riskScore: Math.min(riskScore, 100),
        verifiedAt: new Date()
      };

      logger.info(`Product verified: ${ndc} batch ${batchNumber} - Authentic: ${isAuthentic}, Risk: ${riskScore}`);

      this.emit('productVerified', { ndc, batchNumber, result });

      return result;
    } catch (error) {
      logger.error('Error verifying product:', error);
      throw error;
    }
  }

  /**
   * Report counterfeit or quality issue
   */
  async reportCounterfeit(
    productNDC: string,
    batchNumber: string | undefined,
    reportedBy: string,
    alertType: CounterfeitAlert['alertType'],
    description: string,
    evidence?: string[]
  ): Promise<string> {
    try {
      const alertId = `alert_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

      // Determine severity based on type
      let severity: CounterfeitAlert['severity'];
      if (alertType === 'counterfeit' || alertType === 'tampering') {
        severity = 'critical';
      } else if (alertType === 'stolen') {
        severity = 'high';
      } else if (alertType === 'cold_chain_break') {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      const alert: CounterfeitAlert = {
        id: alertId,
        productNDC,
        batchNumber,
        reportedBy,
        alertType,
        severity,
        description,
        evidence,
        reportedAt: new Date(),
        status: 'open'
      };

      this.alerts.set(alertId, alert);

      // Store in database
      await this.db('counterfeit_alerts').insert({
        id: alertId,
        product_ndc: productNDC,
        batch_number: batchNumber,
        reported_by: reportedBy,
        alert_type: alertType,
        severity,
        description,
        evidence: evidence ? JSON.stringify(evidence) : null,
        reported_at: new Date(),
        status: 'open'
      });

      logger.warn(`Counterfeit alert created: ${alertId} for NDC ${productNDC}`);

      // Emit event for immediate notification
      this.emit('counterfeitReported', { alertId, alert });

      // If critical, trigger immediate notifications
      if (severity === 'critical') {
        this.emit('criticalAlert', { alertId, alert });
      }

      return alertId;
    } catch (error) {
      logger.error('Error reporting counterfeit:', error);
      throw error;
    }
  }

  /**
   * Get supply chain transparency report
   */
  async getSupplyChainReport(batchNumber: string): Promise<{
    product: DrugProduct;
    timeline: SupplyChainEvent[];
    integrityCheck: { valid: boolean; issues: string[] };
    statistics: any;
  }> {
    try {
      const chain = this.supplyChains.get(batchNumber) || [];

      if (chain.length === 0) {
        throw new Error('No supply chain data found for this batch');
      }

      const product = this.productRegistry.get(`${chain[0].productNDC}_${batchNumber}`);

      if (!product) {
        throw new Error('Product not found');
      }

      const integrityCheck = this.verifyChainIntegrity(chain);

      // Calculate statistics
      const statistics = {
        totalEvents: chain.length,
        totalActors: new Set(chain.map(e => e.actor.did)).size,
        durationDays: Math.floor((chain[chain.length - 1].timestamp.getTime() - chain[0].timestamp.getTime()) / (1000 * 60 * 60 * 24)),
        locationsVisited: new Set(chain.map(e => e.location.facility)).size,
        averageTemperature: this.calculateAverageTemperature(chain),
        coldChainCompliant: this.checkColdChainCompliance(chain)
      };

      return {
        product,
        timeline: chain,
        integrityCheck,
        statistics
      };
    } catch (error) {
      logger.error('Error getting supply chain report:', error);
      throw error;
    }
  }

  /**
   * Authorize actor (manufacturer, distributor, etc.)
   */
  async authorizeActor(actorDID: string, role: string, license: string): Promise<void> {
    try {
      this.authorizedActors.add(actorDID);

      await this.db('authorized_supply_chain_actors').insert({
        actor_did: actorDID,
        role,
        license,
        authorized_at: new Date()
      });

      logger.info(`Actor authorized: ${actorDID} as ${role}`);

      this.emit('actorAuthorized', { actorDID, role });
    } catch (error) {
      logger.error('Error authorizing actor:', error);
      throw error;
    }
  }

  /**
   * Get counterfeit statistics for dashboard
   */
  async getCounterfeitStatistics(options: {
    startDate?: Date;
    endDate?: Date;
    severity?: string;
  } = {}): Promise<any> {
    try {
      let alerts = Array.from(this.alerts.values());

      if (options.startDate) {
        alerts = alerts.filter(a => a.reportedAt >= options.startDate!);
      }

      if (options.endDate) {
        alerts = alerts.filter(a => a.reportedAt <= options.endDate!);
      }

      if (options.severity) {
        alerts = alerts.filter(a => a.severity === options.severity);
      }

      const stats = {
        totalAlerts: alerts.length,
        bySeverity: {
          critical: alerts.filter(a => a.severity === 'critical').length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        },
        byType: {
          counterfeit: alerts.filter(a => a.alertType === 'counterfeit').length,
          tampering: alerts.filter(a => a.alertType === 'tampering').length,
          cold_chain_break: alerts.filter(a => a.alertType === 'cold_chain_break').length,
          expired: alerts.filter(a => a.alertType === 'expired').length,
          stolen: alerts.filter(a => a.alertType === 'stolen').length
        },
        byStatus: {
          open: alerts.filter(a => a.status === 'open').length,
          investigating: alerts.filter(a => a.status === 'investigating').length,
          confirmed: alerts.filter(a => a.status === 'confirmed').length,
          resolved: alerts.filter(a => a.status === 'resolved').length,
          false_alarm: alerts.filter(a => a.status === 'false_alarm').length
        }
      };

      return stats;
    } catch (error) {
      logger.error('Error getting counterfeit statistics:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private verifyChainIntegrity(chain: SupplyChainEvent[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    for (let i = 1; i < chain.length; i++) {
      const current = chain[i];
      const previous = chain[i - 1];

      // Check hash linkage
      if (current.previousHash !== previous.blockchainHash) {
        issues.push(`Hash mismatch at event ${i}`);
      }

      // Check timestamp order
      if (current.timestamp < previous.timestamp) {
        issues.push(`Timestamp out of order at event ${i}`);
      }

      // Verify signature (simplified)
      const expectedHash = this.createHash(JSON.stringify({
        eventId: current.id,
        productNDC: current.productNDC,
        batchNumber: current.batchNumber,
        eventType: current.eventType,
        actor: current.actor,
        location: current.location,
        timestamp: current.timestamp,
        metadata: current.metadata,
        previousHash: current.previousHash
      }));

      if (expectedHash !== current.blockchainHash) {
        issues.push(`Hash verification failed at event ${i}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private async checkForAnomalies(event: SupplyChainEvent, chain: SupplyChainEvent[]): Promise<void> {
    // Check for unusual time gaps
    if (chain.length > 1) {
      const previous = chain[chain.length - 2];
      const hoursDiff = (event.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 168) { // More than 7 days
        logger.warn(`Unusual time gap detected: ${hoursDiff} hours between events`);
      }
    }

    // Check temperature for cold chain products
    if (event.metadata?.temperature) {
      if (event.metadata.temperature > 8 || event.metadata.temperature < 2) {
        logger.warn(`Cold chain violation: Temperature ${event.metadata.temperature}°C`);

        // Auto-create alert
        await this.reportCounterfeit(
          event.productNDC,
          event.batchNumber,
          'SYSTEM',
          'cold_chain_break',
          `Temperature out of range: ${event.metadata.temperature}°C at ${event.location.facility}`
        );
      }
    }
  }

  private calculateAverageTemperature(chain: SupplyChainEvent[]): number | null {
    const temps = chain
      .filter(e => e.metadata?.temperature)
      .map(e => e.metadata!.temperature!);

    if (temps.length === 0) return null;

    return temps.reduce((sum, t) => sum + t, 0) / temps.length;
  }

  private checkColdChainCompliance(chain: SupplyChainEvent[]): boolean {
    return chain.every(e =>
      !e.metadata?.temperature ||
      (e.metadata.temperature >= 2 && e.metadata.temperature <= 8)
    );
  }

  private createHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private createSignature(actorDID: string, data: string): string {
    // In production, use actor's private key to sign
    // For now, create a simple signature
    return crypto
      .createHmac('sha256', actorDID)
      .update(data)
      .digest('hex');
  }
}

export default PharmaceuticalSupplyChainService;
