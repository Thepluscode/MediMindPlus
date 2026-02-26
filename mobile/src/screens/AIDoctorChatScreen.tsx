import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

const suggestedTopics = [
  { icon: 'favorite', text: 'Heart Health', query: 'Tell me about maintaining heart health' },
  { icon: 'restaurant', text: 'Nutrition Tips', query: 'Give me healthy eating recommendations' },
  { icon: 'fitness-center', text: 'Exercise Plan', query: 'Create an exercise plan for me' },
  { icon: 'mood', text: 'Mental Health', query: 'How can I improve my mental wellbeing?' },
  { icon: 'local-hospital', text: 'Symptoms', query: 'Help me understand my symptoms' },
  { icon: 'healing', text: 'Medications', query: 'Tell me about my medications' },
];

const AIDoctorChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI Health Assistant. I can help answer questions about health, wellness, nutrition, exercise, and more. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const simulateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword-based responses (in production, this would call an AI API)
    if (lowerMessage.includes('heart') || lowerMessage.includes('cardiovascular')) {
      return "For heart health, I recommend: \n\n1. Regular exercise (150 minutes/week)\n2. Heart-healthy diet (fruits, vegetables, whole grains)\n3. Manage stress through mindfulness\n4. Monitor blood pressure regularly\n5. Limit sodium intake\n\nWould you like specific recommendations based on your health data?";
    }

    if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('eat')) {
      return "For optimal nutrition:\n\n• Eat a variety of colorful fruits and vegetables\n• Choose whole grains over refined grains\n• Include lean proteins (fish, poultry, legumes)\n• Limit processed foods and added sugars\n• Stay hydrated with water\n• Practice portion control\n\nWould you like a personalized meal plan?";
    }

    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('fitness')) {
      return "Here's a balanced exercise approach:\n\n• Cardio: 30 min, 5 days/week (walking, jogging, cycling)\n• Strength: 2-3 days/week (bodyweight or weights)\n• Flexibility: Daily stretching\n• Rest: 1-2 days/week\n\nStart slow and gradually increase intensity. Always warm up and cool down!";
    }

    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
      return "For better sleep:\n\n• Maintain consistent sleep schedule\n• Create a relaxing bedtime routine\n• Keep bedroom cool and dark\n• Avoid screens 1 hour before bed\n• Limit caffeine after 2 PM\n• Exercise regularly (but not before bed)\n\nAim for 7-9 hours per night. Track your sleep patterns to identify improvements!";
    }

    if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('mental')) {
      return "Mental health is crucial! Try these stress management techniques:\n\n• Mindfulness meditation (10-15 min daily)\n• Deep breathing exercises\n• Regular physical activity\n• Connect with loved ones\n• Maintain work-life balance\n• Consider journaling\n\nIf stress persists, speaking with a mental health professional can be very beneficial.";
    }

    if (lowerMessage.includes('symptom')) {
      return "I can help you understand symptoms, but remember:\n\n⚠️ I'm not a replacement for medical diagnosis\n⚠️ For urgent symptoms, seek immediate medical care\n\nPlease describe your symptoms in detail:\n• What are you experiencing?\n• When did it start?\n• How severe is it (1-10)?\n• Any triggers or patterns?\n\nThis will help me provide better guidance.";
    }

    // Default response
    return "I understand you're asking about: \"" + userMessage + "\"\n\nI'm here to help! Could you provide more details so I can give you the best guidance? You can ask me about:\n\n• Health conditions\n• Nutrition & diet\n• Exercise & fitness\n• Mental wellbeing\n• Medications\n• Preventive care\n\nWhat would you like to know more about?";
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsAiTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse = simulateAIResponse(userMessage.text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsAiTyping(false);
    }, 1500);
  };

  const handleSuggestedTopic = (query: string) => {
    setInputText(query);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.header}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Icon
            name="arrow-back"
            size={24}
            color="#fff"
            importantForAccessibility="no"
            accessible={false}
          />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Typography variant="h3" color="inverse">AI Health Assistant</Typography>
          <View
            style={styles.statusIndicator}
            accessibilityLabel="AI assistant is online"
            accessibilityRole="text"
          >
            <View
              style={styles.statusDot}
              importantForAccessibility="no"
              accessible={false}
            />
            <Typography variant="caption" color="inverse" style={styles.statusText}>
              Online
            </Typography>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="More options"
          accessibilityHint="Open additional menu options"
        >
          <Icon
            name="more-vert"
            size={24}
            color="#fff"
            importantForAccessibility="no"
            accessible={false}
          />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Chat conversation with AI health assistant"
          accessibilityRole="scrollview"
        >
          {/* Suggested Topics (shown at start) */}
          {messages.length === 1 && (
            <View style={styles.suggestedTopicsContainer}>
              <Typography variant="bodySmall" color="secondary" weight="semibold" style={styles.suggestedTopicsTitle}>
                Suggested Topics
              </Typography>
              <View style={styles.suggestedTopicsGrid}>
                {suggestedTopics.map((topic, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.topicCard}
                    onPress={() => handleSuggestedTopic(topic.query)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask about ${topic.text}`}
                    accessibilityHint={`Fill input with question about ${topic.text.toLowerCase()}`}
                  >
                    <Icon
                      name={topic.icon}
                      size={24}
                      color={theme.colors.primary}
                      importantForAccessibility="no"
                      accessible={false}
                    />
                    <Typography variant="bodySmall" color="primary" weight="medium">
                      {topic.text}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer,
              ]}
              accessibilityLabel={
                message.sender === 'user'
                  ? `You said: ${message.text}`
                  : `AI assistant said: ${message.text}`
              }
              accessibilityRole="text"
            >
              {message.sender === 'ai' && (
                <View
                  style={styles.aiAvatar}
                  importantForAccessibility="no"
                  accessible={false}
                >
                  <Icon
                    name="smart-toy"
                    size={20}
                    color="white"
                    importantForAccessibility="no"
                    accessible={false}
                  />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Typography
                  variant="body"
                  color={message.sender === 'user' ? 'inverse' : 'primary'}
                  style={styles.messageText}
                >
                  {message.text}
                </Typography>
                <Typography
                  variant="caption"
                  color={message.sender === 'user' ? 'inverse' : 'secondary'}
                  style={styles.messageTime}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </View>
            </View>
          ))}

          {/* AI Typing Indicator */}
          {isAiTyping && (
            <View
              style={[styles.messageContainer, styles.aiMessageContainer]}
              accessibilityLabel="AI assistant is typing"
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
            >
              <View
                style={styles.aiAvatar}
                importantForAccessibility="no"
                accessible={false}
              >
                <Icon
                  name="smart-toy"
                  size={20}
                  color="white"
                  importantForAccessibility="no"
                  accessible={false}
                />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                <LoadingSpinner size="small" color={theme.colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about your health..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={500}
              accessibilityLabel="Type your health question"
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityHint="Send your health question to the AI assistant"
              accessibilityState={{ disabled: !inputText.trim() }}
            >
              <Icon
                name="send"
                size={20}
                color={inputText.trim() ? 'white' : theme.colors.textTertiary}
                importantForAccessibility="no"
                accessible={false}
              />
            </TouchableOpacity>
          </View>
          <Typography variant="caption" color="secondary" align="center" style={styles.disclaimer}>
            ⚠️ This AI provides general information only. Always consult healthcare professionals for medical advice.
          </Typography>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xxs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    opacity: 0.9,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  suggestedTopicsContainer: {
    marginBottom: theme.spacing.lg,
  },
  suggestedTopicsTitle: {
    marginBottom: theme.spacing.sm,
  },
  suggestedTopicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
  },
  messageBubble: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
  },
  aiBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typingBubble: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  messageText: {
    lineHeight: 22,
  },
  messageTime: {
    marginTop: theme.spacing.xxs,
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    maxHeight: 100,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.background,
  },
  disclaimer: {
    marginTop: theme.spacing.xs,
  },
});

export default AIDoctorChatScreen;
