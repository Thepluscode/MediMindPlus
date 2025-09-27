// Production-Ready Validation Middleware
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errorHandler';
import { enhancedLogger } from '../utils/logger';

/**
 * Zod schema validation middleware
 */
export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        enhancedLogger.warn('Validation failed', {
          path: req.path,
          errors: validationErrors,
          requestId: req.headers['x-request-id']
        });
        
        const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
        next(new ValidationError(errorMessage));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Query parameter validation
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
        next(new ValidationError(`Query validation failed: ${errorMessage}`));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Path parameter validation
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
        next(new ValidationError(`Parameter validation failed: ${errorMessage}`));
      } else {
        next(error);
      }
    }
  };
};

/**
 * File upload validation
 */
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [], required = false } = options;
    
    if (required && (!req.file && !req.files)) {
      return next(new ValidationError('File upload is required'));
    }
    
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];
    
    for (const file of files) {
      if (!file) continue;
      
      // Check file size
      if (file.size > maxSize) {
        return next(new ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`));
      }
      
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return next(new ValidationError(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
      }
    }
    
    next();
  };
};

/**
 * HIPAA-compliant data validation
 */
export const validateHIPAACompliance = (req: Request, res: Response, next: NextFunction) => {
  // Check for potential PHI in request
  const sensitiveFields = ['ssn', 'social_security_number', 'medical_record_number', 'patient_id'];
  const body = JSON.stringify(req.body).toLowerCase();
  
  let hasPHI = false;
  for (const field of sensitiveFields) {
    if (body.includes(field)) {
      hasPHI = true;
      break;
    }
  }
  
  if (hasPHI) {
    // Log PHI handling
    enhancedLogger.audit('PHI_PROCESSING', req.user?.id, undefined, {
      endpoint: req.path,
      method: req.method,
      hasAuthentication: !!req.user,
      ip: req.ip
    });
    
    // Ensure user is authenticated for PHI access
    if (!req.user) {
      return next(new ValidationError('Authentication required for PHI access'));
    }
  }
  
  next();
};

// Common validation schemas
export const commonSchemas = {
  // User schemas
  userRegistration: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['patient', 'provider', 'admin']).optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional()
  }),
  
  userLogin: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  }),
  
  // Health assessment schemas
  healthAssessment: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    assessmentType: z.enum(['comprehensive', 'focused', 'screening']),
    symptoms: z.array(z.string()).optional(),
    vitalSigns: z.object({
      heartRate: z.number().min(30).max(200).optional(),
      bloodPressure: z.object({
        systolic: z.number().min(70).max(250),
        diastolic: z.number().min(40).max(150)
      }).optional(),
      temperature: z.number().min(95).max(110).optional(),
      respiratoryRate: z.number().min(8).max(40).optional()
    }).optional(),
    notes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional()
  }),
  
  // Voice biomarker schemas
  voiceBiomarker: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    audioData: z.string().min(1, 'Audio data is required'),
    duration: z.number().min(1, 'Duration must be at least 1 second'),
    sampleRate: z.number().min(8000, 'Sample rate must be at least 8000 Hz'),
    format: z.enum(['wav', 'mp3', 'flac']),
    analysisType: z.enum(['respiratory', 'neurological', 'mental_health', 'comprehensive'])
  }),
  
  // Pagination schemas
  pagination: z.object({
    page: z.string().transform(Number).refine(n => n > 0, 'Page must be positive').optional(),
    limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }),
  
  // ID parameter schema
  idParam: z.object({
    id: z.string().uuid('Invalid ID format')
  })
};

export const validationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add request ID for tracking
  req.requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set request ID header for response
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

export default {
  validateSchema,
  validateQuery,
  validateParams,
  validateFileUpload,
  validateHIPAACompliance,
  validationMiddleware,
  commonSchemas
};
