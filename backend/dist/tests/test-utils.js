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
exports.closeTestConnection = exports.clearDatabase = exports.getAuthToken = exports.createTestUser = void 0;
const User_1 = require("../models/User");
const data_source_1 = require("../config/data-source");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const createTestUser = async (userData) => {
    const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    // Create and save user
    const user = userRepository.create({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'User',
        isEmailVerified: true,
    });
    await userRepository.save(user);
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    return { user, token };
};
exports.createTestUser = createTestUser;
const getAuthToken = (userId, email) => {
    return jwt.sign({ userId, email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
};
exports.getAuthToken = getAuthToken;
const clearDatabase = async () => {
    const entities = data_source_1.AppDataSource.entityMetadatas;
    for (const entity of entities) {
        const repository = data_source_1.AppDataSource.getRepository(entity.name);
        await repository.query(`DELETE FROM ${entity.tableName} CASCADE;`);
    }
};
exports.clearDatabase = clearDatabase;
const closeTestConnection = async () => {
    await data_source_1.AppDataSource.destroy();
};
exports.closeTestConnection = closeTestConnection;
