import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Study {
  id: string;
  studyId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'Other';
  studyDate: string;
  modality: string;
  bodyPart: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  status: 'pending' | 'in_progress' | 'completed';
  aiFindings: {
    hasFindings: boolean;
    criticalCount: number;
    pathologies: string[];
    maxProbability: number;
  };
  assignedTo?: string;
  createdAt: string;
}

const Worklist: React.FC = () => {
  const navigate = useNavigate();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'urgent' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'ai_score'>('priority');

  useEffect(() => {
    fetchStudies();
    // Poll for new studies every 30 seconds
    const interval = setInterval(fetchStudies, 30000);
    return () => clearInterval(interval);
  }, [filter, sortBy]);

  const fetchStudies = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/radiologist/worklist?filter=${filter}&sortBy=${sortBy}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch studies');

      const data = await response.json();
      setStudies(data.studies || []);
    } catch (error) {
      console.error('Error fetching studies:', error);
      // Mock data for development
      setStudies(generateMockStudies());
    } finally {
      setLoading(false);
    }
  };

  const generateMockStudies = (): Study[] => {
    return [
      {
        id: '1',
        studyId: 'CXR-2026-001234',
        patientId: 'PT-789456',
        patientName: 'Smith, John',
        patientAge: 68,
        patientGender: 'M',
        studyDate: '2026-02-09T08:30:00Z',
        modality: 'CR',
        bodyPart: 'CHEST',
        priority: 'STAT',
        status: 'pending',
        aiFindings: {
          hasFindings: true,
          criticalCount: 2,
          pathologies: ['Pneumothorax', 'Infiltration'],
          maxProbability: 0.89,
        },
        createdAt: '2026-02-09T08:35:00Z',
      },
      {
        id: '2',
        studyId: 'CXR-2026-001235',
        patientId: 'PT-123789',
        patientName: 'Johnson, Mary',
        patientAge: 54,
        patientGender: 'F',
        studyDate: '2026-02-09T09:15:00Z',
        modality: 'CR',
        bodyPart: 'CHEST',
        priority: 'URGENT',
        status: 'pending',
        aiFindings: {
          hasFindings: true,
          criticalCount: 1,
          pathologies: ['Pneumonia', 'Pleural_Thickening'],
          maxProbability: 0.76,
        },
        createdAt: '2026-02-09T09:20:00Z',
      },
      {
        id: '3',
        studyId: 'CXR-2026-001236',
        patientId: 'PT-456123',
        patientName: 'Williams, Robert',
        patientAge: 42,
        patientGender: 'M',
        studyDate: '2026-02-09T10:00:00Z',
        modality: 'CR',
        bodyPart: 'CHEST',
        priority: 'ROUTINE',
        status: 'pending',
        aiFindings: {
          hasFindings: true,
          criticalCount: 0,
          pathologies: ['Cardiomegaly'],
          maxProbability: 0.62,
        },
        createdAt: '2026-02-09T10:05:00Z',
      },
      {
        id: '4',
        studyId: 'CXR-2026-001237',
        patientId: 'PT-987654',
        patientName: 'Davis, Patricia',
        patientAge: 71,
        patientGender: 'F',
        studyDate: '2026-02-09T10:30:00Z',
        modality: 'CR',
        bodyPart: 'CHEST',
        priority: 'ROUTINE',
        status: 'pending',
        aiFindings: {
          hasFindings: false,
          criticalCount: 0,
          pathologies: [],
          maxProbability: 0.12,
        },
        createdAt: '2026-02-09T10:35:00Z',
      },
    ];
  };

  const openStudy = (study: Study) => {
    navigate(`/radiologist/viewer/${study.studyId}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'STAT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'URGENT':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ROUTINE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAIFindingsBadge = (aiFindings: Study['aiFindings']) => {
    if (!aiFindings.hasFindings) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">
          No Findings
        </span>
      );
    }

    if (aiFindings.criticalCount > 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded animate-pulse">
          ⚠️ {aiFindings.criticalCount} Critical
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
        {aiFindings.pathologies.length} Finding{aiFindings.pathologies.length > 1 ? 's' : ''}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading worklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chest X-Ray Worklist</h1>
              <p className="mt-1 text-sm text-gray-500">
                {studies.length} pending studies • Last updated {new Date().toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Filter Dropdown */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Studies</option>
                <option value="pending">Pending Only</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical Findings</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="priority">Sort by Priority</option>
                <option value="date">Sort by Date</option>
                <option value="ai_score">Sort by AI Score</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchStudies}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Worklist Table */}
      <div className="px-6 py-6">
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Study ID
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Patient
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Study Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  AI Findings
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Pathologies
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Confidence
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No studies in worklist</p>
                      <p className="mt-1 text-sm">All caught up! New studies will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                studies.map((study) => (
                  <tr
                    key={study.id}
                    onClick={() => openStudy(study)}
                    className="transition-colors cursor-pointer hover:bg-blue-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold border rounded ${getPriorityColor(study.priority)}`}>
                        {study.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{study.studyId}</div>
                      <div className="text-xs text-gray-500">{study.modality} • {study.bodyPart}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{study.patientName}</div>
                      <div className="text-xs text-gray-500">
                        {study.patientAge}y • {study.patientGender} • {study.patientId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(study.studyDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAIFindingsBadge(study.aiFindings)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {study.aiFindings.pathologies.slice(0, 2).map((pathology) => (
                          <span
                            key={pathology}
                            className="inline-flex px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded"
                          >
                            {pathology}
                          </span>
                        ))}
                        {study.aiFindings.pathologies.length > 2 && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                            +{study.aiFindings.pathologies.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 h-2 mr-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              study.aiFindings.maxProbability > 0.7 ? 'bg-red-500' :
                              study.aiFindings.maxProbability > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${study.aiFindings.maxProbability * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">
                          {Math.round(study.aiFindings.maxProbability * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openStudy(study);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Open Viewer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              {studies.filter(s => s.priority === 'STAT').length}
            </div>
            <div className="text-sm text-gray-500">STAT Priority</div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              {studies.filter(s => s.aiFindings.criticalCount > 0).length}
            </div>
            <div className="text-sm text-gray-500">Critical Findings</div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              {studies.filter(s => s.aiFindings.hasFindings).length}
            </div>
            <div className="text-sm text-gray-500">AI Findings Detected</div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(studies.reduce((acc, s) => acc + s.aiFindings.maxProbability, 0) / studies.length * 100) || 0}%
            </div>
            <div className="text-sm text-gray-500">Avg AI Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Worklist;
