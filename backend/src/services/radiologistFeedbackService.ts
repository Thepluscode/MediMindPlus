/**
 * Radiologist Feedback Service
 *
 * Critical system for:
 * 1. Continuous model improvement (creates data moat)
 * 2. FDA post-market surveillance requirement
 * 3. Building trust with radiologists
 * 4. Calculating real-world accuracy metrics
 *
 * Every time a radiologist agrees/disagrees with an AI finding,
 * we learn and improve. This is your competitive advantage.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AIFinding {
  pathology: string;
  probability: number;  // 0-1
  confidence: number;   // 0-100
  severity: 'low' | 'medium' | 'high';
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  heatmapUrl?: string;
  clinicalSignificance?: string;
}

export interface RadiologistFeedback {
  studyId: string;
  radiologistId: string;
  aiFinding: AIFinding;
  radiologistAgreement: 'agree' | 'disagree' | 'uncertain';
  correctDiagnosis?: string;
  severity?: 'correct' | 'false_positive' | 'false_negative' | 'missed_finding';
  comments?: string;
  timeToReview: number;  // seconds
  timestamp?: Date;
}

export interface PerformanceMetrics {
  pathology: string;
  timeRange: 'week' | 'month' | 'quarter' | 'all';
  totalCases: number;
  agreementRate: number;
  disagreementRate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  averageConfidence: number;
  isDriftDetected: boolean;  // Alert if accuracy drops
}

export interface FDAReport {
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  deviceInfo: {
    name: string;
    version: string;
    fdaClearanceNumber: string;
  };
  performance: {
    [pathology: string]: PerformanceMetrics;
  };
  adverseEvents: Array<{
    pathology: string;
    issue: string;
    severity: string;
    action: string;
  }>;
  requiresFDANotification: boolean;
}

export class RadiologistFeedbackService {
  /**
   * Submit radiologist feedback on AI finding
   *
   * This is called every time a radiologist reviews an AI prediction
   */
  async submitFeedback(feedback: RadiologistFeedback): Promise<any> {
    try {
      // Store in database
      const record = await prisma.aiRadiologistFeedback.create({
        data: {
          studyId: feedback.studyId,
          radiologistId: feedback.radiologistId,
          pathology: feedback.aiFinding.pathology,
          aiProbability: feedback.aiFinding.probability,
          aiConfidence: feedback.aiFinding.confidence,
          aiSeverity: feedback.aiFinding.severity,
          radiologistAgreement: feedback.radiologistAgreement,
          correctDiagnosis: feedback.correctDiagnosis,
          severity: feedback.severity,
          comments: feedback.comments,
          timeToReview: feedback.timeToReview,
          createdAt: feedback.timestamp || new Date()
        }
      });

      // If disagreement or error, flag for retraining
      if (feedback.radiologistAgreement === 'disagree') {
        await this.flagForRetraining(feedback);
      }

      // If false negative (AI missed something), alert immediately
      if (feedback.severity === 'false_negative') {
        await this.alertCriticalMiss(feedback);
      }

      // Update running accuracy metrics
      await this.updateAccuracyMetrics(feedback);

      return {
        success: true,
        feedbackId: record.id,
        message: 'Thank you for your feedback. This helps improve our AI.'
      };

    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Flag case for model retraining
   *
   * Disagreements go into a retraining queue for weekly model updates
   */
  private async flagForRetraining(feedback: RadiologistFeedback): Promise<void> {
    try {
      await prisma.retrainingQueue.create({
        data: {
          studyId: feedback.studyId,
          pathology: feedback.aiFinding.pathology,
          aiPrediction: feedback.aiFinding.probability,
          correctLabel: feedback.correctDiagnosis || 'negative',
          priority: feedback.severity === 'false_negative' ? 'high' : 'medium',
          status: 'pending',
          flaggedAt: new Date()
        }
      });

      console.log(`Flagged study ${feedback.studyId} for retraining (${feedback.severity})`);

    } catch (error) {
      console.error('Error flagging for retraining:', error);
    }
  }

  /**
   * Alert when AI misses a critical finding
   *
   * False negatives are the most dangerous - FDA requires monitoring
   */
  private async alertCriticalMiss(feedback: RadiologistFeedback): Promise<void> {
    try {
      // Log to database
      await prisma.criticalEvents.create({
        data: {
          eventType: 'false_negative',
          studyId: feedback.studyId,
          pathology: feedback.aiFinding.pathology,
          aiProbability: feedback.aiFinding.probability,
          correctDiagnosis: feedback.correctDiagnosis,
          radiologistId: feedback.radiologistId,
          comments: feedback.comments,
          severity: 'critical',
          createdAt: new Date()
        }
      });

      // Send Slack/email alert to ML team
      await this.sendSlackAlert({
        channel: '#ai-alerts',
        message: `🚨 CRITICAL: False negative detected

Pathology: ${feedback.aiFinding.pathology}
Study ID: ${feedback.studyId}
AI Probability: ${(feedback.aiFinding.probability * 100).toFixed(1)}%
Correct Diagnosis: ${feedback.correctDiagnosis}
Radiologist: ${feedback.radiologistId}

Comments: ${feedback.comments || 'None'}

Action Required: Review this case and update training data.`
      });

      // If this is a pattern (multiple false negatives in same pathology),
      // trigger urgent model review
      const recentFalseNegatives = await this.getRecentFalseNegatives(
        feedback.aiFinding.pathology,
        7  // days
      );

      if (recentFalseNegatives > 5) {
        await this.triggerUrgentModelReview(feedback.aiFinding.pathology, recentFalseNegatives);
      }

    } catch (error) {
      console.error('Error alerting critical miss:', error);
    }
  }

  /**
   * Get recent false negatives for a pathology
   */
  private async getRecentFalseNegatives(pathology: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const count = await prisma.aiRadiologistFeedback.count({
      where: {
        pathology,
        severity: 'false_negative',
        createdAt: {
          gte: cutoffDate
        }
      }
    });

    return count;
  }

  /**
   * Trigger urgent model review if pattern of errors detected
   */
  private async triggerUrgentModelReview(pathology: string, errorCount: number): Promise<void> {
    await this.sendSlackAlert({
      channel: '#urgent-ai-review',
      message: `⚠️ URGENT: Pattern of false negatives detected

Pathology: ${pathology}
False negatives in last 7 days: ${errorCount}

This exceeds our threshold of 5 errors per week.

REQUIRED ACTIONS:
1. Immediate review of ${pathology} model performance
2. Check for data drift or distribution shift
3. Consider temporary model rollback if needed
4. Schedule emergency team meeting

@ml-team @medical-director`
    });

    // Create ticket in project management system
    // await this.createJiraTicket(...);
  }

  /**
   * Calculate real-world performance metrics
   *
   * FDA requires continuous monitoring of device performance
   */
  async getPerformanceMetrics(
    pathology: string,
    timeRange: 'week' | 'month' | 'quarter' | 'all'
  ): Promise<PerformanceMetrics> {
    try {
      const dateFilter = this.getDateFilter(timeRange);

      const feedbackRecords = await prisma.aiRadiologistFeedback.findMany({
        where: {
          pathology,
          createdAt: dateFilter
        }
      });

      if (feedbackRecords.length === 0) {
        return this.getEmptyMetrics(pathology, timeRange);
      }

      // Calculate metrics
      const totalCases = feedbackRecords.length;
      const agreements = feedbackRecords.filter(f => f.radiologistAgreement === 'agree').length;
      const disagreements = feedbackRecords.filter(f => f.radiologistAgreement === 'disagree').length;
      const falsePositives = feedbackRecords.filter(f => f.severity === 'false_positive').length;
      const falseNegatives = feedbackRecords.filter(f => f.severity === 'false_negative').length;

      const agreementRate = agreements / totalCases;
      const disagreementRate = disagreements / totalCases;
      const falsePositiveRate = falsePositives / totalCases;
      const falseNegativeRate = falseNegatives / totalCases;

      // Calculate average confidence
      const averageConfidence = feedbackRecords.reduce(
        (sum, record) => sum + record.aiConfidence,
        0
      ) / totalCases;

      // Detect drift: Alert if agreement rate drops below 85%
      // (This would indicate model performance degradation)
      const isDriftDetected = agreementRate < 0.85;

      if (isDriftDetected) {
        await this.alertPerformanceDrift(pathology, agreementRate);
      }

      return {
        pathology,
        timeRange,
        totalCases,
        agreementRate,
        disagreementRate,
        falsePositiveRate,
        falseNegativeRate,
        averageConfidence,
        isDriftDetected
      };

    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw error;
    }
  }

  /**
   * Alert when performance drift detected
   */
  private async alertPerformanceDrift(pathology: string, agreementRate: number): Promise<void> {
    await this.sendSlackAlert({
      channel: '#ai-performance',
      message: `📉 Performance Drift Detected

Pathology: ${pathology}
Current Agreement Rate: ${(agreementRate * 100).toFixed(1)}%
Expected: >85%

This indicates the model may be degrading in performance.

Action Required:
1. Review recent cases with disagreements
2. Check for changes in image quality or patient population
3. Consider model retraining
4. Monitor closely for next 7 days

@ml-team`
    });
  }

  /**
   * Generate FDA post-market surveillance report
   *
   * FDA requires quarterly reports on device performance
   * If performance degrades >5% from cleared performance, must notify FDA
   */
  async generateFDAReport(startDate: Date, endDate: Date): Promise<FDAReport> {
    try {
      const report: FDAReport = {
        reportPeriod: { startDate, endDate },
        deviceInfo: {
          name: 'MediMindPlus Chest X-ray AI Analysis System',
          version: '2.0',
          fdaClearanceNumber: process.env.FDA_CLEARANCE_NUMBER || 'K123456'
        },
        performance: {},
        adverseEvents: [],
        requiresFDANotification: false
      };

      // Calculate performance for all pathologies
      const pathologies = [
        'Pneumonia',
        'Pneumothorax',
        'Effusion',
        'Infiltration',
        'Atelectasis',
        'Nodule',
        'Mass',
        'Cardiomegaly',
        'Consolidation',
        'Edema',
        'Emphysema',
        'Fibrosis',
        'Pleural_Thickening',
        'Hernia'
      ];

      for (const pathology of pathologies) {
        const metrics = await this.getPerformanceMetrics(pathology, 'all');
        report.performance[pathology] = metrics;

        // Check if performance degradation requires FDA notification
        // For FDA-cleared devices, must report if performance drops >5% from cleared level
        if (pathology === 'Pneumonia') {
          const clearedSensitivity = 0.96;  // From 510(k) submission
          const currentSensitivity = 1 - metrics.falseNegativeRate;

          if (currentSensitivity < clearedSensitivity - 0.05) {
            report.requiresFDANotification = true;
            report.adverseEvents.push({
              pathology: 'Pneumonia',
              issue: 'Sensitivity dropped >5% from cleared performance',
              severity: 'Major',
              action: 'Investigating root cause and implementing corrective measures'
            });
          }
        }
      }

      // Save report
      await prisma.fdaReports.create({
        data: {
          reportPeriodStart: startDate,
          reportPeriodEnd: endDate,
          reportData: JSON.stringify(report),
          requiresNotification: report.requiresFDANotification,
          generatedAt: new Date()
        }
      });

      return report;

    } catch (error) {
      console.error('Error generating FDA report:', error);
      throw error;
    }
  }

  /**
   * Get practice-level statistics for dashboard
   *
   * Shows practice managers the value they're getting
   */
  async getPracticeStatistics(practiceId: string, timeRange: 'week' | 'month'): Promise<any> {
    const dateFilter = this.getDateFilter(timeRange);

    const stats = {
      totalStudiesProcessed: 0,
      findingsDetected: 0,
      criticalFindingsDetected: 0,
      averageProcessingTime: 0,
      radiologistAgreementRate: 0,
      potentialMissesCaught: 0,  // Key ROI metric
      estimatedTimeSaved: 0  // seconds
    };

    // Get all analyses for this practice
    const analyses = await prisma.aiAnalysis.findMany({
      where: {
        practiceId,
        createdAt: dateFilter
      },
      include: {
        feedback: true
      }
    });

    stats.totalStudiesProcessed = analyses.length;

    // Calculate metrics
    let totalProcessingTime = 0;
    let criticalFindings = 0;
    let totalFindings = 0;
    let agreements = 0;
    let totalFeedback = 0;

    for (const analysis of analyses) {
      totalProcessingTime += analysis.processingTime || 0;
      totalFindings += analysis.findings?.length || 0;

      // Count critical findings
      const hasCritical = analysis.findings?.some((f: any) =>
        (f.pathology === 'Pneumothorax' || f.pathology === 'Pneumonia') &&
        f.probability > 0.7
      );
      if (hasCritical) criticalFindings++;

      // Count agreements
      if (analysis.feedback) {
        totalFeedback++;
        if (analysis.feedback.radiologistAgreement === 'agree') {
          agreements++;
        }
      }
    }

    stats.findingsDetected = totalFindings;
    stats.criticalFindingsDetected = criticalFindings;
    stats.averageProcessingTime = totalProcessingTime / analyses.length;
    stats.radiologistAgreementRate = totalFeedback > 0 ? agreements / totalFeedback : 0;

    // Estimate potential misses caught
    // Conservative estimate: 30% of high-confidence findings might have been missed
    const highConfidenceFindings = totalFindings * 0.3;  // Assuming 30% are high confidence
    stats.potentialMissesCaught = Math.round(highConfidenceFindings * 0.3);

    // Estimate time saved
    // Assume AI saves 15 seconds per read on average
    stats.estimatedTimeSaved = analyses.length * 15;

    return stats;
  }

  /**
   * Get trending pathologies for a practice
   *
   * Helps identify patterns in patient population
   */
  async getTrendingPathologies(practiceId: string): Promise<Array<{
    pathology: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>> {
    // Compare last 7 days vs previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recent = await this.getPathologyCounts(practiceId, sevenDaysAgo, now);
    const previous = await this.getPathologyCounts(practiceId, fourteenDaysAgo, sevenDaysAgo);

    const trending = [];

    for (const pathology in recent) {
      const recentCount = recent[pathology];
      const previousCount = previous[pathology] || 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentCount > previousCount * 1.2) trend = 'up';
      else if (recentCount < previousCount * 0.8) trend = 'down';

      trending.push({
        pathology,
        count: recentCount,
        trend
      });
    }

    // Sort by count descending
    trending.sort((a, b) => b.count - a.count);

    return trending;
  }

  private async getPathologyCounts(
    practiceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const feedback = await prisma.aiRadiologistFeedback.findMany({
      where: {
        practiceId,
        radiologistAgreement: 'agree',  // Only count confirmed findings
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const counts: Record<string, number> = {};
    for (const record of feedback) {
      counts[record.pathology] = (counts[record.pathology] || 0) + 1;
    }

    return counts;
  }

  // Helper methods

  private getDateFilter(timeRange: 'week' | 'month' | 'quarter' | 'all'): any {
    const now = new Date();

    switch (timeRange) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { gte: weekAgo };

      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { gte: monthAgo };

      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return { gte: quarterAgo };

      case 'all':
      default:
        return undefined;  // No filter
    }
  }

  private getEmptyMetrics(pathology: string, timeRange: string): PerformanceMetrics {
    return {
      pathology,
      timeRange: timeRange as any,
      totalCases: 0,
      agreementRate: 0,
      disagreementRate: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      averageConfidence: 0,
      isDriftDetected: false
    };
  }

  private async sendSlackAlert(params: { channel: string; message: string }): Promise<void> {
    // Implement Slack webhook
    // For now, just log
    console.log(`[SLACK ${params.channel}] ${params.message}`);

    // In production:
    // await fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   body: JSON.stringify({ text: params.message, channel: params.channel })
    // });
  }

  private async updateAccuracyMetrics(feedback: RadiologistFeedback): Promise<void> {
    // Update rolling accuracy metrics
    // This could be a separate table for fast dashboard queries
    try {
      await prisma.performanceMetrics.upsert({
        where: {
          pathology_date: {
            pathology: feedback.aiFinding.pathology,
            date: new Date().toISOString().split('T')[0]  // Today's date
          }
        },
        update: {
          totalCases: { increment: 1 },
          agreements: feedback.radiologistAgreement === 'agree' ? { increment: 1 } : undefined,
          disagreements: feedback.radiologistAgreement === 'disagree' ? { increment: 1 } : undefined
        },
        create: {
          pathology: feedback.aiFinding.pathology,
          date: new Date().toISOString().split('T')[0],
          totalCases: 1,
          agreements: feedback.radiologistAgreement === 'agree' ? 1 : 0,
          disagreements: feedback.radiologistAgreement === 'disagree' ? 1 : 0
        }
      });
    } catch (error) {
      console.error('Error updating accuracy metrics:', error);
    }
  }
}

export default new RadiologistFeedbackService();
