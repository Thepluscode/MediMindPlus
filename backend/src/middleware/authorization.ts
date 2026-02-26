import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getKnex } from '../config/knex';
import logger from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';

    const decoded = jwt.verify(token, secret) as { userId: string; role?: string };

    // Get user from database
    const knex = getKnex();
    const user = await knex('users').where({ id: decoded.userId }).first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is inactive',
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'patient',
      first_name: user.first_name,
      last_name: user.last_name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    logger.error('Authentication error', { service: 'authorization-middleware', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that can access the route
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
        required_role: allowedRoles,
        user_role: userRole,
      });
    }

    next();
  };
};

/**
 * Provider-only middleware
 */
export const requireProvider = authorize('provider', 'admin');

/**
 * Patient-only middleware
 */
export const requirePatient = authorize('patient', 'admin');

/**
 * Admin-only middleware
 */
export const requireAdmin = authorize('admin');

/**
 * Provider or Admin middleware
 */
export const requireProviderOrAdmin = authorize('provider', 'admin');

/**
 * Any authenticated user middleware (already covered by authenticate)
 */
export const requireAuth = authenticate;
