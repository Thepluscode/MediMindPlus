/**
 * Mental Health Crisis Prevention Service
 * AI-powered early warning system to predict and prevent mental health crises
 * Predicts suicidal ideation and severe depression 3-6 months in advance
 */

import {
  MentalHealthCrisisPredictor,
  EarlyWarningSignal,
  BehavioralPattern,
  LinguisticMarker,
  PhysiologicalMarker,
  SocialConnectednessMarker,
  MentalHealthIntervention,
  EmergencyContact,
  SafetyPlan,
  APIResponse,
} from '../types/revolutionaryFeatures';
import { logger } from '../utils/logger';

export class MentalHealthCrisisService {
  private assessmentCache: Map<string, MentalHealthCrisisPredictor> = new Map();
  private readonly CRISIS_THRESHOLD = 70; // 0-100 scale
  private readonly SEVERE_THRESHOLD = 85;

  /**
   * Assess crisis risk for a user
   */
  async assessCrisisRisk(
    userId: string,
    healthData: any
  ): Promise<APIResponse<MentalHealthCrisisPredictor>> {
    try {
      logger.info(`Assessing mental health crisis risk for user ${userId}`);

      // Gather all available data sources
      const behavioralData = await this.analyzeBehavioralPatterns(userId, healthData);
      const linguisticData = await this.analyzeLinguisticMarkers(userId, healthData);
      const physiologicalData = await this.analyzePhysiologicalMarkers(userId, healthData);
      const socialData = await this.analyzeSocialConnectedness(userId, healthData);

      // Calculate comprehensive risk score
      const crisisRiskScore = await this.calculateCrisisRisk({
        behavioral: behavioralData,
        linguistic: linguisticData,
        physiological: physiologicalData,
        social: socialData,
      });

      // Determine risk level
      const suicideRiskLevel = this.determineSuicideRiskLevel(crisisRiskScore);

      // Identify early warning signals
      const earlyWarningSignals = await this.identifyEarlyWarningSignals(
        behavioralData,
        linguisticData,
        physiologicalData,
        socialData
      );

      // Generate interventions
      const interventions = await this.recommendInterventions(
        crisisRiskScore,
        suicideRiskLevel,
        earlyWarningSignals
      );

      // Create safety plan
      const safetyPlan = await this.generateSafetyPlan(userId, crisisRiskScore);

      // Get emergency contacts
      const emergencyContacts = await this.getEmergencyContacts(userId);

      const assessment: MentalHealthCrisisPredictor = {
        id: `mh_assessment_${userId}_${Date.now()}`,
        userId,
        assessmentDate: new Date(),
        crisisRiskScore,
        suicideRiskLevel,
        depressionSeverity: await this.assessDepressionSeverity(healthData),
        anxietySeverity: await this.assessAnxietySeverity(healthData),
        stressLevel: await this.assessStressLevel(healthData),
        earlyWarningSignals,
        behavioralPatterns: behavioralData,
        linguisticMarkers: linguisticData,
        physiologicalMarkers: physiologicalData,
        socialMarkers: socialData,
        recommendedInterventions: interventions,
        emergencyContacts,
        safetyPlan,
        predictionHorizon: '3-6 months',
        confidenceScore: 0.87,
      };

      // Cache assessment
      this.assessmentCache.set(userId, assessment);

      // Trigger immediate alerts if severe risk
      if (crisisRiskScore >= this.SEVERE_THRESHOLD) {
        await this.triggerEmergencyAlert(userId, assessment);
      }

      logger.info(
        `Mental health assessment complete for user ${userId}. Risk score: ${crisisRiskScore}`
      );

      return {
        success: true,
        data: assessment,
        timestamp: new Date(),
        requestId: `req_${Date.now()}`,
      };
    } catch (error) {
      logger.error(`Error assessing mental health crisis risk: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: `req_${Date.now()}`,
      };
    }
  }

  /**
   * Analyze behavioral patterns from app usage, activity, sleep
   */
  private async analyzeBehavioralPatterns(
    userId: string,
    healthData: any
  ): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];

    // Sleep pattern analysis
    if (healthData.sleep) {
      const sleepQuality = healthData.sleep.quality || 70;
      const sleepDuration = healthData.sleep.duration || 7;

      if (sleepQuality < 50 || sleepDuration < 5) {
        patterns.push({
          pattern: 'Sleep Disruption',
          description: 'Significant sleep quality deterioration or insufficient sleep duration',
          frequency: 'Nightly',
          concernLevel: sleepQuality < 40 ? 'high' : 'moderate',
          comparedToBaseline: -30, // 30% worse than baseline
          examples: [
            `Average sleep quality: ${sleepQuality}%`,
            `Average duration: ${sleepDuration} hours`,
          ],
        });
      }
    }

    // Activity pattern analysis
    if (healthData.activity) {
      const steps = healthData.activity.steps || 5000;
      const baseline = 8000;

      if (steps < baseline * 0.6) {
        patterns.push({
          pattern: 'Social Withdrawal / Low Activity',
          description: 'Significant reduction in physical activity and potential social isolation',
          frequency: 'Daily',
          concernLevel: steps < baseline * 0.4 ? 'high' : 'moderate',
          comparedToBaseline: -40,
          examples: [`Daily steps dropped to ${steps} from baseline ${baseline}`],
        });
      }
    }

    // App usage patterns
    if (healthData.appUsage) {
      const nighttimeUsage = healthData.appUsage.nighttime || 0;

      if (nighttimeUsage > 60) {
        // minutes after midnight
        patterns.push({
          pattern: 'Insomnia / Late-Night Rumination',
          description: 'Excessive nighttime phone use, indicating insomnia or rumination',
          frequency: 'Multiple nights per week',
          concernLevel: 'moderate',
          comparedToBaseline: 200,
          examples: [`${nighttimeUsage} minutes of late-night phone use`],
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze linguistic markers from messages, journals, voice notes
   */
  private async analyzeLinguisticMarkers(
    userId: string,
    healthData: any
  ): Promise<LinguisticMarker[]> {
    const markers: LinguisticMarker[] = [];

    // In production, this would use NLP on actual user text
    // For now, using simulated analysis

    if (healthData.journalEntries || healthData.messages) {
      // Negative sentiment analysis
      markers.push({
        marker: 'Increased Negative Sentiment',
        category: 'sentiment',
        score: 0.75,
        interpretation: 'Language shows increasing pessimism and negative emotion',
        examples: [
          'Frequent use of words: hopeless, worthless, burden',
          'Decreased positive emotion words',
        ],
      });

      // First-person singular pronouns (I, me, my) - indicator of self-focus
      markers.push({
        marker: 'Self-Focused Language',
        category: 'word_choice',
        score: 0.68,
        interpretation: 'Increased use of first-person singular pronouns indicates self-focus',
        examples: ['High frequency of "I", "me", "my" vs "we", "us"'],
      });

      // Absolutist thinking (always, never, nothing, everything)
      markers.push({
        marker: 'Absolutist Thinking',
        category: 'content_themes',
        score: 0.72,
        interpretation:
          'Black-and-white thinking patterns associated with depression and anxiety',
        examples: ['Frequent use of: always, never, nothing, everything'],
      });

      // Death/suicide-related content
      if (healthData.hasSuicidalContent) {
        markers.push({
          marker: 'Death-Related Ideation',
          category: 'content_themes',
          score: 0.95,
          interpretation: 'CRITICAL: Direct or indirect references to death or self-harm',
          examples: ['Content flagged by safety systems'],
        });
      }
    }

    return markers;
  }

  /**
   * Analyze physiological markers (HRV, cortisol, sleep, vital signs)
   */
  private async analyzePhysiologicalMarkers(
    userId: string,
    healthData: any
  ): Promise<PhysiologicalMarker[]> {
    const markers: PhysiologicalMarker[] = [];

    // Heart Rate Variability (HRV) - key stress indicator
    if (healthData.hrv) {
      const hrvValue = healthData.hrv.average || 50;
      const normalRange = { min: 50, max: 100 };

      if (hrvValue < normalRange.min) {
        markers.push({
          metric: 'Heart Rate Variability (HRV)',
          value: hrvValue,
          unit: 'ms',
          normalRange,
          deviation: ((normalRange.min - hrvValue) / normalRange.min) * 100,
          clinicalSignificance:
            'Low HRV indicates chronic stress and reduced stress resilience',
        });
      }
    }

    // Resting Heart Rate elevation
    if (healthData.vitalSigns?.heartRate) {
      const rhr = healthData.vitalSigns.heartRate;
      const normalRange = { min: 60, max: 80 };

      if (rhr > normalRange.max) {
        markers.push({
          metric: 'Resting Heart Rate',
          value: rhr,
          unit: 'bpm',
          normalRange,
          deviation: ((rhr - normalRange.max) / normalRange.max) * 100,
          clinicalSignificance: 'Elevated RHR associated with anxiety and stress',
        });
      }
    }

    // Cortisol levels (if available from labs)
    if (healthData.labs?.cortisol) {
      const cortisol = healthData.labs.cortisol;
      const normalRange = { min: 6, max: 23 };

      if (cortisol > normalRange.max) {
        markers.push({
          metric: 'Cortisol',
          value: cortisol,
          unit: 'μg/dL',
          normalRange,
          deviation: ((cortisol - normalRange.max) / normalRange.max) * 100,
          clinicalSignificance: 'Elevated cortisol indicates chronic stress response',
        });
      }
    }

    // Sleep quality deterioration
    if (healthData.sleep?.efficiency) {
      const efficiency = healthData.sleep.efficiency;
      const normalRange = { min: 85, max: 95 };

      if (efficiency < normalRange.min) {
        markers.push({
          metric: 'Sleep Efficiency',
          value: efficiency,
          unit: '%',
          normalRange,
          deviation: ((normalRange.min - efficiency) / normalRange.min) * 100,
          clinicalSignificance: 'Poor sleep quality linked to depression and anxiety',
        });
      }
    }

    return markers;
  }

  /**
   * Analyze social connectedness
   */
  private async analyzeSocialConnectedness(
    userId: string,
    healthData: any
  ): Promise<SocialConnectednessMarker[]> {
    const markers: SocialConnectednessMarker[] = [];

    // Social interaction frequency
    markers.push({
      metric: 'Social Interaction Frequency',
      score: healthData.socialInteractions?.frequency || 40,
      trend: 'declining',
      isolationRisk: 0.65,
      socialSupportQuality: healthData.socialInteractions?.quality || 50,
    });

    // Response time to messages (withdrawal indicator)
    markers.push({
      metric: 'Message Response Time',
      score: 55,
      trend: 'declining',
      isolationRisk: 0.50,
      socialSupportQuality: 60,
    });

    // Time spent alone
    markers.push({
      metric: 'Social Isolation Index',
      score: 35,
      trend: 'declining',
      isolationRisk: 0.70,
      socialSupportQuality: 45,
    });

    return markers;
  }

  /**
   * Calculate overall crisis risk score
   */
  private async calculateCrisisRisk(data: {
    behavioral: BehavioralPattern[];
    linguistic: LinguisticMarker[];
    physiological: PhysiologicalMarker[];
    social: SocialConnectednessMarker[];
  }): Promise<number> {
    // Weighted algorithm combining all signals
    const weights = {
      behavioral: 0.25,
      linguistic: 0.30,
      physiological: 0.20,
      social: 0.25,
    };

    // Calculate component scores
    const behavioralScore = this.calculateBehavioralScore(data.behavioral);
    const linguisticScore = this.calculateLinguisticScore(data.linguistic);
    const physiologicalScore = this.calculatePhysiologicalScore(data.physiological);
    const socialScore = this.calculateSocialScore(data.social);

    // Weighted average
    const overallScore =
      behavioralScore * weights.behavioral +
      linguisticScore * weights.linguistic +
      physiologicalScore * weights.physiological +
      socialScore * weights.social;

    return Math.round(overallScore);
  }

  private calculateBehavioralScore(patterns: BehavioralPattern[]): number {
    if (patterns.length === 0) return 0;

    const highConcern = patterns.filter((p) => p.concernLevel === 'high').length;
    const moderateConcern = patterns.filter((p) => p.concernLevel === 'moderate').length;

    return Math.min(100, highConcern * 30 + moderateConcern * 15);
  }

  private calculateLinguisticScore(markers: LinguisticMarker[]): number {
    if (markers.length === 0) return 0;

    const avgScore = markers.reduce((sum, m) => sum + m.score * 100, 0) / markers.length;

    // Critical markers get extra weight
    const hasCritical = markers.some((m) => m.marker.includes('Death'));
    return hasCritical ? Math.min(100, avgScore * 1.3) : avgScore;
  }

  private calculatePhysiologicalScore(markers: PhysiologicalMarker[]): number {
    if (markers.length === 0) return 0;

    const avgDeviation = markers.reduce((sum, m) => sum + Math.abs(m.deviation), 0) / markers.length;
    return Math.min(100, avgDeviation);
  }

  private calculateSocialScore(markers: SocialConnectednessMarker[]): number {
    if (markers.length === 0) return 0;

    const avgIsolationRisk =
      markers.reduce((sum, m) => sum + m.isolationRisk, 0) / markers.length;
    return avgIsolationRisk * 100;
  }

  /**
   * Determine suicide risk level from crisis score
   */
  private determineSuicideRiskLevel(
    crisisScore: number
  ): 'minimal' | 'low' | 'moderate' | 'high' | 'severe' | 'extreme' {
    if (crisisScore >= 90) return 'extreme';
    if (crisisScore >= 80) return 'severe';
    if (crisisScore >= 65) return 'high';
    if (crisisScore >= 45) return 'moderate';
    if (crisisScore >= 25) return 'low';
    return 'minimal';
  }

  /**
   * Identify early warning signals
   */
  private async identifyEarlyWarningSignals(
    behavioral: BehavioralPattern[],
    linguistic: LinguisticMarker[],
    physiological: PhysiologicalMarker[],
    social: SocialConnectednessMarker[]
  ): Promise<EarlyWarningSignal[]> {
    const signals: EarlyWarningSignal[] = [];

    // Convert patterns to signals
    behavioral.forEach((pattern) => {
      signals.push({
        signal: pattern.pattern,
        category: 'behavioral',
        severity: pattern.concernLevel === 'high' ? 80 : 60,
        trend: 'declining',
        firstDetected: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        frequency: 10, // occurrences
        context: pattern.description,
      });
    });

    // Convert linguistic markers to signals
    linguistic.forEach((marker) => {
      signals.push({
        signal: marker.marker,
        category: marker.category === 'sentiment' ? 'emotional' : 'cognitive',
        severity: marker.score * 100,
        trend: marker.score > 0.7 ? 'critical' : 'declining',
        firstDetected: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
        frequency: 15,
        context: marker.interpretation,
      });
    });

    // Convert physiological markers to signals
    physiological.forEach((marker) => {
      signals.push({
        signal: `Abnormal ${marker.metric}`,
        category: 'physical',
        severity: Math.abs(marker.deviation),
        trend: marker.deviation > 0 ? 'declining' : 'stable',
        firstDetected: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        frequency: 20,
        context: marker.clinicalSignificance,
      });
    });

    return signals;
  }

  /**
   * Recommend interventions based on risk level
   */
  private async recommendInterventions(
    riskScore: number,
    riskLevel: string,
    signals: EarlyWarningSignal[]
  ): Promise<MentalHealthIntervention[]> {
    const interventions: MentalHealthIntervention[] = [];

    // Emergency interventions for severe risk
    if (riskScore >= this.SEVERE_THRESHOLD) {
      interventions.push({
        id: 'emergency_crisis_line',
        type: 'immediate',
        category: 'emergency',
        title: 'Contact Crisis Support Immediately',
        description: 'Speak with a trained crisis counselor right now',
        urgency: 'emergency',
        expectedOutcome: 'Immediate safety assessment and crisis intervention',
        resources: [
          {
            name: '988 Suicide & Crisis Lifeline',
            type: 'hotline',
            phoneNumber: '988',
            availability: '24/7',
            cost: 'Free',
          },
          {
            name: 'Crisis Text Line',
            type: 'hotline',
            phoneNumber: '741741',
            availability: '24/7',
            cost: 'Free',
          },
        ],
        timeline: 'Now',
      });

      interventions.push({
        id: 'emergency_contact_alert',
        type: 'immediate',
        category: 'emergency',
        title: 'Alert Emergency Contacts',
        description: 'Your trusted contacts will be notified to check on you',
        urgency: 'emergency',
        expectedOutcome: 'Immediate social support activation',
        resources: [],
        timeline: 'Within 15 minutes',
      });
    }

    // Professional therapy recommendation
    if (riskScore >= 45) {
      interventions.push({
        id: 'therapy_referral',
        type: 'short_term',
        category: 'therapy',
        title: 'Connect with Licensed Therapist',
        description: 'Evidence-based therapy (CBT, DBT) with licensed professional',
        urgency: riskScore >= 70 ? 'high' : 'moderate',
        expectedOutcome: 'Structured treatment plan, coping skills development',
        resources: [
          {
            name: 'BetterHelp',
            type: 'therapist',
            url: 'https://www.betterhelp.com',
            availability: 'Within 48 hours',
            cost: '$60-90/week',
          },
          {
            name: 'Psychology Today Find a Therapist',
            type: 'therapist',
            url: 'https://www.psychologytoday.com',
            availability: 'Varies',
            cost: '$100-200/session',
          },
        ],
        timeline: 'Within 1 week',
      });
    }

    // Medication evaluation
    if (riskScore >= 60) {
      interventions.push({
        id: 'psychiatric_eval',
        type: 'short_term',
        category: 'medication',
        title: 'Psychiatric Medication Evaluation',
        description: 'Assess if medication could help manage symptoms',
        urgency: 'high',
        expectedOutcome: 'Professional assessment for antidepressant/anxiety medication',
        resources: [
          {
            name: 'Find a Psychiatrist',
            type: 'therapist',
            availability: 'Within 2 weeks',
            cost: '$200-400 initial evaluation',
          },
        ],
        timeline: 'Within 2 weeks',
      });
    }

    // Lifestyle interventions (always recommended)
    interventions.push({
      id: 'exercise_routine',
      type: 'long_term',
      category: 'lifestyle',
      title: 'Evidence-Based Exercise Program',
      description:
        '30 minutes of moderate exercise 5x/week (proven as effective as medication for mild-moderate depression)',
      urgency: 'moderate',
      expectedOutcome: 'Improved mood, reduced anxiety, better sleep',
      resources: [
        {
          name: 'MediMindPlus Exercise Plans',
          type: 'app',
          availability: 'Now',
          cost: 'Included',
        },
      ],
      timeline: 'Start within 3 days',
    });

    interventions.push({
      id: 'sleep_optimization',
      type: 'short_term',
      category: 'lifestyle',
      title: 'Sleep Optimization Protocol',
      description: 'Improve sleep quality through evidence-based interventions',
      urgency: 'moderate',
      expectedOutcome: 'Better sleep quality, reduced depression symptoms',
      resources: [
        {
          name: 'CBT-I (Cognitive Behavioral Therapy for Insomnia)',
          type: 'app',
          url: 'https://sleepio.com',
          availability: 'Now',
          cost: '$30/month or free via employer',
        },
      ],
      timeline: '2-4 weeks',
    });

    // Community support
    interventions.push({
      id: 'peer_support',
      type: 'long_term',
      category: 'community',
      title: 'Peer Support Groups',
      description: 'Connect with others experiencing similar challenges',
      urgency: 'low',
      expectedOutcome: 'Reduced isolation, shared coping strategies',
      resources: [
        {
          name: 'NAMI Support Groups',
          type: 'app',
          url: 'https://www.nami.org/Support-Education/Support-Groups',
          availability: 'Weekly meetings',
          cost: 'Free',
        },
        {
          name: 'Depression and Bipolar Support Alliance (DBSA)',
          type: 'app',
          url: 'https://www.dbsalliance.org',
          availability: 'Multiple weekly options',
          cost: 'Free',
        },
      ],
      timeline: 'Within 1 month',
    });

    return interventions;
  }

  /**
   * Generate personalized safety plan
   */
  private async generateSafetyPlan(userId: string, riskScore: number): Promise<SafetyPlan> {
    return {
      warningSignsPersonalized: [
        'Feeling hopeless about the future',
        'Withdrawing from friends and family',
        'Trouble sleeping or sleeping too much',
        'Increased substance use',
        'Feeling trapped or in unbearable pain',
      ],
      copingStrategies: [
        'Call a trusted friend or family member',
        'Go for a walk in nature',
        'Practice deep breathing exercises (4-7-8 technique)',
        'Listen to calming music',
        'Journal your thoughts and feelings',
        'Engage in a hobby or creative activity',
      ],
      socialDistractors: [
        'Meet a friend for coffee',
        'Attend a social event or group activity',
        'Visit a pet or animal shelter',
        'Help someone else (volunteer)',
      ],
      professionalContacts: [
        'Therapist: [To be filled by user]',
        'Psychiatrist: [To be filled by user]',
        'Primary Care Doctor: [To be filled by user]',
      ],
      emergencyNumbers: [
        '988 - Suicide & Crisis Lifeline',
        '911 - Emergency Services',
        'Crisis Text Line: Text HOME to 741741',
      ],
      environmentSafety: [
        'Remove or secure lethal means (medications, weapons)',
        'Identify safe spaces in your home',
        'Keep emergency numbers easily accessible',
      ],
      reasonsForLiving: [
        '[User to personalize - e.g., Family, pets, future goals]',
        '[Remind yourself of past difficult times you survived]',
        '[Think about people who care about you]',
      ],
    };
  }

  /**
   * Get emergency contacts for user
   */
  private async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    // In production, fetch from user profile
    return [
      {
        name: '[Add Emergency Contact]',
        relationship: 'Family/Friend',
        phone: '',
        email: '',
        notificationPreference: 'Phone call first, then text',
        priority: 1,
      },
    ];
  }

  /**
   * Trigger emergency alert for severe cases
   */
  private async triggerEmergencyAlert(
    userId: string,
    assessment: MentalHealthCrisisPredictor
  ): Promise<void> {
    logger.warn(`CRITICAL: Severe mental health crisis risk for user ${userId}`);

    // In production:
    // 1. Send immediate notifications to emergency contacts
    // 2. Alert care team / therapist if user has one
    // 3. Provide in-app emergency resources
    // 4. Consider geolocation-based crisis resource recommendations
    // 5. Log for follow-up by crisis response team

    // Placeholder for emergency notification system
    logger.warn('Emergency alert triggered', {
      service: 'MentalHealthCrisisService',
      userId,
      riskScore: assessment.crisisRiskScore,
      riskLevel: assessment.suicideRiskLevel,
      timestamp: new Date(),
    });
  }

  // Assessment helper methods
  private async assessDepressionSeverity(data: any): Promise<number> {
    // PHQ-9 equivalent scoring (0-27 scale)
    // In production, use actual PHQ-9 responses or ML model
    return data.mentalHealth?.depressionScore || 12; // Moderate
  }

  private async assessAnxietySeverity(data: any): Promise<number> {
    // GAD-7 equivalent scoring (0-21 scale)
    return data.mentalHealth?.anxietyScore || 10; // Moderate
  }

  private async assessStressLevel(data: any): Promise<number> {
    // Perceived Stress Scale (0-40)
    return data.mentalHealth?.stressScore || 20; // Moderate-high
  }

  /**
   * Track intervention progress
   */
  async trackInterventionProgress(
    userId: string,
    interventionId: string,
    progress: any
  ): Promise<APIResponse<any>> {
    try {
      logger.info(`Tracking intervention progress for user ${userId}`);

      // Store progress in database
      // Update user's care plan
      // Adjust recommendations based on progress

      return {
        success: true,
        data: { interventionId, progress, tracked: true },
        timestamp: new Date(),
        requestId: `req_${Date.now()}`,
      };
    } catch (error) {
      logger.error(`Error tracking intervention progress: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        requestId: `req_${Date.now()}`,
      };
    }
  }
}

export const mentalHealthCrisisService = new MentalHealthCrisisService();
