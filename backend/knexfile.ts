import type { Knex } from 'knex';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'medimind',
  nodeEnv: process.env.NODE_ENV || 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Knex configuration for different environments
const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      ssl: dbConfig.ssl,
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
  },
  test: {
    client: 'pg',
    connection: {
      host: process.env.TEST_DB_HOST || dbConfig.host,
      port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '5432'),
      user: process.env.TEST_DB_USERNAME || dbConfig.username,
      password: process.env.TEST_DB_PASSWORD || dbConfig.password,
      database: process.env.TEST_DB_NAME || 'medimind_test',
      ssl: false,
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL ? 
      {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      } : {
        host: process.env.PROD_DB_HOST || dbConfig.host,
        port: parseInt(process.env.PROD_DB_PORT || process.env.DB_PORT || '5432'),
        user: process.env.PROD_DB_USERNAME || dbConfig.username,
        password: process.env.PROD_DB_PASSWORD || dbConfig.password,
        database: process.env.PROD_DB_NAME || dbConfig.database,
        ssl: { rejectUnauthorized: false },
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
  },
};

export default knexConfig;
