const { expect } = require('chai');
const sinon = require('sinon');
const { EventEmitter } = require('events');

const TelemedicineIntegration = require('../../../../backend/src/services/iot/TelemedicineIntegration');

describe('TelemedicineIntegration', () => {
    let telemedicine;
    let mockIotMonitor;
    
    beforeEach(() => {
        // Create a mock IoT monitor
        mockIotMonitor = {
            sendDeviceNotification: sinon.stub().resolves(true),
            processDeviceData: sinon.stub().resolves({ processed: true })
        };
        
        // Create instance with test configuration
        telemedicine = new TelemedicineIntegration(mockIotMonitor, {
            maxActiveConsultations: 5,
            providerTimeout: 30000,
            vitalsUpdateInterval: 60000
        });
    });
    
    afterEach(() => {
        // Clean up
        if (telemedicine) {
            telemedicine.cleanup();
        }
    });
    
    describe('addProvider', () => {
        it('should add a new healthcare provider', () => {
            const providerId = 'provider1';
            const providerInfo = {
                name: 'Dr. Smith',
                specialty: 'Cardiology',
                available: true
            };
            
            const result = telemedicine.addProvider(providerId, providerInfo);
            
            // Verify the result
            expect(result.success).to.be.true;
            expect(telemedicine.providers.has(providerId)).to.be.true;
            
            const provider = telemedicine.providers.get(providerId);
            expect(provider.name).to.equal('Dr. Smith');
            expect(provider.specialty).to.equal('Cardiology');
            expect(provider.available).to.be.true;
        });
        
        it('should not add a provider with duplicate ID', () => {
            const providerId = 'duplicate-provider';
            const providerInfo = { name: 'Dr. Jones' };
            
            // First add should succeed
            const firstResult = telemedicine.addProvider(providerId, providerInfo);
            expect(firstResult.success).to.be.true;
            
            // Second add with same ID should fail
            const secondResult = telemedicine.addProvider(providerId, { name: 'Dr. Smith' });
            expect(secondResult.success).to.be.false;
            expect(secondResult.error).to.include('already exists');
        });
    });
    
    describe('updateProviderAvailability', () => {
        let providerId;
        
        beforeEach(() => {
            // Add a test provider
            providerId = 'test-provider';
            telemedicine.addProvider(providerId, {
                name: 'Dr. Test',
                available: true
            });
        });
        
        it('should update provider availability', () => {
            // Set to unavailable
            let result = telemedicine.updateProviderAvailability(providerId, false);
            expect(result.success).to.be.true;
            expect(telemedicine.providers.get(providerId).available).to.be.false;
            
            // Set back to available
            result = telemedicine.updateProviderAvailability(providerId, true);
            expect(result.success).to.be.true;
            expect(telemedicine.providers.get(providerId).available).to.be.true;
        });
        
        it('should return error for non-existent provider', () => {
            const result = telemedicine.updateProviderAvailability('nonexistent', true);
            expect(result.success).to.be.false;
            expect(result.error).to.include('not found');
        });
    });
    
    describe('requestConsultation', () => {
        let providerId;
        let patientId;
        
        beforeEach(() => {
            // Add an available provider
            providerId = 'test-provider';
            telemedicine.addProvider(providerId, {
                name: 'Dr. Test',
                specialty: 'General',
                available: true
            });
            
            // Set up test patient
            patientId = 'patient1';
        });
        
        it('should successfully initiate a consultation', async () => {
            const result = await telemedicine.requestConsultation({
                patientId,
                providerId,
                reason: 'Follow-up visit',
                priority: 'routine'
            });
            
            // Verify the result
            expect(result.success).to.be.true;
            expect(result.consultationId).to.be.a('string');
            
            // Verify the consultation was created
            const consultation = telemedicine.activeConsultations.get(result.consultationId);
            expect(consultation).to.exist;
            expect(consultation.status).to.equal('pending');
            expect(consultation.patientId).to.equal(patientId);
            expect(consultation.providerId).to.equal(providerId);
            
            // Verify provider is now in a consultation
            expect(telemedicine.providers.get(providerId).inConsultation).to.be.true;
        });
        
        it('should handle provider not available', async () => {
            // Make provider unavailable
            telemedicine.updateProviderAvailability(providerId, false);
            
            const result = await telemedicine.requestConsultation({
                patientId,
                providerId,
                reason: 'Urgent issue',
                priority: 'urgent'
            });
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('not available');
        });
        
        it('should handle provider already in a consultation', async () => {
            // Start a consultation
            await telemedicine.requestConsultation({
                patientId: 'another-patient',
                providerId,
                reason: 'First consultation',
                priority: 'routine'
            });
            
            // Try to start another consultation with same provider
            const result = await telemedicine.requestConsultation({
                patientId,
                providerId,
                reason: 'Second consultation',
                priority: 'routine'
            });
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('already in a consultation');
        });
    });
    
    describe('startConsultation', () => {
        let consultationId;
        let providerId;
        let patientId;
        
        beforeEach(async () => {
            // Set up a test provider and consultation
            providerId = 'test-provider';
            patientId = 'test-patient';
            
            telemedicine.addProvider(providerId, {
                name: 'Dr. Test',
                specialty: 'General',
                available: true
            });
            
            // Request a consultation
            const requestResult = await telemedicine.requestConsultation({
                patientId,
                providerId,
                reason: 'Test consultation',
                priority: 'routine'
            });
            
            consultationId = requestResult.consultationId;
        });
        
        it('should successfully start a pending consultation', async () => {
            const result = await telemedicine.startConsultation(consultationId, {
                mediaType: 'video',
                connectionDetails: { url: 'https://example.com/meeting/123' }
            });
            
            // Verify the result
            expect(result.success).to.be.true;
            
            // Verify the consultation status was updated
            const consultation = telemedicine.activeConsultations.get(consultationId);
            expect(consultation.status).to.equal('in-progress');
            expect(consultation.startTime).to.be.a('date');
            expect(consultation.mediaSession).to.exist;
            
            // Verify the media session was initialized
            expect(consultation.mediaSession.type).to.equal('video');
            expect(consultation.mediaSession.connectionDetails.url).to.include('example.com');
        });
        
        it('should not start a non-existent consultation', async () => {
            const result = await telemedicine.startConsultation('nonexistent-id', {
                mediaType: 'video',
                connectionDetails: {}
            });
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('not found');
        });
        
        it('should not start an already started consultation', async () => {
            // Start the consultation first
            await telemedicine.startConsultation(consultationId, {
                mediaType: 'video',
                connectionDetails: {}
            });
            
            // Try to start it again
            const result = await telemedicine.startConsultation(consultationId, {
                mediaType: 'video',
                connectionDetails: {}
            });
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('already started');
        });
    });
    
    describe('endConsultation', () => {
        let consultationId;
        let providerId;
        
        beforeEach(async () => {
            // Set up a test provider and consultation
            providerId = 'test-provider';
            const patientId = 'test-patient';
            
            telemedicine.addProvider(providerId, {
                name: 'Dr. Test',
                specialty: 'General',
                available: true
            });
            
            // Request and start a consultation
            const requestResult = await telemedicine.requestConsultation({
                patientId,
                providerId,
                reason: 'Test consultation',
                priority: 'routine'
            });
            
            consultationId = requestResult.consultationId;
            
            await telemedicine.startConsultation(consultationId, {
                mediaType: 'video',
                connectionDetails: {}
            });
        });
        
        it('should successfully end an active consultation', async () => {
            const result = await telemedicine.endConsultation(consultationId, {
                notes: 'Consultation completed successfully',
                diagnosis: 'Healthy',
                recommendations: ['Follow up in 3 months']
            });
            
            // Verify the result
            expect(result.success).to.be.true;
            
            // Verify the consultation was moved to history
            expect(telemedicine.activeConsultations.has(consultationId)).to.be.false;
            
            const completedConsultation = telemedicine.consultationHistory.find(
                c => c.consultationId === consultationId
            );
            
            expect(completedConsultation).to.exist;
            expect(completedConsultation.status).to.equal('completed');
            expect(completedConsultation.endTime).to.be.a('date');
            expect(completedConsultation.notes).to.include('completed successfully');
            
            // Verify provider is available again
            expect(telemedicine.providers.get(providerId).inConsultation).to.be.false;
        });
        
        it('should handle ending a non-existent consultation', async () => {
            const result = await telemedicine.endConsultation('nonexistent-id', {
                notes: 'Test notes'
            });
            
            // Verify the error result
            expect(result.success).to.be.false;
            expect(result.error).to.include('not found');
        });
    });
    
    describe('getConsultationStatus', () => {
        let consultationId;
        
        beforeEach(async () => {
            // Set up a test provider and consultation
            const providerId = 'test-provider';
            const patientId = 'test-patient';
            
            telemedicine.addProvider(providerId, {
                name: 'Dr. Test',
                specialty: 'General',
                available: true
            });
            
            // Request a consultation
            const requestResult = await telemedicine.requestConsultation({
                patientId,
                providerId,
                reason: 'Test consultation',
                priority: 'routine'
            });
            
            consultationId = requestResult.consultationId;
        });
        
        it('should return status of an active consultation', () => {
            const status = telemedicine.getConsultationStatus(consultationId);
            
            // Verify the status object
            expect(status).to.exist;
            expect(status.consultationId).to.equal(consultationId);
            expect(status.status).to.equal('pending');
            expect(status.patientId).to.equal('test-patient');
            expect(status.providerId).to.equal('test-provider');
        });
        
        it('should return undefined for non-existent consultation', () => {
            const status = telemedicine.getConsultationStatus('nonexistent-id');
            expect(status).to.be.undefined;
        });
    });
    
    describe('getPatientConsultations', () => {
        const patient1 = 'patient1';
        const patient2 = 'patient2';
        
        beforeEach(async () => {
            // Set up test providers
            telemedicine.addProvider('provider1', { name: 'Dr. One', available: true });
            telemedicine.addProvider('provider2', { name: 'Dr. Two', available: true });
            
            // Create some test consultations
            await telemedicine.requestConsultation({
                patientId: patient1,
                providerId: 'provider1',
                reason: 'First consultation',
                priority: 'routine'
            });
            
            await telemedicine.requestConsultation({
                patientId: patient1,
                providerId: 'provider2',
                reason: 'Second consultation',
                priority: 'urgent'
            });
            
            await telemedicine.requestConsultation({
                patientId: patient2,
                providerId: 'provider1',
                reason: 'Other patient',
                priority: 'routine'
            });
        });
        
        it('should return all consultations for a patient', () => {
            const consultations = telemedicine.getPatientConsultations(patient1);
            
            // Verify the result
            expect(consultations).to.be.an('array').with.lengthOf(2);
            expect(consultations.every(c => c.patientId === patient1)).to.be.true;
            
            // Should be sorted by request time (most recent first)
            expect(consultations[0].reason).to.equal('Second consultation');
            expect(consultations[1].reason).to.equal('First consultation');
        });
        
        it('should return an empty array for a patient with no consultations', () => {
            const consultations = telemedicine.getPatientConsultations('nonexistent-patient');
            expect(consultations).to.be.an('array').that.is.empty;
        });
    });
    
    describe('monitorPatientVitals', () => {
        let consultationId;
        let clock;
        
        beforeEach(() => {
            // Use fake timers
            clock = sinon.useFakeTimers();
            
            // Set up a test provider and consultation
            const providerId = 'test-provider';
            const patientId = 'test-patient';
            
            telemedicine.addProvider(providerId, {
                name: 'Dr. Test',
                specialty: 'General',
                available: true
            });
            
            // Request and start a consultation
            return telemedicine.requestConsultation({
                patientId,
                providerId,
                reason: 'Vitals monitoring test',
                priority: 'routine'
            }).then(result => {
                consultationId = result.consultationId;
                return telemedicine.startConsultation(consultationId, {
                    mediaType: 'video',
                    connectionDetails: {}
                });
            });
        });
        
        afterEach(() => {
            // Restore timers
            if (clock) {
                clock.restore();
            }
        });
        
        it('should periodically update vitals during a consultation', async () => {
            // Mock the vitals data
            const mockVitals = {
                heartRate: 72,
                bloodPressure: { systolic: 120, diastolic: 80 },
                oxygenSaturation: 98,
                timestamp: new Date()
            };
            
            // Set up the mock to return test vitals
            telemedicine.getPatientVitals = sinon.stub().resolves(mockVitals);
            
            // Start vitals monitoring
            const result = await telemedicine.monitorPatientVitals(consultationId, {
                interval: 1000, // 1 second for testing
                alertThresholds: {
                    heartRate: { min: 60, max: 100 },
                    bloodPressure: { min: 90, max: 140 },
                    oxygenSaturation: { min: 92, max: 100 }
                }
            });
            
            // Verify monitoring started
            expect(result.success).to.be.true;
            
            // Advance the clock to trigger the first update
            await clock.tick(1000);
            
            // Get the consultation to check vitals were updated
            const consultation = telemedicine.activeConsultations.get(consultationId);
            expect(consultation.vitals).to.exist;
            expect(consultation.vitals.heartRate).to.equal(72);
            
            // Advance the clock again for another update
            await clock.tick(1000);
            
            // Stop monitoring
            await telemedicine.stopVitalsMonitoring(consultationId);
        });
        
        it('should trigger alerts for abnormal vitals', async () => {
            // Set up a spy for the alert handler
            const alertSpy = sinon.spy();
            telemedicine.on('vitalsAlert', alertSpy);
            
            // Mock vitals with abnormal values
            const abnormalVitals = {
                heartRate: 45, // Too low
                bloodPressure: { systolic: 150, diastolic: 95 }, // High
                oxygenSaturation: 90, // Low
                timestamp: new Date()
            };
            
            // Set up the mock to return abnormal vitals
            telemedicine.getPatientVitals = sinon.stub().resolves(abnormalVitals);
            
            // Start vitals monitoring
            await telemedicine.monitorPatientVitals(consultationId, {
                interval: 1000,
                alertThresholds: {
                    heartRate: { min: 60, max: 100 },
                    bloodPressure: { min: 90, max: 140 },
                    oxygenSaturation: { min: 92, max: 100 }
                }
            });
            
            // Advance the clock to trigger the first update
            await clock.tick(1000);
            
            // Verify alerts were triggered
            expect(alertSpy.callCount).to.be.at.least(1);
            
            // Check that we got alerts for each abnormal vital
            const alertTypes = alertSpy.getCalls().map(call => call.args[0].type);
            expect(alertTypes).to.include.members(['heartRate', 'bloodPressure', 'oxygenSaturation']);
            
            // Stop monitoring
            await telemedicine.stopVitalsMonitoring(consultationId);
        });
    });
    
    describe('cleanup', () => {
        it('should clean up all resources', async () => {
            // Set up a test provider and consultation
            const providerId = 'test-provider';
            const patientId = 'test-patient';
            
            telemedicine.addProvider(providerId, {
                name: 'Dr. Test',
                specialty: 'General',
                available: true
            });
            
            // Request and start a consultation
            const requestResult = await telemedicine.requestConsultation({
                patientId,
                providerId,
                reason: 'Cleanup test',
                priority: 'routine'
            });
            
            const consultationId = requestResult.consultationId;
            
            await telemedicine.startConsultation(consultationId, {
                mediaType: 'video',
                connectionDetails: {}
            });
            
            // Start vitals monitoring
            await telemedicine.monitorPatientVitals(consultationId, {
                interval: 60000,
                alertThresholds: {}
            });
            
            // Verify we have active resources
            expect(telemedicine.activeConsultations.size).to.equal(1);
            expect(telemedicine.vitalsMonitors.size).to.equal(1);
            
            // Clean up
            await telemedicine.cleanup();
            
            // Verify all resources were cleaned up
            expect(telemedicine.activeConsultations.size).to.equal(0);
            expect(telemedicine.vitalsMonitors.size).to.equal(0);
            
            // Provider should be available again
            expect(telemedicine.providers.get(providerId).inConsultation).to.be.false;
        });
    });
});
