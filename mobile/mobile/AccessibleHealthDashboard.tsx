// Accessible Health Dashboard - Premium Mobile Experience
// WCAG 2.1 AA Compliant with Clinical-Grade Design

import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  AccessibilityInfo,
  Platform
} from 'react-native'
import { motion, AnimatePresence } from 'framer-motion/native'
import { 
  HeartIcon, 
  BrainIcon, 
  LungsIcon, 
  MicrophoneIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon
} from 'react-native-heroicons/outline'

interface HealthMetric {
  id: string
  title: string
  value: number
  unit: string
  trend: number
  category: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  description: string
  lastUpdated: string
}

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  highContrast: boolean
  reducedMotion: boolean
  voiceOver: boolean
  hapticFeedback: boolean
}

const AccessibleHealthDashboard: React.FC = () => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    voiceOver: false,
    hapticFeedback: true
  })
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  
  const screenData = Dimensions.get('window')
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  // Initialize accessibility settings
  useEffect(() => {
    const checkAccessibilitySettings = async () => {
      try {
        const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled()
        const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled()
        
        setAccessibilitySettings(prev => ({
          ...prev,
          voiceOver: isScreenReaderEnabled,
          reducedMotion: isReduceMotionEnabled
        }))
      } catch (error) {
        console.error('Error checking accessibility settings:', error)
      }
    }
    
    checkAccessibilitySettings()
    
    // Listen for accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        setAccessibilitySettings(prev => ({ ...prev, voiceOver: isEnabled }))
      }
    )
    
    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        setAccessibilitySettings(prev => ({ ...prev, reducedMotion: isEnabled }))
      }
    )
    
    return () => {
      screenReaderListener?.remove()
      reduceMotionListener?.remove()
    }
  }, [])

  // Initialize health metrics
  useEffect(() => {
    const mockMetrics: HealthMetric[] = [
      {
        id: 'overall-health',
        title: 'Overall Health Score',
        value: 85,
        unit: '/100',
        trend: 5,
        category: 'good',
        description: 'Your comprehensive health assessment based on multimodal AI analysis',
        lastUpdated: '2 minutes ago'
      },
      {
        id: 'cardiovascular',
        title: 'Cardiovascular Health',
        value: 78,
        unit: '/100',
        trend: -2,
        category: 'good',
        description: 'Heart health assessment including rhythm, stress, and risk factors',
        lastUpdated: '5 minutes ago'
      },
      {
        id: 'mental-health',
        title: 'Mental Wellness',
        value: 72,
        unit: '/100',
        trend: 8,
        category: 'fair',
        description: 'Stress levels, mood patterns, and cognitive health indicators',
        lastUpdated: '1 hour ago'
      },
      {
        id: 'respiratory',
        title: 'Respiratory Function',
        value: 88,
        unit: '/100',
        trend: 3,
        category: 'excellent',
        description: 'Breathing efficiency and lung health from voice analysis',
        lastUpdated: '30 minutes ago'
      }
    ]
    
    setHealthMetrics(mockMetrics)
    
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: accessibilitySettings.reducedMotion ? 0 : 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start()
  }, [accessibilitySettings.reducedMotion])

  // Get theme colors based on accessibility settings
  const getThemeColors = () => {
    if (accessibilitySettings.highContrast) {
      return {
        background: '#000000',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#cccccc',
        primary: '#00ff00',
        excellent: '#00ff00',
        good: '#ffff00',
        fair: '#ff8800',
        poor: '#ff4400',
        critical: '#ff0000'
      }
    }
    
    return {
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      primary: '#3b82f6',
      excellent: '#10b981',
      good: '#84cc16',
      fair: '#f59e0b',
      poor: '#ef4444',
      critical: '#dc2626'
    }
  }

  // Get font sizes based on accessibility settings
  const getFontSizes = () => {
    const baseSize = {
      small: { title: 16, body: 14, caption: 12 },
      medium: { title: 18, body: 16, caption: 14 },
      large: { title: 22, body: 18, caption: 16 },
      'extra-large': { title: 26, body: 22, caption: 18 }
    }
    
    return baseSize[accessibilitySettings.fontSize]
  }

  const colors = getThemeColors()
  const fontSizes = getFontSizes()

  // Get category color
  const getCategoryColor = (category: string) => {
    return colors[category as keyof typeof colors] || colors.fair
  }

  // Handle metric selection with haptic feedback
  const handleMetricPress = (metricId: string) => {
    if (accessibilitySettings.hapticFeedback && Platform.OS === 'ios') {
      // Haptic feedback implementation would go here
    }
    
    setSelectedMetric(selectedMetric === metricId ? null : metricId)
    
    // Announce to screen reader
    if (accessibilitySettings.voiceOver) {
      const metric = healthMetrics.find(m => m.id === metricId)
      if (metric) {
        AccessibilityInfo.announceForAccessibility(
          `${metric.title}: ${metric.value}${metric.unit}. ${metric.description}`
        )
      }
    }
  }

  // Voice recording handler
  const handleVoiceRecording = () => {
    setIsVoiceRecording(!isVoiceRecording)
    
    if (accessibilitySettings.voiceOver) {
      AccessibilityInfo.announceForAccessibility(
        isVoiceRecording ? 'Voice recording stopped' : 'Voice recording started'
      )
    }
  }

  return (
    <ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background 
      }}
      contentContainerStyle={{ padding: 16 }}
      accessibilityLabel="Health Dashboard"
      accessibilityHint="Scroll to view your health metrics and insights"
    >
      {/* Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          marginBottom: 24
        }}
      >
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Text 
            style={{ 
              fontSize: fontSizes.title + 4, 
              fontWeight: 'bold', 
              color: colors.text 
            }}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            Health Dashboard
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              accessibilityHint="View your health notifications and alerts"
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: colors.surface
              }}
            >
              <BellIcon size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Settings"
              accessibilityHint="Adjust accessibility and app settings"
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: colors.surface
              }}
            >
              <CogIcon size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text 
          style={{ 
            fontSize: fontSizes.body, 
            color: colors.textSecondary 
          }}
          accessibilityLabel="Powered by Med-PaLM M multimodal AI with clinical-grade accuracy"
        >
          Powered by Med-PaLM M • Clinical-Grade AI
        </Text>
      </Animated.View>

      {/* Voice Recording Button */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          marginBottom: 24,
          alignItems: 'center'
        }}
      >
        <TouchableOpacity
          onPress={handleVoiceRecording}
          accessibilityRole="button"
          accessibilityLabel={isVoiceRecording ? "Stop voice recording" : "Start voice recording"}
          accessibilityHint="Record your voice for health biomarker analysis"
          accessibilityState={{ selected: isVoiceRecording }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isVoiceRecording ? colors.critical : colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8
          }}
        >
          <MicrophoneIcon 
            size={32} 
            color="#ffffff" 
            style={{
              transform: isVoiceRecording ? [{ scale: 1.2 }] : [{ scale: 1 }]
            }}
          />
        </TouchableOpacity>
        
        <Text 
          style={{ 
            marginTop: 8, 
            fontSize: fontSizes.caption, 
            color: colors.textSecondary,
            textAlign: 'center'
          }}
        >
          {isVoiceRecording ? 'Recording...' : 'Tap to analyze voice'}
        </Text>
      </Animated.View>

      {/* Health Metrics Grid */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text 
          style={{ 
            fontSize: fontSizes.title, 
            fontWeight: '600', 
            color: colors.text,
            marginBottom: 16
          }}
          accessibilityRole="header"
          accessibilityLevel={2}
        >
          Your Health Metrics
        </Text>
        
        <View style={{ gap: 16 }}>
          {healthMetrics.map((metric, index) => (
            <TouchableOpacity
              key={metric.id}
              onPress={() => handleMetricPress(metric.id)}
              accessibilityRole="button"
              accessibilityLabel={`${metric.title}: ${metric.value}${metric.unit}`}
              accessibilityHint={`${metric.description}. Last updated ${metric.lastUpdated}. Double tap for details.`}
              accessibilityState={{ 
                expanded: selectedMetric === metric.id,
                selected: selectedMetric === metric.id
              }}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: selectedMetric === metric.id ? 2 : 0,
                borderColor: colors.primary
              }}
            >
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 12
              }}>
                <View style={{ flex: 1 }}>
                  <Text 
                    style={{ 
                      fontSize: fontSizes.body, 
                      fontWeight: '600', 
                      color: colors.text,
                      marginBottom: 4
                    }}
                  >
                    {metric.title}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text 
                      style={{ 
                        fontSize: fontSizes.title + 8, 
                        fontWeight: 'bold', 
                        color: getCategoryColor(metric.category)
                      }}
                    >
                      {metric.value}
                    </Text>
                    <Text 
                      style={{ 
                        fontSize: fontSizes.body, 
                        color: colors.textSecondary,
                        marginLeft: 4
                      }}
                    >
                      {metric.unit}
                    </Text>
                  </View>
                </View>
                
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: metric.trend > 0 ? colors.excellent : 
                                 metric.trend < 0 ? colors.poor : colors.textSecondary,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12
                }}>
                  <Text 
                    style={{ 
                      fontSize: fontSizes.caption, 
                      color: '#ffffff',
                      fontWeight: '600'
                    }}
                    accessibilityLabel={`Trend: ${metric.trend > 0 ? 'improving' : metric.trend < 0 ? 'declining' : 'stable'} by ${Math.abs(metric.trend)} points`}
                  >
                    {metric.trend > 0 ? '↗' : metric.trend < 0 ? '↘' : '→'} {Math.abs(metric.trend)}
                  </Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={{
                height: 6,
                backgroundColor: colors.background,
                borderRadius: 3,
                marginBottom: 8
              }}>
                <Animated.View
                  style={{
                    height: 6,
                    width: `${metric.value}%`,
                    backgroundColor: getCategoryColor(metric.category),
                    borderRadius: 3
                  }}
                />
              </View>
              
              <Text 
                style={{ 
                  fontSize: fontSizes.caption, 
                  color: colors.textSecondary 
                }}
              >
                Updated {metric.lastUpdated}
              </Text>
              
              {/* Expanded Details */}
              {selectedMetric === metric.id && (
                <Animated.View
                  style={{
                    marginTop: 16,
                    padding: 16,
                    backgroundColor: colors.background,
                    borderRadius: 12
                  }}
                >
                  <Text 
                    style={{ 
                      fontSize: fontSizes.body, 
                      color: colors.text,
                      lineHeight: fontSizes.body * 1.5
                    }}
                    accessibilityRole="text"
                  >
                    {metric.description}
                  </Text>
                  
                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      alignSelf: 'flex-start'
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`View detailed analysis for ${metric.title}`}
                    accessibilityHint="Opens detailed health insights and recommendations"
                  >
                    <Text style={{ 
                      color: '#ffffff', 
                      fontSize: fontSizes.body,
                      fontWeight: '600'
                    }}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          marginTop: 32,
          marginBottom: 16
        }}
      >
        <Text 
          style={{ 
            fontSize: fontSizes.title, 
            fontWeight: '600', 
            color: colors.text,
            marginBottom: 16
          }}
          accessibilityRole="header"
          accessibilityLevel={2}
        >
          Quick Actions
        </Text>
        
        <View style={{ 
          flexDirection: 'row', 
          gap: 12,
          flexWrap: 'wrap'
        }}>
          {[
            { icon: HeartIcon, label: 'Heart Rate', action: 'heart-rate' },
            { icon: BrainIcon, label: 'Mental Health', action: 'mental-health' },
            { icon: LungsIcon, label: 'Breathing', action: 'breathing' },
            { icon: ChartBarIcon, label: 'Reports', action: 'reports' }
          ].map((item, index) => (
            <TouchableOpacity
              key={item.action}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityHint={`Quick access to ${item.label.toLowerCase()} monitoring`}
              style={{
                flex: 1,
                minWidth: (screenData.width - 48) / 2 - 6,
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2
              }}
            >
              <item.icon size={24} color={colors.primary} />
              <Text 
                style={{ 
                  marginTop: 8,
                  fontSize: fontSizes.caption,
                  color: colors.text,
                  textAlign: 'center',
                  fontWeight: '500'
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  )
}

export default AccessibleHealthDashboard
