"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("./config/data-source");
const AuthController_1 = require("./controllers/AuthController");
const mlRoutes_1 = __importDefault(require("./api/routes/mlRoutes"));
const onboarding_1 = __importDefault(require("./routes/onboarding"));
const provider_1 = __importDefault(require("./routes/provider"));
const healthAnalysis_1 = __importDefault(require("./routes/healthAnalysis"));
const advancedFeatures_1 = __importDefault(require("./routes/advancedFeatures"));
const logger_1 = require("./utils/logger");
const knex_1 = __importDefault(require("./config/knex"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Initialize controllers
const authController = new AuthController_1.AuthController();
// Load configuration
const config = {
    mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8001',
    // Other configs...
};
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// API Routes
const API_PREFIX = '/api';
// Auth routes
app.post(`${API_PREFIX}/auth/register`, authController.register);
app.post(`${API_PREFIX}/auth/login`, authController.login);
app.post(`${API_PREFIX}/auth/refresh-token`, authController.refreshToken);
// ML Service routes
app.use(`${API_PREFIX}/ml`, mlRoutes_1.default);
// Patient Onboarding routes
app.use(`${API_PREFIX}/onboarding`, onboarding_1.default);
// Provider Portal routes
app.use(`${API_PREFIX}/provider`, provider_1.default);
// Health Analysis routes (voice, camera, infection, cancer)
app.use(`${API_PREFIX}`, healthAnalysis_1.default);
// Advanced Features routes (stroke detection, wearables, BCI, microbiome, athletic)
app.use(`${API_PREFIX}/advanced`, advancedFeatures_1.default);
// Protected route example
app.get('/api/profile', authController.authenticate, (req, res) => {
    res.json({ user: req.user });
});
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
    });
});
// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
// Initialize the database connections and start the server
const startServer = async () => {
    try {
        // Initialize TypeORM connection (for existing ORM usage)
        await (0, data_source_1.initializeDatabase)();
        // Initialize Knex.js connection (for migrations and raw queries)
        await knex_1.default.initialize();
        // Run database migrations
        if (process.env.RUN_MIGRATIONS === 'true') {
            logger_1.logger.info('Running database migrations...');
            await knex_1.default.migrate();
            // Run seeds in development or if explicitly requested
            if (process.env.NODE_ENV === 'development' || process.env.RUN_SEEDS === 'true') {
                logger_1.logger.info('Running database seeds...');
                await knex_1.default.seed();
            }
        }
        app.listen(PORT, () => {
            logger_1.logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            // Log database connection status
            logger_1.logger.info('Database connections initialized:');
            logger_1.logger.info(`- TypeORM: Connected to ${process.env.DB_NAME || 'medimind'} database`);
            logger_1.logger.info(`- Knex.js: Ready for database operations`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        await closeConnections();
        process.exit(1);
    }
};
// Gracefully close all database connections
const closeConnections = async () => {
    try {
        await (0, data_source_1.closeDatabaseConnection)();
        await knex_1.default.close();
        logger_1.logger.info('All database connections closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connections:', error);
    }
};
// Handle graceful shutdown
const shutdown = async () => {
    logger_1.logger.info('Shutting down server...');
    await closeConnections();
    process.exit(0);
};
// Handle SIGTERM and SIGINT signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start the server
startServer();
