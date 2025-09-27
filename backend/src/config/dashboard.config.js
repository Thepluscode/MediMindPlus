module.exports = {
    influxdb: {
        url: process.env.INFLUXDB_URL || 'http://localhost:8086',
        token: process.env.INFLUXDB_TOKEN || 'your-influxdb-token',
        org: process.env.INFLUXDB_ORG || 'medimind',
        bucket: process.env.INFLUXDB_BUCKET || 'health_metrics'
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || '',
        database: process.env.REDIS_DB || 0
    },
    dashboard: {
        cacheTtl: parseInt(process.env.DASHBOARD_CACHE_TTL || '86400'), // 24 hours
        updateInterval: parseInt(process.env.DASHBOARD_UPDATE_INTERVAL || '30000'), // 30 seconds
        maxWidgetsPerDashboard: parseInt(process.env.MAX_WIDGETS_PER_DASHBOARD || '20')
    },
    security: {
        jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
        apiKey: process.env.API_KEY || 'your-api-key'
    }
};
