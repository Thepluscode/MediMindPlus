// Environment Configuration
// Production-ready configuration management with validation

import { z } from 'zod';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_URL: z.string().url().optional(),

  // Database Configuration
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('medimind'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('password'),
  DB_SSL: z.string().transform(Boolean).default('false'),
  DATABASE_URL: z.string().optional(),

  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security Configuration
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  SESSION_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  
  // External Services
  ML_SERVICE_URL: z.string().url().default('http://localhost:8001'),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Healthcare APIs
  EPIC_CLIENT_ID: z.string().optional(),
  EPIC_CLIENT_SECRET: z.string().optional(),
  CERNER_CLIENT_ID: z.string().optional(),
  CERNER_CLIENT_SECRET: z.string().optional(),
  
  // AI/ML Configuration
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  
  // Monitoring & Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Feature Flags
  ENABLE_SWAGGER: z.string().transform(Boolean).default('true'),
  ENABLE_METRICS: z.string().transform(Boolean).default('true'),
  ENABLE_AUDIT_LOGS: z.string().transform(Boolean).default('true'),
  ENABLE_RATE_LIMITING: z.string().transform(Boolean).default('true'),

  // HIPAA Compliance
  ENCRYPTION_KEY: z.string().min(32),
  AUDIT_LOG_RETENTION_DAYS: z.string().transform(Number).default('2555'), // 7 years
  PHI_ENCRYPTION_ENABLED: z.string().transform(Boolean).default('true'),

  // FDA Compliance
  FDA_SUBMISSION_MODE: z.string().transform(Boolean).default('false'),
  CLINICAL_TRIAL_MODE: z.string().transform(Boolean).default('false'),
  DEVICE_IDENTIFIER: z.string().optional(),
});

// Validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  logger.error('Invalid environment configuration', {
    service: 'config',
    errors: parseResult.error.format()
  });
  process.exit(1);
}

const env = parseResult.data;

// Export configuration object
export const config = {
  // Server
  environment: env.NODE_ENV,
  port: env.PORT,
  apiUrl: env.API_URL || `http://localhost:${env.PORT}`,
  
  // Database
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
    url: env.DATABASE_URL || `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
  },
  
  // Redis
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    url: env.REDIS_URL || `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // Security
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
    encryptionKey: env.ENCRYPTION_KEY,
    phiEncryptionEnabled: env.PHI_ENCRYPTION_ENABLED,
  },
  
  // CORS
  cors: {
    allowedOrigins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    enabled: env.ENABLE_RATE_LIMITING,
  },
  
  // File Upload
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    uploadPath: env.UPLOAD_PATH,
  },
  
  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM,
  },
  
  // External Services
  services: {
    mlServiceUrl: env.ML_SERVICE_URL,
    googleCloudProjectId: env.GOOGLE_CLOUD_PROJECT_ID,
    awsRegion: env.AWS_REGION,
    awsAccessKeyId: env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  
  // Healthcare APIs
  healthcare: {
    epic: {
      clientId: env.EPIC_CLIENT_ID,
      clientSecret: env.EPIC_CLIENT_SECRET,
    },
    cerner: {
      clientId: env.CERNER_CLIENT_ID,
      clientSecret: env.CERNER_CLIENT_SECRET,
    },
  },
  
  // AI/ML
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    googleAiApiKey: env.GOOGLE_AI_API_KEY,
  },
  
  // Monitoring
  monitoring: {
    logLevel: env.LOG_LEVEL,
    sentryDsn: env.SENTRY_DSN,
    datadogApiKey: env.DATADOG_API_KEY,
    enabled: env.ENABLE_METRICS,
  },
  
  // Feature Flags
  features: {
    swagger: env.ENABLE_SWAGGER,
    metrics: env.ENABLE_METRICS,
    auditLogs: env.ENABLE_AUDIT_LOGS,
    rateLimit: env.ENABLE_RATE_LIMITING,
  },
  
  // Compliance
  compliance: {
    hipaa: {
      auditLogRetentionDays: env.AUDIT_LOG_RETENTION_DAYS,
      phiEncryptionEnabled: env.PHI_ENCRYPTION_ENABLED,
    },
    fda: {
      submissionMode: env.FDA_SUBMISSION_MODE,
      clinicalTrialMode: env.CLINICAL_TRIAL_MODE,
      deviceIdentifier: env.DEVICE_IDENTIFIER,
    },
  },
  
  // Development helpers
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isStaging: env.NODE_ENV === 'staging',
};

// Validate critical configuration
if (config.isProduction) {
  const requiredProductionVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
  ];
  
  const missingVars = requiredProductionVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Missing required production environment variables', {
      service: 'config',
      missingVars
    });
    process.exit(1);
  }
}

export default config;
