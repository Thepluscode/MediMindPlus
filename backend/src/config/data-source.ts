import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'medimind',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [User],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});

// Initialize the database connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established', {
      service: 'database',
      type: 'postgres',
      database: process.env.DB_NAME || 'medimind'
    });
  } catch (error: any) {
    logger.error('Error connecting to database', {
      service: 'database',
      error: error.message
    });
    process.exit(1);
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed', {
      service: 'database'
    });
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});
