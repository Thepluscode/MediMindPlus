const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const { EventEmitter } = require('events');

const EnvironmentalHealthMonitor = require('../../../../backend/src/services/iot/EnvironmentalHealthMonitor');

describe('EnvironmentalHealthMonitor', () => {
    let monitor;
    let mockIotMonitor;
    
    beforeEach(() => {
        // Create a mock IoT monitor
        mockIotMonitor = {
            sendDeviceNotification: sinon.stub().resolves(true)
        };
        
        // Create instance with test configuration
        monitor = new EnvironmentalHealthMonitor(mockIotMonitor, {
            weatherApiKey: 'test_weather_key',
            airQualityApiKey: 'test_air_quality_key',
            updateInterval: 60000 // 1 minute for testing
        });
        
        // Stub axios to prevent actual API calls
        sinon.stub(axios, 'get');
    });
    
    afterEach(() => {
        // Clean up stubs and intervals
        axios.get.restore();
        if (monitor) {
            monitor.cleanup();
        }
    });
    
    describe('trackLocation', () => {
        it('should add a location to be monitored', () => {
            const locationId = 'test-location';
            const location = {
                name: 'Test Location',
                coordinates: { lat: 37.7749, lon: -122.4194 },
                userIds: ['user1'],
                deviceIds: ['device1']
            };
            
            monitor.trackLocation(locationId, location);
            
            const trackedLocation = monitor.trackedLocations.get(locationId);
            expect(trackedLocation).to.exist;
            expect(trackedLocation.name).to.equal('Test Location');
            expect(trackedLocation.userIds).to.include('user1');
            expect(trackedLocation.deviceIds).to.include('device1');
        });
    });
    
    describe('updateLocationData', () => {
        it('should update environmental data for a location', async () => {
            // Mock API responses
            const mockWeatherData = {
                data: {
                    current: {
                        dt: 1620000000,
                        temp: 22.5,
                        feels_like: 23.1,
                        humidity: 65,
                        pressure: 1012,
                        wind_speed: 3.1,
                        wind_deg: 180,
                        clouds: 20,
                        visibility: 10000,
                        uvi: 5.2,
                        weather: [{
                            id: 800,
                            main: 'Clear',
                            description: 'clear sky',
                            icon: '01d'
                        }],
                        sunrise: 1619980000,
                        sunset: 1620028800
                    }
                }
            };
            
            const mockAirQualityData = {
                data: {
                    data: {
                        current: {
                            pollution: {
                                ts: '2023-05-15T12:00:00.000Z',
                                aqius: 45,
                                mainus: 'p2',
                                aqicn: 12,
                                maincn: 'p2'
                            },
                            weather: {
                                ts: '2023-05-15T12:00:00.000Z',
                                tp: 22,
                                pr: 1012,
                                hu: 65,
                                ws: 3.1,
                                wd: 180,
                                ic: '01d'
                            }
                        }
                    }
                }
            };
            
            // Set up axios stubs
            axios.get.onFirstCall().resolves(mockWeatherData);
            axios.get.onSecondCall().resolves(mockAirQualityData);
            
            // Track a test location
            const locationId = 'test-location';
            monitor.trackLocation(locationId, {
                name: 'Test Location',
                coordinates: { lat: 37.7749, lon: -122.4194 },
                userIds: ['user1']
            });
            
            // Update location data
            const result = await monitor.updateLocationData(locationId);
            
            // Verify the result
            expect(result).to.exist;
            expect(result.weather).to.exist;
            expect(result.airQuality).to.exist;
            expect(result.weather.temperature).to.equal(22.5);
            expect(result.airQuality.aqi).to.equal(45);
            
            // Verify the location was updated
            const location = monitor.trackedLocations.get(locationId);
            expect(location.currentConditions).to.equal(result);
            expect(location.healthAlerts).to.be.an('array');
        });
    });
    
    describe('assessHealthImpacts', () => {
        it('should identify high temperature risk', () => {
            const testData = {
                weather: {
                    temperature: 35,
                    humidity: 50,
                    windSpeed: 10,
                    uvIndex: 5
                },
                airQuality: {
                    aqi: 30,
                    mainPollutant: 'p2'
                }
            };
            
            const result = monitor.assessHealthImpacts(testData);
            
            // Should have temperature impact
            const tempImpact = result.impacts.find(i => i.type === 'temperature');
            expect(tempImpact).to.exist;
            expect(tempImpact.risk).to.equal('high');
            
            // Should have a corresponding alert
            const tempAlert = result.alerts.find(a => a.type === 'temperature');
            expect(tempAlert).to.exist;
            expect(tempAlert.severity).to.equal('high');
        });
        
        it('should identify poor air quality risk', () => {
            const testData = {
                weather: {
                    temperature: 22,
                    humidity: 50,
                    windSpeed: 5,
                    uvIndex: 3
                },
                airQuality: {
                    aqi: 160,
                    mainPollutant: 'p2'
                }
            };
            
            const result = monitor.assessHealthImpacts(testData);
            
            // Should have air quality impact
            const aqImpact = result.impacts.find(i => i.type === 'air_quality');
            expect(aqImpact).to.exist;
            expect(aqImpact.risk).to.equal('high');
            
            // Should have a corresponding alert
            const aqAlert = result.alerts.find(a => a.type === 'air_quality');
            expect(aqAlert).to.exist;
            expect(aqAlert.severity).to.equal('high');
        });
    });
    
    describe('triggerAlerts', () => {
        it('should emit environmentalAlert events for relevant alerts', (done) => {
            // Set up test location
            const locationId = 'test-location';
            const location = {
                id: locationId,
                name: 'Test Location',
                userIds: ['user1'],
                deviceIds: ['device1'],
                preferences: {
                    alerts: {
                        airQuality: true,
                        weather: true
                    }
                }
            };
            
            // Set up test alerts
            const testAlerts = [
                {
                    type: 'temperature',
                    severity: 'high',
                    message: 'High temperature warning',
                    timestamp: new Date()
                },
                {
                    type: 'air_quality',
                    severity: 'moderate',
                    message: 'Moderate air quality',
                    timestamp: new Date()
                }
            ];
            
            // Listen for the environmentalAlert event
            monitor.once('environmentalAlert', (event) => {
                try {
                    expect(event.locationId).to.equal(locationId);
                    expect(event.userId).to.equal('user1');
                    expect(event.alerts).to.have.length(2);
                    
                    // Should have called sendDeviceNotification for the device
                    expect(mockIotMonitor.sendDeviceNotification.calledOnce).to.be.true;
                    expect(mockIotMonitor.sendDeviceNotification.firstCall.args[0]).to.equal('device1');
                    
                    done();
                } catch (err) {
                    done(err);
                }
            });
            
            // Trigger alerts
            monitor.triggerAlerts(location, testAlerts);
        });
        
        it('should respect alert preferences', () => {
            // Set up test location with air quality alerts disabled
            const locationId = 'test-location';
            const location = {
                id: locationId,
                name: 'Test Location',
                userIds: ['user1'],
                deviceIds: ['device1'],
                preferences: {
                    alerts: {
                        airQuality: false, // Disabled
                        weather: true
                    }
                }
            };
            
            // Set up test alerts
            const testAlerts = [
                {
                    type: 'temperature',
                    severity: 'high',
                    message: 'High temperature warning',
                    timestamp: new Date()
                },
                {
                    type: 'air_quality',
                    severity: 'moderate',
                    message: 'Moderate air quality',
                    timestamp: new Date()
                }
            ];
            
            // Spy on event emitter
            const emitSpy = sinon.spy(monitor, 'emit');
            
            // Trigger alerts
            monitor.triggerAlerts(location, testAlerts);
            
            // Should only emit for temperature alert (air quality is disabled)
            expect(emitSpy.calledOnce).to.be.true;
            const event = emitSpy.firstCall.args[1];
            expect(event.alerts).to.have.length(1);
            expect(event.alerts[0].type).to.equal('temperature');
        });
    });
    
    describe('cleanup', () => {
        it('should clear update interval', () => {
            // Trigger an update to set the interval
            monitor.updateAllTrackedLocations();
            
            // Verify interval is set
            expect(monitor.updateInterval).to.exist;
            
            // Clean up
            monitor.cleanup();
            
            // Verify interval is cleared
            expect(monitor.updateInterval).to.be.null;
        });
    });
});
