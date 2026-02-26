import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

interface VoiceAnalysisResult {
  healthScore: number;
  biomarkers: {
    stressLevel: number;
    respiratoryHealth: number;
    emotionalState: string;
    fatigueLevel: number;
    cardiovascularRisk: number;
  };
  recommendations: string[];
  detailedAnalysis: {
    pitch: { mean: number; std: number };
    energy: { mean: number; std: number };
    spectralFeatures: any;
  };
}

interface VoiceAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  onAnalysisComplete?: (result: VoiceAnalysisResult) => void;
}

const VoiceAnalysisModal: React.FC<VoiceAnalysisModalProps> = ({
  visible,
  onClose,
  onAnalysisComplete,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const RECORDING_DURATION = 10000; // 10 seconds
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    requestPermissions();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice analysis.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to get permissions:', error);
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setAnalysisResult(null);

      // Auto-stop after RECORDING_DURATION
      setTimeout(() => {
        if (newRecording) {
          stopRecording();
        }
      }, RECORDING_DURATION);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        await analyzeVoice(uri);
      }

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const analyzeVoice = async (audioUri: string) => {
    setIsAnalyzing(true);

    try {
      // Read the audio file
      const audioInfo = await FileSystem.getInfoAsync(audioUri);
      if (!audioInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Create form data
      const formData = new FormData();
      formData.append('audio', {
        uri: Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri,
        type: 'audio/m4a',
        name: 'voice_sample.m4a',
      } as any);

      // Send to backend for analysis
      const response = await axios.post(`${API_URL}/api/voice/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      const result: VoiceAnalysisResult = response.data;
      setAnalysisResult(result);

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error('Voice analysis failed:', error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          Alert.alert('Timeout', 'Analysis took too long. Please try again.');
        } else if (error.response) {
          Alert.alert('Analysis Error', error.response.data.message || 'Failed to analyze voice.');
        } else if (error.request) {
          Alert.alert('Network Error', 'Could not reach the server. Please check your connection.');
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred during analysis.');
      }

      // Show mock data for demo purposes in development
      if (__DEV__) {
        setAnalysisResult({
          healthScore: 78,
          biomarkers: {
            stressLevel: 45,
            respiratoryHealth: 82,
            emotionalState: 'Calm',
            fatigueLevel: 38,
            cardiovascularRisk: 22,
          },
          recommendations: [
            'Your voice indicates moderate stress. Consider relaxation exercises.',
            'Respiratory patterns are healthy. Continue regular breathing exercises.',
            'Cardiovascular markers are within normal range.',
          ],
          detailedAnalysis: {
            pitch: { mean: 180.5, std: 25.3 },
            energy: { mean: 0.65, std: 0.12 },
            spectralFeatures: {},
          },
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    if (recording) {
      recording.stopAndUnloadAsync();
    }
    setRecording(null);
    setIsRecording(false);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setRecordingTime(0);
    onClose();
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  };

  const getBiomarkerColor = (value: number) => {
    if (value <= 30) return '#4CAF50';
    if (value <= 60) return '#FFC107';
    return '#F44336';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Voice Health Analysis</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {!analysisResult && !isAnalyzing && (
              <View style={styles.recordingSection}>
                <View style={styles.microphoneContainer}>
                  <Ionicons
                    name={isRecording ? 'mic' : 'mic-outline'}
                    size={80}
                    color={isRecording ? '#F44336' : '#2196F3'}
                  />
                </View>

                <Text style={styles.instructionText}>
                  {isRecording
                    ? `Recording... ${10 - recordingTime}s remaining`
                    : 'Tap the button below to start a 10-second voice recording'}
                </Text>

                {isRecording && (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(recordingTime / 10) * 100}%` },
                      ]}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={!permissionGranted}
                >
                  <Text style={styles.recordButtonText}>
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.tipText}>
                  💡 For best results, speak naturally in a quiet environment
                </Text>
              </View>
            )}

            {isAnalyzing && (
              <View style={styles.analyzingSection}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.analyzingText}>
                  Analyzing your voice biomarkers...
                </Text>
                <Text style={styles.analyzingSubtext}>
                  This may take a few moments
                </Text>
              </View>
            )}

            {analysisResult && (
              <View style={styles.resultsSection}>
                {/* Health Score */}
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Health Score</Text>
                  <Text
                    style={[
                      styles.scoreValue,
                      { color: getHealthScoreColor(analysisResult.healthScore) },
                    ]}
                  >
                    {analysisResult.healthScore}/100
                  </Text>
                </View>

                {/* Biomarkers */}
                <View style={styles.biomarkersContainer}>
                  <Text style={styles.sectionTitle}>Voice Biomarkers</Text>

                  <View style={styles.biomarker}>
                    <Text style={styles.biomarkerLabel}>Stress Level</Text>
                    <View style={styles.biomarkerBar}>
                      <View
                        style={[
                          styles.biomarkerFill,
                          {
                            width: `${analysisResult.biomarkers.stressLevel}%`,
                            backgroundColor: getBiomarkerColor(
                              analysisResult.biomarkers.stressLevel
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.biomarkerValue}>
                      {analysisResult.biomarkers.stressLevel}%
                    </Text>
                  </View>

                  <View style={styles.biomarker}>
                    <Text style={styles.biomarkerLabel}>Respiratory Health</Text>
                    <View style={styles.biomarkerBar}>
                      <View
                        style={[
                          styles.biomarkerFill,
                          {
                            width: `${analysisResult.biomarkers.respiratoryHealth}%`,
                            backgroundColor: getBiomarkerColor(
                              100 - analysisResult.biomarkers.respiratoryHealth
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.biomarkerValue}>
                      {analysisResult.biomarkers.respiratoryHealth}%
                    </Text>
                  </View>

                  <View style={styles.biomarker}>
                    <Text style={styles.biomarkerLabel}>Fatigue Level</Text>
                    <View style={styles.biomarkerBar}>
                      <View
                        style={[
                          styles.biomarkerFill,
                          {
                            width: `${analysisResult.biomarkers.fatigueLevel}%`,
                            backgroundColor: getBiomarkerColor(
                              analysisResult.biomarkers.fatigueLevel
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.biomarkerValue}>
                      {analysisResult.biomarkers.fatigueLevel}%
                    </Text>
                  </View>

                  <View style={styles.biomarker}>
                    <Text style={styles.biomarkerLabel}>Cardiovascular Risk</Text>
                    <View style={styles.biomarkerBar}>
                      <View
                        style={[
                          styles.biomarkerFill,
                          {
                            width: `${analysisResult.biomarkers.cardiovascularRisk}%`,
                            backgroundColor: getBiomarkerColor(
                              analysisResult.biomarkers.cardiovascularRisk
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.biomarkerValue}>
                      {analysisResult.biomarkers.cardiovascularRisk}%
                    </Text>
                  </View>

                  <View style={styles.emotionalState}>
                    <Text style={styles.biomarkerLabel}>Emotional State</Text>
                    <Text style={styles.emotionalStateValue}>
                      {analysisResult.biomarkers.emotionalState}
                    </Text>
                  </View>
                </View>

                {/* Recommendations */}
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.sectionTitle}>Recommendations</Text>
                  {analysisResult.recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendation}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      setAnalysisResult(null);
                      setRecordingTime(0);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Record Again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  microphoneContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F44336',
  },
  recordButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
  },
  recordButtonActive: {
    backgroundColor: '#F44336',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  analyzingSection: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  analyzingText: {
    fontSize: 18,
    color: '#333',
    marginTop: 20,
    fontWeight: '600',
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  resultsSection: {
    paddingBottom: 10,
  },
  scoreCard: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  biomarkersContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  biomarker: {
    marginBottom: 15,
  },
  biomarkerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  biomarkerBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  biomarkerFill: {
    height: '100%',
  },
  biomarkerValue: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emotionalState: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  emotionalStateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceAnalysisModal;
