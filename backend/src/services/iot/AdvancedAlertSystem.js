const { EventEmitter } = require('events');
const logger = require('../../config/logger');

class AdvancedAlertSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        this.alertRules = new Map();
        this.activeAlerts = new Map();
        this.escalationPaths = new Map();
        this.acknowledgedAlerts = new Set();
        
        this.initializeAlertRules();
        this.initializeEscalationPaths();
    }
    
    initializeAlertRules() {
        // Critical vital sign thresholds
        this.alertRules.set('heart_rate_critical', {
            condition: (value) => value < 40 || value > 150,
            severity: 'critical',
            message: 'Critical heart rate detected',
            escalationTime: 60000, // 1 minute
            requiresAcknowledgment: true
        });
        
        this.alertRules.set('blood_pressure_critical', {
            condition: (sys, dia) => sys > 180 || dia > 120,
            severity: 'critical',
            message: 'Hypertensive crisis detected',
            escalationTime: 30000, // 30 seconds
            requiresAcknowledgment: true
        });
        
        this.alertRules.set('oxygen_saturation_critical', {
            condition: (value) => value < 88,
            severity: 'critical',
            message: 'Critical oxygen saturation',
            escalationTime: 30000,
            requiresAcknowledgment: true
        });
        
        // Warning thresholds
        this.alertRules.set('heart_rate_warning', {
            condition: (value) => (value > 100 && value <= 120) || (value >= 50 && value < 60),
            severity: 'warning',
            message: 'Abnormal heart rate detected',
            escalationTime: 300000, // 5 minutes
            requiresAcknowledgment: false
        });
        
        this.alertRules.set('temperature_high', {
            condition: (value) => value > 38.0, // 100.4°F
            severity: 'warning',
            message: 'Elevated body temperature',
            escalationTime: 300000,
            requiresAcknowledgment: false
        });
    }
    
    initializeEscalationPaths() {
        // Critical alerts: immediate notification with rapid escalation
        this.escalationPaths.set('critical', [
            { method: 'push_notification', delay: 0, message: 'Immediate attention required' },
            { method: 'sms', delay: 30000, message: 'Urgent: Medical attention needed' },
            { method: 'phone_call', delay: 60000, message: 'Emergency call initiated' },
            { method: 'emergency_services', delay: 180000, message: 'Contacting emergency services' }
        ]);
        
        // Warning alerts: less urgent notifications
        this.escalationPaths.set('warning', [
            { method: 'push_notification', delay: 0, message: 'Health alert' },
            { method: 'email', delay: 300000, message: 'Health alert follow-up' }
        ]);
        
        // Info alerts: non-urgent notifications
        this.escalationPaths.set('info', [
            { method: 'in_app_notification', delay: 0, message: 'Health update' }
        ]);
    }
    
    async checkVitalSigns(vitals, userId) {
        const alerts = [];
        
        // Check heart rate
        if (vitals.heart_rate?.value !== undefined) {
            const hrValue = vitals.heart_rate.value;
            
            // Check critical threshold first
            const criticalRule = this.alertRules.get('heart_rate_critical');
            if (criticalRule.condition(hrValue)) {
                alerts.push(this.createAlert('heart_rate_critical', userId, {
                    value: hrValue,
                    threshold: 'HR < 40 or > 150 bpm',
                    severity: 'critical'
                }));
            } 
            // Then check warning threshold
            else {
                const warningRule = this.alertRules.get('heart_rate_warning');
                if (warningRule.condition(hrValue)) {
                    alerts.push(this.createAlert('heart_rate_warning', userId, {
                        value: hrValue,
                        threshold: '50 < HR < 60 or 100 < HR < 120 bpm',
                        severity: 'warning'
                    }));
                }
            }
        }
        
        // Check blood pressure
        if (vitals.blood_pressure_systolic?.value !== undefined && 
            vitals.blood_pressure_diastolic?.value !== undefined) {
            
            const sys = vitals.blood_pressure_systolic.value;
            const dia = vitals.blood_pressure_diastolic.value;
            
            const rule = this.alertRules.get('blood_pressure_critical');
            if (rule.condition(sys, dia)) {
                alerts.push(this.createAlert('blood_pressure_critical', userId, {
                    systolic: sys,
                    diastolic: dia,
                    threshold: 'SYS > 180 or DIA > 120',
                    severity: 'critical'
                }));
            }
        }
        
        // Check oxygen saturation
        if (vitals.oxygen_saturation?.value !== undefined) {
            const spo2 = vitals.oxygen_saturation.value;
            const rule = this.alertRules.get('oxygen_saturation_critical');
            
            if (rule.condition(spo2)) {
                alerts.push(this.createAlert('oxygen_saturation_critical', userId, {
                    value: spo2,
                    threshold: 'SpO2 < 88%',
                    severity: 'critical'
                }));
            }
        }
        
        // Check temperature
        if (vitals.temperature?.value !== undefined) {
            const temp = vitals.temperature.value;
            const rule = this.alertRules.get('temperature_high');
            
            if (rule.condition(temp)) {
                alerts.push(this.createAlert('temperature_high', userId, {
                    value: temp,
                    threshold: '> 38.0°C (100.4°F)',
                    severity: 'warning'
                }));
            }
        }
        
        // Process all generated alerts
        for (const alert of alerts) {
            await this.triggerAlert(alert);
        }
        
        return alerts;
    }
    
    createAlert(ruleId, userId, data) {
        const rule = this.alertRules.get(ruleId);
        const timestamp = new Date();
        
        return {
            id: `alert_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: ruleId,
            userId: userId,
            severity: rule.severity,
            message: rule.message,
            data: data,
            timestamp: timestamp,
            status: 'active',
            acknowledged: false,
            requiresAcknowledgment: rule.requiresAcknowledgment || false,
            escalationLevel: 0,
            escalationPath: this.escalationPaths.get(rule.severity) || []
        };
    }
    
    async triggerAlert(alert) {
        // Check if a similar alert is already active
        const activeAlertKey = `${alert.userId}_${alert.ruleId}`;
        if (this.activeAlerts.has(activeAlertKey)) {
            const existingAlert = this.activeAlerts.get(activeAlertKey);
            
            // If the alert is already acknowledged, don't re-trigger it
            if (existingAlert.acknowledged) {
                return;
            }
            
            // Update the existing alert
            alert = { ...existingAlert, ...alert };
        }
        
        // Store the alert
        this.activeAlerts.set(alert.id, alert);
        
        // Log the alert
        logger[alert.severity === 'critical' ? 'error' : 'warn'](
            `Health alert triggered: ${alert.message} for user ${alert.userId}`,
            { alertId: alert.id, ...alert.data }
        );
        
        // Emit the alert
        this.emit('alert', alert);
        
        // Start the escalation process if needed
        if (alert.requiresAcknowledgment) {
            this.startEscalation(alert);
        }
    }
    
    startEscalation(alert) {
        const escalationPath = alert.escalationPath;
        if (!escalationPath || escalationPath.length === 0) {
            return;
        }
        
        // Process each step in the escalation path
        escalationPath.forEach((step, index) => {
            const timer = setTimeout(async () => {
                // Skip if alert is no longer active or has been acknowledged
                if (!this.activeAlerts.has(alert.id) || this.acknowledgedAlerts.has(alert.id)) {
                    return;
                }
                
                // Update the escalation level
                alert.escalationLevel = index + 1;
                
                // Execute the escalation step
                await this.executeEscalationStep(alert, step);
                
                // Update the alert
                this.activeAlerts.set(alert.id, alert);
                
                // Emit an update
                this.emit('alertUpdated', alert);
                
            }, step.delay);
            
            // Store the timer so it can be cleared if needed
            if (!alert.timers) {
                alert.timers = [];
            }
            alert.timers.push(timer);
        });
    }
    
    async executeEscalationStep(alert, step) {
        logger.info(`Executing escalation step: ${step.method} for alert ${alert.id}`);
        
        switch (step.method) {
            case 'push_notification':
                await this.sendPushNotification(alert, step.message);
                break;
                
            case 'sms':
                await this.sendSMS(alert, step.message);
                break;
                
            case 'email':
                await this.sendEmail(alert, step.message);
                break;
                
            case 'phone_call':
                await this.makePhoneCall(alert, step.message);
                break;
                
            case 'emergency_services':
                await this.contactEmergencyServices(alert, step.message);
                break;
                
            case 'in_app_notification':
                await this.sendInAppNotification(alert, step.message);
                break;
                
            default:
                logger.warn(`Unknown escalation method: ${step.method}`);
        }
    }
    
    // Notification methods (stubs - implement with actual services)
    async sendPushNotification(alert, message) {
        logger.info(`Sending push notification: ${message}`, { alertId: alert.id });
        // Implementation would use a push notification service like Firebase Cloud Messaging
    }
    
    async sendSMS(alert, message) {
        logger.info(`Sending SMS: ${message}`, { alertId: alert.id });
        // Implementation would use an SMS service like Twilio
    }
    
    async sendEmail(alert, message) {
        logger.info(`Sending email: ${message}`, { alertId: alert.id });
        // Implementation would use an email service like SendGrid or AWS SES
    }
    
    async makePhoneCall(alert, message) {
        logger.info(`Initiating phone call: ${message}`, { alertId: alert.id });
        // Implementation would use a voice calling service like Twilio
    }
    
    async contactEmergencyServices(alert, message) {
        logger.warn(`Contacting emergency services: ${message}`, { alertId: alert.id });
        // Implementation would contact emergency services with user location and details
    }
    
    async sendInAppNotification(alert, message) {
        logger.info(`Sending in-app notification: ${message}`, { alertId: alert.id });
        // Implementation would send a notification to the user's app
    }
    
    // Alert management
    async acknowledgeAlert(alertId, userId) {
        const alert = this.activeAlerts.get(alertId);
        
        if (!alert) {
            throw new Error('Alert not found');
        }
        
        if (alert.userId !== userId) {
            throw new Error('Unauthorized to acknowledge this alert');
        }
        
        // Mark as acknowledged
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date();
        alert.status = 'acknowledged';
        
        // Clear any pending escalation timers
        if (alert.timers) {
            alert.timers.forEach(timer => clearTimeout(timer));
            delete alert.timers;
        }
        
        // Update storage
        this.acknowledgedAlerts.add(alertId);
        this.activeAlerts.delete(alertId);
        
        // Emit event
        this.emit('alertAcknowledged', alert);
        
        logger.info(`Alert ${alertId} acknowledged by user ${userId}`);
        
        return alert;
    }
    
    async resolveAlert(alertId, userId, resolution = {}) {
        const alert = this.activeAlerts.get(alertId) || 
                     this.acknowledgedAlerts.has(alertId) ? 
                     { id: alertId } : null;
        
        if (!alert) {
            throw new Error('Alert not found');
        }
        
        // Update alert
        alert.resolved = true;
        alert.resolvedAt = new Date();
        alert.status = 'resolved';
        alert.resolution = resolution;
        
        // Clear from active/acknowledged alerts
        this.activeAlerts.delete(alertId);
        this.acknowledgedAlerts.delete(alertId);
        
        // Emit event
        this.emit('alertResolved', alert);
        
        logger.info(`Alert ${alertId} resolved by user ${userId}`, { resolution });
        
        return alert;
    }
    
    // Getters
    getActiveAlerts(userId = null) {
        if (userId) {
            return Array.from(this.activeAlerts.values())
                .filter(alert => alert.userId === userId);
        }
        return Array.from(this.activeAlerts.values());
    }
    
    getAcknowledgedAlerts(userId = null) {
        const alerts = Array.from(this.acknowledgedAlerts)
            .map(id => this.activeAlerts.get(id) || { id, status: 'acknowledged' });
            
        if (userId) {
            return alerts.filter(alert => alert.userId === userId);
        }
        return alerts;
    }
    
    // Cleanup
    cleanupExpiredAlerts(expiryHours = 72) {
        const now = new Date();
        const expiryTime = now.setHours(now.getHours() - expiryHours);
        
        // Clean up active alerts
        for (const [id, alert] of this.activeAlerts.entries()) {
            if (alert.timestamp < expiryTime) {
                this.activeAlerts.delete(id);
            }
        }
        
        // Clean up acknowledged alerts set
        // Note: In a production system, you'd want to move these to a separate
        // storage for historical purposes before removing them
        const expiredAcknowledged = [];
        for (const id of this.acknowledgedAlerts) {
            const alert = this.activeAlerts.get(id);
            if (!alert || alert.timestamp < expiryTime) {
                expiredAcknowledged.push(id);
            }
        }
        
        expiredAcknowledged.forEach(id => this.acknowledgedAlerts.delete(id));
        
        return {
            activeAlertsRemoved: this.activeAlerts.size,
            acknowledgedAlertsRemoved: expiredAcknowledged.length
        };
    }
}

module.exports = AdvancedAlertSystem;
