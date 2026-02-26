
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { revolutionaryService } from '../../services/api';

const bodySystems = [
  { name: 'Cardiovascular', score: 87, icon: 'ri-heart-pulse-line', color: 'from-red-500 to-pink-500', status: 'Excellent' },
  { name: 'Metabolic', score: 82, icon: 'ri-flashlight-line', color: 'from-orange-500 to-amber-500', status: 'Good' },
  { name: 'Neurological', score: 91, icon: 'ri-brain-line', color: 'from-purple-500 to-indigo-500', status: 'Excellent' },
  { name: 'Respiratory', score: 78, icon: 'ri-lungs-line', color: 'from-cyan-500 to-blue-500', status: 'Good' },
  { name: 'Immune', score: 85, icon: 'ri-shield-cross-line', color: 'from-green-500 to-emerald-500', status: 'Excellent' },
  { name: 'Musculoskeletal', score: 74, icon: 'ri-run-line', color: 'from-teal-500 to-cyan-500', status: 'Fair' },
];

const radarData = bodySystems.map(sys => ({ subject: sys.name, score: sys.score, fullMark: 100 }));

const treatmentPredictions = [
  { treatment: 'Cardiovascular Medication', successRate: 89, improvement: '+12%', duration: '3 months' },
  { treatment: 'Metabolic Optimization', successRate: 85, improvement: '+8%', duration: '6 months' },
  { treatment: 'Cognitive Enhancement', successRate: 78, improvement: '+15%', duration: '4 months' },
];

const simulations = [
  { icon: 'ri-run-line', label: 'Add Exercise', impact: '+5 years', color: 'from-green-500 to-emerald-500' },
  { icon: 'ri-restaurant-line', label: 'Change Diet', impact: '+3 years', color: 'from-orange-500 to-amber-500' },
  { icon: 'ri-medicine-bottle-line', label: 'Add Medication', impact: '+2 years', color: 'from-blue-500 to-cyan-500' },
  { icon: 'ri-mental-health-line', label: 'Reduce Stress', impact: '+4 years', color: 'from-purple-500 to-pink-500' },
];

export default function VirtualHealthTwin() {
  const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null);
  const [twinData, setTwinData] = useState<{ biologicalAge?: number; chronologicalAge?: number; yearsDiff?: number } | null>(null);
  const [systems, setSystems] = useState(bodySystems);
  const [predictions, setPredictions] = useState(treatmentPredictions);

  useEffect(() => {
    Promise.all([
      revolutionaryService.getTwin().catch(() => null),
      revolutionaryService.getTwinPredictions().catch(() => null),
    ]).then(([twinRes, predictRes]) => {
      if (twinRes?.data) {
        const d = twinRes.data?.data || twinRes.data;
        if (d) setTwinData(d);
        if (d?.bodySystems && Array.isArray(d.bodySystems)) setSystems(d.bodySystems);
      }
      if (predictRes?.data) {
        const p = predictRes.data?.predictions || predictRes.data?.data || predictRes.data;
        if (Array.isArray(p) && p.length > 0) setPredictions(p);
      }
    });
  }, []);

  const bioAge = twinData?.biologicalAge ?? 32;
  const chronoAge = twinData?.chronologicalAge ?? 38;
  const yearsDiff = twinData?.yearsDiff ?? (chronoAge - bioAge);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                $150M Feature
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Virtual Health Twin
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl">
              Your digital biological simulation for testing treatment scenarios and predicting outcomes before implementation
            </p>
          </div>

          {/* Biological Age Card */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <p className="text-purple-100 text-sm font-semibold mb-2">YOUR BIOLOGICAL AGE</p>
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-bold">{bioAge}</span>
                  <span className="text-2xl text-purple-200">years</span>
                </div>
                <p className="text-purple-100 mt-2">Chronological Age: {chronoAge} years</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <i className="ri-trophy-line text-5xl mb-2"></i>
                <p className="text-sm font-semibold">{yearsDiff} Years Younger</p>
                <p className="text-xs text-purple-200 mt-1">Than Chronological Age</p>
              </div>
            </div>
          </div>

          {/* Body Systems Dashboard */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Systems Grid */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Body Systems Health</h2>
              <div className="space-y-4">
                {systems.map((system, index) => (
                  <div key={index} className="group hover:bg-slate-50 rounded-xl p-4 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${system.color} flex items-center justify-center`}>
                          <i className={`${system.icon} text-white text-xl`}></i>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{system.name}</h3>
                          <p className="text-sm text-slate-600">{system.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{system.score}</p>
                        <p className="text-xs text-slate-500">/100</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${system.color}`}
                        style={{ width: `${system.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Health Profile Overview</h2>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Radar name="Health Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Treatment Predictions */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Treatment Predictions</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {predictions.map((treatment, index) => (
                <div key={index} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="font-bold text-slate-900 mb-4">{treatment.treatment}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Success Probability</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{ width: `${treatment.successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{treatment.successRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Expected Improvement</span>
                      <span className="text-sm font-bold text-green-600">{treatment.improvement}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Duration</span>
                      <span className="text-sm font-bold text-slate-900">{treatment.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What-If Simulations */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">What-If Simulations</h2>
            <p className="text-slate-600 mb-6">Test different interventions to see their predicted impact on your health</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {simulations.map((sim, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSimulation(sim.label)}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer ${
                    selectedSimulation === sim.label
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${sim.color} flex items-center justify-center mb-3 mx-auto`}>
                    <i className={`${sim.icon} text-white text-2xl`}></i>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 text-center">{sim.label}</h3>
                  <p className="text-sm text-green-600 font-semibold text-center">{sim.impact}</p>
                </button>
              ))}
            </div>

            {selectedSimulation && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <i className="ri-information-line text-purple-600 text-xl"></i>
                  <h3 className="font-bold text-slate-900">Simulation Results: {selectedSimulation}</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-1">Biological Age Impact</p>
                    <p className="text-2xl font-bold text-green-600">-2.5 years</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-1">Overall Health Score</p>
                    <p className="text-2xl font-bold text-purple-600">+8 points</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-1">Implementation Time</p>
                    <p className="text-2xl font-bold text-slate-900">6 months</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
