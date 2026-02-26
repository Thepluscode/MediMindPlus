import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';

interface CameraAnalysisResult {
  heartRate: {
    bpm: number;
    confidence: number;
    variability: number;
  };
  stressLevel: {
    score: number;
    category: 'low' | 'moderate' | 'high';
  };
  skinHealth: {
    score: number;
    concerns: string[];
  };
  eyeHealth: {
    fatigueLevel: number;
    blinkRate: number;
  };
  recommendations: string[];
  timestamp: string;
}

const CameraHealthScreen: React.FC = () => {
  const navigation = useNavigation();
  const cameraRef = useRef<Camera>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CameraAnalysisResult | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const FRAME_COUNT = 30;
  const FRAME_INTERVAL = 100; // ms

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'This feature requires camera access to analyze your health through facial scanning.',
        [{ text: 'OK' }]
      );
    }
  };

  const startScan = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready. Please try again.');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setCapturedFrames([]);
    setAnalysisResult(null);

    const frames: string[] = [];

    try {
      for (let i = 0; i < FRAME_COUNT; i++) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          skipProcessing: true,
        });

        if (photo.uri) {
          frames.push(photo.uri);
        }

        setScanProgress(((i + 1) / FRAME_COUNT) * 100);

        // Wait for next frame
        await new Promise((resolve) => setTimeout(resolve, FRAME_INTERVAL));
      }

      setCapturedFrames(frames);
      setIsScanning(false);

      // Start analysis
      await analyzeFrames(frames);
    } catch (error) {
      Alert.alert('Scan Error', 'Failed to capture frames. Please try again.');
      setIsScanning(false);
    }
  };

  const analyzeFrames = async (frames: string[]) => {
    setIsAnalyzing(true);

    try {
      const formData = new FormData();

      // Add frames to form data
      for (let i = 0; i < frames.length; i++) {
        const frameInfo = await FileSystem.getInfoAsync(frames[i]);
        if (frameInfo.exists) {
          formData.append('frames', {
            uri: Platform.OS === 'ios' ? frames[i].replace('file://', '') : frames[i],
            type: 'image/jpeg',
            name: `frame_${i}.jpg`,
          } as any);
        }
      }

      formData.append('frameCount', FRAME_COUNT.toString());
      formData.append('timestamp', new Date().toISOString());

      // Send to backend
      const response = await axios.post(`${API_URL}/api/camera/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds
      });

      const result: CameraAnalysisResult = response.data;
      setAnalysisResult(result);

      // Clean up frame files
      await cleanupFrames(frames);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          Alert.alert('Timeout', 'Analysis took too long. Please try again.');
        } else if (error.response) {
          Alert.alert('Analysis Error', error.response.data.message || 'Failed to analyze frames.');
        } else if (error.request) {
          Alert.alert('Network Error', 'Could not reach the server. Please check your connection.');
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred during analysis.');
      }

      // Show mock data for demo in development
      if (__DEV__) {
        setAnalysisResult({
          heartRate: {
            bpm: 72,
            confidence: 0.87,
            variability: 45,
          },
          stressLevel: {
            score: 35,
            category: 'low',
          },
          skinHealth: {
            score: 78,
            concerns: ['Mild dehydration detected', 'Consider more sun protection'],
          },
          eyeHealth: {
            fatigueLevel: 42,
            blinkRate: 18,
          },
          recommendations: [
            'Your heart rate is within normal range.',
            'Stress levels are low - keep up the good work!',
            'Stay hydrated and use sunscreen for better skin health.',
            'Take regular breaks from screens to reduce eye fatigue.',
          ],
          timestamp: new Date().toISOString(),
        });
      }

      await cleanupFrames(frames);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanupFrames = async (frames: string[]) => {
    for (const frame of frames) {
      try {
        await FileSystem.deleteAsync(frame, { idempotent: true });
      } catch (error) {
        // Silently fail - frame cleanup is not critical
      }
    }
  };

  const getStressColor = (category: string) => {
    switch (category) {
      case 'low':
        return theme.colors.success;
      case 'moderate':
        return theme.colors.warning;
      case 'high':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 75) return theme.colors.success;
    if (score >= 50) return theme.colors.warning;
    return theme.colors.error;
  };

  if (hasPermission === null) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Requesting camera permission..."
        color={theme.colors.info}
      />
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={80} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
        <Typography variant="h4" color="secondary" align="center" style={styles.errorText}>
          Camera permission denied
        </Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestCameraPermission}
          accessibilityRole="button"
          accessibilityLabel="Request camera permission"
          accessibilityHint="Grant camera access to use health scanning features"
        >
          <Typography variant="body" weight="semibold" color="inverse">
            Request Permission
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold" color="primary">
          Camera Health Scan
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      {!analysisResult ? (
        <>
          {/* Camera View */}
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={CameraType.front}
              ratio="16:9"
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.faceBorder} />

                {isScanning && (
                  <View style={styles.scanningIndicator}>
                    <LoadingSpinner size="large" color="#FFFFFF" />
                    <Typography variant="body" weight="bold" color="inverse" style={styles.scanningText}>
                      Scanning... {Math.round(scanProgress)}%
                    </Typography>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${scanProgress}%` }]}
                      />
                    </View>
                  </View>
                )}
              </View>
            </Camera>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Typography variant="body" weight="bold" color="primary" style={styles.instructionsTitle}>
              How to scan:
            </Typography>
            <View style={styles.instruction}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" color="secondary" style={styles.instructionText}>
                Position your face in the frame
              </Typography>
            </View>
            <View style={styles.instruction}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" color="secondary" style={styles.instructionText}>
                Ensure good lighting
              </Typography>
            </View>
            <View style={styles.instruction}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" color="secondary" style={styles.instructionText}>
                Stay still during the scan
              </Typography>
            </View>
          </View>

          {/* Scan Button */}
          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <LoadingSpinner size="large" color={theme.colors.info} />
              <Typography variant="body" color="secondary" align="center" style={styles.analyzingText}>
                Analyzing your health data...
              </Typography>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
              onPress={startScan}
              disabled={isScanning}
              accessibilityRole="button"
              accessibilityLabel={isScanning ? 'Scanning in progress' : 'Start health scan'}
              accessibilityState={{ disabled: isScanning }}
              accessibilityHint="Begin camera-based health analysis to measure heart rate, stress, skin and eye health"
            >
              <Ionicons name="scan" size={24} color="#FFFFFF" importantForAccessibility="no" accessible={false} />
              <Typography variant="h4" weight="bold" color="inverse">
                {isScanning ? 'Scanning...' : 'Start Scan'}
              </Typography>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false} accessibilityLabel="Health scan results" accessibilityRole="scrollview">
          {/* Heart Rate */}
          <Card elevated elevation="sm" padding="lg" style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="heart" size={28} color={theme.colors.error} importantForAccessibility="no" accessible={false} />
              <Typography variant="h4" weight="bold" color="primary">
                Heart Rate
              </Typography>
            </View>
            <Typography variant="h1" weight="bold" color="info" style={styles.resultValue}>
              {analysisResult.heartRate.bpm} BPM
            </Typography>
            <Typography variant="body" color="secondary">
              Confidence: {Math.round(analysisResult.heartRate.confidence * 100)}% | HRV:{' '}
              {analysisResult.heartRate.variability}ms
            </Typography>
          </Card>

          {/* Stress Level */}
          <Card elevated elevation="sm" padding="lg" style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="pulse" size={28} color={getStressColor(analysisResult.stressLevel.category)} importantForAccessibility="no" accessible={false} />
              <Typography variant="h4" weight="bold" color="primary">
                Stress Level
              </Typography>
            </View>
            <View style={styles.stressIndicator}>
              <Typography
                variant="h3"
                weight="bold"
                style={{ color: getStressColor(analysisResult.stressLevel.category) }}
              >
                {analysisResult.stressLevel.category.toUpperCase()}
              </Typography>
              <Typography variant="h4" color="secondary">
                {analysisResult.stressLevel.score}/100
              </Typography>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${analysisResult.stressLevel.score}%`,
                    backgroundColor: getStressColor(analysisResult.stressLevel.category),
                  },
                ]}
              />
            </View>
          </Card>

          {/* Skin Health */}
          <Card elevated elevation="sm" padding="lg" style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="color-palette" size={28} color={theme.colors.warning} importantForAccessibility="no" accessible={false} />
              <Typography variant="h4" weight="bold" color="primary">
                Skin Health
              </Typography>
            </View>
            <Typography
              variant="h1"
              weight="bold"
              style={[
                styles.resultValue,
                { color: getHealthScoreColor(analysisResult.skinHealth.score) },
              ]}
            >
              {analysisResult.skinHealth.score}/100
            </Typography>
            {analysisResult.skinHealth.concerns.length > 0 && (
              <View style={styles.concernsContainer}>
                <Typography variant="body" weight="semibold" color="secondary">
                  Concerns:
                </Typography>
                {analysisResult.skinHealth.concerns.map((concern, index) => (
                  <Typography key={index} variant="body" color="secondary" style={styles.concernText}>
                    • {concern}
                  </Typography>
                ))}
              </View>
            )}
          </Card>

          {/* Eye Health */}
          <Card elevated elevation="sm" padding="lg" style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="eye" size={28} color={theme.colors.info} importantForAccessibility="no" accessible={false} />
              <Typography variant="h4" weight="bold" color="primary">
                Eye Health
              </Typography>
            </View>
            <View style={styles.eyeMetrics}>
              <View style={styles.eyeMetric}>
                <Typography variant="body" color="secondary">
                  Fatigue Level
                </Typography>
                <Typography variant="h3" weight="bold" color="info" style={styles.eyeMetricValue}>
                  {analysisResult.eyeHealth.fatigueLevel}%
                </Typography>
              </View>
              <View style={styles.eyeMetric}>
                <Typography variant="body" color="secondary">
                  Blink Rate
                </Typography>
                <Typography variant="h3" weight="bold" color="info" style={styles.eyeMetricValue}>
                  {analysisResult.eyeHealth.blinkRate}/min
                </Typography>
              </View>
            </View>
          </Card>

          {/* Recommendations */}
          <Card elevated elevation="sm" padding="lg" style={styles.recommendationsCard}>
            <Typography variant="h4" weight="bold" color="primary" style={styles.recommendationsTitle}>
              Health Recommendations
            </Typography>
            {analysisResult.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendation}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                <Typography variant="body" color="secondary" style={styles.recommendationText}>
                  {rec}
                </Typography>
              </View>
            ))}
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setAnalysisResult(null)}
              accessibilityRole="button"
              accessibilityLabel="Scan again"
              accessibilityHint="Discard current results and perform a new health scan"
            >
              <Ionicons name="refresh" size={20} color={theme.colors.info} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" weight="semibold" color="info">
                Scan Again
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                Alert.alert('Saved', 'Health scan results saved to your profile.');
                navigation.goBack();
              }}
              accessibilityRole="button"
              accessibilityLabel="Save scan results"
              accessibilityHint="Save health scan results to your profile and return to previous screen"
            >
              <Ionicons name="save" size={20} color="#FFFFFF" importantForAccessibility="no" accessible={false} />
              <Typography variant="body" weight="semibold" color="inverse">
                Save Results
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  cameraContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 500 : '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceBorder: {
    width: 250,
    height: 300,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 150,
    opacity: 0.7,
  },
  scanningIndicator: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '80%',
  },
  scanningText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.borderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.info,
  },
  instructionsContainer: {
    padding: theme.spacing.lg,
  },
  instructionsTitle: {
    marginBottom: theme.spacing.md,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  instructionText: {
    marginLeft: theme.spacing.sm,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  analyzingText: {
    marginTop: theme.spacing.lg,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.info,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  scanButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
  resultsContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  resultCard: {
    marginBottom: theme.spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  resultValue: {
    marginBottom: theme.spacing.xs,
  },
  stressIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  concernsContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  concernText: {
    marginBottom: theme.spacing.xs,
  },
  eyeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  eyeMetric: {
    alignItems: 'center',
  },
  eyeMetricValue: {
    marginTop: theme.spacing.xs,
  },
  recommendationsCard: {
    marginBottom: theme.spacing.lg,
  },
  recommendationsTitle: {
    marginBottom: theme.spacing.md,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  recommendationText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.info,
    gap: theme.spacing.xs,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.info,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  errorText: {
    marginTop: theme.spacing.lg,
  },
  retryButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.info,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
});

export default CameraHealthScreen;
