import { EventEmitter } from 'events';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface EpidemicReport {
  id?: string;
  userId?: string; // Optional for anonymous reporting
  diseaseCategory: string;
  symptoms: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  region?: string;
  country?: string;
  isAnonymous: boolean;
  severity: 'mild' | 'moderate' | 'severe';
  symptomOnset?: Date;
  reportedAt: Date;
  verified: boolean;
  metadata?: Record<string, any>;
}

interface CommunityAlert {
  id?: string;
  alertType: string;
  diseaseCategory?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  country: string;
  title: string;
  description: string;
  recommendedActions?: string[];
  resources?: Array<{ title: string; url: string; type: string }>;
  affectedCount: number;
  alertStart: Date;
  alertEnd?: Date;
  status: 'active' | 'resolved' | 'expired';
}

interface TrendAnalysis {
  diseaseCategory: string;
  region: string;
  country: string;
  totalReports: number;
  newReportsLast7Days: number;
  newReportsLast24Hours: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  severityDistribution: {
    mild: number;
    moderate: number;
    severe: number;
  };
  affectedAgeGroups?: Record<string, number>;
  geographicHotspots: Array<{
    location: string;
    count: number;
  }>;
}

/**
 * Epidemic Tracking Service
 * Monitors disease trends and generates community alerts
 */
export class EpidemicTrackingService extends EventEmitter {
  private db: any;

  // Disease categories for tracking
  private readonly DISEASE_CATEGORIES = {
    AIDS_HIV: 'AIDS/HIV',
    COVID19: 'COVID-19',
    INFLUENZA: 'Influenza',
    TUBERCULOSIS: 'Tuberculosis',
    MALARIA: 'Malaria',
    DENGUE: 'Dengue',
    EBOLA: 'Ebola',
    MEASLES: 'Measles',
    CHOLERA: 'Cholera',
    MENTAL_HEALTH: 'Mental Health Crisis',
    OTHER: 'Other'
  };

  // Alert thresholds (cases per 100,000 population)
  private readonly ALERT_THRESHOLDS = {
    low: 5,
    medium: 20,
    high: 50,
    critical: 100
  };

  constructor(database: any) {
    super();
    this.db = database;

    // Start automated trend analysis
    this.startAutomatedAnalysis();
  }

  /**
   * Submit epidemic report (can be anonymous)
   */
  async submitReport(report: EpidemicReport): Promise<string> {
    const reportId = uuidv4();

    try {
      await this.db('epidemic_tracking').insert({
        id: reportId,
        user_id: report.isAnonymous ? null : report.userId,
        disease_category: report.diseaseCategory,
        symptoms: JSON.stringify(report.symptoms),
        location: report.location ? `POINT(${report.location.longitude} ${report.location.latitude})` : null,
        region: report.region,
        country: report.country,
        is_anonymous: report.isAnonymous,
        severity: report.severity,
        symptom_onset: report.symptomOnset,
        reported_at: report.reportedAt || new Date(),
        verified: report.verified || false,
        metadata: report.metadata ? JSON.stringify(report.metadata) : null,
        created_at: new Date()
      });

      logger.info(`Epidemic report submitted: ${reportId} (${report.diseaseCategory})`);

      // Emit event for real-time processing
      this.emit('reportSubmitted', {
        reportId,
        diseaseCategory: report.diseaseCategory,
        region: report.region,
        country: report.country,
        severity: report.severity
      });

      // Check if this triggers an alert
      await this.checkForAlertTriggers(report.diseaseCategory, report.region, report.country);

      return reportId;
    } catch (error) {
      logger.error('Error submitting epidemic report:', error);
      throw error;
    }
  }

  /**
   * Get trend analysis for specific disease/region
   */
  async getTrendAnalysis(
    diseaseCategory: string,
    region?: string,
    country?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TrendAnalysis> {
    try {
      let query = this.db('epidemic_tracking')
        .where({ disease_category: diseaseCategory });

      if (region) query = query.where({ region });
      if (country) query = query.where({ country });
      if (startDate) query = query.where('reported_at', '>=', startDate);
      if (endDate) query = query.where('reported_at', '<=', endDate);

      const reports = await query;

      // Calculate trend metrics
      const totalReports = reports.length;

      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const newReportsLast7Days = reports.filter(
        (r: any) => new Date(r.reported_at) >= last7Days
      ).length;

      const newReportsLast24Hours = reports.filter(
        (r: any) => new Date(r.reported_at) >= last24Hours
      ).length;

      // Determine trend
      const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const reportsPrevious7Days = reports.filter(
        (r: any) => new Date(r.reported_at) >= previous7Days && new Date(r.reported_at) < last7Days
      ).length;

      let trend: 'increasing' | 'stable' | 'decreasing';
      if (newReportsLast7Days > reportsPrevious7Days * 1.2) {
        trend = 'increasing';
      } else if (newReportsLast7Days < reportsPrevious7Days * 0.8) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      // Severity distribution
      const severityDistribution = {
        mild: reports.filter((r: any) => r.severity === 'mild').length,
        moderate: reports.filter((r: any) => r.severity === 'moderate').length,
        severe: reports.filter((r: any) => r.severity === 'severe').length
      };

      // Geographic hotspots
      const regionCounts: Record<string, number> = {};
      reports.forEach((r: any) => {
        const loc = r.region || r.country || 'Unknown';
        regionCounts[loc] = (regionCounts[loc] || 0) + 1;
      });

      const geographicHotspots = Object.entries(regionCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        diseaseCategory,
        region: region || 'All',
        country: country || 'All',
        totalReports,
        newReportsLast7Days,
        newReportsLast24Hours,
        trend,
        severityDistribution,
        geographicHotspots
      };
    } catch (error) {
      logger.error('Error getting trend analysis:', error);
      throw error;
    }
  }

  /**
   * Check if new reports trigger an alert
   */
  private async checkForAlertTriggers(
    diseaseCategory: string,
    region: string,
    country: string
  ): Promise<void> {
    try {
      // Get trend analysis
      const trend = await this.getTrendAnalysis(diseaseCategory, region, country);

      // Determine if alert is needed
      let alertSeverity: 'low' | 'medium' | 'high' | 'critical' | null = null;

      if (trend.newReportsLast7Days >= this.ALERT_THRESHOLDS.critical) {
        alertSeverity = 'critical';
      } else if (trend.newReportsLast7Days >= this.ALERT_THRESHOLDS.high) {
        alertSeverity = 'high';
      } else if (trend.newReportsLast7Days >= this.ALERT_THRESHOLDS.medium) {
        alertSeverity = 'medium';
      } else if (trend.newReportsLast7Days >= this.ALERT_THRESHOLDS.low && trend.trend === 'increasing') {
        alertSeverity = 'low';
      }

      if (alertSeverity) {
        // Check if an active alert already exists
        const existingAlert = await this.db('community_alerts')
          .where({
            disease_category: diseaseCategory,
            region,
            country,
            status: 'active'
          })
          .first();

        if (!existingAlert) {
          await this.createAlert({
            alertType: 'epidemic_outbreak',
            diseaseCategory,
            severity: alertSeverity,
            region,
            country,
            title: `${diseaseCategory} Alert in ${region}, ${country}`,
            description: `Increased cases of ${diseaseCategory} detected in your area. ${trend.newReportsLast7Days} cases reported in the last 7 days.`,
            recommendedActions: this.getRecommendedActions(diseaseCategory, alertSeverity),
            resources: this.getResources(diseaseCategory),
            affectedCount: trend.newReportsLast7Days,
            alertStart: new Date(),
            status: 'active'
          });
        }
      }
    } catch (error) {
      logger.error('Error checking for alert triggers:', error);
    }
  }

  /**
   * Create community alert
   */
  async createAlert(alert: CommunityAlert): Promise<string> {
    const alertId = uuidv4();

    try {
      await this.db('community_alerts').insert({
        id: alertId,
        alert_type: alert.alertType,
        disease_category: alert.diseaseCategory,
        severity: alert.severity,
        region: alert.region,
        country: alert.country,
        title: alert.title,
        description: alert.description,
        recommended_actions: alert.recommendedActions ? JSON.stringify(alert.recommendedActions) : null,
        resources: alert.resources ? JSON.stringify(alert.resources) : null,
        affected_count: alert.affectedCount,
        alert_start: alert.alertStart,
        alert_end: alert.alertEnd,
        status: alert.status,
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`Community alert created: ${alertId} (${alert.title})`);

      // Emit event for push notifications
      this.emit('alertCreated', {
        alertId,
        alertType: alert.alertType,
        severity: alert.severity,
        region: alert.region,
        country: alert.country,
        title: alert.title
      });

      return alertId;
    } catch (error) {
      logger.error('Error creating community alert:', error);
      throw error;
    }
  }

  /**
   * Get active alerts for a region
   */
  async getActiveAlerts(region?: string, country?: string, severity?: string): Promise<CommunityAlert[]> {
    try {
      let query = this.db('community_alerts')
        .where({ status: 'active' });

      if (region) query = query.where({ region });
      if (country) query = query.where({ country });
      if (severity) query = query.where({ severity });

      const rows = await query.orderBy('severity', 'desc').orderBy('alert_start', 'desc');

      return rows.map((row: any) => ({
        id: row.id,
        alertType: row.alert_type,
        diseaseCategory: row.disease_category,
        severity: row.severity,
        region: row.region,
        country: row.country,
        title: row.title,
        description: row.description,
        recommendedActions: row.recommended_actions ? JSON.parse(row.recommended_actions) : [],
        resources: row.resources ? JSON.parse(row.resources) : [],
        affectedCount: row.affected_count,
        alertStart: row.alert_start,
        alertEnd: row.alert_end,
        status: row.status
      }));
    } catch (error) {
      logger.error('Error getting active alerts:', error);
      throw error;
    }
  }

  /**
   * Resolve or expire an alert
   */
  async updateAlertStatus(alertId: string, status: 'resolved' | 'expired'): Promise<void> {
    try {
      await this.db('community_alerts')
        .where({ id: alertId })
        .update({
          status,
          alert_end: new Date(),
          updated_at: new Date()
        });

      logger.info(`Alert ${alertId} status updated to ${status}`);

      this.emit('alertUpdated', { alertId, status });
    } catch (error) {
      logger.error('Error updating alert status:', error);
      throw error;
    }
  }

  /**
   * Get recommended actions based on disease and severity
   */
  private getRecommendedActions(diseaseCategory: string, severity: string): string[] {
    const actions: Record<string, string[]> = {
      'AIDS/HIV': [
        'Get tested if you believe you\'ve been exposed',
        'Practice safe sex and use protection',
        'If recently exposed, seek PEP treatment within 72 hours',
        'Do not share needles or personal items that may have blood',
        'Consult healthcare provider for PrEP if high-risk'
      ],
      'COVID-19': [
        'Wear masks in crowded indoor spaces',
        'Maintain social distancing',
        'Get vaccinated and boosted',
        'Wash hands frequently',
        'Stay home if feeling unwell',
        'Get tested if exposed or symptomatic'
      ],
      'Influenza': [
        'Get annual flu vaccine',
        'Practice good hand hygiene',
        'Cover coughs and sneezes',
        'Stay home when sick',
        'Clean frequently touched surfaces'
      ],
      'Mental Health Crisis': [
        'Reach out to mental health helplines',
        'Connect with support groups',
        'Seek professional counseling',
        'Practice self-care and stress management',
        'If in crisis, call emergency services or suicide hotline'
      ]
    };

    return actions[diseaseCategory] || [
      'Monitor your symptoms',
      'Seek medical attention if symptoms worsen',
      'Follow local health authority guidelines',
      'Maintain good hygiene practices'
    ];
  }

  /**
   * Get resources based on disease category
   */
  private getResources(diseaseCategory: string): Array<{ title: string; url: string; type: string }> {
    const resources: Record<string, Array<{ title: string; url: string; type: string }>> = {
      'AIDS/HIV': [
        { title: 'UNAIDS Information', url: 'https://www.unaids.org', type: 'website' },
        { title: 'CDC HIV/AIDS', url: 'https://www.cdc.gov/hiv', type: 'website' },
        { title: 'HIV Testing Locations', url: 'https://gettested.cdc.gov', type: 'tool' }
      ],
      'COVID-19': [
        { title: 'WHO COVID-19', url: 'https://www.who.int/health-topics/coronavirus', type: 'website' },
        { title: 'CDC COVID-19', url: 'https://www.cdc.gov/coronavirus', type: 'website' },
        { title: 'Vaccine Finder', url: 'https://www.vaccines.gov', type: 'tool' }
      ],
      'Mental Health Crisis': [
        { title: '988 Suicide & Crisis Lifeline', url: 'tel:988', type: 'hotline' },
        { title: 'Crisis Text Line', url: 'sms:741741', type: 'hotline' },
        { title: 'NAMI Support', url: 'https://www.nami.org', type: 'website' }
      ]
    };

    return resources[diseaseCategory] || [];
  }

  /**
   * Start automated trend analysis (runs periodically)
   */
  private startAutomatedAnalysis(): void {
    // Run every hour
    setInterval(async () => {
      try {
        logger.info('Running automated epidemic trend analysis...');

        // Analyze each disease category
        for (const category of Object.values(this.DISEASE_CATEGORIES)) {
          const trend = await this.getTrendAnalysis(category);

          // Auto-resolve alerts if trend is decreasing
          if (trend.trend === 'decreasing' && trend.newReportsLast7Days < this.ALERT_THRESHOLDS.low) {
            const activeAlerts = await this.db('community_alerts')
              .where({
                disease_category: category,
                status: 'active'
              });

            for (const alert of activeAlerts) {
              await this.updateAlertStatus(alert.id, 'resolved');
            }
          }
        }
      } catch (error) {
        logger.error('Error in automated trend analysis:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get epidemic statistics for dashboard
   */
  async getStatistics(region?: string, country?: string): Promise<any> {
    try {
      let query = this.db('epidemic_tracking');

      if (region) query = query.where({ region });
      if (country) query = query.where({ country });

      const reports = await query;

      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        totalReports: reports.length,
        reportsLast7Days: reports.filter((r: any) => new Date(r.reported_at) >= last7Days).length,
        byDiseaseCategory: {} as Record<string, number>,
        bySeverity: {
          mild: 0,
          moderate: 0,
          severe: 0
        },
        byRegion: {} as Record<string, number>,
        activeAlerts: await this.getActiveAlerts(region, country)
      };

      // Count by disease category
      reports.forEach((r: any) => {
        stats.byDiseaseCategory[r.disease_category] = (stats.byDiseaseCategory[r.disease_category] || 0) + 1;
        stats.bySeverity[r.severity as 'mild' | 'moderate' | 'severe']++;

        const regionKey = r.region || 'Unknown';
        stats.byRegion[regionKey] = (stats.byRegion[regionKey] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting epidemic statistics:', error);
      throw error;
    }
  }
}

export default EpidemicTrackingService;
