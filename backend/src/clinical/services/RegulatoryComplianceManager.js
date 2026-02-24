const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger').default;
const { ElectronicDataCapture } = require('./ElectronicDataCapture');

class RegulatoryComplianceManager extends EventEmitter {
    constructor(edc, config = {}) {
        super();
        this.edc = edc;
        this.config = {
            dataDir: path.join(process.cwd(), 'data', 'regulatory'),
            ...config
        };
        
        this.regulations = new Map();
        this.documents = new Map();
        this.audits = [];
        this.complianceChecks = new Map();
        
        // Ensure data directory exists
        fs.mkdir(this.config.dataDir, { recursive: true })
            .catch(err => logger.error('Failed to create regulatory data directory', {
                service: 'regulatory-compliance',
                dataDir: this.config.dataDir,
                error: err.message
            }));
    }
    
    async initialize() {
        try {
            await this.loadRegulations();
            await this.loadComplianceChecks();
            await this.loadDocuments();
            logger.info('Regulatory Compliance Manager initialized', {
                service: 'regulatory-compliance',
                regulationsCount: this.regulations.size,
                complianceChecksCount: this.complianceChecks.size
            });
            return true;
        } catch (error) {
            logger.error('Failed to initialize Regulatory Compliance Manager', {
                service: 'regulatory-compliance',
                error: error.message
            });
            throw error;
        }
    }
    
    async loadRegulations() {
        // In a real system, this would load from a database or configuration
        const regulations = [
            {
                id: 'gcp',
                name: 'ICH GCP E6 (R2)',
                version: 'R2',
                description: 'International Council for Harmonisation Good Clinical Practice',
                effectiveDate: '2016-11-30',
                requirements: [
                    '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '2.10',
                    '3.1', '3.2', '3.3', '3.4', '3.5', '3.6',
                    '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9',
                    '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8',
                    '6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8',
                    '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7',
                    '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7'
                ]
            },
            {
                id: 'hipaa',
                name: 'HIPAA',
                version: '2013',
                description: 'Health Insurance Portability and Accountability Act',
                effectiveDate: '2013-03-26',
                requirements: [
                    'privacy_rule', 'security_rule', 'breach_notification_rule', 'enforcement_rule'
                ]
            },
            {
                id: 'gdpr',
                name: 'GDPR',
                version: '2016/679',
                description: 'General Data Protection Regulation',
                effectiveDate: '2018-05-25',
                requirements: [
                    'article_5', 'article_6', 'article_7', 'article_8', 'article_9', 'article_10',
                    'article_12', 'article_13', 'article_14', 'article_15', 'article_16', 'article_17',
                    'article_18', 'article_19', 'article_20', 'article_21', 'article_22', 'article_23',
                    'article_24', 'article_25', 'article_26', 'article_27', 'article_28', 'article_29',
                    'article_30', 'article_31', 'article_32', 'article_33', 'article_34', 'article_35',
                    'article_36', 'article_37', 'article_38', 'article_39', 'article_40', 'article_41',
                    'article_42', 'article_43', 'article_44', 'article_45', 'article_46', 'article_47',
                    'article_48', 'article_49', 'article_50', 'article_51', 'article_52', 'article_53',
                    'article_54', 'article_55', 'article_56', 'article_57', 'article_58', 'article_59',
                    'article_60', 'article_61', 'article_62', 'article_63', 'article_64', 'article_65',
                    'article_66', 'article_67', 'article_68', 'article_69', 'article_70', 'article_71',
                    'article_72', 'article_73', 'article_74', 'article_75', 'article_76', 'article_77',
                    'article_78', 'article_79', 'article_80', 'article_81', 'article_82', 'article_83',
                    'article_84', 'article_85', 'article_86', 'article_87', 'article_88', 'article_89',
                    'article_90', 'article_91', 'article_92', 'article_93', 'article_94', 'article_95',
                    'article_96', 'article_97', 'article_98', 'article_99'
                ]
            },
            {
                id: '21cfr11',
                name: '21 CFR Part 11',
                version: '2003',
                description: 'Electronic Records; Electronic Signatures',
                effectiveDate: '2003-08-20',
                requirements: [
                    '11.10', '11.30', '11.50', '11.70', '11.100', '11.200', '11.300'
                ]
            },
            {
                id: 'fda_1572',
                name: 'FDA Form 1572',
                version: '2020',
                description: 'Statement of Investigator',
                effectiveDate: '2020-06-16',
                requirements: [
                    'section_1', 'section_2', 'section_3', 'section_4', 'section_5',
                    'section_6', 'section_7', 'section_8', 'section_9', 'section_10'
                ]
            },
            {
                id: 'ich_e2a',
                name: 'ICH E2A',
                version: '1994',
                description: 'Clinical Safety Data Management: Definitions and Standards for Expedited Reporting',
                effectiveDate: '1994-10-27',
                requirements: [
                    'section_1', 'section_2', 'section_3', 'section_4', 'section_5',
                    'section_6', 'section_7', 'section_8', 'section_9', 'section_10'
                ]
            },
            {
                id: 'ich_e6',
                name: 'ICH E6',
                version: 'R2',
                description: 'Integrated Addendum to ICH E6(R1): Guideline for Good Clinical Practice',
                effectiveDate: '2016-11-09',
                requirements: [
                    'section_1', 'section_2', 'section_3', 'section_4', 'section_5',
                    'section_6', 'section_7', 'section_8', 'section_9', 'section_10'
                ]
            },
            {
                id: 'ich_e8',
                name: 'ICH E8',
                version: 'R1',
                description: 'General Considerations for Clinical Trials',
                effectiveDate: '1997-07-17',
                requirements: [
                    'section_1', 'section_2', 'section_3', 'section_4', 'section_5',
                    'section_6', 'section_7', 'section_8', 'section_9', 'section_10'
                ]
            },
            {
                id: 'ich_e9',
                name: 'ICH E9',
                version: '1998',
                description: 'Statistical Principles for Clinical Trials',
                effectiveDate: '1998-02-05',
                requirements: [
                    'section_1', 'section_2', 'section_3', 'section_4', 'section_5',
                    'section_6', 'section_7', 'section_8', 'section_9', 'section_10'
                ]
            },
            {
                id: 'ich_e10',
                name: 'ICH E10',
                version: '2000',
                description: 'Choice of Control Group and Related Issues in Clinical Trials',
                effectiveDate: '2000-07-20',
                requirements: [
                    'section_1', 'section_2', 'section_3', 'section_4', 'section_5',
                    'section_6', 'section_7', 'section_8', 'section_9', 'section_10'
                ]
            }
        ];
        
        regulations.forEach(reg => this.regulations.set(reg.id, reg));
        return regulations;
    }
    
    async loadComplianceChecks() {
        // Define standard compliance checks
        const checks = [
            // Protocol compliance
            {
                id: 'protocol_deviation',
                name: 'Protocol Deviation Check',
                description: 'Checks for any protocol deviations',
                severity: 'high',
                check: async (study, participant) => {
                    // Implementation would check for protocol deviations
                    return { compliant: true };
                }
            },
            
            // Informed consent
            {
                id: 'informed_consent',
                name: 'Informed Consent Verification',
                description: 'Verifies that informed consent was properly obtained',
                severity: 'critical',
                check: async (study, participant) => {
                    // Implementation would verify consent
                    return { compliant: true };
                }
            },
            
            // Adverse event reporting
            {
                id: 'ae_reporting',
                name: 'Adverse Event Reporting',
                description: 'Ensures timely reporting of adverse events',
                severity: 'high',
                check: async (study, participant) => {
                    // Implementation would check AE reporting
                    return { compliant: true };
                }
            },
            
            // Data quality
            {
                id: 'data_quality',
                name: 'Data Quality Check',
                description: 'Verifies data quality and completeness',
                severity: 'medium',
                check: async (study, participant) => {
                    // Implementation would check data quality
                    return { compliant: true };
                }
            },
            
            // Source data verification
            {
                id: 'sdv',
                name: 'Source Data Verification',
                description: 'Verifies source data against reported data',
                severity: 'high',
                check: async (study, participant) => {
                    // Implementation would perform SDV
                    return { compliant: true };
                }
            },
            
            // Regulatory document completeness
            {
                id: 'reg_docs',
                name: 'Regulatory Document Check',
                description: 'Ensures all required regulatory documents are present',
                severity: 'high',
                check: async (study, participant) => {
                    // Implementation would check documents
                    return { compliant: true };
                }
            },
            
            // Protocol amendment compliance
            {
                id: 'protocol_amendments',
                name: 'Protocol Amendment Compliance',
                description: 'Checks compliance with protocol amendments',
                severity: 'high',
                check: async (study, participant) => {
                    // Implementation would check amendments
                    return { compliant: true };
                }
            },
            
            // Monitoring visit follow-up
            {
                id: 'monitoring_visit',
                name: 'Monitoring Visit Follow-up',
                description: 'Ensures resolution of monitoring visit findings',
                severity: 'medium',
                check: async (study, participant) => {
                    // Implementation would check monitoring visit follow-up
                    return { compliant: true };
                }
            },
            
            // Subject eligibility
            {
                id: 'eligibility',
                name: 'Subject Eligibility',
                description: 'Verifies subject eligibility criteria',
                severity: 'critical',
                check: async (study, participant) => {
                    // Implementation would check eligibility
                    return { compliant: true };
                }
            },
            
            // Investigational product accountability
            {
                id: 'ip_accountability',
                name: 'Investigational Product Accountability',
                description: 'Verifies proper documentation of investigational product',
                severity: 'high',
                check: async (study, participant) => {
                    // Implementation would check IP accountability
                    return { compliant: true };
                }
            }
        ];
        
        checks.forEach(check => this.complianceChecks.set(check.id, check));
        return checks;
    }
    
    async loadDocuments() {
        // In a real system, this would load from a database
        this.documents = new Map();
        return [];
    }
    
    // Document Management
    async uploadDocument(document) {
        const doc = {
            id: uuidv4(),
            ...document,
            uploadedAt: new Date(),
            status: 'pending_review',
            versions: [{
                version: '1.0',
                uploadedAt: new Date(),
                filePath: document.filePath,
                uploadedBy: document.uploadedBy
            }],
            auditTrail: [{
                action: 'document_uploaded',
                timestamp: new Date(),
                user: document.uploadedBy,
                details: { status: 'pending_review' }
            }]
        };
        
        this.documents.set(doc.id, doc);
        await this.saveDocument(doc);
        
        this.emit('document_uploaded', doc);
        return doc;
    }
    
    async updateDocument(documentId, updates) {
        const doc = this.documents.get(documentId);
        if (!doc) throw new Error('Document not found');
        
        const updatedDoc = {
            ...doc,
            ...updates,
            updatedAt: new Date(),
            auditTrail: [
                ...doc.auditTrail,
                {
                    action: 'document_updated',
                    timestamp: new Date(),
                    user: updates.updatedBy || 'system',
                    details: updates
                }
            ]
        };
        
        this.documents.set(documentId, updatedDoc);
        await this.saveDocument(updatedDoc);
        
        this.emit('document_updated', updatedDoc);
        return updatedDoc;
    }
    
    async addDocumentVersion(documentId, versionData) {
        const doc = this.documents.get(documentId);
        if (!doc) throw new Error('Document not found');
        
        const newVersion = {
            version: (parseFloat(doc.versions[0].version) + 0.1).toFixed(1),
            uploadedAt: new Date(),
            filePath: versionData.filePath,
            uploadedBy: versionData.uploadedBy,
            comment: versionData.comment
        };
        
        const updatedDoc = {
            ...doc,
            versions: [newVersion, ...doc.versions],
            status: versionData.status || 'pending_review',
            updatedAt: new Date(),
            auditTrail: [
                ...doc.auditTrail,
                {
                    action: 'version_added',
                    timestamp: new Date(),
                    user: versionData.uploadedBy,
                    details: { version: newVersion.version }
                }
            ]
        };
        
        this.documents.set(documentId, updatedDoc);
        await this.saveDocument(updatedDoc);
        
        this.emit('document_version_added', { documentId, version: newVersion });
        return updatedDoc;
    }
    
    async approveDocument(documentId, approvalData) {
        const doc = this.documents.get(documentId);
        if (!doc) throw new Error('Document not found');
        
        const approval = {
            id: uuidv4(),
            approvedAt: new Date(),
            approvedBy: approvalData.approvedBy,
            version: doc.versions[0].version,
            comment: approvalData.comment,
            effectiveDate: approvalData.effectiveDate || new Date(),
            expiryDate: approvalData.expiryDate
        };
        
        const updatedDoc = {
            ...doc,
            status: 'approved',
            approval: {
                ...doc.approval,
                current: approval,
                history: [...(doc.approval?.history || []), approval]
            },
            updatedAt: new Date(),
            auditTrail: [
                ...doc.auditTrail,
                {
                    action: 'document_approved',
                    timestamp: new Date(),
                    user: approvalData.approvedBy,
                    details: { approvalId: approval.id }
                }
            ]
        };
        
        this.documents.set(documentId, updatedDoc);
        await this.saveDocument(updatedDoc);
        
        this.emit('document_approved', { documentId, approval });
        return updatedDoc;
    }
    
    async rejectDocument(documentId, rejectionData) {
        const doc = this.documents.get(documentId);
        if (!doc) throw new Error('Document not found');
        
        const rejection = {
            id: uuidv4(),
            rejectedAt: new Date(),
            rejectedBy: rejectionData.rejectedBy,
            version: doc.versions[0].version,
            reason: rejectionData.reason,
            comments: rejectionData.comments
        };
        
        const updatedDoc = {
            ...doc,
            status: 'rejected',
            rejection: {
                ...doc.rejection,
                current: rejection,
                history: [...(doc.rejection?.history || []), rejection]
            },
            updatedAt: new Date(),
            auditTrail: [
                ...doc.auditTrail,
                {
                    action: 'document_rejected',
                    timestamp: new Date(),
                    user: rejectionData.rejectedBy,
                    details: { rejectionId: rejection.id }
                }
            ]
        };
        
        this.documents.set(documentId, updatedDoc);
        await this.saveDocument(updatedDoc);
        
        this.emit('document_rejected', { documentId, rejection });
        return updatedDoc;
    }
    
    // Compliance Checking
    async runComplianceCheck(checkId, study, participant) {
        const check = this.complianceChecks.get(checkId);
        if (!check) throw new Error(`Compliance check ${checkId} not found`);
        
        try {
            const result = await check.check(study, participant);
            
            const complianceRecord = {
                id: uuidv4(),
                checkId,
                studyId: study?.id,
                participantId: participant?.id,
                timestamp: new Date(),
                result,
                status: result.compliant ? 'compliant' : 'non_compliant',
                severity: check.severity
            };
            
            // Save the compliance record
            await this.saveComplianceRecord(complianceRecord);
            
            // Emit event
            this.emit('compliance_check_completed', complianceRecord);
            
            return complianceRecord;
        } catch (error) {
            logger.error('Error running compliance check', {
                service: 'regulatory-compliance',
                checkId,
                studyId: study?.id,
                participantId: participant?.id,
                error: error.message
            });

            const errorRecord = {
                id: uuidv4(),
                checkId,
                studyId: study?.id,
                participantId: participant?.id,
                timestamp: new Date(),
                status: 'error',
                error: error.message,
                severity: 'critical'
            };
            
            await this.saveComplianceRecord(errorRecord);
            this.emit('compliance_check_failed', errorRecord);
            
            throw error;
        }
    }
    
    async runAllComplianceChecks(study, participant) {
        const results = [];
        
        for (const [checkId] of this.complianceChecks) {
            try {
                const result = await this.runComplianceCheck(checkId, study, participant);
                results.push(result);
            } catch (error) {
                logger.error('Skipping compliance check due to error', {
                    service: 'regulatory-compliance',
                    checkId,
                    studyId: study?.id,
                    participantId: participant?.id,
                    error: error.message
                });
                results.push({
                    checkId,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    // Audit Trail
    async logAuditEvent(event) {
        const auditEvent = {
            id: uuidv4(),
            timestamp: new Date(),
            ...event
        };
        
        this.audits.push(auditEvent);
        await this.saveAuditEvent(auditEvent);
        
        this.emit('audit_event', auditEvent);
        return auditEvent;
    }
    
    // Data Persistence
    async saveDocument(doc) {
        const filePath = path.join(this.config.dataDir, 'documents', `${doc.id}.json`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(doc, null, 2), 'utf8');
        return doc;
    }
    
    async saveComplianceRecord(record) {
        const filePath = path.join(this.config.dataDir, 'compliance', `${record.id}.json`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
        return record;
    }
    
    async saveAuditEvent(event) {
        const filePath = path.join(this.config.dataDir, 'audits', `${event.id}.json`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(event, null, 2), 'utf8');
        return event;
    }
    
    // Getters
    getRegulation(regulationId) {
        return this.regulations.get(regulationId);
    }
    
    getAllRegulations() {
        return Array.from(this.regulations.values());
    }
    
    getComplianceCheck(checkId) {
        return this.complianceChecks.get(checkId);
    }
    
    getAllComplianceChecks() {
        return Array.from(this.complianceChecks.values());
    }
    
    getDocument(documentId) {
        return this.documents.get(documentId);
    }
    
    getAllDocuments() {
        return Array.from(this.documents.values());
    }
    
    getAuditEvents(filter = {}) {
        // Simple filtering - in a real app, this would query a database
        return this.audits.filter(event => {
            return Object.entries(filter).every(([key, value]) => {
                return event[key] === value;
            });
        });
    }
}

module.exports = { RegulatoryComplianceManager };
