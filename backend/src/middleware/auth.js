// Production-Ready Authentication Middleware with HIPAA Compliance
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { enhancedLogger } from '../utils/logger';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { RedisManager } from '../cache/RedisManager';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
        sessionId: string;
        lastActivity: Date;
      };
      requestId?: string;
    }
  }
}

const redisManager = new RedisManager();

/**
 * Enhanced JWT authentication middleware with session management
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      enhancedLogger.security('Missing authentication token', 'medium', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      throw new AuthenticationError('Authentication token required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Check if session is still valid in Redis
    const sessionKey = `session:${decoded.sessionId}`;
    const sessionData = await redisManager.get(sessionKey);

    if (!sessionData) {
      enhancedLogger.security('Invalid or expired session', 'medium', {
        userId: decoded.id,
        sessionId: decoded.sessionId,
        ip: req.ip
      });
      throw new AuthenticationError('Session expired or invalid');
    }

    // Parse session data
    const session = JSON.parse(sessionData);

    // Check if user is still active
    if (session.status !== 'active') {
      enhancedLogger.security('Inactive user session', 'medium', {
        userId: decoded.id,
        sessionStatus: session.status
      });
      throw new AuthenticationError('User session is not active');
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();
    await redisManager.setex(sessionKey, 86400, JSON.stringify(session)); // 24 hours

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: session.permissions || [],
      sessionId: decoded.sessionId,
      lastActivity: new Date(session.lastActivity)
    };

    // Log successful authentication for audit
    enhancedLogger.audit('USER_AUTHENTICATED', decoded.id, undefined, {
      sessionId: decoded.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      enhancedLogger.security('Invalid JWT token', 'medium', {
        error: error.message,
        ip: req.ip
      });
      next(new AuthenticationError('Invalid authentication token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      enhancedLogger.security('Expired JWT token', 'low', {
        ip: req.ip
      });
      next(new AuthenticationError('Authentication token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Enhanced role-based authorization middleware
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      enhancedLogger.security('Authorization attempted without authentication', 'high', {
        ip: req.ip,
        path: req.path
      });
      return next(new AuthenticationError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      enhancedLogger.security('Unauthorized role access attempt', 'medium', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        ip: req.ip
      });

      enhancedLogger.audit('AUTHORIZATION_FAILED', req.user.id, undefined, {
        requiredRoles: roles,
        userRole: req.user.role,
        path: req.path
      });

      return next(new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`));
    }

    // Log successful authorization
    enhancedLogger.audit('AUTHORIZATION_SUCCESS', req.user.id, undefined, {
      role: req.user.role,
      path: req.path
    });

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
export const authorizePermissions = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(permission => userPermissions.includes(permission));

    if (!hasPermission) {
      enhancedLogger.security('Unauthorized permission access attempt', 'medium', {
        userId: req.user.id,
        userPermissions,
        requiredPermissions: permissions,
        path: req.path
      });

      return next(new AuthorizationError(`Access denied. Required permissions: ${permissions.join(', ')}`));
    }

    next();
  };
};

/**
 * Optional authentication middleware (for public endpoints with optional user context)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const sessionKey = `session:${decoded.sessionId}`;
      const sessionData = await redisManager.get(sessionKey);

      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.status === 'active') {
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            permissions: session.permissions || [],
            sessionId: decoded.sessionId,
            lastActivity: new Date(session.lastActivity)
          };
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

/**
 * HIPAA compliance middleware - ensures PHI access is logged
 */
export const hipaaCompliance = (resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('HIPAA compliance requires authentication'));
    }

    // Log PHI access for audit trail
    enhancedLogger.audit('PHI_ACCESS', req.user.id, req.params.id || req.body.id, {
      resourceType,
      action: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  };
};

/**
 * Rate limiting per user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const key = `rate_limit:${req.user.id}:${req.path}`;
    const current = await redisManager.get(key);

    if (current && parseInt(current) >= maxRequests) {
      enhancedLogger.security('User rate limit exceeded', 'medium', {
        userId: req.user.id,
        path: req.path,
        requests: current
      });

      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    await redisManager.incr(key);
    await redisManager.expire(key, Math.ceil(windowMs / 1000));

    next();
  };
};

// Legacy exports for backward compatibility
export const authenticateToken = authMiddleware;

export default {
  authMiddleware,
  authenticateToken,
  authorizeRoles,
  authorizePermissions,
  optionalAuth,
  hipaaCompliance,
  userRateLimit
};
