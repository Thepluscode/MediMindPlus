import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService';
import { validate } from 'class-validator';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      logger.info('AuthController.register - received request', { hasEmail: !!req.body.email });
      const userData = req.body;

      // Basic validation
      if (!userData.email || !userData.password) {
        logger.warn('AuthController.register - validation failed: missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { user, tokens } = await this.authService.register(userData);
      logger.info('AuthController.register - user created successfully', { email: user.email });

      // Remove sensitive data before sending response
      const { password, ...userWithoutPassword } = user;

      const response = {
        user: userWithoutPassword,
        tokens
      };

      logger.info('AuthController.register - sending response', {
        userId: userWithoutPassword.id,
        email: userWithoutPassword.email,
        hasTokens: !!tokens
      });

      res.status(201).json(response);
      logger.debug('AuthController.register - response sent');
    } catch (error) {
      logger.error('Registration error', { error: error.message || error });
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        logger.warn('Login attempt with missing credentials');
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { user, tokens } = await this.authService.login(email, password);

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      // Remove sensitive data before sending response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        tokens
      });
    } catch (error) {
      logger.error('Login error', { error: error.message || error });
      res.status(401).json({ error: error.message || 'Login failed' });
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        logger.warn('Token refresh attempt without refresh token');
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const tokens = await this.authService.refreshToken(refreshToken);
      logger.info('Access token refreshed successfully');
      res.json(tokens);
    } catch (error) {
      logger.error('Token refresh error', { error: error.message || error });
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  };

  // Middleware to protect routes
  authenticate = async (req: any, res: Response, next: Function) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Authentication attempt without Bearer token');
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Fail fast if JWT_SECRET is not configured
      if (!process.env.JWT_SECRET) {
        logger.error('CRITICAL: JWT_SECRET environment variable is not set');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

      const user = await this.authService.validateUser(decoded.userId);
      if (!user) {
        logger.warn('Authentication failed: user not found', { userId: decoded.userId });
        return res.status(401).json({ error: 'User not found' });
      }

      // Attach user to request object
      req.user = user;
      logger.debug('User authenticated successfully', { userId: user.id });
      next();
    } catch (error) {
      logger.error('Authentication error', { error: error.message || error });
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
