/**
 * FDA Compliance Service
 * Tracks regulatory submissions, clinical trials, and compliance status
 * Supports FDA 510(k), De Novo, and Breakthrough Device pathways
 */

import logger from '../../utils/logger';

export interface RegulatorySubmission {
  submissionId: string;
  submissionType: '510(k)' | 'De Novo' | 'PMA' | 'Breakthrough Device';
  deviceName: string;
  deviceClassification: 'Class I' | 'Class II' | 'Class III';
  productCode: string;
  status: 'draft' | 'submitted' | 'under_review' | 'additional_info_requested' | 'approved' | 'rejected';
  submissionDate?: Date;
  targetDecisionDate?: Date;
  actualDecisionDate?: Date;
  fdaReviewerName?: string;
  documents: RegulatoryDocument[];
  milestones: ComplianceMilestone[];
}

export interface RegulatoryDocument {
  documentId: string;
  documentType:
    | '510(k) Summary'
    | 'Indications for Use'
    | 'Substantial Equivalence'
    | 'Performance Testing'
    | 'Clinical Data'
    | 'Software Documentation'
    | 'Labeling'
    | 'Quality System'
    | 'Risk Analysis';
  fileName: string;
  version: string;
  uploadDate: Date;
  status: 'draft' | 'under_review' | 'approved' | 'rejected';
  reviewerComments?: string;
}

export interface ComplianceMilestone {
  milestoneId: string;
  milestoneName: string;
  description: string;
  targetDate: Date;
  completionDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number; // 0-100
  assignedTo?: string;
}

export interface ClinicalTrial {
  trialId: string;
  nctNumber?: string; // ClinicalTrials.gov identifier
  trialName: string;
  phase: 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV';
  status: 'planning' | 'recruiting' | 'active' | 'completed' | 'terminated';
  studyType: 'interventional' | 'observational';
  primaryEndpoint: string;
  secondaryEndpoints: string[];
  enrollmentTarget: number;
  enrollmentCurrent: number;
  startDate?: Date;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  principalInvestigator: string;
  site: string;
  results?: TrialResults;
}

export interface TrialResults {
  primaryOutcome: {
    met: boolean;
    pValue: number;
    description: string;
  };
  secondaryOutcomes: Array<{
    outcome: string;
    met: boolean;
    pValue: number;
  }>;
  adverseEvents: AdverseEvent[];
  publicationDate?: Date;
  publicationDOI?: string;
}

export interface AdverseEvent {
  eventId: string;
  eventType: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reportDate: Date;
  patientId: string;
  description: string;
  resolution: 'resolved' | 'ongoing' | 'permanent_damage' | 'death';
  reportedToFDA: boolean;
  fdaReportNumber?: string;
}

export interface QualitySystemCompliance {
  lastAuditDate: Date;
  nextAuditDate: Date;
  complianceScore: number; // 0-100
  nonConformances: NonConformance[];
  capaActions: CAPAAction[];
  iso13485Certified: boolean;
  iso13485CertificationDate?: Date;
  iso13485ExpirationDate?: Date;
}

export interface NonConformance {
  ncId: string;
  category: 'design' | 'manufacturing' | 'testing' | 'documentation' | 'training';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  identifiedDate: Date;
  dueDate: Date;
  status: 'open' | 'in_progress' | 'closed';
  assignedTo: string;
}

export interface CAPAAction {
  capaId: string;
  type: 'corrective' | 'preventive';
  description: string;
  rootCause: string;
  action: string;
  initiationDate: Date;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  status: 'open' | 'in_progress' | 'verification' | 'closed';
  effectiveness?: 'effective' | 'ineffective' | 'pending';
}

class FDAComplianceService {
  private isInitialized = false;

  /**
   * Initialize FDA Compliance Service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('📋 Initializing FDA Compliance Service...');

      // In production, connect to regulatory database and document management system
      this.isInitialized = true;

      logger.info('✅ FDA Compliance Service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize FDA Compliance Service:', error);
      throw error;
    }
  }

  /**
   * Get current regulatory submission status
   */
  async getRegulatoryStatus(): Promise<RegulatorySubmission> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // In production, fetch from regulatory database
      // Mock comprehensive 510(k) submission
      const submission: RegulatorySubmission = {
        submissionId: 'K243857',
        submissionType: '510(k)',
        deviceName: 'MediMind AI Health Prediction System',
        deviceClassification: 'Class II',
        productCode: 'DQK', // Medical Device Data System
        status: 'under_review',
        submissionDate: new Date(2024, 8, 15), // Sept 15, 2024
        targetDecisionDate: new Date(2025, 2, 15), // March 15, 2025
        fdaReviewerName: 'Dr. Sarah Chen, PhD',
        documents: [
          {
            documentId: 'DOC-001',
            documentType: '510(k) Summary',
            fileName: 'MediMind_510k_Summary_v2.1.pdf',
            version: '2.1',
            uploadDate: new Date(2024, 8, 1),
            status: 'approved',
          },
          {
            documentId: 'DOC-002',
            documentType: 'Indications for Use',
            fileName: 'Indications_for_Use_Statement_v1.5.pdf',
            version: '1.5',
            uploadDate: new Date(2024, 8, 5),
            status: 'approved',
          },
          {
            documentId: 'DOC-003',
            documentType: 'Substantial Equivalence',
            fileName: 'Substantial_Equivalence_Comparison_v2.0.pdf',
            version: '2.0',
            uploadDate: new Date(2024, 8, 8),
            status: 'approved',
          },
          {
            documentId: 'DOC-004',
            documentType: 'Performance Testing',
            fileName: 'Performance_Validation_Report_v3.2.pdf',
            version: '3.2',
            uploadDate: new Date(2024, 8, 10),
            status: 'under_review',
            reviewerComments: 'Request additional data on LSTM model validation with diverse patient populations',
          },
          {
            documentId: 'DOC-005',
            documentType: 'Clinical Data',
            fileName: 'Clinical_Validation_Study_Results_v2.0.pdf',
            version: '2.0',
            uploadDate: new Date(2024, 8, 12),
            status: 'under_review',
          },
          {
            documentId: 'DOC-006',
            documentType: 'Software Documentation',
            fileName: 'Software_Validation_v4.0.pdf',
            version: '4.0',
            uploadDate: new Date(2024, 8, 13),
            status: 'approved',
          },
          {
            documentId: 'DOC-007',
            documentType: 'Risk Analysis',
            fileName: 'Risk_Management_ISO14971_v2.5.pdf',
            version: '2.5',
            uploadDate: new Date(2024, 8, 14),
            status: 'approved',
          },
        ],
        milestones: [
          {
            milestoneId: 'M-001',
            milestoneName: '510(k) Submission Package Assembly',
            description: 'Compile all required documentation for FDA 510(k) submission',
            targetDate: new Date(2024, 8, 1),
            completionDate: new Date(2024, 8, 15),
            status: 'completed',
            progress: 100,
          },
          {
            milestoneId: 'M-002',
            milestoneName: 'FDA Administrative Review',
            description: 'FDA review for completeness and acceptance',
            targetDate: new Date(2024, 9, 1),
            completionDate: new Date(2024, 9, 3),
            status: 'completed',
            progress: 100,
          },
          {
            milestoneId: 'M-003',
            milestoneName: 'FDA Substantive Review',
            description: 'In-depth technical and clinical review by FDA',
            targetDate: new Date(2024, 11, 15),
            status: 'in_progress',
            progress: 65,
            assignedTo: 'Dr. Sarah Chen',
          },
          {
            milestoneId: 'M-004',
            milestoneName: 'Additional Information Response',
            description: 'Respond to FDA requests for additional data',
            targetDate: new Date(2025, 0, 15),
            status: 'in_progress',
            progress: 40,
          },
          {
            milestoneId: 'M-005',
            milestoneName: 'Final FDA Decision',
            description: 'FDA clearance or denial decision',
            targetDate: new Date(2025, 2, 15),
            status: 'not_started',
            progress: 0,
          },
        ],
      };

      return submission;
    } catch (error) {
      logger.error('Failed to get regulatory status:', error);
      throw error;
    }
  }

  /**
   * Get clinical trial status
   */
  async getClinicalTrialStatus(): Promise<ClinicalTrial> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Mock clinical trial data
      const trial: ClinicalTrial = {
        trialId: 'TRIAL-001',
        nctNumber: 'NCT05429871',
        trialName: 'MediMind AI Cardiovascular Risk Prediction Validation Study',
        phase: 'Phase III',
        status: 'active',
        studyType: 'interventional',
        primaryEndpoint: 'Accuracy of 3-year cardiovascular risk prediction compared to Framingham Risk Score',
        secondaryEndpoints: [
          'Sensitivity and specificity of AI predictions',
          'Time to clinical event detection',
          'User adherence to AI recommendations',
          'Cost-effectiveness vs. standard care',
        ],
        enrollmentTarget: 1500,
        enrollmentCurrent: 1247,
        startDate: new Date(2023, 5, 1),
        estimatedCompletionDate: new Date(2025, 11, 31),
        principalInvestigator: 'Dr. Michael Anderson, MD, PhD',
        site: 'Stanford University Medical Center + 12 satellite sites',
        results: {
          primaryOutcome: {
            met: true,
            pValue: 0.0023,
            description:
              'AI predictions demonstrated 15% improvement in accuracy over Framingham (AUC 0.89 vs 0.74, p=0.0023)',
          },
          secondaryOutcomes: [
            { outcome: 'Sensitivity', met: true, pValue: 0.0041 },
            { outcome: 'Specificity', met: true, pValue: 0.0089 },
            { outcome: 'Time to detection', met: true, pValue: 0.0012 },
            { outcome: 'Cost-effectiveness', met: true, pValue: 0.031 },
          ],
          adverseEvents: [
            {
              eventId: 'AE-001',
              eventType: 'Anxiety from health predictions',
              severity: 'mild',
              reportDate: new Date(2024, 3, 15),
              patientId: 'PT-0453',
              description: 'Patient reported increased anxiety after receiving high-risk prediction',
              resolution: 'resolved',
              reportedToFDA: false,
            },
          ],
          publicationDate: new Date(2025, 1, 1),
          publicationDOI: '10.1001/jama.2025.0134',
        },
      };

      return trial;
    } catch (error) {
      logger.error('Failed to get clinical trial status:', error);
      throw error;
    }
  }

  /**
   * Get quality system compliance status
   */
  async getQualitySystemCompliance(): Promise<QualitySystemCompliance> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Mock quality system data
      const qsCompliance: QualitySystemCompliance = {
        lastAuditDate: new Date(2024, 8, 1),
        nextAuditDate: new Date(2025, 2, 1),
        complianceScore: 94,
        nonConformances: [
          {
            ncId: 'NC-2024-003',
            category: 'documentation',
            severity: 'minor',
            description: 'Software version control documentation incomplete for release 2.3.1',
            identifiedDate: new Date(2024, 9, 15),
            dueDate: new Date(2024, 11, 1),
            status: 'in_progress',
            assignedTo: 'Engineering Team',
          },
          {
            ncId: 'NC-2024-002',
            category: 'testing',
            severity: 'major',
            description: 'Validation testing incomplete for edge case scenarios in diabetes prediction',
            identifiedDate: new Date(2024, 8, 20),
            dueDate: new Date(2024, 10, 15),
            status: 'closed',
            assignedTo: 'QA Team',
          },
        ],
        capaActions: [
          {
            capaId: 'CAPA-2024-005',
            type: 'corrective',
            description: 'Improve software documentation process',
            rootCause: 'Insufficient review checklist for software releases',
            action: 'Implement automated documentation verification in CI/CD pipeline',
            initiationDate: new Date(2024, 9, 16),
            targetCompletionDate: new Date(2024, 11, 1),
            status: 'in_progress',
          },
          {
            capaId: 'CAPA-2024-004',
            type: 'preventive',
            description: 'Enhance edge case testing coverage',
            rootCause: 'Limited test case diversity in validation protocol',
            action: 'Expand test dataset with synthetic edge cases and rare scenarios',
            initiationDate: new Date(2024, 8, 21),
            targetCompletionDate: new Date(2024, 10, 15),
            actualCompletionDate: new Date(2024, 10, 12),
            status: 'closed',
            effectiveness: 'effective',
          },
        ],
        iso13485Certified: true,
        iso13485CertificationDate: new Date(2023, 2, 15),
        iso13485ExpirationDate: new Date(2026, 2, 15),
      };

      return qsCompliance;
    } catch (error) {
      logger.error('Failed to get quality system compliance:', error);
      throw error;
    }
  }

  /**
   * Calculate overall compliance readiness score
   */
  calculateComplianceReadiness(
    submission: RegulatorySubmission,
    trial: ClinicalTrial,
    qsCompliance: QualitySystemCompliance
  ): {
    overallScore: number;
    submissionReadiness: number;
    clinicalReadiness: number;
    qualitySystemReadiness: number;
    recommendation: string;
  } {
    // Submission readiness (40% weight)
    const approvedDocs = submission.documents.filter((d) => d.status === 'approved').length;
    const submissionReadiness = (approvedDocs / submission.documents.length) * 100;

    // Clinical readiness (30% weight)
    const enrollmentProgress = (trial.enrollmentCurrent / trial.enrollmentTarget) * 100;
    const clinicalReadiness = enrollmentProgress;

    // Quality system readiness (30% weight)
    const qualitySystemReadiness = qsCompliance.complianceScore;

    // Overall weighted score
    const overallScore =
      submissionReadiness * 0.4 + clinicalReadiness * 0.3 + qualitySystemReadiness * 0.3;

    let recommendation = '';
    if (overallScore >= 90) {
      recommendation = 'Ready for FDA submission. All requirements met.';
    } else if (overallScore >= 75) {
      recommendation = 'Nearly ready. Address remaining document reviews and quality issues.';
    } else if (overallScore >= 60) {
      recommendation = 'Significant work remaining. Focus on clinical trial enrollment and documentation.';
    } else {
      recommendation =
        'Not ready for submission. Major gaps in documentation, clinical data, or quality systems.';
    }

    return {
      overallScore: Math.round(overallScore),
      submissionReadiness: Math.round(submissionReadiness),
      clinicalReadiness: Math.round(clinicalReadiness),
      qualitySystemReadiness: Math.round(qualitySystemReadiness),
      recommendation,
    };
  }

  /**
   * Generate FDA submission timeline
   */
  generateSubmissionTimeline(): Array<{
    phase: string;
    duration: string;
    status: 'completed' | 'current' | 'upcoming';
  }> {
    return [
      { phase: 'Pre-submission Meeting', duration: '1-2 months', status: 'completed' },
      { phase: 'Document Preparation', duration: '3-6 months', status: 'completed' },
      { phase: '510(k) Submission', duration: '1 week', status: 'completed' },
      { phase: 'FDA Administrative Review', duration: '15 days', status: 'completed' },
      { phase: 'FDA Substantive Review', duration: '60-90 days', status: 'current' },
      { phase: 'Additional Information (if needed)', duration: '30-60 days', status: 'upcoming' },
      { phase: 'Final FDA Decision', duration: '15 days', status: 'upcoming' },
      { phase: 'Market Launch Preparation', duration: '30 days', status: 'upcoming' },
    ];
  }
}

export default new FDAComplianceService();
