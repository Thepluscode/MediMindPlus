const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const RegulatoryComplianceManager = require('../../../src/clinical/services/RegulatoryComplianceManager');

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

describe('RegulatoryComplianceManager', () => {
  let rcm;
  const testDataDir = path.join(__dirname, 'test-regulatory-data');
  const studyId = 'STUDY-001';
  const userId = 'USER001';
  
  // Sample regulation
  const hipaaRegulation = {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    version: '1.0',
    requirements: [
      {
        id: 'hipaa-164.308',
        description: 'Administrative Safeguards',
        isRequired: true
      },
      {
        id: 'hipaa-164.312',
        description: 'Technical Safeguards',
        isRequired: true
      }
    ]
  };

  // Sample document
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

  beforeEach(() => {
    jest.clearAllMocks();
    rcm = new RegulatoryComplianceManager({ dataDir: testDataDir });
  });

  describe('initialization', () => {
    it('should initialize with default data directory if none provided', () => {
      const defaultRcm = new RegulatoryComplianceManager();
      expect(defaultRcm.dataDir).toContain('data/regulatory');
    });

    it('should create data directory if it does not exist', async () => {
      await rcm.init();
      expect(fs.mkdir).toHaveBeenCalledWith(testDataDir, { recursive: true });
    });
  });

  describe('regulation management', () => {
    it('should load a regulation', async () => {
      fs.readFile.mockResolvedValueOnce(JSON.stringify(hipaaRegulation));
      
      await rcm.loadRegulation('hipaa', path.join(__dirname, 'fixtures', 'hipaa.json'));
      const regulation = rcm.getRegulation('hipaa');
      
      expect(regulation).toMatchObject(hipaaRegulation);
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(__dirname, 'fixtures', 'hipaa.json'),
        'utf8'
      );
    });

    it('should throw error when loading invalid regulation', async () => {
      fs.readFile.mockResolvedValueOnce('invalid json');
      
      await expect(
        rcm.loadRegulation('invalid', 'invalid.json')
      ).rejects.toThrow('Invalid regulation format');
    });
  });

  describe('document management', () => {
    beforeEach(() => {
      // Mock document file operations
      fs.readdir.mockResolvedValueOnce(['doc1.json', 'doc2.json']);
      fs.readFile
        .mockResolvedValueOnce(JSON.stringify({
          ...protocolDocument,
          id: 'doc1',
          name: 'Protocol v1.0',
          type: 'PROTOCOL',
          status: 'APPROVED'
        }))
        .mockResolvedValueOnce(JSON.stringify({
          id: 'doc2',
          name: 'Informed Consent v1.0',
          type: 'INFORMED_CONSENT',
          status: 'DRAFT'
        }));
    });

    it('should list all documents', async () => {
      const documents = await rcm.listDocuments();
      expect(documents).toHaveLength(2);
      expect(documents[0]).toHaveProperty('name', 'Protocol v1.0');
      expect(documents[1]).toHaveProperty('name', 'Informed Consent v1.0');
    });

    it('should filter documents by type', async () => {
      const protocols = await rcm.listDocuments({ type: 'PROTOCOL' });
      expect(protocols).toHaveLength(1);
      expect(protocols[0]).toHaveProperty('type', 'PROTOCOL');
    });

    it('should filter documents by status', async () => {
      const drafts = await rcm.listDocuments({ status: 'DRAFT' });
      expect(drafts).toHaveLength(1);
      expect(drafts[0]).toHaveProperty('status', 'DRAFT');
    });
  });

  describe('document versioning', () => {
    const documentId = 'doc-123';
    const newVersion = {
      ...protocolDocument,
      id: documentId,
      version: '2.0',
      status: 'DRAFT',
      changeDescription: 'Updated inclusion criteria'
    };

    beforeEach(() => {
      // Mock document file operations
      fs.readFile.mockResolvedValue(JSON.stringify(protocolDocument));
      fs.readdir.mockResolvedValue([`${documentId}.json`]);
    });

    it('should create a new version of a document', async () => {
      await rcm.createDocumentVersion(documentId, newVersion, userId);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(documentId),
        expect.any(String),
        'utf8'
      );
      
      // Verify the written document has the new version
      const writtenContent = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenContent.version).toBe('2.0');
      expect(writtenContent.status).toBe('DRAFT');
      expect(writtenContent.updatedBy).toBe(userId);
      expect(writtenContent.updatedAt).toBeDefined();
    });

    it('should get document history', async () => {
      // Mock version history
      const version1 = { ...protocolDocument, version: '1.0', createdAt: '2023-01-01' };
      const version2 = { ...protocolDocument, version: '2.0', createdAt: '2023-02-01' };
      
      fs.readdir.mockResolvedValue([
        `${documentId}_v1.json`,
        `${documentId}_v2.json`
      ]);
      
      fs.readFile
        .mockResolvedValueOnce(JSON.stringify(version1))
        .mockResolvedValueOnce(JSON.stringify(version2));
      
      const history = await rcm.getDocumentHistory(documentId);
      
      expect(history).toHaveLength(2);
      expect(history[0]).toHaveProperty('version', '1.0');
      expect(history[1]).toHaveProperty('version', '2.0');
    });
  });

  describe('compliance checks', () => {
    beforeEach(async () => {
      // Load test regulation
      await rcm.loadRegulation('hipaa', path.join(__dirname, 'fixtures', 'hipaa.json'));
      
      // Mock document listing
      fs.readdir.mockResolvedValue(['doc1.json']);
      fs.readFile.mockResolvedValue(JSON.stringify({
        ...protocolDocument,
        status: 'APPROVED',
        metadata: {
          ...protocolDocument.metadata,
          approvalDate: '2023-01-15'
        }
      }));
    });

    it('should run compliance check for a study', async () => {
      const complianceReport = await rcm.runComplianceCheck(studyId);
      
      expect(complianceReport).toHaveProperty('studyId', studyId);
      expect(complianceReport).toHaveProperty('checks');
      expect(complianceReport.checks).toBeInstanceOf(Array);
      
      // Should include checks for all loaded regulations
      const hipaaChecks = complianceReport.checks.filter(c => c.regulationId === 'hipaa');
      expect(hipaaChecks.length).toBeGreaterThan(0);
    });

    it('should identify missing requirements', async () => {
      // Mock empty document list to simulate missing documents
      fs.readdir.mockResolvedValueOnce([]);
      
      const complianceReport = await rcm.runComplianceCheck(studyId);
      const failedChecks = complianceReport.checks.filter(c => c.status === 'FAILED');
      
      expect(failedChecks.length).toBeGreaterThan(0);
      expect(failedChecks[0]).toHaveProperty('message');
    });
  });

  describe('audit trail', () => {
    it('should log audit events', async () => {
      const eventListener = jest.fn();
      rcm.on('audit', eventListener);
      
      // Trigger an audit event
      await rcm.recordAuditEvent({
        eventType: 'DOCUMENT_UPLOADED',
        userId,
        metadata: {
          documentId: 'doc-123',
          documentName: 'Test Document'
        }
      });
      
      expect(eventListener).toHaveBeenCalledWith({
        eventType: 'DOCUMENT_UPLOADED',
        timestamp: expect.any(String),
        userId,
        metadata: {
          documentId: 'doc-123',
          documentName: 'Test Document'
        }
      });
    });
  });
});
