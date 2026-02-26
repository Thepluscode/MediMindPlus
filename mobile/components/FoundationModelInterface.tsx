// Foundation Model Interface - Premium Clinical-Grade UX
// Med-PaLM M Multimodal Analysis Interface

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  BeakerIcon,
  HeartIcon,
  BrainIcon,
  LungsIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface MultimodalAnalysisRequest {
  patientId: string
  textData?: string
  voiceData?: string
  genomicData?: any
  medicalImages?: string[]
  ehrData?: any
  wearableData?: any
  analysisType: string
}

interface ClinicalInsight {
  insightType: string
  content: string
  confidence: number
  evidence: string[]
  clinicalRelevance: string
}

interface FoundationModelResponse {
  patientId: string
  analysisType: string
  predictions: any
  confidenceScores: Record<string, number>
  clinicalInsights: ClinicalInsight[]
  explanations: string[]
  clinicalReasoning: string
  modalitiesUsed: string[]
  modelVersion: string
  processingTime: number
  timestamp: string
}

const FoundationModelInterface: React.FC = () => {
  const [activeModalities, setActiveModalities] = useState<string[]>([])
  const [analysisResults, setAnalysisResults] = useState<FoundationModelResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Voice recording functionality
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorder.start()
      setVoiceRecording(true)
      setRecordingDuration(0)
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
      
      // Add voice modality
      setActiveModalities(prev => [...prev.filter(m => m !== 'voice'), 'voice'])
      
    } catch (error) {
      console.error('Error starting voice recording:', error)
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && voiceRecording) {
      mediaRecorderRef.current.stop()
      setVoiceRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  // Image upload functionality
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedImages(files)
    
    if (files.length > 0) {
      setActiveModalities(prev => [...prev.filter(m => m !== 'imaging'), 'imaging'])
    }
  }

  // Text input handling
  const handleTextInput = (value: string) => {
    setTextInput(value)
    
    if (value.trim()) {
      setActiveModalities(prev => [...prev.filter(m => m !== 'text'), 'text'])
    } else {
      setActiveModalities(prev => prev.filter(m => m !== 'text'))
    }
  }

  // Foundation model analysis
  const runFoundationModelAnalysis = async () => {
    setIsAnalyzing(true)
    
    try {
      // Convert voice recording to base64
      let voiceData: string | undefined
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const arrayBuffer = await audioBlob.arrayBuffer()
        voiceData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      }
      
      // Convert images to base64
      const medicalImages: string[] = []
      for (const file of selectedImages) {
        const arrayBuffer = await file.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        medicalImages.push(base64)
      }
      
      const request: MultimodalAnalysisRequest = {
        patientId: 'demo-patient-001',
        textData: textInput || undefined,
        voiceData,
        medicalImages: medicalImages.length > 0 ? medicalImages : undefined,
        analysisType: 'comprehensive_health_assessment'
      }
      
      // Call Med-PaLM M API
      const response = await fetch('/api/v1/multimodal-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        throw new Error('Analysis failed')
      }
      
      const results: FoundationModelResponse = await response.json()
      setAnalysisResults(results)
      
    } catch (error) {
      console.error('Error running foundation model analysis:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <SparklesIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Med-PaLM M Multimodal Analysis
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          First healthcare AI with clinical-grade foundation model capabilities
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          86.5% USMLE Accuracy • Human Expert Level Performance
        </div>
      </motion.div>

      {/* Modality Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Text Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Symptoms & Medical History
            </h3>
          </div>
          
          <textarea
            value={textInput}
            onChange={(e) => handleTextInput(e.target.value)}
            placeholder="Describe symptoms, medical history, or health concerns..."
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          
          {activeModalities.includes('text') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 flex items-center text-sm text-green-600"
            >
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Text data ready for analysis
            </motion.div>
          )}
        </motion.div>

        {/* Voice Recording */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <MicrophoneIcon className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Voice Biomarker Analysis
            </h3>
          </div>
          
          <div className="text-center">
            {!voiceRecording ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startVoiceRecording}
                className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
              >
                <MicrophoneIcon className="w-8 h-8" />
              </motion.button>
            ) : (
              <div className="space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg mx-auto"
                >
                  <MicrophoneIcon className="w-8 h-8" />
                </motion.div>
                
                <div className="text-2xl font-mono text-red-600">
                  {formatDuration(recordingDuration)}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopVoiceRecording}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  Stop Recording
                </motion.button>
              </div>
            )}
            
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Record 30-60 seconds for optimal voice biomarker analysis
            </p>
          </div>
          
          {activeModalities.includes('voice') && !voiceRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 flex items-center justify-center text-sm text-green-600"
            >
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Voice sample ready for analysis
            </motion.div>
          )}
        </motion.div>

        {/* Medical Image Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <PhotoIcon className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Medical Imaging
            </h3>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <PhotoIcon className="w-12 h-12 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Upload X-rays, ECGs, or other medical images
              </span>
            </label>
          </div>
          
          {selectedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4"
            >
              <div className="flex items-center text-sm text-green-600 mb-2">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                {selectedImages.length} image(s) selected
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedImages.slice(0, 3).map((file, index) => (
                  <div key={index} className="text-xs text-gray-600 truncate">
                    {file.name}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Analysis Controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <BeakerIcon className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analysis Control
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active Modalities
              </label>
              <div className="flex flex-wrap gap-2">
                {activeModalities.map((modality) => (
                  <span
                    key={modality}
                    className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm capitalize"
                  >
                    {modality}
                  </span>
                ))}
                {activeModalities.length === 0 && (
                  <span className="text-sm text-gray-500">No modalities selected</span>
                )}
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runFoundationModelAnalysis}
              disabled={activeModalities.length === 0 || isAnalyzing}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                activeModalities.length > 0 && !isAnalyzing
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing with Med-PaLM M...</span>
                </div>
              ) : (
                'Run Multimodal Analysis'
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysisResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Med-PaLM M Analysis Results
              </h3>
              <span className="text-sm text-gray-500">
                {analysisResults.processingTime.toFixed(2)}s • {analysisResults.modelVersion}
              </span>
            </div>

            {/* Clinical Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {analysisResults.clinicalInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {insight.insightType === 'disease_risk' && <HeartIcon className="w-5 h-5 text-red-500" />}
                      {insight.insightType === 'mental_health' && <BrainIcon className="w-5 h-5 text-purple-500" />}
                      {insight.insightType === 'respiratory' && <LungsIcon className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {insight.insightType.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {insight.content}
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${insight.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {(insight.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Clinical Reasoning */}
            {analysisResults.clinicalReasoning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Clinical Reasoning
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {analysisResults.clinicalReasoning}
                </p>
              </motion.div>
            )}

            {/* Modalities Used */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Analysis based on:</span>
              {analysisResults.modalitiesUsed.map((modality, index) => (
                <span
                  key={modality}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded capitalize"
                >
                  {modality}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FoundationModelInterface
