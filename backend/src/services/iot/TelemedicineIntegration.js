const { EventEmitter } = require('events');
const logger = require('../../config/logger');

class TelemedicineIntegration extends EventEmitter {
    constructor(iotMonitor) {
        super();
        this.iotMonitor = iotMonitor;
        this.activeConsultations = new Map();
        this.availableProviders = new Map();
        this.consultationHistory = new Map();
        this.mediaServers = [];
        
        // Initialize with some sample providers (in a real app, this would come from a database)
        this.initializeProviders();
    }
    
    initializeProviders() {
        // Add some sample healthcare providers
        this.addProvider({
            id: 'doc_john',
            name: 'Dr. John Smith',
            specialty: 'Cardiology',
            qualifications: ['MD, FACC'],
            languages: ['English', 'Spanish'],
            available: true,
            maxPatients: 5,
            currentPatients: 0,
            rating: 4.8,
            consultationFee: 150,
            avatar: 'https://example.com/avatars/dr_john.jpg',
            bio: 'Board-certified cardiologist with 15 years of experience.'
        });
        
        this.addProvider({
            id: 'doc_sarah',
            name: 'Dr. Sarah Johnson',
            specialty: 'Endocrinology',
            qualifications: ['MD, FACE'],
            languages: ['English', 'French'],
            available: true,
            maxPatients: 4,
            currentPatients: 0,
            rating: 4.9,
            consultationFee: 175,
            avatar: 'https://example.com/avatars/dr_sarah.jpg',
            bio: 'Specializing in diabetes and metabolic disorders.'
        });
        
        // Add more providers as needed...
    }
    
    // Provider management
    addProvider(provider) {
        if (this.availableProviders.has(provider.id)) {
            throw new Error(`Provider with ID ${provider.id} already exists`);
        }
        
        this.availableProviders.set(provider.id, {
            ...provider,
            available: provider.available !== false,
            currentPatients: 0,
            lastActive: new Date(),
            status: 'offline',
            createdAt: new Date()
        });
        
        logger.info(`Added provider: ${provider.name} (${provider.specialty})`);
    }
    
    updateProvider(providerId, updates) {
        const provider = this.availableProviders.get(providerId);
        
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        
        // Update provider properties
        const updatedProvider = {
            ...provider,
            ...updates,
            updatedAt: new Date()
        };
        
        this.availableProviders.set(providerId, updatedProvider);
        
        logger.info(`Updated provider: ${providerId}`);
        
        // Emit event if provider status changed
        if (updates.available !== undefined && updates.available !== provider.available) {
            this.emit('providerAvailabilityChanged', {
                providerId,
                available: updates.available,
                timestamp: new Date()
            });
        }
        
        return updatedProvider;
    }
    
    removeProvider(providerId) {
        if (!this.availableProviders.has(providerId)) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        
        const provider = this.availableProviders.get(providerId);
        
        // Check if provider has active consultations
        const activeConsults = Array.from(this.activeConsultations.values())
            .filter(c => c.providerId === providerId && c.status === 'in-progress');
            
        if (activeConsults.length > 0) {
            throw new Error('Cannot remove provider with active consultations');
        }
        
        this.availableProviders.delete(providerId);
        
        logger.info(`Removed provider: ${providerId}`);
        
        return { success: true };
    }
    
    // Consultation management
    async initiateConsultation(userId, options = {}) {
        const {
            providerId,
            reason,
            priority = 'normal',
            patientInfo = {},
            deviceId = null
        } = options;
        
        // Find an available provider
        const provider = providerId 
            ? this.availableProviders.get(providerId)
            : this.findAvailableProvider(priority);
            
        if (!provider || !provider.available) {
            throw new Error('No available providers at the moment');
        }
        
        // Check if provider can take more patients
        if (provider.currentPatients >= provider.maxPatients) {
            throw new Error('Provider is at maximum patient capacity');
        }
        
        // Create consultation
        const consultationId = `cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        
        const consultation = {
            id: consultationId,
            userId,
            providerId: provider.id,
            providerName: provider.name,
            providerSpecialty: provider.specialty,
            status: 'scheduled',
            priority,
            reason: reason || 'General consultation',
            patientInfo: {
                name: patientInfo.name || 'Patient',
                age: patientInfo.age,
                gender: patientInfo.gender,
                medicalHistory: patientInfo.medicalHistory || {}
            },
            deviceId,
            scheduledAt: now,
            startedAt: null,
            endedAt: null,
            duration: 0, // in minutes
            notes: [],
            vitals: [],
            prescriptions: [],
            recordings: [],
            diagnosis: null,
            followUp: null,
            payment: {
                status: 'pending',
                amount: provider.consultationFee,
                currency: 'USD',
                method: null,
                transactionId: null
            },
            metadata: {}
        };
        
        // Store the consultation
        this.activeConsultations.set(consultationId, consultation);
        
        // Update provider's patient count
        this.updateProvider(provider.id, {
            currentPatients: provider.currentPatients + 1,
            status: 'in-consultation'
        });
        
        logger.info(`Initiated consultation ${consultationId} for user ${userId} with provider ${provider.id}`);
        
        // Emit event
        this.emit('consultationInitiated', {
            consultationId,
            userId,
            providerId: provider.id,
            timestamp: now
        });
        
        // If this is an emergency, start the consultation immediately
        if (priority === 'emergency') {
            return this.startConsultation(consultationId);
        }
        
        // Otherwise, schedule a callback for the provider to accept
        this.scheduleProviderNotification(consultationId);
        
        return {
            consultationId,
            status: consultation.status,
            provider: {
                id: provider.id,
                name: provider.name,
                specialty: provider.specialty,
                avatar: provider.avatar,
                rating: provider.rating
            },
            estimatedWaitTime: this.calculateWaitTime(provider),
            nextSteps: 'Waiting for provider to accept the consultation'
        };
    }
    
    async startConsultation(consultationId) {
        const consultation = this.activeConsultations.get(consultationId);
        
        if (!consultation) {
            throw new Error('Consultation not found');
        }
        
        if (consultation.status === 'in-progress') {
            return consultation; // Already in progress
        }
        
        // Update consultation status
        consultation.status = 'in-progress';
        consultation.startedAt = consultation.startedAt || new Date();
        
        // Initialize WebRTC session or other communication channels
        const mediaSession = await this.initializeMediaSession(consultationId);
        
        // Add media session info to consultation
        consultation.mediaSession = mediaSession;
        
        // Emit event
        this.emit('consultationStarted', {
            consultationId,
            userId: consultation.userId,
            providerId: consultation.providerId,
            timestamp: new Date(),
            mediaSession
        });
        
        logger.info(`Started consultation ${consultationId}`);
        
        // Start monitoring vitals if device is connected
        if (consultation.deviceId) {
            this.startVitalsMonitoring(consultationId, consultation.deviceId);
        }
        
        return consultation;
    }
    
    async endConsultation(consultationId, options = {}) {
        const consultation = this.activeConsultations.get(consultationId);
        
        if (!consultation) {
            throw new Error('Consultation not found');
        }
        
        if (consultation.status === 'completed') {
            return consultation; // Already completed
        }
        
        // Update consultation status
        consultation.status = 'completed';
        consultation.endedAt = new Date();
        consultation.duration = Math.round((consultation.endedAt - consultation.startedAt) / 60000); // in minutes
        
        // Add any notes or diagnosis from the provider
        if (options.diagnosis) {
            consultation.diagnosis = options.diagnosis;
        }
        
        if (options.notes) {
            consultation.notes.push({
                type: 'provider_notes',
                content: options.notes,
                timestamp: new Date(),
                author: consultation.providerId
            });
        }
        
        // Process prescriptions if any
        if (options.prescriptions && Array.isArray(options.prescriptions)) {
            consultation.prescriptions = options.prescriptions;
        }
        
        // Schedule follow-up if needed
        if (options.followUp) {
            consultation.followUp = {
                scheduledFor: options.followUp.date,
                reason: options.followUp.reason || 'Follow-up consultation',
                status: 'scheduled'
            };
        }
        
        // Update payment status
        if (options.payment) {
            consultation.payment = {
                ...consultation.payment,
                ...options.payment,
                status: 'completed',
                completedAt: new Date()
            };
        }
        
        // Stop vitals monitoring
        if (this.vitalsMonitors && this.vitalsMonitors[consultationId]) {
            clearInterval(this.vitalsMonitors[consultationId]);
            delete this.vitalsMonitors[consultationId];
        }
        
        // Close media session
        if (consultation.mediaSession) {
            await this.closeMediaSession(consultation.mediaSession.id);
        }
        
        // Update provider's patient count
        const provider = this.availableProviders.get(consultation.providerId);
        if (provider) {
            this.updateProvider(provider.id, {
                currentPatients: Math.max(0, provider.currentPatients - 1),
                status: provider.currentPatients <= 1 ? 'available' : 'in-consultation'
            });
        }
        
        // Move to history
        this.consultationHistory.set(consultationId, consultation);
        this.activeConsultations.delete(consultationId);
        
        // Emit event
        this.emit('consultationEnded', {
            consultationId,
            userId: consultation.userId,
            providerId: consultation.providerId,
            timestamp: new Date(),
            duration: consultation.duration
        });
        
        logger.info(`Ended consultation ${consultationId} after ${consultation.duration} minutes`);
        
        return consultation;
    }
    
    // Media session management
    async initializeMediaSession(consultationId) {
        // In a real implementation, this would set up WebRTC or another media server
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Select a media server (round-robin for load balancing)
        const server = this.selectMediaServer();
        
        const mediaSession = {
            id: sessionId,
            consultationId,
            server,
            status: 'connecting',
            createdAt: new Date(),
            participants: {},
            capabilities: {
                audio: true,
                video: true,
                screenSharing: true,
                fileSharing: true,
                chat: true
            },
            // WebRTC connection details would go here
            webrtc: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    // Additional TURN/STUN servers would be here
                ]
            }
        };
        
        // Simulate connection establishment
        setTimeout(() => {
            mediaSession.status = 'connected';
            this.emit('mediaSessionConnected', {
                sessionId,
                consultationId,
                timestamp: new Date()
            });
        }, 1000);
        
        return mediaSession;
    }
    
    async closeMediaSession(sessionId) {
        // In a real implementation, this would close the WebRTC connection
        // and free up media server resources
        
        logger.info(`Closed media session ${sessionId}`);
        
        return { success: true };
    }
    
    selectMediaServer() {
        // Simple round-robin server selection
        // In a real implementation, this would consider server load, location, etc.
        if (this.mediaServers.length === 0) {
            // Default to a local server if none configured
            return {
                id: 'default',
                url: 'wss://media.medimind.example.com/ws',
                region: 'us-east-1',
                load: 0.2,
                capabilities: ['sfu', 'recording', 'transcoding']
            };
        }
        
        const server = this.mediaServers[this.currentServerIndex || 0];
        this.currentServerIndex = ((this.currentServerIndex || 0) + 1) % this.mediaServers.length;
        
        return server;
    }
    
    // Vitals monitoring
    startVitalsMonitoring(consultationId, deviceId) {
        if (!this.vitalsMonitors) {
            this.vitalsMonitors = {};
        }
        
        // Check if already monitoring
        if (this.vitalsMonitors[consultationId]) {
            return;
        }
        
        logger.info(`Starting vitals monitoring for consultation ${consultationId}`);
        
        // Set up periodic vitals updates
        this.vitalsMonitors[consultationId] = setInterval(async () => {
            try {
                const vitals = await this.iotMonitor.getLatestVitals(deviceId);
                
                if (vitals) {
                    this.updateConsultationVitals(consultationId, vitals);
                }
            } catch (error) {
                logger.error(`Error monitoring vitals for consultation ${consultationId}:`, error);
            }
        }, 30000); // Every 30 seconds
    }
    
    updateConsultationVitals(consultationId, vitals) {
        const consultation = this.activeConsultations.get(consultationId);
        
        if (!consultation) {
            return;
        }
        
        // Add vitals to consultation record
        consultation.vitals.push({
            timestamp: new Date(),
            values: vitals
        });
        
        // Emit event for real-time updates
        this.emit('vitalsUpdated', {
            consultationId,
            timestamp: new Date(),
            vitals
        });
    }
    
    // Provider management
    findAvailableProvider(priority = 'normal') {
        // Filter available providers by priority/specialty if needed
        const providers = Array.from(this.availableProviders.values())
            .filter(p => p.available && p.currentPatients < p.maxPatients);
        
        if (providers.length === 0) {
            return null;
        }
        
        // Simple round-robin for now, could be enhanced with more sophisticated scheduling
        if (!this.lastProviderIndex || this.lastProviderIndex >= providers.length - 1) {
            this.lastProviderIndex = 0;
        } else {
            this.lastProviderIndex++;
        }
        
        return providers[this.lastProviderIndex];
    }
    
    calculateWaitTime(provider) {
        // Simple estimation - could be enhanced with historical data
        const avgConsultationTime = 15; // minutes
        const positionInQueue = provider.currentPatients;
        
        return {
            estimatedMinutes: positionInQueue * avgConsultationTime,
            positionInQueue,
            timestamp: new Date()
        };
    }
    
    scheduleProviderNotification(consultationId) {
        // In a real implementation, this would send a push notification to the provider's device
        logger.info(`Scheduling notification to provider for consultation ${consultationId}`);
        
        // Simulate provider accepting the consultation after a delay
        setTimeout(() => {
            this.emit('providerNotificationSent', {
                consultationId,
                timestamp: new Date(),
                status: 'delivered'
            });
        }, 2000);
    }
    
    // Getters
    getActiveConsultations(userId = null) {
        const consultations = Array.from(this.activeConsultations.values());
        
        if (userId) {
            return consultations.filter(c => c.userId === userId || c.providerId === userId);
        }
        
        return consultations;
    }
    
    getConsultationHistory(userId, options = {}) {
        let history = Array.from(this.consultationHistory.values())
            .filter(c => c.userId === userId || c.providerId === userId);
        
        // Apply filters
        if (options.startDate) {
            const start = new Date(options.startDate);
            history = history.filter(c => new Date(c.startedAt) >= start);
        }
        
        if (options.endDate) {
            const end = new Date(options.endDate);
            history = history.filter(c => new Date(c.startedAt) <= end);
        }
        
        if (options.status) {
            history = history.filter(c => c.status === options.status);
        }
        
        // Sort by most recent first
        return history.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    }
    
    getAvailableProviders(specialty = null) {
        let providers = Array.from(this.availableProviders.values())
            .filter(p => p.available && p.currentPatients < p.maxPatients);
        
        if (specialty) {
            providers = providers.filter(p => 
                p.specialty.toLowerCase() === specialty.toLowerCase()
            );
        }
        
        return providers;
    }
    
    // Emergency consultation
    async initiateEmergencyConsultation(userId, options = {}) {
        // Find the first available provider who can handle emergencies
        const provider = this.findAvailableProvider('emergency');
        
        if (!provider) {
            throw new Error('No emergency providers available');
        }
        
        // Start the consultation immediately
        const consultation = await this.initiateConsultation(userId, {
            ...options,
            providerId: provider.id,
            priority: 'emergency'
        });
        
        // Start the consultation immediately
        return this.startConsultation(consultation.consultationId);
    }
}

module.exports = TelemedicineIntegration;
