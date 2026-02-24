"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeeds = exports.runMigrations = exports.getKnex = exports.closeDatabaseConnection = exports.initializeDatabase = void 0;
const knex_1 = __importDefault(require("knex"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../utils/logger"));
// Load environment variables
dotenv_1.default.config();
// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || process.env.USER || 'postgres', // Use system user if available
    password: process.env.DB_PASSWORD || '', // Empty for peer authentication
    database: process.env.DB_NAME || 'medimind',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};
// Initialize knex instance
let knexInstance;
const initializeDatabase = async () => {
    try {
        knexInstance = (0, knex_1.default)({
            client: 'pg',
            connection: process.env.NODE_ENV === 'production'
                ? process.env.DATABASE_URL || {
                    host: dbConfig.host,
                    port: dbConfig.port,
                    user: dbConfig.user,
                    password: dbConfig.password,
                    database: dbConfig.database,
                    ssl: dbConfig.ssl
                }
                : {
                    // For development, use peer authentication if no password is provided
                    ...(dbConfig.password ? {
                        host: dbConfig.host,
                        port: dbConfig.port,
                        user: dbConfig.user,
                        password: dbConfig.password,
                        database: dbConfig.database
                    } : {
                        connectionString: `postgresql://${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
                    }),
                    ssl: dbConfig.ssl
                },
            pool: {
                min: 2,
                max: 10,
            },
        });
        // Test the connection
        await knexInstance.raw('SELECT 1');
        logger_1.default.info('Database connection established successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to connect to the database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const closeDatabaseConnection = async () => {
    if (knexInstance) {
        await knexInstance.destroy();
        logger_1.default.info('Database connection closed');
    }
};
exports.closeDatabaseConnection = closeDatabaseConnection;
const getKnex = () => {
    if (!knexInstance) {
        throw new Error('Database not initialized. Call initializeDatabase first.');
    }
    return knexInstance;
};
exports.getKnex = getKnex;
const runMigrations = async () => {
    try {
        await knexInstance.migrate.latest();
        logger_1.default.info('Database migrations completed successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to run database migrations:', error);
        throw error;
    }
};
exports.runMigrations = runMigrations;
const runSeeds = async () => {
    try {
        await knexInstance.seed.run();
        logger_1.default.info('Database seeding completed successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to seed database:', error);
        throw error;
    }
};
exports.runSeeds = runSeeds;
