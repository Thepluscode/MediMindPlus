// Production-Ready Error Handler with HIPAA Compliance
import { Request, Response, NextFunction } from 'express';
import { enhancedLogger } from '../utils/logger';
import { config } from '../config/environment';

// Custom error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, true, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service unavailable') {
    super(message, 503, true, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
}

// HIPAA-compliant error sanitization
function sanitizeError(error: any): any {
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
    stack: config.isDevelopment ? error.stack : undefined
  };
}

// Main error handler middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;
  const userId = (req as any).user?.id;

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
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
    isOperational = true;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
    code = 'CAST_ERROR';
    isOperational = true;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'JWT_ERROR';
    isOperational = true;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'JWT_EXPIRED';
    isOperational = true;
  } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
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
    enhancedLogger.error('Server Error', {
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
      enhancedLogger.security('Authentication/Authorization Failure', 'medium', {
        statusCode,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  } else if (statusCode >= 400) {
    enhancedLogger.warn('Client Error', {
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
    enhancedLogger.audit('ERROR_RESPONSE', userId, undefined, {
      statusCode,
      code,
      path: req.path,
      ip: req.ip
    });
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: {
      message: sanitizedError.message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  // Add details in development mode
  if (config.isDevelopment && error.stack) {
    errorResponse.error.details = {
      stack: error.stack,
      originalMessage: error.message
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Validation error handler
export const validationErrorHandler = (errors: any[]) => {
  const message = errors.map(error => error.message).join(', ');
  return new ValidationError(message);
};

// Database error handler
export const handleDatabaseError = (error: any): AppError => {
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

// Rate limit error handler
export const handleRateLimitError = (req: Request, res: Response) => {
  const error = new RateLimitError('Too many requests, please try again later');
  
  enhancedLogger.security('Rate Limit Exceeded', 'medium', {
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

export default errorHandler;
