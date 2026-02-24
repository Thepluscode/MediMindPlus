"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityManager = void 0;
// Production Security Manager with HIPAA Compliance
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
const RedisManager_1 = require("../cache/RedisManager");
class SecurityManager {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.redisManager = new RedisManager_1.RedisManager();
        this.encryptionKey = Buffer.from(environment_1.config.security.encryptionKey, 'hex');
    }
    async initialize() {
        try {
            // Initialize Redis for session management
            await this.redisManager.initialize();
            // Validate encryption key
            if (this.encryptionKey.length !== 32) {
                throw new Error('Encryption key must be 32 bytes (64 hex characters)');
            }
            logger_1.enhancedLogger.info('Security manager initialized successfully');
        }
        catch (error) {
            logger_1.enhancedLogger.error('Failed to initialize security manager', {
                error: error.message
            });
            throw error;
        }
    }
    // Password Security
    async hashPassword(password) {
        try {
            const salt = await bcryptjs_1.default.genSalt(environment_1.config.security.bcryptRounds);
            const hash = await bcryptjs_1.default.hash(password, salt);
            logger_1.enhancedLogger.debug('Password hashed successfully');
            return hash;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Password hashing failed', {
                error: error.message
            });
            throw error;
        }
    }
    async verifyPassword(password, hash) {
        try {
            const isValid = await bcryptjs_1.default.compare(password, hash);
            logger_1.enhancedLogger.debug('Password verification completed', {
                isValid
            });
            return isValid;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Password verification failed', {
                error: error.message
            });
            throw error;
        }
    }
    validatePasswordStrength(password) {
        const errors = [];
        let score = 0;
        // Length check
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        else if (password.length >= 12) {
            score += 2;
        }
        else {
            score += 1;
        }
        // Character variety checks
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        else {
            score += 1;
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        else {
            score += 1;
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        else {
            score += 1;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        else {
            score += 1;
        }
        // Common password check
        const commonPasswords = [
            'password', '123456', 'password123', 'admin', 'qwerty',
            'letmein', 'welcome', 'monkey', '1234567890'
        ];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common');
            score = Math.max(0, score - 2);
        }
        return {
            isValid: errors.length === 0,
            errors,
            score: Math.min(5, score) // Max score of 5
        };
    }
    // JWT Token Management
    generateAccessToken(payload) {
        try {
            const token = jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.secret, {
                expiresIn: environment_1.config.jwt.expiresIn,
                issuer: 'medimind-api',
                audience: 'medimind-client'
            });
            logger_1.enhancedLogger.debug('Access token generated', {
                userId: payload.id,
                expiresIn: environment_1.config.jwt.expiresIn
            });
            return token;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Access token generation failed', {
                error: error.message,
                userId: payload.id
            });
            throw error;
        }
    }
    generateRefreshToken(payload) {
        try {
            const token = jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.refreshSecret, {
                expiresIn: environment_1.config.jwt.refreshExpiresIn,
                issuer: 'medimind-api',
                audience: 'medimind-client'
            });
            logger_1.enhancedLogger.debug('Refresh token generated', {
                userId: payload.id,
                expiresIn: environment_1.config.jwt.refreshExpiresIn
            });
            return token;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Refresh token generation failed', {
                error: error.message,
                userId: payload.id
            });
            throw error;
        }
    }
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret, {
                issuer: 'medimind-api',
                audience: 'medimind-client'
            });
            logger_1.enhancedLogger.debug('Access token verified successfully');
            return decoded;
        }
        catch (error) {
            logger_1.enhancedLogger.warn('Access token verification failed', {
                error: error.message
            });
            throw error;
        }
    }
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.refreshSecret, {
                issuer: 'medimind-api',
                audience: 'medimind-client'
            });
            logger_1.enhancedLogger.debug('Refresh token verified successfully');
            return decoded;
        }
        catch (error) {
            logger_1.enhancedLogger.warn('Refresh token verification failed', {
                error: error.message
            });
            throw error;
        }
    }
    // Session Management
    async createSession(userId, userAgent, ipAddress) {
        try {
            const sessionId = crypto_1.default.randomUUID();
            const sessionData = {
                userId,
                userAgent,
                ipAddress,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                status: 'active'
            };
            const sessionKey = `session:${sessionId}`;
            await this.redisManager.setex(sessionKey, 86400, JSON.stringify(sessionData)); // 24 hours
            logger_1.enhancedLogger.audit('SESSION_CREATED', userId, sessionId, {
                userAgent,
                ipAddress
            });
            return sessionId;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Session creation failed', {
                error: error.message,
                userId
            });
            throw error;
        }
    }
    async validateSession(sessionId) {
        try {
            const sessionKey = `session:${sessionId}`;
            const sessionData = await this.redisManager.get(sessionKey);
            if (!sessionData) {
                logger_1.enhancedLogger.warn('Session not found', { sessionId });
                return null;
            }
            const session = JSON.parse(sessionData);
            if (session.status !== 'active') {
                logger_1.enhancedLogger.warn('Session not active', {
                    sessionId,
                    status: session.status
                });
                return null;
            }
            return session;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Session validation failed', {
                error: error.message,
                sessionId
            });
            throw error;
        }
    }
    async invalidateSession(sessionId) {
        try {
            const sessionKey = `session:${sessionId}`;
            await this.redisManager.del(sessionKey);
            logger_1.enhancedLogger.audit('SESSION_INVALIDATED', undefined, sessionId);
        }
        catch (error) {
            logger_1.enhancedLogger.error('Session invalidation failed', {
                error: error.message,
                sessionId
            });
            throw error;
        }
    }
    // Data Encryption (HIPAA Compliance)
    encryptPHI(data) {
        try {
            const iv = crypto_1.default.randomBytes(16);
            const cipher = crypto_1.default.createCipher(this.algorithm, this.encryptionKey);
            cipher.setAAD(Buffer.from('medimind-phi'));
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            logger_1.enhancedLogger.debug('PHI data encrypted');
            return {
                encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex')
            };
        }
        catch (error) {
            logger_1.enhancedLogger.error('PHI encryption failed', {
                error: error.message
            });
            throw error;
        }
    }
    decryptPHI(encryptedData) {
        try {
            const decipher = crypto_1.default.createDecipher(this.algorithm, this.encryptionKey);
            decipher.setAAD(Buffer.from('medimind-phi'));
            decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            logger_1.enhancedLogger.debug('PHI data decrypted');
            return decrypted;
        }
        catch (error) {
            logger_1.enhancedLogger.error('PHI decryption failed', {
                error: error.message
            });
            throw error;
        }
    }
    // Security Utilities
    generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[crypto_1.default.randomInt(0, digits.length)];
        }
        return otp;
    }
    hashData(data) {
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    verifyDataIntegrity(data, hash) {
        const computedHash = this.hashData(data);
        return crypto_1.default.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
    }
    // Rate Limiting
    async checkRateLimit(identifier, limit, windowMs) {
        var _a, _b;
        try {
            const key = `rate_limit:${identifier}`;
            const current = await this.redisManager.get(key);
            const now = Date.now();
            if (!current) {
                await this.redisManager.setex(key, Math.ceil(windowMs / 1000), '1');
                return {
                    allowed: true,
                    remaining: limit - 1,
                    resetTime: now + windowMs
                };
            }
            const count = parseInt(current);
            if (count >= limit) {
                const ttl = await ((_a = this.redisManager.client) === null || _a === void 0 ? void 0 : _a.ttl(key)) || 0;
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: now + (ttl * 1000)
                };
            }
            await this.redisManager.incr(key);
            const ttl = await ((_b = this.redisManager.client) === null || _b === void 0 ? void 0 : _b.ttl(key)) || 0;
            return {
                allowed: true,
                remaining: limit - count - 1,
                resetTime: now + (ttl * 1000)
            };
        }
        catch (error) {
            logger_1.enhancedLogger.error('Rate limit check failed', {
                error: error.message,
                identifier
            });
            // Fail open for rate limiting errors
            return {
                allowed: true,
                remaining: limit,
                resetTime: Date.now() + windowMs
            };
        }
    }
    async close() {
        await this.redisManager.close();
        logger_1.enhancedLogger.info('Security manager closed');
    }
}
exports.SecurityManager = SecurityManager;
exports.default = SecurityManager;
