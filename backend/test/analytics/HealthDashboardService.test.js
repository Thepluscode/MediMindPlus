const { describe, it, expect, beforeAll, afterAll, jest } = require('@jest/globals');
const HealthDashboardService = require('../../src/analytics/dashboards/HealthDashboardService');
const dashboardConfig = require('../../src/config/dashboard.config');

// Mock external dependencies
jest.mock('@influxdata/influxdb-client');
jest.mock('@redis/client');
jest.mock('d3-node');
jest.mock('sharp');
jest.mock('pdfkit');
jest.mock('canvas');

describe('HealthDashboardService', () => {
    let dashboardService;
    let mockRedisClient;
    let mockInfluxDB;

    beforeAll(() => {
        // Setup mock Redis client
        mockRedisClient = {
            connect: jest.fn().mockResolvedValue(undefined),
            get: jest.fn(),
            setex: jest.fn().mockResolvedValue('OK'),
            quit: jest.fn().mockResolvedValue(undefined)
        };
        
        // Setup mock InfluxDB client
        mockInfluxDB = {
            getQueryApi: jest.fn().mockReturnValue({
                collectRows: jest.fn().mockResolvedValue([])
            })
        };
        
        // Create test config
        const testConfig = {
            ...dashboardConfig,
            redis: { url: 'redis://test:6379' },
            influxdb: { url: 'http://test:8086' }
        };
        
        // Initialize service with mocks
        dashboardService = new HealthDashboardService(testConfig);
        
        // Replace dependencies with mocks
        dashboardService.redisClient = mockRedisClient;
        dashboardService.influxDB = mockInfluxDB;
    });
    
    afterAll(async () => {
        await dashboardService.shutdown();
    });
    
    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            await expect(dashboardService.initialize()).resolves.not.toThrow();
            expect(mockRedisClient.connect).toHaveBeenCalled();
        });
        
        it('should load dashboard templates', async () => {
            await dashboardService.initialize();
            const templates = Array.from(dashboardService.dashboards.keys());
            expect(templates).toContain('patient_overview');
            expect(templates).toContain('provider_dashboard');
        });
    });
    
    describe('Dashboard Management', () => {
        const testUserId = 'user123';
        const testTemplateId = 'patient_overview';
        let testDashboardId;
        
        it('should create a new dashboard', async () => {
            mockRedisClient.get.mockResolvedValueOnce(null);
            
            const dashboard = await dashboardService.createDashboard(
                testUserId,
                testTemplateId,
                { name: 'Test Dashboard' }
            );
            
            expect(dashboard).toHaveProperty('id');
            expect(dashboard.userId).toBe(testUserId);
            expect(dashboard.templateId).toBe(testTemplateId);
            
            testDashboardId = dashboard.id;
            expect(mockRedisClient.setex).toHaveBeenCalled();
        });
        
        it('should retrieve a dashboard by ID', async () => {
            const testDashboard = { id: testDashboardId, userId: testUserId };
            mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(testDashboard));
            
            const dashboard = await dashboardService.getDashboard(testDashboardId);
            expect(dashboard).toEqual(testDashboard);
        });
        
        it('should update a dashboard', async () => {
            const updates = { name: 'Updated Dashboard Name' };
            const updatedDashboard = { id: testDashboardId, ...updates };
            
            mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({
                id: testDashboardId,
                userId: testUserId
            }));
            
            mockRedisClient.setex.mockResolvedValueOnce('OK');
            
            const result = await dashboardService.updateDashboard(
                testDashboardId,
                updates
            );
            
            expect(result).toMatchObject(updates);
            expect(mockRedisClient.setex).toHaveBeenCalled();
        });
    });
    
    describe('Widget Data', () => {
        it('should get widget data for vital signs chart', async () => {
            const testData = [
                { _time: new Date(), heart_rate: 72, blood_pressure_systolic: 120 }
            ];
            
            const mockQueryApi = {
                collectRows: jest.fn().mockResolvedValue(testData)
            };
            
            dashboardService.influxDB.getQueryApi = jest.fn().mockReturnValue(mockQueryApi);
            
            const result = await dashboardService.getVitalSignsData('user123', '24h');
            
            expect(result).toHaveProperty('chartType', 'line');
            expect(result.datasets).toHaveLength(2);
            expect(mockQueryApi.collectRows).toHaveBeenCalled();
        });
        
        it('should handle errors when getting widget data', async () => {
            dashboardService.influxDB.getQueryApi = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });
            
            const result = await dashboardService.getVitalSignsData('user123', '24h');
            expect(result).toHaveProperty('error');
        });
    });
    
    describe('Export Functionality', () => {
        it('should export dashboard as PDF', async () => {
            const testDashboard = {
                id: 'test-export',
                name: 'Test Export',
                widgets: [
                    { type: 'vital_signs_chart', data: { chartType: 'line' } }
                ]
            };
            
            mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(testDashboard));
            
            const pdfData = await dashboardService.exportDashboard('test-export', 'pdf');
            expect(pdfData).toBeInstanceOf(Buffer);
        });
    });
});
