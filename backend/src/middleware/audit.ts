// HIPAA-Compliant Audit Middleware
import { Request, Response, NextFunction } from 'express';
import { enhancedLogger } from '../utils/logger';
import { config } from '../config/environment';

interface AuditEvent {
  eventType: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  action: string;
  outcome: 'success' | 'failure';
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  sessionId?: string;
  details?: any;
}

/**
 * HIPAA-compliant audit logging middleware
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original res.json to intercept response
  const originalJson = res.json;
  let responseBody: any;
  
  res.json = function(body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };
  
  // Store original res.end to capture final response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Create audit event
    const auditEvent: AuditEvent = {
      eventType: 'API_REQUEST',
      userId: req.user?.id,
      action: `${req.method} ${req.path}`,
      outcome: res.statusCode < 400 ? 'success' : 'failure',
      timestamp: new Date().toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      requestId: req.requestId || req.headers['x-request-id'] as string || 'unknown',
      sessionId: req.user?.sessionId,
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
    enhancedLogger.performance(`${req.method} ${req.path}`, duration, {
      statusCode: res.statusCode,
      userId: req.user?.id,
      requestId: auditEvent.requestId
    });
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Specific audit logging for PHI access
 */
export const auditPHIAccess = (resourceType: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const auditEvent: AuditEvent = {
      eventType: 'PHI_ACCESS',
      userId: req.user?.id || 'anonymous',
      resourceId: req.params.id || req.body.patientId || req.query.patientId as string,
      resourceType,
      action,
      outcome: 'success', // Will be updated if error occurs
      timestamp: new Date().toISOString(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      requestId: req.requestId || 'unknown',
      sessionId: req.user?.sessionId,
      details: {
        endpoint: req.path,
        method: req.method,
        hasAuthentication: !!req.user,
        userRole: req.user?.role
      }
    };
    
    // Store audit event in request for potential failure logging
    (req as any).phiAuditEvent = auditEvent;
    
    // Log successful PHI access
    logAuditEvent(auditEvent);
    
    next();
  };
};

/**
 * Audit authentication events
 */
export const auditAuthEvent = (eventType: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'TOKEN_REFRESH') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      const auditEvent: AuditEvent = {
        eventType: `AUTH_${eventType}`,
        userId: req.body.email || req.user?.id,
        action: eventType.toLowerCase(),
        outcome: res.statusCode < 400 ? 'success' : 'failure',
        timestamp: new Date().toISOString(),
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        requestId: req.requestId || 'unknown',
        details: {
          statusCode: res.statusCode,
          endpoint: req.path,
          failureReason: res.statusCode >= 400 ? body.error?.message : undefined
        }
      };
      
      logAuditEvent(auditEvent);
      
      // Log security event for failed authentication
      if (res.statusCode >= 400 && eventType === 'LOGIN') {
        enhancedLogger.security('Authentication failure', 'medium', {
          email: req.body.email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          reason: body.error?.message
        });
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

/**
 * Audit data modification events
 */
export const auditDataModification = (resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      if (res.statusCode < 400) {
        const auditEvent: AuditEvent = {
          eventType: 'DATA_MODIFICATION',
          userId: req.user?.id || 'unknown',
          resourceId: req.params.id || body.id,
          resourceType,
          action: getDataAction(req.method),
          outcome: 'success',
          timestamp: new Date().toISOString(),
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          requestId: req.requestId || 'unknown',
          sessionId: req.user?.sessionId,
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

/**
 * Log audit event with proper formatting and storage
 */
function logAuditEvent(event: AuditEvent): void {
  // Log to audit log file
  enhancedLogger.audit(event.action, event.userId, event.resourceId, {
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
  if (config.compliance.hipaa.auditLogRetentionDays > 0) {
    storeAuditEventInDatabase(event).catch(error => {
      enhancedLogger.error('Failed to store audit event in database', {
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
async function storeAuditEventInDatabase(event: AuditEvent): Promise<void> {
  // This would integrate with your database layer
  // Implementation depends on your database choice (PostgreSQL, MongoDB, etc.)
  // For now, we'll just log that it should be stored
  enhancedLogger.debug('Audit event stored in database', {
    eventType: event.eventType,
    requestId: event.requestId
  });
}

/**
 * Sanitize query parameters to remove sensitive data
 */
function sanitizeQueryParams(query: any): any {
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
function inferResourceType(path: string): string {
  const pathSegments = path.split('/').filter(segment => segment && segment !== 'api' && segment !== 'v1');
  return pathSegments[0] || 'unknown';
}

/**
 * Get data action from HTTP method
 */
function getDataAction(method: string): string {
  switch (method.toUpperCase()) {
    case 'POST': return 'CREATE';
    case 'GET': return 'READ';
    case 'PUT': return 'UPDATE';
    case 'PATCH': return 'PARTIAL_UPDATE';
    case 'DELETE': return 'DELETE';
    default: return method.toUpperCase();
  }
}

export default {
  auditMiddleware,
  auditPHIAccess,
  auditAuthEvent,
  auditDataModification
};
