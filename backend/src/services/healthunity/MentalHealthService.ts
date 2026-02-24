import { EventEmitter } from 'events';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface MentalHealthEntry {
  id?: string;
  userId: string;
  moodScore?: number; // 1-10
  anxietyLevel?: number; // 1-10
  stressLevel?: number; // 1-10
  depressionScore?: number; // PHQ-9 score (0-27)
  activities?: string[];
  sleepHours?: number;
  sleepQuality?: number; // 1-10
  journalEntry?: string;
  aiInsights?: string;
  crisisFlag: boolean;
  trackedAt: Date;
}

interface MentalHealthTrend {
  userId: string;
  averageMood: number;
  averageAnxiety: number;
  averageStress: number;
  trend: 'improving' | 'stable' | 'declining' | 'crisis';
  recommendations: string[];
  alertLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
}

interface PHQ9Assessment {
  totalScore: number;
  severity: 'none' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  suicideRisk: boolean;
  recommendations: string[];
}

/**
 * Mental Health Monitoring Service
 * Tracks mental health metrics with AI-powered insights and crisis detection
 */
export class MentalHealthService extends EventEmitter {
  private db: any;

  // PHQ-9 Depression scale thresholds
  private readonly PHQ9_THRESHOLDS = {
    none: 0,
    mild: 5,
    moderate: 10,
    moderately_severe: 15,
    severe: 20
  };

  // Crisis keywords for journal analysis
  private readonly CRISIS_KEYWORDS = [
    'suicide', 'suicidal', 'kill myself', 'end it all', 'want to die',
    'no reason to live', 'better off dead', 'can\'t go on', 'hopeless',
    'self-harm', 'hurt myself', 'worthless', 'nothing matters'
  ];

  constructor(database: any) {
    super();
    this.db = database;

    // Start automated monitoring
    this.startAutomatedMonitoring();
  }

  /**
   * Track daily mental health metrics
   */
  async trackMentalHealth(entry: MentalHealthEntry): Promise<string> {
    const entryId = uuidv4();

    try {
      // Analyze journal entry for crisis indicators
      const crisisDetected = entry.journalEntry
        ? this.detectCrisisIndicators(entry.journalEntry)
        : false;

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(entry);

      // Determine if this is a crisis situation
      const isCrisis = crisisDetected ||
        (entry.depressionScore !== undefined && entry.depressionScore >= this.PHQ9_THRESHOLDS.severe) ||
        (entry.moodScore !== undefined && entry.moodScore <= 2) ||
        (entry.anxietyLevel !== undefined && entry.anxietyLevel >= 9);

      await this.db('mental_health_tracking').insert({
        id: entryId,
        user_id: entry.userId,
        mood_score: entry.moodScore,
        anxiety_level: entry.anxietyLevel,
        stress_level: entry.stressLevel,
        depression_score: entry.depressionScore,
        activities: entry.activities ? JSON.stringify(entry.activities) : null,
        sleep_hours: entry.sleepHours,
        sleep_quality: entry.sleepQuality,
        journal_entry: entry.journalEntry,
        ai_insights: aiInsights,
        crisis_flag: isCrisis,
        tracked_at: entry.trackedAt || new Date(),
        created_at: new Date()
      });

      logger.info(`Mental health entry tracked: ${entryId} for user ${entry.userId}`);

      // Emit event
      this.emit('mentalHealthTracked', {
        entryId,
        userId: entry.userId,
        crisisFlag: isCrisis
      });

      // If crisis detected, trigger immediate intervention
      if (isCrisis) {
        await this.handleCrisisDetection(entry.userId, entryId, aiInsights);
      }

      return entryId;
    } catch (error) {
      logger.error('Error tracking mental health:', error);
      throw error;
    }
  }

  /**
   * Conduct PHQ-9 depression screening
   */
  async conductPHQ9Assessment(userId: string, responses: number[]): Promise<PHQ9Assessment> {
    if (responses.length !== 9) {
      throw new Error('PHQ-9 requires exactly 9 responses');
    }

    // Calculate total score
    const totalScore = responses.reduce((sum, score) => sum + score, 0);

    // Determine severity
    let severity: PHQ9Assessment['severity'];
    if (totalScore >= this.PHQ9_THRESHOLDS.severe) {
      severity = 'severe';
    } else if (totalScore >= this.PHQ9_THRESHOLDS.moderately_severe) {
      severity = 'moderately_severe';
    } else if (totalScore >= this.PHQ9_THRESHOLDS.moderate) {
      severity = 'moderate';
    } else if (totalScore >= this.PHQ9_THRESHOLDS.mild) {
      severity = 'mild';
    } else {
      severity = 'none';
    }

    // Check suicide risk (question 9)
    const suicideRisk = responses[8] > 0;

    // Generate recommendations
    const recommendations = this.getPHQ9Recommendations(severity, suicideRisk);

    // Save assessment
    await this.trackMentalHealth({
      userId,
      depressionScore: totalScore,
      crisisFlag: severity === 'severe' || severity === 'moderately_severe' || suicideRisk,
      trackedAt: new Date()
    });

    return {
      totalScore,
      severity,
      suicideRisk,
      recommendations
    };
  }

  /**
   * Get mental health trends for a user
   */
  async getMentalHealthTrends(userId: string, days: number = 30): Promise<MentalHealthTrend> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const entries = await this.db('mental_health_tracking')
        .where('user_id', userId)
        .where('tracked_at', '>=', startDate)
        .orderBy('tracked_at', 'desc');

      if (entries.length === 0) {
        return {
          userId,
          averageMood: 5,
          averageAnxiety: 5,
          averageStress: 5,
          trend: 'stable',
          recommendations: ['Start tracking your mental health daily for personalized insights'],
          alertLevel: 'none'
        };
      }

      // Calculate averages
      const validMoodScores = entries.filter((e: any) => e.mood_score !== null).map((e: any) => e.mood_score);
      const validAnxietyLevels = entries.filter((e: any) => e.anxiety_level !== null).map((e: any) => e.anxiety_level);
      const validStressLevels = entries.filter((e: any) => e.stress_level !== null).map((e: any) => e.stress_level);

      const averageMood = validMoodScores.length > 0
        ? validMoodScores.reduce((sum: number, val: number) => sum + val, 0) / validMoodScores.length
        : 5;

      const averageAnxiety = validAnxietyLevels.length > 0
        ? validAnxietyLevels.reduce((sum: number, val: number) => sum + val, 0) / validAnxietyLevels.length
        : 5;

      const averageStress = validStressLevels.length > 0
        ? validStressLevels.reduce((sum: number, val: number) => sum + val, 0) / validStressLevels.length
        : 5;

      // Determine trend
      const recentEntries = entries.slice(0, Math.floor(entries.length / 2));
      const olderEntries = entries.slice(Math.floor(entries.length / 2));

      const recentMood = recentEntries.filter((e: any) => e.mood_score !== null)
        .reduce((sum: number, e: any) => sum + e.mood_score, 0) / recentEntries.filter((e: any) => e.mood_score !== null).length || 5;

      const olderMood = olderEntries.filter((e: any) => e.mood_score !== null)
        .reduce((sum: number, e: any) => sum + e.mood_score, 0) / olderEntries.filter((e: any) => e.mood_score !== null).length || 5;

      let trend: MentalHealthTrend['trend'];
      const hasCrisisFlag = entries.some((e: any) => e.crisis_flag);

      if (hasCrisisFlag) {
        trend = 'crisis';
      } else if (recentMood > olderMood + 1) {
        trend = 'improving';
      } else if (recentMood < olderMood - 1) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }

      // Determine alert level
      let alertLevel: MentalHealthTrend['alertLevel'];
      if (trend === 'crisis' || averageMood <= 3) {
        alertLevel = 'critical';
      } else if (trend === 'declining' || averageMood <= 4 || averageAnxiety >= 8) {
        alertLevel = 'high';
      } else if (averageAnxiety >= 7 || averageStress >= 7) {
        alertLevel = 'moderate';
      } else if (averageMood <= 6) {
        alertLevel = 'low';
      } else {
        alertLevel = 'none';
      }

      // Generate recommendations
      const recommendations = this.generateTrendRecommendations(trend, averageMood, averageAnxiety, averageStress);

      return {
        userId,
        averageMood,
        averageAnxiety,
        averageStress,
        trend,
        recommendations,
        alertLevel
      };
    } catch (error) {
      logger.error('Error getting mental health trends:', error);
      throw error;
    }
  }

  /**
   * Get user's mental health history
   */
  async getMentalHealthHistory(userId: string, limit: number = 30): Promise<MentalHealthEntry[]> {
    try {
      const rows = await this.db('mental_health_tracking')
        .where({ user_id: userId })
        .orderBy('tracked_at', 'desc')
        .limit(limit);

      return rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        moodScore: row.mood_score,
        anxietyLevel: row.anxiety_level,
        stressLevel: row.stress_level,
        depressionScore: row.depression_score,
        activities: row.activities ? JSON.parse(row.activities) : [],
        sleepHours: row.sleep_hours,
        sleepQuality: row.sleep_quality,
        journalEntry: row.journal_entry,
        aiInsights: row.ai_insights,
        crisisFlag: row.crisis_flag,
        trackedAt: row.tracked_at
      }));
    } catch (error) {
      logger.error('Error getting mental health history:', error);
      throw error;
    }
  }

  /**
   * Detect crisis indicators in journal entry
   */
  private detectCrisisIndicators(journalEntry: string): boolean {
    const lowerEntry = journalEntry.toLowerCase();

    return this.CRISIS_KEYWORDS.some(keyword => lowerEntry.includes(keyword));
  }

  /**
   * Generate AI insights based on mental health data
   */
  private async generateAIInsights(entry: MentalHealthEntry): Promise<string> {
    const insights: string[] = [];

    // Mood analysis
    if (entry.moodScore !== undefined) {
      if (entry.moodScore <= 3) {
        insights.push('Your mood is quite low today. Consider reaching out to someone you trust or a mental health professional.');
      } else if (entry.moodScore >= 8) {
        insights.push('Great to see you\'re feeling positive today! Keep up whatever you\'re doing.');
      }
    }

    // Anxiety analysis
    if (entry.anxietyLevel !== undefined) {
      if (entry.anxietyLevel >= 8) {
        insights.push('Your anxiety level is elevated. Try deep breathing exercises or meditation.');
      }
    }

    // Stress analysis
    if (entry.stressLevel !== undefined) {
      if (entry.stressLevel >= 8) {
        insights.push('You\'re experiencing high stress. Consider taking a break or engaging in relaxing activities.');
      }
    }

    // Sleep analysis
    if (entry.sleepHours !== undefined) {
      if (entry.sleepHours < 6) {
        insights.push('You\'re not getting enough sleep. Aim for 7-9 hours for better mental health.');
      } else if (entry.sleepHours > 10) {
        insights.push('You\'re sleeping more than usual. This could be a sign of depression. Consider talking to a healthcare provider.');
      }
    }

    // Activity analysis
    if (entry.activities && entry.activities.length > 0) {
      insights.push(`Positive activities noted: ${entry.activities.join(', ')}. Keep engaging in activities you enjoy.`);
    } else {
      insights.push('Try engaging in activities you enjoy. Physical activity and social connection can improve mood.');
    }

    return insights.join(' ');
  }

  /**
   * Handle crisis detection
   */
  private async handleCrisisDetection(userId: string, entryId: string, insights: string): Promise<void> {
    logger.warn(`CRISIS DETECTED for user ${userId} in entry ${entryId}`);

    // Emit critical event
    this.emit('crisisDetected', {
      userId,
      entryId,
      timestamp: new Date(),
      severity: 'critical'
    });

    // In production, this would:
    // 1. Send immediate notification to user with crisis resources
    // 2. Alert designated emergency contacts (if user has opted in)
    // 3. Trigger automated follow-up check-in
    // 4. Potentially notify healthcare provider or case manager

    // For now, log the crisis resources that would be sent
    logger.info('Crisis resources that would be sent:', {
      '988 Suicide & Crisis Lifeline': '988',
      'Crisis Text Line': 'Text HOME to 741741',
      'International Association for Suicide Prevention': 'https://www.iasp.info/resources/Crisis_Centres/',
      'Emergency Services': '911 (US) or local emergency number'
    });
  }

  /**
   * Get PHQ-9 recommendations
   */
  private getPHQ9Recommendations(severity: string, suicideRisk: boolean): string[] {
    const recommendations: string[] = [];

    if (suicideRisk) {
      recommendations.push('URGENT: You indicated thoughts of self-harm. Please call 988 (Suicide & Crisis Lifeline) or emergency services immediately.');
      recommendations.push('You are not alone. Crisis counselors are available 24/7 to help.');
    }

    switch (severity) {
      case 'severe':
      case 'moderately_severe':
        recommendations.push('Your scores indicate significant depression. Please seek professional help immediately.');
        recommendations.push('Contact a mental health provider, your doctor, or go to the emergency room.');
        recommendations.push('Consider calling a crisis hotline: 988 (US) or your local mental health crisis line.');
        break;

      case 'moderate':
        recommendations.push('Your scores suggest moderate depression. It\'s important to see a mental health professional soon.');
        recommendations.push('Consider therapy (CBT, IPT) and/or medication consultation with a psychiatrist.');
        recommendations.push('Engage in self-care: exercise, social connection, healthy sleep habits.');
        break;

      case 'mild':
        recommendations.push('Your scores indicate mild depression symptoms.');
        recommendations.push('Consider talking to a therapist or counselor.');
        recommendations.push('Focus on self-care: regular exercise, good sleep, social activities, stress management.');
        recommendations.push('Monitor your symptoms - if they worsen, seek professional help.');
        break;

      default:
        recommendations.push('Your scores are in the minimal/none range for depression.');
        recommendations.push('Continue maintaining good mental health habits.');
        recommendations.push('Regular exercise, social connection, and stress management are key.');
    }

    return recommendations;
  }

  /**
   * Generate trend recommendations
   */
  private generateTrendRecommendations(
    trend: string,
    mood: number,
    anxiety: number,
    stress: number
  ): string[] {
    const recommendations: string[] = [];

    if (trend === 'crisis') {
      recommendations.push('URGENT: Seek immediate mental health support. Call 988 or your local crisis line.');
    } else if (trend === 'declining') {
      recommendations.push('Your mental health appears to be declining. Consider scheduling an appointment with a therapist.');
      recommendations.push('Reach out to friends, family, or support groups.');
    } else if (trend === 'improving') {
      recommendations.push('Great progress! Keep up whatever strategies are working for you.');
    }

    if (anxiety >= 7) {
      recommendations.push('Try anxiety reduction techniques: deep breathing, progressive muscle relaxation, mindfulness.');
    }

    if (stress >= 7) {
      recommendations.push('Focus on stress management: regular breaks, time in nature, hobbies you enjoy.');
    }

    if (mood <= 5) {
      recommendations.push('Engage in mood-boosting activities: exercise, social connection, enjoyable hobbies.');
    }

    recommendations.push('Continue tracking your mental health daily for better insights.');

    return recommendations;
  }

  /**
   * Start automated monitoring for crisis detection
   */
  private startAutomatedMonitoring(): void {
    // Check for users in crisis every 15 minutes
    setInterval(async () => {
      try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const crisisEntries = await this.db('mental_health_tracking')
          .where('crisis_flag', true)
          .where('tracked_at', '>=', last24Hours);

        for (const entry of crisisEntries) {
          // Check if follow-up notification has been sent
          // In production, this would check notification history and send follow-ups
          logger.info(`Crisis follow-up check for user ${entry.user_id}`);
        }
      } catch (error) {
        logger.error('Error in automated crisis monitoring:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Get crisis resources for a region
   */
  async getCrisisResources(country: string = 'US'): Promise<any[]> {
    const resources: Record<string, any[]> = {
      US: [
        {
          name: '988 Suicide & Crisis Lifeline',
          contact: '988',
          type: 'phone',
          available: '24/7',
          languages: ['English', 'Spanish']
        },
        {
          name: 'Crisis Text Line',
          contact: '741741',
          type: 'text',
          message: 'Text HOME to 741741',
          available: '24/7'
        },
        {
          name: 'NAMI Helpline',
          contact: '1-800-950-6264',
          type: 'phone',
          available: 'Mon-Fri 10am-10pm ET'
        }
      ],
      UK: [
        {
          name: 'Samaritans',
          contact: '116 123',
          type: 'phone',
          available: '24/7'
        },
        {
          name: 'Shout Crisis Text Line',
          contact: '85258',
          type: 'text',
          message: 'Text SHOUT to 85258',
          available: '24/7'
        }
      ],
      International: [
        {
          name: 'International Association for Suicide Prevention',
          contact: 'https://www.iasp.info/resources/Crisis_Centres/',
          type: 'website',
          description: 'Directory of crisis centers worldwide'
        }
      ]
    };

    return resources[country] || resources.International;
  }
}

export default MentalHealthService;
