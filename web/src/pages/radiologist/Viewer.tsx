import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface PathologyFinding {
  pathology: string;
  probability: number;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  heatmapUrl?: string;
  clinicalSignificance: string;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface StudyData {
  studyId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  studyDate: string;
  modality: string;
  bodyPart: string;
  imageUrl: string;
  findings: PathologyFinding[];
  urgentFindings: string[];
  overallConfidence: number;
  processingTimeMs: number;
  modelVersion: string;
  priorStudies?: Array<{
    date: string;
    studyId: string;
    comparison: string;
  }>;
}

const Viewer: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();

  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<PathologyFinding | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [imageSettings, setImageSettings] = useState({
    brightness: 100,
    contrast: 100,
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

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
    } catch (error) {
      console.error('Error fetching study:', error);
      // Mock data for development
      setStudyData(generateMockStudy());
    } finally {
      setLoading(false);
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
      modality: 'CR',
      bodyPart: 'CHEST',
      imageUrl: 'https://via.placeholder.com/800x1000/1a1a1a/808080?text=Chest+X-Ray',
      findings: [
        {
          pathology: 'Pneumothorax',
          probability: 0.89,
          confidence: 87,
          severity: 'critical',
          heatmapUrl: 'https://via.placeholder.com/800x1000/ff0000/ffffff?text=Pneumothorax+Region',
          clinicalSignificance: 'Possible right-sided pneumothorax. Urgent evaluation recommended.',
          location: { x: 520, y: 180, width: 200, height: 240 },
        },
        {
          pathology: 'Infiltration',
          probability: 0.76,
          confidence: 73,
          severity: 'high',
          heatmapUrl: 'https://via.placeholder.com/800x1000/ffaa00/ffffff?text=Infiltration+Region',
          clinicalSignificance: 'Patchy infiltrates in right lower lobe. Consider infectious etiology.',
          location: { x: 450, y: 600, width: 180, height: 160 },
        },
        {
          pathology: 'Cardiomegaly',
          probability: 0.62,
          confidence: 65,
          severity: 'medium',
          clinicalSignificance: 'Mild cardiomegaly noted. Cardiothoracic ratio approximately 0.52.',
        },
      ],
      urgentFindings: ['Pneumothorax'],
      overallConfidence: 82,
      processingTimeMs: 847,
      modelVersion: '2.0-FDA',
      priorStudies: [
        {
          date: '2025-08-15',
          studyId: 'CXR-2025-089234',
          comparison: 'Cardiomegaly stable. No prior pneumothorax.',
        },
      ],
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      isDragging.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastMousePosition.current.x;
      const deltaY = e.clientY - lastMousePosition.current.y;

      setImageSettings(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY,
      }));

      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    setImageSettings(prev => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(5, prev.zoom + zoomDelta)),
    }));
  };

  const resetImageSettings = () => {
    setImageSettings({
      brightness: 100,
      contrast: 100,
      zoom: 1,
      panX: 0,
      panY: 0,
    });
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

  const openFeedbackPanel = () => {
    setShowFeedbackPanel(true);
  };

  const submitReport = () => {
    // Navigate to feedback screen
    navigate(`/radiologist/feedback/${studyId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white">Loading study...</p>
        </div>
      </div>
    );
  }

  if (!studyData) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center text-white">
          <p className="text-xl">Study not found</p>
          <button
            onClick={() => navigate('/radiologist/worklist')}
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Worklist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Left Panel - AI Findings */}
      <div className="flex flex-col w-80 bg-gray-900 border-r border-gray-700">
        {/* Study Info */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">{studyData.studyId}</h2>
          <div className="mt-2 space-y-1 text-sm text-gray-300">
            <p><span className="text-gray-400">Patient:</span> {studyData.patientName}</p>
            <p><span className="text-gray-400">Age/Sex:</span> {studyData.patientAge}y / {studyData.patientGender}</p>
            <p><span className="text-gray-400">Study:</span> {studyData.modality} {studyData.bodyPart}</p>
            <p><span className="text-gray-400">Date:</span> {new Date(studyData.studyDate).toLocaleString()}</p>
          </div>

          {/* Urgent Alert */}
          {studyData.urgentFindings.length > 0 && (
            <div className="p-3 mt-4 bg-red-900 border border-red-700 rounded-lg animate-pulse">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-red-200">
                  {studyData.urgentFindings.length} Critical Finding{studyData.urgentFindings.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="mt-1 text-xs text-red-300">
                {studyData.urgentFindings.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* AI Findings List */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">AI Findings ({studyData.findings.length})</h3>
            <span className="text-xs text-gray-400">
              Confidence: {studyData.overallConfidence}%
            </span>
          </div>

          <div className="space-y-3">
            {studyData.findings.map((finding, index) => (
              <div
                key={index}
                onClick={() => setSelectedFinding(finding)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedFinding?.pathology === finding.pathology
                    ? 'bg-blue-900 border-blue-600'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-white">{finding.pathology}</span>
                      {finding.severity === 'critical' && (
                        <span className="ml-2 text-red-400">⚠️</span>
                      )}
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityColor(finding.severity)}`}>
                        {finding.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round(finding.probability * 100)}% probability
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-xs text-gray-300">
                  {finding.clinicalSignificance}
                </p>

                {/* Confidence Bar */}
                <div className="flex items-center mt-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
                    <div
                      className={`h-1.5 rounded-full ${
                        finding.confidence > 80 ? 'bg-green-500' :
                        finding.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${finding.confidence}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-400">{finding.confidence}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Prior Studies */}
          {studyData.priorStudies && studyData.priorStudies.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 font-semibold text-white">Prior Studies</h3>
              <div className="space-y-2">
                {studyData.priorStudies.map((prior, index) => (
                  <div key={index} className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="text-sm text-white">{prior.studyId}</div>
                    <div className="text-xs text-gray-400">{new Date(prior.date).toLocaleDateString()}</div>
                    <p className="mt-2 text-xs text-gray-300">{prior.comparison}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Info */}
          <div className="p-3 mt-6 text-xs bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-gray-400">Model: {studyData.modelVersion}</div>
            <div className="text-gray-400">Processing: {studyData.processingTimeMs}ms</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2 border-t border-gray-700">
          <button
            onClick={openFeedbackPanel}
            className="w-full px-4 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Provide Feedback
          </button>
          <button
            onClick={submitReport}
            className="w-full px-4 py-3 font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
          >
            Complete & Submit Report
          </button>
          <button
            onClick={() => navigate('/radiologist/worklist')}
            className="w-full px-4 py-3 font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Back to Worklist
          </button>
        </div>
      </div>

      {/* Center Panel - Image Viewer */}
      <div className="flex flex-col flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Brightness:</label>
              <input
                type="range"
                min="50"
                max="150"
                value={imageSettings.brightness}
                onChange={(e) => setImageSettings(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                className="w-32"
              />
              <span className="text-xs text-gray-400">{imageSettings.brightness}%</span>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Contrast:</label>
              <input
                type="range"
                min="50"
                max="150"
                value={imageSettings.contrast}
                onChange={(e) => setImageSettings(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                className="w-32"
              />
              <span className="text-xs text-gray-400">{imageSettings.contrast}%</span>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Zoom:</label>
              <span className="text-xs text-gray-400">{Math.round(imageSettings.zoom * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1 text-sm rounded ${
                showHeatmap ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`px-3 py-1 text-sm rounded ${
                showAnnotations ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Annotations
            </button>
            <button
              onClick={resetImageSettings}
              className="px-3 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div
          ref={imageContainerRef}
          className="relative flex items-center justify-center flex-1 overflow-hidden bg-black cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Main X-Ray Image */}
          <div
            style={{
              transform: `translate(${imageSettings.panX}px, ${imageSettings.panY}px) scale(${imageSettings.zoom})`,
              filter: `brightness(${imageSettings.brightness}%) contrast(${imageSettings.contrast}%)`,
              transition: isDragging.current ? 'none' : 'transform 0.1s',
            }}
            className="relative"
          >
            <img
              src={studyData.imageUrl}
              alt="Chest X-Ray"
              className="max-w-none select-none"
              draggable={false}
            />

            {/* Heatmap Overlay */}
            {showHeatmap && selectedFinding?.heatmapUrl && (
              <img
                src={selectedFinding.heatmapUrl}
                alt="AI Heatmap"
                className="absolute inset-0 opacity-40 mix-blend-screen select-none"
                draggable={false}
              />
            )}

            {/* Annotation Boxes */}
            {showAnnotations && studyData.findings.map((finding, index) => (
              finding.location && (
                <div
                  key={index}
                  onClick={() => setSelectedFinding(finding)}
                  className={`absolute border-2 cursor-pointer ${
                    finding.severity === 'critical' ? 'border-red-500' :
                    finding.severity === 'high' ? 'border-orange-500' :
                    'border-yellow-500'
                  } ${
                    selectedFinding?.pathology === finding.pathology ? 'bg-blue-500 bg-opacity-20' : ''
                  }`}
                  style={{
                    left: finding.location.x,
                    top: finding.location.y,
                    width: finding.location.width,
                    height: finding.location.height,
                  }}
                >
                  <div className="px-2 py-1 text-xs font-bold text-white bg-black bg-opacity-75">
                    {finding.pathology}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Instructions Overlay */}
          <div className="absolute text-xs text-gray-400 bottom-4 right-4">
            <div className="p-3 bg-gray-900 bg-opacity-90 rounded-lg">
              <p>🖱️ Left-click + drag to pan</p>
              <p>🖱️ Scroll to zoom</p>
              <p>Click findings to highlight regions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Viewer;
