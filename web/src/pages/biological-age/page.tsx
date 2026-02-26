
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { revolutionaryService } from '../../services/api';

const agingHallmarks = [
  { category: 'Primary', name: 'Genomic Instability', score: 82, icon: 'ri-dna-line', color: 'from-red-500 to-pink-500' },
  { category: 'Primary', name: 'Telomere Attrition', score: 78, icon: 'ri-links-line', color: 'from-orange-500 to-amber-500' },
  { category: 'Primary', name: 'Epigenetic Alterations', score: 85, icon: 'ri-file-code-line', color: 'from-yellow-500 to-orange-500' },
  { category: 'Primary', name: 'Loss of Proteostasis', score: 80, icon: 'ri-recycle-line', color: 'from-green-500 to-emerald-500' },
  { category: 'Antagonistic', name: 'Deregulated Nutrient Sensing', score: 88, icon: 'ri-restaurant-line', color: 'from-teal-500 to-cyan-500' },
  { category: 'Antagonistic', name: 'Mitochondrial Dysfunction', score: 76, icon: 'ri-flashlight-line', color: 'from-cyan-500 to-blue-500' },
  { category: 'Antagonistic', name: 'Cellular Senescence', score: 84, icon: 'ri-time-line', color: 'from-blue-500 to-indigo-500' },
  { category: 'Integrative', name: 'Stem Cell Exhaustion', score: 79, icon: 'ri-heart-pulse-line', color: 'from-purple-500 to-pink-500' },
  { category: 'Integrative', name: 'Altered Intercellular Communication', score: 86, icon: 'ri-signal-tower-line', color: 'from-pink-500 to-rose-500' },
];

const therapies = [
  { name: 'Senolytics', description: 'Remove senescent cells', effectiveness: 92, cost: '$$$', icon: 'ri-delete-bin-line' },
  { name: 'NAD+ Boosters', description: 'Enhance cellular energy', effectiveness: 88, cost: '$$', icon: 'ri-battery-charge-line' },
  { name: 'Rapamycin', description: 'mTOR pathway modulation', effectiveness: 85, cost: '$$', icon: 'ri-medicine-bottle-line' },
  { name: 'Young Plasma', description: 'Rejuvenation factors', effectiveness: 78, cost: '$$$$', icon: 'ri-drop-line' },
];

const agingPaceData = [
  { age: 25, biological: 25, chronological: 25 },
  { age: 30, biological: 29, chronological: 30 },
  { age: 35, biological: 32, chronological: 35 },
  { age: 38, biological: 32, chronological: 38 },
  { age: 40, biological: 34, chronological: 40 },
  { age: 45, biological: 38, chronological: 45 },
];

export default function BiologicalAge() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('Horvath Clock');
  const [bioAgeData, setBioAgeData] = useState<{ biologicalAge?: number; chronologicalAge?: number; agingPace?: number; percentile?: number; predictedLifespan?: number } | null>(null);

  const algorithms = ['Horvath Clock', 'Hannum Clock', 'PhenoAge', 'GrimAge'];

  useEffect(() => {
    revolutionaryService.getBiologicalAge()
      .then((res) => {
        const d = res.data?.data || res.data;
        if (d) setBioAgeData(d);
      })
      .catch(() => {/* use mock values */});
  }, []);

  const biologicalAge = bioAgeData?.biologicalAge ?? 32;
  const chronologicalAge = bioAgeData?.chronologicalAge ?? 38;
  const agingPace = bioAgeData?.agingPace ?? 0.82;
  const predictedLifespan = bioAgeData?.predictedLifespan ?? 94;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-semibold text-orange-600 uppercase tracking-wider">
                $120M Feature
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Biological Age Calculator
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl">
              Advanced longevity optimization platform using 4 calculation algorithms for maximum accuracy
            </p>
          </div>

          {/* Main Age Display */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Age Comparison */}
            <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-3xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-8">Your Biological Age</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <p className="text-orange-100 text-sm font-semibold mb-2">BIOLOGICAL AGE</p>
                  <p className="text-6xl font-bold mb-2">{biologicalAge}</p>
                  <p className="text-orange-100">years</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <p className="text-orange-100 text-sm font-semibold mb-2">CHRONOLOGICAL AGE</p>
                  <p className="text-6xl font-bold mb-2">{chronologicalAge}</p>
                  <p className="text-orange-100">years</p>
                </div>
              </div>
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-100 mb-1">AGING PACE</p>
                    <p className="text-3xl font-bold">{agingPace}</p>
                    <p className="text-sm text-orange-100">years per year</p>
                  </div>
                  <div className="text-center">
                    <i className="ri-trophy-line text-5xl mb-2"></i>
                    <p className="text-sm font-semibold">Top 15%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifespan Prediction */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Lifespan Prediction</h2>
              <div className="text-center mb-6">
                <p className="text-slate-600 mb-2">Predicted Lifespan</p>
                <p className="text-6xl font-bold text-slate-900 mb-2">{predictedLifespan}</p>
                <p className="text-slate-600">years</p>
                <div className="mt-4 bg-slate-100 rounded-lg p-3">
                  <p className="text-sm text-slate-600">Confidence Interval: 89-98 years</p>
                </div>
              </div>
              
              {/* Algorithm Selector */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Calculation Algorithm</p>
                <div className="grid grid-cols-2 gap-2">
                  {algorithms.map((algo) => (
                    <button
                      key={algo}
                      onClick={() => setSelectedAlgorithm(algo)}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
                        selectedAlgorithm === algo
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {algo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Aging Pace Chart */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Aging Trajectory</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={agingPaceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="age" tick={{ fontSize: 12 }} stroke="#64748b" label={{ value: 'Chronological Age', position: 'insideBottom', offset: -5 }} />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" label={{ value: 'Age (years)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="chronological" stroke="#94a3b8" strokeWidth={2} name="Chronological Age" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="biological" stroke="#f97316" strokeWidth={3} name="Biological Age" dot={{ fill: '#f97316', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 12 Hallmarks of Aging */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">12 Hallmarks of Aging Assessment</h2>
            <div className="space-y-6">
              {['Primary', 'Antagonistic', 'Integrative'].map((category) => (
                <div key={category}>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">{category} Hallmarks</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agingHallmarks.filter(h => h.category === category).map((hallmark, index) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${hallmark.color} flex items-center justify-center`}>
                            <i className={`${hallmark.icon} text-white text-lg`}></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-sm">{hallmark.name}</h4>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 mr-3">
                            <div 
                              className={`h-2 rounded-full bg-gradient-to-r ${hallmark.color}`}
                              style={{ width: `${hallmark.score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{hallmark.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cutting-Edge Therapies */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Cutting-Edge Longevity Therapies</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {therapies.map((therapy, index) => (
                <div key={index} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                        <i className={`${therapy.icon} text-white text-xl`}></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{therapy.name}</h3>
                        <p className="text-sm text-slate-600">{therapy.description}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full whitespace-nowrap">
                      {therapy.cost}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Effectiveness</span>
                      <span className="text-sm font-bold text-slate-900">{therapy.effectiveness}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${therapy.effectiveness}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
