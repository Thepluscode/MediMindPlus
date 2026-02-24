"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.enhancedLogger = exports.stream = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const winston_2 = require("winston");
require("winston-daily-rotate-file");
const { combine, timestamp, printf, colorize, json } = winston_2.format;
// Ensure logs directory exists
const logDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Utility functions for HIPAA compliance
function sanitizePHI(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
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
function hashUserId(userId) {
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
        userId: userId ? `user_${hashUserId(userId)}` : undefined,
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
const consoleFormat = combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat);
const fileFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json());
// Create the logger with enhanced configuration
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? hipaaCompliantFormat : fileFormat,
    defaultMeta: {
        service: 'medimind-backend',
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error logs
        new winston_1.default.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'error-%DATE%.log'),
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d', // Keep error logs longer
        }),
        // Combined logs
        new winston_1.default.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'combined-%DATE%.log'),
            maxSize: '20m',
            maxFiles: '14d',
        }),
        // Audit logs for HIPAA compliance
        new winston_1.default.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'audit-%DATE%.log'),
            level: 'info',
            maxSize: '50m',
            maxFiles: '2555d', // 7 years for HIPAA compliance
            format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), hipaaCompliantFormat)
        }),
        // Security logs
        new winston_1.default.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'security-%DATE%.log'),
            level: 'warn',
            maxSize: '20m',
            maxFiles: '90d',
        }),
        // Performance logs
        new winston_1.default.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'performance-%DATE%.log'),
            level: 'info',
            maxSize: '20m',
            maxFiles: '7d',
        })
    ],
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
        new winston_1.default.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'exceptions-%DATE%.log'),
            maxSize: '20m',
            maxFiles: '30d'
        })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'rejections-%DATE%.log'),
            maxSize: '20m',
            maxFiles: '30d'
        })
    ],
    exitOnError: false,
});
exports.logger = logger;
// If we're not in production then log to the `console`
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
// Create a stream object with a 'write' function that will be used by `morgan`
exports.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
// Enhanced logging methods for production use
exports.enhancedLogger = {
    // Standard logging methods
    error: (message, meta) => logger.error(message, meta),
    warn: (message, meta) => logger.warn(message, meta),
    info: (message, meta) => logger.info(message, meta),
    debug: (message, meta) => logger.debug(message, meta),
    // Audit logging for HIPAA compliance
    audit: (action, userId, resourceId, meta) => {
        logger.info('AUDIT', {
            action,
            userId: userId ? hashUserId(userId) : undefined,
            resourceId,
            timestamp: new Date().toISOString(),
            ...sanitizePHI(meta)
        });
    },
    // Security event logging
    security: (event, severity, meta) => {
        logger.warn('SECURITY_EVENT', {
            event,
            severity,
            timestamp: new Date().toISOString(),
            ...sanitizePHI(meta)
        });
    },
    // Performance logging
    performance: (operation, duration, meta) => {
        logger.info('PERFORMANCE', {
            operation,
            duration,
            timestamp: new Date().toISOString(),
            ...meta
        });
    },
    // API request logging
    request: (method, path, statusCode, duration, meta) => {
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
    database: (operation, table, duration, meta) => {
        logger.debug('DATABASE', {
            operation,
            table,
            duration,
            timestamp: new Date().toISOString(),
            ...meta
        });
    },
    // ML model logging
    ml: (model, operation, duration, accuracy, meta) => {
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
exports.default = logger;
