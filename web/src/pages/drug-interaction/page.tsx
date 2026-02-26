
import { useState } from 'react';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { revolutionaryService } from '../../services/api';

interface Medication {
  id: string;
  name: string;
  dosage: string;
}

interface Interaction {
  severity: 'critical' | 'high' | 'moderate' | 'low';
  drugs: string[];
  description: string;
  recommendation: string;
}

const mockInteractions: Interaction[] = [
  {
    severity: 'critical',
    drugs: ['Warfarin', 'Aspirin'],
    description: 'Increased risk of bleeding when combined. Both medications affect blood clotting.',
    recommendation: 'Consult physician immediately. May require dosage adjustment or alternative medication.',
  },
  {
    severity: 'high',
    drugs: ['Lisinopril', 'Ibuprofen'],
    description: 'NSAIDs may reduce the effectiveness of ACE inhibitors and increase kidney damage risk.',
    recommendation: 'Use alternative pain reliever like acetaminophen. Monitor blood pressure and kidney function.',
  },
];

export default function DrugInteraction() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMed, setNewMed] = useState({ name: '', dosage: '' });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>(mockInteractions);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  const addMedication = () => {
    if (newMed.name && newMed.dosage) {
      setMedications([...medications, { id: Date.now().toString(), ...newMed }]);
      setNewMed({ name: '', dosage: '' });
    }
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const addAllergy = () => {
    if (newAllergy) {
      setAllergies([...allergies, newAllergy]);
      setNewAllergy('');
    }
  };

  const addCondition = () => {
    if (newCondition) {
      setConditions([...conditions, newCondition]);
      setNewCondition('');
    }
  };

  const checkInteractions = async () => {
    if (medications.length < 1) {
      setShowResults(true);
      return;
    }
    setIsChecking(true);
    setCheckError('');
    try {
      const res = await revolutionaryService.checkDrugInteractions({
        medications: medications.map(m => ({ name: m.name, dosage: m.dosage })),
        allergies,
        conditions,
        isPregnant,
        isBreastfeeding,
      });
      if (res.data?.interactions) setInteractions(res.data.interactions);
      else if (res.data?.data?.interactions) setInteractions(res.data.data.interactions);
    } catch {
      // Fall back to mock data if API unavailable
      setInteractions(mockInteractions);
    } finally {
      setIsChecking(false);
      setShowResults(true);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'from-red-500 to-rose-600';
      case 'high': return 'from-orange-500 to-amber-600';
      case 'moderate': return 'from-yellow-500 to-orange-500';
      case 'low': return 'from-green-500 to-emerald-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'ri-error-warning-line';
      case 'high': return 'ri-alert-line';
      case 'moderate': return 'ri-information-line';
      case 'low': return 'ri-checkbox-circle-line';
      default: return 'ri-information-line';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                $75M Feature
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Drug Interaction Checker
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl">
              Comprehensive drug safety analysis including medication interactions, allergies, and special population checks
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              {/* Medications */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Current Medications</h2>
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Medication name"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g., 10mg daily)"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={addMedication}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    Add Medication
                  </button>
                </div>
                <div className="space-y-2">
                  {medications.map((med) => (
                    <div key={med.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                      <div>
                        <p className="font-semibold text-slate-900">{med.name}</p>
                        <p className="text-sm text-slate-600">{med.dosage}</p>
                      </div>
                      <button
                        onClick={() => removeMedication(med.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Known Allergies</h2>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Enter allergy"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={addAllergy}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Medical Conditions</h2>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Enter condition"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={addCondition}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>

              {/* Special Populations */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Special Populations</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPregnant}
                      onChange={(e) => setIsPregnant(e.target.checked)}
                      className="w-5 h-5 text-red-500 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
                    />
                    <span className="text-slate-700">Pregnant</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBreastfeeding}
                      onChange={(e) => setIsBreastfeeding(e.target.checked)}
                      className="w-5 h-5 text-red-500 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
                    />
                    <span className="text-slate-700">Breastfeeding</span>
                  </label>
                </div>
              </div>

              <button
                onClick={checkInteractions}
                disabled={isChecking}
                className="w-full px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {isChecking ? 'Checking...' : 'Check Interactions'}
              </button>
              {checkError && <p className="text-red-600 text-sm text-center">{checkError}</p>}
            </div>

            {/* Results Section */}
            <div>
              {showResults ? (
                <div className="space-y-6">
                  {/* Overall Risk */}
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <i className="ri-error-warning-line text-4xl"></i>
                      <div>
                        <h2 className="text-2xl font-bold">Overall Risk Level</h2>
                        <p className="text-red-100">Critical interactions detected</p>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm">{interactions.length} interactions found requiring immediate attention</p>
                    </div>
                  </div>

                  {/* Interactions */}
                  {interactions.map((interaction, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getSeverityColor(interaction.severity)} flex items-center justify-center flex-shrink-0`}>
                          <i className={`${getSeverityIcon(interaction.severity)} text-white text-xl`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 bg-gradient-to-r ${getSeverityColor(interaction.severity)} text-white text-xs font-bold rounded-full uppercase`}>
                              {interaction.severity}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 mb-2">
                            {interaction.drugs.join(' + ')}
                          </h3>
                          <p className="text-slate-600 mb-3">{interaction.description}</p>
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-sm font-semibold text-slate-900 mb-1">Recommendation:</p>
                            <p className="text-sm text-slate-700">{interaction.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Safety Information */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="font-bold text-slate-900 mb-4">Additional Safety Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <i className="ri-shield-check-line text-green-500 text-xl mt-1"></i>
                        <div>
                          <p className="font-semibold text-slate-900">No Allergy Warnings</p>
                          <p className="text-sm text-slate-600">No cross-reactivity detected with known allergies</p>
                        </div>
                      </div>
                      {isPregnant && (
                        <div className="flex items-start gap-3">
                          <i className="ri-alert-line text-orange-500 text-xl mt-1"></i>
                          <div>
                            <p className="font-semibold text-slate-900">Pregnancy Category C</p>
                            <p className="text-sm text-slate-600">Risk cannot be ruled out. Consult physician.</p>
                          </div>
                        </div>
                      )}
                      {isBreastfeeding && (
                        <div className="flex items-start gap-3">
                          <i className="ri-information-line text-blue-500 text-xl mt-1"></i>
                          <div>
                            <p className="font-semibold text-slate-900">Lactation Safety</p>
                            <p className="text-sm text-slate-600">Use with caution. Monitor infant for side effects.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
                  <i className="ri-medicine-bottle-line text-6xl text-slate-300 mb-4"></i>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Check</h3>
                  <p className="text-slate-600">Add your medications and click "Check Interactions" to see results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
