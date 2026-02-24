// analytics/dashboards/HealthDashboardService.js
const { EventEmitter } = require('events');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const redis = require('redis');
const D3Node = require('d3-node');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const Chart = require('chart.js/auto');
const { createCanvas } = require('canvas');
const logger = require('../../utils/logger').default;

class HealthDashboardService extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.influxDB = new InfluxDB(config.influxdb);
        this.redisClient = redis.createClient(config.redis);
        this.dashboards = new Map();
        this.widgets = new Map();
        this.realTimeConnections = new Set();
        
        this.initialize();
    }
    
    async initialize() {
        await this.redisClient.connect();
        await this.loadDashboardTemplates();
        await this.setupRealTimeUpdates();

        logger.info('Health Dashboard Service initialized', { service: 'HealthDashboardService' });
    }
    
    async loadDashboardTemplates() {
        const templates = [
            {
                id: 'patient_overview',
                name: 'Patient Health Overview',
                type: 'patient',
                layout: 'grid',
                widgets: [
                    { type: 'vital_signs_chart', position: { x: 0, y: 0, w: 6, h: 4 } },
                    { type: 'risk_assessment', position: { x: 6, y: 0, w: 6, h: 4 } },
                    { type: 'medication_timeline', position: { x: 0, y: 4, w: 12, h: 3 } },
                    { type: 'activity_heatmap', position: { x: 0, y: 7, w: 6, h: 4 } },
                    { type: 'sleep_analysis', position: { x: 6, y: 7, w: 6, h: 4 } }
                ]
            },
            {
                id: 'provider_dashboard',
                name: 'Healthcare Provider Dashboard',
                type: 'provider',
                layout: 'tabs',
                widgets: [
                    { type: 'patient_list', position: { x: 0, y: 0, w: 4, h: 8 } },
                    { type: 'alert_center', position: { x: 4, y: 0, w: 4, h: 4 } },
                    { type: 'appointment_schedule', position: { x: 8, y: 0, w: 4, h: 4 } },
                    { type: 'population_health', position: { x: 4, y: 4, w: 8, h: 4 } },
                    { type: 'clinical_metrics', position: { x: 0, y: 8, w: 12, h: 4 } }
                ]
            },
            {
                id: 'research_analytics',
                name: 'Clinical Research Analytics',
                type: 'research',
                layout: 'dashboard',
                widgets: [
                    { type: 'enrollment_funnel', position: { x: 0, y: 0, w: 6, h: 4 } },
                    { type: 'study_timeline', position: { x: 6, y: 0, w: 6, h: 4 } },
                    { type: 'endpoint_analysis', position: { x: 0, y: 4, w: 8, h: 4 } },
                    { type: 'safety_monitoring', position: { x: 8, y: 4, w: 4, h: 4 } },
                    { type: 'regulatory_tracker', position: { x: 0, y: 8, w: 12, h: 3 } }
                ]
            },
            {
                id: 'executive_summary',
                name: 'Executive Summary Dashboard',
                type: 'executive',
                layout: 'kpi',
                widgets: [
                    { type: 'key_metrics', position: { x: 0, y: 0, w: 12, h: 2 } },
                    { type: 'user_growth', position: { x: 0, y: 2, w: 6, h: 4 } },
                    { type: 'revenue_analytics', position: { x: 6, y: 2, w: 6, h: 4 } },
                    { type: 'geographic_distribution', position: { x: 0, y: 6, w: 8, h: 4 } },
                    { type: 'ai_model_performance', position: { x: 8, y: 6, w: 4, h: 4 } }
                ]
            }
        ];
        
        for (const template of templates) {
            this.dashboards.set(template.id, template);
        }
    }
    
    async createDashboard(userId, templateId, customizations = {}) {
        const template = this.dashboards.get(templateId);
        if (!template) {
            throw new Error('Dashboard template not found');
        }
        
        const dashboardId = `dashboard_${userId}_${Date.now()}`;
        const dashboard = {
            id: dashboardId,
            userId: userId,
            templateId: templateId,
            name: customizations.name || template.name,
            type: template.type,
            layout: template.layout,
            widgets: await this.initializeWidgets(template.widgets, userId),
            preferences: {
                refreshInterval: customizations.refreshInterval || 30000,
                theme: customizations.theme || 'light',
                timezone: customizations.timezone || 'UTC',
                filters: customizations.filters || {}
            },
            createdAt: new Date(),
            lastUpdated: new Date(),
            isPublic: customizations.isPublic || false
        };
        
        // Store dashboard configuration
        await this.redisClient.setex(
            `dashboard:${dashboardId}`,
            3600 * 24, // 24 hours
            JSON.stringify(dashboard)
        );
        
        // Initialize real-time data for widgets
        await this.initializeRealTimeData(dashboard);
        
        this.emit('dashboardCreated', dashboard);
        
        return dashboard;
    }
    
    async initializeWidgets(widgetConfigs, userId) {
        const widgets = [];
        
        for (const config of widgetConfigs) {
            const widget = await this.createWidget(config, userId);
            widgets.push(widget);
        }
        
        return widgets;
    }
    
    async createWidget(config, userId) {
        const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const widget = {
            id: widgetId,
            type: config.type,
            position: config.position,
            data: await this.getWidgetData(config.type, userId),
            lastUpdated: new Date(),
            updateInterval: this.getWidgetUpdateInterval(config.type),
            isLoading: false,
            error: null
        };
        
        this.widgets.set(widgetId, widget);
        
        return widget;
    }
    
    async getWidgetData(widgetType, userId, timeRange = '24h') {
        switch (widgetType) {
            case 'vital_signs_chart':
                return await this.getVitalSignsData(userId, timeRange);
            case 'risk_assessment':
                return await this.getRiskAssessmentData(userId);
            case 'medication_timeline':
                return await this.getMedicationTimelineData(userId);
            case 'activity_heatmap':
                return await this.getActivityHeatmapData(userId, timeRange);
            case 'sleep_analysis':
                return await this.getSleepAnalysisData(userId, timeRange);
            case 'patient_list':
                return await this.getPatientListData(userId);
            case 'alert_center':
                return await this.getAlertCenterData(userId);
            case 'appointment_schedule':
                return await this.getAppointmentScheduleData(userId);
            case 'population_health':
                return await this.getPopulationHealthData(userId);
            case 'clinical_metrics':
                return await this.getClinicalMetricsData(userId);
            case 'enrollment_funnel':
                return await this.getEnrollmentFunnelData(userId);
            case 'study_timeline':
                return await this.getStudyTimelineData(userId);
            case 'endpoint_analysis':
                return await this.getEndpointAnalysisData(userId);
            case 'safety_monitoring':
                return await this.getSafetyMonitoringData(userId);
            case 'regulatory_tracker':
                return await this.getRegulatoryTrackerData(userId);
            case 'key_metrics':
                return await this.getKeyMetricsData();
            case 'user_growth':
                return await this.getUserGrowthData();
            case 'revenue_analytics':
                return await this.getRevenueAnalyticsData();
            case 'geographic_distribution':
                return await this.getGeographicDistributionData();
            case 'ai_model_performance':
                return await this.getAIModelPerformanceData();
            default:
                return { error: 'Unknown widget type' };
        }
    }
    
    async getVitalSignsData(userId, timeRange) {
        const query = `
            from(bucket: "${this.config.influxdb.bucket}")
                |> range(start: -${timeRange})
                |> filter(fn: (r) => r._measurement == "vitals")
                |> filter(fn: (r) => r.user_id == "${userId}")
                |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
                |> pivot(rowKey:["_time"], columnKey: ["vital_type"], valueColumn: "_value")
        `;
        
        try {
            const queryApi = this.influxDB.getQueryApi(this.config.influxdb.org);
            const data = await queryApi.collectRows(query);
            
            return {
                chartType: 'line',
                datasets: [
                    {
                        label: 'Heart Rate',
                        data: data.map(row => ({
                            x: new Date(row._time),
                            y: row.heart_rate || null
                        })).filter(point => point.y !== null),
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Blood Pressure (Systolic)',
                        data: data.map(row => ({
                            x: new Date(row._time),
                            y: row.blood_pressure_systolic || null
                        })).filter(point => point.y !== null),
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        yAxisID: 'y1'
                    }
                ],
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'hour'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Heart Rate (BPM)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Blood Pressure (mmHg)'
                            }
                        }
                    }
                }
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async getRiskAssessmentData(userId) {
        try {
            const cached = await this.redisClient.get(`risk_assessment:${userId}:latest`);
            if (!cached) {
                return { error: 'No risk assessment data available' };
            }
            
            const riskData = JSON.parse(cached);
            
            return {
                chartType: 'radar',
                data: {
                    labels: Object.keys(riskData.disease_risks).map(disease => 
                        disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    ),
                    datasets: [{
                        label: 'Disease Risk Score',
                        data: Object.values(riskData.disease_risks),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
                    }]
                },
                overallRisk: riskData.overall_risk_score,
                confidence: riskData.confidence_level,
                recommendations: riskData.recommendations?.slice(0, 5) || []
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async getActivityHeatmapData(userId, timeRange) {
        const query = `
            from(bucket: "${this.config.influxdb.bucket}")
                |> range(start: -${timeRange})
                |> filter(fn: (r) => r._measurement == "activity")
                |> filter(fn: (r) => r.user_id == "${userId}")
                |> aggregateWindow(every: 1h, fn: sum, createEmpty: false)
        `;
        
        try {
            const queryApi = this.influxDB.getQueryApi(this.config.influxdb.org);
            const data = await queryApi.collectRows(query);
            
            // Create 24-hour heatmap data
            const heatmapData = Array(7).fill().map(() => Array(24).fill(0));
            
            data.forEach(row => {
                const date = new Date(row._time);
                const dayOfWeek = date.getDay();
                const hour = date.getHours();
                heatmapData[dayOfWeek][hour] = row._value || 0;
            });
            
            return {
                chartType: 'heatmap',
                data: heatmapData,
                labels: {
                    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    hours: Array.from({length: 24}, (_, i) => `${i}:00`)
                },
                colorScale: {
                    min: 0,
                    max: Math.max(...data.map(row => row._value || 0))
                }
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async getSleepAnalysisData(userId, timeRange) {
        const query = `
            from(bucket: "${this.config.influxdb.bucket}")
                |> range(start: -${timeRange})
                |> filter(fn: (r) => r._measurement == "sleep")
                |> filter(fn: (r) => r.user_id == "${userId}")
                |> aggregateWindow(every: 1d, fn: mean, createEmpty: false)
        `;
        
        try {
            const queryApi = this.influxDB.getQueryApi(this.config.influxdb.org);
            const data = await queryApi.collectRows(query);
            
            return {
                chartType: 'mixed',
                datasets: [
                    {
                        type: 'bar',
                        label: 'Sleep Duration (hours)',
                        data: data.map(row => ({
                            x: new Date(row._time).toISOString().split('T')[0],
                            y: row.duration || 0
                        })),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)'
                    },
                    {
                        type: 'line',
                        label: 'Sleep Quality Score',
                        data: data.map(row => ({
                            x: new Date(row._time).toISOString().split('T')[0],
                            y: row.quality_score || 0
                        })),
                        borderColor: 'rgba(255, 206, 86, 1)',
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        yAxisID: 'y1'
                    }
                ],
                summary: {
                    averageDuration: data.reduce((sum, row) => sum + (row.duration || 0), 0) / data.length,
                    averageQuality: data.reduce((sum, row) => sum + (row.quality_score || 0), 0) / data.length,
                    sleepDebt: this.calculateSleepDebt(data)
                }
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    calculateSleepDebt(sleepData) {
        const recommendedSleep = 8; // hours
        const totalDebt = sleepData.reduce((debt, row) => {
            const duration = row.duration || 0;
            return debt + Math.max(0, recommendedSleep - duration);
        }, 0);
        
        return totalDebt;
    }
    
    async getPatientListData(providerId) {
        try {
            // This would query the user database for patients assigned to this provider
            const patients = await this.getProvidersPatients(providerId);
            
            return {
                tableData: patients.map(patient => ({
                    id: patient.id,
                    name: `${patient.firstName} ${patient.lastName}`,
                    age: patient.age,
                    lastVisit: patient.lastVisit,
                    riskLevel: patient.riskLevel || 'Low',
                    alerts: patient.activeAlerts || 0,
                    status: patient.status || 'Active'
                })),
                summary: {
                    totalPatients: patients.length,
                    highRiskPatients: patients.filter(p => p.riskLevel === 'High').length,
                    activeAlerts: patients.reduce((sum, p) => sum + (p.activeAlerts || 0), 0)
                }
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async getAlertCenterData(providerId) {
        try {
            const alerts = await this.getActiveAlerts(providerId);
            
            return {
                alerts: alerts.map(alert => ({
                    id: alert.id,
                    type: alert.type,
                    severity: alert.severity,
                    patientName: alert.patientName,
                    message: alert.message,
                    timestamp: alert.timestamp,
                    acknowledged: alert.acknowledged || false
                })),
                summary: {
                    critical: alerts.filter(a => a.severity === 'critical').length,
                    warning: alerts.filter(a => a.severity === 'warning').length,
                    info: alerts.filter(a => a.severity === 'info').length,
                    unacknowledged: alerts.filter(a => !a.acknowledged).length
                }
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async getKeyMetricsData() {
        try {
            return {
                metrics: [
                    {
                        name: 'Total Users',
                        value: await this.getTotalUsers(),
                        change: '+12.5%',
                        trend: 'up',
                        icon: 'users'
                    },
                    {
                        name: 'Active Predictions',
                        value: await this.getActivePredictions(),
                        change: '+8.2%',
                        trend: 'up',
                        icon: 'brain'
                    },
                    {
                        name: 'Disease Prevented',
                        value: await this.getDiseasesPreventedCount(),
                        change: '+15.7%',
                        trend: 'up',
                        icon: 'shield'
                    },
                    {
                        name: 'Cost Savings',
                        value: await this.getCostSavings(),
                        change: '+22.1%',
                        trend: 'up',
                        icon: 'dollar'
                    }
                ]
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async getUserGrowthData() {
        const query = `
            from(bucket: "${this.config.influxdb.bucket}")
                |> range(start: -30d)
                |> filter(fn: (r) => r._measurement == "user_metrics")
                |> aggregateWindow(every: 1d, fn: last, createEmpty: false)
        `;
        
        try {
            const queryApi = this.influxDB.getQueryApi(this.config.influxdb.org);
            const data = await queryApi.collectRows(query);
            
            return {
                chartType: 'line',
                data: {
                    labels: data.map(row => new Date(row._time).toLocaleDateString()),
                    datasets: [{
                        label: 'Total Users',
                        data: data.map(row => row._value),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }]
                },
                growth: {
                    total: data[data.length - 1]?._value || 0,
                    monthlyGrowthRate: this.calculateGrowthRate(data),
                    newUsersToday: await this.getNewUsersToday()
                }
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    calculateGrowthRate(data) {
        if (data.length < 2) return 0;
        
        const current = data[data.length - 1]._value;
        const previous = data[data.length - 30]?._value || data[0]._value;
        
        return previous ? ((current - previous) / previous * 100) : 0;
    }
    
    getWidgetUpdateInterval(widgetType) {
        const intervals = {
            'vital_signs_chart': 30000,      // 30 seconds
            'risk_assessment': 300000,       // 5 minutes
            'medication_timeline': 3600000,  // 1 hour
            'activity_heatmap': 300000,      // 5 minutes
            'sleep_analysis': 3600000,       // 1 hour
            'patient_list': 60000,           // 1 minute
            'alert_center': 10000,           // 10 seconds
            'appointment_schedule': 60000,   // 1 minute
            'population_health': 600000,     // 10 minutes
            'clinical_metrics': 300000,      // 5 minutes
            'key_metrics': 300000,           // 5 minutes
            'user_growth': 3600000,          // 1 hour
            'revenue_analytics': 3600000,    // 1 hour
            'ai_model_performance': 600000   // 10 minutes
        };
        
        return intervals[widgetType] || 60000; // Default: 1 minute
    }
    
    async setupRealTimeUpdates() {
        // Set up WebSocket connections for real-time updates
        setInterval(async () => {
            await this.updateAllWidgets();
        }, 30000); // Update every 30 seconds
    }
    
    async updateAllWidgets() {
        for (const [widgetId, widget] of this.widgets) {
            if (Date.now() - new Date(widget.lastUpdated).getTime() > widget.updateInterval) {
                try {
                    const newData = await this.getWidgetData(widget.type, widget.userId);
                    widget.data = newData;
                    widget.lastUpdated = new Date();
                    widget.error = null;
                    
                    this.emit('widgetUpdated', { widgetId, data: newData });
                } catch (error) {
                    widget.error = error.message;
                    logger.error('Error updating widget', { service: 'HealthDashboardService', widgetId, error: error.message });
                }
            }
        }
    }
    
    async getDashboard(dashboardId) {
        const cached = await this.redisClient.get(`dashboard:${dashboardId}`);
        if (!cached) {
            throw new Error('Dashboard not found');
        }
        
        return JSON.parse(cached);
    }
    
    async updateDashboard(dashboardId, updates) {
        const dashboard = await this.getDashboard(dashboardId);
        
        Object.assign(dashboard, updates);
        dashboard.lastUpdated = new Date();
        
        await this.redisClient.setex(
            `dashboard:${dashboardId}`,
            3600 * 24,
            JSON.stringify(dashboard)
        );
        
        this.emit('dashboardUpdated', dashboard);
        
        return dashboard;
    }
    
    async exportDashboard(dashboardId, format = 'pdf') {
        const dashboard = await this.getDashboard(dashboardId);
        
        switch (format) {
            case 'pdf':
                return await this.exportToPDF(dashboard);
            case 'png':
                return await this.exportToPNG(dashboard);
            case 'json':
                return JSON.stringify(dashboard, null, 2);
            default:
                throw new Error('Unsupported export format');
        }
    }
    
    async exportToPDF(dashboard) {
        const doc = new PDFDocument();
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {});
        
        // Title
        doc.fontSize(20).text(dashboard.name, 50, 50);
        doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, 50, 80);
        
        // Widget data
        let yPosition = 120;
        for (const widget of dashboard.widgets) {
            doc.fontSize(14).text(widget.type.replace(/_/g, ' ').toUpperCase(), 50, yPosition);
            yPosition += 30;
            
            if (widget.data && !widget.data.error) {
                // Add widget summary data
                const summary = this.createWidgetSummary(widget);
                doc.fontSize(10).text(summary, 50, yPosition, { width: 500 });
                yPosition += 60;
            }
        }
        
        doc.end();
        
        return Buffer.concat(chunks);
    }
    
    createWidgetSummary(widget) {
        switch (widget.type) {
            case 'vital_signs_chart':
                return `Latest vital signs data with ${widget.data.datasets?.length || 0} metrics tracked`;
            case 'risk_assessment':
                return `Overall risk score: ${widget.data.overallRisk?.toFixed(2) || 'N/A'}`;
            case 'activity_heatmap':
                return `Activity patterns analyzed over ${widget.data.labels?.days?.length || 7} days`;
            default:
                return `${widget.type} widget data available`;
        }
    }
    
    // Helper methods for data retrieval (simplified implementations)
    async getProvidersPatients(providerId) {
        // This would query the actual database
        return [
            { id: 1, firstName: 'John', lastName: 'Doe', age: 45, riskLevel: 'Medium', activeAlerts: 2 },
            { id: 2, firstName: 'Jane', lastName: 'Smith', age: 52, riskLevel: 'High', activeAlerts: 1 }
        ];
    }
    
    async getActiveAlerts(providerId) {
        return [
            {
                id: 1,
                type: 'vital_signs_alert',
                severity: 'critical',
                patientName: 'John Doe',
                message: 'Elevated blood pressure detected',
                timestamp: new Date(),
                acknowledged: false
            }
        ];
    }
    
    async getTotalUsers() { return 15743; }
    async getActivePredictions() { return 8921; }
    async getDiseasesPreventedCount() { return 1247; }
    async getCostSavings() { return '$2.4M'; }
    async getNewUsersToday() { return 127; }
}