import { useState } from 'react';
import SignInModal from '../../../components/feature/SignInModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const heartRateData = [
  { time: 'Mon', bpm: 72 },
  { time: 'Tue', bpm: 68 },
  { time: 'Wed', bpm: 75 },
  { time: 'Thu', bpm: 70 },
  { time: 'Fri', bpm: 73 },
  { time: 'Sat', bpm: 69 },
  { time: 'Sun', bpm: 71 },
];

export default function HeroSection() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const handleStartFreeTrial = () => {
    setIsSignInModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSignInModalOpen(false);
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50">
        {/* Modern Mesh Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.08)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.06)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.04)_0%,transparent_50%)]"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-teal-400 rounded-full animate-float-slow opacity-60"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-blue-400 rounded-full animate-float-medium opacity-40"></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-float-fast opacity-50"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Eyebrow with modern badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200/50 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-teal-700 tracking-wide">
                  AI-Powered Healthcare Platform
                </span>
                <i className="ri-sparkling-fill text-teal-500 text-sm"></i>
              </div>

              {/* Main Headline with improved typography */}
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-[1.1]" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                Your Health,{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Predicted
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-teal-200 via-blue-200 to-purple-200 opacity-30 blur-sm"></div>
                </span>
                {' '}&amp;{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Protected
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-teal-200 via-blue-200 to-purple-200 opacity-30 blur-sm"></div>
                </span>
                {' '}by AI
              </h1>

              {/* Subheadline with better spacing */}
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-[540px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Advanced AI models analyze <span className="font-semibold text-slate-900">48+ health metrics</span> in real-time. Get <span className="font-semibold text-slate-900">3-5 year predictions</span> with <span className="font-semibold text-teal-600">92% accuracy</span>.
              </p>

              {/* CTA Buttons with modern design */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <button 
                  onClick={handleStartFreeTrial}
                  className="group relative px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white text-base font-semibold rounded-2xl hover:shadow-[0_20px_50px_rgba(20,184,166,0.3)] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 whitespace-nowrap cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">Start Free Trial</span>
                  <i className="ri-arrow-right-line text-xl relative group-hover:translate-x-1 transition-transform duration-300"></i>
                </button>
                <button className="group px-8 py-4 bg-white text-slate-800 text-base font-semibold rounded-2xl border-2 border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 whitespace-nowrap cursor-pointer">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <i className="ri-play-fill text-xl text-teal-600"></i>
                  </div>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Trust Badges with modern icons */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center bg-teal-100 rounded-full">
                    <i className="ri-check-line text-teal-600 text-xs"></i>
                  </div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                    <i className="ri-shield-check-line text-blue-600 text-xs"></i>
                  </div>
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center bg-purple-100 rounded-full">
                    <i className="ri-lock-line text-purple-600 text-xs"></i>
                  </div>
                  <span>256-bit Encryption</span>
                </div>
              </div>

              {/* Social Proof with glassmorphism */}
              <div className="inline-flex items-center gap-4 p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-11 h-11 rounded-full border-3 border-white bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-md"
                    >
                      <i className="ri-user-line text-white text-sm"></i>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <i key={i} className="ri-star-fill text-sm text-yellow-400"></i>
                    ))}
                    <span className="text-slate-900 font-bold ml-2">4.9</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">50,000+ users trust us</p>
                </div>
              </div>
            </div>

            {/* Right Column - Modern Dashboard Preview */}
            <div className="relative">
              {/* Main Dashboard Card with glassmorphism */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.1)] p-8 border border-white/40 animate-float">
                
                <div className="space-y-6">
                  {/* Header with modern badge */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>Health Dashboard</h3>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      <span className="text-xs font-bold text-green-700">Live Monitoring</span>
                    </div>
                  </div>

                  {/* Heart Rate Chart with modern styling */}
                  <div className="relative bg-gradient-to-br from-teal-50/50 to-blue-50/50 rounded-2xl p-5 border border-teal-100/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-red-100 to-pink-100 rounded-xl">
                          <i className="ri-heart-pulse-fill text-red-500 text-xl"></i>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Heart Rate</span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">72</div>
                        <div className="text-xs text-slate-500 font-medium">BPM</div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={heartRateData}>
                        <defs>
                          <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" domain={[60, 80]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.95)', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Line
                          type="monotone"
                          dataKey="bpm"
                          stroke="#14b8a6"
                          strokeWidth={3}
                          dot={{ fill: '#14b8a6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                          fill="url(#heartGradient)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* AI Prediction Cards with modern design */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 text-center border border-green-100/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                      <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i className="ri-heart-line text-white text-xl"></i>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Cardiovascular</p>
                      <p className="text-base font-bold text-green-600">Low Risk</p>
                    </div>
                    <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 text-center border border-blue-100/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                      <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i className="ri-brain-line text-white text-xl"></i>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Cognitive</p>
                      <p className="text-base font-bold text-blue-600">Optimal</p>
                    </div>
                    <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 text-center border border-purple-100/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                      <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i className="ri-mental-health-line text-white text-xl"></i>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Mental</p>
                      <p className="text-base font-bold text-purple-600">Good</p>
                    </div>
                  </div>

                  {/* Wearable Status with modern design */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-md">
                        <i className="ri-apple-fill text-white text-lg"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Apple Watch</p>
                        <p className="text-xs text-slate-500">Synced 2 min ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                      <i className="ri-battery-2-charge-line text-green-600 text-lg"></i>
                      <span className="text-sm font-bold text-green-700">87%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Notification Cards with modern design */}
              <div className="absolute -top-6 -right-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.2)] p-4 border border-red-100/50 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-red-100 to-pink-100 rounded-xl">
                    <i className="ri-alert-line text-red-500 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Anomaly Detected</p>
                    <p className="text-xs text-slate-500">Review required</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(34,197,94,0.2)] p-4 border border-green-100/50 animate-pulse-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                    <i className="ri-checkbox-circle-fill text-green-500 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Device Synced</p>
                    <p className="text-xs text-slate-500">Apple Watch connected</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -left-8 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-2xl shadow-[0_10px_40px_rgba(20,184,166,0.3)] px-4 py-3 animate-pulse-slow">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg backdrop-blur-sm">
                    <i className="ri-ai-generate text-sm"></i>
                  </div>
                  <span className="text-sm font-bold">AI Analyzing...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 animate-bounce-slow">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scroll</span>
            <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex items-start justify-center p-1">
              <div className="w-1.5 h-3 bg-slate-400 rounded-full animate-scroll"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Sign In Modal */}
      <SignInModal 
        isOpen={isSignInModalOpen} 
        onClose={handleCloseModal}
        defaultMode="signup"
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, -20px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 15px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -10px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
        @keyframes scroll {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(12px); opacity: 0; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-scroll {
          animation: scroll 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
