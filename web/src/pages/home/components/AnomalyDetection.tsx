export default function AnomalyDetection() {
  const alerts = [
    {
      type: 'Critical',
      title: 'Irregular Heart Rate Detected',
      time: '2 minutes ago',
      value: '142 BPM',
      normal: '60-100 BPM',
      icon: 'ri-heart-pulse-line',
      color: 'red',
      action: 'Contact physician immediately'
    },
    {
      type: 'Warning',
      title: 'Blood Pressure Spike',
      time: '15 minutes ago',
      value: '145/95 mmHg',
      normal: '120/80 mmHg',
      icon: 'ri-pulse-line',
      color: 'orange',
      action: 'Monitor closely for next hour'
    },
    {
      type: 'Info',
      title: 'Sleep Pattern Change',
      time: '1 hour ago',
      value: '4.2 hours',
      normal: '7-9 hours',
      icon: 'ri-moon-line',
      color: 'blue',
      action: 'Review sleep hygiene tips'
    }
  ];

  const metrics = [
    {
      name: 'Heart Rate',
      current: 72,
      baseline: 68,
      unit: 'BPM',
      trend: 'up',
      status: 'normal',
      data: [65, 68, 70, 72, 71, 72, 73, 72]
    },
    {
      name: 'Blood Pressure',
      current: 118,
      baseline: 120,
      unit: 'mmHg',
      trend: 'down',
      status: 'normal',
      data: [122, 120, 119, 118, 120, 118, 117, 118]
    },
    {
      name: 'Blood Glucose',
      current: 95,
      baseline: 90,
      unit: 'mg/dL',
      trend: 'up',
      status: 'normal',
      data: [88, 90, 92, 94, 93, 95, 96, 95]
    },
    {
      name: 'SpO2',
      current: 98,
      baseline: 98,
      unit: '%',
      trend: 'stable',
      status: 'normal',
      data: [98, 98, 97, 98, 98, 98, 99, 98]
    }
  ];

  const features = [
    {
      icon: 'ri-radar-line',
      title: 'Continuous Monitoring',
      description: '24/7 real-time analysis of vital signs and health metrics from connected devices'
    },
    {
      icon: 'ri-alarm-warning-line',
      title: 'Instant Alerts',
      description: 'Immediate notifications when anomalies are detected, with severity classification'
    },
    {
      icon: 'ri-line-chart-line',
      title: 'Pattern Recognition',
      description: 'ML algorithms learn your baseline and detect subtle deviations before they become critical'
    },
    {
      icon: 'ri-shield-cross-line',
      title: 'Emergency Response',
      description: 'Automatic emergency contact notification for critical health events'
    }
  ];

  return (
    <section id="anomaly-detection" className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Interactive Dashboard */}
          <div>
            {/* Alert Feed */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Recent Alerts</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-600">Live Monitoring</span>
                </div>
              </div>

              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-l-4 border-${alert.color}-500 bg-${alert.color}-50/50 hover:shadow-md transition-all cursor-pointer`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-${alert.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <i className={`${alert.icon} text-${alert.color}-600 text-xl`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm">{alert.title}</h4>
                          <span className={`px-2 py-0.5 bg-${alert.color}-100 text-${alert.color}-700 text-xs font-semibold rounded-full`}>
                            {alert.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{alert.time}</p>
                        <div className="flex items-center gap-4 text-xs mb-2">
                          <span className="text-slate-700">
                            <strong>Current:</strong> {alert.value}
                          </span>
                          <span className="text-slate-500">
                            <strong>Normal:</strong> {alert.normal}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 italic">{alert.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-600">{metric.name}</span>
                    <i className={`ri-arrow-${metric.trend === 'up' ? 'up' : metric.trend === 'down' ? 'down' : 'right'}-line text-sm ${
                      metric.trend === 'up' ? 'text-orange-500' : metric.trend === 'down' ? 'text-blue-500' : 'text-slate-400'
                    }`}></i>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-slate-900">{metric.current}</span>
                    <span className="text-sm text-slate-500 ml-1">{metric.unit}</span>
                  </div>
                  <div className="h-12 flex items-end gap-0.5">
                    {metric.data.map((value, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-teal-500 rounded-sm"
                        style={{ height: `${(value / Math.max(...metric.data)) * 100}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full mb-6">
              <i className="ri-alert-line text-orange-600"></i>
              <span className="text-sm font-semibold text-orange-600">Real-time Health Alerts</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Detect Problems Before They Become Critical
            </h2>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Our AI continuously monitors your health data, learning your unique patterns and instantly alerting you to any concerning changes. Early detection can save your life.
            </p>

            {/* Features */}
            <div className="space-y-6 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                    <i className={`${feature.icon} text-white text-xl`}></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent mb-1">
                  &lt;30s
                </div>
                <div className="text-xs text-slate-600">Alert Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent mb-1">
                  97%
                </div>
                <div className="text-xs text-slate-600">Detection Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent mb-1">
                  24/7
                </div>
                <div className="text-xs text-slate-600">Monitoring</div>
              </div>
            </div>

            <button className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-base rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 whitespace-nowrap cursor-pointer">
              <i className="ri-shield-check-line text-xl"></i>
              Enable Anomaly Detection
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
