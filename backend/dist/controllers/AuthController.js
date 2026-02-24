"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
class AuthController {
    constructor() {
        this.register = async (req, res) => {
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
            }
            catch (error) {
                console.error('Registration error:', error);
                res.status(400).json({ error: error.message || 'Registration failed' });
            }
        };
        this.login = async (req, res) => {
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
            }
            catch (error) {
                console.error('Login error:', error);
                res.status(401).json({ error: error.message || 'Login failed' });
            }
        };
        this.refreshToken = async (req, res) => {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return res.status(400).json({ error: 'Refresh token is required' });
                }
                const tokens = await this.authService.refreshToken(refreshToken);
                res.json(tokens);
            }
            catch (error) {
                console.error('Token refresh error:', error);
                res.status(401).json({ error: 'Invalid refresh token' });
            }
        };
        // Middleware to protect routes
        this.authenticate = async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ error: 'Authentication required' });
                }
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
                const user = await this.authService.validateUser(decoded.userId);
                if (!user) {
                    return res.status(401).json({ error: 'User not found' });
                }
                // Attach user to request object
                req.user = user;
                next();
            }
            catch (error) {
                console.error('Authentication error:', error);
                res.status(401).json({ error: 'Invalid or expired token' });
            }
        };
        this.authService = new AuthService_1.AuthService();
    }
}
exports.AuthController = AuthController;
