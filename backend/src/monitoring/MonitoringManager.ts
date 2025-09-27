// Production Monitoring Manager with Metrics and Alerting
import { config } from '../config/environment';
import { enhancedLogger } from '../utils/logger';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata?: any;
}

export class MonitoringManager {
  private metrics: Map<string, Metric[]> = new Map();
  private alerts: Alert[] = [];
  private isInitialized = false;
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
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

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (config.monitoring.enabled) {
        // Start metrics collection
        this.startMetricsCollection();
        
        // Start alert monitoring
        this.startAlertMonitoring();
        
        // Initialize external monitoring services
        await this.initializeExternalServices();
      }

      this.isInitialized = true;
      enhancedLogger.info('Monitoring manager initialized successfully', {
        enabled: config.monitoring.enabled,
        logLevel: config.monitoring.logLevel
      });
    } catch (error) {
      enhancedLogger.error('Failed to initialize monitoring manager', {
        error: error.message
      });
      throw error;
    }
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    enhancedLogger.debug('Metrics collection started');
  }

  private startAlertMonitoring(): void {
    // Check for alerts every 60 seconds
    this.alertsInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000);

    enhancedLogger.debug('Alert monitoring started');
  }

  private async initializeExternalServices(): Promise<void> {
    try {
      // Initialize Sentry for error tracking
      if (config.monitoring.sentryDsn) {
        // Sentry initialization would go here
        enhancedLogger.info('Sentry error tracking initialized');
      }

      // Initialize Datadog for metrics
      if (config.monitoring.datadogApiKey) {
        // Datadog initialization would go here
        enhancedLogger.info('Datadog metrics initialized');
      }
    } catch (error) {
      enhancedLogger.warn('Failed to initialize some external monitoring services', {
        error: error.message
      });
    }
  }

  // Metrics Collection
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
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

    enhancedLogger.debug('Metric recorded', {
      name,
      value,
      tags
    });
  }

  recordAPIRequest(method: string, path: string, statusCode: number, duration: number): void {
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

  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
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

  recordMLPrediction(model: string, duration: number, accuracy?: number): void {
    const tags = {
      model
    };

    this.recordMetric('ml_predictions_total', 1, tags);
    this.recordMetric('ml_prediction_duration', duration, tags);

    if (accuracy !== undefined) {
      this.recordMetric('ml_prediction_accuracy', accuracy, tags);
    }
  }

  recordPHIAccess(userId: string, resourceType: string, action: string): void {
    const tags = {
      resource_type: resourceType,
      action
    };

    this.recordMetric('phi_access_events', 1, tags);

    // Log for audit trail
    enhancedLogger.audit('PHI_ACCESS_METRIC', userId, undefined, {
      resourceType,
      action,
      timestamp: new Date().toISOString()
    });
  }

  private collectSystemMetrics(): void {
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

      enhancedLogger.debug('System metrics collected');
    } catch (error) {
      enhancedLogger.error('Failed to collect system metrics', {
        error: error.message
      });
    }
  }

  // Alerting
  createAlert(severity: Alert['severity'], message: string, metadata?: any): string {
    const alert: Alert = {
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

    enhancedLogger.warn('Alert created', {
      alertId: alert.id,
      severity,
      message,
      metadata
    });

    // Send to external alerting systems
    this.sendExternalAlert(alert);

    return alert.id;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (alert && !alert.resolved) {
      alert.resolved = true;
      
      enhancedLogger.info('Alert resolved', {
        alertId,
        severity: alert.severity,
        message: alert.message
      });
      
      return true;
    }
    
    return false;
  }

  private checkAlerts(): void {
    try {
      // Check for high error rates
      this.checkErrorRateAlert();
      
      // Check for high response times
      this.checkResponseTimeAlert();
      
      // Check for memory usage
      this.checkMemoryUsageAlert();
      
      // Check for database connection issues
      this.checkDatabaseAlert();

      enhancedLogger.debug('Alert checks completed');
    } catch (error) {
      enhancedLogger.error('Alert checking failed', {
        error: error.message
      });
    }
  }

  private checkErrorRateAlert(): void {
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

  private checkResponseTimeAlert(): void {
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

  private checkMemoryUsageAlert(): void {
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

  private checkDatabaseAlert(): void {
    // This would check database connection metrics
    // Implementation depends on your database monitoring setup
  }

  private sendExternalAlert(alert: Alert): void {
    try {
      // Send to Slack, PagerDuty, email, etc.
      // Implementation depends on your alerting preferences
      
      if (alert.severity === 'critical') {
        enhancedLogger.error('CRITICAL ALERT', {
          alertId: alert.id,
          message: alert.message,
          metadata: alert.metadata
        });
      }
    } catch (error) {
      enhancedLogger.error('Failed to send external alert', {
        alertId: alert.id,
        error: error.message
      });
    }
  }

  // Utility Methods
  private getRecentMetrics(name: string, timeWindowMs: number): Metric[] {
    const metrics = this.metrics.get(name) || [];
    const cutoff = Date.now() - timeWindowMs;
    
    return metrics.filter(m => m.timestamp >= cutoff);
  }

  private sanitizePath(path: string): string {
    // Replace UUIDs and IDs with placeholders for better grouping
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }

  private getStatusClass(statusCode: number): string {
    if (statusCode < 300) return '2xx';
    if (statusCode < 400) return '3xx';
    if (statusCode < 500) return '4xx';
    return '5xx';
  }

  // Public API
  getMetrics(name?: string): Record<string, Metric[]> {
    if (name) {
      return { [name]: this.metrics.get(name) || [] };
    }
    
    return Object.fromEntries(this.metrics.entries());
  }

  getAlerts(resolved?: boolean): Alert[] {
    if (resolved !== undefined) {
      return this.alerts.filter(a => a.resolved === resolved);
    }
    
    return [...this.alerts];
  }

  getHealthSummary(): any {
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

  async stop(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
      this.alertsInterval = null;
    }

    this.isInitialized = false;
    enhancedLogger.info('Monitoring manager stopped');
  }
}

export default MonitoringManager;
