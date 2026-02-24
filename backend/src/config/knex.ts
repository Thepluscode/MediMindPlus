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

// Initialize knex instance immediately (synchronous initialization)
let knexInstance: Knex | null = null;

// Initialize immediately on module load to avoid "not initialized" errors
try {
  knexInstance = knex(getKnexConfig());
  // Test connection will happen later in initializeKnex
} catch (error) {
  // Will be handled in initializeKnex
  logger.error('Failed to create Knex instance', { service: 'knex-config', error: error.message });
}

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
    knexInstance = null;
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

// Create a proxy that allows using the default export as both an object and a function
const knexProxy = new Proxy(
  {
    initialize: initializeKnex,
    instance: getKnex,
    getKnex,
    close: closeKnex,
    migrate: runMigrations,
    seed: runSeeds,
    rollback: rollbackMigration,
  },
  {
    // This allows knex('table_name') to work by proxying function calls to getKnex()
    apply(_target, _thisArg, argArray) {
      return getKnex()(...argArray);
    },
    // This allows knex.method() to work
    get(target: any, prop) {
      if (prop in target) {
        return target[prop];
      }
      // Proxy to the actual knex instance for other properties/methods
      return getKnex()[prop as keyof Knex];
    }
  }
) as any;

export default knexProxy;
