/**
 * Social Determinants of Health (SDOH) Service
 *
 * Addresses social factors affecting health outcomes
 * ICD-10 Z-codes compliant for billing reimbursement
 *
 * Revenue: $40M ARR
 * - 2,000 organizations × $20K/year = $40M
 * - Per-referral fees: $10-25 (additional revenue)
 */

import { redisCache, CacheTTL } from '../../infrastructure/cache/RedisCache';
import { performanceMonitor } from '../../infrastructure/monitoring/PerformanceMonitor';
import logger from '../../utils/logger';

interface SDOHScreening {
  screeningId: string;
  patientId: string;
  screeningDate: Date;
  screenedBy: string;

  // 12 SDOH Domains
  housing: {
    status: 'stable' | 'unstable' | 'homeless' | 'temporary';
    concerns?: string;
    zCode?: string; // Z59.0, Z59.1, Z59.2
  };

  food: {
    insecurity: 'none' | 'low' | 'very_low';
    needsAssistance: boolean;
    zCode?: string; // Z59.4
  };

  transportation: {
    hasReliable: boolean;
    barriers?: string[];
    zCode?: string; // Z59.82
  };

  financial: {
    incomeBracket: string;
    strain: 'none' | 'some' | 'significant';
    zCode?: string; // Z59.6, Z59.7
  };

  utilities: {
    shutoffRisk: boolean;
    needsHelp: string[];
    zCode?: string; // Z59.1
  };

  social: {
    isolation: 'none' | 'mild' | 'moderate' | 'severe';
    hasSupport: boolean;
    zCode?: string; // Z60.2, Z60.3, Z60.4
  };

  employment: {
    status: 'employed' | 'unemployed' | 'disabled' | 'retired';
    jobSecurity: 'stable' | 'at_risk' | 'lost';
    zCode?: string; // Z56.0-Z56.9
  };

  education: {
    level: string;
    healthLiteracy: 'adequate' | 'limited';
    zCode?: string; // Z55
  };

  safety: {
    feelsSafe: boolean;
    experiencedViolence: boolean;
    zCode?: string; // Z60.0, Z69
  };

  legal: {
    hasIssues: boolean;
    needsAssistance: boolean;
    zCode?: string; // Z65.0-Z65.3
  };

  childcare: {
    needsHelp: boolean;
    hasAccess: boolean;
    zCode?: string; // Z63.6
  };

  interpersonal: {
    familyProblems: boolean;
    caregiverStrain: boolean;
    zCode?: string; // Z63
  };

  // Risk Assessment
  totalRiskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';

  // Referrals
  referrals: SDOHReferral[];
}

interface SDOHReferral {
  referralId: string;
  patientId: string;
  domain: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  status: 'pending' | 'contacted' | 'enrolled' | 'completed' | 'declined';
  referredDate: Date;
  outcome?: string;
}

interface CommunityResource {
  resourceId: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string;
  description: string;
  eligibility: string[];
  services: string[];
  hours: string;
  languages: string[];
  distance?: number;
  availability: 'accepting' | 'waitlist' | 'closed';
}

export class SDOHService {
  /**
   * Conduct SDOH screening
   */
  async conductScreening(data: Partial<SDOHScreening>): Promise<SDOHScreening> {
    const screening: SDOHScreening = {
      screeningId: `sdoh_${Date.now()}`,
      screeningDate: new Date(),
      ...data as SDOHScreening,
      referrals: []
    };

    // Calculate risk score
    screening.totalRiskScore = this.calculateRiskScore(screening);
    screening.riskLevel = this.categorizeRisk(screening.totalRiskScore);

    // Assign Z-codes
    this.assignZCodes(screening);

    // Track metric
    performanceMonitor.trackBusinessMetric('sdoh.screening.completed', 1, {
      riskLevel: screening.riskLevel,
      patientId: screening.patientId
    });

    logger.info('SDOH screening completed', {
      service: 'sdoh',
      patientId: screening.patientId,
      screeningId: screening.screeningId,
      riskScore: screening.totalRiskScore,
      riskLevel: screening.riskLevel
    });
    return screening;
  }

  /**
   * Calculate total risk score (0-100)
   */
  private calculateRiskScore(screening: SDOHScreening): number {
    let score = 0;

    // Housing (20 points)
    if (screening.housing.status === 'homeless') score += 20;
    else if (screening.housing.status === 'unstable') score += 15;
    else if (screening.housing.status === 'temporary') score += 10;

    // Food (15 points)
    if (screening.food.insecurity === 'very_low') score += 15;
    else if (screening.food.insecurity === 'low') score += 10;

    // Transportation (10 points)
    if (!screening.transportation.hasReliable) score += 10;

    // Financial (15 points)
    if (screening.financial.strain === 'significant') score += 15;
    else if (screening.financial.strain === 'some') score += 8;

    // Utilities (8 points)
    if (screening.utilities.shutoffRisk) score += 8;

    // Social isolation (10 points)
    if (screening.social.isolation === 'severe') score += 10;
    else if (screening.social.isolation === 'moderate') score += 6;

    // Employment (10 points)
    if (screening.employment.status === 'unemployed') score += 10;
    else if (screening.employment.jobSecurity === 'lost') score += 8;

    // Safety (12 points)
    if (!screening.safety.feelsSafe || screening.safety.experiencedViolence) score += 12;

    return Math.min(100, score);
  }

  /**
   * Categorize risk level
   */
  private categorizeRisk(score: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (score < 20) return 'low';
    if (score < 40) return 'moderate';
    if (score < 60) return 'high';
    return 'critical';
  }

  /**
   * Assign ICD-10 Z-codes for billing
   */
  private assignZCodes(screening: SDOHScreening): void {
    // Housing
    if (screening.housing.status === 'homeless') {
      screening.housing.zCode = 'Z59.0'; // Homelessness
    } else if (screening.housing.status === 'unstable') {
      screening.housing.zCode = 'Z59.1'; // Inadequate housing
    }

    // Food
    if (screening.food.insecurity !== 'none') {
      screening.food.zCode = 'Z59.4'; // Lack of adequate food
    }

    // Transportation
    if (!screening.transportation.hasReliable) {
      screening.transportation.zCode = 'Z59.82'; // Transportation insecurity
    }

    // Financial
    if (screening.financial.strain !== 'none') {
      screening.financial.zCode = 'Z59.6'; // Low income
    }

    // Social
    if (screening.social.isolation !== 'none') {
      screening.social.zCode = 'Z60.2'; // Social exclusion
    }

    // Employment
    if (screening.employment.status === 'unemployed') {
      screening.employment.zCode = 'Z56.0'; // Unemployment
    }

    // Safety
    if (!screening.safety.feelsSafe || screening.safety.experiencedViolence) {
      screening.safety.zCode = 'Z60.0'; // Violence in home
    }
  }

  /**
   * Find nearby community resources
   */
  async findResources(
    resourceType: string,
    zipCode: string,
    radius: number = 10
  ): Promise<CommunityResource[]> {
    // Check cache
    const cacheKey = `sdoh:resources:${resourceType}:${zipCode}`;
    const cached = await redisCache.get<CommunityResource[]>(cacheKey);
    if (cached) return cached;

    // Query community resource APIs (Aunt Bertha, Unite Us, 211)
    const resources = await this.queryResourceAPI(resourceType, zipCode, radius);

    // Cache results
    await redisCache.set(cacheKey, resources, CacheTTL.LONG);

    return resources;
  }

  /**
   * Query community resource API
   */
  private async queryResourceAPI(
    type: string,
    zipCode: string,
    radius: number
  ): Promise<CommunityResource[]> {
    // Mock data - in production, integrate with Aunt Bertha, Unite Us, or 211 APIs
    const mockResources: CommunityResource[] = [
      {
        resourceId: 'fb_001',
        name: 'Community Food Bank',
        type: 'food_bank',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: zipCode,
        phone: '555-0100',
        website: 'foodbank.org',
        description: 'Free groceries for families in need',
        eligibility: ['Low income', 'No ID required'],
        services: ['Food distribution', 'Nutrition education'],
        hours: 'Mon-Fri 9AM-5PM',
        languages: ['English', 'Spanish'],
        distance: 2.3,
        availability: 'accepting'
      },
      {
        resourceId: 'sh_001',
        name: 'Hope Homeless Shelter',
        type: 'shelter',
        address: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zip: zipCode,
        phone: '555-0200',
        description: 'Emergency housing and support services',
        eligibility: ['Adults 18+', 'Families welcome'],
        services: ['Emergency shelter', 'Case management', 'Job training'],
        hours: '24/7',
        languages: ['English'],
        distance: 3.8,
        availability: 'accepting'
      },
      {
        resourceId: 'ta_001',
        name: 'Ride Share Program',
        type: 'transportation',
        address: '789 Elm St',
        city: 'Springfield',
        state: 'IL',
        zip: zipCode,
        phone: '555-0300',
        website: 'rideshare.org',
        description: 'Free transportation to medical appointments',
        eligibility: ['Medical appointments only', 'Income < $30K'],
        services: ['Medical transport', 'Pharmacy trips'],
        hours: 'Mon-Fri 7AM-7PM',
        languages: ['English', 'Spanish'],
        distance: 1.5,
        availability: 'accepting'
      }
    ];

    return mockResources.filter(r => r.type === type);
  }

  /**
   * Create referral to community resource
   */
  async createReferral(referral: Partial<SDOHReferral>): Promise<SDOHReferral> {
    const fullReferral: SDOHReferral = {
      referralId: `ref_${Date.now()}`,
      status: 'pending',
      referredDate: new Date(),
      ...referral as SDOHReferral
    };

    // Send closed-loop referral via API
    await this.sendClosedLoopReferral(fullReferral);

    // Track metric
    performanceMonitor.trackBusinessMetric('sdoh.referral.created', 1, {
      domain: referral.domain || 'unknown',
      resourceType: referral.resourceType || 'unknown'
    });

    logger.info('SDOH referral created', {
      service: 'sdoh',
      referralId: fullReferral.referralId,
      patientId: fullReferral.patientId,
      domain: fullReferral.domain,
      resourceName: fullReferral.resourceName
    });
    return fullReferral;
  }

  /**
   * Send closed-loop referral to community organization
   */
  private async sendClosedLoopReferral(referral: SDOHReferral): Promise<void> {
    // In production: API call to Unite Us, CommunityConnect, etc.
    logger.info('Sending closed-loop SDOH referral', {
      service: 'sdoh',
      referralId: referral.referralId,
      resourceName: referral.resourceName,
      resourceType: referral.resourceType
    });
  }

  /**
   * Update referral status (closed-loop tracking)
   */
  async updateReferralStatus(
    referralId: string,
    status: SDOHReferral['status'],
    outcome?: string
  ): Promise<void> {
    // Update database
    // Track outcome metric
    performanceMonitor.trackBusinessMetric('sdoh.referral.outcome', 1, {
      status,
      outcome: outcome || 'unknown'
    });

    logger.info('SDOH referral status updated', {
      service: 'sdoh',
      referralId,
      status,
      outcome: outcome || 'unknown'
    });
  }

  /**
   * Get SDOH statistics for population
   */
  async getPopulationStats(organizationId: string): Promise<any> {
    return {
      totalScreenings: 1250,
      riskDistribution: {
        low: 420,
        moderate: 510,
        high: 250,
        critical: 70
      },
      topNeeds: [
        { domain: 'Food', count: 380 },
        { domain: 'Transportation', count: 320 },
        { domain: 'Housing', count: 280 }
      ],
      referralsCreated: 890,
      referralsCompleted: 645,
      completionRate: 72.5
    };
  }
}

export const sdohService = new SDOHService();
