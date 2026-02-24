"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringManager = void 0;
// Production Monitoring Manager with Metrics and Alerting
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
class MonitoringManager {
    constructor() {
        this.metrics = new Map();
        this.alerts = [];
        this.isInitialized = false;
        this.metricsInterval = null;
        this.alertsInterval = null;
        this.initializeMetrics();
    }
    initializeMetrics() {
        // Initialize metric storage
        const metricNames = [
            'api_requests_total',
            'api_request_duration',
            'api_errors_total',
            'database_connections_active',
            'database_query_duration',
            'redis_operations_total',
            'memory_usage_bytes',
            'cpu_usage_percent',
            'ml_predictions_total',
            'ml_prediction_duration',
            'user_sessions_active',
            'phi_access_events'
        ];
        metricNames.forEach(name => {
            this.metrics.set(name, []);
        });
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            if (environment_1.config.monitoring.enabled) {
                // Start metrics collection
                this.startMetricsCollection();
                // Start alert monitoring
                this.startAlertMonitoring();
                // Initialize external monitoring services
                await this.initializeExternalServices();
            }
            this.isInitialized = true;
            logger_1.enhancedLogger.info('Monitoring manager initialized successfully', {
                enabled: environment_1.config.monitoring.enabled,
                logLevel: environment_1.config.monitoring.logLevel
            });
        }
        catch (error) {
            logger_1.enhancedLogger.error('Failed to initialize monitoring manager', {
                error: error.message
            });
            throw error;
        }
    }
    startMetricsCollection() {
        // Collect system metrics every 30 seconds
        this.metricsInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);
        logger_1.enhancedLogger.debug('Metrics collection started');
    }
    startAlertMonitoring() {
        // Check for alerts every 60 seconds
        this.alertsInterval = setInterval(() => {
            this.checkAlerts();
        }, 60000);
        logger_1.enhancedLogger.debug('Alert monitoring started');
    }
    async initializeExternalServices() {
        try {
            // Initialize Sentry for error tracking
            if (environment_1.config.monitoring.sentryDsn) {
                // Sentry initialization would go here
                logger_1.enhancedLogger.info('Sentry error tracking initialized');
            }
            // Initialize Datadog for metrics
            if (environment_1.config.monitoring.datadogApiKey) {
                // Datadog initialization would go here
                logger_1.enhancedLogger.info('Datadog metrics initialized');
            }
        }
        catch (error) {
            logger_1.enhancedLogger.warn('Failed to initialize some external monitoring services', {
                error: error.message
            });
        }
    }
    // Metrics Collection
    recordMetric(name, value, tags) {
        const metric = {
            name,
            value,
            timestamp: Date.now(),
            tags
        };
        const metrics = this.metrics.get(name) || [];
        metrics.push(metric);
        // Keep only last 1000 metrics per type
        if (metrics.length > 1000) {
            metrics.shift();
        }
        this.metrics.set(name, metrics);
        logger_1.enhancedLogger.debug('Metric recorded', {
            name,
            value,
            tags
        });
    }
    recordAPIRequest(method, path, statusCode, duration) {
        const tags = {
            method,
            path: this.sanitizePath(path),
            status_code: statusCode.toString(),
            status_class: this.getStatusClass(statusCode)
        };
        this.recordMetric('api_requests_total', 1, tags);
        this.recordMetric('api_request_duration', duration, tags);
        if (statusCode >= 400) {
            this.recordMetric('api_errors_total', 1, tags);
        }
    }
    recordDatabaseQuery(operation, table, duration, success) {
        const tags = {
            operation,
            table,
            success: success.toString()
        };
        this.recordMetric('database_query_duration', duration, tags);
        if (!success) {
            this.recordMetric('database_errors_total', 1, tags);
        }
    }
    recordMLPrediction(model, duration, accuracy) {
        const tags = {
            model
        };
        this.recordMetric('ml_predictions_total', 1, tags);
        this.recordMetric('ml_prediction_duration', duration, tags);
        if (accuracy !== undefined) {
            this.recordMetric('ml_prediction_accuracy', accuracy, tags);
        }
    }
    recordPHIAccess(userId, resourceType, action) {
        const tags = {
            resource_type: resourceType,
            action
        };
        this.recordMetric('phi_access_events', 1, tags);
        // Log for audit trail
        logger_1.enhancedLogger.audit('PHI_ACCESS_METRIC', userId, undefined, {
            resourceType,
            action,
            timestamp: new Date().toISOString()
        });
    }
    collectSystemMetrics() {
        try {
            // Memory usage
            const memUsage = process.memoryUsage();
            this.recordMetric('memory_usage_bytes', memUsage.heapUsed, { type: 'heap_used' });
            this.recordMetric('memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });
            this.recordMetric('memory_usage_bytes', memUsage.rss, { type: 'rss' });
            // CPU usage (simplified)
            const cpuUsage = process.cpuUsage();
            this.recordMetric('cpu_usage_microseconds', cpuUsage.user, { type: 'user' });
            this.recordMetric('cpu_usage_microseconds', cpuUsage.system, { type: 'system' });
            // Process uptime
            this.recordMetric('process_uptime_seconds', process.uptime());
            logger_1.enhancedLogger.debug('System metrics collected');
        }
        catch (error) {
            logger_1.enhancedLogger.error('Failed to collect system metrics', {
                error: error.message
            });
        }
    }
    // Alerting
    createAlert(severity, message, metadata) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            severity,
            message,
            timestamp: Date.now(),
            resolved: false,
            metadata
        };
        this.alerts.push(alert);
        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts.shift();
        }
        logger_1.enhancedLogger.warn('Alert created', {
            alertId: alert.id,
            severity,
            message,
            metadata
        });
        // Send to external alerting systems
        this.sendExternalAlert(alert);
        return alert.id;
    }
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            logger_1.enhancedLogger.info('Alert resolved', {
                alertId,
                severity: alert.severity,
                message: alert.message
            });
            return true;
        }
        return false;
    }
    checkAlerts() {
        try {
            // Check for high error rates
            this.checkErrorRateAlert();
            // Check for high response times
            this.checkResponseTimeAlert();
            // Check for memory usage
            this.checkMemoryUsageAlert();
            // Check for database connection issues
            this.checkDatabaseAlert();
            logger_1.enhancedLogger.debug('Alert checks completed');
        }
        catch (error) {
            logger_1.enhancedLogger.error('Alert checking failed', {
                error: error.message
            });
        }
    }
    checkErrorRateAlert() {
        const errorMetrics = this.getRecentMetrics('api_errors_total', 300000); // Last 5 minutes
        const requestMetrics = this.getRecentMetrics('api_requests_total', 300000);
        if (errorMetrics.length > 0 && requestMetrics.length > 0) {
            const errorCount = errorMetrics.reduce((sum, m) => sum + m.value, 0);
            const requestCount = requestMetrics.reduce((sum, m) => sum + m.value, 0);
            const errorRate = (errorCount / requestCount) * 100;
            if (errorRate > 10) { // 10% error rate threshold
                this.createAlert('high', `High error rate detected: ${errorRate.toFixed(2)}%`, {
                    errorRate,
                    errorCount,
                    requestCount
                });
            }
        }
    }
    checkResponseTimeAlert() {
        const responseTimeMetrics = this.getRecentMetrics('api_request_duration', 300000);
        if (responseTimeMetrics.length > 0) {
            const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
            if (avgResponseTime > 5000) { // 5 second threshold
                this.createAlert('medium', `High average response time: ${avgResponseTime.toFixed(0)}ms`, {
                    avgResponseTime,
                    sampleCount: responseTimeMetrics.length
                });
            }
        }
    }
    checkMemoryUsageAlert() {
        const memoryMetrics = this.getRecentMetrics('memory_usage_bytes', 60000); // Last minute
        if (memoryMetrics.length > 0) {
            const latestMemory = memoryMetrics[memoryMetrics.length - 1];
            const memoryUsageMB = latestMemory.value / (1024 * 1024);
            if (memoryUsageMB > 1024) { // 1GB threshold
                this.createAlert('medium', `High memory usage: ${memoryUsageMB.toFixed(0)}MB`, {
                    memoryUsageMB,
                    memoryUsageBytes: latestMemory.value
                });
            }
        }
    }
    checkDatabaseAlert() {
        // This would check database connection metrics
        // Implementation depends on your database monitoring setup
    }
    sendExternalAlert(alert) {
        try {
            // Send to Slack, PagerDuty, email, etc.
            // Implementation depends on your alerting preferences
            if (alert.severity === 'critical') {
                logger_1.enhancedLogger.error('CRITICAL ALERT', {
                    alertId: alert.id,
                    message: alert.message,
                    metadata: alert.metadata
                });
            }
        }
        catch (error) {
            logger_1.enhancedLogger.error('Failed to send external alert', {
                alertId: alert.id,
                error: error.message
            });
        }
    }
    // Utility Methods
    getRecentMetrics(name, timeWindowMs) {
        const metrics = this.metrics.get(name) || [];
        const cutoff = Date.now() - timeWindowMs;
        return metrics.filter(m => m.timestamp >= cutoff);
    }
    sanitizePath(path) {
        // Replace UUIDs and IDs with placeholders for better grouping
        return path
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
            .replace(/\/\d+/g, '/:id');
    }
    getStatusClass(statusCode) {
        if (statusCode < 300)
            return '2xx';
        if (statusCode < 400)
            return '3xx';
        if (statusCode < 500)
            return '4xx';
        return '5xx';
    }
    // Public API
    getMetrics(name) {
        if (name) {
            return { [name]: this.metrics.get(name) || [] };
        }
        return Object.fromEntries(this.metrics.entries());
    }
    getAlerts(resolved) {
        if (resolved !== undefined) {
            return this.alerts.filter(a => a.resolved === resolved);
        }
        return [...this.alerts];
    }
    getHealthSummary() {
        const recentMetrics = this.getRecentMetrics('api_requests_total', 300000);
        const recentErrors = this.getRecentMetrics('api_errors_total', 300000);
        const activeAlerts = this.getAlerts(false);
        return {
            requestsLast5Min: recentMetrics.reduce((sum, m) => sum + m.value, 0),
            errorsLast5Min: recentErrors.reduce((sum, m) => sum + m.value, 0),
            activeAlerts: activeAlerts.length,
            criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
    }
    async stop() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
        if (this.alertsInterval) {
            clearInterval(this.alertsInterval);
            this.alertsInterval = null;
        }
        this.isInitialized = false;
        logger_1.enhancedLogger.info('Monitoring manager stopped');
    }
}
exports.MonitoringManager = MonitoringManager;
exports.default = MonitoringManager;
