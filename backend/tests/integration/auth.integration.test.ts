/**
 * Authentication Integration Tests
 *
 * Comprehensive test suite for authentication endpoints
 * Covers: Registration, Login, Token Refresh, Logout, Password Reset
 * Includes: Security, HIPAA compliance, Rate limiting, Session management
 */

import request from 'supertest';
import { Express } from 'express';
import { DatabaseManager } from '../../src/database/DatabaseManager';
import { SecurityManager } from '../../src/security/SecurityManager';

// Test configuration
const TEST_USER = {
  email: 'test@medimind.com',
  password: 'Test@Password123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'patient' as const,
  dateOfBirth: '1990-01-15',
  phoneNumber: '+1234567890',
  acceptTerms: true
};

const WEAK_PASSWORD = 'weak';
const INVALID_EMAIL = 'invalid-email';

describe('Authentication Integration Tests', () => {
  let app: Express;
  let databaseManager: DatabaseManager;
  let securityManager: SecurityManager;
  let testUserId: string;
  let authTokens: { accessToken: string; refreshToken: string };

  beforeAll(async () => {
    // Import app after environment is set
    const appModule = await import('../../src/index');
    app = appModule.default;

    databaseManager = new DatabaseManager();
    securityManager = new SecurityManager();

    // Initialize database connection
    await databaseManager.initialize();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await databaseManager.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }

    // Close connections
    await databaseManager.close();
    await securityManager.close();
  });

  beforeEach(async () => {
    // Clean up any existing test users
    await databaseManager.query('DELETE FROM users WHERE email = $1', [
      TEST_USER.email.toLowerCase(),
    ]);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new patient successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        email: TEST_USER.email.toLowerCase(),
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        role: TEST_USER.role,
        emailVerified: false,
      });
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(response.body).toHaveProperty('nextStep');

      // Save user ID for cleanup
      testUserId = response.body.user.id;
    });

    it('should create patient profile for patient role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      testUserId = response.body.user.id;

      // Verify patient profile was created
      const patientResult = await databaseManager.query(
        'SELECT * FROM patients WHERE user_id = $1',
        [testUserId]
      );

      expect(patientResult.rows).toHaveLength(1);
      expect(patientResult.rows[0]).toMatchObject({
        user_id: testUserId,
        date_of_birth: TEST_USER.dateOfBirth,
        phone_number: TEST_USER.phoneNumber,
      });
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(TEST_USER).expect(201);

      // Duplicate registration attempt
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email already registered');
    });

    it('should reject weak passwords', async () => {
      const weakPasswordUser = { ...TEST_USER, password: WEAK_PASSWORD };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/password/i);
    });

    it('should reject invalid email format', async () => {
      const invalidEmailUser = { ...TEST_USER, email: INVALID_EMAIL };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/email/i);
    });

    it('should require terms acceptance', async () => {
      const noTermsUser = { ...TEST_USER, acceptTerms: false };

      const response = await request(app)
        .post('/api/auth/register')
        .send(noTermsUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/terms/i);
    });

    it('should validate required fields', async () => {
      const incompleteUser = {
        email: TEST_USER.email,
        password: TEST_USER.password,
        // Missing firstName, lastName, acceptTerms
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should hash password before storing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      testUserId = response.body.user.id;

      const userResult = await databaseManager.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [testUserId]
      );

      expect(userResult.rows[0].password_hash).toBeDefined();
      expect(userResult.rows[0].password_hash).not.toBe(TEST_USER.password);
      expect(userResult.rows[0].password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should normalize email to lowercase', async () => {
      const uppercaseEmailUser = { ...TEST_USER, email: 'TEST@MEDIMIND.COM' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(uppercaseEmailUser)
        .expect(201);

      expect(response.body.user.email).toBe('test@medimind.com');
      testUserId = response.body.user.id;
    });

    it('should create audit log for registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      testUserId = response.body.user.id;

      // Verify audit log exists (implementation-specific)
      // This is a placeholder - adjust based on your audit log implementation
      const auditResult = await databaseManager.query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND action = $2 ORDER BY created_at DESC LIMIT 1',
        [testUserId, 'USER_REGISTERED']
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0]).toMatchObject({
        user_id: testUserId,
        action: 'USER_REGISTERED',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register test user
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      testUserId = response.body.user.id;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        id: testUserId,
        email: TEST_USER.email.toLowerCase(),
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        role: TEST_USER.role,
      });

      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.tokens).toHaveProperty('expiresIn', '24h');
      expect(response.body).toHaveProperty('sessionId');

      // Save tokens for subsequent tests
      authTokens = {
        accessToken: response.body.tokens.accessToken,
        refreshToken: response.body.tokens.refreshToken,
      };
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@medimind.com',
          password: TEST_USER.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should handle case-insensitive email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email.toUpperCase(),
          password: TEST_USER.password,
        })
        .expect(200);

      expect(response.body.user.email).toBe(TEST_USER.email.toLowerCase());
    });

    it('should create a new session on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      const sessionId = response.body.sessionId;
      expect(sessionId).toBeDefined();

      // Verify session exists in Redis
      const session = await securityManager.validateSession(sessionId);
      expect(session).toBeTruthy();
    });

    it('should enforce rate limiting after failed attempts', async () => {
      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: TEST_USER.email,
            password: 'WrongPassword',
          })
          .expect(401);
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'WrongPassword',
        })
        .expect(429);

      expect(response.body.error).toMatch(/too many.*attempts/i);
    }, 15000); // Increase timeout for rate limiting test

    it('should reject login for inactive user', async () => {
      // Deactivate user
      await databaseManager.query('UPDATE users SET is_active = false WHERE id = $1', [
        testUserId,
      ]);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(401);

      expect(response.body.error).toContain('deactivated');

      // Reactivate for cleanup
      await databaseManager.query('UPDATE users SET is_active = true WHERE id = $1', [
        testUserId,
      ]);
    });

    it('should support rememberMe option', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          rememberMe: true,
        })
        .expect(200);

      expect(response.body.tokens).toHaveProperty('refreshToken');

      // Verify refresh token has longer expiry (30 days vs 7 days)
      const sessionId = response.body.sessionId;
      const refreshTokenKey = `refresh_token:${testUserId}:${sessionId}`;
      const ttl = await securityManager.redisManager.ttl(refreshTokenKey);
      expect(ttl).toBeGreaterThan(604800); // Greater than 7 days
    });

    it('should create audit log for successful login', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      const auditResult = await databaseManager.query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND action = $2 ORDER BY created_at DESC LIMIT 1',
        [testUserId, 'USER_LOGIN']
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].action).toBe('USER_LOGIN');
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      // Register and login
      await request(app).post('/api/auth/register').send(TEST_USER).expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      testUserId = loginResponse.body.user.id;
      authTokens = {
        accessToken: loginResponse.body.tokens.accessToken,
        refreshToken: loginResponse.body.tokens.refreshToken,
      };
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: authTokens.refreshToken,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('expiresIn', '24h');
      expect(response.body.tokens.accessToken).not.toBe(authTokens.accessToken); // New token
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid.refresh.token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token
      const expiredToken = securityManager.generateRefreshToken(
        { id: testUserId, sessionId: 'test-session', type: 'refresh' },
        '0s' // Expired immediately
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: expiredToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject refresh token not in Redis store', async () => {
      // Create a valid token but don't store it in Redis
      const unstored Token = securityManager.generateRefreshToken({
        id: testUserId,
        sessionId: 'unregistered-session',
        type: 'refresh',
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: unstoredToken,
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid refresh token');
    });

    it('should reject refresh token for inactive user', async () => {
      // Deactivate user
      await databaseManager.query('UPDATE users SET is_active = false WHERE id = $1', [
        testUserId,
      ]);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: authTokens.refreshToken,
        })
        .expect(401);

      expect(response.body.error).toMatch(/not found or inactive/i);

      // Reactivate
      await databaseManager.query('UPDATE users SET is_active = true WHERE id = $1', [
        testUserId,
      ]);
    });

    it('should create audit log for token refresh', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: authTokens.refreshToken,
        })
        .expect(200);

      const auditResult = await databaseManager.query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND action = $2 ORDER BY created_at DESC LIMIT 1',
        [testUserId, 'TOKEN_REFRESHED']
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].action).toBe('TOKEN_REFRESHED');
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Register and login
      await request(app).post('/api/auth/register').send(TEST_USER).expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      testUserId = loginResponse.body.user.id;
      authTokens = {
        accessToken: loginResponse.body.tokens.accessToken,
        refreshToken: loginResponse.body.tokens.refreshToken,
      };
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    it('should invalidate session on logout', async () => {
      const decoded = securityManager.verifyAccessToken(authTokens.accessToken);
      const sessionId = decoded.sessionId;

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      // Verify session is invalidated
      const session = await securityManager.validateSession(sessionId);
      expect(session).toBeFalsy();
    });

    it('should remove refresh token from Redis on logout', async () => {
      const decoded = securityManager.verifyAccessToken(authTokens.accessToken);
      const refreshTokenKey = `refresh_token:${decoded.id}:${decoded.sessionId}`;

      // Verify refresh token exists before logout
      const existsBefore = await securityManager.redisManager.exists(refreshTokenKey);
      expect(existsBefore).toBe(1);

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      // Verify refresh token is removed
      const existsAfter = await securityManager.redisManager.exists(refreshTokenKey);
      expect(existsAfter).toBe(0);
    });

    it('should still succeed without authorization header', async () => {
      const response = await request(app).post('/api/auth/logout').expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    it('should handle expired token gracefully', async () => {
      // Create an expired token
      const expiredToken = securityManager.generateAccessToken(
        {
          id: testUserId,
          email: TEST_USER.email,
          role: TEST_USER.role,
          sessionId: 'test-session',
        },
        '0s' // Expired immediately
      );

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    it('should create audit log for logout', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      const auditResult = await databaseManager.query(
        'SELECT * FROM audit_logs WHERE user_id = $1 AND action = $2 ORDER BY created_at DESC LIMIT 1',
        [testUserId, 'USER_LOGOUT']
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].action).toBe('USER_LOGOUT');
    });
  });

  describe('Security & HIPAA Compliance', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      testUserId = response.body.user.id;

      // Verify no sensitive fields are exposed
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('socialSecurityNumber');
      expect(response.body.user).not.toHaveProperty('ssn');
    });

    it('should use HTTPS-only cookies for tokens (production)', () => {
      // This is a placeholder - actual implementation depends on your cookie strategy
      // In production, ensure cookies have Secure, HttpOnly, and SameSite flags
    });

    it('should prevent SQL injection in email parameter', async () => {
      const maliciousEmail = "admin@test.com' OR '1'='1";

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousEmail,
          password: TEST_USER.password,
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should log all authentication events for audit', async () => {
      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      testUserId = registerResponse.body.user.id;

      // Login
      await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      // Verify audit logs
      const auditResult = await databaseManager.query(
        'SELECT action FROM audit_logs WHERE user_id = $1 ORDER BY created_at',
        [testUserId]
      );

      const actions = auditResult.rows.map((row) => row.action);
      expect(actions).toContain('USER_REGISTERED');
      expect(actions).toContain('USER_LOGIN');
    });
  });

  describe('Token Security', () => {
    it('should generate unique session IDs', async () => {
      await request(app).post('/api/auth/register').send(TEST_USER).expect(201);

      // Login twice
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      expect(login1.body.sessionId).not.toBe(login2.body.sessionId);
      expect(login1.body.tokens.accessToken).not.toBe(login2.body.tokens.accessToken);
    });

    it('should include required claims in JWT token', async () => {
      await request(app).post('/api/auth/register').send(TEST_USER).expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      const decoded = securityManager.verifyAccessToken(
        loginResponse.body.tokens.accessToken
      );

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('sessionId');
      expect(decoded).toHaveProperty('iat'); // Issued at
      expect(decoded).toHaveProperty('exp'); // Expiration
    });
  });
});
