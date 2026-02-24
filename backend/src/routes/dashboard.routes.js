const express = require('express');
const { body, param, query } = require('express-validator');
const DashboardController = require('../controllers/DashboardController');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger').default;

const router = express.Router();
const dashboardController = new DashboardController();

// Initialize the dashboard controller
dashboardController.initialize().catch(err => {
    logger.error('Failed to initialize DashboardController', { service: 'dashboard-routes', error: err.message });
    process.exit(1);
});

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

// Dashboard CRUD endpoints
router.post(
    '/',
    [
        body('templateId').isString().notEmpty(),
        body('customizations').optional().isObject()
    ],
    dashboardController.createDashboard.bind(dashboardController)
);

router.get(
    '/:dashboardId',
    [
        param('dashboardId').isString().notEmpty()
    ],
    dashboardController.getDashboard.bind(dashboardController)
);

router.put(
    '/:dashboardId',
    [
        param('dashboardId').isString().notEmpty(),
        body().isObject()
    ],
    dashboardController.updateDashboard.bind(dashboardController)
);

router.delete(
    '/:dashboardId',
    [
        param('dashboardId').isString().notEmpty()
    ],
    dashboardController.deleteDashboard.bind(dashboardController)
);

// Widget endpoints
router.get(
    '/:dashboardId/widgets/:widgetId/data',
    [
        param('dashboardId').isString().notEmpty(),
        param('widgetId').isString().notEmpty(),
        query('timeRange').optional().isString()
    ],
    dashboardController.getWidgetData.bind(dashboardController)
);

// Export endpoints
router.get(
    '/:dashboardId/export',
    [
        param('dashboardId').isString().notEmpty(),
        query('format').optional().isIn(['pdf', 'png', 'json'])
    ],
    dashboardController.exportDashboard.bind(dashboardController)
);

// List available dashboard templates
router.get(
    '/templates',
    async (req, res, next) => {
        try {
            // This would return the available dashboard templates
            const templates = [
                {
                    id: 'patient_overview',
                    name: 'Patient Health Overview',
                    description: 'Comprehensive view of patient health metrics',
                    type: 'patient',
                    previewImage: '/images/dashboard-templates/patient-overview.png'
                },
                {
                    id: 'provider_dashboard',
                    name: 'Healthcare Provider Dashboard',
                    description: 'Overview for healthcare providers',
                    type: 'provider',
                    previewImage: '/images/dashboard-templates/provider-dashboard.png'
                },
                {
                    id: 'research_analytics',
                    name: 'Clinical Research Analytics',
                    description: 'Analytics for clinical research',
                    type: 'research',
                    previewImage: '/images/dashboard-templates/research-analytics.png'
                }
            ];
            
            res.json(templates);
        } catch (error) {
            next(error);
        }
    }
);

// Error handling middleware for dashboard routes
router.use((err, req, res, next) => {
    logger.error('Dashboard error', { service: 'dashboard-routes', error: err.message });
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message
        });
    }
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

module.exports = router;
