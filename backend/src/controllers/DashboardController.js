const HealthDashboardService = require('../analytics/dashboards/HealthDashboardService');
const dashboardConfig = require('../config/dashboard.config');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger').default;

class DashboardController {
    constructor() {
        this.dashboardService = new HealthDashboardService(dashboardConfig);
    }

    async initialize() {
        try {
            await this.dashboardService.initialize();
            logger.info('DashboardController initialized', { service: 'DashboardController' });
        } catch (error) {
            logger.error('Failed to initialize DashboardController', { service: 'DashboardController', error: error.message });
            throw error;
        }
    }

    // Get dashboard by ID
    async getDashboard(req, res, next) {
        try {
            const { dashboardId } = req.params;
            const dashboard = await this.dashboardService.getDashboard(dashboardId);
            
            if (!dashboard) {
                return res.status(404).json({ error: 'Dashboard not found' });
            }
            
            // Check permissions
            if (dashboard.userId !== req.user.id && !dashboard.isPublic) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            res.json(dashboard);
        } catch (error) {
            next(error);
        }
    }

    // Create new dashboard
    async createDashboard(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { templateId, customizations } = req.body;
            const dashboard = await this.dashboardService.createDashboard(
                req.user.id,
                templateId,
                customizations
            );
            
            res.status(201).json(dashboard);
        } catch (error) {
            next(error);
        }
    }

    // Update dashboard
    async updateDashboard(req, res, next) {
        try {
            const { dashboardId } = req.params;
            const updates = req.body;
            
            // Verify ownership
            const dashboard = await this.dashboardService.getDashboard(dashboardId);
            if (!dashboard) {
                return res.status(404).json({ error: 'Dashboard not found' });
            }
            
            if (dashboard.userId !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const updatedDashboard = await this.dashboardService.updateDashboard(dashboardId, updates);
            res.json(updatedDashboard);
        } catch (error) {
            next(error);
        }
    }

    // Delete dashboard
    async deleteDashboard(req, res, next) {
        try {
            const { dashboardId } = req.params;
            
            // Verify ownership
            const dashboard = await this.dashboardService.getDashboard(dashboardId);
            if (!dashboard) {
                return res.status(404).json({ error: 'Dashboard not found' });
            }
            
            if (dashboard.userId !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            await this.dashboardService.deleteDashboard(dashboardId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Export dashboard
    async exportDashboard(req, res, next) {
        try {
            const { dashboardId } = req.params;
            const { format = 'pdf' } = req.query;
            
            // Verify access
            const dashboard = await this.dashboardService.getDashboard(dashboardId);
            if (!dashboard) {
                return res.status(404).json({ error: 'Dashboard not found' });
            }
            
            if (dashboard.userId !== req.user.id && !dashboard.isPublic) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const exportData = await this.dashboardService.exportDashboard(dashboardId, format);
            
            // Set appropriate content type
            const contentType = {
                'pdf': 'application/pdf',
                'png': 'image/png',
                'json': 'application/json'
            }[format] || 'application/octet-stream';
            
            res.set('Content-Type', contentType);
            
            // Set filename for download
            const filename = `dashboard-${dashboardId}.${format}`;
            res.set('Content-Disposition', `attachment; filename="${filename}"`);
            
            res.send(exportData);
        } catch (error) {
            next(error);
        }
    }

    // Get widget data
    async getWidgetData(req, res, next) {
        try {
            const { widgetId } = req.params;
            const { timeRange = '24h' } = req.query;
            
            const widget = await this.dashboardService.getWidgetData(
                widgetId,
                req.user.id,
                timeRange
            );
            
            if (!widget) {
                return res.status(404).json({ error: 'Widget not found' });
            }
            
            res.json(widget);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DashboardController;
