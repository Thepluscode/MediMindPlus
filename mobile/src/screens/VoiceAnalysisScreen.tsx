/**
 * Voice Analysis Screen
 * Modern UI for voice biomarker analysis with real-time waveform visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import voiceBiomarkerML, { VoiceAnalysisResult } from '../services/ai/voiceBiomarkerML';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

const VoiceAnalysisScreen: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveformAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeAudio();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Pulse animation for recording indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Waveform animation
      Animated.loop(
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.stopAnimation();
      waveformAnim.stopAnimation();
    }
  }, [isRecording]);

  const initializeAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      Alert.alert('Audio Error', 'Failed to initialize audio. Please check your permissions.');
    }
  };

  const startRecording = async () => {
    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Monitor recording duration
      const durationInterval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Monitor audio level
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          setAudioLevel(Math.abs(status.metering) / 160); // Normalize to 0-1
        }
      });

      // Auto-stop after 30 seconds
      setTimeout(() => {
        stopRecording();
        clearInterval(durationInterval);
      }, 30000);

    } catch (error) {
      Alert.alert('Recording Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        analyzeVoice(uri);
      }

      setRecording(null);
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    }
  };

  const analyzeVoice = async (audioUri: string) => {
    setIsAnalyzing(true);

    try {
      // Load ML model if not loaded
      await voiceBiomarkerML.loadModel();

      // Analyze voice
      const result = await voiceBiomarkerML.analyzeVoice(audioUri);

      setAnalysisResult(result);

      // Fade in results
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setIsAnalyzing(false);
    } catch (error) {
      setIsAnalyzing(false);
      Alert.alert('Analysis Error', 'Voice analysis failed. Please try again.');
    }
  };

  const getStressColor = (level: number): string => {
    if (level < 0.3) return '#10b981'; // Green - calm
    if (level < 0.6) return '#f59e0b'; // Orange - moderate
    return '#ef4444'; // Red - high stress
  };

  const getEmotionalStateIcon = (state: string): string => {
    switch (state) {
      case 'calm': return 'happy-outline';
      case 'stressed': return 'warning-outline';
      case 'anxious': return 'alert-circle-outline';
      case 'depressed': return 'sad-outline';
      case 'elevated': return 'trending-up-outline';
      default: return 'help-outline';
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.header}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <Typography variant="h1" color="inverse" weight="bold">
          Voice Biomarker Analysis
        </Typography>
        <Typography variant="bodySmall" color="inverse" style={styles.headerSubtitle}>
          AI-Powered Health Insights from Your Voice
        </Typography>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Voice analysis results"
        accessibilityRole="scrollview"
      >
        {/* Recording Control Card */}
        <View style={styles.card}>
          <View style={styles.recordingContainer}>
            {/* Waveform Visualization */}
            {isRecording && (
              <View
                style={styles.waveformContainer}
                importantForAccessibility="no"
                accessible={false}
              >
                {[...Array(20)].map((_, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveformBar,
                      {
                        height: waveformAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            10 + Math.sin(index) * 20,
                            30 + Math.sin(index + Date.now() / 200) * 40 + audioLevel * 50
                          ]
                        }),
                        opacity: audioLevel > 0.1 ? 0.8 : 0.3
                      }
                    ]}
                    importantForAccessibility="no"
                    accessible={false}
                  />
                ))}
              </View>
            )}

            {/* Recording Button */}
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
              accessibilityHint={isRecording ? "Stop voice recording for analysis" : "Record your voice for 5 to 30 seconds"}
              accessibilityState={{ disabled: isAnalyzing }}
            >
              <Animated.View
                style={[
                  styles.recordButton,
                  { transform: [{ scale: isRecording ? pulseAnim : 1 }] }
                ]}
              >
                <LinearGradient
                  colors={isRecording ? ['#ef4444', '#dc2626'] : [theme.colors.accent, '#7c3aed']}
                  style={styles.recordButtonGradient}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={40}
                    color="#fff"
                    importantForAccessibility="no"
                    accessible={false}
                  />
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>

            {/* Recording Status */}
            <Typography variant="body" weight="semibold" color="primary" style={styles.recordingStatus}>
              {isRecording
                ? `Recording... ${formatDuration(recordingDuration)}`
                : isAnalyzing
                ? 'Analyzing voice...'
                : 'Tap to record (5-30 seconds)'}
            </Typography>

            {/* Instructions */}
            {!isRecording && !isAnalyzing && !analysisResult && (
              <View style={styles.instructionsCard}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={theme.colors.accent}
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography variant="bodySmall" style={styles.instructionsText}>
                  Speak naturally for 5-30 seconds. Our AI will analyze stress, emotions, and respiratory health from your voice.
                </Typography>
              </View>
            )}
          </View>
        </View>

        {/* Loading Indicator */}
        {isAnalyzing && (
          <Card
            elevated
            elevation="md"
            padding="xl"
            style={styles.loadingCard}
            accessibilityLabel="Analyzing voice biomarkers, extracting acoustic features and running ML inference"
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            <LoadingSpinner size="large" color={theme.colors.accent} />
            <Typography variant="body" weight="semibold" color="primary" style={styles.loadingText}>
              Analyzing voice biomarkers...
            </Typography>
            <Typography variant="caption" color="secondary" style={styles.loadingSubtext}>
              Extracting acoustic features and running ML inference
            </Typography>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && !isAnalyzing && (
          <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
            {/* Overall Health Score */}
            <Card elevated elevation="md" padding="lg" style={styles.resultCard}>
              <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
                Overall Voice Health
              </Typography>

              <View style={styles.scoreContainer}>
                <View style={styles.scoreCircle}>
                  <LinearGradient
                    colors={[getStressColor(analysisResult.stressLevel), getStressColor(analysisResult.stressLevel) + 'CC']}
                    style={styles.scoreGradient}
                    accessible={false}
                    importantForAccessibility="no-hide-descendants"
                  >
                    <Typography variant="h1" color="inverse" weight="bold">
                      {Math.round((1 - analysisResult.stressLevel) * 100)}
                    </Typography>
                    <Typography variant="bodySmall" color="inverse" style={{ opacity: 0.8 }}>
                      / 100
                    </Typography>
                  </LinearGradient>
                </View>

                <View style={styles.scoreDetails}>
                  <View style={styles.scoreRow}>
                    <Ionicons
                      name="heart"
                      size={20}
                      color="#ef4444"
                      importantForAccessibility="no"
                      accessible={false}
                    />
                    <Typography variant="bodySmall" color="secondary" style={styles.scoreLabel}>Stress Level:</Typography>
                    <Typography variant="bodySmall" weight="semibold" style={{ color: getStressColor(analysisResult.stressLevel) }}>
                      {Math.round(analysisResult.stressLevel * 100)}%
                    </Typography>
                  </View>

                  <View style={styles.scoreRow}>
                    <Ionicons
                      name={getEmotionalStateIcon(analysisResult.emotionalState)}
                      size={20}
                      color="#8b5cf6"
                      importantForAccessibility="no"
                      accessible={false}
                    />
                    <Typography variant="bodySmall" color="secondary" style={styles.scoreLabel}>Emotional State:</Typography>
                    <Typography variant="bodySmall" weight="semibold" color="primary">
                      {analysisResult.emotionalState.charAt(0).toUpperCase() + analysisResult.emotionalState.slice(1)}
                    </Typography>
                  </View>

                  <View style={styles.scoreRow}>
                    <Ionicons
                      name="fitness"
                      size={20}
                      color="#10b981"
                      importantForAccessibility="no"
                      accessible={false}
                    />
                    <Typography variant="bodySmall" color="secondary" style={styles.scoreLabel}>Voice Quality:</Typography>
                    <Typography variant="bodySmall" weight="semibold" color="primary">
                      {Math.round(analysisResult.voiceQuality * 100)}%
                    </Typography>
                  </View>
                </View>
              </View>
            </View>

            {/* Detailed Metrics */}
            <Card elevated elevation="md" padding="lg" style={styles.metricsCard}>
              <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
                Health Biomarkers
              </Typography>

              {/* Respiratory Rate */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View
                    style={styles.metricIconContainer}
                    importantForAccessibility="no"
                    accessible={false}
                  >
                    <Ionicons
                      name="water"
                      size={24}
                      color="#3b82f6"
                      importantForAccessibility="no"
                      accessible={false}
                    />
                  </View>
                  <View style={styles.metricInfo}>
                    <Typography variant="caption" color="secondary">Respiratory Rate</Typography>
                    <Typography variant="h4" weight="bold" color="primary">
                      {Math.round(analysisResult.respiratoryRate)} bpm
                    </Typography>
                  </View>
                  <View style={[
                    styles.metricBadge,
                    {
                      backgroundColor: analysisResult.respiratoryRate >= 12 && analysisResult.respiratoryRate <= 20
                        ? '#d1fae5'
                        : '#fef3c7'
                    }
                  ]}>
                    <Typography
                      variant="caption"
                      weight="semibold"
                      style={{
                        color: analysisResult.respiratoryRate >= 12 && analysisResult.respiratoryRate <= 20
                          ? '#065f46'
                          : '#92400e'
                      }}
                    >
                      {analysisResult.respiratoryRate >= 12 && analysisResult.respiratoryRate <= 20 ? 'Normal' : 'Elevated'}
                    </Typography>
                  </View>
                </View>
                <View style={styles.metricBar}>
                  <View
                    style={[
                      styles.metricBarFill,
                      {
                        width: `${Math.min(100, (analysisResult.respiratoryRate / 25) * 100)}%`,
                        backgroundColor: '#3b82f6'
                      }
                    ]}
                  />
                </View>
              </View>

              {/* Cognitive Load */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View
                    style={styles.metricIconContainer}
                    importantForAccessibility="no"
                    accessible={false}
                  >
                    <Ionicons
                      name="brain"
                      size={24}
                      color="#ec4899"
                      importantForAccessibility="no"
                      accessible={false}
                    />
                  </View>
                  <View style={styles.metricInfo}>
                    <Typography variant="caption" color="secondary">Cognitive Load</Typography>
                    <Typography variant="h4" weight="bold" color="primary">
                      {Math.round(analysisResult.cognitiveLoad * 100)}%
                    </Typography>
                  </View>
                  <View style={[
                    styles.metricBadge,
                    {
                      backgroundColor: analysisResult.cognitiveLoad < 0.6 ? '#d1fae5' : '#fef3c7'
                    }
                  ]}>
                    <Typography
                      variant="caption"
                      weight="semibold"
                      style={{
                        color: analysisResult.cognitiveLoad < 0.6 ? '#065f46' : '#92400e'
                      }}
                    >
                      {analysisResult.cognitiveLoad < 0.6 ? 'Low' : 'Moderate'}
                    </Typography>
                  </View>
                </View>
                <View style={styles.metricBar}>
                  <View
                    style={[
                      styles.metricBarFill,
                      {
                        width: `${analysisResult.cognitiveLoad * 100}%`,
                        backgroundColor: '#ec4899'
                      }
                    ]}
                  />
                </View>
              </View>
            </Card>

            {/* AI Predictions */}
            <Card elevated elevation="md" padding="lg" style={styles.predictionsCard}>
              <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
                AI Health Predictions
              </Typography>

              {Object.entries(analysisResult.rawPredictions).map(([key, value]) => (
                <View key={key} style={styles.predictionRow}>
                  <Typography variant="caption" color="secondary" style={styles.predictionLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </Typography>
                  <View style={styles.predictionBar}>
                    <View
                      style={[
                        styles.predictionBarFill,
                        {
                          width: `${value * 100}%`,
                          backgroundColor: value < 0.3 ? '#10b981' : value < 0.6 ? '#f59e0b' : '#ef4444'
                        }
                      ]}
                    />
                  </View>
                  <Typography
                    variant="bodySmall"
                    weight="semibold"
                    style={[
                      styles.predictionValue,
                      { color: value < 0.3 ? '#10b981' : value < 0.6 ? '#f59e0b' : '#ef4444' }
                    ]}
                  >
                    {Math.round(value * 100)}%
                  </Typography>
                </View>
              ))}
            </Card>

            {/* Voice Features */}
            <Card elevated elevation="md" padding="lg" style={styles.featuresCard}>
              <Typography variant="h3" weight="bold" color="primary" style={styles.sectionTitle}>
                Voice Characteristics
              </Typography>

              <View style={styles.featuresGrid}>
                <View style={styles.featureCard}>
                  <Ionicons
                    name="musical-notes"
                    size={24}
                    color="#8b5cf6"
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Typography variant="caption" color="secondary" style={styles.featureLabel}>
                    Pitch (Hz)
                  </Typography>
                  <Typography variant="body" weight="bold" color="primary">
                    {Math.round(analysisResult.features.pitch.mean)}
                  </Typography>
                </View>

                <View style={styles.featureCard}>
                  <Ionicons
                    name="pulse"
                    size={24}
                    color="#3b82f6"
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Typography variant="caption" color="secondary" style={styles.featureLabel}>
                    Speaking Rate
                  </Typography>
                  <Typography variant="body" weight="bold" color="primary">
                    {analysisResult.features.speakingRate.toFixed(1)} syl/s
                  </Typography>
                </View>

                <View style={styles.featureCard}>
                  <Ionicons
                    name="timer"
                    size={24}
                    color="#f59e0b"
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Typography variant="caption" color="secondary" style={styles.featureLabel}>
                    Pause Duration
                  </Typography>
                  <Typography variant="body" weight="bold" color="primary">
                    {analysisResult.features.pauseDuration.toFixed(2)}s
                  </Typography>
                </View>

                <View style={styles.featureCard}>
                  <Ionicons
                    name="radio"
                    size={24}
                    color="#10b981"
                    importantForAccessibility="no"
                    accessible={false}
                  />
                  <Typography variant="caption" color="secondary" style={styles.featureLabel}>
                    HNR (dB)
                  </Typography>
                  <Typography variant="body" weight="bold" color="primary">
                    {analysisResult.features.harmonicToNoiseRatio.toFixed(1)}
                  </Typography>
                </View>
              </View>
            </Card>

            {/* Confidence & Timestamp */}
            <View style={styles.metadataCard}>
              <View style={styles.metadataRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#10b981"
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography variant="caption" color="secondary">
                  Analysis Confidence: {Math.round(analysisResult.confidence * 100)}%
                </Typography>
              </View>
              <View style={styles.metadataRow}>
                <Ionicons
                  name="time"
                  size={20}
                  color="#64748b"
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography variant="caption" color="secondary">
                  {new Date(analysisResult.timestamp).toLocaleString()}
                </Typography>
              </View>
            </View>

            {/* Analyze Again Button */}
            <TouchableOpacity
              style={styles.analyzeAgainButton}
              onPress={() => {
                setAnalysisResult(null);
                setRecordingDuration(0);
                fadeAnim.setValue(0);
              }}
              accessibilityRole="button"
              accessibilityLabel="Analyze voice again"
              accessibilityHint="Clear current results and start a new voice recording"
            >
              <LinearGradient
                colors={theme.gradients.primary.colors}
                style={styles.analyzeAgainGradient}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color="#fff"
                  importantForAccessibility="no"
                  accessible={false}
                />
                <Typography variant="body" weight="semibold" color="inverse">
                  Analyze Again
                </Typography>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerSubtitle: {
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.medium,
  },
  resultCard: {
    margin: theme.spacing.md,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xxs,
  },
  waveformBar: {
    width: 4,
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
  recordButton: {
    marginVertical: theme.spacing.lg,
  },
  recordButtonGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.large,
  },
  recordingStatus: {
    marginTop: theme.spacing.sm,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  instructionsText: {
    flex: 1,
    color: theme.colors.accent,
    lineHeight: 20,
  },
  loadingCard: {
    margin: theme.spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  loadingSubtext: {
    marginTop: theme.spacing.xs,
  },
  resultsContainer: {
    paddingBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  scoreCircle: {
    width: 100,
    height: 100,
  },
  scoreGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDetails: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  scoreLabel: {
    flex: 1,
  },
  metricsCard: {
    margin: theme.spacing.md,
  },
  metricCard: {
    marginBottom: theme.spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricInfo: {
    flex: 1,
  },
  metricBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
  },
  metricBar: {
    height: 8,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  predictionsCard: {
    margin: theme.spacing.md,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  predictionLabel: {
    width: 120,
  },
  predictionBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  predictionBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  predictionValue: {
    width: 50,
    textAlign: 'right',
  },
  featuresCard: {
    margin: theme.spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  featureCard: {
    width: (width - 72) / 2,
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  featureLabel: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xxs,
  },
  metadataCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  analyzeAgainButton: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  analyzeAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
});

export default VoiceAnalysisScreen;
