const mqtt = require('mqtt');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const redis = require('redis');
const tensorflow = require('@tensorflow/tfjs');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const logger = require('../../config/logger');

class IoTHealthMonitor extends EventEmitter {
    constructor(config) {
        super();
        this.config = config.iot || {};
        this.devices = new Map();
        this.activeMonitoring = new Map();
        this.alertSystem = null;
        this.edgeAI = null;
        
        // Initialize with default config if not provided
        this.config.mqtt = this.config.mqtt || { broker: 'mqtt://localhost:1883' };
        this.config.redis = this.config.redis || { host: 'localhost', port: 6379 };
        this.config.influxdb = this.config.influxdb || { 
            url: 'http://localhost:8086', 
            token: 'your-token',
            org: 'medimind',
            bucket: 'health_metrics'
        };
        this.config.websocket = this.config.websocket || { port: 8081 };
        
        this.initializeServices();
    }
    
    async initializeServices() {
        try {
            logger.info('Initializing IoT Health Monitor services...');
            
            // Initialize MQTT client
            this.mqttClient = mqtt.connect(this.config.mqtt.broker, {
                clientId: `medimind-iot-${Date.now()}`,
                username: this.config.mqtt.username,
                password: this.config.mqtt.password,
                reconnectPeriod: 5000 // Reconnect every 5 seconds
            });
            
            // Initialize Redis client
            this.redisClient = redis.createClient({
                socket: {
                    host: this.config.redis.host,
                    port: this.config.redis.port,
                    reconnectStrategy: (retries) => {
                        if (retries > 5) {
                            logger.error('Max Redis reconnection attempts reached');
                            return new Error('Max reconnection attempts reached');
                        }
                        return Math.min(retries * 100, 5000);
                    }
                },
                password: this.config.redis.password
            });
            
            await this.redisClient.connect();
            
            // Initialize InfluxDB
            this.influxDB = new InfluxDB({
                url: this.config.influxdb.url,
                token: this.config.influxdb.token
            });
            
            this.writeApi = this.influxDB.getWriteApi(
                this.config.influxdb.org,
                this.config.influxdb.bucket
            );
            
            // Initialize WebSocket server
            this.wsServer = new WebSocket.Server({ port: this.config.websocket.port });
            
            // Initialize Edge AI processor
            this.edgeAI = new EdgeAIProcessor();
            await this.edgeAI.loadModels();
            
            // Initialize alert system
            this.alertSystem = new AdvancedAlertSystem(this.config.alerts || {});
            
            // Initialize device integrations
            this.smartWatchIntegration = new SmartWatchIntegration(this);
            this.telemedicineIntegration = new TelemedicineIntegration(this);
            this.environmentalMonitor = new EnvironmentalHealthMonitor(this);
            
            this.setupEventHandlers();
            this.startHealthMonitoring();
            
            logger.info('IoT Health Monitor initialized successfully');
            
        } catch (error) {
            logger.error('Error initializing IoT Health Monitor:', error);
            throw error;
        }
    }
    
    // ... [rest of the IoTHealthMonitor class implementation] ...
    
    // Add any additional helper methods needed for integration
    async getDevice(deviceId) {
        return this.devices.get(deviceId);
    }
    
    async getLatestVitals(deviceId) {
        try {
            const cached = await this.redisClient.get(`vitals:${deviceId}:latest`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error(`Error getting latest vitals for device ${deviceId}:`, error);
            return null;
        }
    }
    
    async getHistoricalVitals(deviceId, timeframe = '24h') {
        try {
            const query = `
                from(bucket: "${this.config.influxdb.bucket}")
                    |> range(start: -${timeframe})
                    |> filter(fn: (r) => r._measurement == "vitals")
                    |> filter(fn: (r) => r.device_id == "${deviceId}")
                    |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
            `;
            
            const result = await this.influxDB.getQueryApi(this.config.influxdb.org).collectRows(query);
            return result;
        } catch (error) {
            logger.error(`Error getting historical vitals for device ${deviceId}:`, error);
            return [];
        }
    }
}

// Export the IoTHealthMonitor class
module.exports = IoTHealthMonitor;

// Export additional classes that might be needed elsewhere
module.exports.EdgeAIProcessor = require('./EdgeAIProcessor');
module.exports.AdvancedAlertSystem = require('./AdvancedAlertSystem');
module.exports.SmartWatchIntegration = require('./SmartWatchIntegration');
module.exports.TelemedicineIntegration = require('./TelemedicineIntegration');
module.exports.EnvironmentalHealthMonitor = require('./EnvironmentalHealthMonitor');
