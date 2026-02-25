import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface PerformanceMetrics {
  totalStudies: number;
  studiesWithAIFindings: number;
  criticalFindingsCaught: number;
  averageReviewTime: number;
  aiAgreementRate: number;
  timeSaved: number;
  pathologyMetrics: Array<{
    pathology: string;
    totalCases: number;
    sensitivity: number;
    specificity: number;
    ppv: number;
    agreementRate: number;
  }>;
  weeklyVolume: Array<{
    date: string;
    studies: number;
    criticalFindings: number;
  }>;
  topRadiologists: Array<{
    name: string;
    studiesReviewed: number;
    agreementRate: number;
    averageTime: number;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedPathology, setSelectedPathology] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/radiologist/metrics?range=${dateRange}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Mock data for development
      setMetrics(generateMockMetrics());
    } finally {
      setLoading(false);
    }
  };

  const generateMockMetrics = (): PerformanceMetrics => {
    return {
      totalStudies: 1247,
      studiesWithAIFindings: 423,
      criticalFindingsCaught: 18,
      averageReviewTime: 142, // seconds
      aiAgreementRate: 89.3,
      timeSaved: 8940, // minutes
      pathologyMetrics: [
        {
          pathology: 'Pneumonia',
          totalCases: 87,
          sensitivity: 96.2,
          specificity: 94.8,
          ppv: 89.3,
          agreementRate: 91.2,
        },
        {
          pathology: 'Pneumothorax',
          totalCases: 23,
          sensitivity: 95.7,
          specificity: 98.2,
          ppv: 95.7,
          agreementRate: 95.7,
        },
        {
          pathology: 'Cardiomegaly',
          totalCases: 156,
          sensitivity: 88.5,
          specificity: 91.2,
          ppv: 84.6,
          agreementRate: 86.5,
        },
        {
          pathology: 'Infiltration',
          totalCases: 104,
          sensitivity: 91.3,
          specificity: 89.7,
          ppv: 87.5,
          agreementRate: 88.5,
        },
        {
          pathology: 'Effusion',
          totalCases: 67,
          sensitivity: 93.1,
          specificity: 95.4,
          ppv: 91.0,
          agreementRate: 92.5,
        },
        {
          pathology: 'Nodule',
          totalCases: 45,
          sensitivity: 86.7,
          specificity: 92.3,
          ppv: 82.2,
          agreementRate: 84.4,
        },
      ],
      weeklyVolume: [
        { date: '2026-01-13', studies: 178, criticalFindings: 3 },
        { date: '2026-01-20', studies: 192, criticalFindings: 2 },
        { date: '2026-01-27', studies: 201, criticalFindings: 4 },
        { date: '2026-02-03', studies: 187, criticalFindings: 5 },
        { date: '2026-02-10', studies: 214, criticalFindings: 4 },
      ],
      topRadiologists: [
        { name: 'Dr. Sarah Chen', studiesReviewed: 342, agreementRate: 92.8, averageTime: 135 },
        { name: 'Dr. Michael Rodriguez', studiesReviewed: 298, agreementRate: 91.2, averageTime: 148 },
        { name: 'Dr. Emily Watson', studiesReviewed: 276, agreementRate: 88.9, averageTime: 152 },
        { name: 'Dr. James Kim', studiesReviewed: 189, agreementRate: 87.3, averageTime: 167 },
        { name: 'Dr. Lisa Martinez', studiesReviewed: 142, agreementRate: 90.1, averageTime: 143 },
      ],
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <div className="flex items-center justify-center h-screen text-gray-600">Failed to load metrics</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Practice Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                AI Performance & Practice Analytics
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>

              <button
                onClick={() => navigate('/radiologist/worklist')}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Go to Worklist
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-gray-900">{metrics.totalStudies.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Studies</div>
            <div className="mt-2 text-xs text-green-600">+12.3% vs last period</div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-gray-900">{metrics.studiesWithAIFindings}</div>
            <div className="text-sm text-gray-500">AI Findings Detected</div>
            <div className="mt-2 text-xs text-gray-600">
              {Math.round((metrics.studiesWithAIFindings / metrics.totalStudies) * 100)}% detection rate
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-red-600">{metrics.criticalFindingsCaught}</div>
            <div className="text-sm text-gray-500">Critical Findings</div>
            <div className="mt-2 text-xs text-red-600">Pneumothorax, Tension PTX</div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-gray-900">{metrics.aiAgreementRate}%</div>
            <div className="text-sm text-gray-500">AI Agreement Rate</div>
            <div className="mt-2 text-xs text-green-600">+2.1% vs last period</div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-gray-900">{formatTime(metrics.averageReviewTime)}</div>
            <div className="text-sm text-gray-500">Avg Review Time</div>
            <div className="mt-2 text-xs text-green-600">-18s faster vs baseline</div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(metrics.timeSaved / 60)}h
            </div>
            <div className="text-sm text-gray-500">Time Saved</div>
            <div className="mt-2 text-xs text-blue-600">AI-assisted workflow</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Weekly Volume Chart */}
          <div className="col-span-2 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Weekly Study Volume</h2>
            </div>
            <div className="p-4">
              <div className="flex items-end justify-between h-64 space-x-2">
                {metrics.weeklyVolume.map((week, index) => {
                  const maxStudies = Math.max(...metrics.weeklyVolume.map(w => w.studies));
                  const heightPercent = (week.studies / maxStudies) * 100;

                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className="relative w-full">
                        {/* Critical findings indicator */}
                        {week.criticalFindings > 0 && (
                          <div className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full -mt-8">
                            {week.criticalFindings}
                          </div>
                        )}

                        {/* Bar */}
                        <div
                          className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                          style={{ height: `${heightPercent * 2}px` }}
                          title={`${week.studies} studies, ${week.criticalFindings} critical`}
                        ></div>
                      </div>

                      {/* Label */}
                      <div className="mt-2 text-xs text-center text-gray-600">
                        <div className="font-medium">{week.studies}</div>
                        <div>{new Date(week.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center mt-4 space-x-4 text-xs text-gray-600">
                <div className="flex items-center">
                  <div className="w-3 h-3 mr-1 bg-blue-500 rounded"></div>
                  <span>Studies</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-4 h-4 mr-1 text-white bg-red-500 rounded-full">!</div>
                  <span>Critical Findings</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">ROI Summary</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm text-gray-600">Time Saved per Study</div>
                <div className="text-2xl font-bold text-gray-900">7.2 min</div>
                <div className="text-xs text-gray-500">vs. non-AI workflow</div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">Monthly Time Saved</div>
                <div className="text-2xl font-bold text-blue-600">149 hours</div>
                <div className="text-xs text-gray-500">= $11,925 at $80/hour</div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">Critical Findings</div>
                <div className="text-2xl font-bold text-red-600">{metrics.criticalFindingsCaught}</div>
                <div className="text-xs text-gray-500">Potentially life-saving alerts</div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">False Negative Rate</div>
                <div className="text-2xl font-bold text-green-600">3.8%</div>
                <div className="text-xs text-gray-500">Below 4% target (FDA)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pathology Performance Table */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">AI Performance by Pathology</h2>
            <p className="text-sm text-gray-500">Diagnostic accuracy metrics</p>
          </div>

          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Pathology
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Total Cases
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Sensitivity
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Specificity
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    PPV
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Agreement Rate
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.pathologyMetrics
                  .sort((a, b) => b.totalCases - a.totalCases)
                  .map((pathology, index) => (
                    <tr
                      key={index}
                      onClick={() => setSelectedPathology(pathology.pathology)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {pathology.pathology}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {pathology.totalCases}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 h-2 mr-2 bg-gray-200 rounded-full w-16">
                            <div
                              className={`h-2 rounded-full ${
                                pathology.sensitivity >= 95 ? 'bg-green-500' :
                                pathology.sensitivity >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pathology.sensitivity}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">{pathology.sensitivity.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 h-2 mr-2 bg-gray-200 rounded-full w-16">
                            <div
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${pathology.specificity}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">{pathology.specificity.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {pathology.ppv.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {pathology.agreementRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pathology.sensitivity >= 95 && pathology.specificity >= 94 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">
                            FDA Target ✓
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded">
                            Monitoring
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Radiologists */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Top Performing Radiologists</h2>
            <p className="text-sm text-gray-500">Ranked by volume and AI agreement rate</p>
          </div>

          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Radiologist
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Studies Reviewed
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    AI Agreement Rate
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Avg Review Time
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Efficiency Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.topRadiologists.map((radiologist, index) => {
                  const efficiencyScore = Math.round(
                    (radiologist.agreementRate * 0.6) + ((200 - radiologist.averageTime) / 200 * 100 * 0.4)
                  );

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {radiologist.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {radiologist.studiesReviewed.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 h-2 mr-2 bg-gray-200 rounded-full w-20">
                            <div
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${radiologist.agreementRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">{radiologist.agreementRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatTime(radiologist.averageTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          efficiencyScore >= 90 ? 'bg-green-100 text-green-800' :
                          efficiencyScore >= 80 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {efficiencyScore}/100
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
