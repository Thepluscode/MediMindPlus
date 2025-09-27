import knex, { Knex } from 'knex';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

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
let knexInstance: Knex;

// Get Knex configuration based on environment
const getKnexConfig = (): Knex.Config => ({
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
export const initializeKnex = async (): Promise<void> => {
  try {
    if (!knexInstance) {
      knexInstance = knex(getKnexConfig());
      
      // Test the connection
      await knexInstance.raw('SELECT 1');
      logger.info('Knex database connection established');
    }
  } catch (error) {
    logger.error('Failed to connect to the database with Knex:', error);
    throw error;
  }
};

/**
 * Get the Knex instance
 * @throws {Error} If Knex is not initialized
 */
export const getKnex = (): Knex => {
  if (!knexInstance) {
    throw new Error('Knex not initialized. Call initializeKnex() first.');
  }
  return knexInstance;
};

/**
 * Close the database connection
 */
export const closeKnex = async (): Promise<void> => {
  if (knexInstance) {
    await knexInstance.destroy();
    logger.info('Knex database connection closed');
  }
};

/**
 * Run database migrations
 */
export const runMigrations = async (): Promise<void> => {
  try {
    const knex = getKnex();
    await knex.migrate.latest();
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Failed to run database migrations:', error);
    throw error;
  }
};

/**
 * Run database seeds
 */
export const runSeeds = async (): Promise<void> => {
  try {
    const knex = getKnex();
    await knex.seed.run();
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Failed to seed database:', error);
    throw error;
  }
};

/**
 * Rollback the latest migration
 */
export const rollbackMigration = async (): Promise<void> => {
  try {
    const knex = getKnex();
    await knex.migrate.rollback();
    logger.info('Database migration rolled back successfully');
  } catch (error) {
    logger.error('Failed to rollback migration:', error);
    throw error;
  }
};

// Handle application termination
const handleShutdown = async (): Promise<void> => {
  await closeKnex();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export default {
  initialize: initializeKnex,
  getKnex,
  close: closeKnex,
  migrate: runMigrations,
  seed: runSeeds,
  rollback: rollbackMigration,
};
