import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function Profile() {
  const [user] = useState({
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@medimindplus.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1985-03-15',
    bloodType: 'O+',
    height: '5\'7"',
    weight: '145 lbs',
    memberSince: 'January 2024',
    plan: 'Premium',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20healthcare%20provider%20portrait%20woman%20doctor%20white%20coat%20confident%20smile%20modern%20medical%20office%20background%20clean%20professional%20lighting&width=400&height=400&seq=profile-avatar-001&orientation=squarish'
  });

  const healthMetrics = [
    { label: 'Biological Age', value: '32 years', status: 'excellent', icon: 'ri-heart-pulse-line' },
    { label: 'Health Score', value: '92/100', status: 'excellent', icon: 'ri-shield-check-line' },
    { label: 'Active Days', value: '156 days', status: 'good', icon: 'ri-run-line' },
    { label: 'Appointments', value: '12 total', status: 'normal', icon: 'ri-calendar-check-line' }
  ];

  const quickActions = [
    { title: 'Edit Profile', icon: 'ri-edit-line', link: '/edit-profile', color: 'from-blue-500 to-blue-600' },
    { title: 'Medical History', icon: 'ri-file-list-3-line', link: '/medical-history', color: 'from-teal-500 to-teal-600' },
    { title: 'Change Password', icon: 'ri-lock-password-line', link: '/change-password', color: 'from-purple-500 to-purple-600' },
    { title: 'Privacy Settings', icon: 'ri-shield-user-line', link: '/privacy-settings', color: 'from-orange-500 to-orange-600' }
  ];

  const recentActivity = [
    { action: 'Completed CBT Therapy Session', time: '2 hours ago', icon: 'ri-chat-smile-3-line' },
    { action: 'Logged Health Data', time: '5 hours ago', icon: 'ri-heart-add-line' },
    { action: 'Drug Interaction Check', time: '1 day ago', icon: 'ri-medicine-bottle-line' },
    { action: 'Virtual Health Twin Updated', time: '2 days ago', icon: 'ri-user-heart-line' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center border-4 border-white">
                  <i className="ri-check-line text-white text-lg"></i>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-teal-500 text-white">
                    <i className="ri-vip-crown-line mr-1"></i>
                    {user.plan}
                  </span>
                </div>
                <p className="text-slate-600 mb-4">Member since {user.memberSince}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {healthMetrics.map((metric, index) => (
                    <div key={index} className="text-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
                      <div className="w-12 h-12 mx-auto mb-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <i className={`${metric.icon} text-2xl text-blue-600`}></i>
                      </div>
                      <div className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</div>
                      <div className="text-xs text-slate-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                  <Link 
                    to="/edit-profile"
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-edit-line mr-2"></i>
                    Edit
                  </Link>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-500 mb-2 block">Email Address</label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <i className="ri-mail-line text-xl text-slate-400"></i>
                      <span className="text-slate-900">{user.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-500 mb-2 block">Phone Number</label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <i className="ri-phone-line text-xl text-slate-400"></i>
                      <span className="text-slate-900">{user.phone}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-500 mb-2 block">Date of Birth</label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <i className="ri-cake-3-line text-xl text-slate-400"></i>
                      <span className="text-slate-900">{user.dateOfBirth}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-500 mb-2 block">Blood Type</label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <i className="ri-drop-line text-xl text-slate-400"></i>
                      <span className="text-slate-900">{user.bloodType}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-500 mb-2 block">Height</label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <i className="ri-ruler-line text-xl text-slate-400"></i>
                      <span className="text-slate-900">{user.height}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-500 mb-2 block">Weight</label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <i className="ri-scales-3-line text-xl text-slate-400"></i>
                      <span className="text-slate-900">{user.weight}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl hover:shadow-md transition-all duration-300 cursor-pointer">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <i className={`${activity.icon} text-xl text-blue-600`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{activity.action}</p>
                        <p className="text-sm text-slate-500">{activity.time}</p>
                      </div>
                      <i className="ri-arrow-right-s-line text-xl text-slate-400"></i>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Link
                      key={index}
                      to={action.link}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r hover:shadow-lg transition-all duration-300 rounded-xl cursor-pointer group"
                      style={{ background: `linear-gradient(135deg, ${action.color.split(' ')[0].replace('from-', '')}, ${action.color.split(' ')[1].replace('to-', '')})` }}
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <i className={`${action.icon} text-xl text-white`}></i>
                      </div>
                      <span className="flex-1 font-semibold text-white">{action.title}</span>
                      <i className="ri-arrow-right-line text-white"></i>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-3xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <i className="ri-shield-check-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Account Status</h3>
                    <p className="text-sm text-blue-100">All systems active</p>
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profile Complete</span>
                    <span className="font-bold">100%</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 p-3 bg-white/10 rounded-lg">
                    <i className="ri-checkbox-circle-line text-lg"></i>
                    <span className="text-sm">HIPAA Compliant</span>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                    <i className="ri-lock-line text-lg"></i>
                    <span className="text-sm">End-to-End Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}