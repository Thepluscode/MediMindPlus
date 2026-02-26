import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { healthAnalysisService, analyticsService } from '../../services/api';

export default function HealthAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'heart' | 'sleep' | 'activity' | 'stress'>('all');
  const [insights, setInsights] = useState<Array<{ title: string; description: string; icon: string; color: string }>>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [keyMetrics, setKeyMetrics] = useState({
    avgHeartRate: '68 bpm',
    sleepScore: '87/100',
    dailySteps: '9,250',
    stressLevel: 'Low',
  });

  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    setMetricsLoading(true);
    Promise.all([
      healthAnalysisService.getMetrics(days).catch(() => null),
      analyticsService.getSummary().catch(() => null),
    ]).then(([metricsRes, insightsRes]) => {
      if (metricsRes?.data) {
        const m = metricsRes.data;
        setKeyMetrics({
          avgHeartRate: m.avgHeartRate ? `${m.avgHeartRate} bpm` : '68 bpm',
          sleepScore: m.sleepScore ? `${m.sleepScore}/100` : '87/100',
          dailySteps: m.dailySteps ? m.dailySteps.toLocaleString() : '9,250',
          stressLevel: m.stressLevel || 'Low',
        });
      }
      if (insightsRes?.data) {
        const raw = insightsRes.data?.insights || insightsRes.data?.data || insightsRes.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setInsights(raw.slice(0, 3).map((ins: any) => ({
            title: ins.title || ins.name || 'Health Insight',
            description: ins.description || ins.message || '',
            icon: ins.icon || 'ri-lightbulb-line',
            color: ins.color || 'from-blue-500 to-teal-500',
          })));
        }
      }
    }).finally(() => setMetricsLoading(false));
  }, [timeRange]);

  // Heart Rate Data
  const heartRateData = [
    { date: 'Jan 1', value: 72, resting: 68, max: 145 },
    { date: 'Jan 5', value: 70, resting: 66, max: 142 },
    { date: 'Jan 10', value: 68, resting: 65, max: 140 },
    { date: 'Jan 15', value: 71, resting: 67, max: 148 },
    { date: 'Jan 20', value: 69, resting: 66, max: 143 },
    { date: 'Jan 25', value: 67, resting: 64, max: 138 },
    { date: 'Jan 30', value: 66, resting: 63, max: 136 }
  ];

  // Sleep Quality Data
  const sleepData = [
    { date: 'Mon', deep: 2.5, light: 4.2, rem: 1.8, awake: 0.5 },
    { date: 'Tue', deep: 2.8, light: 4.0, rem: 2.0, awake: 0.3 },
    { date: 'Wed', deep: 2.3, light: 4.5, rem: 1.6, awake: 0.6 },
    { date: 'Thu', deep: 2.9, light: 3.8, rem: 2.2, awake: 0.4 },
    { date: 'Fri', deep: 2.6, light: 4.3, rem: 1.9, awake: 0.5 },
    { date: 'Sat', deep: 3.2, light: 4.1, rem: 2.4, awake: 0.2 },
    { date: 'Sun', deep: 3.0, light: 4.0, rem: 2.3, awake: 0.3 }
  ];

  // Activity Data
  const activityData = [
    { date: 'Week 1', steps: 8500, calories: 2200, distance: 6.2 },
    { date: 'Week 2', steps: 9200, calories: 2400, distance: 6.8 },
    { date: 'Week 3', steps: 7800, calories: 2100, distance: 5.8 },
    { date: 'Week 4', steps: 10500, calories: 2600, distance: 7.5 }
  ];

  // Health Score Distribution
  const healthScoreData = [
    { name: 'Cardiovascular', value: 92, fullMark: 100 },
    { name: 'Sleep Quality', value: 85, fullMark: 100 },
    { name: 'Physical Activity', value: 88, fullMark: 100 },
    { name: 'Mental Health', value: 78, fullMark: 100 },
    { name: 'Nutrition', value: 82, fullMark: 100 },
    { name: 'Stress Level', value: 75, fullMark: 100 }
  ];

  // Body Composition
  const bodyCompositionData = [
    { name: 'Muscle Mass', value: 42, color: '#3b82f6' },
    { name: 'Body Fat', value: 18, color: '#f59e0b' },
    { name: 'Bone Mass', value: 12, color: '#8b5cf6' },
    { name: 'Water', value: 28, color: '#14b8a6' }
  ];

  // Blood Pressure Trends
  const bloodPressureData = [
    { date: 'Jan 1', systolic: 118, diastolic: 76 },
    { date: 'Jan 8', systolic: 120, diastolic: 78 },
    { date: 'Jan 15', systolic: 116, diastolic: 74 },
    { date: 'Jan 22', systolic: 119, diastolic: 77 },
    { date: 'Jan 29', systolic: 115, diastolic: 73 }
  ];

  // Stress Levels
  const stressData = [
    { time: '6 AM', level: 25 },
    { time: '9 AM', level: 45 },
    { time: '12 PM', level: 60 },
    { time: '3 PM', level: 75 },
    { time: '6 PM', level: 55 },
    { time: '9 PM', level: 30 },
    { time: '12 AM', level: 15 }
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6'];

  return (
    <div className="min-h-screen mesh-gradient">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-slate-900 mb-4">Health Analytics</h1>
            <p className="text-xl text-slate-600">Comprehensive visualization of your health metrics and progress tracking</p>
          </div>

          {/* Controls */}
          <div className="card-premium p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Time Range:</span>
                <div className="flex gap-2">
                  {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${
                        timeRange === range
                          ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metric Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Focus:</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border-2 border-slate-200 font-semibold text-sm cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Metrics</option>
                  <option value="heart">Cardiovascular</option>
                  <option value="sleep">Sleep Quality</option>
                  <option value="activity">Physical Activity</option>
                  <option value="stress">Stress &amp; Mental Health</option>
                </select>
              </div>
            </div>
          </div>

          {/* Key Metrics Summary */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Avg Heart Rate', value: keyMetrics.avgHeartRate, change: '-2.8%', icon: 'ri-heart-pulse-line', color: 'from-red-500 to-pink-500', positive: true },
              { label: 'Sleep Score', value: keyMetrics.sleepScore, change: '+5.2%', icon: 'ri-moon-line', color: 'from-purple-500 to-indigo-500', positive: true },
              { label: 'Daily Steps', value: keyMetrics.dailySteps, change: '+12.4%', icon: 'ri-walk-line', color: 'from-green-500 to-emerald-500', positive: true },
              { label: 'Stress Level', value: keyMetrics.stressLevel, change: '-8.1%', icon: 'ri-mental-health-line', color: 'from-blue-500 to-teal-500', positive: true }
            ].map((metric, index) => (
              <div key={index} className="card-premium p-6 hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center mb-4`}>
                  <i className={`${metric.icon} text-2xl text-white`}></i>
                </div>
                <p className="text-sm text-slate-600 mb-1">{metric.label}</p>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-bold text-slate-900">{metric.value}</h3>
                  <span className={`text-sm font-semibold ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Heart Rate Trends */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Heart Rate Trends</h2>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <i className="ri-heart-pulse-line text-xl text-white"></i>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={heartRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="resting" stroke="#3b82f6" strokeWidth={3} name="Resting HR" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={3} name="Average HR" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="max" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Max HR" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sleep Quality */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Sleep Quality</h2>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <i className="ri-moon-line text-xl text-white"></i>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="deep" stackId="a" fill="#8b5cf6" name="Deep Sleep" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="light" stackId="a" fill="#3b82f6" name="Light Sleep" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="rem" stackId="a" fill="#14b8a6" name="REM Sleep" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="awake" stackId="a" fill="#f59e0b" name="Awake" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Activity Progress */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Activity Progress</h2>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <i className="ri-walk-line text-xl text-white"></i>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}
                  />
                  <Area type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSteps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Health Score Radar */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Health Score Distribution</h2>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <i className="ri-dashboard-line text-xl text-white"></i>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={healthScoreData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#64748b" />
                  <Radar name="Your Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} strokeWidth={2} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Body Composition */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Body Composition</h2>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <i className="ri-body-scan-line text-xl text-white"></i>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bodyCompositionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bodyCompositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Blood Pressure Trends</h2>
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                  <i className="ri-heart-line text-xl text-white"></i>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bloodPressureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[60, 130]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={3} name="Systolic" dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={3} name="Diastolic" dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stress Levels Chart */}
          <div className="card-premium p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Daily Stress Pattern</h2>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <i className="ri-mental-health-line text-xl text-white"></i>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stressData}>
                <defs>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}
                />
                <Area type="monotone" dataKey="level" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorStress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Insights & Recommendations */}
          <div className="grid md:grid-cols-3 gap-6">
            {(insights.length > 0 ? insights : [
              {
                title: 'Excellent Progress',
                description: 'Your cardiovascular health has improved by 8% this month. Keep up the great work!',
                icon: 'ri-trophy-line',
                color: 'from-green-500 to-emerald-500'
              },
              {
                title: 'Sleep Optimization',
                description: 'Consider going to bed 30 minutes earlier to increase deep sleep duration.',
                icon: 'ri-lightbulb-line',
                color: 'from-blue-500 to-teal-500'
              },
              {
                title: 'Activity Goal',
                description: "You're 250 steps away from your weekly goal. A short walk will get you there!",
                icon: 'ri-flag-line',
                color: 'from-purple-500 to-pink-500'
              }
            ]).map((insight, index) => (
              <div key={index} className="card-premium p-6 hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${insight.color} rounded-xl flex items-center justify-center mb-4`}>
                  <i className={`${insight.icon} text-2xl text-white`}></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{insight.title}</h3>
                <p className="text-slate-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
