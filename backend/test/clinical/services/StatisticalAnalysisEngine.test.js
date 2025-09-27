const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const math = require('mathjs');
const { v4: uuidv4 } = require('uuid');
const StatisticalAnalysisEngine = require('../../../src/clinical/services/StatisticalAnalysisEngine');

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

// Mock mathjs for statistical functions
jest.mock('mathjs', () => {
  const actualMath = jest.requireActual('mathjs');
  return {
    ...actualMath,
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
    ttest: jest.fn().mockReturnValue({ pValue: 0.05, statistic: 1.96 }),
    anova: jest.fn().mockReturnValue({ pValue: 0.03, statistic: 3.5 }),
    chi2: jest.fn().mockReturnValue({ pValue: 0.01, statistic: 6.63 })
  };
});

describe('StatisticalAnalysisEngine', () => {
  let engine;
  const testDataDir = path.join(__dirname, 'test-stats-data');
  const studyId = 'STUDY-001';
  const userId = 'USER001';
  
  // Sample dataset
  const testDataset = {
    id: 'dataset-001',
    name: 'Vital Signs Baseline',
    description: 'Baseline vital signs for study participants',
    columns: [
      { name: 'participant_id', type: 'string' },
      { name: 'age', type: 'number' },
      { name: 'systolic_bp', type: 'number' },
      { name: 'diastolic_bp', type: 'number' },
      { name: 'treatment_group', type: 'string' }
    ],
    data: [
      { participant_id: 'P001', age: 45, systolic_bp: 120, diastolic_bp: 80, treatment_group: 'A' },
      { participant_id: 'P002', age: 52, systolic_bp: 135, diastolic_bp: 85, treatment_group: 'B' },
      { participant_id: 'P003', age: 38, systolic_bp: 128, diastolic_bp: 82, treatment_group: 'A' },
      { participant_id: 'P004', age: 61, systolic_bp: 142, diastolic_bp: 88, treatment_group: 'B' },
      { participant_id: 'P005', age: 47, systolic_bp: 118, diastolic_bp: 79, treatment_group: 'A' }
    ],
    metadata: {
      studyId: studyId,
      collectionDate: '2023-01-15',
      createdBy: userId
    }
  };

  // Analysis configuration
  const tTestConfig = {
    id: 'analysis-001',
    name: 'Treatment Group Comparison',
    description: 'Compare blood pressure between treatment groups',
    type: 'T_TEST',
    parameters: {
      variable: 'systolic_bp',
      groupBy: 'treatment_group',
      groups: ['A', 'B'],
      alternative: 'twoSided',
      alpha: 0.05
    },
    metadata: {
      studyId: studyId,
      createdBy: userId
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new StatisticalAnalysisEngine({ dataDir: testDataDir });
    
    // Mock file operations
    fs.readdir.mockResolvedValue([]);
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes('dataset-001')) {
        return Promise.resolve(JSON.stringify(testDataset));
      }
      if (filePath.includes('analysis-001')) {
        return Promise.resolve(JSON.stringify(tTestConfig));
      }
      return Promise.reject(new Error('File not found'));
    });
  });

  describe('initialization', () => {
    it('should initialize with default data directory if none provided', () => {
      const defaultEngine = new StatisticalAnalysisEngine();
      expect(defaultEngine.dataDir).toContain('data/stats');
    });

    it('should create data directory if it does not exist', async () => {
      await engine.init();
      expect(fs.mkdir).toHaveBeenCalledWith(testDataDir, { recursive: true });
    });
  });

  describe('dataset management', () => {
    it('should register a dataset', async () => {
      const datasetId = await engine.registerDataset(testDataset);
      expect(datasetId).toBeDefined();
      
      // Verify the dataset was saved
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(datasetId),
        expect.any(String),
        'utf8'
      );
      
      // Verify the saved content
      const savedContent = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(savedContent.name).toBe(testDataset.name);
      expect(savedContent.metadata.studyId).toBe(studyId);
    });

    it('should retrieve a dataset by ID', async () => {
      // Mock the file system to return our test dataset
      const datasetId = 'test-dataset';
      fs.readdir.mockResolvedValueOnce([`${datasetId}.json`]);
      
      const dataset = await engine.getDataset(datasetId);
      expect(dataset).toMatchObject({
        id: datasetId,
        name: testDataset.name,
        description: testDataset.description
      });
    });

    it('should list all datasets for a study', async () => {
      // Mock the file system to return multiple datasets
      fs.readdir.mockResolvedValueOnce(['dataset1.json', 'dataset2.json']);
      fs.readFile
        .mockResolvedValueOnce(JSON.stringify({
          id: 'dataset1',
          name: 'Dataset 1',
          metadata: { studyId: studyId }
        }))
        .mockResolvedValueOnce(JSON.stringify({
          id: 'dataset2',
          name: 'Dataset 2',
          metadata: { studyId: 'OTHER-STUDY' }
        }));
      
      const datasets = await engine.listDatasets(studyId);
      expect(datasets).toHaveLength(1);
      expect(datasets[0].name).toBe('Dataset 1');
    });
  });

  describe('analysis management', () => {
    it('should create an analysis configuration', async () => {
      const analysisId = await engine.createAnalysis(tTestConfig);
      expect(analysisId).toBeDefined();
      
      // Verify the analysis was saved
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(analysisId),
        expect.any(String),
        'utf8'
      );
      
      // Verify the saved content
      const savedContent = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(savedContent.name).toBe(tTestConfig.name);
      expect(savedContent.type).toBe('T_TEST');
    });

    it('should run a t-test analysis', async () => {
      // Register the test dataset
      const datasetId = await engine.registerDataset(testDataset);
      
      // Create an analysis configuration
      const analysisId = await engine.createAnalysis({
        ...tTestConfig,
        parameters: {
          ...tTestConfig.parameters,
          datasetId: datasetId
        }
      });
      
      // Run the analysis
      const result = await engine.runAnalysis(analysisId);
      
      // Check the result structure
      expect(result).toHaveProperty('analysisId', analysisId);
      expect(result).toHaveProperty('status', 'COMPLETED');
      expect(result).toHaveProperty('result');
      
      // Check that mock functions were called with expected arguments
      expect(math.ttest).toHaveBeenCalled();
      
      // Check that the result was saved
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(`result_${analysisId}`),
        expect.any(String),
        'utf8'
      );
    });

    it('should run a descriptive statistics analysis', async () => {
      // Register the test dataset
      const datasetId = await engine.registerDataset(testDataset);
      
      // Create a descriptive stats analysis configuration
      const analysisId = await engine.createAnalysis({
        id: 'desc-stats-001',
        name: 'Descriptive Statistics',
        description: 'Calculate basic statistics for systolic BP',
        type: 'DESCRIPTIVE_STATS',
        parameters: {
          datasetId: datasetId,
          variables: ['systolic_bp', 'diastolic_bp']
        },
        metadata: {
          studyId: studyId,
          createdBy: userId
        }
      });
      
      // Run the analysis
      const result = await engine.runAnalysis(analysisId);
      
      // Check the result structure
      expect(result).toHaveProperty('analysisId', analysisId);
      expect(result).toHaveProperty('status', 'COMPLETED');
      expect(result).toHaveProperty('result');
      
      // Check that the result contains expected statistics
      const stats = result.result['systolic_bp'];
      expect(stats).toHaveProperty('mean');
      expect(stats).toHaveProperty('median');
      expect(stats).toHaveProperty('std');
      expect(stats).toHaveProperty('min');
      expect(stats).toHaveProperty('max');
      expect(stats).toHaveProperty('count');
    });
  });

  describe('report generation', () => {
    it('should generate a statistical report', async () => {
      // Register the test dataset
      const datasetId = await engine.registerDataset(testDataset);
      
      // Create an analysis configuration
      const analysisId = await engine.createAnalysis({
        ...tTestConfig,
        parameters: {
          ...tTestConfig.parameters,
          datasetId: datasetId
        }
      });
      
      // Run the analysis
      await engine.runAnalysis(analysisId);
      
      // Generate a report
      const report = await engine.generateReport(analysisId, 'PDF');
      
      // Check the report structure
      expect(report).toHaveProperty('analysisId', analysisId);
      expect(report).toHaveProperty('format', 'PDF');
      expect(report).toHaveProperty('content');
      
      // Check that the report was saved
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(`report_${analysisId}`),
        expect.any(String),
        'utf8'
      );
    });
  });

  describe('event emission', () => {
    it('should emit analysis started and completed events', async () => {
      const eventListener = jest.fn();
      engine.on('analysis:started', eventListener);
      engine.on('analysis:completed', eventListener);
      
      // Register the test dataset
      const datasetId = await engine.registerDataset(testDataset);
      
      // Create and run an analysis
      const analysisId = await engine.createAnalysis({
        ...tTestConfig,
        parameters: {
          ...tTestConfig.parameters,
          datasetId: datasetId
        }
      });
      
      await engine.runAnalysis(analysisId);
      
      // Check that both events were emitted
      expect(eventListener).toHaveBeenCalledTimes(2);
      expect(eventListener).toHaveBeenNthCalledWith(1, expect.objectContaining({
        eventType: 'analysis:started',
        analysisId
      }));
      expect(eventListener).toHaveBeenNthCalledWith(2, expect.objectContaining({
        eventType: 'analysis:completed',
        analysisId,
        status: 'COMPLETED'
      }));
    });
  });
});
