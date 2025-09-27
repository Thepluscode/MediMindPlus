// Production Security Manager with HIPAA Compliance
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { enhancedLogger } from '../utils/logger';
import { RedisManager } from '../cache/RedisManager';

export class SecurityManager {
  private redisManager: RedisManager;
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor() {
    this.redisManager = new RedisManager();
    this.encryptionKey = Buffer.from(config.security.encryptionKey, 'hex');
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Redis for session management
      await this.redisManager.initialize();
      
      // Validate encryption key
      if (this.encryptionKey.length !== 32) {
        throw new Error('Encryption key must be 32 bytes (64 hex characters)');
      }
      
      enhancedLogger.info('Security manager initialized successfully');
    } catch (error) {
      enhancedLogger.error('Failed to initialize security manager', {
        error: error.message
      });
      throw error;
    }
  }

  // Password Security
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(config.security.bcryptRounds);
      const hash = await bcrypt.hash(password, salt);
      
      enhancedLogger.debug('Password hashed successfully');
      return hash;
    } catch (error) {
      enhancedLogger.error('Password hashing failed', {
        error: error.message
      });
      throw error;
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      
      enhancedLogger.debug('Password verification completed', {
        isValid
      });
      
      return isValid;
    } catch (error) {
      enhancedLogger.error('Password verification failed', {
        error: error.message
      });
      throw error;
    }
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
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
  generateAccessToken(payload: any): string {
    try {
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: 'medimind-api',
        audience: 'medimind-client'
      });
      
      enhancedLogger.debug('Access token generated', {
        userId: payload.id,
        expiresIn: config.jwt.expiresIn
      });
      
      return token;
    } catch (error) {
      enhancedLogger.error('Access token generation failed', {
        error: error.message,
        userId: payload.id
      });
      throw error;
    }
  }

  generateRefreshToken(payload: any): string {
    try {
      const token = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: 'medimind-api',
        audience: 'medimind-client'
      });
      
      enhancedLogger.debug('Refresh token generated', {
        userId: payload.id,
        expiresIn: config.jwt.refreshExpiresIn
      });
      
      return token;
    } catch (error) {
      enhancedLogger.error('Refresh token generation failed', {
        error: error.message,
        userId: payload.id
      });
      throw error;
    }
  }

  verifyAccessToken(token: string): any {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'medimind-api',
        audience: 'medimind-client'
      });
      
      enhancedLogger.debug('Access token verified successfully');
      return decoded;
    } catch (error) {
      enhancedLogger.warn('Access token verification failed', {
        error: error.message
      });
      throw error;
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'medimind-api',
        audience: 'medimind-client'
      });
      
      enhancedLogger.debug('Refresh token verified successfully');
      return decoded;
    } catch (error) {
      enhancedLogger.warn('Refresh token verification failed', {
        error: error.message
      });
      throw error;
    }
  }

  // Session Management
  async createSession(userId: string, userAgent: string, ipAddress: string): Promise<string> {
    try {
      const sessionId = crypto.randomUUID();
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

      enhancedLogger.audit('SESSION_CREATED', userId, sessionId, {
        userAgent,
        ipAddress
      });

      return sessionId;
    } catch (error) {
      enhancedLogger.error('Session creation failed', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<any> {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await this.redisManager.get(sessionKey);

      if (!sessionData) {
        enhancedLogger.warn('Session not found', { sessionId });
        return null;
      }

      const session = JSON.parse(sessionData);
      
      if (session.status !== 'active') {
        enhancedLogger.warn('Session not active', { 
          sessionId, 
          status: session.status 
        });
        return null;
      }

      return session;
    } catch (error) {
      enhancedLogger.error('Session validation failed', {
        error: error.message,
        sessionId
      });
      throw error;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `session:${sessionId}`;
      await this.redisManager.del(sessionKey);

      enhancedLogger.audit('SESSION_INVALIDATED', undefined, sessionId);
    } catch (error) {
      enhancedLogger.error('Session invalidation failed', {
        error: error.message,
        sessionId
      });
      throw error;
    }
  }

  // Data Encryption (HIPAA Compliance)
  encryptPHI(data: string): { encrypted: string; iv: string; tag: string } {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('medimind-phi'));

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      enhancedLogger.debug('PHI data encrypted');

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      enhancedLogger.error('PHI encryption failed', {
        error: error.message
      });
      throw error;
    }
  }

  decryptPHI(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('medimind-phi'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      enhancedLogger.debug('PHI data decrypted');

      return decrypted;
    } catch (error) {
      enhancedLogger.error('PHI decryption failed', {
        error: error.message
      });
      throw error;
    }
  }

  // Security Utilities
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }
    
    return otp;
  }

  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  verifyDataIntegrity(data: string, hash: string): boolean {
    const computedHash = this.hashData(data);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  }

  // Rate Limiting
  async checkRateLimit(identifier: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
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
        const ttl = await this.redisManager.client?.ttl(key) || 0;
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + (ttl * 1000)
        };
      }

      await this.redisManager.incr(key);
      const ttl = await this.redisManager.client?.ttl(key) || 0;

      return {
        allowed: true,
        remaining: limit - count - 1,
        resetTime: now + (ttl * 1000)
      };
    } catch (error) {
      enhancedLogger.error('Rate limit check failed', {
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

  async close(): Promise<void> {
    await this.redisManager.close();
    enhancedLogger.info('Security manager closed');
  }
}

export default SecurityManager;
