"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabaseConnection = exports.initializeDatabase = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'medimind',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    entities: [User_1.User],
    migrations: ['src/migrations/*.ts'],
    subscribers: [],
});
// Initialize the database connection
const initializeDatabase = async () => {
    try {
        await exports.AppDataSource.initialize();
        console.log('Database connection established');
    }
    catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
// Graceful shutdown
const closeDatabaseConnection = async () => {
    if (exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.destroy();
        console.log('Database connection closed');
    }
};
exports.closeDatabaseConnection = closeDatabaseConnection;
// Handle application termination
process.on('SIGINT', async () => {
    await (0, exports.closeDatabaseConnection)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.closeDatabaseConnection)();
    process.exit(0);
});
