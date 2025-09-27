const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { ElectronicDataCapture } = require('./ElectronicDataCapture');
const { RegulatoryComplianceManager } = require('./RegulatoryComplianceManager');
const { StatisticalAnalysisEngine } = require('./StatisticalAnalysisEngine');
const { QualityAssuranceSystem } = require('./QualityAssuranceSystem');

class ClinicalResearchPlatform extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            dataDir: path.join(process.cwd(), 'data', 'clinical'),
            ...config
        };
        
        this.studies = new Map();
        this.participants = new Map();
        this.dataCapture = new ElectronicDataCapture();
        this.regulatoryCompliance = new RegulatoryComplianceManager();
        this.statisticalAnalysis = new StatisticalAnalysisEngine();
        this.qualityAssurance = new QualityAssuranceSystem();
        
        // Ensure data directory exists
        fs.mkdir(this.config.dataDir, { recursive: true })
            .catch(err => console.error('Failed to create data directory:', err));
    }
    
    async initialize() {
        try {
            await this.dataCapture.initialize();
            await this.regulatoryCompliance.initialize();
            await this.statisticalAnalysis.initialize();
            await this.qualityAssurance.initialize();
            
            console.log('Clinical Research Platform initialized');
            this.emit('initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Clinical Research Platform:', error);
            throw error;
        }
    }
    
    async createClinicalStudy(studyProtocol) {
        const studyId = this.generateStudyId();
        
        const study = {
            id: studyId,
            protocol: studyProtocol,
            status: 'design',
            phase: studyProtocol.phase,
            primaryEndpoints: studyProtocol.primaryEndpoints || [],
            secondaryEndpoints: studyProtocol.secondaryEndpoints || [],
            inclusionCriteria: studyProtocol.inclusionCriteria || [],
            exclusionCriteria: studyProtocol.exclusionCriteria || [],
            targetEnrollment: studyProtocol.targetEnrollment || 0,
            currentEnrollment: 0,
            sites: studyProtocol.sites || [],
            participants: new Map(),
            dataPoints: new Map(),
            adverse_events: [],
            protocol_deviations: [],
            created_at: new Date(),
            regulatory_submissions: [],
            monitoring_visits: [],
            data_management_plan: studyProtocol.dataManagementPlan || {},
            statistical_analysis_plan: studyProtocol.statisticalAnalysisPlan || {}
        };
        
        this.studies.set(studyId, study);
        
        // Initialize regulatory tracking
        await this.regulatoryCompliance.initializeStudyCompliance(study);
        
        // Setup quality assurance monitoring
        await this.qualityAssurance.setupStudyMonitoring(study);
        
        // Save study data
        await this.saveStudyData(studyId, study);
        
        this.emit('studyCreated', study);
        
        return study;
    }
    
    async enrollParticipant(studyId, participantData, consentData) {
        const study = this.studies.get(studyId);
        if (!study) throw new Error('Study not found');
        
        if (study.currentEnrollment >= study.targetEnrollment) {
            throw new Error('Study enrollment is complete');
        }
        
        // Check eligibility
        const eligibilityResult = await this.checkEligibility(study, participantData);
        if (!eligibilityResult.eligible) {
            throw new Error(`Participant not eligible: ${eligibilityResult.reason}`);
        }
        
        // Generate participant ID
        const participantId = this.generateParticipantId(studyId);
        
        const participant = {
            id: participantId,
            studyId: studyId,
            anonymizedId: this.generateAnonymizedId(),
            enrollmentDate: new Date(),
            status: 'enrolled',
            demographics: this.anonymizeDemographics(participantData.demographics),
            medicalHistory: participantData.medicalHistory || {},
            consentVersion: consentData.version,
            consentDate: consentData.date,
            consentStatus: 'active',
            visitSchedule: this.generateVisitSchedule(study.protocol.visitSchedule || []),
            dataPoints: new Map(),
            adverseEvents: [],
            protocolDeviations: [],
            withdrawalReason: null,
            withdrawalDate: null
        };
        
        // Store participant data
        this.participants.set(participantId, participant);
        study.participants.set(participantId, participant);
        study.currentEnrollment++;
        
        // Initialize EDC for participant
        await this.dataCapture.initializeParticipant(participant);
        
        // Save updated study data
        await this.saveStudyData(studyId, study);
        
        this.emit('participantEnrolled', { study, participant });
        
        return participant;
    }
    
    async captureDataPoint(participantId, visitId, formData, sourceDocuments = []) {
        const participant = this.participants.get(participantId);
        if (!participant) throw new Error('Participant not found');
        
        const study = this.studies.get(participant.studyId);
        if (!study) throw new Error('Study not found for participant');
        
        const dataPoint = {
            id: crypto.randomUUID(),
            participantId: participantId,
            visitId: visitId,
            captureDate: new Date(),
            data: formData,
            sourceDocuments: sourceDocuments,
            queries: [],
            locked: false,
            verified: false,
            monitored: false,
            auditTrail: [{
                action: 'created',
                user: 'system',
                timestamp: new Date(),
                changes: formData
            }]
        };
        
        // Store in EDC
        await this.dataCapture.storeDataPoint(dataPoint);
        
        // Add to participant's data
        participant.dataPoints.set(dataPoint.id, dataPoint);
        
        // Quality checks
        const qualityIssues = await this.qualityAssurance.validateDataPoint(dataPoint);
        if (qualityIssues.length > 0) {
            this.emit('dataQualityIssue', { dataPoint, issues: qualityIssues });
        }
        
        this.emit('dataPointCaptured', dataPoint);
        
        // Save updated study data
        await this.saveStudyData(study.id, study);
        
        return dataPoint;
    }
    
    async recordAdverseEvent(participantId, adverseEventData) {
        const participant = this.participants.get(participantId);
        if (!participant) throw new Error('Participant not found');
        
        const study = this.studies.get(participant.studyId);
        if (!study) throw new Error('Study not found for participant');
        
        const adverseEvent = {
            id: crypto.randomUUID(),
            participantId: participantId,
            description: adverseEventData.description,
            severity: adverseEventData.severity, // mild, moderate, severe
            causality: adverseEventData.causality, // unrelated, unlikely, possible, probable, definite
            seriousness: adverseEventData.seriousness || [],
            onset_date: adverseEventData.onsetDate,
            resolution_date: adverseEventData.resolutionDate,
            outcome: adverseEventData.outcome,
            action_taken: adverseEventData.actionTaken,
            reported_date: new Date(),
            reporter: adverseEventData.reporter || 'system',
            follow_up_required: adverseEventData.followUpRequired || false,
            regulatory_reporting_required: this.assessRegulatoryReporting(adverseEventData),
            meddra_code: adverseEventData.meddraCode
        };
        
        participant.adverseEvents.push(adverseEvent);
        study.adverse_events.push(adverseEvent);
        
        // Check if regulatory reporting is required
        if (adverseEvent.regulatory_reporting_required) {
            await this.regulatoryCompliance.reportAdverseEvent(adverseEvent, study);
        }
        
        // Update safety monitoring
        await this.updateSafetyMonitoring(study, adverseEvent);
        
        // Save updated study data
        await this.saveStudyData(study.id, study);
        
        this.emit('adverseEventRecorded', adverseEvent);
        
        return adverseEvent;
    }
    
    // Helper methods
    generateStudyId() {
        return `MED-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
    
    generateParticipantId(studyId) {
        return `${studyId}-P${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    }
    
    generateAnonymizedId() {
        return crypto.randomBytes(8).toString('hex').toUpperCase();
    }
    
    anonymizeDemographics(demographics) {
        if (!demographics) return {};
        
        // Remove or hash personally identifiable information
        return {
            age: demographics.age,
            gender: demographics.gender,
            race: demographics.race,
            ethnicity: demographics.ethnicity,
            weight: demographics.weight,
            height: demographics.height,
            // Remove name, address, phone, etc.
        };
    }
    
    generateVisitSchedule(protocolSchedule) {
        return protocolSchedule.map(visit => ({
            visitId: visit.id,
            visitName: visit.name,
            plannedDate: null,
            actualDate: null,
            window: visit.window,
            status: 'scheduled',
            forms: (visit.forms || []).map(form => ({
                formId: form.id,
                formName: form.name,
                status: 'pending',
                completedDate: null
            }))
        }));
    }
    
    async checkEligibility(study, participantData) {
        const { inclusionCriteria = [], exclusionCriteria = [] } = study;
        
        // Check inclusion criteria
        for (const criterion of inclusionCriteria) {
            if (!this.evaluateCriterion(criterion, participantData)) {
                return {
                    eligible: false,
                    reason: `Does not meet inclusion criterion: ${criterion.description || 'Unknown'}`
                };
            }
        }
        
        // Check exclusion criteria
        for (const criterion of exclusionCriteria) {
            if (this.evaluateCriterion(criterion, participantData)) {
                return {
                    eligible: false,
                    reason: `Meets exclusion criterion: ${criterion.description || 'Unknown'}`
                };
            }
        }
        
        return { eligible: true, reason: 'All criteria met' };
    }
    
    evaluateCriterion(criterion, participantData) {
        if (!criterion || !criterion.type) return false;
        
        switch (criterion.type) {
            case 'age_range':
                const age = participantData.demographics?.age;
                return age !== undefined && age >= criterion.min && age <= criterion.max;
            
            case 'diagnosis':
                return participantData.medicalHistory?.diagnoses?.includes(criterion.icd10Code) || false;
            
            case 'medication':
                return participantData.medicalHistory?.medications?.some(med => 
                    med.name === criterion.medicationName
                ) || false;
            
            case 'lab_value':
                const labValue = participantData.labResults?.[criterion.labTest];
                return labValue !== undefined && this.evaluateNumericCriterion(labValue, criterion);
            
            default:
                return false;
        }
    }
    
    evaluateNumericCriterion(value, criterion) {
        if (value === undefined || value === null) return false;
        
        switch (criterion.operator) {
            case 'gt': return value > criterion.value;
            case 'lt': return value < criterion.value;
            case 'gte': return value >= criterion.value;
            case 'lte': return value <= criterion.value;
            case 'eq': return value === criterion.value;
            case 'between': return value >= criterion.min && value <= criterion.max;
            default: return false;
        }
    }
    
    assessRegulatoryReporting(adverseEventData) {
        if (!adverseEventData) return false;
        
        // Determine if AE requires regulatory reporting (SAE, SUSAR, etc.)
        const isSeriousAdverseEvent = adverseEventData.seriousness && (
            adverseEventData.seriousness.includes('death') ||
            adverseEventData.seriousness.includes('life_threatening') ||
            adverseEventData.seriousness.includes('hospitalization') ||
            adverseEventData.seriousness.includes('disability') ||
            adverseEventData.seriousness.includes('congenital_anomaly') ||
            adverseEventData.seriousness.includes('medically_important')
        );
        
        const isUnexpected = adverseEventData.causality === 'definite' || 
                           adverseEventData.causality === 'probable';
        
        return isSeriousAdverseEvent || isUnexpected;
    }
    
    async updateSafetyMonitoring(study, adverseEvent) {
        // Update study safety profile
        const safetyProfile = await this.calculateSafetyProfile(study);
        
        // Check stopping rules
        const stoppingRuleTriggered = await this.checkStoppingRules(study, safetyProfile);
        
        if (stoppingRuleTriggered) {
            await this.triggerSafetyHold(study, stoppingRuleTriggered);
        }
        
        // Notify DSMB if applicable
        if (study.protocol.dsmbRequired) {
            await this.notifyDSMB(study, adverseEvent, safetyProfile);
        }
        
        return safetyProfile;
    }
    
    async saveStudyData(studyId, studyData) {
        try {
            const filePath = path.join(this.config.dataDir, `study_${studyId}.json`);
            const data = JSON.stringify(studyData, null, 2);
            await fs.writeFile(filePath, data, 'utf8');
            return true;
        } catch (error) {
            console.error('Failed to save study data:', error);
            throw error;
        }
    }
    
    async loadStudyData(studyId) {
        try {
            const filePath = path.join(this.config.dataDir, `study_${studyId}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null; // Study file doesn't exist
            }
            console.error('Failed to load study data:', error);
            throw error;
        }
    }
    
    // Stub methods for future implementation
    async calculateSafetyProfile(study) {
        // TODO: Implement safety profile calculation
        return {
            totalAEs: study.adverse_events.length,
            saes: study.adverse_events.filter(ae => ae.seriousness && ae.seriousness.length > 0).length,
            // Add more safety metrics as needed
        };
    }
    
    async checkStoppingRules(study, safetyProfile) {
        // TODO: Implement stopping rules check
        return null;
    }
    
    async triggerSafetyHold(study, reason) {
        // TODO: Implement safety hold
        console.warn(`SAFETY HOLD TRIGGERED for study ${study.id}: ${reason}`);
        this.emit('safetyHold', { study, reason });
    }
    
    async notifyDSMB(study, adverseEvent, safetyProfile) {
        // TODO: Implement DSMB notification
        console.log('Notifying DSMB:', { studyId: study.id, adverseEventId: adverseEvent.id });
    }
}

module.exports = { ClinicalResearchPlatform };
