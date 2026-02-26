/**
 * Video Consultation Room
 * Real-time video consultation with Twilio Video and wearable vitals overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';

const API_BASE_URL = 'http://localhost:3000/api';

interface ConsultationProps {
  route: {
    params: {
      consultationId: string;
      isProvider: boolean;
    };
  };
  navigation: any;
}

interface Vitals {
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  oxygenSaturation?: number;
  bloodGlucose?: number;
  bodyTemperature?: number;
  respiratoryRate?: number;
}

const VideoConsultationRoom: React.FC<ConsultationProps> = ({ route, navigation }) => {
  const { consultationId, isProvider } = route.params;

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [vitalsVisible, setVitalsVisible] = useState(false);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [consultation, setConsultation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const twilioRoomRef = useRef<any>(null);

  useEffect(() => {
    initializeVideoCall();

    return () => {
      disconnectCall();
    };
  }, []);

  useEffect(() => {
    // Fetch vitals every 30 seconds if patient shared them
    const vitalsInterval = setInterval(() => {
      if (vitalsVisible && consultationId) {
        fetchConsultationDetails();
      }
    }, 30000);

    return () => clearInterval(vitalsInterval);
  }, [vitalsVisible]);

  const initializeVideoCall = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Get consultation details
      await fetchConsultationDetails();

      // Start consultation (provider only)
      if (isProvider) {
        await axios.post(
          `${API_BASE_URL}/consultations/${consultationId}/video/start`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Get Twilio access token
      const tokenResponse = await axios.post(
        `${API_BASE_URL}/consultations/${consultationId}/video/token`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (tokenResponse.data.success) {
        const { token: twilioToken, roomName } = tokenResponse.data.data;
        await connectToTwilioRoom(twilioToken, roomName);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize video call');
      Alert.alert('Error', 'Failed to start video consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultationDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/consultations/${consultationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setConsultation(response.data.data);

        // Load vitals if shared
        if (response.data.data.vitals_shared && response.data.data.vitals_snapshot) {
          setVitals(response.data.data.vitals_snapshot);
          setVitalsVisible(true);
        }
      }
    } catch (err) {
      // Error handled silently
    }
  };

  const connectToTwilioRoom = async (token: string, roomName: string) => {
    try {
      // For web platform, use Twilio Video JS SDK
      if (Platform.OS === 'web') {
        // @ts-ignore - Twilio Video is loaded via CDN
        const { connect } = window.Twilio.Video;

        const room = await connect(token, {
          name: roomName,
          audio: true,
          video: { width: 640, height: 480 },
        });

        twilioRoomRef.current = room;
        setConnected(true);

        // Handle participant events
        room.on('participantConnected', (participant: any) => {
          // Participant connected
        });

        room.on('participantDisconnected', (participant: any) => {
          // Participant disconnected
        });

        // Attach local video track
        room.localParticipant.videoTracks.forEach((publication: any) => {
          const videoElement = document.getElementById('local-video');
          if (videoElement && publication.track) {
            videoElement.appendChild(publication.track.attach());
          }
        });

        // Attach remote participants
        room.participants.forEach((participant: any) => {
          attachRemoteParticipant(participant);
        });

        room.on('trackSubscribed', (track: any, publication: any, participant: any) => {
          const remoteVideoElement = document.getElementById('remote-video');
          if (remoteVideoElement && track.kind === 'video') {
            remoteVideoElement.appendChild(track.attach());
          }
        });
      }
      // For React Native, use @twilio/video-react-native
      else {
        // TODO: Implement React Native Twilio Video SDK integration
      }
    } catch (err) {
      throw err;
    }
  };

  const attachRemoteParticipant = (participant: any) => {
    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed) {
        const track = publication.track;
        const remoteVideoElement = document.getElementById('remote-video');
        if (remoteVideoElement && track.kind === 'video') {
          remoteVideoElement.appendChild(track.attach());
        }
      }
    });
  };

  const toggleMic = () => {
    if (twilioRoomRef.current) {
      twilioRoomRef.current.localParticipant.audioTracks.forEach((publication: any) => {
        if (micEnabled) {
          publication.track.disable();
        } else {
          publication.track.enable();
        }
      });
      setMicEnabled(!micEnabled);
    }
  };

  const toggleCamera = () => {
    if (twilioRoomRef.current) {
      twilioRoomRef.current.localParticipant.videoTracks.forEach((publication: any) => {
        if (cameraEnabled) {
          publication.track.disable();
        } else {
          publication.track.enable();
        }
      });
      setCameraEnabled(!cameraEnabled);
    }
  };

  const shareVitals = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${API_BASE_URL}/consultations/${consultationId}/vitals/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Your vitals have been shared with the provider');
      await fetchConsultationDetails();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to share vitals');
    }
  };

  const endCall = async () => {
    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await axios.post(
                `${API_BASE_URL}/consultations/${consultationId}/video/end`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );

              disconnectCall();
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to end consultation');
            }
          },
        },
      ]
    );
  };

  const disconnectCall = () => {
    if (twilioRoomRef.current) {
      twilioRoomRef.current.disconnect();
      twilioRoomRef.current = null;
      setConnected(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Connecting to consultation..."
        color={theme.colors.primary}
      />
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Typography variant="body" style={styles.errorText}>{error}</Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={initializeVideoCall}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
          accessibilityHint="Attempt to reconnect to the video consultation"
        >
          <Typography variant="body" weight="semibold" style={styles.retryButtonText}>
            Retry
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Containers */}
      <View style={styles.videoContainer}>
        {/* Remote Video (Provider/Patient) */}
        <div id="remote-video" style={styles.remoteVideo as any} />

        {/* Local Video (Self) */}
        <div id="local-video" style={styles.localVideo as any} />

        {/* Vitals Overlay */}
        {vitalsVisible && vitals && (
          <View style={styles.vitalsOverlay}>
            <Typography variant="body" weight="bold" style={styles.vitalsTitle}>
              Real-Time Vitals
            </Typography>
            <View style={styles.vitalsGrid}>
              {vitals.heartRate && (
                <View style={styles.vitalItem}>
                  <Typography variant="caption" style={styles.vitalLabel}>Heart Rate</Typography>
                  <Typography variant="body" weight="bold" style={styles.vitalValue}>
                    {vitals.heartRate} bpm
                  </Typography>
                </View>
              )}
              {vitals.bloodPressure && (
                <View style={styles.vitalItem}>
                  <Typography variant="caption" style={styles.vitalLabel}>Blood Pressure</Typography>
                  <Typography variant="body" weight="bold" style={styles.vitalValue}>
                    {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
                  </Typography>
                </View>
              )}
              {vitals.oxygenSaturation && (
                <View style={styles.vitalItem}>
                  <Typography variant="caption" style={styles.vitalLabel}>O2 Sat</Typography>
                  <Typography variant="body" weight="bold" style={styles.vitalValue}>
                    {vitals.oxygenSaturation}%
                  </Typography>
                </View>
              )}
              {vitals.bloodGlucose && (
                <View style={styles.vitalItem}>
                  <Typography variant="caption" style={styles.vitalLabel}>Glucose</Typography>
                  <Typography variant="body" weight="bold" style={styles.vitalValue}>
                    {vitals.bloodGlucose} mg/dL
                  </Typography>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeVitalsButton}
              onPress={() => setVitalsVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Hide vitals overlay"
              accessibilityHint="Close the real-time vitals display"
            >
              <Typography variant="caption" weight="semibold" style={styles.closeVitalsButtonText}>
                Hide
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Connection Status */}
        <View
          style={styles.statusBar}
          accessibilityLabel={connected ? 'Connected to consultation' : 'Connecting to consultation'}
          accessibilityRole="text"
        >
          <View
            style={[styles.statusIndicator, connected && styles.statusConnected]}
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography variant="body" style={styles.statusText}>
            {connected ? 'Connected' : 'Connecting...'}
          </Typography>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          {/* Microphone Toggle */}
          <TouchableOpacity
            style={[styles.controlButton, !micEnabled && styles.controlButtonDisabled]}
            onPress={toggleMic}
            accessibilityRole="button"
            accessibilityLabel={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            accessibilityHint={micEnabled ? 'Turn off your microphone' : 'Turn on your microphone'}
            accessibilityState={{ selected: micEnabled }}
          >
            <Typography
              variant="h3"
              style={styles.controlButtonText}
              importantForAccessibility="no"
              accessible={false}
            >
              {micEnabled ? '🎤' : '🔇'}
            </Typography>
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={endCall}
            accessibilityRole="button"
            accessibilityLabel="End consultation call"
            accessibilityHint="End the video consultation and return to previous screen"
          >
            <Typography variant="body" weight="bold" style={styles.endCallButtonText}>
              End Call
            </Typography>
          </TouchableOpacity>

          {/* Camera Toggle */}
          <TouchableOpacity
            style={[styles.controlButton, !cameraEnabled && styles.controlButtonDisabled]}
            onPress={toggleCamera}
            accessibilityRole="button"
            accessibilityLabel={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            accessibilityHint={cameraEnabled ? 'Disable your video camera' : 'Enable your video camera'}
            accessibilityState={{ selected: cameraEnabled }}
          >
            <Typography
              variant="h3"
              style={styles.controlButtonText}
              importantForAccessibility="no"
              accessible={false}
            >
              {cameraEnabled ? '📹' : '🚫'}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Additional Controls */}
        <View style={styles.additionalControls}>
          {!isProvider && (
            <TouchableOpacity
              style={styles.vitalsButton}
              onPress={shareVitals}
              accessibilityRole="button"
              accessibilityLabel="Share your vitals with provider"
              accessibilityHint="Send your real-time health vitals to the healthcare provider"
            >
              <Typography variant="body" weight="semibold" style={styles.vitalsButtonText}>
                Share Vitals
              </Typography>
            </TouchableOpacity>
          )}

          {isProvider && !vitalsVisible && consultation?.vitals_shared && (
            <TouchableOpacity
              style={styles.vitalsButton}
              onPress={() => setVitalsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="View patient vitals"
              accessibilityHint="Display the patient's real-time vital signs on screen"
            >
              <Typography variant="body" weight="semibold" style={styles.vitalsButtonText}>
                View Vitals
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.dark,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.dark,
    padding: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.black,
  },
  localVideo: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 150,
    height: 200,
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  vitalsOverlay: {
    position: 'absolute',
    top: theme.spacing.xl,
    left: theme.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    minWidth: 200,
  },
  vitalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  vitalsGrid: {
    gap: theme.spacing.sm,
  },
  vitalItem: {
    marginBottom: theme.spacing.sm,
  },
  vitalLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs / 2,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  closeVitalsButton: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  closeVitalsButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    backgroundColor: theme.colors.darkest,
    paddingBottom: 40,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    marginRight: theme.spacing.sm,
  },
  statusConnected: {
    backgroundColor: theme.colors.success,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 14,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: theme.colors.error,
  },
  controlButtonText: {
    fontSize: 28,
  },
  endCallButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
    borderRadius: 30,
  },
  endCallButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  additionalControls: {
    alignItems: 'center',
  },
  vitalsButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  vitalsButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VideoConsultationRoom;
