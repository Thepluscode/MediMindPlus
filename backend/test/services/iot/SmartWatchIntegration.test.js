const { expect } = require('chai');
const sinon = require('sinon');
const { EventEmitter } = require('events');

const SmartWatchIntegration = require('../../../../backend/src/services/iot/SmartWatchIntegration');

describe('SmartWatchIntegration', () => {
    let smartWatch;
    let mockIotMonitor;
    
    beforeEach(() => {
        // Create a mock IoT monitor
        mockIotMonitor = {
            sendDeviceNotification: sinon.stub().resolves(true),
            processDeviceData: sinon.stub().resolves({ processed: true })
        };
        
        // Create instance with test configuration
        smartWatch = new SmartWatchIntegration(mockIotMonitor, {
            updateInterval: 60000, // 1 minute for testing
            maxRetryAttempts: 3,
            retryDelay: 1000
        });
    });
    
    afterEach(() => {
        // Clean up
        if (smartWatch) {
            smartWatch.cleanup();
        }
    });
    
    describe('connectDevice', () => {
        it('should connect to an Apple Watch', async () => {
            const deviceId = 'apple-watch-123';
            const connectionParams = {
                type: 'apple',
                deviceName: 'Test Apple Watch',
                userId: 'user1',
                authToken: 'test-auth-token'
            };
            
            const result = await smartWatch.connectDevice(deviceId, connectionParams);
            
            // Verify the device was added to connected devices
            expect(smartWatch.connectedDevices.has(deviceId)).to.be.true;
            
            const device = smartWatch.connectedDevices.get(deviceId);
            expect(device.type).to.equal('apple');
            expect(device.status).to.equal('connected');
            expect(device.capabilities).to.include.members(['heart_rate', 'activity', 'workout']);
            
            // Verify the result
            expect(result.success).to.be.true;
            expect(result.deviceId).to.equal(deviceId);
            expect(result.capabilities).to.include.members(['heart_rate', 'activity', 'workout']);
        });
        
        it('should connect to a Samsung Galaxy Watch', async () => {
            const deviceId = 'samsung-watch-456';
            const connectionParams = {
                type: 'samsung',
                deviceName: 'Test Galaxy Watch',
                userId: 'user1',
                authToken: 'test-samsung-token'
            };
            
            const result = await smartWatch.connectDevice(deviceId, connectionParams);
            
            // Verify the device was added to connected devices
            expect(smartWatch.connectedDevices.has(deviceId)).to.be.true;
            
            const device = smartWatch.connectedDevices.get(deviceId);
            expect(device.type).to.equal('samsung');
            expect(device.status).to.equal('connected');
            
            // Verify the result
            expect(result.success).to.be.true;
            expect(result.deviceId).to.equal(deviceId);
        });
        
        it('should fail with invalid device type', async () => {
            const deviceId = 'invalid-device-123';
            const connectionParams = {
                type: 'invalid_type',
                deviceName: 'Invalid Device',
                userId: 'user1'
            };
            
            const result = await smartWatch.connectDevice(deviceId, connectionParams);
            
            // Verify the device was not added
            expect(smartWatch.connectedDevices.has(deviceId)).to.be.false;
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('Unsupported device type');
        });
    });
    
    describe('synchronizeData', () => {
        let deviceId;
        
        beforeEach(() => {
            // Set up a connected device
            deviceId = 'test-watch-123';
            smartWatch.connectedDevices.set(deviceId, {
                type: 'apple',
                deviceName: 'Test Watch',
                userId: 'user1',
                status: 'connected',
                lastSync: null,
                syncInProgress: false,
                capabilities: ['heart_rate', 'activity', 'sleep']
            });
        });
        
        it('should synchronize data for a connected device', async () => {
            const result = await smartWatch.synchronizeData(deviceId);
            
            // Verify the sync was successful
            expect(result.success).to.be.true;
            expect(result.deviceId).to.equal(deviceId);
            expect(result.data).to.have.property('heart_rate');
            expect(result.data).to.have.property('activity');
            
            // Verify the device was updated
            const device = smartWatch.connectedDevices.get(deviceId);
            expect(device.lastSync).to.be.a('date');
            expect(device.syncInProgress).to.be.false;
            
            // Verify processDeviceData was called
            expect(mockIotMonitor.processDeviceData.calledOnce).to.be.true;
        });
        
        it('should handle sync errors gracefully', async () => {
            // Force a sync error
            smartWatch.connectedDevices.get(deviceId).type = 'error';
            
            const result = await smartWatch.synchronizeData(deviceId);
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('Failed to synchronize');
            
            // Verify the device was marked as not syncing
            const device = smartWatch.connectedDevices.get(deviceId);
            expect(device.syncInProgress).to.be.false;
        });
        
        it('should not allow concurrent syncs', async () => {
            // Start a sync
            smartWatch.connectedDevices.get(deviceId).syncInProgress = true;
            
            const result = await smartWatch.synchronizeData(deviceId);
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('already in progress');
        });
    });
    
    describe('disconnectDevice', () => {
        let deviceId;
        
        beforeEach(() => {
            // Set up a connected device
            deviceId = 'test-watch-123';
            smartWatch.connectedDevices.set(deviceId, {
                type: 'apple',
                deviceName: 'Test Watch',
                userId: 'user1',
                status: 'connected',
                lastSync: new Date(),
                syncInProgress: false,
                capabilities: ['heart_rate', 'activity']
            });
            
            // Mock the disconnect method
            smartWatch._disconnectDevice = sinon.stub().resolves(true);
        });
        
        it('should disconnect a connected device', async () => {
            const result = await smartWatch.disconnectDevice(deviceId);
            
            // Verify the result
            expect(result.success).to.be.true;
            expect(result.deviceId).to.equal(deviceId);
            
            // Verify the device was removed
            expect(smartWatch.connectedDevices.has(deviceId)).to.be.false;
            
            // Verify the disconnect method was called
            expect(smartWatch._disconnectDevice.calledOnce).to.be.true;
        });
        
        it('should handle disconnection errors', async () => {
            // Force a disconnect error
            smartWatch._disconnectDevice.rejects(new Error('Disconnect failed'));
            
            const result = await smartWatch.disconnectDevice(deviceId);
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('Failed to disconnect');
            
            // Verify the device was still removed (cleanup)
            expect(smartWatch.connectedDevices.has(deviceId)).to.be.false;
        });
    });
    
    describe('getDeviceStatus', () => {
        let deviceId;
        
        beforeEach(() => {
            // Set up a connected device
            deviceId = 'test-watch-123';
            smartWatch.connectedDevices.set(deviceId, {
                type: 'apple',
                deviceName: 'Test Watch',
                userId: 'user1',
                status: 'connected',
                lastSync: new Date('2023-05-15T12:00:00Z'),
                batteryLevel: 85,
                syncInProgress: false,
                capabilities: ['heart_rate', 'activity']
            });
        });
        
        it('should return status for a connected device', () => {
            const status = smartWatch.getDeviceStatus(deviceId);
            
            // Verify the status object
            expect(status).to.exist;
            expect(status.deviceId).to.equal(deviceId);
            expect(status.status).to.equal('connected');
            expect(status.batteryLevel).to.equal(85);
            expect(status.capabilities).to.include.members(['heart_rate', 'activity']);
            expect(status.lastSync).to.be.a('string');
        });
        
        it('should return undefined for unknown device', () => {
            const status = smartWatch.getDeviceStatus('nonexistent-device');
            expect(status).to.be.undefined;
        });
    });
    
    describe('getConnectedDevices', () => {
        beforeEach(() => {
            // Set up some connected devices
            smartWatch.connectedDevices.set('device1', {
                type: 'apple',
                deviceName: 'Apple Watch 1',
                userId: 'user1',
                status: 'connected',
                lastSync: new Date('2023-05-15T12:00:00Z')
            });
            
            smartWatch.connectedDevices.set('device2', {
                type: 'samsung',
                deviceName: 'Galaxy Watch 1',
                userId: 'user1',
                status: 'connected',
                lastSync: new Date('2023-05-15T11:30:00Z')
            });
            
            smartWatch.connectedDevices.set('device3', {
                type: 'fitbit',
                deviceName: 'Fitbit 1',
                userId: 'user2',
                status: 'connected',
                lastSync: new Date('2023-05-15T10:15:00Z')
            });
        });
        
        it('should return all devices for a user', () => {
            const devices = smartWatch.getConnectedDevices('user1');
            
            // Verify the result
            expect(devices).to.be.an('array').with.lengthOf(2);
            expect(devices.some(d => d.deviceName === 'Apple Watch 1')).to.be.true;
            expect(devices.some(d => d.deviceName === 'Galaxy Watch 1')).to.be.true;
        });
        
        it('should return an empty array for a user with no devices', () => {
            const devices = smartWatch.getConnectedDevices('nonexistent-user');
            expect(devices).to.be.an('array').that.is.empty;
        });
    });
    
    describe('cleanup', () => {
        it('should disconnect all devices and clear intervals', async () => {
            // Set up some connected devices
            const device1 = 'device1';
            const device2 = 'device2';
            
            smartWatch.connectedDevices.set(device1, {
                type: 'apple',
                status: 'connected'
            });
            
            smartWatch.connectedDevices.set(device2, {
                type: 'samsung',
                status: 'connected'
            });
            
            // Mock the disconnect method
            smartWatch._disconnectDevice = sinon.stub().resolves(true);
            
            // Set up a sync interval
            smartWatch.syncInterval = setInterval(() => {}, 60000);
            
            // Clean up
            await smartWatch.cleanup();
            
            // Verify all devices were disconnected
            expect(smartWatch._disconnectDevice.callCount).to.equal(2);
            
            // Verify the interval was cleared
            expect(smartWatch.syncInterval).to.be.null;
            
            // Verify connected devices map is empty
            expect(smartWatch.connectedDevices.size).to.equal(0);
        });
    });
});
