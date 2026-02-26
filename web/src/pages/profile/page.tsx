import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { authService } from '../../services/auth';
import { settingsService, consultationService } from '../../services/api';

export default function Profile() {
  const currentUser = authService.getCurrentUser();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [appointmentCount, setAppointmentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      settingsService.getProfile()
        .then(res => setProfile(res.data?.user || res.data || {}))
        .catch(() => {}),
      consultationService.getList()
        .then(res => {
          const list = res.data?.consultations || res.data?.data || res.data;
          setAppointmentCount(Array.isArray(list) ? list.length : 0);
        })
        .catch(() => setAppointmentCount(0)),
    ]).finally(() => setLoading(false));
  }, []);

  const firstName = profile?.first_name || currentUser?.firstName || '';
  const lastName = profile?.last_name || currentUser?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || currentUser?.email || 'User';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || (currentUser?.email?.[0] || 'U').toUpperCase();
  const email = profile?.email || currentUser?.email || '—';
  const phone = profile?.phone || '—';
  const dateOfBirth = profile?.date_of_birth
    ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';
  const bloodType = profile?.blood_type || '—';
  const heightVal = profile?.height ? `${profile.height}"` : '—';
  const weightVal = profile?.weight ? `${profile.weight} lbs` : '—';
  const memberSince = profile?.created_at || currentUser?.createdAt
    ? new Date(profile?.created_at || currentUser?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const quickActions = [
    { title: 'Edit Profile', icon: 'ri-edit-line', link: '/edit-profile', gradient: 'from-indigo-500 to-blue-600' },
    { title: 'Medical History', icon: 'ri-file-list-3-line', link: '/help-center', gradient: 'from-emerald-500 to-teal-600' },
    { title: 'Change Password', icon: 'ri-lock-password-line', link: '/settings', gradient: 'from-violet-500 to-purple-600' },
    { title: 'Privacy Settings', icon: 'ri-shield-user-line', link: '/settings', gradient: 'from-amber-500 to-orange-600' },
  ];

  const infoFields = [
    { label: 'Email Address', value: email, icon: 'ri-mail-line' },
    { label: 'Phone Number', value: phone, icon: 'ri-phone-line' },
    { label: 'Date of Birth', value: dateOfBirth, icon: 'ri-cake-3-line' },
    { label: 'Blood Type', value: bloodType, icon: 'ri-drop-line' },
    { label: 'Height', value: heightVal, icon: 'ri-ruler-line' },
    { label: 'Weight', value: weightVal, icon: 'ri-scales-3-line' },
  ];

  const healthMetrics = [
    { label: 'Appointments', value: appointmentCount !== null ? String(appointmentCount) : '—', unit: 'total', icon: 'ri-calendar-check-line', gradient: 'from-violet-500 to-purple-600' },
    { label: 'Member Since', value: memberSince, unit: '', icon: 'ri-calendar-line', gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Plan', value: 'Free', unit: '', icon: 'ri-vip-crown-line', gradient: 'from-amber-500 to-orange-500' },
    { label: 'Status', value: 'Active', unit: '', icon: 'ri-shield-check-line', gradient: 'from-emerald-500 to-green-600' },
  ];

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Profile Hero */}
          <div className="relative overflow-hidden rounded-3xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 animate-gradient"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)`,
            }}></div>

            <div className="relative p-8 lg:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative">
                  <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center ring-2 ring-white/30">
                    {loading ? (
                      <div className="w-10 h-10 border-4 border-white/50 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-white font-bold text-4xl lg:text-5xl">{initials}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center ring-2 ring-white shadow-lg">
                    <i className="ri-check-line text-white text-lg"></i>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    {loading ? (
                      <div className="h-10 w-48 bg-white/20 rounded-xl animate-pulse"></div>
                    ) : (
                      <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">{fullName}</h1>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white ring-1 ring-white/30">
                      <i className="ri-vip-crown-line text-amber-300"></i>
                      Free Plan
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">Member since {loading ? '...' : memberSince}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                    {healthMetrics.map((metric, i) => (
                      <div key={i} className="glass-dark rounded-xl p-4 text-center animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center`}>
                          <i className={`${metric.icon} text-lg text-white`}></i>
                        </div>
                        <div className="text-lg font-extrabold text-white leading-tight">
                          {loading ? <span className="opacity-50">…</span> : metric.value}
                          {metric.unit && <span className="text-xs font-medium text-white/50 ml-0.5">{metric.unit}</span>}
                        </div>
                        <div className="text-[10px] font-medium text-white/50 uppercase tracking-wider mt-0.5">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="card-gradient-border p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i className="ri-user-3-line text-indigo-500"></i>
                    Personal Information
                  </h2>
                  <Link
                    to="/edit-profile"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <i className="ri-edit-line"></i>
                    Edit
                  </Link>
                </div>

                {loading ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
                        <div className="h-12 bg-slate-100 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {infoFields.map((field, i) => (
                      <div key={i} className="group">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{field.label}</label>
                        <div className="flex items-center gap-3 p-3.5 bg-slate-50/80 rounded-xl ring-1 ring-slate-100 group-hover:ring-indigo-200 transition-all">
                          <i className={`${field.icon} text-lg text-slate-400`}></i>
                          <span className={`font-medium text-sm ${field.value === '—' ? 'text-slate-400 italic' : 'text-slate-900'}`}>
                            {field.value === '—' ? 'Not set' : field.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div className="card-gradient-border p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <i className="ri-information-line text-blue-500"></i>
                  Account Information
                </h2>
                <div className="space-y-3">
                  {[
                    { label: 'Account ID', value: loading ? '...' : (profile?.id || currentUser?.id || '—'), icon: 'ri-fingerprint-line' },
                    { label: 'Role', value: loading ? '...' : (profile?.role || currentUser?.role || 'patient'), icon: 'ri-shield-user-line' },
                    { label: 'Email Verified', value: 'Yes', icon: 'ri-mail-check-line' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 bg-slate-50/80 rounded-xl ring-1 ring-slate-100">
                      <i className={`${item.icon} text-lg text-slate-400`}></i>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">{item.label}</span>
                      <span className="text-slate-900 font-medium text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card-gradient-border p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <i className="ri-flashlight-line text-amber-500"></i>
                  Quick Actions
                </h3>
                <div className="space-y-2.5">
                  {quickActions.map((action, i) => (
                    <Link
                      key={i}
                      to={action.link}
                      className={`flex items-center gap-3.5 p-3.5 rounded-xl bg-gradient-to-r ${action.gradient} group hover:shadow-lg transition-all`}
                    >
                      <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i className={`${action.icon} text-lg text-white`}></i>
                      </div>
                      <span className="flex-1 font-semibold text-white text-sm">{action.title}</span>
                      <i className="ri-arrow-right-line text-white/60"></i>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account Status */}
              <div className="relative overflow-hidden rounded-[20px]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700"></div>
                <div className="relative p-6 text-white">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <i className="ri-shield-check-line text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold">Account Status</h3>
                      <p className="text-xs text-white/60">All systems active</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-white/70">Profile Complete</span>
                        <span className="text-xs font-bold">
                          {loading ? '...' : (
                            [firstName, lastName, phone, dateOfBirth, bloodType].filter(v => v && v !== '—').length >= 4 ? '100%' : '60%'
                          )}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transition-all" style={{
                          width: loading ? '0%' : (
                            [firstName, lastName, phone, dateOfBirth, bloodType].filter(v => v && v !== '—').length >= 4 ? '100%' : '60%'
                          )
                        }}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-white/10 rounded-lg text-xs">
                      <i className="ri-checkbox-circle-line text-emerald-400"></i>
                      <span>HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-white/10 rounded-lg text-xs">
                      <i className="ri-lock-line text-emerald-400"></i>
                      <span>End-to-End Encrypted</span>
                    </div>
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
