// Production Database Manager with Connection Pooling and Health Monitoring
import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config/environment';
import { enhancedLogger } from '../utils/logger';

export class DatabaseManager {
  private pool: Pool | null = null;
  private isInitialized = false;
  private connectionAttempts = 0;
  private maxRetries = 5;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    // Initialize pool configuration
    this.initializePool();
  }

  private initializePool(): void {
    try {
      this.pool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
        
        // Connection pool settings
        min: config.database.pool.min,
        max: config.database.pool.max,
        acquireTimeoutMillis: config.database.pool.acquireTimeoutMillis,
        idleTimeoutMillis: config.database.pool.idleTimeoutMillis,
        
        // Connection settings
        connectionTimeoutMillis: 10000,
        query_timeout: 30000,
        statement_timeout: 30000,
        
        // Application name for monitoring
        application_name: 'medimind-backend'
      });

      // Set up event listeners
      this.setupEventListeners();
      
      enhancedLogger.info('Database pool initialized', {
        host: config.database.host,
        database: config.database.name,
        poolMin: config.database.pool.min,
        poolMax: config.database.pool.max
      });
    } catch (error) {
      enhancedLogger.error('Failed to initialize database pool', {
        error: error.message,
        host: config.database.host,
        database: config.database.name
      });
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.pool) return;

    this.pool.on('connect', (client: PoolClient) => {
      enhancedLogger.debug('New database client connected', {
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount,
        waitingCount: this.pool?.waitingCount
      });
    });

    this.pool.on('acquire', (client: PoolClient) => {
      enhancedLogger.debug('Database client acquired from pool', {
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount
      });
    });

    this.pool.on('remove', (client: PoolClient) => {
      enhancedLogger.debug('Database client removed from pool', {
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount
      });
    });

    this.pool.on('error', (error: Error, client: PoolClient) => {
      enhancedLogger.error('Database pool error', {
        error: error.message,
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount
      });
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.connectWithRetry();
      await this.runMigrations();
      this.isInitialized = true;
      
      enhancedLogger.info('Database manager initialized successfully');
    } catch (error) {
      enhancedLogger.error('Failed to initialize database manager', {
        error: error.message,
        attempts: this.connectionAttempts
      });
      throw error;
    }
  }

  private async connectWithRetry(): Promise<void> {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        await this.healthCheck();
        enhancedLogger.info('Database connection established', {
          attempts: this.connectionAttempts + 1
        });
        return;
      } catch (error) {
        this.connectionAttempts++;
        
        if (this.connectionAttempts >= this.maxRetries) {
          enhancedLogger.error('Max database connection attempts reached', {
            attempts: this.connectionAttempts,
            error: error.message
          });
          throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${error.message}`);
        }
        
        enhancedLogger.warn('Database connection attempt failed, retrying...', {
          attempt: this.connectionAttempts,
          maxRetries: this.maxRetries,
          retryDelay: this.retryDelay,
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async healthCheck(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const startTime = Date.now();
    
    try {
      const result = await this.pool.query('SELECT 1 as health_check');
      const duration = Date.now() - startTime;
      
      enhancedLogger.database('health_check', 'system', duration, {
        result: result.rows[0],
        poolStats: this.getPoolStats()
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      enhancedLogger.error('Database health check failed', {
        error: error.message,
        duration,
        poolStats: this.getPoolStats()
      });
      
      throw error;
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const startTime = Date.now();
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      enhancedLogger.debug('Executing database query', {
        queryId,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        paramCount: params?.length || 0
      });
      
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - startTime;
      
      enhancedLogger.database('query', 'unknown', duration, {
        queryId,
        rowCount: result.rowCount,
        command: result.command
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      enhancedLogger.error('Database query failed', {
        queryId,
        error: error.message,
        duration,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        paramCount: params?.length || 0
      });
      
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      enhancedLogger.debug('Starting database transaction', { transactionId });
      
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      enhancedLogger.database('transaction', 'unknown', duration, {
        transactionId,
        status: 'committed'
      });
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      const duration = Date.now() - startTime;
      
      enhancedLogger.error('Database transaction failed', {
        transactionId,
        error: error.message,
        duration,
        status: 'rolled_back'
      });
      
      throw error;
    } finally {
      client.release();
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      enhancedLogger.info('Running database migrations...');
      
      // Create migrations table if it doesn't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Get list of executed migrations
      const executedMigrations = await this.query(
        'SELECT name FROM migrations ORDER BY executed_at'
      );
      
      const executedNames = executedMigrations.rows.map(row => row.name);
      
      // Define migrations (in production, these would be loaded from files)
      const migrations = [
        {
          name: '001_create_users_table',
          sql: `
            CREATE TABLE IF NOT EXISTS users (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              email VARCHAR(255) UNIQUE NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              first_name VARCHAR(100) NOT NULL,
              last_name VARCHAR(100) NOT NULL,
              role VARCHAR(50) NOT NULL DEFAULT 'patient',
              is_active BOOLEAN DEFAULT true,
              email_verified BOOLEAN DEFAULT false,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        },
        {
          name: '002_create_patients_table',
          sql: `
            CREATE TABLE IF NOT EXISTS patients (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES users(id) ON DELETE CASCADE,
              date_of_birth DATE,
              gender VARCHAR(20),
              phone_number VARCHAR(20),
              address JSONB,
              emergency_contact JSONB,
              medical_record_number VARCHAR(50) UNIQUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        },
        {
          name: '003_create_health_assessments_table',
          sql: `
            CREATE TABLE IF NOT EXISTS health_assessments (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
              assessment_type VARCHAR(50) NOT NULL,
              status VARCHAR(20) DEFAULT 'pending',
              input_data JSONB,
              results JSONB,
              ai_analysis JSONB,
              confidence_score DECIMAL(5,4),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        }
      ];
      
      // Execute pending migrations
      for (const migration of migrations) {
        if (!executedNames.includes(migration.name)) {
          await this.transaction(async (client) => {
            await client.query(migration.sql);
            await client.query(
              'INSERT INTO migrations (name) VALUES ($1)',
              [migration.name]
            );
          });
          
          enhancedLogger.info('Migration executed', { name: migration.name });
        }
      }
      
      enhancedLogger.info('Database migrations completed');
    } catch (error) {
      enhancedLogger.error('Migration failed', { error: error.message });
      throw error;
    }
  }

  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  async close(): Promise<void> {
    if (this.pool) {
      enhancedLogger.info('Closing database pool...');
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      enhancedLogger.info('Database pool closed');
    }
  }
}

export default DatabaseManager;
