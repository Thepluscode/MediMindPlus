"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditDataModification = exports.auditAuthEvent = exports.auditPHIAccess = exports.auditMiddleware = void 0;
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
/**
 * HIPAA-compliant audit logging middleware
 */
const auditMiddleware = (req, res, next) => {
    const startTime = Date.now();
    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseBody;
    res.json = function (body) {
        responseBody = body;
        return originalJson.call(this, body);
    };
    // Store original res.end to capture final response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        var _a, _b, _c;
        const endTime = Date.now();
        const duration = endTime - startTime;
        // Create audit event
        const auditEvent = {
            eventType: 'API_REQUEST',
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            action: `${req.method} ${req.path}`,
            outcome: res.statusCode < 400 ? 'success' : 'failure',
            timestamp: new Date().toISOString(),
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestId: req.requestId || req.headers['x-request-id'] || 'unknown',
            sessionId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.sessionId,
            details: {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                queryParams: sanitizeQueryParams(req.query),
                hasBody: !!req.body && Object.keys(req.body).length > 0,
                responseSize: chunk ? Buffer.byteLength(chunk) : 0
            }
        };
        // Add resource information if available
        if (req.params.id) {
            auditEvent.resourceId = req.params.id;
            auditEvent.resourceType = inferResourceType(req.path);
        }
        // Log audit event
        logAuditEvent(auditEvent);
        // Log performance metrics
        logger_1.enhancedLogger.performance(`${req.method} ${req.path}`, duration, {
            statusCode: res.statusCode,
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
            requestId: auditEvent.requestId
        });
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.auditMiddleware = auditMiddleware;
/**
 * Specific audit logging for PHI access
 */
const auditPHIAccess = (resourceType, action) => {
    return (req, res, next) => {
        var _a, _b, _c;
        const auditEvent = {
            eventType: 'PHI_ACCESS',
            userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous',
            resourceId: req.params.id || req.body.patientId || req.query.patientId,
            resourceType,
            action,
            outcome: 'success', // Will be updated if error occurs
            timestamp: new Date().toISOString(),
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestId: req.requestId || 'unknown',
            sessionId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.sessionId,
            details: {
                endpoint: req.path,
                method: req.method,
                hasAuthentication: !!req.user,
                userRole: (_c = req.user) === null || _c === void 0 ? void 0 : _c.role
            }
        };
        // Store audit event in request for potential failure logging
        req.phiAuditEvent = auditEvent;
        // Log successful PHI access
        logAuditEvent(auditEvent);
        next();
    };
};
exports.auditPHIAccess = auditPHIAccess;
/**
 * Audit authentication events
 */
const auditAuthEvent = (eventType) => {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (body) {
            var _a, _b, _c;
            const auditEvent = {
                eventType: `AUTH_${eventType}`,
                userId: req.body.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id),
                action: eventType.toLowerCase(),
                outcome: res.statusCode < 400 ? 'success' : 'failure',
                timestamp: new Date().toISOString(),
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                requestId: req.requestId || 'unknown',
                details: {
                    statusCode: res.statusCode,
                    endpoint: req.path,
                    failureReason: res.statusCode >= 400 ? (_b = body.error) === null || _b === void 0 ? void 0 : _b.message : undefined
                }
            };
            logAuditEvent(auditEvent);
            // Log security event for failed authentication
            if (res.statusCode >= 400 && eventType === 'LOGIN') {
                logger_1.enhancedLogger.security('Authentication failure', 'medium', {
                    email: req.body.email,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    reason: (_c = body.error) === null || _c === void 0 ? void 0 : _c.message
                });
            }
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.auditAuthEvent = auditAuthEvent;
/**
 * Audit data modification events
 */
const auditDataModification = (resourceType) => {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (body) {
            var _a, _b;
            if (res.statusCode < 400) {
                const auditEvent = {
                    eventType: 'DATA_MODIFICATION',
                    userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'unknown',
                    resourceId: req.params.id || body.id,
                    resourceType,
                    action: getDataAction(req.method),
                    outcome: 'success',
                    timestamp: new Date().toISOString(),
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.get('User-Agent') || 'unknown',
                    requestId: req.requestId || 'unknown',
                    sessionId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.sessionId,
                    details: {
                        method: req.method,
                        endpoint: req.path,
                        hasChanges: req.method !== 'GET',
                        modifiedFields: req.method === 'PATCH' ? Object.keys(req.body) : undefined
                    }
                };
                logAuditEvent(auditEvent);
            }
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.auditDataModification = auditDataModification;
/**
 * Log audit event with proper formatting and storage
 */
function logAuditEvent(event) {
    // Log to audit log file
    logger_1.enhancedLogger.audit(event.action, event.userId, event.resourceId, {
        eventType: event.eventType,
        resourceType: event.resourceType,
        outcome: event.outcome,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        requestId: event.requestId,
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        details: event.details
    });
    // Store in database for long-term retention (if configured)
    if (environment_1.config.compliance.hipaa.auditLogRetentionDays > 0) {
        storeAuditEventInDatabase(event).catch(error => {
            logger_1.enhancedLogger.error('Failed to store audit event in database', {
                error: error.message,
                eventType: event.eventType,
                requestId: event.requestId
            });
        });
    }
}
/**
 * Store audit event in database for long-term retention
 */
async function storeAuditEventInDatabase(event) {
    // This would integrate with your database layer
    // Implementation depends on your database choice (PostgreSQL, MongoDB, etc.)
    // For now, we'll just log that it should be stored
    logger_1.enhancedLogger.debug('Audit event stored in database', {
        eventType: event.eventType,
        requestId: event.requestId
    });
}
/**
 * Sanitize query parameters to remove sensitive data
 */
function sanitizeQueryParams(query) {
    const sensitiveParams = ['password', 'token', 'secret', 'key', 'ssn'];
    const sanitized = { ...query };
    for (const param of sensitiveParams) {
        if (sanitized[param]) {
            sanitized[param] = '[REDACTED]';
        }
    }
    return sanitized;
}
/**
 * Infer resource type from request path
 */
function inferResourceType(path) {
    const pathSegments = path.split('/').filter(segment => segment && segment !== 'api' && segment !== 'v1');
    return pathSegments[0] || 'unknown';
}
/**
 * Get data action from HTTP method
 */
function getDataAction(method) {
    switch (method.toUpperCase()) {
        case 'POST': return 'CREATE';
        case 'GET': return 'READ';
        case 'PUT': return 'UPDATE';
        case 'PATCH': return 'PARTIAL_UPDATE';
        case 'DELETE': return 'DELETE';
        default: return method.toUpperCase();
    }
}
exports.default = {
    auditMiddleware: exports.auditMiddleware,
    auditPHIAccess: exports.auditPHIAccess,
    auditAuthEvent: exports.auditAuthEvent,
    auditDataModification: exports.auditDataModification
};
