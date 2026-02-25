import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    healthAlerts: true,
    appointments: true,
    marketing: false
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    units: 'imperial'
  });

  const settingsSections = [
    {
      title: 'Account Settings',
      icon: 'ri-user-settings-line',
      color: 'from-blue-500 to-blue-600',
      items: [
        { label: 'Edit Profile', link: '/edit-profile', icon: 'ri-edit-line' },
        { label: 'Change Password', link: '/change-password', icon: 'ri-lock-password-line' },
        { label: 'Medical History', link: '/medical-history', icon: 'ri-file-list-3-line' },
        { label: 'Lifestyle Assessment', link: '/lifestyle-assessment', icon: 'ri-heart-pulse-line' }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: 'ri-shield-user-line',
      color: 'from-teal-500 to-teal-600',
      items: [
        { label: 'Privacy Settings', link: '/privacy-settings', icon: 'ri-eye-off-line' },
        { label: 'Consent Management', link: '/consent-management', icon: 'ri-file-shield-line' },
        { label: 'Data Sharing', link: '/privacy-settings', icon: 'ri-share-line' },
        { label: 'Clear Cache', link: '/clear-cache', icon: 'ri-delete-bin-line' }
      ]
    },
    {
      title: 'Support & Help',
      icon: 'ri-customer-service-line',
      color: 'from-purple-500 to-purple-600',
      items: [
        { label: 'Help Center', link: '/help-center', icon: 'ri-question-line' },
        { label: 'Contact Us', link: '/contact-us', icon: 'ri-mail-send-line' },
        { label: 'Terms of Service', link: '/terms-of-service', icon: 'ri-file-text-line' },
        { label: 'Privacy Policy', link: '/privacy-policy', icon: 'ri-shield-check-line' }
      ]
    }
  ];

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
            <p className="text-slate-600">Manage your account preferences and app settings</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-8">
              {/* Notifications */}
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <i className="ri-notification-line text-white text-xl"></i>
                  </div>
                  Notifications
                </h2>
                
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-slate-500">
                          {key === 'email' && 'Receive updates via email'}
                          {key === 'push' && 'Get push notifications on your device'}
                          {key === 'sms' && 'Receive text message alerts'}
                          {key === 'healthAlerts' && 'Critical health alerts and anomalies'}
                          {key === 'appointments' && 'Appointment reminders and updates'}
                          {key === 'marketing' && 'Product updates and promotions'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(key)}
                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 cursor-pointer ${
                          value ? 'bg-gradient-to-r from-blue-500 to-teal-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                            value ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <i className="ri-settings-3-line text-white text-xl"></i>
                  </div>
                  Preferences
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900 cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Timezone</label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900 cursor-pointer"
                    >
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date Format</label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900 cursor-pointer"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Units</label>
                    <select
                      value={preferences.units}
                      onChange={(e) => handlePreferenceChange('units', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-slate-900 cursor-pointer"
                    >
                      <option value="imperial">Imperial (lbs, ft, °F)</option>
                      <option value="metric">Metric (kg, cm, °C)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Settings Sections */}
              {settingsSections.map((section, index) => (
                <div key={index} className="bg-white rounded-3xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-lg flex items-center justify-center`}>
                      <i className={`${section.icon} text-white text-xl`}></i>
                    </div>
                    {section.title}
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.items.map((item, itemIndex) => (
                      <Link
                        key={itemIndex}
                        to={item.link}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl hover:shadow-md transition-all duration-300 group cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <i className={`${item.icon} text-xl text-blue-600`}></i>
                        </div>
                        <span className="flex-1 font-semibold text-slate-900">{item.label}</span>
                        <i className="ri-arrow-right-s-line text-xl text-slate-400"></i>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* App Info */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">App Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Version</span>
                    <span className="font-semibold text-slate-900">2.5.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Build</span>
                    <span className="font-semibold text-slate-900">2024.01.15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Platform</span>
                    <span className="font-semibold text-slate-900">Web</span>
                  </div>
                </div>
                
                <button className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap cursor-pointer">
                  <i className="ri-refresh-line mr-2"></i>
                  Check for Updates
                </button>
              </div>

              {/* Storage */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Storage Usage</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Health Data</span>
                      <span className="text-sm font-semibold">2.4 GB</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-teal-400 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Medical Images</span>
                      <span className="text-sm font-semibold">1.8 GB</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Cache</span>
                      <span className="text-sm font-semibold">0.3 GB</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Used</span>
                      <span className="font-bold">4.5 GB / 10 GB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  <i className="ri-error-warning-line"></i>
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  These actions are permanent and cannot be undone.
                </p>
                <button className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer">
                  <i className="ri-delete-bin-line mr-2"></i>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}