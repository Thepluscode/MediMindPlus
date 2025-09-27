// Production Redis Manager with Clustering and Health Monitoring
import Redis, { Cluster } from 'ioredis';
import { config } from '../config/environment';
import { enhancedLogger } from '../utils/logger';

export class RedisManager {
  private client: Redis | Cluster | null = null;
  private isInitialized = false;
  private connectionAttempts = 0;
  private maxRetries = 5;
  private retryDelay = 3000; // 3 seconds

  constructor() {
    // Initialize Redis client
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      const redisConfig = {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        
        // Connection settings
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnFailover: config.redis.retryDelayOnFailover,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
        
        // Reconnection settings
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        
        // Health check
        lazyConnect: true,
        keepAlive: 30000,
        
        // Serialization
        keyPrefix: 'medimind:',
        
        // Error handling
        showFriendlyErrorStack: !config.isProduction
      };

      // Use cluster if multiple hosts are provided
      if (config.redis.host.includes(',')) {
        const hosts = config.redis.host.split(',').map(host => ({
          host: host.trim(),
          port: config.redis.port
        }));
        
        this.client = new Redis.Cluster(hosts, {
          redisOptions: redisConfig,
          enableOfflineQueue: false
        });
        
        enhancedLogger.info('Redis cluster client initialized', {
          hosts: hosts.length,
          keyPrefix: redisConfig.keyPrefix
        });
      } else {
        this.client = new Redis(redisConfig);
        
        enhancedLogger.info('Redis client initialized', {
          host: config.redis.host,
          port: config.redis.port,
          keyPrefix: redisConfig.keyPrefix
        });
      }

      this.setupEventListeners();
    } catch (error) {
      enhancedLogger.error('Failed to initialize Redis client', {
        error: error.message,
        host: config.redis.host,
        port: config.redis.port
      });
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      enhancedLogger.info('Redis connected');
    });

    this.client.on('ready', () => {
      enhancedLogger.info('Redis ready for commands');
    });

    this.client.on('error', (error: Error) => {
      enhancedLogger.error('Redis error', {
        error: error.message,
        stack: error.stack
      });
    });

    this.client.on('close', () => {
      enhancedLogger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', (delay: number) => {
      enhancedLogger.info('Redis reconnecting', { delay });
    });

    this.client.on('end', () => {
      enhancedLogger.warn('Redis connection ended');
    });

    // Cluster-specific events
    if (this.client instanceof Redis.Cluster) {
      this.client.on('node error', (error: Error, node: any) => {
        enhancedLogger.error('Redis cluster node error', {
          error: error.message,
          node: `${node.options.host}:${node.options.port}`
        });
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.connectWithRetry();
      this.isInitialized = true;
      
      enhancedLogger.info('Redis manager initialized successfully');
    } catch (error) {
      enhancedLogger.error('Failed to initialize Redis manager', {
        error: error.message,
        attempts: this.connectionAttempts
      });
      throw error;
    }
  }

  private async connectWithRetry(): Promise<void> {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        await this.ping();
        enhancedLogger.info('Redis connection established', {
          attempts: this.connectionAttempts + 1
        });
        return;
      } catch (error) {
        this.connectionAttempts++;
        
        if (this.connectionAttempts >= this.maxRetries) {
          enhancedLogger.error('Max Redis connection attempts reached', {
            attempts: this.connectionAttempts,
            error: error.message
          });
          throw new Error(`Failed to connect to Redis after ${this.maxRetries} attempts: ${error.message}`);
        }
        
        enhancedLogger.warn('Redis connection attempt failed, retrying...', {
          attempt: this.connectionAttempts,
          maxRetries: this.maxRetries,
          retryDelay: this.retryDelay,
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async ping(): Promise<string> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    const startTime = Date.now();
    
    try {
      const result = await this.client.ping();
      const duration = Date.now() - startTime;
      
      enhancedLogger.debug('Redis ping successful', { duration, result });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      enhancedLogger.error('Redis ping failed', {
        error: error.message,
        duration
      });
      
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    const startTime = Date.now();
    
    try {
      const result = await this.client.get(key);
      const duration = Date.now() - startTime;
      
      enhancedLogger.debug('Redis GET', {
        key,
        duration,
        hit: result !== null
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      enhancedLogger.error('Redis GET failed', {
        key,
        error: error.message,
        duration
      });
      
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    const startTime = Date.now();
    
    try {
      let result: string;
      
      if (ttl) {
        result = await this.client.setex(key, ttl, value);
      } else {
        result = await this.client.set(key, value);
      }
      
      const duration = Date.now() - startTime;
      
      enhancedLogger.debug('Redis SET', {
        key,
        duration,
        ttl,
        valueLength: value.length
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      enhancedLogger.error('Redis SET failed', {
        key,
        error: error.message,
        duration,
        ttl
      });
      
      throw error;
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<string> {
    return this.set(key, value, ttl);
  }

  async del(key: string | string[]): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    const startTime = Date.now();
    const keys = Array.isArray(key) ? key : [key];
    
    try {
      const result = await this.client.del(...keys);
      const duration = Date.now() - startTime;
      
      enhancedLogger.debug('Redis DEL', {
        keys,
        duration,
        deletedCount: result
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      enhancedLogger.error('Redis DEL failed', {
        keys,
        error: error.message,
        duration
      });
      
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client.exists(key);
      
      enhancedLogger.debug('Redis EXISTS', {
        key,
        exists: result === 1
      });
      
      return result;
    } catch (error) {
      enhancedLogger.error('Redis EXISTS failed', {
        key,
        error: error.message
      });
      
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client.expire(key, ttl);
      
      enhancedLogger.debug('Redis EXPIRE', {
        key,
        ttl,
        success: result === 1
      });
      
      return result;
    } catch (error) {
      enhancedLogger.error('Redis EXPIRE failed', {
        key,
        ttl,
        error: error.message
      });
      
      throw error;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client.incr(key);
      
      enhancedLogger.debug('Redis INCR', {
        key,
        newValue: result
      });
      
      return result;
    } catch (error) {
      enhancedLogger.error('Redis INCR failed', {
        key,
        error: error.message
      });
      
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client.hget(key, field);
      
      enhancedLogger.debug('Redis HGET', {
        key,
        field,
        hit: result !== null
      });
      
      return result;
    } catch (error) {
      enhancedLogger.error('Redis HGET failed', {
        key,
        field,
        error: error.message
      });
      
      throw error;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client.hset(key, field, value);
      
      enhancedLogger.debug('Redis HSET', {
        key,
        field,
        isNewField: result === 1
      });
      
      return result;
    } catch (error) {
      enhancedLogger.error('Redis HSET failed', {
        key,
        field,
        error: error.message
      });
      
      throw error;
    }
  }

  async getInfo(): Promise<any> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const info = await this.client.info();
      const lines = info.split('\r\n');
      const result: any = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      enhancedLogger.error('Redis INFO failed', {
        error: error.message
      });
      
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      enhancedLogger.info('Closing Redis connection...');
      await this.client.quit();
      this.client = null;
      this.isInitialized = false;
      enhancedLogger.info('Redis connection closed');
    }
  }
}

export default RedisManager;
