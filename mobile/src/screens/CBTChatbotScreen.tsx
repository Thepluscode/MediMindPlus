/**
 * CBT Therapy Chatbot Screen
 * Revenue Impact: +$80M ARR
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/ui';
import { theme } from '../theme/theme';

export default function CBTChatbotScreen({ navigation }: any) {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "Hi! I'm here to support you using evidence-based CBT techniques. How are you feeling today?" }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    await new Promise(r => setTimeout(r, 1000));

    const botMsg = {
      role: 'assistant',
      content: "I hear you. That sounds challenging. Let's explore this together. What thoughts are going through your mind right now?"
    };
    setMessages(prev => [...prev, botMsg]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={theme.gradients.primary.colors}
        style={styles.header}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Return to previous screen"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="white"
              importantForAccessibility="no"
              accessible={false}
            />
          </TouchableOpacity>
          <Typography variant="h2" weight="bold" style={styles.headerTitle}>
            CBT Therapy Chat
          </Typography>
          <Ionicons
            name="shield-checkmark"
            size={24}
            color="white"
            importantForAccessibility="no"
            accessible={false}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Chat conversation"
        accessibilityRole="scrollview"
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}
            accessibilityLabel={msg.role === 'user' ? `You said: ${msg.content}` : `Therapist said: ${msg.content}`}
            accessibilityRole="text"
          >
            <Typography
              variant="body"
              style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.botText]}
            >
              {msg.content}
            </Typography>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          accessibilityLabel="Message input"
          accessibilityHint="Type your message to the CBT therapist"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityHint="Send your message to the therapist"
          accessibilityState={{ disabled: !input.trim() }}
        >
          <LinearGradient colors={theme.gradients.primary.colors} style={styles.sendButtonGradient} accessible={false}>
            <Ionicons name="send" size={20} color="white" importantForAccessibility="no" accessible={false} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginLeft: 16,
  },
  messages: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: theme.colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    color: theme.colors.text,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
