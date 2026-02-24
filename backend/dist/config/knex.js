"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbackMigration = exports.runSeeds = exports.runMigrations = exports.closeKnex = exports.getKnex = exports.initializeKnex = void 0;
const knex_1 = __importDefault(require("knex"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../utils/logger"));
// Load environment variables
dotenv_1.default.config();
// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'medimind',
    nodeEnv: process.env.NODE_ENV || 'development'
};
// Initialize knex instance
let knexInstance;
// Get Knex configuration based on environment
const getKnexConfig = () => ({
    client: 'pg',
    connection: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
    },
    pool: {
        min: 2,
        max: 10,
    },
    migrations: {
        directory: './src/database/migrations',
        extension: 'ts',
        tableName: 'knex_migrations',
    },
    seeds: {
        directory: './src/database/seeds',
    },
    debug: dbConfig.nodeEnv === 'development',
});
/**
 * Initialize the Knex.js database connection
 */
const initializeKnex = async () => {
    try {
        if (!knexInstance) {
            knexInstance = (0, knex_1.default)(getKnexConfig());
            // Test the connection
            await knexInstance.raw('SELECT 1');
            logger_1.default.info('Knex database connection established');
        }
    }
    catch (error) {
        logger_1.default.error('Failed to connect to the database with Knex:', error);
        throw error;
    }
};
exports.initializeKnex = initializeKnex;
/**
 * Get the Knex instance
 * @throws {Error} If Knex is not initialized
 */
const getKnex = () => {
    if (!knexInstance) {
        throw new Error('Knex not initialized. Call initializeKnex() first.');
    }
    return knexInstance;
};
exports.getKnex = getKnex;
/**
 * Close the database connection
 */
const closeKnex = async () => {
    if (knexInstance) {
        await knexInstance.destroy();
        logger_1.default.info('Knex database connection closed');
    }
};
exports.closeKnex = closeKnex;
/**
 * Run database migrations
 */
const runMigrations = async () => {
    try {
        const knex = (0, exports.getKnex)();
        await knex.migrate.latest();
        logger_1.default.info('Database migrations completed successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to run database migrations:', error);
        throw error;
    }
};
exports.runMigrations = runMigrations;
/**
 * Run database seeds
 */
const runSeeds = async () => {
    try {
        const knex = (0, exports.getKnex)();
        await knex.seed.run();
        logger_1.default.info('Database seeding completed successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to seed database:', error);
        throw error;
    }
};
exports.runSeeds = runSeeds;
/**
 * Rollback the latest migration
 */
const rollbackMigration = async () => {
    try {
        const knex = (0, exports.getKnex)();
        await knex.migrate.rollback();
        logger_1.default.info('Database migration rolled back successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to rollback migration:', error);
        throw error;
    }
};
exports.rollbackMigration = rollbackMigration;
// Handle application termination
const handleShutdown = async () => {
    await (0, exports.closeKnex)();
    process.exit(0);
};
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
exports.default = {
    initialize: exports.initializeKnex,
    getKnex: exports.getKnex,
    close: exports.closeKnex,
    migrate: exports.runMigrations,
    seed: exports.runSeeds,
    rollback: exports.rollbackMigration,
};
