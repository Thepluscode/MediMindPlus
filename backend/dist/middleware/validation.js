"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = exports.commonSchemas = exports.validateHIPAACompliance = exports.validateFileUpload = exports.validateParams = exports.validateQuery = exports.validateSchema = void 0;
const zod_1 = require("zod");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
/**
 * Zod schema validation middleware
 */
const validateSchema = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                logger_1.enhancedLogger.warn('Validation failed', {
                    path: req.path,
                    errors: validationErrors,
                    requestId: req.headers['x-request-id']
                });
                const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
                next(new errorHandler_1.ValidationError(errorMessage));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateSchema = validateSchema;
/**
 * Query parameter validation
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
                next(new errorHandler_1.ValidationError(`Query validation failed: ${errorMessage}`));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateQuery = validateQuery;
/**
 * Path parameter validation
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
                next(new errorHandler_1.ValidationError(`Parameter validation failed: ${errorMessage}`));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateParams = validateParams;
/**
 * File upload validation
 */
const validateFileUpload = (options) => {
    return (req, res, next) => {
        const { maxSize = 10 * 1024 * 1024, allowedTypes = [], required = false } = options;
        if (required && (!req.file && !req.files)) {
            return next(new errorHandler_1.ValidationError('File upload is required'));
        }
        if (!req.file && !req.files) {
            return next();
        }
        const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];
        for (const file of files) {
            if (!file)
                continue;
            // Check file size
            if (file.size > maxSize) {
                return next(new errorHandler_1.ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`));
            }
            // Check file type
            if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
                return next(new errorHandler_1.ValidationError(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
            }
        }
        next();
    };
};
exports.validateFileUpload = validateFileUpload;
/**
 * HIPAA-compliant data validation
 */
const validateHIPAACompliance = (req, res, next) => {
    var _a;
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
        logger_1.enhancedLogger.audit('PHI_PROCESSING', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, undefined, {
            endpoint: req.path,
            method: req.method,
            hasAuthentication: !!req.user,
            ip: req.ip
        });
        // Ensure user is authenticated for PHI access
        if (!req.user) {
            return next(new errorHandler_1.ValidationError('Authentication required for PHI access'));
        }
    }
    next();
};
exports.validateHIPAACompliance = validateHIPAACompliance;
// Common validation schemas
exports.commonSchemas = {
    // User schemas
    userRegistration: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
        firstName: zod_1.z.string().min(1, 'First name is required'),
        lastName: zod_1.z.string().min(1, 'Last name is required'),
        role: zod_1.z.enum(['patient', 'provider', 'admin']).optional(),
        dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
        phoneNumber: zod_1.z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional()
    }),
    userLogin: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(1, 'Password is required')
    }),
    // Health assessment schemas
    healthAssessment: zod_1.z.object({
        patientId: zod_1.z.string().uuid('Invalid patient ID'),
        assessmentType: zod_1.z.enum(['comprehensive', 'focused', 'screening']),
        symptoms: zod_1.z.array(zod_1.z.string()).optional(),
        vitalSigns: zod_1.z.object({
            heartRate: zod_1.z.number().min(30).max(200).optional(),
            bloodPressure: zod_1.z.object({
                systolic: zod_1.z.number().min(70).max(250),
                diastolic: zod_1.z.number().min(40).max(150)
            }).optional(),
            temperature: zod_1.z.number().min(95).max(110).optional(),
            respiratoryRate: zod_1.z.number().min(8).max(40).optional()
        }).optional(),
        notes: zod_1.z.string().max(5000, 'Notes cannot exceed 5000 characters').optional()
    }),
    // Voice biomarker schemas
    voiceBiomarker: zod_1.z.object({
        patientId: zod_1.z.string().uuid('Invalid patient ID'),
        audioData: zod_1.z.string().min(1, 'Audio data is required'),
        duration: zod_1.z.number().min(1, 'Duration must be at least 1 second'),
        sampleRate: zod_1.z.number().min(8000, 'Sample rate must be at least 8000 Hz'),
        format: zod_1.z.enum(['wav', 'mp3', 'flac']),
        analysisType: zod_1.z.enum(['respiratory', 'neurological', 'mental_health', 'comprehensive'])
    }),
    // Pagination schemas
    pagination: zod_1.z.object({
        page: zod_1.z.string().transform(Number).refine(n => n > 0, 'Page must be positive').optional(),
        limit: zod_1.z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    }),
    // ID parameter schema
    idParam: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid ID format')
    })
};
const validationMiddleware = (req, res, next) => {
    // Add request ID for tracking
    req.requestId = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Set request ID header for response
    res.setHeader('X-Request-ID', req.requestId);
    next();
};
exports.validationMiddleware = validationMiddleware;
exports.default = {
    validateSchema: exports.validateSchema,
    validateQuery: exports.validateQuery,
    validateParams: exports.validateParams,
    validateFileUpload: exports.validateFileUpload,
    validateHIPAACompliance: exports.validateHIPAACompliance,
    validationMiddleware: exports.validationMiddleware,
    commonSchemas: exports.commonSchemas
};
