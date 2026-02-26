import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../home/components/Header';
import { authService } from '../../services/auth';
import { healthAnalysisService, consultationService, analyticsService } from '../../services/api';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'appointments' | 'reports'>('overview');
  const [liveMetrics, setLiveMetrics] = useState<Record<string, any>>({});
  const [liveAppointments, setLiveAppointments] = useState<any[]>([]);
  const [liveInsights, setLiveInsights] = useState<any[]>([]);

  useEffect(() => {
    // Load health metrics
    healthAnalysisService.getMetrics(7)
      .then((res) => {
        const d = res.data?.data || res.data;
        if (d && typeof d === 'object') setLiveMetrics(d);
      })
      .catch(() => {});

    // Load upcoming appointments
    consultationService.getList()
      .then((res) => {
        const appts = res.data?.consultations || res.data?.data || res.data;
        if (Array.isArray(appts) && appts.length > 0) setLiveAppointments(appts.slice(0, 3));
      })
      .catch(() => {});

    // Load AI insights
    analyticsService.getSummary()
      .then((res) => {
        const ins = res.data?.insights || res.data?.data || res.data;
        if (Array.isArray(ins) && ins.length > 0) setLiveInsights(ins.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const currentUser = authService.getCurrentUser();
  const fullName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email
    : 'Guest';
  const memberSince = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';
  const initials = currentUser
    ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase() || currentUser.email?.[0]?.toUpperCase()
    : 'G';

  const userData = {
    name: fullName,
    email: currentUser?.email || '',
    memberSince,
    plan: 'Free',
    biologicalAge: null as number | null,
    chronologicalAge: null as number | null,
    healthScore: null as number | null,
  };

  const healthMetrics = [
    { label: 'Heart Rate', value: liveMetrics.heartRate ?? liveMetrics.avgHeartRate ?? '72', unit: 'bpm', status: 'Normal', icon: 'ri-heart-pulse-line', gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', ring: 'ring-rose-100' },
    { label: 'Blood Pressure', value: liveMetrics.bloodPressure ?? '120/80', unit: 'mmHg', status: 'Optimal', icon: 'ri-pulse-line', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', ring: 'ring-blue-100' },
    { label: 'Sleep Quality', value: liveMetrics.sleepScore ?? '8.2', unit: '/10', status: 'Excellent', icon: 'ri-moon-line', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', ring: 'ring-violet-100' },
    { label: 'Activity', value: liveMetrics.dailySteps ? liveMetrics.dailySteps.toLocaleString() : '7,842', unit: 'steps', status: 'Good', icon: 'ri-walk-line', gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
    { label: 'Stress Level', value: liveMetrics.stressLevel ?? 'Low', unit: '', status: 'Good', icon: 'ri-mental-health-line', gradient: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50', ring: 'ring-teal-100' },
    { label: 'BMI', value: liveMetrics.bmi ?? '22.4', unit: '', status: 'Healthy', icon: 'ri-body-scan-line', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', ring: 'ring-amber-100' },
  ];

  const defaultAppointments = [
    { date: 'Feb 15', time: '10:00 AM', type: 'Virtual Consultation', doctor: 'Dr. Emily Chen', specialty: 'General Practice', status: 'confirmed', avatar: 'EC' },
    { date: 'Feb 22', time: '2:30 PM', type: 'Health Assessment', doctor: 'Dr. Michael Roberts', specialty: 'Cardiology', status: 'pending', avatar: 'MR' },
    { date: 'Mar 1', time: '11:00 AM', type: 'Follow-up Visit', doctor: 'Dr. Emily Chen', specialty: 'General Practice', status: 'confirmed', avatar: 'EC' },
  ];
  const upcomingAppointments = liveAppointments.length > 0
    ? liveAppointments.map((a: any) => {
        const start = a.startTime || a.scheduledAt;
        const d = start ? new Date(start) : null;
        const providerName = a.provider?.name || a.providerName || 'Dr. Unknown';
        const initials = providerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
        return {
          date: d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
          time: d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
          type: a.type || a.consultationType || 'Consultation',
          doctor: providerName,
          specialty: a.specialty || a.provider?.specialty || 'General Practice',
          status: a.status || 'pending',
          avatar: initials,
        };
      })
    : defaultAppointments;

  const recentReports = [
    { name: 'Biological Age Analysis', date: 'Jan 28, 2024', type: 'PDF', size: '2.4 MB', icon: 'ri-dna-line', color: 'text-indigo-600' },
    { name: 'Health Risk Assessment', date: 'Jan 20, 2024', type: 'PDF', size: '1.8 MB', icon: 'ri-shield-check-line', color: 'text-emerald-600' },
    { name: 'Drug Interaction Report', date: 'Jan 15, 2024', type: 'PDF', size: '856 KB', icon: 'ri-capsule-line', color: 'text-amber-600' },
    { name: 'Mental Health Evaluation', date: 'Jan 10, 2024', type: 'PDF', size: '1.2 MB', icon: 'ri-mental-health-line', color: 'text-violet-600' },
  ];

  const defaultInsights = [
    { title: 'Sleep Pattern Improvement', description: 'Your sleep quality improved 15% this month. Keep maintaining your bedtime routine for optimal recovery.', icon: 'ri-moon-line', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', badge: '+15%', badgeColor: 'bg-violet-100 text-violet-700' },
    { title: 'Activity Goal Streak', description: "You've hit your weekly activity goal 3 weeks running. Your cardiovascular health is trending upward.", icon: 'ri-trophy-line', gradient: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50', badge: '3 weeks', badgeColor: 'bg-amber-100 text-amber-700' },
    { title: 'Stress Reduction', description: 'Stress levels are down 22% since starting meditation. Consider extending sessions to 15 minutes.', icon: 'ri-mental-health-line', gradient: 'from-teal-500 to-emerald-500', bg: 'bg-teal-50', badge: '-22%', badgeColor: 'bg-teal-100 text-teal-700' },
  ];
  const aiInsights = liveInsights.length > 0
    ? liveInsights.map((ins: any, i: number) => ({
        title: ins.title || ins.name || 'Health Insight',
        description: ins.description || ins.message || '',
        icon: ins.icon || defaultInsights[i % 3].icon,
        gradient: ins.gradient || defaultInsights[i % 3].gradient,
        bg: ins.bg || defaultInsights[i % 3].bg,
        badge: ins.badge || ins.change || '',
        badgeColor: ins.badgeColor || defaultInsights[i % 3].badgeColor,
      }))
    : defaultInsights;

  const quickActions = [
    { label: 'Book Appointment', description: 'Schedule a visit', icon: 'ri-calendar-check-line', gradient: 'from-indigo-500 to-blue-600', link: '/book-appointment' },
    { label: 'Health Analytics', description: 'View your trends', icon: 'ri-line-chart-line', gradient: 'from-violet-500 to-purple-600', link: '/health-analytics' },
    { label: 'Virtual Health Twin', description: 'Digital simulation', icon: 'ri-user-heart-line', gradient: 'from-emerald-500 to-teal-600', link: '/virtual-health-twin' },
    { label: 'Find a Doctor', description: 'Browse providers', icon: 'ri-stethoscope-line', gradient: 'from-rose-500 to-pink-600', link: '/find-doctor' },
  ];

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: 'ri-dashboard-line' },
    { key: 'health' as const, label: 'Health Metrics', icon: 'ri-heart-pulse-line' },
    { key: 'appointments' as const, label: 'Appointments', icon: 'ri-calendar-line' },
    { key: 'reports' as const, label: 'Reports', icon: 'ri-file-chart-line' },
  ];

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />

      <main className="pt-20">
        {/* Dashboard Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 animate-gradient"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%),
                              radial-gradient(circle at 40% 80%, rgba(255,255,255,0.05) 0%, transparent 60%)`,
          }}></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center ring-2 ring-white/30">
                  <span className="text-white font-bold text-2xl lg:text-3xl">{initials}</span>
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</p>
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">{userData.name}</h1>
                  <p className="text-white/60 text-sm mt-1">Here's your personalized health overview</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="glass-dark rounded-2xl px-5 py-3">
                  <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Member Since</p>
                  <p className="text-white font-semibold text-sm">{userData.memberSince}</p>
                </div>
                <div className="glass-dark rounded-2xl px-5 py-3">
                  <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Plan</p>
                  <p className="text-white font-semibold text-sm flex items-center gap-1.5">
                    <i className="ri-vip-crown-line text-amber-400"></i>
                    {userData.plan}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sticky top-[72px] z-20">
          <div className="glass border-b border-white/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.key
                        ? 'bg-indigo-600 text-white shadow-glow-indigo'
                        : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600'
                      }`}
                  >
                    <i className={`${tab.icon} text-base`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Key Stats Row */}
              <div className="grid md:grid-cols-3 gap-5">
                {/* Health Score */}
                <div className="card-gradient-border p-6 animate-scale-in">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Health Score</h3>
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-glow-teal">
                      <i className="ri-heart-pulse-line text-xl text-white"></i>
                    </div>
                  </div>
                  <p className="text-4xl font-extrabold text-slate-900">{userData.healthScore ?? '—'}<span className="text-lg font-medium text-slate-400">{userData.healthScore ? '/100' : ''}</span></p>
                  <p className="text-sm text-slate-400 mt-2 flex items-center gap-1.5">
                    <i className="ri-arrow-right-line text-indigo-500"></i>
                    Complete your health profile to unlock
                  </p>
                </div>

                {/* Biological Age */}
                <div className="card-gradient-border p-6 animate-scale-in animation-delay-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Biological Age</h3>
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow-purple">
                      <i className="ri-time-line text-xl text-white"></i>
                    </div>
                  </div>
                  <p className="text-4xl font-extrabold text-slate-900">{userData.biologicalAge ?? '—'}<span className="text-lg font-medium text-slate-400">{userData.biologicalAge ? ' years' : ''}</span></p>
                  <p className="text-sm text-slate-400 mt-2 flex items-center gap-1.5">
                    <i className="ri-arrow-right-line text-indigo-500"></i>
                    Run a health assessment to calculate
                  </p>
                </div>

                {/* Plan Status */}
                <div className="card-gradient-border p-6 animate-scale-in animation-delay-200">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Current Plan</h3>
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <i className="ri-vip-crown-line text-xl text-white"></i>
                    </div>
                  </div>
                  <p className="text-4xl font-extrabold text-slate-900">{userData.plan}</p>
                  <p className="text-sm mt-2">
                    <Link to="/pricing" className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                      Upgrade to Pro <i className="ri-arrow-right-up-line"></i>
                    </Link>
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="ri-flashlight-line text-indigo-500"></i>
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, i) => (
                    <Link
                      key={i}
                      to={action.link}
                      className="card-premium p-5 group cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        <i className={`${action.icon} text-xl text-white`}></i>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mb-0.5">{action.label}</h3>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="ri-sparkling-2-line text-violet-500"></i>
                  AI-Powered Insights
                </h2>
                <div className="space-y-3">
                  {aiInsights.map((insight, i) => (
                    <div
                      key={i}
                      className="card-premium p-5 flex items-start gap-4 animate-fade-in-left"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${insight.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <i className={`${insight.icon} text-lg text-white`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-sm">{insight.title}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${insight.badgeColor}`}>
                            {insight.badge}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">{insight.description}</p>
                      </div>
                      <button className="text-slate-300 hover:text-indigo-500 transition-colors flex-shrink-0 cursor-pointer">
                        <i className="ri-arrow-right-s-line text-xl"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Quick Access */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="ri-settings-4-line text-slate-500"></i>
                  Administration
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: 'Team Management', desc: 'Manage members & roles', icon: 'ri-team-line', gradient: 'from-blue-500 to-indigo-600', link: '/team-management' },
                    { label: 'Audit Logs', desc: 'Track system events', icon: 'ri-file-list-3-line', gradient: 'from-violet-500 to-purple-600', link: '/audit-logs' },
                    { label: 'Roles & Permissions', desc: 'Configure access', icon: 'ri-shield-user-line', gradient: 'from-rose-500 to-red-600', link: '/roles-permissions' },
                  ].map((item, i) => (
                    <Link
                      key={i}
                      to={item.link}
                      className="card-premium p-5 flex items-center gap-4 group cursor-pointer"
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <i className={`${item.icon} text-lg text-white`}></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.label}</h3>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="ri-heart-pulse-line text-rose-500"></i>
                  Current Health Metrics
                </h2>
                <div className="grid md:grid-cols-3 gap-5">
                  {healthMetrics.map((metric, i) => (
                    <div key={i} className="card-gradient-border p-6 animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center`}>
                          <i className={`${metric.icon} text-xl text-white`}></i>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
                          {metric.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{metric.label}</p>
                      <p className="text-3xl font-extrabold text-slate-900">
                        {metric.value}
                        <span className="text-sm font-medium text-slate-400 ml-1">{metric.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trends Placeholder */}
              <div className="card-gradient-border p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Health Trends — Last 30 Days</h2>
                <div className="h-64 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-3">
                      <i className="ri-line-chart-line text-3xl text-indigo-400"></i>
                    </div>
                    <p className="text-slate-500 font-medium">Interactive charts coming soon</p>
                    <p className="text-xs text-slate-400 mt-1">Connect a wearable to start tracking</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="ri-calendar-line text-indigo-500"></i>
                  Upcoming Appointments
                </h2>
                <Link
                  to="/book-appointment"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-glow-indigo transition-all flex items-center gap-2"
                >
                  <i className="ri-add-line"></i>
                  Book New
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingAppointments.map((apt, i) => (
                  <div key={i} className="card-premium p-5 flex items-center justify-between animate-fade-in-left" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">{apt.avatar}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{apt.type}</h3>
                        <p className="text-sm text-slate-600">{apt.doctor} · <span className="text-slate-400">{apt.specialty}</span></p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <i className="ri-calendar-event-line"></i>
                          {apt.date} at {apt.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${apt.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        }`}>
                        {apt.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <i className="ri-file-chart-line text-indigo-500"></i>
                Recent Reports
              </h2>
              <div className="space-y-3">
                {recentReports.map((report, i) => (
                  <div key={i} className="card-premium p-5 flex items-center justify-between group animate-fade-in-left" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center ring-1 ring-slate-200">
                        <i className={`${report.icon} text-xl ${report.color}`}></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{report.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{report.date} · {report.size}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center gap-1.5">
                      <i className="ri-download-line"></i>
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
