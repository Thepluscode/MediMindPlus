import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabaseConnection } from './config/data-source';
import { AuthController } from './controllers/AuthController';
import mlRoutes from './api/routes/mlRoutes';
import onboardingRoutes from './routes/onboarding';
import providerRoutes from './routes/provider';
import healthAnalysisRoutes from './routes/healthAnalysis';
import advancedFeaturesRoutes from './routes/advancedFeatures';
import revolutionaryFeaturesRoutes from './routes/revolutionaryFeatures';
import healthRiskRoutes from './routes/health-risk.routes';
import wearableRoutes from './routes/wearable.routes';
import alertsRoutes from './routes/alerts.routes';
import consultationRoutes from './routes/consultations.routes';
import paymentRoutes from './routes/payments.routes';
import aiBlockchainRoutes, { setAIBlockchainService } from './routes/aiBlockchain.routes';
import settingsRoutes from './routes/settings';
import analyticsRoutes from './routes/analytics';
import { logger } from './utils/logger';
import knex from './config/knex';
import { AIBlockchainHybridService } from './services/AIBlockchainHybridService';
import { AISymptomCheckerService } from './services/healthunity/AISymptomCheckerService';
import { MentalHealthService } from './services/healthunity/MentalHealthService';
import { EpidemicTrackingService } from './services/healthunity/EpidemicTrackingService';

// Monitoring imports
import { initializeSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler, setSentryUserFromAuth } from './monitoring/sentry';
import { metricsMiddleware, metricsEndpoint } from './monitoring/prometheus';

// Load environment variables
dotenv.config();

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATION (Fail Fast)
// ============================================================================
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  // DB_PASSWORD is only required if DATABASE_URL is not provided (Railway provides DATABASE_URL)
  ...(process.env.DATABASE_URL ? [] : ['DB_PASSWORD']),
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`CRITICAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  logger.error('CRITICAL: Missing required environment variables:', {
    missing: missingEnvVars,
    hint: 'Run ./generate_secrets.sh to generate secure secrets, then copy to .env file'
  });
  process.exit(1);
}

// Validate JWT_SECRET strength (minimum 32 characters)
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('CRITICAL: JWT_SECRET must be at least 32 characters long for security');
  logger.error('CRITICAL: JWT_SECRET must be at least 32 characters long for security');
  process.exit(1);
}

if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('CRITICAL: JWT_REFRESH_SECRET must be at least 32 characters long for security');
  logger.error('CRITICAL: JWT_REFRESH_SECRET must be at least 32 characters long for security');
  process.exit(1);
}

logger.info('✓ Environment variables validated successfully');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Sentry FIRST (before any other middleware)
initializeSentry(app);

// Sentry request handler - must be the first middleware
app.use(sentryRequestHandler());

// Sentry tracing handler - for performance monitoring
app.use(sentryTracingHandler());

// Initialize controllers
const authController = new AuthController();

// Load configuration
const config = {
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8001',
  // Other configs...
};

// Security & CORS Middleware
app.use(helmet());

// CORS configuration - environment-based allowlist (HIPAA compliant)
const getAllowedOrigins = (): string[] => {
  const defaultOrigins = [
    'http://localhost:19006',  // Expo mobile dev server
    'http://localhost:19000',  // Expo alternative port
    'http://localhost:8081',   // React Native Metro bundler
    'http://localhost:5173',   // Vite web dev server
    'http://localhost:3000',   // Legacy frontend (if needed)
  ];

  // Add production origins from environment variable
  const productionOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];

  return [...defaultOrigins, ...productionOrigins];
};

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Prometheus metrics middleware - track all requests
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    monitoring: {
      sentry: process.env.SENTRY_DSN ? 'enabled' : 'disabled',
      prometheus: 'enabled'
    }
  });
});

// Prometheus metrics endpoint
app.get('/metrics', metricsEndpoint);

// API Routes
const API_PREFIX = '/api';

// Auth routes
app.post(`${API_PREFIX}/auth/register`, authController.register);
app.post(`${API_PREFIX}/auth/login`, authController.login);
app.post(`${API_PREFIX}/auth/refresh-token`, authController.refreshToken);

// ML Service routes
app.use(`${API_PREFIX}/ml`, mlRoutes);

// Patient Onboarding routes
app.use(`${API_PREFIX}/onboarding`, onboardingRoutes);

// Provider Portal routes
app.use(`${API_PREFIX}/provider`, providerRoutes);

// Health Analysis routes (voice, camera, infection, cancer)
app.use(`${API_PREFIX}`, healthAnalysisRoutes);

// Advanced Features routes (stroke detection, wearables, BCI, microbiome, athletic)
app.use(`${API_PREFIX}/advanced`, advancedFeaturesRoutes);

// Health Risk Assessment routes (AI disease prediction - 5 core models)
app.use(`${API_PREFIX}/health-risk`, healthRiskRoutes);

// Wearable Device Data routes (Apple Health, Fitbit, etc.)
app.use(`${API_PREFIX}/wearable`, wearableRoutes);

// Health Alerts routes (vital signs monitoring and notifications)
app.use(`${API_PREFIX}/alerts`, alertsRoutes);

// Video Consultation routes (telemedicine, appointments, provider search)
app.use(`${API_PREFIX}/consultations`, consultationRoutes);

// Payment routes (Stripe integration for consultations)
app.use(`${API_PREFIX}/payments`, paymentRoutes);

// AI-Blockchain Hybrid routes (Explainable AI, Federated Learning, IoMT Anomaly Detection, Smart Contracts)
app.use(`${API_PREFIX}/ai-blockchain`, aiBlockchainRoutes);

// Settings routes (Profile, Password, Privacy, Help, Contact, Legal)
app.use(`${API_PREFIX}/settings`, settingsRoutes);

// Analytics routes (forecasting, anomaly detection, insights, summary)
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

// Audit logs route (basic implementation)
app.get(`${API_PREFIX}/audit/logs`, authController.authenticate, (req: any, res) => {
  res.json({
    success: true,
    data: {
      logs: [],
      total: 0,
      skip: 0,
      limit: 50,
    },
  });
});

// Wearable devices listing (GET /api/wearable/devices)
app.get(`${API_PREFIX}/wearable/devices`, authController.authenticate, (req: any, res) => {
  res.json({
    success: true,
    devices: [],
  });
});

// Drug interaction checker (POST /api/advanced/drug-interactions)
app.post(`${API_PREFIX}/advanced/drug-interactions`, authController.authenticate, (req: any, res) => {
  const { medications = [], allergies = [], conditions = [], isPregnant, isBreastfeeding } = req.body;

  const knownInteractions: Record<string, Record<string, any>> = {
    warfarin: {
      aspirin: { severity: 'critical', description: 'Increased risk of bleeding when combined. Both medications affect blood clotting.', recommendation: 'Consult physician immediately. May require dosage adjustment or alternative medication.' },
      ibuprofen: { severity: 'high', description: 'NSAIDs can increase anticoagulant effect of warfarin, raising bleeding risk.', recommendation: 'Avoid combination if possible. Monitor INR closely if co-administration is necessary.' },
    },
    lisinopril: {
      ibuprofen: { severity: 'high', description: 'NSAIDs may reduce the effectiveness of ACE inhibitors and increase kidney damage risk.', recommendation: 'Use acetaminophen instead. Monitor blood pressure and kidney function.' },
      potassium: { severity: 'moderate', description: 'ACE inhibitors can increase potassium levels; combining with potassium supplements may cause hyperkalemia.', recommendation: 'Monitor potassium levels regularly.' },
    },
    metformin: {
      alcohol: { severity: 'high', description: 'Alcohol increases risk of lactic acidosis with metformin.', recommendation: 'Avoid alcohol while taking metformin.' },
    },
    simvastatin: {
      clarithromycin: { severity: 'critical', description: 'Clarithromycin can greatly increase simvastatin levels, causing myopathy or rhabdomyolysis.', recommendation: 'Use alternative antibiotic or switch to pravastatin.' },
    },
  };

  const interactions: any[] = [];
  const medNames = medications.map((m: any) => (m.name || '').toLowerCase());

  for (let i = 0; i < medNames.length; i++) {
    for (let j = i + 1; j < medNames.length; j++) {
      const a = medNames[i];
      const b = medNames[j];
      const interaction =
        knownInteractions[a]?.[b] || knownInteractions[b]?.[a];
      if (interaction) {
        interactions.push({
          severity: interaction.severity,
          drugs: [medications[i].name, medications[j].name],
          description: interaction.description,
          recommendation: interaction.recommendation,
        });
      }
    }
  }

  res.json({
    success: true,
    interactions,
    summary: {
      total: interactions.length,
      critical: interactions.filter((i) => i.severity === 'critical').length,
      high: interactions.filter((i) => i.severity === 'high').length,
      moderate: interactions.filter((i) => i.severity === 'moderate').length,
      low: interactions.filter((i) => i.severity === 'low').length,
    },
    checkedAt: new Date().toISOString(),
  });
});

// Store database reference in app.locals for routes to access
// app.locals.db = knex; // Commented out - will be set after initialization

// Revolutionary Features routes (12 billion-dollar features)
// Virtual Health Twin, Mental Health Crisis, Multi-Omics, Longevity, Employer Dashboard,
// Provider Performance, Federated Learning, Predictive Insurance, Drug Discovery,
// Pandemic Warning, Health Educator, Data Marketplace
// Add Sentry user context after authentication
app.use(`${API_PREFIX}/v1`, authController.authenticate, setSentryUserFromAuth, revolutionaryFeaturesRoutes);

// Protected route example
app.get('/api/profile', authController.authenticate, setSentryUserFromAuth, (req: any, res) => {
  res.json({ user: req.user });
});

// Sentry error handler - must be BEFORE other error handlers
app.use(sentryErrorHandler());

// 404 handler - must be after all other routes but before error handler
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  (error as any).statusCode = 404;
  (error as any).code = 'NOT_FOUND';
  next(error);
});

// Custom error handling middleware - must be last
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    service: 'express-error-handler'
  });

  // Build standardized error response
  const statusCode = (err as any).statusCode || 500;
  const code = (err as any).code || 'INTERNAL_ERROR';
  const details = (err as any).details;

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Something went wrong',
      code,
      statusCode,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details
      })
    }
  });
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

    // Initialize AI-Blockchain Hybrid Service
    logger.info('Initializing AI-Blockchain Hybrid Service...');
    const db = knex.instance();
    const aiSymptomChecker = new AISymptomCheckerService(db);
    const mentalHealthService = new MentalHealthService(db);
    const epidemicService = new EpidemicTrackingService(db);

    const aiBlockchainService = new AIBlockchainHybridService(
      db,
      aiSymptomChecker,
      mentalHealthService,
      epidemicService
    );

    // Inject service into routes
    setAIBlockchainService(aiBlockchainService);
    logger.info('AI-Blockchain Hybrid Service initialized successfully');

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
