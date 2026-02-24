"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
// Production Redis Manager with Clustering and Health Monitoring
const ioredis_1 = __importDefault(require("ioredis"));
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
class RedisManager {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 3000; // 3 seconds
        // Initialize Redis client
        this.initializeClient();
    }
    initializeClient() {
        try {
            const redisConfig = {
                host: environment_1.config.redis.host,
                port: environment_1.config.redis.port,
                password: environment_1.config.redis.password,
                // Connection settings
                connectTimeout: 10000,
                commandTimeout: 5000,
                retryDelayOnFailover: environment_1.config.redis.retryDelayOnFailover,
                maxRetriesPerRequest: environment_1.config.redis.maxRetriesPerRequest,
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
                showFriendlyErrorStack: !environment_1.config.isProduction
            };
            // Use cluster if multiple hosts are provided
            if (environment_1.config.redis.host.includes(',')) {
                const hosts = environment_1.config.redis.host.split(',').map(host => ({
                    host: host.trim(),
                    port: environment_1.config.redis.port
                }));
                this.client = new ioredis_1.default.Cluster(hosts, {
                    redisOptions: redisConfig,
                    enableOfflineQueue: false
                });
                logger_1.enhancedLogger.info('Redis cluster client initialized', {
                    hosts: hosts.length,
                    keyPrefix: redisConfig.keyPrefix
                });
            }
            else {
                this.client = new ioredis_1.default(redisConfig);
                logger_1.enhancedLogger.info('Redis client initialized', {
                    host: environment_1.config.redis.host,
                    port: environment_1.config.redis.port,
                    keyPrefix: redisConfig.keyPrefix
                });
            }
            this.setupEventListeners();
        }
        catch (error) {
            logger_1.enhancedLogger.error('Failed to initialize Redis client', {
                error: error.message,
                host: environment_1.config.redis.host,
                port: environment_1.config.redis.port
            });
            throw error;
        }
    }
    setupEventListeners() {
        if (!this.client)
            return;
        this.client.on('connect', () => {
            logger_1.enhancedLogger.info('Redis connected');
        });
        this.client.on('ready', () => {
            logger_1.enhancedLogger.info('Redis ready for commands');
        });
        this.client.on('error', (error) => {
            logger_1.enhancedLogger.error('Redis error', {
                error: error.message,
                stack: error.stack
            });
        });
        this.client.on('close', () => {
            logger_1.enhancedLogger.warn('Redis connection closed');
        });
        this.client.on('reconnecting', (delay) => {
            logger_1.enhancedLogger.info('Redis reconnecting', { delay });
        });
        this.client.on('end', () => {
            logger_1.enhancedLogger.warn('Redis connection ended');
        });
        // Cluster-specific events
        if (this.client instanceof ioredis_1.default.Cluster) {
            this.client.on('node error', (error, node) => {
                logger_1.enhancedLogger.error('Redis cluster node error', {
                    error: error.message,
                    node: `${node.options.host}:${node.options.port}`
                });
            });
        }
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            await this.connectWithRetry();
            this.isInitialized = true;
            logger_1.enhancedLogger.info('Redis manager initialized successfully');
        }
        catch (error) {
            logger_1.enhancedLogger.error('Failed to initialize Redis manager', {
                error: error.message,
                attempts: this.connectionAttempts
            });
            throw error;
        }
    }
    async connectWithRetry() {
        while (this.connectionAttempts < this.maxRetries) {
            try {
                await this.ping();
                logger_1.enhancedLogger.info('Redis connection established', {
                    attempts: this.connectionAttempts + 1
                });
                return;
            }
            catch (error) {
                this.connectionAttempts++;
                if (this.connectionAttempts >= this.maxRetries) {
                    logger_1.enhancedLogger.error('Max Redis connection attempts reached', {
                        attempts: this.connectionAttempts,
                        error: error.message
                    });
                    throw new Error(`Failed to connect to Redis after ${this.maxRetries} attempts: ${error.message}`);
                }
                logger_1.enhancedLogger.warn('Redis connection attempt failed, retrying...', {
                    attempt: this.connectionAttempts,
                    maxRetries: this.maxRetries,
                    retryDelay: this.retryDelay,
                    error: error.message
                });
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }
    async ping() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        const startTime = Date.now();
        try {
            const result = await this.client.ping();
            const duration = Date.now() - startTime;
            logger_1.enhancedLogger.debug('Redis ping successful', { duration, result });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.enhancedLogger.error('Redis ping failed', {
                error: error.message,
                duration
            });
            throw error;
        }
    }
    async get(key) {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        const startTime = Date.now();
        try {
            const result = await this.client.get(key);
            const duration = Date.now() - startTime;
            logger_1.enhancedLogger.debug('Redis GET', {
                key,
                duration,
                hit: result !== null
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.enhancedLogger.error('Redis GET failed', {
                key,
                error: error.message,
                duration
            });
            throw error;
        }
    }
    async set(key, value, ttl) {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        const startTime = Date.now();
        try {
            let result;
            if (ttl) {
                result = await this.client.setex(key, ttl, value);
            }
            else {
                result = await this.client.set(key, value);
            }
            const duration = Date.now() - startTime;
            logger_1.enhancedLogger.debug('Redis SET', {
                key,
                duration,
                ttl,
                valueLength: value.length
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.enhancedLogger.error('Redis SET failed', {
                key,
                error: error.message,
                duration,
                ttl
            });
            throw error;
        }
    }
    async setex(key, ttl, value) {
        return this.set(key, value, ttl);
    }
    async del(key) {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        const startTime = Date.now();
        const keys = Array.isArray(key) ? key : [key];
        try {
            const result = await this.client.del(...keys);
            const duration = Date.now() - startTime;
            logger_1.enhancedLogger.debug('Redis DEL', {
                keys,
                duration,
                deletedCount: result
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.enhancedLogger.error('Redis DEL failed', {
                keys,
                error: error.message,
                duration
            });
            throw error;
        }
    }
    async exists(key) {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        try {
            const result = await this.client.exists(key);
            logger_1.enhancedLogger.debug('Redis EXISTS', {
                key,
                exists: result === 1
            });
            return result;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Redis EXISTS failed', {
                key,
                error: error.message
            });
            throw error;
        }
    }
    async expire(key, ttl) {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        try {
            const result = await this.client.expire(key, ttl);
            logger_1.enhancedLogger.debug('Redis EXPIRE', {
                key,
                ttl,
                success: result === 1
            });
            return result;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Redis EXPIRE failed', {
                key,
                ttl,
                error: error.message
            });
            throw error;
        }
    }
    async incr(key) {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        try {
            const result = await this.client.incr(key);
            logger_1.enhancedLogger.debug('Redis INCR', {
                key,
                newValue: result
            });
            return result;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Redis INCR failed', {
                key,
                error: error.message
            });
            throw error;
        }
    }
    async hget(key, field) {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        try {
            const result = await this.client.hget(key, field);
            logger_1.enhancedLogger.debug('Redis HGET', {
                key,
                field,
                hit: result !== null
            });
            return result;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Redis HGET failed', {
                key,
                field,
                error: error.message
            });
            throw error;
        }
    }
    async hset(key, field, value) {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        try {
            const result = await this.client.hset(key, field, value);
            logger_1.enhancedLogger.debug('Redis HSET', {
                key,
                field,
                isNewField: result === 1
            });
            return result;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Redis HSET failed', {
                key,
                field,
                error: error.message
            });
            throw error;
        }
    }
    async getInfo() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        try {
            const info = await this.client.info();
            const lines = info.split('\r\n');
            const result = {};
            for (const line of lines) {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    result[key] = value;
                }
            }
            return result;
        }
        catch (error) {
            logger_1.enhancedLogger.error('Redis INFO failed', {
                error: error.message
            });
            throw error;
        }
    }
    async close() {
        if (this.client) {
            logger_1.enhancedLogger.info('Closing Redis connection...');
            await this.client.quit();
            this.client = null;
            this.isInitialized = false;
            logger_1.enhancedLogger.info('Redis connection closed');
        }
    }
}
exports.RedisManager = RedisManager;
exports.default = RedisManager;
