// Authentication Routes
import { Router, Request, Response, NextFunction } from 'express';
import { validateSchema, commonSchemas } from '../middleware/validation';
import { auditAuthEvent } from '../middleware/audit';
import { asyncHandler, ValidationError, AuthenticationError } from '../middleware/errorHandler';
import { enhancedLogger } from '../utils/logger';
import { DatabaseManager } from '../database/DatabaseManager';
import { SecurityManager } from '../security/SecurityManager';
import { z } from 'zod';

const router = Router();
const databaseManager = new DatabaseManager();
const securityManager = new SecurityManager();

// Additional validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['patient', 'provider', 'admin']).default('patient'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - acceptTerms
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [patient, provider, admin]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               phoneNumber:
 *                 type: string
 *               acceptTerms:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', 
  validateSchema(registerSchema),
  auditAuthEvent('REGISTER'),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, role, dateOfBirth, phoneNumber } = req.body;

    // Check password strength
    const passwordValidation = securityManager.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await databaseManager.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      enhancedLogger.security('Registration attempt with existing email', 'medium', {
        email: email.toLowerCase(),
        ip: req.ip
      });
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const passwordHash = await securityManager.hashPassword(password);

    // Create user
    const userResult = await databaseManager.transaction(async (client) => {
      // Insert user
      const userQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, true, false)
        RETURNING id, email, first_name, last_name, role, created_at
      `;
      
      const userResult = await client.query(userQuery, [
        email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role
      ]);

      const user = userResult.rows[0];

      // Create patient profile if role is patient
      if (role === 'patient') {
        const patientQuery = `
          INSERT INTO patients (user_id, date_of_birth, phone_number)
          VALUES ($1, $2, $3)
          RETURNING id
        `;
        
        await client.query(patientQuery, [
          user.id,
          dateOfBirth || null,
          phoneNumber || null
        ]);
      }

      return user;
    });

    const user = userResult.rows[0];

    // Generate email verification token
    const verificationToken = securityManager.generateSecureToken();
    
    // Store verification token in Redis (expires in 24 hours)
    await securityManager.redisManager.setex(
      `email_verification:${verificationToken}`,
      86400,
      user.id
    );

    // Log successful registration
    enhancedLogger.audit('USER_REGISTERED', user.id, undefined, {
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        emailVerified: false,
        createdAt: user.created_at
      },
      nextStep: 'Please check your email to verify your account'
    });
  })
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return access tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 */
router.post('/login',
  validateSchema(loginSchema),
  auditAuthEvent('LOGIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe = false } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check rate limiting
    const rateLimitKey = `login_attempts:${ipAddress}`;
    const rateLimit = await securityManager.checkRateLimit(rateLimitKey, 5, 900000); // 5 attempts per 15 minutes

    if (!rateLimit.allowed) {
      enhancedLogger.security('Login rate limit exceeded', 'high', {
        ip: ipAddress,
        email: email.toLowerCase()
      });
      throw new AuthenticationError('Too many login attempts. Please try again later.');
    }

    // Find user
    const userResult = await databaseManager.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      enhancedLogger.security('Login attempt with non-existent email', 'medium', {
        email: email.toLowerCase(),
        ip: ipAddress
      });
      throw new AuthenticationError('Invalid email or password');
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (!user.is_active) {
      enhancedLogger.security('Login attempt with inactive account', 'medium', {
        userId: user.id,
        email: user.email,
        ip: ipAddress
      });
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await securityManager.verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      enhancedLogger.security('Login attempt with invalid password', 'medium', {
        userId: user.id,
        email: user.email,
        ip: ipAddress
      });
      throw new AuthenticationError('Invalid email or password');
    }

    // Create session
    const sessionId = await securityManager.createSession(user.id, userAgent, ipAddress);

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId
    };

    const accessToken = securityManager.generateAccessToken(tokenPayload);
    const refreshToken = securityManager.generateRefreshToken({ 
      id: user.id, 
      sessionId,
      type: 'refresh'
    });

    // Store refresh token
    const refreshTokenExpiry = rememberMe ? 2592000 : 604800; // 30 days or 7 days
    await securityManager.redisManager.setex(
      `refresh_token:${user.id}:${sessionId}`,
      refreshTokenExpiry,
      refreshToken
    );

    // Log successful login
    enhancedLogger.audit('USER_LOGIN', user.id, sessionId, {
      ip: ipAddress,
      userAgent,
      rememberMe
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        emailVerified: user.email_verified
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '24h'
      },
      sessionId
    });
  })
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh',
  validateSchema(refreshTokenSchema),
  auditAuthEvent('TOKEN_REFRESH'),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = securityManager.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in Redis
    const storedToken = await securityManager.redisManager.get(
      `refresh_token:${decoded.id}:${decoded.sessionId}`
    );

    if (!storedToken || storedToken !== refreshToken) {
      enhancedLogger.security('Invalid refresh token used', 'medium', {
        userId: decoded.id,
        sessionId: decoded.sessionId,
        ip: req.ip
      });
      throw new AuthenticationError('Invalid refresh token');
    }

    // Validate session
    const session = await securityManager.validateSession(decoded.sessionId);
    if (!session) {
      throw new AuthenticationError('Session expired');
    }

    // Get user details
    const userResult = await databaseManager.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      throw new AuthenticationError('User not found or inactive');
    }

    const user = userResult.rows[0];

    // Generate new access token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: decoded.sessionId
    };

    const newAccessToken = securityManager.generateAccessToken(tokenPayload);

    // Log token refresh
    enhancedLogger.audit('TOKEN_REFRESHED', user.id, decoded.sessionId, {
      ip: req.ip
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
      tokens: {
        accessToken: newAccessToken,
        expiresIn: '24h'
      }
    });
  })
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate user session and tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
router.post('/logout',
  auditAuthEvent('LOGOUT'),
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = securityManager.verifyAccessToken(token);
        
        // Invalidate session
        await securityManager.invalidateSession(decoded.sessionId);
        
        // Remove refresh token
        await securityManager.redisManager.del(`refresh_token:${decoded.id}:${decoded.sessionId}`);
        
        // Log logout
        enhancedLogger.audit('USER_LOGOUT', decoded.id, decoded.sessionId, {
          ip: req.ip
        });
      } catch (error) {
        // Token might be expired or invalid, but we still want to respond with success
        enhancedLogger.debug('Logout with invalid token', { error: error.message });
      }
    }

    res.status(200).json({
      message: 'Logout successful'
    });
  })
);

export { router as authRoutes };
export default router;
