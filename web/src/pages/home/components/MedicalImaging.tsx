import { useState } from 'react';

export default function MedicalImaging() {
  const [activeTab, setActiveTab] = useState('xray');

  const imagingTypes = [
    {
      id: 'xray',
      name: 'X-Ray Analysis',
      icon: 'ri-scan-line',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'mri',
      name: 'MRI Scan',
      icon: 'ri-brain-line',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'ct',
      name: 'CT Scan',
      icon: 'ri-body-scan-line',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const capabilities = [
    {
      icon: 'ri-lungs-line',
      title: 'Chest X-Ray Analysis',
      description: 'Detect pneumonia, tuberculosis, lung cancer, and 14+ thoracic conditions',
      accuracy: '96.8%'
    },
    {
      icon: 'ri-brain-line',
      title: 'Brain MRI Analysis',
      description: 'Identify tumors, strokes, aneurysms, and neurological abnormalities',
      accuracy: '94.2%'
    },
    {
      icon: 'ri-bone-line',
      title: 'Bone Fracture Detection',
      description: 'Automated fracture detection and classification across all bone types',
      accuracy: '97.5%'
    },
    {
      icon: 'ri-heart-line',
      title: 'Cardiac Imaging',
      description: 'Analyze heart structure, detect blockages, and assess cardiac function',
      accuracy: '93.7%'
    },
    {
      icon: 'ri-eye-line',
      title: 'Retinal Imaging',
      description: 'Screen for diabetic retinopathy, glaucoma, and macular degeneration',
      accuracy: '95.3%'
    },
    {
      icon: 'ri-microscope-line',
      title: 'Pathology Analysis',
      description: 'Digital pathology for cancer detection and tissue analysis',
      accuracy: '98.1%'
    }
  ];

  const features = [
    {
      icon: 'ri-time-line',
      title: 'Instant Results',
      value: '&lt;60 seconds',
      description: 'Get AI analysis results in under a minute'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'FDA Cleared',
      value: '15+ Models',
      description: 'Clinically validated and regulatory approved'
    },
    {
      icon: 'ri-team-line',
      title: 'Radiologist Review',
      value: '100%',
      description: 'All AI findings reviewed by certified radiologists'
    },
    {
      icon: 'ri-file-list-line',
      title: 'Detailed Reports',
      value: 'Comprehensive',
      description: 'Full diagnostic reports with annotations'
    }
  ];

  return (
    <section id="medical-imaging" className="py-24 bg-white">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-6">
            <i className="ri-image-line text-purple-600"></i>
            <span className="text-sm font-semibold text-purple-600">AI Medical Imaging</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Advanced Medical Image Analysis
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            State-of-the-art AI analyzes X-rays, MRIs, and CT scans with radiologist-level accuracy. Upload your medical images for instant, detailed analysis.
          </p>
        </div>

        {/* Imaging Type Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          {imagingTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveTab(type.id)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === type.id
                  ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg scale-105`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className={`${type.icon} text-lg`}></i>
              {type.name}
            </button>
          ))}
        </div>

        {/* Demo Upload Area */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-3xl p-8 border-2 border-dashed border-slate-300 hover:border-purple-400 transition-all cursor-pointer">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <i className="ri-upload-cloud-line text-white text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Upload Medical Image</h3>
              <p className="text-slate-600 mb-6">
                Drag and drop your X-ray, MRI, or CT scan image here, or click to browse
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <i className="ri-check-line text-green-600"></i>
                  DICOM supported
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-check-line text-green-600"></i>
                  HIPAA compliant
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-check-line text-green-600"></i>
                  Encrypted transfer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-10">
            Comprehensive Imaging Capabilities
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <i className={`${capability.icon} text-white text-2xl`}></i>
                  </div>
                  <div className="px-3 py-1 bg-green-50 rounded-full">
                    <span className="text-xs font-semibold text-green-600">{capability.accuracy}</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{capability.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{capability.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Bar */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <i className={`${feature.icon} text-white text-2xl`}></i>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-1">
                {feature.value}
              </div>
              <div className="font-semibold text-slate-900 mb-2 text-sm">{feature.title}</div>
              <div className="text-xs text-slate-600">{feature.description}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto whitespace-nowrap cursor-pointer">
            <i className="ri-image-add-line text-xl"></i>
            Start Image Analysis
            <i className="ri-arrow-right-line"></i>
          </button>
          <p className="text-sm text-slate-500 mt-4">
            Free trial includes 3 image analyses • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
