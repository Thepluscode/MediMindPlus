"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRateLimitError = exports.handleDatabaseError = exports.validationErrorHandler = exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.ExternalServiceError = exports.DatabaseError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
// Custom error types
class AppError extends Error {
    constructor(message, statusCode, isOperational = true, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400, true, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, true, 'NOT_FOUND_ERROR');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, true, 'CONFLICT_ERROR');
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, true, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, true, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(message = 'External service unavailable') {
        super(message, 503, true, 'EXTERNAL_SERVICE_ERROR');
        this.name = 'ExternalServiceError';
    }
}
exports.ExternalServiceError = ExternalServiceError;
// HIPAA-compliant error sanitization
function sanitizeError(error) {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
        /password/gi,
        /token/gi,
        /secret/gi,
        /key/gi,
        /ssn/gi,
        /social.security/gi,
        /medical.record/gi,
        /patient.id/gi,
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
        /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card pattern
    ];
    let sanitizedMessage = error.message || 'An error occurred';
    sensitivePatterns.forEach(pattern => {
        sanitizedMessage = sanitizedMessage.replace(pattern, '[REDACTED]');
    });
    return {
        ...error,
        message: sanitizedMessage,
        stack: environment_1.config.isDevelopment ? error.stack : undefined
    };
}
// Main error handler middleware
const errorHandler = (error, req, res, next) => {
    var _a;
    const requestId = req.headers['x-request-id'];
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    // Default error values
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let isOperational = false;
    // Handle known error types
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code || 'APP_ERROR';
        isOperational = error.isOperational;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = error.message;
        code = 'VALIDATION_ERROR';
        isOperational = true;
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
        code = 'CAST_ERROR';
        isOperational = true;
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'JWT_ERROR';
        isOperational = true;
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'JWT_EXPIRED';
        isOperational = true;
    }
    else if (error.name === 'MongoError' || error.name === 'MongooseError') {
        statusCode = 500;
        message = 'Database operation failed';
        code = 'DATABASE_ERROR';
        isOperational = true;
    }
    // Sanitize error for HIPAA compliance
    const sanitizedError = sanitizeError({
        message,
        code,
        statusCode,
        stack: error.stack
    });
    // Log error with appropriate level
    if (statusCode >= 500) {
        logger_1.enhancedLogger.error('Server Error', {
            error: sanitizedError,
            requestId,
            userId,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        // Log security events for authentication/authorization errors
        if (statusCode === 401 || statusCode === 403) {
            logger_1.enhancedLogger.security('Authentication/Authorization Failure', 'medium', {
                statusCode,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
    }
    else if (statusCode >= 400) {
        logger_1.enhancedLogger.warn('Client Error', {
            error: sanitizedError,
            requestId,
            userId,
            method: req.method,
            path: req.path,
            ip: req.ip
        });
    }
    // Audit log for security-related errors
    if ([401, 403, 429].includes(statusCode)) {
        logger_1.enhancedLogger.audit('ERROR_RESPONSE', userId, undefined, {
            statusCode,
            code,
            path: req.path,
            ip: req.ip
        });
    }
    // Prepare error response
    const errorResponse = {
        error: {
            message: sanitizedError.message,
            code,
            statusCode,
            timestamp: new Date().toISOString(),
            requestId
        }
    };
    // Add details in development mode
    if (environment_1.config.isDevelopment && error.stack) {
        errorResponse.error.details = {
            stack: error.stack,
            originalMessage: error.message
        };
    }
    // Send error response
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// 404 handler
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
// Validation error handler
const validationErrorHandler = (errors) => {
    const message = errors.map(error => error.message).join(', ');
    return new ValidationError(message);
};
exports.validationErrorHandler = validationErrorHandler;
// Database error handler
const handleDatabaseError = (error) => {
    if (error.code === '23505') { // PostgreSQL unique violation
        return new ConflictError('Resource already exists');
    }
    if (error.code === '23503') { // PostgreSQL foreign key violation
        return new ValidationError('Referenced resource does not exist');
    }
    if (error.code === '23502') { // PostgreSQL not null violation
        return new ValidationError('Required field is missing');
    }
    return new DatabaseError('Database operation failed');
};
exports.handleDatabaseError = handleDatabaseError;
// Rate limit error handler
const handleRateLimitError = (req, res) => {
    const error = new RateLimitError('Too many requests, please try again later');
    logger_1.enhancedLogger.security('Rate Limit Exceeded', 'medium', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
    });
    res.status(429).json({
        error: {
            message: error.message,
            code: error.code,
            statusCode: 429,
            timestamp: new Date().toISOString(),
            retryAfter: '15 minutes'
        }
    });
};
exports.handleRateLimitError = handleRateLimitError;
exports.default = exports.errorHandler;
