/**
 * At-Home Lab Integration Service
 * Integration with CLIA-certified lab partners: Everlywell, Quest Diagnostics, LabCorp
 * HL7 FHIR compliant for interoperability
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';

export interface LabTest {
  id: string;
  name: string;
  description: string;
  category: 'metabolic' | 'hormone' | 'vitamin' | 'cardiovascular' | 'thyroid' | 'comprehensive';
  biomarkers: string[];
  price: number;
  estimatedTurnaroundDays: number;
  provider: 'everlywell' | 'quest' | 'labcorp';
  requiresPhysicianOrder: boolean;
  fasting: boolean;
  sampleType: 'blood' | 'saliva' | 'urine' | 'finger-prick';
}

export interface LabOrder {
  orderId: string;
  userId: string;
  testId: string;
  provider: string;
  status: 'pending' | 'kit_shipped' | 'sample_received' | 'processing' | 'completed' | 'cancelled';
  orderDate: Date;
  estimatedCompletionDate: Date;
  trackingNumber?: string;
  results?: LabResults;
}

export interface LabResults {
  resultId: string;
  orderId: string;
  testName: string;
  collectionDate: Date;
  resultDate: Date;
  biomarkers: BiomarkerResult[];
  overallAssessment: 'optimal' | 'normal' | 'borderline' | 'abnormal' | 'critical';
  physicianReview: boolean;
  physicianNotes?: string;
  fhirResource?: any; // HL7 FHIR Observation resource
}

export interface BiomarkerResult {
  name: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
    optimalMin?: number;
    optimalMax?: number;
  };
  status: 'low' | 'normal' | 'high' | 'critical';
  interpretation: string;
  trendAnalysis?: {
    previousValue?: number;
    percentChange?: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export interface LabPartnerConfig {
  apiKey: string;
  apiSecret: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
}

class AtHomeLabIntegrationService {
  private everlywellClient: AxiosInstance | null = null;
  private questClient: AxiosInstance | null = null;
  private labcorpClient: AxiosInstance | null = null;
  private isInitialized = false;

  /**
   * Initialize lab partner integrations
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🧪 Initializing At-Home Lab Integration Service...');

      // Initialize Everlywell SDK
      this.everlywellClient = axios.create({
        baseURL: process.env.EVERLYWELL_API_URL || 'https://api.everlywell.com/v1',
        headers: {
          'Authorization': `Bearer ${process.env.EVERLYWELL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Initialize Quest Diagnostics FHIR API
      this.questClient = axios.create({
        baseURL: process.env.QUEST_FHIR_URL || 'https://fhir.questdiagnostics.com/r4',
        headers: {
          'Authorization': `Bearer ${process.env.QUEST_API_KEY}`,
          'Accept': 'application/fhir+json',
          'Content-Type': 'application/fhir+json'
        },
        timeout: 30000
      });

      // Initialize LabCorp API
      this.labcorpClient = axios.create({
        baseURL: process.env.LABCORP_API_URL || 'https://api.labcorp.com/v1',
        headers: {
          'X-API-Key': process.env.LABCORP_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      this.isInitialized = true;
      logger.info('✅ At-Home Lab Integration Service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize At-Home Lab Integration Service:', error);
      throw error;
    }
  }

  /**
   * Get available lab tests catalog
   */
  async getAvailableTests(category?: string): Promise<LabTest[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // In production, this would fetch from each provider's API
      // For now, return comprehensive catalog
      const catalog: LabTest[] = [
        // Everlywell Tests
        {
          id: 'ew-metabolic-comprehensive',
          name: 'Comprehensive Metabolic Panel',
          description: 'Complete metabolic health assessment including glucose, cholesterol, liver & kidney function',
          category: 'comprehensive',
          biomarkers: [
            'Glucose', 'HbA1c', 'Total Cholesterol', 'LDL', 'HDL', 'Triglycerides',
            'ALT', 'AST', 'Creatinine', 'BUN', 'eGFR', 'Electrolytes'
          ],
          price: 149,
          estimatedTurnaroundDays: 5,
          provider: 'everlywell',
          requiresPhysicianOrder: false,
          fasting: true,
          sampleType: 'finger-prick'
        },
        {
          id: 'ew-heart-health',
          name: 'Heart Health Test',
          description: 'Cardiovascular risk markers including cholesterol, triglycerides, and inflammation',
          category: 'cardiovascular',
          biomarkers: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'hs-CRP', 'Apolipoprotein B'],
          price: 99,
          estimatedTurnaroundDays: 5,
          provider: 'everlywell',
          requiresPhysicianOrder: false,
          fasting: true,
          sampleType: 'finger-prick'
        },
        {
          id: 'ew-thyroid-test',
          name: 'Thyroid Function Test',
          description: 'Complete thyroid panel with TSH, T3, T4, and antibodies',
          category: 'thyroid',
          biomarkers: ['TSH', 'Free T3', 'Free T4', 'TPO Antibodies'],
          price: 89,
          estimatedTurnaroundDays: 5,
          provider: 'everlywell',
          requiresPhysicianOrder: false,
          fasting: false,
          sampleType: 'finger-prick'
        },
        {
          id: 'ew-vitamin-d',
          name: 'Vitamin D Test',
          description: 'Measure vitamin D levels for bone health and immune function',
          category: 'vitamin',
          biomarkers: ['25-Hydroxyvitamin D'],
          price: 49,
          estimatedTurnaroundDays: 5,
          provider: 'everlywell',
          requiresPhysicianOrder: false,
          fasting: false,
          sampleType: 'finger-prick'
        },

        // Quest Diagnostics Tests
        {
          id: 'quest-comprehensive-health',
          name: 'Quest Health & Wellness Panel',
          description: 'Comprehensive health screening with 40+ biomarkers',
          category: 'comprehensive',
          biomarkers: [
            'Complete Blood Count', 'Comprehensive Metabolic Panel', 'Lipid Panel',
            'Thyroid Panel', 'Vitamin D', 'Inflammation Markers', 'Iron Studies'
          ],
          price: 299,
          estimatedTurnaroundDays: 3,
          provider: 'quest',
          requiresPhysicianOrder: true,
          fasting: true,
          sampleType: 'blood'
        },
        {
          id: 'quest-diabetes-management',
          name: 'Diabetes Management Panel',
          description: 'HbA1c, glucose, insulin resistance markers',
          category: 'metabolic',
          biomarkers: ['HbA1c', 'Fasting Glucose', 'Fasting Insulin', 'HOMA-IR'],
          price: 79,
          estimatedTurnaroundDays: 2,
          provider: 'quest',
          requiresPhysicianOrder: true,
          fasting: true,
          sampleType: 'blood'
        },

        // LabCorp Tests
        {
          id: 'labcorp-executive-health',
          name: 'Executive Health Panel',
          description: 'Premium comprehensive health assessment with 50+ biomarkers',
          category: 'comprehensive',
          biomarkers: [
            'Complete Blood Count', 'Comprehensive Metabolic Panel', 'Advanced Lipid Panel',
            'Thyroid Function', 'Vitamins & Minerals', 'Hormones', 'Tumor Markers'
          ],
          price: 399,
          estimatedTurnaroundDays: 4,
          provider: 'labcorp',
          requiresPhysicianOrder: true,
          fasting: true,
          sampleType: 'blood'
        },
        {
          id: 'labcorp-hormone-balance',
          name: 'Hormone Balance Panel',
          description: 'Comprehensive hormone testing for men and women',
          category: 'hormone',
          biomarkers: ['Testosterone', 'Estradiol', 'Progesterone', 'DHEA', 'Cortisol', 'FSH', 'LH'],
          price: 199,
          estimatedTurnaroundDays: 4,
          provider: 'labcorp',
          requiresPhysicianOrder: true,
          fasting: false,
          sampleType: 'blood'
        },
      ];

      if (category) {
        return catalog.filter(test => test.category === category);
      }

      return catalog;
    } catch (error) {
      logger.error('Failed to fetch lab tests:', error);
      throw error;
    }
  }

  /**
   * Order lab test
   */
  async orderLabTest(userId: string, testId: string): Promise<LabOrder> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      logger.info(`📦 Ordering lab test ${testId} for user ${userId}`);

      // Get test details
      const tests = await this.getAvailableTests();
      const test = tests.find(t => t.id === testId);

      if (!test) {
        throw new Error(`Lab test ${testId} not found`);
      }

      // Create order based on provider
      let order: LabOrder;

      switch (test.provider) {
        case 'everlywell':
          order = await this.orderEverlywellTest(userId, test);
          break;
        case 'quest':
          order = await this.orderQuestTest(userId, test);
          break;
        case 'labcorp':
          order = await this.orderLabCorpTest(userId, test);
          break;
        default:
          throw new Error(`Unsupported provider: ${test.provider}`);
      }

      logger.info(`✅ Lab test ordered successfully: ${order.orderId}`);
      return order;

    } catch (error) {
      logger.error('Failed to order lab test:', error);
      throw error;
    }
  }

  /**
   * Order Everlywell test
   */
  private async orderEverlywellTest(userId: string, test: LabTest): Promise<LabOrder> {
    try {
      // In production, call Everlywell API
      const orderId = `EW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const order: LabOrder = {
        orderId,
        userId,
        testId: test.id,
        provider: 'everlywell',
        status: 'kit_shipped',
        orderDate: new Date(),
        estimatedCompletionDate: new Date(Date.now() + test.estimatedTurnaroundDays * 24 * 60 * 60 * 1000),
        trackingNumber: `1Z999AA10123456784`
      };

      return order;
    } catch (error) {
      logger.error('Everlywell order failed:', error);
      throw error;
    }
  }

  /**
   * Order Quest Diagnostics test
   */
  private async orderQuestTest(userId: string, test: LabTest): Promise<LabOrder> {
    try {
      // In production, call Quest FHIR API to create ServiceRequest
      const orderId = `QUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const order: LabOrder = {
        orderId,
        userId,
        testId: test.id,
        provider: 'quest',
        status: 'pending',
        orderDate: new Date(),
        estimatedCompletionDate: new Date(Date.now() + test.estimatedTurnaroundDays * 24 * 60 * 60 * 1000),
      };

      return order;
    } catch (error) {
      logger.error('Quest order failed:', error);
      throw error;
    }
  }

  /**
   * Order LabCorp test
   */
  private async orderLabCorpTest(userId: string, test: LabTest): Promise<LabOrder> {
    try {
      // In production, call LabCorp API
      const orderId = `LABCORP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const order: LabOrder = {
        orderId,
        userId,
        testId: test.id,
        provider: 'labcorp',
        status: 'pending',
        orderDate: new Date(),
        estimatedCompletionDate: new Date(Date.now() + test.estimatedTurnaroundDays * 24 * 60 * 60 * 1000),
      };

      return order;
    } catch (error) {
      logger.error('LabCorp order failed:', error);
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<LabOrder> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // In production, fetch from database and sync with provider API
      // Mock response for demo
      const order: LabOrder = {
        orderId,
        userId: 'mock-user-id',
        testId: 'ew-metabolic-comprehensive',
        provider: 'everlywell',
        status: 'completed',
        orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        estimatedCompletionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        trackingNumber: '1Z999AA10123456784',
      };

      return order;
    } catch (error) {
      logger.error('Failed to get order status:', error);
      throw error;
    }
  }

  /**
   * Get lab results
   */
  async getLabResults(orderId: string): Promise<LabResults> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      logger.info(`📋 Fetching lab results for order ${orderId}`);

      // In production, fetch from provider API and convert to standardized format
      // Mock comprehensive results
      const results: LabResults = {
        resultId: `RESULT-${orderId}`,
        orderId,
        testName: 'Comprehensive Metabolic Panel',
        collectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        resultDate: new Date(),
        biomarkers: [
          {
            name: 'Glucose',
            value: 95,
            unit: 'mg/dL',
            referenceRange: { min: 70, max: 99, optimalMin: 70, optimalMax: 85 },
            status: 'normal',
            interpretation: 'Fasting glucose is within normal range, indicating good blood sugar control.',
            trendAnalysis: {
              previousValue: 102,
              percentChange: -6.9,
              trend: 'improving'
            }
          },
          {
            name: 'HbA1c',
            value: 5.4,
            unit: '%',
            referenceRange: { min: 4.0, max: 5.6, optimalMin: 4.0, optimalMax: 5.0 },
            status: 'normal',
            interpretation: '3-month average blood sugar is optimal. Risk of diabetes is low.',
            trendAnalysis: {
              previousValue: 5.8,
              percentChange: -6.9,
              trend: 'improving'
            }
          },
          {
            name: 'Total Cholesterol',
            value: 195,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 200, optimalMin: 150, optimalMax: 180 },
            status: 'normal',
            interpretation: 'Total cholesterol is within desirable range.',
            trendAnalysis: {
              previousValue: 210,
              percentChange: -7.1,
              trend: 'improving'
            }
          },
          {
            name: 'LDL Cholesterol',
            value: 115,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 100, optimalMin: 0, optimalMax: 70 },
            status: 'high',
            interpretation: 'LDL is slightly elevated. Consider dietary changes and increased exercise.',
            trendAnalysis: {
              previousValue: 125,
              percentChange: -8.0,
              trend: 'improving'
            }
          },
          {
            name: 'HDL Cholesterol',
            value: 55,
            unit: 'mg/dL',
            referenceRange: { min: 40, max: 200, optimalMin: 60, optimalMax: 100 },
            status: 'normal',
            interpretation: 'HDL (good cholesterol) is acceptable. Higher levels are protective.',
            trendAnalysis: {
              previousValue: 52,
              percentChange: 5.8,
              trend: 'improving'
            }
          },
          {
            name: 'Triglycerides',
            value: 125,
            unit: 'mg/dL',
            referenceRange: { min: 0, max: 150, optimalMin: 0, optimalMax: 100 },
            status: 'normal',
            interpretation: 'Triglycerides are within normal range.',
            trendAnalysis: {
              previousValue: 140,
              percentChange: -10.7,
              trend: 'improving'
            }
          },
          {
            name: 'Creatinine',
            value: 0.9,
            unit: 'mg/dL',
            referenceRange: { min: 0.7, max: 1.3 },
            status: 'normal',
            interpretation: 'Kidney function is normal.',
          },
          {
            name: 'eGFR',
            value: 95,
            unit: 'mL/min/1.73m²',
            referenceRange: { min: 90, max: 120 },
            status: 'normal',
            interpretation: 'Excellent kidney function.',
          },
          {
            name: 'ALT',
            value: 22,
            unit: 'U/L',
            referenceRange: { min: 7, max: 56 },
            status: 'normal',
            interpretation: 'Liver enzyme levels are normal.',
          },
          {
            name: 'AST',
            value: 28,
            unit: 'U/L',
            referenceRange: { min: 10, max: 40 },
            status: 'normal',
            interpretation: 'Liver enzyme levels are normal.',
          },
        ],
        overallAssessment: 'normal',
        physicianReview: true,
        physicianNotes: 'Overall metabolic health is good. LDL cholesterol is slightly elevated - recommend dietary modifications and continued monitoring. All other markers are within optimal ranges. Continue current lifestyle habits and recheck in 3 months.',
        fhirResource: this.convertToFHIR(orderId, []) // In production, convert biomarkers to FHIR Observation
      };

      logger.info(`✅ Lab results retrieved successfully`);
      return results;

    } catch (error) {
      logger.error('Failed to get lab results:', error);
      throw error;
    }
  }

  /**
   * Get user's lab history
   */
  async getUserLabHistory(userId: string, limit: number = 10): Promise<LabResults[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // In production, fetch from database
      // Mock historical results
      const history: LabResults[] = [];

      // Generate mock historical data (3 previous tests)
      for (let i = 0; i < 3; i++) {
        const monthsAgo = (i + 1) * 3; // 3, 6, 9 months ago
        const result = await this.getLabResults(`HISTORICAL-${i}`);
        result.collectionDate = new Date(Date.now() - monthsAgo * 30 * 24 * 60 * 60 * 1000);
        result.resultDate = new Date(Date.now() - (monthsAgo * 30 - 5) * 24 * 60 * 60 * 1000);
        history.push(result);
      }

      return history.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get lab history:', error);
      throw error;
    }
  }

  /**
   * Analyze biomarker trends across multiple results
   */
  analyzeBiomarkerTrends(biomarkerName: string, historicalResults: LabResults[]): {
    currentValue: number;
    trend: 'improving' | 'stable' | 'declining';
    percentChange: number;
    averageValue: number;
    recommendation: string;
  } {
    const biomarkerHistory = historicalResults
      .map(result => result.biomarkers.find(b => b.name === biomarkerName))
      .filter(b => b !== undefined);

    if (biomarkerHistory.length < 2) {
      return {
        currentValue: biomarkerHistory[0]?.value || 0,
        trend: 'stable',
        percentChange: 0,
        averageValue: biomarkerHistory[0]?.value || 0,
        recommendation: 'Insufficient historical data for trend analysis'
      };
    }

    const currentValue = biomarkerHistory[0]!.value;
    const previousValue = biomarkerHistory[1]!.value;
    const percentChange = ((currentValue - previousValue) / previousValue) * 100;
    const averageValue = biomarkerHistory.reduce((sum, b) => sum + b!.value, 0) / biomarkerHistory.length;

    // Determine trend (depends on biomarker type)
    const improvingBiomarkers = ['HDL Cholesterol', 'eGFR'];
    const decliningBiomarkers = ['LDL Cholesterol', 'Glucose', 'HbA1c', 'Triglycerides', 'Total Cholesterol'];

    let trend: 'improving' | 'stable' | 'declining';

    if (Math.abs(percentChange) < 5) {
      trend = 'stable';
    } else if (improvingBiomarkers.includes(biomarkerName)) {
      trend = percentChange > 0 ? 'improving' : 'declining';
    } else if (decliningBiomarkers.includes(biomarkerName)) {
      trend = percentChange < 0 ? 'improving' : 'declining';
    } else {
      trend = 'stable';
    }

    const recommendation = this.generateTrendRecommendation(biomarkerName, trend, currentValue);

    return {
      currentValue,
      trend,
      percentChange,
      averageValue,
      recommendation
    };
  }

  /**
   * Generate recommendation based on biomarker trend
   */
  private generateTrendRecommendation(biomarkerName: string, trend: string, currentValue: number): string {
    if (trend === 'improving') {
      return `${biomarkerName} is trending in the right direction. Continue current lifestyle habits.`;
    } else if (trend === 'declining') {
      return `${biomarkerName} is worsening. Consider lifestyle modifications and consult your healthcare provider.`;
    } else {
      return `${biomarkerName} is stable. Maintain current health practices.`;
    }
  }

  /**
   * Convert lab results to HL7 FHIR Observation resource
   */
  private convertToFHIR(orderId: string, biomarkers: BiomarkerResult[]): any {
    // Simplified FHIR Observation bundle
    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: biomarkers.map(biomarker => ({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: {
            text: biomarker.name
          },
          valueQuantity: {
            value: biomarker.value,
            unit: biomarker.unit
          },
          referenceRange: [{
            low: {
              value: biomarker.referenceRange.min,
              unit: biomarker.unit
            },
            high: {
              value: biomarker.referenceRange.max,
              unit: biomarker.unit
            }
          }],
          interpretation: [{
            text: biomarker.interpretation
          }]
        }
      }))
    };
  }

  /**
   * Cancel lab order
   */
  async cancelLabOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      logger.info(`❌ Cancelling lab order ${orderId}`);

      // In production, call provider API to cancel
      return {
        success: true,
        message: 'Lab order cancelled successfully. Refund will be processed within 5-7 business days.'
      };
    } catch (error) {
      logger.error('Failed to cancel lab order:', error);
      throw error;
    }
  }
}

export default new AtHomeLabIntegrationService();
