export default function AIPredictionModels() {
  const models = [
    {
      name: 'Cardiovascular Risk',
      accuracy: '94.2%',
      icon: 'ri-heart-pulse-line',
      gradient: 'from-red-500 to-pink-500',
      description: 'Predicts heart disease risk using 50+ biomarkers',
      features: ['ECG analysis', 'Blood pressure trends', 'Cholesterol patterns']
    },
    {
      name: 'Diabetes Prediction',
      accuracy: '91.8%',
      icon: 'ri-test-tube-line',
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Early detection of Type 2 diabetes onset',
      features: ['Glucose monitoring', 'HbA1c tracking', 'Insulin resistance']
    },
    {
      name: 'Cancer Detection',
      accuracy: '96.5%',
      icon: 'ri-microscope-line',
      gradient: 'from-purple-500 to-pink-500',
      description: 'Multi-cancer early detection system',
      features: ['Tumor markers', 'Genetic analysis', 'Imaging correlation']
    },
    {
      name: 'Stroke Risk',
      accuracy: '89.3%',
      icon: 'ri-brain-line',
      gradient: 'from-orange-500 to-red-500',
      description: 'Predicts stroke probability within 10 years',
      features: ['Blood flow analysis', 'Clotting factors', 'Vascular health']
    },
    {
      name: 'Kidney Disease',
      accuracy: '92.7%',
      icon: 'ri-drop-line',
      gradient: 'from-teal-500 to-green-500',
      description: 'Chronic kidney disease progression tracking',
      features: ['GFR estimation', 'Creatinine levels', 'Protein analysis']
    },
    {
      name: 'Mental Health',
      accuracy: '88.4%',
      icon: 'ri-emotion-line',
      gradient: 'from-indigo-500 to-purple-500',
      description: 'Depression and anxiety risk assessment',
      features: ['Mood patterns', 'Sleep quality', 'Activity levels']
    },
    {
      name: 'Liver Function',
      accuracy: '93.1%',
      icon: 'ri-flask-line',
      gradient: 'from-yellow-500 to-orange-500',
      description: 'Liver disease and cirrhosis prediction',
      features: ['Enzyme levels', 'Bilirubin tracking', 'Fatty liver detection']
    },
    {
      name: 'Respiratory Disease',
      accuracy: '90.6%',
      icon: 'ri-lungs-line',
      gradient: 'from-cyan-500 to-blue-500',
      description: 'COPD and asthma progression monitoring',
      features: ['Lung capacity', 'Oxygen saturation', 'Breathing patterns']
    },
    {
      name: 'Alzheimer\'s Risk',
      accuracy: '87.9%',
      icon: 'ri-mind-map',
      gradient: 'from-pink-500 to-rose-500',
      description: 'Cognitive decline and dementia prediction',
      features: ['Memory tests', 'Brain imaging', 'Genetic markers']
    },
    {
      name: 'Osteoporosis',
      accuracy: '91.2%',
      icon: 'ri-bone-line',
      gradient: 'from-slate-500 to-gray-500',
      description: 'Bone density and fracture risk assessment',
      features: ['DEXA scans', 'Calcium levels', 'Vitamin D status']
    }
  ];

  return (
    <section id="ai-models" className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            <i className="ri-brain-line text-blue-600"></i>
            <span className="text-sm font-semibold text-blue-600">AI Prediction Models</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            10+ Disease Risk Models
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Our advanced machine learning models analyze thousands of data points to predict disease risk with clinical-grade accuracy. Early detection saves lives.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-2">
              10+
            </div>
            <div className="text-sm text-slate-600">AI Models</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-2">
              92%
            </div>
            <div className="text-sm text-slate-600">Avg Accuracy</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-2">
              50M+
            </div>
            <div className="text-sm text-slate-600">Data Points</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mb-2">
              24/7
            </div>
            <div className="text-sm text-slate-600">Monitoring</div>
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${model.gradient} flex items-center justify-center`}>
                  <i className={`${model.icon} text-white text-2xl`}></i>
                </div>
                <div className="px-3 py-1 bg-green-50 rounded-full">
                  <span className="text-xs font-semibold text-green-600">{model.accuracy}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {model.name}
              </h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                {model.description}
              </p>
              
              <div className="space-y-2">
                {model.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <i className="ri-check-line text-teal-500 text-sm"></i>
                    <span className="text-xs text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button className="mt-6 w-full py-2.5 bg-slate-50 text-slate-700 font-medium text-sm rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                View Details
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold text-base rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto whitespace-nowrap cursor-pointer">
            <i className="ri-brain-line text-xl"></i>
            Explore All AI Models
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
