import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface PathologyFinding {
  pathology: string;
  probability: number;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  clinicalSignificance: string;
}

interface FeedbackData {
  pathology: string;
  agreement: 'agree' | 'disagree' | 'uncertain';
  correctDiagnosis?: string;
  severity?: 'false_positive' | 'false_negative' | 'accurate' | 'severity_mismatch';
  comments?: string;
}

interface StudyData {
  studyId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  studyDate: string;
  findings: PathologyFinding[];
  imageUrl: string;
}

const Feedback: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();

  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
  const [generalComments, setGeneralComments] = useState('');
  const [reviewStartTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [additionalFindings, setAdditionalFindings] = useState<string[]>([]);
  const [newFindingInput, setNewFindingInput] = useState('');

  useEffect(() => {
    fetchStudyData();
  }, [studyId]);

  const fetchStudyData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/radiologist/study/${studyId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch study');

      const data = await response.json();
      setStudyData(data);

      // Initialize feedback for each finding
      setFeedbackList(
        data.findings.map((finding: PathologyFinding) => ({
          pathology: finding.pathology,
          agreement: 'uncertain' as const,
        }))
      );
    } catch (error) {
      console.error('Error fetching study:', error);
      // Mock data for development
      const mockData = generateMockStudy();
      setStudyData(mockData);
      setFeedbackList(
        mockData.findings.map((finding) => ({
          pathology: finding.pathology,
          agreement: 'uncertain' as const,
        }))
      );
    }
  };

  const generateMockStudy = (): StudyData => {
    return {
      studyId: studyId || 'CXR-2026-001234',
      patientId: 'PT-789456',
      patientName: 'Smith, John',
      patientAge: 68,
      patientGender: 'M',
      studyDate: '2026-02-09T08:30:00Z',
      imageUrl: 'https://via.placeholder.com/400x500/1a1a1a/808080?text=Chest+X-Ray',
      findings: [
        {
          pathology: 'Pneumothorax',
          probability: 0.89,
          confidence: 87,
          severity: 'critical',
          clinicalSignificance: 'Possible right-sided pneumothorax. Urgent evaluation recommended.',
        },
        {
          pathology: 'Infiltration',
          probability: 0.76,
          confidence: 73,
          severity: 'high',
          clinicalSignificance: 'Patchy infiltrates in right lower lobe. Consider infectious etiology.',
        },
        {
          pathology: 'Cardiomegaly',
          probability: 0.62,
          confidence: 65,
          severity: 'medium',
          clinicalSignificance: 'Mild cardiomegaly noted. Cardiothoracic ratio approximately 0.52.',
        },
      ],
    };
  };

  const updateFeedback = (index: number, updates: Partial<FeedbackData>) => {
    setFeedbackList(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], ...updates };
      return newList;
    });
  };

  const addAdditionalFinding = () => {
    if (newFindingInput.trim()) {
      setAdditionalFindings(prev => [...prev, newFindingInput.trim()]);
      setNewFindingInput('');
    }
  };

  const removeAdditionalFinding = (index: number) => {
    setAdditionalFindings(prev => prev.filter((_, i) => i !== index));
  };

  const submitFeedback = async () => {
    // Validation: Ensure all findings have feedback
    const incompleteCount = feedbackList.filter(f => f.agreement === 'uncertain').length;

    if (incompleteCount > 0) {
      alert(`Please provide feedback for all ${incompleteCount} remaining finding(s) before submitting.`);
      return;
    }

    setSubmitting(true);

    const reviewTimeMs = Date.now() - reviewStartTime;

    const payload = {
      studyId: studyData?.studyId,
      radiologistId: localStorage.getItem('userId') || 'radiologist-1',
      feedbackList,
      additionalFindings,
      generalComments,
      timeToReview: reviewTimeMs,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/radiologist/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('Failed to submit feedback');

      const result = await response.json();
      console.log('Feedback submitted:', result);

      // Show success message
      alert('Thank you! Your feedback has been submitted and will help improve our AI.');

      // Navigate back to worklist
      navigate('/radiologist/worklist');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getAgreementButtonClass = (currentAgreement: string, buttonType: string) => {
    const isSelected = currentAgreement === buttonType;

    if (buttonType === 'agree') {
      return `px-4 py-2 rounded-lg font-medium transition-colors ${
        isSelected
          ? 'bg-green-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`;
    } else if (buttonType === 'disagree') {
      return `px-4 py-2 rounded-lg font-medium transition-colors ${
        isSelected
          ? 'bg-red-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`;
    } else { // uncertain
      return `px-4 py-2 rounded-lg font-medium transition-colors ${
        isSelected
          ? 'bg-yellow-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`;
    }
  };

  if (!studyData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading study...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Radiologist Feedback</h1>
              <p className="mt-1 text-sm text-gray-500">
                Study: {studyData.studyId} • Patient: {studyData.patientName}
              </p>
            </div>

            <button
              onClick={() => navigate(`/radiologist/viewer/${studyId}`)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ← Back to Viewer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 px-6 py-6">
        {/* Left Column - Image Reference */}
        <div className="col-span-1">
          <div className="sticky bg-white rounded-lg shadow top-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Study Reference</h2>
            </div>
            <div className="p-4">
              <img
                src={studyData.imageUrl}
                alt="Chest X-Ray"
                className="w-full rounded-lg"
              />
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Patient:</span> {studyData.patientName}</p>
                <p><span className="font-medium">Age/Sex:</span> {studyData.patientAge}y / {studyData.patientGender}</p>
                <p><span className="font-medium">Study Date:</span> {new Date(studyData.studyDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Feedback Forms */}
        <div className="col-span-2 space-y-6">
          {/* AI Findings Feedback */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Review AI Findings</h2>
              <p className="text-sm text-gray-500">Please indicate your agreement with each AI finding</p>
            </div>

            <div className="p-4 space-y-4">
              {studyData.findings.map((finding, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{finding.pathology}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityColor(finding.severity)}`}>
                          {finding.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{finding.clinicalSignificance}</p>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <span>Probability: {Math.round(finding.probability * 100)}%</span>
                        <span>Confidence: {finding.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Your Assessment:</label>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => updateFeedback(index, {
                          agreement: 'agree',
                          severity: 'accurate'
                        })}
                        className={getAgreementButtonClass(feedbackList[index]?.agreement, 'agree')}
                      >
                        ✓ Agree
                      </button>
                      <button
                        onClick={() => updateFeedback(index, { agreement: 'uncertain' })}
                        className={getAgreementButtonClass(feedbackList[index]?.agreement, 'uncertain')}
                      >
                        ? Uncertain
                      </button>
                      <button
                        onClick={() => updateFeedback(index, { agreement: 'disagree' })}
                        className={getAgreementButtonClass(feedbackList[index]?.agreement, 'disagree')}
                      >
                        ✗ Disagree
                      </button>
                    </div>
                  </div>

                  {/* Show additional fields if disagreeing */}
                  {feedbackList[index]?.agreement === 'disagree' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Why do you disagree?
                        </label>
                        <select
                          value={feedbackList[index]?.severity || ''}
                          onChange={(e) => updateFeedback(index, {
                            severity: e.target.value as any
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select reason...</option>
                          <option value="false_positive">False Positive (AI found something that's not there)</option>
                          <option value="false_negative">False Negative (AI missed something)</option>
                          <option value="severity_mismatch">Severity Mismatch (Finding exists but severity is wrong)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Correct Diagnosis (if applicable):
                        </label>
                        <input
                          type="text"
                          value={feedbackList[index]?.correctDiagnosis || ''}
                          onChange={(e) => updateFeedback(index, {
                            correctDiagnosis: e.target.value
                          })}
                          placeholder="e.g., Normal findings, or different pathology name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Additional Comments:
                        </label>
                        <textarea
                          value={feedbackList[index]?.comments || ''}
                          onChange={(e) => updateFeedback(index, {
                            comments: e.target.value
                          })}
                          rows={2}
                          placeholder="Explain your reasoning..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Findings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Additional Findings</h2>
              <p className="text-sm text-gray-500">
                Did you identify any findings that the AI missed?
              </p>
            </div>

            <div className="p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFindingInput}
                  onChange={(e) => setNewFindingInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addAdditionalFinding();
                    }
                  }}
                  placeholder="e.g., Pleural effusion, Rib fracture, etc."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addAdditionalFinding}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              {additionalFindings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {additionalFindings.map((finding, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{finding}</span>
                      <button
                        onClick={() => removeAdditionalFinding(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* General Comments */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">General Comments</h2>
              <p className="text-sm text-gray-500">
                Any additional notes or observations about this study or the AI's performance?
              </p>
            </div>

            <div className="p-4">
              <textarea
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                rows={4}
                placeholder="Optional: Share your overall assessment, concerns, or suggestions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div className="text-sm text-gray-600">
              <p>Review Time: {Math.round((Date.now() - reviewStartTime) / 1000)}s</p>
              <p className="mt-1">
                Feedback Status: {feedbackList.filter(f => f.agreement !== 'uncertain').length} / {feedbackList.length} completed
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/radiologist/viewer/${studyId}`)}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={submitting || feedbackList.some(f => f.agreement === 'uncertain')}
                className={`px-6 py-3 rounded-lg font-medium ${
                  submitting || feedbackList.some(f => f.agreement === 'uncertain')
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
