export default function FeaturesGrid() {
  const features = [
    {
      icon: 'ri-brain-line',
      title: 'AI Health Predictions',
      description: 'Advanced machine learning models analyze your health data to predict potential issues 3-5 years in advance with 92% accuracy.',
      gradient: 'from-teal-500 to-blue-500',
      bgGradient: 'from-teal-50 to-blue-50',
      iconBg: 'from-teal-100 to-blue-100',
    },
    {
      icon: 'ri-heart-pulse-line',
      title: 'Real-Time Monitoring',
      description: 'Continuous tracking of 48+ vital health metrics from your wearable devices with instant anomaly detection and alerts.',
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-50 to-pink-50',
      iconBg: 'from-red-100 to-pink-100',
    },
    {
      icon: 'ri-shield-check-line',
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade security with 256-bit encryption, ensuring your health data remains private and protected at all times.',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'from-green-100 to-emerald-100',
    },
    {
      icon: 'ri-user-heart-line',
      title: 'Personalized Insights',
      description: 'Get tailored health recommendations based on your unique biological profile, lifestyle, and genetic predispositions.',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'from-purple-100 to-pink-100',
    },
    {
      icon: 'ri-medicine-bottle-line',
      title: 'Drug Interaction Checker',
      description: 'AI-powered analysis of medication combinations to prevent dangerous interactions and optimize treatment effectiveness.',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      iconBg: 'from-orange-100 to-red-100',
    },
    {
      icon: 'ri-mental-health-line',
      title: 'Mental Health Support',
      description: 'CBT-based AI chatbot provides 24/7 mental health support, mood tracking, and evidence-based therapeutic interventions.',
      gradient: 'from-blue-500 to-purple-500',
      bgGradient: 'from-blue-50 to-purple-50',
      iconBg: 'from-blue-100 to-purple-100',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200/50 rounded-full">
            <i className="ri-sparkling-fill text-teal-600 text-sm"></i>
            <span className="text-sm font-semibold text-teal-700 tracking-wide">Platform Features</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Everything You Need for{' '}
            <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Optimal Health
            </span>
          </h2>
          
          <p className="text-lg text-slate-600 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Comprehensive AI-powered tools designed to monitor, predict, and protect your health
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 border border-slate-200/50 hover:border-transparent hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer overflow-hidden"
            >
              {/* Hover Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Content */}
              <div className="relative space-y-4">
                {/* Icon */}
                <div className={`w-16 h-16 flex items-center justify-center bg-gradient-to-br ${feature.iconBg} rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <i className={`${feature.icon} text-3xl bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}></i>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-900 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                  {feature.description}
                </p>

                {/* Learn More Link */}
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 group-hover:text-teal-600 transition-colors pt-2">
                  <span>Learn more</span>
                  <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform duration-300"></i>
                </div>
              </div>

              {/* Decorative Element */}
              <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`}></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white text-base font-semibold rounded-2xl hover:shadow-[0_20px_50px_rgba(20,184,166,0.3)] hover:scale-105 transition-all duration-300 whitespace-nowrap cursor-pointer">
            <span>Explore All Features</span>
            <i className="ri-arrow-right-line text-lg group-hover:translate-x-1 transition-transform duration-300"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
