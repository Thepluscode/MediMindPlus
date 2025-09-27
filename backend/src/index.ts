import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabaseConnection } from './config/data-source';
import { AuthController } from './controllers/AuthController';
import mlRoutes from './api/routes/mlRoutes';
import { logger } from './utils/logger';
import knex from './config/knex';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize controllers
const authController = new AuthController();

// Load configuration
const config = {
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8001',
  // Other configs...
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

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
app.use(`${API_PREFIX}/ml`, mlRoutes);

// Protected route example
app.get('/api/profile', authController.authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { 
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
    await initializeDatabase();
    
    // Initialize Knex.js connection (for migrations and raw queries)
    await knex.initialize();
    
    // Run database migrations
    if (process.env.RUN_MIGRATIONS === 'true') {
      logger.info('Running database migrations...');
      await knex.migrate();
      
      // Run seeds in development or if explicitly requested
      if (process.env.NODE_ENV === 'development' || process.env.RUN_SEEDS === 'true') {
        logger.info('Running database seeds...');
        await knex.seed();
      }
    }
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      
      // Log database connection status
      logger.info('Database connections initialized:');
      logger.info(`- TypeORM: Connected to ${process.env.DB_NAME || 'medimind'} database`);
      logger.info(`- Knex.js: Ready for database operations`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    await closeConnections();
    process.exit(1);
  }
};

// Gracefully close all database connections
const closeConnections = async () => {
  try {
    await closeDatabaseConnection();
    await knex.close();
    logger.info('All database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

// Handle graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  await closeConnections();
  process.exit(0);
};

// Handle SIGTERM and SIGINT signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();
