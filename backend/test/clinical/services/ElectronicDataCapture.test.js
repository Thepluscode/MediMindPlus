const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const ElectronicDataCapture = require('../../../src/clinical/services/ElectronicDataCapture');

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn(),
    unlink: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('ElectronicDataCapture', () => {
  let edc;
  const testDataDir = path.join(__dirname, 'test-data');
  const studyId = 'STUDY-001';
  const siteId = 'SITE-001';
  const participantId = 'P001';
  const userId = 'USER001';
  
  // Sample form definition
  const demoForm = {
    formId: 'demographics',
    name: 'Demographics',
    description: 'Participant demographic information',
    fields: [
      {
        fieldId: 'age',
        label: 'Age',
        type: 'number',
        required: true,
        min: 18,
        max: 100
      },
      {
        fieldId: 'gender',
        label: 'Gender',
        type: 'string',
        required: true,
        options: ['Male', 'Female', 'Other', 'Prefer not to say']
      },
      {
        fieldId: 'race',
        label: 'Race',
        type: 'string',
        required: true,
        options: ['White', 'Black', 'Asian', 'Native American', 'Other']
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    edc = new ElectronicDataCapture({ dataDir: testDataDir });
  });

  describe('initialization', () => {
    it('should initialize with default data directory if none provided', () => {
      const defaultEdc = new ElectronicDataCapture();
      expect(defaultEdc.dataDir).toContain('data/edc');
    });

    it('should create data directory if it does not exist', async () => {
      await edc.init();
      expect(fs.mkdir).toHaveBeenCalledWith(testDataDir, { recursive: true });
    });
  });

  describe('form management', () => {
    it('should register a form definition', async () => {
      await edc.registerForm(demoForm);
      const form = edc.getFormDefinition('demographics');
      expect(form).toEqual(demoForm);
    });

    it('should throw error when registering invalid form', async () => {
      await expect(edc.registerForm({})).rejects.toThrow('Invalid form definition');
    });
  });

  describe('data collection', () => {
    beforeEach(async () => {
      await edc.registerForm(demoForm);
      fs.readFile.mockResolvedValueOnce(JSON.stringify([])); // Empty participants list
    });

    it('should initialize participant data', async () => {
      await edc.initializeParticipant(studyId, siteId, participantId, userId);
      
      const participantData = await edc.getParticipantData(studyId, siteId, participantId);
      expect(participantData).toHaveProperty('participantId', participantId);
      expect(participantData).toHaveProperty('studyId', studyId);
      expect(participantData).toHaveProperty('siteId', siteId);
      expect(participantData.forms).toEqual({});
    });

    it('should record form data', async () => {
      await edc.initializeParticipant(studyId, siteId, participantId, userId);
      
      const formData = {
        age: 30,
        gender: 'Male',
        race: 'Black'
      };
      
      await edc.recordFormData(
        studyId,
        siteId,
        participantId,
        'demographics',
        formData,
        userId
      );
      
      const participantData = await edc.getParticipantData(studyId, siteId, participantId);
      expect(participantData.forms.demographics).toMatchObject({
        formId: 'demographics',
        data: formData,
        status: 'completed',
        recordedBy: userId
      });
    });

    it('should validate form data against definition', async () => {
      await edc.initializeParticipant(studyId, siteId, participantId, userId);
      
      // Invalid age (outside min/max)
      const invalidData = {
        age: 150,
        gender: 'Male',
        race: 'Black'
      };
      
      await expect(
        edc.recordFormData(
          studyId,
          siteId,
          participantId,
          'demographics',
          invalidData,
          userId
        )
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('query management', () => {
    let queryId;
    
    beforeEach(async () => {
      await edc.initializeParticipant(studyId, siteId, participantId, userId);
      queryId = await edc.createQuery(
        studyId,
        siteId,
        participantId,
        'demographics',
        'age',
        'Age seems unusually high',
        'DATA_REVIEW',
        'REVIEWER001'
      );
    });

    it('should create a query', async () => {
      const query = await edc.getQuery(queryId);
      expect(query).toMatchObject({
        id: queryId,
        studyId,
        siteId,
        participantId,
        formId: 'demographics',
        fieldId: 'age',
        description: 'Age seems unusually high',
        type: 'DATA_REVIEW',
        status: 'OPEN',
        createdBy: 'REVIEWER001'
      });
    });

    it('should resolve a query', async () => {
      await edc.resolveQuery(queryId, 'Updated age', 'RESOLVER001');
      const query = await edc.getQuery(queryId);
      expect(query.status).toBe('RESOLVED');
      expect(query.resolvedBy).toBe('RESOLVER001');
      expect(query.resolutionNotes).toBe('Updated age');
    });
  });

  describe('audit trail', () => {
    it('should log audit events', async () => {
      const eventListener = jest.fn();
      edc.on('audit', eventListener);
      
      await edc.initializeParticipant(studyId, siteId, participantId, userId);
      
      expect(eventListener).toHaveBeenCalledWith({
        eventType: 'PARTICIPANT_INITIALIZED',
        timestamp: expect.any(String),
        userId,
        metadata: expect.objectContaining({
          studyId,
          siteId,
          participantId
        })
      });
    });
  });

  describe('data export', () => {
    it('should export participant data', async () => {
      await edc.registerForm(demoForm);
      await edc.initializeParticipant(studyId, siteId, participantId, userId);
      
      const formData = { age: 30, gender: 'Male', race: 'Black' };
      await edc.recordFormData(studyId, siteId, participantId, 'demographics', formData, userId);
      
      const exportData = await edc.exportParticipantData(studyId, siteId, participantId);
      expect(exportData).toMatchObject({
        participantId,
        studyId,
        siteId,
        forms: {
          demographics: expect.objectContaining({
            formId: 'demographics',
            data: formData,
            status: 'completed',
            recordedBy: userId
          })
        }
      });
    });
  });
});
