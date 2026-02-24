"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireProviderOrAdmin = exports.requireAdmin = exports.requirePatient = exports.requireProvider = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const knex_1 = __importDefault(require("../config/knex"));
/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Get user from database
        const user = await (0, knex_1.default)('users').where({ id: decoded.userId }).first();
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
            });
        }
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};
exports.authenticate = authenticate;
/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that can access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
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
exports.authorize = authorize;
/**
 * Provider-only middleware
 */
exports.requireProvider = (0, exports.authorize)('provider', 'admin');
/**
 * Patient-only middleware
 */
exports.requirePatient = (0, exports.authorize)('patient', 'admin');
/**
 * Admin-only middleware
 */
exports.requireAdmin = (0, exports.authorize)('admin');
/**
 * Provider or Admin middleware
 */
exports.requireProviderOrAdmin = (0, exports.authorize)('provider', 'admin');
/**
 * Any authenticated user middleware (already covered by authenticate)
 */
exports.requireAuth = exports.authenticate;
