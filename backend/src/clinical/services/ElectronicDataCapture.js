const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ElectronicDataCapture {
    constructor(config = {}) {
        this.config = {
            dataDir: path.join(process.cwd(), 'data', 'edc'),
            ...config
        };
        this.forms = new Map();
        this.queries = new Map();
        this.auditTrail = [];
        
        // Ensure data directory exists
        fs.mkdir(this.config.dataDir, { recursive: true })
            .catch(err => console.error('Failed to create EDC data directory:', err));
    }
    
    async initialize() {
        try {
            await this.loadFormDefinitions();
            await this.loadQueries();
            console.log('Electronic Data Capture system initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize EDC:', error);
            throw error;
        }
    }
    
    async loadFormDefinitions() {
        // In a real system, this would load from a database or configuration
        const formDefinitions = [
            {
                id: 'demographics',
                name: 'Demographics',
                version: '1.0',
                fields: [
                    { name: 'age', type: 'number', required: true, validation: { min: 0, max: 120 } },
                    { name: 'gender', type: 'select', options: ['male', 'female', 'other', 'prefer_not_to_say'], required: true },
                    { name: 'race', type: 'select', options: ['white', 'black', 'asian', 'hispanic', 'other'], required: true },
                    { name: 'ethnicity', type: 'select', options: ['hispanic', 'not_hispanic', 'prefer_not_to_say'], required: true },
                    { name: 'weight', type: 'number', unit: 'kg', validation: { min: 20, max: 300 } },
                    { name: 'height', type: 'number', unit: 'cm', validation: { min: 100, max: 250 } }
                ]
            },
            {
                id: 'vital_signs',
                name: 'Vital Signs',
                version: '1.0',
                fields: [
                    { name: 'systolic_bp', type: 'number', unit: 'mmHg', required: true, validation: { min: 60, max: 250 } },
                    { name: 'diastolic_bp', type: 'number', unit: 'mmHg', required: true, validation: { min: 30, max: 150 } },
                    { name: 'heart_rate', type: 'number', unit: 'bpm', required: true, validation: { min: 30, max: 200 } },
                    { name: 'respiratory_rate', type: 'number', unit: 'breaths/min', validation: { min: 8, max: 60 } },
                    { name: 'temperature', type: 'number', unit: '°C', validation: { min: 35, max: 42 } },
                    { name: 'oxygen_saturation', type: 'number', unit: '%', validation: { min: 70, max: 100 } },
                    { name: 'weight', type: 'number', unit: 'kg', validation: { min: 20, max: 300 } },
                    { name: 'height', type: 'number', unit: 'cm', validation: { min: 100, max: 250 } },
                    { name: 'bmi', type: 'number', validation: { min: 10, max: 60 } },
                    { name: 'pain_score', type: 'number', validation: { min: 0, max: 10 } },
                    { name: 'blood_glucose', type: 'number', unit: 'mg/dL', validation: { min: 20, max: 600 } },
                    { name: 'consciousness_level', type: 'select', options: ['alert', 'voice', 'pain', 'unresponsive'] },
                    { name: 'notes', type: 'text' }
                ]
            },
            {
                id: 'adverse_event',
                name: 'Adverse Event Report',
                version: '1.0',
                fields: [
                    { name: 'event_term', type: 'text', required: true },
                    { name: 'start_date', type: 'date', required: true },
                    { name: 'end_date', type: 'date' },
                    { name: 'severity', type: 'select', options: ['mild', 'moderate', 'severe'], required: true },
                    { name: 'serious', type: 'boolean', required: true },
                    { name: 'seriousness', type: 'multiselect', options: ['death', 'life_threatening', 'hospitalization', 'disability', 'congenital_anomaly', 'other_medically_important'] },
                    { name: 'causality', type: 'select', options: ['unrelated', 'unlikely', 'possible', 'probable', 'definite'], required: true },
                    { name: 'action_taken', type: 'select', options: ['none', 'dose_reduced', 'drug_withdrawn', 'dose_increased', 'not_applicable', 'unknown'], required: true },
                    { name: 'outcome', type: 'select', options: ['recovered', 'recovering', 'not_recovered', 'fatal', 'unknown'], required: true },
                    { name: 'treatment_required', type: 'boolean' },
                    { name: 'treatment_details', type: 'text' },
                    { name: 'meddra_code', type: 'text' },
                    { name: 'description', type: 'textarea', required: true },
                    { name: 'reporter_name', type: 'text' },
                    { name: 'reporter_contact', type: 'text' }
                ]
            },
            {
                id: 'concomitant_medication',
                name: 'Concomitant Medication',
                version: '1.0',
                fields: [
                    { name: 'medication_name', type: 'text', required: true },
                    { name: 'atc_code', type: 'text' },
                    { name: 'start_date', type: 'date', required: true },
                    { name: 'end_date', type: 'date' },
                    { name: 'indication', type: 'text' },
                    { name: 'dose', type: 'text' },
                    { name: 'frequency', type: 'text' },
                    { name: 'route', type: 'select', options: ['oral', 'iv', 'im', 'sc', 'topical', 'inhalation', 'other'] },
                    { name: 'ongoing', type: 'boolean' },
                    { name: 'reason_for_use', type: 'text' },
                    { name: 'prescriber_name', type: 'text' },
                    { name: 'prescriber_contact', type: 'text' }
                ]
            },
            {
                id: 'medical_history',
                name: 'Medical History',
                version: '1.0',
                fields: [
                    { name: 'past_medical_conditions', type: 'table', columns: [
                        { name: 'condition', type: 'text', required: true },
                        { name: 'icd10_code', type: 'text' },
                        { name: 'date_diagnosed', type: 'date' },
                        { name: 'resolved', type: 'boolean' },
                        { name: 'details', type: 'text' }
                    ]},
                    { name: 'surgeries', type: 'table', columns: [
                        { name: 'procedure', type: 'text', required: true },
                        { name: 'date', type: 'date' },
                        { name: 'outcome', type: 'text' },
                        { name: 'complications', type: 'text' }
                    ]},
                    { name: 'hospitalizations', type: 'table', columns: [
                        { name: 'reason', type: 'text', required: true },
                        { name: 'admission_date', type: 'date' },
                        { name: 'discharge_date', type: 'date' },
                        { name: 'details', type: 'text' }
                    ]},
                    { name: 'allergies', type: 'table', columns: [
                        { name: 'substance', type: 'text', required: true },
                        { name: 'reaction', type: 'text' },
                        { name: 'severity', type: 'select', options: ['mild', 'moderate', 'severe'] },
                        { name: 'first_occurrence', type: 'date' }
                    ]},
                    { name: 'family_history', type: 'table', columns: [
                        { name: 'relation', type: 'text', required: true },
                        { name: 'condition', type: 'text', required: true },
                        { name: 'age_at_diagnosis', type: 'number' },
                        { name: 'notes', type: 'text' }
                    ]}
                ]
            }
        ];
        
        formDefinitions.forEach(form => this.forms.set(form.id, form));
        return formDefinitions;
    }
    
    async loadQueries() {
        // In a real system, this would load queries from a database
        this.queries = new Map();
        return [];
    }
    
    async initializeParticipant(participant) {
        // Initialize participant-specific data structures
        const participantData = {
            id: participant.id,
            studyId: participant.studyId,
            forms: new Map(),
            queries: new Map(),
            auditTrail: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Save participant data
        await this.saveParticipantData(participantData);
        return participantData;
    }
    
    async storeDataPoint(dataPoint) {
        // Validate data point against form definition
        const validation = await this.validateDataPoint(dataPoint);
        if (!validation.valid) {
            throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Add metadata
        const enrichedDataPoint = {
            ...dataPoint,
            id: dataPoint.id || uuidv4(),
            formId: dataPoint.formId || this.determineFormId(dataPoint.data),
            version: '1.0',
            status: 'draft',
            createdAt: dataPoint.createdAt || new Date(),
            updatedAt: new Date(),
            auditTrail: [
                ...(dataPoint.auditTrail || []),
                {
                    action: 'created',
                    timestamp: new Date(),
                    user: dataPoint.userId || 'system',
                    changes: dataPoint.data
                }
            ]
        };
        
        // Save data point
        await this.saveDataPoint(enrichedDataPoint);
        
        // Add to audit trail
        this.addAuditTrail({
            action: 'data_point_created',
            dataPointId: enrichedDataPoint.id,
            participantId: enrichedDataPoint.participantId,
            studyId: enrichedDataPoint.studyId,
            details: { formId: enrichedDataPoint.formId }
        });
        
        return enrichedDataPoint;
    }
    
    async validateDataPoint(dataPoint) {
        const errors = [];
        const form = this.forms.get(dataPoint.formId);
        
        if (!form) {
            errors.push(`Form ID ${dataPoint.formId} not found`);
            return { valid: false, errors };
        }
        
        // Validate required fields
        for (const field of form.fields) {
            if (field.required && !(field.name in dataPoint.data)) {
                errors.push(`Missing required field: ${field.name}`);
                continue;
            }
            
            const value = dataPoint.data[field.name];
            if (value === undefined || value === null) continue;
            
            // Type validation
            switch (field.type) {
                case 'number':
                    if (typeof value !== 'number' || isNaN(value)) {
                        errors.push(`Field ${field.name} must be a number`);
                    } else if (field.validation) {
                        if (field.validation.min !== undefined && value < field.validation.min) {
                            errors.push(`Field ${field.name} must be at least ${field.validation.min}`);
                        }
                        if (field.validation.max !== undefined && value > field.validation.max) {
                            errors.push(`Field ${field.name} must be at most ${field.validation.max}`);
                        }
                    }
                    break;
                    
                case 'select':
                case 'multiselect':
                    if (field.options && !field.options.includes(value)) {
                        errors.push(`Invalid value for ${field.name}: ${value}`);
                    }
                    break;
                    
                case 'date':
                    if (isNaN(Date.parse(value))) {
                        errors.push(`Invalid date format for ${field.name}`);
                    }
                    break;
                    
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        errors.push(`Field ${field.name} must be a boolean`);
                    }
                    break;
                    
                case 'table':
                    if (!Array.isArray(value)) {
                        errors.push(`Field ${field.name} must be an array`);
                    } else {
                        // Validate each row in the table
                        value.forEach((row, index) => {
                            field.columns.forEach(col => {
                                if (col.required && !(col.name in row)) {
                                    errors.push(`Row ${index + 1} is missing required column: ${col.name}`);
                                }
                            });
                        });
                    }
                    break;
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    async createQuery(queryData) {
        const query = {
            id: uuidv4(),
            ...queryData,
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date(),
            responses: []
        };
        
        this.queries.set(query.id, query);
        
        // Add to audit trail
        this.addAuditTrail({
            action: 'query_created',
            queryId: query.id,
            participantId: query.participantId,
            studyId: query.studyId,
            details: { status: query.status }
        });
        
        return query;
    }
    
    async respondToQuery(queryId, response) {
        const query = this.queries.get(queryId);
        if (!query) throw new Error('Query not found');
        
        const queryResponse = {
            id: uuidv4(),
            ...response,
            timestamp: new Date()
        };
        
        query.responses.push(queryResponse);
        query.updatedAt = new Date();
        
        // Add to audit trail
        this.addAuditTrail({
            action: 'query_responded',
            queryId: query.id,
            participantId: query.participantId,
            studyId: query.studyId,
            details: { responseId: queryResponse.id }
        });
        
        return query;
    }
    
    async resolveQuery(queryId, resolution) {
        const query = this.queries.get(queryId);
        if (!query) throw new Error('Query not found');
        
        query.status = 'resolved';
        query.resolution = resolution;
        query.resolvedAt = new Date();
        query.updatedAt = new Date();
        
        // Add to audit trail
        this.addAuditTrail({
            action: 'query_resolved',
            queryId: query.id,
            participantId: query.participantId,
            studyId: query.studyId,
            details: { resolution }
        });
        
        return query;
    }
    
    // Helper methods
    determineFormId(data) {
        // Simple heuristic to determine form ID based on data structure
        if (data.systolic_bp !== undefined) return 'vital_signs';
        if (data.event_term !== undefined) return 'adverse_event';
        if (data.medication_name !== undefined) return 'concomitant_medication';
        return 'unknown';
    }
    
    addAuditTrail(entry) {
        const auditEntry = {
            id: uuidv4(),
            timestamp: new Date(),
            ...entry
        };
        
        this.auditTrail.push(auditEntry);
        return auditEntry;
    }
    
    // Data persistence methods
    async saveParticipantData(participantData) {
        const filePath = path.join(this.config.dataDir, `participant_${participantData.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(participantData, null, 2), 'utf8');
        return participantData;
    }
    
    async saveDataPoint(dataPoint) {
        const filePath = path.join(this.config.dataDir, `datapoint_${dataPoint.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(dataPoint, null, 2), 'utf8');
        return dataPoint;
    }
    
    async getParticipantData(participantId) {
        try {
            const filePath = path.join(this.config.dataDir, `participant_${participantId}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') return null;
            throw error;
        }
    }
    
    async getDataPoint(dataPointId) {
        try {
            const filePath = path.join(this.config.dataDir, `datapoint_${dataPointId}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') return null;
            throw error;
        }
    }
    
    async getFormDefinition(formId) {
        return this.forms.get(formId) || null;
    }
    
    async listForms() {
        return Array.from(this.forms.values());
    }
}

module.exports = { ElectronicDataCapture };
