import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { validate } from 'class-validator';
import { User } from '../models/User';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      
      // Basic validation
      if (!userData.email || !userData.password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { user, tokens } = await this.authService.register(userData);
      
      // Remove sensitive data before sending response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        user: userWithoutPassword,
        tokens
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { user, tokens } = await this.authService.login(email, password);
      
      // Remove sensitive data before sending response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        tokens
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message || 'Login failed' });
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const tokens = await this.authService.refreshToken(refreshToken);
      res.json(tokens);
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  };

  // Middleware to protect routes
  authenticate = async (req: any, res: Response, next: Function) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { userId: string };
      
      const user = await this.authService.validateUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
