const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const ElectronicDataCapture = require('../../src/clinical/services/ElectronicDataCapture');
const RegulatoryComplianceManager = require('../../src/clinical/services/RegulatoryComplianceManager');
const StatisticalAnalysisEngine = require('../../src/clinical/services/StatisticalAnalysisEngine');

// Mock file system
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    unlink: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock mathjs for statistical functions
jest.mock('mathjs', () => ({
  mean: jest.fn().mockImplementation(arr => arr.reduce((a, b) => a + b, 0) / arr.length),
  median: jest.fn().mockImplementation(arr => {
    const mid = Math.floor(arr.length / 2);
    const nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  }),
  std: jest.fn().mockImplementation(arr => {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / (arr.length - 1));
  }),
  ttest: jest.fn().mockReturnValue({ pValue: 0.05, statistic: 1.96 })
}));

describe('Clinical Research Platform Integration', () => {
  // Test data directory
  const testDataDir = path.join(__dirname, 'test-data');
  
  // Test study and user IDs
  const studyId = 'STUDY-001';
  const siteId = 'SITE-001';
  const userId = 'USER001';
  
  // Service instances
  let edc, rcm, sae;
  
  // Test data
  const participantIds = Array(10).fill(0).map(() => `P${uuidv4().substring(0, 6)}`);
  const treatmentGroups = ['TREATMENT', 'PLACEBO'];
  
  // Form definitions
  const demographicsForm = {
    formId: 'demographics',
    name: 'Demographics',
    description: 'Participant demographic information',
    fields: [
      { fieldId: 'age', type: 'number', label: 'Age (years)', required: true, min: 18, max: 100 },
      { fieldId: 'gender', type: 'string', label: 'Gender', required: true, options: ['MALE', 'FEMALE', 'OTHER'] },
      { fieldId: 'race', type: 'string', label: 'Race', required: true },
      { fieldId: 'ethnicity', type: 'string', label: 'Ethnicity', required: true }
    ]
  };
  
  const vitalSignsForm = {
    formId: 'vital_signs',
    name: 'Vital Signs',
    description: 'Vital signs measurements',
    fields: [
      { fieldId: 'systolic_bp', type: 'number', label: 'Systolic BP (mmHg)', required: true, min: 60, max: 250 },
      { fieldId: 'diastolic_bp', type: 'number', label: 'Diastolic BP (mmHg)', required: true, min: 30, max: 150 },
      { fieldId: 'heart_rate', type: 'number', label: 'Heart Rate (bpm)', required: true, min: 30, max: 200 },
      { fieldId: 'temperature', type: 'number', label: 'Temperature (°C)', required: true, min: 32, max: 43 }
    ]
  };
  
  // Regulatory document
  const protocolDocument = {
    id: 'protocol-v1',
    name: 'Study Protocol v1.0',
    type: 'PROTOCOL',
    description: 'Clinical Study Protocol',
    fileType: 'pdf',
    fileSize: 1024,
    uploadedBy: userId,
    version: '1.0',
    status: 'DRAFT',
    metadata: {
      studyId: studyId,
      effectiveDate: '2023-01-01',
      approvalDate: null
    }
  };
  
  // Setup before all tests
  beforeAll(async () => {
    // Initialize services
    edc = new ElectronicDataCapture({ dataDir: path.join(testDataDir, 'edc') });
    rcm = new RegulatoryComplianceManager({ dataDir: path.join(testDataDir, 'regulatory') });
    sae = new StatisticalAnalysisEngine({ dataDir: path.join(testDataDir, 'stats') });
    
    // Initialize services
    await Promise.all([edc.init(), rcm.init(), sae.init()]);
    
    // Register forms in EDC
    await edc.registerForm(demographicsForm);
    await edc.registerForm(vitalSignsForm);
    
    // Upload protocol document
    await rcm.uploadDocument(protocolDocument);
  });
  
  // Test case 1: Participant enrollment and data collection
  it('should enroll participants and collect demographic data', async () => {
    // Enroll participants
    for (const participantId of participantIds) {
      await edc.initializeParticipant(studyId, siteId, participantId, userId);
      
      // Record demographic data
      const demoData = {
        age: Math.floor(Math.random() * 50) + 18, // 18-68 years
        gender: ['MALE', 'FEMALE', 'OTHER'][Math.floor(Math.random() * 3)],
        race: ['WHITE', 'BLACK', 'ASIAN', 'HISPANIC', 'OTHER'][Math.floor(Math.random() * 5)],
        ethnicity: ['HISPANIC', 'NON_HISPANIC', 'UNKNOWN'][Math.floor(Math.random() * 3)]
      };
      
      await edc.recordFormData(
        studyId,
        siteId,
        participantId,
        'demographics',
        demoData,
        userId
      );
      
      // Verify data was recorded
      const participantData = await edc.getParticipantData(studyId, siteId, participantId);
      expect(participantData.forms.demographics.data).toMatchObject(demoData);
    }
  });
  
  // Test case 2: Collect vital signs data
  it('should collect vital signs data', async () => {
    for (const participantId of participantIds) {
      // Randomly assign to treatment or placebo group
      const group = treatmentGroups[Math.floor(Math.random() * treatmentGroups.length)];
      
      // Record vital signs
      const vitalSigns = {
        systolic_bp: 110 + Math.floor(Math.random() * 30), // 110-140
        diastolic_bp: 70 + Math.floor(Math.random() * 20), // 70-90
        heart_rate: 60 + Math.floor(Math.random() * 40), // 60-100
        temperature: 36.5 + Math.random() * 1.5 // 36.5-38.0
      };
      
      await edc.recordFormData(
        studyId,
        siteId,
        participantId,
        'vital_signs',
        { ...vitalSigns, treatment_group: group },
        userId
      );
      
      // Verify data was recorded
      const participantData = await edc.getParticipantData(studyId, siteId, participantId);
      expect(participantData.forms.vital_signs.data).toMatchObject(vitalSigns);
    }
  });
  
  // Test case 3: Regulatory compliance checks
  it('should perform regulatory compliance checks', async () => {
    // Approve the protocol document
    await rcm.approveDocument(protocolDocument.id, 'Approved for study', userId);
    
    // Run compliance check
    const complianceReport = await rcm.runComplianceCheck(studyId);
    
    // Verify the report
    expect(complianceReport).toHaveProperty('studyId', studyId);
    expect(complianceReport).toHaveProperty('checks');
    
    // Should have at least one check for protocol approval
    const protocolCheck = complianceReport.checks.find(
      check => check.requirementId === 'protocol_approval'
    );
    
    expect(protocolCheck).toBeDefined();
    expect(protocolCheck.status).toBe('PASSED');
  });
  
  // Test case 4: Statistical analysis
  it('should perform statistical analysis on collected data', async () => {
    // Export participant data for analysis
    const exportData = [];
    for (const participantId of participantIds) {
      const participantData = await edc.getParticipantData(studyId, siteId, participantId);
      exportData.push({
        participantId,
        ...participantData.forms.demographics.data,
        ...participantData.forms.vital_signs.data
      });
    }
    
    // Register dataset with the statistical analysis engine
    const dataset = {
      id: 'vital-signs-dataset',
      name: 'Vital Signs Dataset',
      description: 'Vital signs and demographic data for all participants',
      columns: [
        { name: 'participantId', type: 'string' },
        { name: 'age', type: 'number' },
        { name: 'gender', type: 'string' },
        { name: 'treatment_group', type: 'string' },
        { name: 'systolic_bp', type: 'number' },
        { name: 'diastolic_bp', type: 'number' },
        { name: 'heart_rate', type: 'number' },
        { name: 'temperature', type: 'number' }
      ],
      data: exportData,
      metadata: {
        studyId,
        createdBy: userId,
        createdAt: new Date().toISOString()
      }
    };
    
    const datasetId = await sae.registerDataset(dataset);
    
    // Define analysis configuration
    const analysisConfig = {
      id: 'bp-analysis-001',
      name: 'Blood Pressure Analysis',
      description: 'Compare blood pressure between treatment groups',
      type: 'T_TEST',
      parameters: {
        datasetId,
        variable: 'systolic_bp',
        groupBy: 'treatment_group',
        groups: treatmentGroups,
        alpha: 0.05
      },
      metadata: {
        studyId,
        createdBy: userId
      }
    };
    
    // Create and run analysis
    const analysisId = await sae.createAnalysis(analysisConfig);
    const result = await sae.runAnalysis(analysisId);
    
    // Verify analysis results
    expect(result).toHaveProperty('analysisId', analysisId);
    expect(result).toHaveProperty('status', 'COMPLETED');
    expect(result).toHaveProperty('result');
    
    // Check that the result contains p-value and test statistic
    expect(result.result).toHaveProperty('pValue');
    expect(result.result).toHaveProperty('statistic');
    
    // Generate a report
    const report = await sae.generateReport(analysisId, 'PDF');
    expect(report).toHaveProperty('format', 'PDF');
    expect(report).toHaveProperty('content');
  });
  
  // Test case 5: Data query and audit trail
  it('should track data queries and maintain audit trail', async () => {
    // Create a data query
    const participantId = participantIds[0];
    const queryId = await edc.createQuery(
      studyId,
      siteId,
      participantId,
      'vital_signs',
      'systolic_bp',
      'Value seems unusually high',
      'DATA_VERIFICATION',
      'MONITOR001'
    );
    
    // Verify query was created
    const query = await edc.getQuery(queryId);
    expect(query).toHaveProperty('id', queryId);
    expect(query).toHaveProperty('status', 'OPEN');
    
    // Resolve the query
    await edc.resolveQuery(queryId, 'Verified with source data', 'INVESTIGATOR001');
    
    // Verify query was resolved
    const updatedQuery = await edc.getQuery(queryId);
    expect(updatedQuery).toHaveProperty('status', 'RESOLVED');
    expect(updatedQuery).toHaveProperty('resolvedBy', 'INVESTIGATOR001');
    
    // Check audit trail
    const auditTrail = await edc.getAuditTrail(studyId, siteId, participantId);
    expect(auditTrail).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'QUERY_CREATED',
          metadata: expect.objectContaining({
            queryId,
            fieldId: 'systolic_bp'
          })
        }),
        expect.objectContaining({
          eventType: 'QUERY_RESOLVED',
          metadata: expect.objectContaining({
            queryId,
            resolvedBy: 'INVESTIGATOR001'
          })
        })
      ])
    );
  });
});
