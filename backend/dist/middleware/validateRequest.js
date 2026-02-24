"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("../utils/logger");
/**
 * Middleware to validate request using express-validator
 * @param validations Array of validation chains
 * @returns Middleware function
 */
const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        // Log validation errors
        logger_1.logger.warn('Request validation failed', {
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
exports.validateRequest = validateRequest;
/**
 * Middleware to validate request body against a schema
 * @param schema Joi schema to validate against
 * @returns Middleware function
 */
const validateSchema = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map((detail) => ({
                message: detail.message,
                path: detail.path,
                type: detail.type,
            }));
            logger_1.logger.warn('Schema validation failed', {
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
exports.validateSchema = validateSchema;
