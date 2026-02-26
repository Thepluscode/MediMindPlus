import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { format } from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, json } = format;

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Utility functions for HIPAA compliance
function sanitizePHI(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveFields = [
    'ssn', 'social_security_number', 'phone', 'email', 'address',
    'date_of_birth', 'dob', 'medical_record_number', 'mrn',
    'patient_id', 'insurance_number', 'credit_card', 'password'
  ];

  const sanitized = { ...obj };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePHI(sanitized[key]);
    }
  }

  return sanitized;
}

function hashUserId(userId: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
}

// HIPAA-compliant log format
const hipaaCompliantFormat = printf(({ level, message, timestamp, service, requestId, userId, ...meta }) => {
  const sanitizedMeta = sanitizePHI(meta);
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    service: service || 'medimind-backend',
    message,
    requestId,
    userId: userId ? `user_${hashUserId(userId as string)}` : undefined,
    ...sanitizedMeta
  };

  return JSON.stringify(logEntry);
});

// Development log format
const logFormat = printf(({ level, message, timestamp, requestId, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  const reqId = requestId ? `[${requestId}]` : '';
  return `${timestamp} [${level}] ${reqId} ${message} ${metaStr}`;
});

// Define different log formats
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  logFormat
);

const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json()
);

// Create the logger with enhanced configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? hipaaCompliantFormat : fileFormat,
  defaultMeta: {
    service: 'medimind-backend',
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d', // Keep error logs longer
    }),

    // Combined logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // Audit logs for HIPAA compliance
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      level: 'info',
      maxSize: '50m',
      maxFiles: '2555d', // 7 years for HIPAA compliance
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        hipaaCompliantFormat
      )
    }),

    // Security logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'security-%DATE%.log'),
      level: 'warn',
      maxSize: '20m',
      maxFiles: '90d',
    }),

    // Performance logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'performance-%DATE%.log'),
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d',
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],

  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],

  exitOnError: false,
});

// Always log to console so Railway can capture the logs properly
logger.add(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? hipaaCompliantFormat : consoleFormat,
  })
);

// Create a stream object with a 'write' function that will be used by `morgan`
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Enhanced logging methods for production use
export const enhancedLogger = {
  // Standard logging methods
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),

  // Audit logging for HIPAA compliance
  audit: (action: string, userId?: string, resourceId?: string, meta?: any) => {
    logger.info('AUDIT', {
      action,
      userId: userId ? hashUserId(userId) : undefined,
      resourceId,
      timestamp: new Date().toISOString(),
      ...sanitizePHI(meta)
    });
  },

  // Security event logging
  security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any) => {
    logger.warn('SECURITY_EVENT', {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...sanitizePHI(meta)
    });
  },

  // Performance logging
  performance: (operation: string, duration: number, meta?: any) => {
    logger.info('PERFORMANCE', {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...meta
    });
  },

  // API request logging
  request: (method: string, path: string, statusCode: number, duration: number, meta?: any) => {
    logger.info('API_REQUEST', {
      method,
      path,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
      ...sanitizePHI(meta)
    });
  },

  // Database operation logging
  database: (operation: string, table: string, duration: number, meta?: any) => {
    logger.debug('DATABASE', {
      operation,
      table,
      duration,
      timestamp: new Date().toISOString(),
      ...meta
    });
  },

  // ML model logging
  ml: (model: string, operation: string, duration: number, accuracy?: number, meta?: any) => {
    logger.info('ML_MODEL', {
      model,
      operation,
      duration,
      accuracy,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
};

export { logger };
export default logger;
