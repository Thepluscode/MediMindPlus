import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { settingsService } from '../../services/api';
import { authService } from '../../services/auth';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    healthAlerts: true,
    appointments: true,
    marketing: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    units: 'imperial',
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    settingsService.getPrivacy()
      .then((res) => {
        if (res.data?.notifications) setNotifications(n => ({ ...n, ...res.data.notifications }));
        if (res.data?.preferences) setPreferences(p => ({ ...p, ...res.data.preferences }));
      })
      .catch(() => {/* use defaults */ });
  }, []);

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      await settingsService.updatePrivacy({ notifications, preferences });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const settingsSections = [
    {
      title: 'Account Settings',
      icon: 'ri-user-settings-line',
      gradient: 'from-indigo-500 to-blue-600',
      items: [
        { label: 'Edit Profile', link: '/edit-profile', icon: 'ri-edit-line' },
        { label: 'Change Password', link: '/settings', icon: 'ri-lock-password-line' },
        { label: 'Medical History', link: '/help-center', icon: 'ri-file-list-3-line' },
        { label: 'Lifestyle Assessment', link: '/help-center', icon: 'ri-heart-pulse-line' },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: 'ri-shield-user-line',
      gradient: 'from-emerald-500 to-teal-600',
      items: [
        { label: 'Privacy Settings', link: '/settings', icon: 'ri-eye-off-line' },
        { label: 'Consent Management', link: '/settings', icon: 'ri-file-shield-line' },
        { label: 'Data Sharing', link: '/settings', icon: 'ri-share-line' },
        { label: 'Clear Cache', link: '/settings', icon: 'ri-delete-bin-line' },
      ],
    },
    {
      title: 'Support & Help',
      icon: 'ri-customer-service-line',
      gradient: 'from-violet-500 to-purple-600',
      items: [
        { label: 'Help Center', link: '/help-center', icon: 'ri-question-line' },
        { label: 'Contact Us', link: '/contact', icon: 'ri-mail-send-line' },
        { label: 'Terms of Service', link: '/help-center', icon: 'ri-file-text-line' },
        { label: 'Privacy Policy', link: '/help-center', icon: 'ri-shield-check-line' },
      ],
    },
  ];

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const notificationItems = [
    { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email', icon: 'ri-mail-line' },
    { key: 'push', label: 'Push Notifications', desc: 'Get push notifications on your device', icon: 'ri-notification-3-line' },
    { key: 'sms', label: 'SMS Alerts', desc: 'Receive text message alerts', icon: 'ri-message-2-line' },
    { key: 'healthAlerts', label: 'Health Alerts', desc: 'Critical health alerts and anomalies', icon: 'ri-heart-pulse-line' },
    { key: 'appointments', label: 'Appointments', desc: 'Appointment reminders and updates', icon: 'ri-calendar-check-line' },
    { key: 'marketing', label: 'Marketing', desc: 'Product updates and promotions', icon: 'ri-megaphone-line' },
  ];

  const saveBtnLabel = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved!' : saveStatus === 'error' ? 'Error' : 'Save Settings';

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <i className="ri-settings-4-line text-xl text-white"></i>
                </div>
                Settings
              </h1>
              <p className="text-slate-500 mt-2 text-sm">
                {currentUser ? `Logged in as ${currentUser.email}` : 'Manage your account preferences and app settings'}
              </p>
            </div>
            <button
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-emerald-500 text-white shadow-glow-teal' :
                  saveStatus === 'error' ? 'bg-red-500 text-white' :
                    'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-glow-indigo'
                } disabled:opacity-50`}
            >
              <i className={`${saveStatus === 'saved' ? 'ri-check-line' : saveStatus === 'error' ? 'ri-error-warning-line' : 'ri-save-line'}`}></i>
              {saveBtnLabel}
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notifications */}
              <div className="card-gradient-border p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <i className="ri-notification-3-line text-white text-lg"></i>
                  </div>
                  Notifications
                </h2>

                <div className="space-y-3">
                  {notificationItems.map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 ring-1 ring-slate-100 hover:ring-indigo-200 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center group-hover:ring-indigo-200 transition-all">
                          <i className={`${item.icon} text-lg text-slate-400`}></i>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(item.key)}
                        className={`relative w-12 h-7 rounded-full transition-all duration-300 cursor-pointer ${notifications[item.key as keyof typeof notifications]
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-glow-indigo'
                            : 'bg-slate-200'
                          }`}
                      >
                        <div
                          className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-sm transition-transform duration-300 ${notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : ''
                            }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="card-gradient-border p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <i className="ri-equalizer-line text-white text-lg"></i>
                  </div>
                  Preferences
                </h2>

                <div className="grid md:grid-cols-2 gap-5">
                  {[
                    { label: 'Language', key: 'language', options: [['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['zh', '中文']] },
                    { label: 'Timezone', key: 'timezone', options: [['America/Los_Angeles', 'Pacific (PT)'], ['America/Denver', 'Mountain (MT)'], ['America/Chicago', 'Central (CT)'], ['America/New_York', 'Eastern (ET)']] },
                    { label: 'Date Format', key: 'dateFormat', options: [['MM/DD/YYYY', 'MM/DD/YYYY'], ['DD/MM/YYYY', 'DD/MM/YYYY'], ['YYYY-MM-DD', 'YYYY-MM-DD']] },
                    { label: 'Units', key: 'units', options: [['imperial', 'Imperial (lbs, ft, °F)'], ['metric', 'Metric (kg, cm, °C)']] },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{field.label}</label>
                      <select
                        value={preferences[field.key as keyof typeof preferences]}
                        onChange={(e) => handlePreferenceChange(field.key, e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/80 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 text-sm font-medium cursor-pointer transition-all"
                      >
                        {field.options.map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Setting Sections */}
              {settingsSections.map((section, i) => (
                <div key={i} className="card-gradient-border p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${section.gradient} rounded-xl flex items-center justify-center`}>
                      <i className={`${section.icon} text-white text-lg`}></i>
                    </div>
                    {section.title}
                  </h2>

                  <div className="grid md:grid-cols-2 gap-3">
                    {section.items.map((item, j) => (
                      <Link
                        key={j}
                        to={item.link}
                        className="card-premium p-4 flex items-center gap-3 group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center group-hover:ring-indigo-300 group-hover:bg-indigo-50 transition-all">
                          <i className={`${item.icon} text-lg text-slate-400 group-hover:text-indigo-600 transition-colors`}></i>
                        </div>
                        <span className="flex-1 font-semibold text-slate-800 text-sm">{item.label}</span>
                        <i className="ri-arrow-right-s-line text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* App Info */}
              <div className="card-gradient-border p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <i className="ri-information-line text-indigo-500"></i>
                  App Information
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Version', value: '2.5.0' },
                    { label: 'Build', value: '2024.01.15' },
                    { label: 'Platform', value: 'Web' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50/80 rounded-lg">
                      <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-glow-indigo transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <i className="ri-refresh-line"></i>
                  Check for Updates
                </button>
              </div>

              {/* Storage */}
              <div className="relative overflow-hidden rounded-[20px]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950"></div>
                <div className="relative p-6 text-white">
                  <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                    <i className="ri-hard-drive-2-line text-indigo-400"></i>
                    Storage Usage
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Health Data', value: '2.4 GB', pct: 60, gradient: 'from-indigo-400 to-blue-400' },
                      { label: 'Medical Images', value: '1.8 GB', pct: 45, gradient: 'from-violet-400 to-purple-400' },
                      { label: 'Cache', value: '0.3 GB', pct: 8, gradient: 'from-amber-400 to-orange-400' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-white/60 font-medium">{item.label}</span>
                          <span className="text-xs font-bold">{item.value}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${item.gradient} rounded-full`} style={{ width: `${item.pct}%` }}></div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-white/10">
                      <div className="flex justify-between">
                        <span className="text-xs text-white/60">Total Used</span>
                        <span className="text-sm font-bold">4.5 GB / 10 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-[20px] p-6 bg-red-50/80 ring-1 ring-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                  <i className="ri-error-warning-line text-red-500"></i>
                  Danger Zone
                </h3>
                <p className="text-xs text-red-600/70 mb-4">
                  These actions are permanent and cannot be undone.
                </p>
                <button className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <i className="ri-delete-bin-line"></i>
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