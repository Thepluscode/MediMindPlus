import knex, { Knex } from 'knex';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

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
let knexInstance: Knex;

export const initializeDatabase = async (): Promise<void> => {
  try {
    knexInstance = knex({
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
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    throw error;
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  if (knexInstance) {
    await knexInstance.destroy();
    logger.info('Database connection closed');
  }
};

export const getKnex = (): Knex => {
  if (!knexInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return knexInstance;
};

export const runMigrations = async (): Promise<void> => {
  try {
    await knexInstance.migrate.latest();
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Failed to run database migrations:', error);
    throw error;
  }
};

export const runSeeds = async (): Promise<void> => {
  try {
    await knexInstance.seed.run();
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Failed to seed database:', error);
    throw error;
  }
};
