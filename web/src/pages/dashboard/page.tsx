import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'appointments' | 'reports'>('overview');

  // Mock user data
  const userData = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    memberSince: 'January 2024',
    plan: 'Premium',
    biologicalAge: 32,
    chronologicalAge: 38,
    healthScore: 87
  };

  const healthMetrics = [
    { label: 'Heart Rate', value: '72 bpm', status: 'normal', icon: 'ri-heart-pulse-line', color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Blood Pressure', value: '120/80', status: 'optimal', icon: 'ri-pulse-line', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sleep Quality', value: '8.2/10', status: 'excellent', icon: 'ri-moon-line', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Activity Level', value: '7,842 steps', status: 'good', icon: 'ri-walk-line', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Stress Level', value: 'Low', status: 'good', icon: 'ri-mental-health-line', color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'BMI', value: '22.4', status: 'healthy', icon: 'ri-body-scan-line', color: 'text-orange-600', bg: 'bg-orange-50' }
  ];

  const upcomingAppointments = [
    { date: '2024-02-15', time: '10:00 AM', type: 'Virtual Consultation', doctor: 'Dr. Emily Chen', status: 'confirmed' },
    { date: '2024-02-22', time: '2:30 PM', type: 'Health Assessment', doctor: 'Dr. Michael Roberts', status: 'pending' },
    { date: '2024-03-01', time: '11:00 AM', type: 'Follow-up Visit', doctor: 'Dr. Emily Chen', status: 'confirmed' }
  ];

  const recentReports = [
    { name: 'Biological Age Analysis', date: '2024-01-28', type: 'PDF', size: '2.4 MB' },
    { name: 'Health Risk Assessment', date: '2024-01-20', type: 'PDF', size: '1.8 MB' },
    { name: 'Drug Interaction Report', date: '2024-01-15', type: 'PDF', size: '856 KB' },
    { name: 'Mental Health Evaluation', date: '2024-01-10', type: 'PDF', size: '1.2 MB' }
  ];

  const aiInsights = [
    { title: 'Sleep Pattern Improvement', description: 'Your sleep quality has improved by 15% this month. Keep maintaining your bedtime routine.', icon: 'ri-moon-line', color: 'text-purple-600' },
    { title: 'Activity Goal Achieved', description: 'Congratulations! You\'ve reached your weekly activity goal for 3 consecutive weeks.', icon: 'ri-trophy-line', color: 'text-yellow-600' },
    { title: 'Stress Management', description: 'Your stress levels are trending downward. Consider continuing your meditation practice.', icon: 'ri-mental-health-line', color: 'text-teal-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Welcome back, {userData.name}!</h1>
                <p className="text-teal-100">Here's your health overview for today</p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-teal-100">Member Since</p>
                  <p className="font-semibold">{userData.memberSince}</p>
                </div>
                <div className="w-16 h-16 flex items-center justify-center bg-white/20 rounded-full">
                  <i className="ri-user-line text-3xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-20 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'health'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Health Metrics
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'appointments'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reports
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Key Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-scale-in hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Health Score</h3>
                    <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg animate-pulse-slow">
                      <i className="ri-heart-pulse-line text-xl text-green-600"></i>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{userData.healthScore}/100</p>
                  <p className="text-sm text-green-600 mt-2">↑ 5 points this month</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-scale-in animation-delay-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Biological Age</h3>
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg animate-pulse-slow">
                      <i className="ri-time-line text-xl text-purple-600"></i>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{userData.biologicalAge} years</p>
                  <p className="text-sm text-purple-600 mt-2">{userData.chronologicalAge - userData.biologicalAge} years younger!</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-scale-in animation-delay-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Plan Status</h3>
                    <div className="w-10 h-10 flex items-center justify-center bg-teal-100 rounded-lg animate-pulse-slow">
                      <i className="ri-vip-crown-line text-xl text-teal-600"></i>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{userData.plan}</p>
                  <p className="text-sm text-gray-600 mt-2">Active subscription</p>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in-up animation-delay-300">
                <h2 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Insights</h2>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 animate-fade-in-left"
                      style={{ animationDelay: `${(index + 4) * 100}ms` }}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center bg-white rounded-lg flex-shrink-0 ${insight.color}`}>
                        <i className={`${insight.icon} text-xl`}></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Book Appointment', icon: 'ri-calendar-line', color: 'from-blue-500 to-teal-500', link: '/book-appointment' },
                  { label: 'Health Analytics', icon: 'ri-line-chart-line', color: 'from-purple-500 to-pink-500', link: '/health-analytics' },
                  { label: 'Virtual Health Twin', icon: 'ri-user-heart-line', color: 'from-green-500 to-emerald-500', link: '/virtual-health-twin' },
                  { label: 'Contact Support', icon: 'ri-customer-service-line', color: 'from-orange-500 to-red-500', link: '/contact' }
                ].map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <i className={`${action.icon} text-2xl text-white`}></i>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{action.label}</h3>
                  </Link>
                ))}

                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/team-management')}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <i className="ri-team-line text-2xl text-teal-600"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Team Management</h3>
                  <p className="text-sm text-gray-600">Manage team members and roles</p>
                </button>

                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/audit-logs')}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <i className="ri-file-list-3-line text-2xl text-purple-600"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Audit Logs</h3>
                  <p className="text-sm text-gray-600">Track critical system events</p>
                </button>

                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/roles-permissions')}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <i className="ri-shield-user-line text-2xl text-red-600"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Roles & Permissions</h3>
                  <p className="text-sm text-gray-600">Configure access control</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Current Health Metrics</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {healthMetrics.map((metric, index) => (
                    <div key={index} className="p-6 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 flex items-center justify-center ${metric.bg} rounded-lg`}>
                          <i className={`${metric.icon} text-2xl ${metric.color}`}></i>
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          {metric.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Trends Chart Placeholder */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Health Trends (Last 30 Days)</h2>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <i className="ri-line-chart-line text-5xl text-gray-300 mb-2"></i>
                    <p className="text-gray-500">Chart visualization coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
                <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap">
                  Book New Appointment
                </button>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-teal-100 rounded-lg">
                        <i className="ri-calendar-event-line text-xl text-teal-600"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{appointment.type}</h3>
                        <p className="text-sm text-gray-600">{appointment.doctor}</p>
                        <p className="text-sm text-gray-500">{appointment.date} at {appointment.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {appointment.status}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                        <i className="ri-more-2-fill text-xl"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Reports</h2>
              <div className="space-y-3">
                {recentReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg">
                        <i className="ri-file-pdf-line text-xl text-red-600"></i>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{report.name}</h3>
                        <p className="text-sm text-gray-500">{report.date} • {report.size}</p>
                      </div>
                    </div>
                    <button className="text-teal-600 hover:text-teal-700 font-medium text-sm whitespace-nowrap">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
