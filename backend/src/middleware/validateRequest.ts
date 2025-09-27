import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request using express-validator
 * @param validations Array of validation chains
 * @returns Middleware function
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Log validation errors
    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      body: req.body,
      params: req.params,
      query: req.query,
    });

    return res.status(400).json({
      success: false,
      errors: errors.array(),
      message: 'Validation failed',
      timestamp: new Date().toISOString(),
    });
  };
};

/**
 * Middleware to validate request body against a schema
 * @param schema Joi schema to validate against
 * @returns Middleware function
 */
export const validateSchema = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail: any) => ({
        message: detail.message,
        path: detail.path,
        type: detail.type,
      }));

      logger.warn('Schema validation failed', {
        path: req.path,
        method: req.method,
        errors,
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString(),
      });
    }
    
    next();
  };
};
