"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../models/User");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const class_validator_1 = require("class-validator");
class AuthService {
    constructor() {
        this.userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        this.jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
        this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret';
    }
    async register(userData) {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });
        if (existingUser) {
            throw new Error('Email already in use');
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        // Create new user
        const user = this.userRepository.create({
            ...userData,
            password: hashedPassword,
        });
        // Validate user data
        const errors = await (0, class_validator_1.validate)(user);
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
        // Save user to database
        await this.userRepository.save(user);
        // Generate tokens
        const tokens = await this.generateTokens(user);
        return { user, tokens };
    }
    async login(email, password) {
        // Find user by email
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        // Generate tokens
        const tokens = await this.generateTokens(user);
        return { user, tokens };
    }
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, this.refreshSecret);
            // Find user
            const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
            if (!user) {
                throw new Error('User not found');
            }
            // Generate new tokens
            return this.generateTokens(user);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    async generateTokens(user) {
        // Generate access token (15 minutes)
        const accessToken = jwt.sign({ userId: user.id, email: user.email }, this.jwtSecret, { expiresIn: '15m' });
        // Generate refresh token (7 days)
        const refreshToken = jwt.sign({ userId: user.id }, this.refreshSecret, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    async validateUser(userId) {
        return this.userRepository.findOne({ where: { id: userId } });
    }
}
exports.AuthService = AuthService;
