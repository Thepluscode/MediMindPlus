"use strict";
/**
 * Analytics Types and Interfaces for MediMind Backend
 * Comprehensive type definitions for analytics services, data structures, and API responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsServiceError = void 0;
class AnalyticsServiceError extends Error {
    constructor(message, code, statusCode = 500, details) {
        super(message);
        this.name = 'AnalyticsServiceError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.AnalyticsServiceError = AnalyticsServiceError;
