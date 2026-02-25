import { useState } from 'react';

export default function VoiceAnalysis() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  const handleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setHasRecorded(true);
      }, 3000);
    }
  };

  const biomarkers = [
    {
      name: 'Stress Level',
      value: 32,
      status: 'Low',
      color: 'green',
      icon: 'ri-emotion-happy-line'
    },
    {
      name: 'Vocal Fatigue',
      value: 45,
      status: 'Moderate',
      color: 'yellow',
      icon: 'ri-volume-down-line'
    },
    {
      name: 'Respiratory Health',
      value: 88,
      status: 'Excellent',
      color: 'green',
      icon: 'ri-lungs-line'
    },
    {
      name: 'Emotional State',
      value: 76,
      status: 'Positive',
      color: 'green',
      icon: 'ri-heart-line'
    }
  ];

  const features = [
    {
      icon: 'ri-sound-module-line',
      title: 'Acoustic Analysis',
      description: 'Advanced signal processing extracts 100+ voice features including pitch, jitter, shimmer, and harmonics'
    },
    {
      icon: 'ri-pulse-line',
      title: 'Real-time Processing',
      description: 'Instant analysis with edge computing ensures privacy while delivering immediate health insights'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Clinical Validation',
      description: 'Validated against clinical studies with 89% correlation to traditional diagnostic methods'
    },
    {
      icon: 'ri-time-line',
      title: 'Trend Tracking',
      description: 'Monitor voice biomarkers over time to detect early signs of respiratory or neurological conditions'
    }
  ];

  return (
    <section id="voice-analysis" className="py-24 bg-white">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-6">
              <i className="ri-mic-line text-teal-600"></i>
              <span className="text-sm font-semibold text-teal-600">Voice Biomarker Detection</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Your Voice Reveals Your Health
            </h2>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Advanced AI analyzes subtle patterns in your voice to detect stress, fatigue, respiratory issues, and emotional well-being. Non-invasive health monitoring through the power of your voice.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <i className={`${feature.icon} text-white text-xl`}></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-base rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 whitespace-nowrap cursor-pointer">
              <i className="ri-mic-line text-xl"></i>
              Try Voice Analysis
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>

          {/* Right: Interactive Demo */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50 rounded-3xl p-8 lg:p-12">
            {/* Recording Interface */}
            <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Voice Analysis Demo</h3>
                <p className="text-sm text-slate-600">Record a 10-second sample to analyze your voice biomarkers</p>
              </div>

              {/* Waveform Visualization */}
              <div className="h-32 bg-slate-50 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                {isRecording ? (
                  <div className="flex items-center gap-1">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-teal-500 to-cyan-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 80 + 20}px`,
                          animationDelay: `${i * 0.05}s`
                        }}
                      ></div>
                    ))}
                  </div>
                ) : hasRecorded ? (
                  <div className="flex items-center gap-1">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-slate-300 rounded-full"
                        style={{
                          height: `${Math.random() * 80 + 20}px`
                        }}
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <i className="ri-mic-line text-4xl text-slate-300 mb-2"></i>
                    <p className="text-sm text-slate-400">Click record to start</p>
                  </div>
                )}
              </div>

              {/* Record Button */}
              <button
                onClick={handleRecord}
                disabled={isRecording}
                className={`w-20 h-20 mx-auto flex items-center justify-center rounded-full transition-all ${
                  isRecording
                    ? 'bg-red-500 animate-pulse cursor-not-allowed'
                    : 'bg-gradient-to-br from-teal-500 to-cyan-500 hover:scale-110 cursor-pointer'
                } shadow-2xl`}
              >
                <i className={`${isRecording ? 'ri-stop-fill' : 'ri-mic-fill'} text-white text-3xl`}></i>
              </button>

              {isRecording && (
                <p className="text-center text-sm text-slate-600 mt-4">Recording... Speak naturally</p>
              )}
            </div>

            {/* Results */}
            {hasRecorded && (
              <div className="space-y-4 animate-fadeIn">
                {biomarkers.map((marker, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <i className={`${marker.icon} text-xl text-${marker.color}-600`}></i>
                        <span className="font-semibold text-slate-900 text-sm">{marker.name}</span>
                      </div>
                      <span className={`px-3 py-1 bg-${marker.color}-50 text-${marker.color}-600 text-xs font-semibold rounded-full`}>
                        {marker.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-${marker.color}-400 to-${marker.color}-600 rounded-full transition-all duration-1000`}
                          style={{ width: `${marker.value}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{marker.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
