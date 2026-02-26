
import { useState, useEffect } from 'react';
import Header from '../home/components/Header';
import logger from '../../utils/logger';
import { wearableService } from '../../services/api';
import { authService } from '../../services/auth';

interface Device {
  id: string;
  name: string;
  brand: string;
  type: string;
  icon: string;
  color: string;
  bgColor: string;
  connected: boolean;
  lastSync?: string;
  metrics?: string[];
}

export default function DeviceIntegrationPage() {
  const [realtimeMetrics, setRealtimeMetrics] = useState<{ steps?: number; heartRate?: number; sleep?: string; calories?: number } | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    // Load real-time biometrics
    wearableService.getBiometrics()
      .then((res) => {
        const d = res.data?.data || res.data;
        if (d) setRealtimeMetrics(d);
      })
      .catch(() => {/* use mock values */});

    // Load synced devices if user is authenticated
    if (currentUser?.id) {
      wearableService.getDevices()
        .then((res) => {
          const devs = res.data?.devices || res.data?.data || res.data;
          if (Array.isArray(devs) && devs.length > 0) {
            // Map API response to local Device format
            const mapped: Device[] = devs.map((d: any) => ({
              id: d.id || d.deviceId,
              name: d.name || d.deviceName || d.source,
              brand: d.brand || 'Unknown',
              type: d.type || 'Wearable',
              icon: 'ri-device-line',
              color: 'text-teal-600',
              bgColor: 'bg-teal-100',
              connected: true,
              lastSync: d.lastSync ? new Date(d.lastSync).toLocaleString() : 'Recently',
              metrics: d.metrics || [],
            }));
            setConnectedDevices(mapped);
          }
        })
        .catch(() => {/* use mock data */});
    }
  }, []);

  const [connectedDevices, setConnectedDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Apple Watch Series 9',
      brand: 'Apple',
      type: 'Smartwatch',
      icon: 'ri-apple-line',
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
      connected: true,
      lastSync: '2 minutes ago',
      metrics: ['Heart Rate', 'Steps', 'Sleep', 'Calories']
    },
    {
      id: '2',
      name: 'Fitbit Charge 6',
      brand: 'Fitbit',
      type: 'Fitness Tracker',
      icon: 'ri-heart-pulse-line',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      connected: true,
      lastSync: '15 minutes ago',
      metrics: ['Activity', 'Heart Rate', 'Sleep Quality']
    }
  ]);

  const availableDevices: Device[] = [
    {
      id: '3',
      name: 'Garmin Forerunner',
      brand: 'Garmin',
      type: 'GPS Watch',
      icon: 'ri-run-line',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      connected: false
    },
    {
      id: '4',
      name: 'Oura Ring',
      brand: 'Oura',
      type: 'Smart Ring',
      icon: 'ri-checkbox-blank-circle-line',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      connected: false
    },
    {
      id: '5',
      name: 'Withings Body+',
      brand: 'Withings',
      type: 'Smart Scale',
      icon: 'ri-scales-3-line',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      connected: false
    },
    {
      id: '6',
      name: 'Samsung Galaxy Watch',
      brand: 'Samsung',
      type: 'Smartwatch',
      icon: 'ri-watch-line',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      connected: false
    },
    {
      id: '7',
      name: 'Whoop Strap',
      brand: 'Whoop',
      type: 'Recovery Band',
      icon: 'ri-pulse-line',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      connected: false
    },
    {
      id: '8',
      name: 'Google Fit',
      brand: 'Google',
      type: 'Health App',
      icon: 'ri-google-line',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      connected: false
    }
  ];

  const handleConnect = async (device: Device) => {
    try {
      setConnectedDevices(prev => [...prev, { ...device, connected: true, lastSync: 'Just now' }]);
      await wearableService.connectDevice(device.type, device.brand).catch(() => {/* ignore API error, optimistic update */});
      logger.info('Device connected', { service: 'device-integration', deviceId: device.id, deviceName: device.name });
    } catch (error) {
      logger.error('Failed to connect device', { service: 'device-integration', deviceId: device.id, error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      setConnectedDevices(prev => prev.filter(d => d.id !== deviceId));
      await wearableService.disconnectDevice(deviceId).catch(() => {/* ignore */});
      logger.info('Device disconnected', { service: 'device-integration', deviceId });
    } catch (error) {
      logger.error('Failed to disconnect device', { service: 'device-integration', deviceId, error: error instanceof Error ? error.message : String(error) });
    }
  };

  const healthData = [
    { label: 'Total Steps Today', value: realtimeMetrics?.steps ? realtimeMetrics.steps.toLocaleString() : '8,542', change: '+12%', icon: 'ri-walk-line', color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Heart Rate Avg', value: realtimeMetrics?.heartRate ? `${realtimeMetrics.heartRate} bpm` : '72 bpm', change: 'Normal', icon: 'ri-heart-pulse-line', color: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'Sleep Duration', value: realtimeMetrics?.sleep || '7h 32m', change: '+45m', icon: 'ri-moon-line', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { label: 'Calories Burned', value: realtimeMetrics?.calories ? realtimeMetrics.calories.toLocaleString() : '2,340', change: '+8%', icon: 'ri-fire-line', color: 'text-orange-600', bgColor: 'bg-orange-50' }
  ];

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-16 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="w-20 h-20 flex items-center justify-center bg-white/20 rounded-2xl mx-auto mb-6 animate-float">
                <i className="ri-device-line text-4xl"></i>
              </div>
              <h1 className="text-5xl font-bold mb-4 animate-fade-in-up">Connect Your Devices</h1>
              <p className="text-xl text-teal-100 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
                Sync your wearables and health devices to get comprehensive insights about your health and wellness
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Real-time Health Data */}
          <div className="mb-12 animate-fade-in-up animation-delay-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Real-time Health Data</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {healthData.map((data, index) => (
                <div 
                  key={index} 
                  className="card-premium p-6 border border-gray-100 hover:shadow-md transition-all duration-300 animate-scale-in cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 flex items-center justify-center ${data.bgColor} rounded-lg mb-4`}>
                    <i className={`${data.icon} text-2xl ${data.color}`}></i>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{data.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{data.value}</p>
                  <p className="text-sm text-green-600">{data.change}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Devices */}
          <div className="mb-12 animate-fade-in-up animation-delay-400">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Connected Devices</h2>
              <span className="text-sm text-gray-600">{connectedDevices.length} devices connected</span>
            </div>
            
            {connectedDevices.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-device-line text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Devices Connected</h3>
                <p className="text-gray-600">Connect your first device to start tracking your health data</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {connectedDevices.map((device, index) => (
                  <div 
                    key={device.id} 
                    className="card-premium p-6 border border-gray-100 hover:shadow-md transition-all duration-300 animate-fade-in-left"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 flex items-center justify-center ${device.bgColor} rounded-xl`}>
                          <i className={`${device.icon} text-2xl ${device.color}`}></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{device.name}</h3>
                          <p className="text-sm text-gray-600">{device.brand} • {device.type}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full whitespace-nowrap">
                        <span className="w-2 h-2 flex items-center justify-center bg-green-600 rounded-full animate-pulse-slow"></span>
                        Connected
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Tracking Metrics:</p>
                      <div className="flex flex-wrap gap-2">
                        {device.metrics?.map((metric, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Last synced: {device.lastSync}</p>
                      <button 
                        onClick={() => handleDisconnect(device.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Devices */}
          <div className="animate-fade-in-up animation-delay-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Devices</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {availableDevices
                .filter(device => !connectedDevices.find(d => d.id === device.id))
                .map((device, index) => (
                  <div 
                    key={device.id} 
                    className="card-premium p-6 border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all duration-300 text-center animate-scale-in cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`w-16 h-16 flex items-center justify-center ${device.bgColor} rounded-xl mx-auto mb-4`}>
                      <i className={`${device.icon} text-3xl ${device.color}`}></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{device.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{device.type}</p>
                    <button 
                      onClick={() => handleConnect(device)}
                      className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Connect Device
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Integration Benefits */}
          <div className="mt-16 bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 md:p-12 animate-fade-in-up animation-delay-600">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Connect Your Devices?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Seamlessly integrate your wearables to unlock powerful health insights and personalized recommendations
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center animate-fade-in-up animation-delay-700">
                <div className="w-16 h-16 flex items-center justify-center bg-teal-600 text-white rounded-2xl mx-auto mb-4 animate-float">
                  <i className="ri-line-chart-line text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
                <p className="text-gray-600">
                  Monitor your health metrics continuously with automatic data synchronization
                </p>
              </div>

              <div className="text-center animate-fade-in-up animation-delay-800">
                <div className="w-16 h-16 flex items-center justify-center bg-purple-600 text-white rounded-2xl mx-auto mb-4 animate-float"
                  style={{ animationDelay: '0.5s' }}
                >
                  <i className="ri-brain-line text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
                <p className="text-gray-600">
                  Get personalized health recommendations based on your device data
                </p>
              </div>

              <div className="text-center animate-fade-in-up animation-delay-900">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-600 text-white rounded-2xl mx-auto mb-4 animate-float"
                  style={{ animationDelay: '1s' }}
                >
                  <i className="ri-shield-check-line text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
                <p className="text-gray-600">
                  Your health data is encrypted and protected with enterprise-grade security
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
