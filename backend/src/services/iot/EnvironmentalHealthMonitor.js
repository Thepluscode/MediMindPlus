const { EventEmitter } = require('events');
const logger = require('../../config/logger');
const axios = require('axios');

class EnvironmentalHealthMonitor extends EventEmitter {
    constructor(iotMonitor, config = {}) {
        super();
        this.iotMonitor = iotMonitor;
        this.config = {
            updateInterval: 300000, // 5 minutes
            weatherApiKey: process.env.OPENWEATHER_API_KEY,
            airQualityApiKey: process.env.AIRVISUAL_API_KEY,
            ...config
        };
        
        this.environmentCache = new Map();
        this.trackedLocations = new Map();
        
        // Start periodic updates
        this.updateInterval = setInterval(
            () => this.updateAllTrackedLocations(),
            this.config.updateInterval
        );
        
        // Initial update
        process.nextTick(() => this.updateAllTrackedLocations());
    }
    
    // Add a location to monitor
    trackLocation(locationId, locationData) {
        const location = {
            id: locationId,
            name: locationData.name || `Location ${locationId}`,
            coordinates: locationData.coordinates,
            radius: locationData.radius || 5000,
            userIds: locationData.userIds || [],
            deviceIds: locationData.deviceIds || [],
            preferences: {
                alerts: {
                    airQuality: true,
                    weather: true
                },
                notificationChannels: ['push'],
                ...(locationData.preferences || {})
            },
            lastUpdated: null,
            currentConditions: {},
            healthAlerts: []
        };
        
        this.trackedLocations.set(locationId, location);
        this.updateLocationData(locationId);
        
        logger.info(`Tracking environmental data for location: ${location.name}`);
        return location;
    }
    
    // Update environmental data for all tracked locations
    async updateAllTrackedLocations() {
        const locationIds = Array.from(this.trackedLocations.keys());
        logger.info(`Updating environmental data for ${locationIds.length} locations`);
        
        for (const locationId of locationIds) {
            try {
                await this.updateLocationData(locationId);
            } catch (error) {
                logger.error(`Error updating location ${locationId}:`, error);
            }
        }
    }
    
    // Update environmental data for a specific location
    async updateLocationData(locationId) {
        const location = this.trackedLocations.get(locationId);
        if (!location) throw new Error(`Location not found: ${locationId}`);
        
        const { lat, lon } = location.coordinates;
        const now = new Date();
        
        try {
            // Fetch weather and air quality data in parallel
            const [weatherData, airQualityData] = await Promise.all([
                this.fetchWeatherData(lat, lon),
                this.fetchAirQualityData(lat, lon)
            ]);
            
            // Process and combine data
            const environmentalData = {
                timestamp: now,
                weather: this.processWeatherData(weatherData),
                airQuality: this.processAirQualityData(airQualityData)
            };
            
            // Assess health impacts
            const healthImpacts = this.assessHealthImpacts(environmentalData);
            
            // Update location data
            location.currentConditions = environmentalData;
            location.healthAlerts = healthImpacts.alerts;
            location.lastUpdated = now;
            
            // Cache the data
            this.environmentCache.set(locationId, {
                data: environmentalData,
                healthImpacts,
                timestamp: now
            });
            
            // Emit events for significant changes
            this.emit('environmentalDataUpdated', {
                locationId,
                timestamp: now,
                data: environmentalData,
                healthImpacts
            });
            
            // Trigger alerts if needed
            if (healthImpacts.alerts.length > 0) {
                this.triggerAlerts(location, healthImpacts.alerts);
            }
            
            return environmentalData;
            
        } catch (error) {
            logger.error(`Failed to update environmental data:`, error);
            throw error;
        }
    }
    
    // Fetch weather data from OpenWeatherMap
    async fetchWeatherData(lat, lon) {
        if (!this.config.weatherApiKey) {
            throw new Error('Weather API key not configured');
        }
        
        const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&appid=${this.config.weatherApiKey}`;
        
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            logger.error('Weather API error:', error.message);
            throw new Error('Failed to fetch weather data');
        }
    }
    
    // Fetch air quality data from AirVisual
    async fetchAirQualityData(lat, lon) {
        if (!this.config.airQualityApiKey) {
            throw new Error('Air quality API key not configured');
        }
        
        const url = `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${this.config.airQualityApiKey}`;
        
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            logger.error('Air quality API error:', error.message);
            throw new Error('Failed to fetch air quality data');
        }
    }
    
    // Process weather data into a standardized format
    processWeatherData(weatherData) {
        if (!weatherData || !weatherData.current) {
            throw new Error('Invalid weather data');
        }
        
        const { current } = weatherData;
        
        return {
            timestamp: new Date(current.dt * 1000),
            temperature: current.temp,
            feelsLike: current.feels_like,
            humidity: current.humidity,
            pressure: current.pressure,
            windSpeed: current.wind_speed,
            windDeg: current.wind_deg,
            clouds: current.clouds,
            visibility: current.visibility,
            uvIndex: current.uvi,
            weather: current.weather,
            sunrise: new Date(current.sunrise * 1000),
            sunset: new Date(current.sunset * 1000)
        };
    }
    
    // Process air quality data into a standardized format
    processAirQualityData(airQualityData) {
        if (!airQualityData || !airQualityData.data) {
            throw new Error('Invalid air quality data');
        }
        
        const { current } = airQualityData.data;
        
        return {
            timestamp: new Date(current.weather.ts),
            aqi: current.pollution.aqius,
            mainPollutant: current.pollution.mainus,
            temperature: current.weather.tp,
            humidity: current.weather.hu,
            windSpeed: current.weather.ws,
            windDirection: current.weather.wd,
            pressure: current.weather.pr
        };
    }
    
    // Assess health impacts based on environmental data
    assessHealthImpacts(environmentalData) {
        const { weather, airQuality } = environmentalData;
        const impacts = [];
        const alerts = [];
        
        // Check temperature impacts
        if (weather) {
            const tempImpact = this.assessTemperatureImpact(weather.temperature);
            if (tempImpact) {
                impacts.push({
                    type: 'temperature',
                    value: weather.temperature,
                    unit: 'celsius',
                    ...tempImpact
                });
                
                if (tempImpact.risk !== 'low') {
                    alerts.push({
                        type: 'temperature',
                        severity: tempImpact.risk,
                        message: `Temperature is ${tempImpact.risk === 'high' ? 'high' : 'low'}: ${weather.temperature}°C`,
                        timestamp: new Date()
                    });
                }
            }
        }
        
        // Check air quality impacts
        if (airQuality) {
            const aqiImpact = this.assessAirQualityImpact(airQuality.aqi);
            
            impacts.push({
                type: 'air_quality',
                value: airQuality.aqi,
                unit: 'AQI',
                ...aqiImpact,
                mainPollutant: airQuality.mainPollutant
            });
            
            if (aqiImpact.risk !== 'low') {
                alerts.push({
                    type: 'air_quality',
                    severity: aqiImpact.risk,
                    message: `${aqiImpact.message} (AQI: ${airQuality.aqi})`,
                    timestamp: new Date()
                });
            }
        }
        
        return { impacts, alerts };
    }
    
    // Assess temperature impact on health
    assessTemperatureImpact(temperature) {
        if (temperature >= 30) {
            return { risk: 'high', message: 'High temperature warning' };
        } else if (temperature <= 0) {
            return { risk: 'high', message: 'Freezing temperature warning' };
        } else if (temperature >= 25 || temperature <= 5) {
            return { risk: 'moderate', message: 'Extreme temperature advisory' };
        }
        return { risk: 'low', message: 'Comfortable temperature' };
    }
    
    // Assess air quality impact on health
    assessAirQualityImpact(aqi) {
        if (aqi >= 151) {
            return { risk: 'high', message: 'Unhealthy air quality' };
        } else if (aqi >= 101) {
            return { risk: 'moderate', message: 'Unhealthy for sensitive groups' };
        } else if (aqi >= 51) {
            return { risk: 'low', message: 'Moderate air quality' };
        }
        return { risk: 'low', message: 'Good air quality' };
    }
    
    // Trigger alerts for a location
    triggerAlerts(location, alerts) {
        const { userIds, deviceIds, preferences } = location;
        
        if (!preferences.alerts) return;
        
        // Filter alerts based on user preferences
        const relevantAlerts = alerts.filter(alert => {
            if (alert.type === 'air_quality' && !preferences.alerts.airQuality) return false;
            if (alert.type === 'temperature' && !preferences.alerts.weather) return false;
            return true;
        });
        
        if (relevantAlerts.length === 0) return;
        
        // Send notifications to users
        userIds.forEach(userId => {
            this.emit('environmentalAlert', {
                userId,
                locationId: location.id,
                locationName: location.name,
                alerts: relevantAlerts,
                timestamp: new Date()
            });
        });
        
        // Send to connected devices
        deviceIds.forEach(deviceId => {
            this.iotMonitor.sendDeviceNotification(deviceId, {
                type: 'environmental_alert',
                locationId: location.id,
                alerts: relevantAlerts,
                timestamp: new Date()
            });
        });
    }
    
    // Get current conditions for a location
    getCurrentConditions(locationId) {
        const location = this.trackedLocations.get(locationId);
        if (!location) throw new Error(`Location not found: ${locationId}`);
        
        return {
            locationId,
            name: location.name,
            lastUpdated: location.lastUpdated,
            currentConditions: location.currentConditions,
            healthAlerts: location.healthAlerts
        };
    }
    
    // Clean up resources
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = EnvironmentalHealthMonitor;
