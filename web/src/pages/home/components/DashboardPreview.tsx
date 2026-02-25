import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const heartRateData = [
  { time: '00:00', bpm: 68 },
  { time: '04:00', bpm: 65 },
  { time: '08:00', bpm: 72 },
  { time: '12:00', bpm: 78 },
  { time: '16:00', bpm: 75 },
  { time: '20:00', bpm: 70 },
  { time: '23:59', bpm: 69 },
];

const quickActions = [
  { icon: 'ri-add-circle-line', label: 'Log Health Data', color: 'from-blue-500 to-cyan-500' },
  { icon: 'ri-chat-4-line', label: 'Talk to AI', color: 'from-teal-500 to-emerald-500' },
];

const featureCategories = [
  {
    title: 'AI & Prediction',
    icon: 'ri-brain-line',
    color: 'from-blue-500 to-cyan-500',
    features: ['AI Models', 'Voice Analysis', 'Anomalies', 'Health Timeline'],
  },
  {
    title: 'Health Monitoring',
    icon: 'ri-heart-pulse-line',
    color: 'from-teal-500 to-emerald-500',
    features: ['Wearables', 'Virtual Twin', 'Bio Age', 'Lab Results'],
  },
  {
    title: 'Mental Health',
    icon: 'ri-mental-health-line',
    color: 'from-purple-500 to-pink-500',
    features: ['CBT Chatbot', 'Crisis Support', 'Wellness', 'Therapy'],
  },
  {
    title: 'Medical Imaging',
    icon: 'ri-microscope-line',
    color: 'from-orange-500 to-amber-500',
    features: ['X-Ray Analysis', 'Mammography', 'Retinal Scan', 'Brain MRI'],
  },
];

export default function DashboardPreview() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-[40%_60%] gap-12 items-center">
          {/* Left Column - Descriptive Content */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <span className="text-sm font-semibold text-teal-600 uppercase tracking-wider">
                Live Dashboard
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Monitor Everything<br />in Real-Time
            </h2>

            <div className="space-y-5">
              {[
                'Live biometrics from wearables',
                'AI anomaly detection alerts',
                '7-day health trend charts',
                'Predictive health analytics',
                'Comprehensive medical history',
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <i className="ri-checkbox-circle-fill text-teal-500 text-xl"></i>
                  <span className="text-[17px] text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <button className="text-blue-600 font-semibold text-lg hover:text-blue-700 transition-colors inline-flex items-center gap-2 group cursor-pointer">
              Explore Full Dashboard
              <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>

          {/* Right Column - Dashboard Embed */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
              {/* Health Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Health Summary</h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-green-700">All Systems Normal</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <i className="ri-heart-pulse-line text-red-500 text-2xl mb-1"></i>
                    <p className="text-2xl font-bold text-slate-900">72</p>
                    <p className="text-xs text-slate-600">BPM</p>
                  </div>
                  <div className="text-center">
                    <i className="ri-temp-cold-line text-blue-500 text-2xl mb-1"></i>
                    <p className="text-2xl font-bold text-slate-900">98.6</p>
                    <p className="text-xs text-slate-600">°F</p>
                  </div>
                  <div className="text-center">
                    <i className="ri-lungs-line text-teal-500 text-2xl mb-1"></i>
                    <p className="text-2xl font-bold text-slate-900">98</p>
                    <p className="text-xs text-slate-600">SpO2%</p>
                  </div>
                </div>
              </div>

              {/* Health Trends Chart */}
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-4">7-Day Heart Rate Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={heartRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#64748b" domain={[60, 85]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bpm"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ fill: '#0ea5e9', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className={`p-4 bg-gradient-to-r ${action.color} text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-semibold whitespace-nowrap cursor-pointer`}
                  >
                    <i className={`${action.icon} text-xl`}></i>
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Feature Categories */}
              <div className="grid grid-cols-2 gap-4">
                {featureCategories.map((category, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <i className={`${category.icon} text-white text-sm`}></i>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900">{category.title}</h5>
                    </div>
                    <div className="space-y-1">
                      {category.features.map((feature, idx) => (
                        <p key={idx} className="text-xs text-slate-600">• {feature}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl shadow-xl px-4 py-2 animate-pulse">
              <div className="flex items-center gap-2">
                <i className="ri-sparkling-line"></i>
                <span className="text-sm font-semibold">48+ Features</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
