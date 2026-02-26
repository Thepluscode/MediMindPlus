/**
 * WebSocket Client Hook for React Native
 *
 * Real-time communication with backend via Socket.IO
 * Features: Auto-reconnect, event subscriptions, presence tracking
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  senderName?: string;
  read: boolean;
}

interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'message' | 'alert' | 'reminder' | 'result';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface VitalSign {
  patientId: string;
  type: 'heart_rate' | 'blood_pressure' | 'temperature' | 'oxygen_saturation' | 'respiratory_rate';
  value: number | { systolic: number; diastolic: number };
  unit: string;
  timestamp: Date;
  alert?: boolean;
}

export function useWebSocket(config: WebSocketConfig = {}) {
  const {
    url = process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'http://localhost:5000',
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = config;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  /**
   * Initialize socket connection
   */
  const connect = useCallback(async () => {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setConnectionError('No authentication token found');
        return;
      }

      // Create socket instance
      const socketInstance = io(url, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts,
        reconnectionDelay,
        autoConnect: false
      });

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('[WS] Connected');
        setConnected(true);
        setConnectionError(null);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('[WS] Disconnected:', reason);
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('[WS] Connection error:', error.message);
        setConnectionError(error.message);
        setConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('[WS] Error:', error);
        setConnectionError(error.message || 'WebSocket error');
      });

      // Connect
      socketInstance.connect();

      socketRef.current = socketInstance;
      setSocket(socketInstance);

    } catch (error: any) {
      console.error('[WS] Connection failed:', error);
      setConnectionError(error.message);
    }
  }, [url, reconnectionAttempts, reconnectionDelay]);

  /**
   * Disconnect socket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
  }, []);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket,
    connected,
    connectionError,
    connect,
    disconnect
  };
}

/**
 * Chat/Messaging Hook
 */
export function useChat(conversationId: string | null) {
  const { socket, connected } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    if (!socket || !connected || !conversationId) return;

    // Join conversation
    socket.emit('chat:join', conversationId);

    // Listen for messages
    socket.on('chat:message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing
    socket.on('chat:typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTyping({ userId: data.userId, userName: data.userName });
      } else {
        setTyping(null);
      }
    });

    // Listen for read receipts
    socket.on('chat:read', (data: { userId: string; messageId: string }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, read: true } : msg
      ));
    });

    return () => {
      socket.emit('chat:leave', conversationId);
      socket.off('chat:message');
      socket.off('chat:typing');
      socket.off('chat:read');
    };
  }, [socket, connected, conversationId]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !conversationId) return;
    socket.emit('chat:message', { conversationId, message });
  }, [socket, conversationId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!socket || !conversationId) return;
    socket.emit('chat:typing', { conversationId, isTyping });
  }, [socket, conversationId]);

  const markAsRead = useCallback((messageId: string) => {
    if (!socket || !conversationId) return;
    socket.emit('chat:read', { conversationId, messageId });
  }, [socket, conversationId]);

  return {
    messages,
    typing,
    sendMessage,
    sendTyping,
    markAsRead
  };
}

/**
 * Notifications Hook
 */
export function useNotifications() {
  const { socket, connected } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for new notifications
    socket.on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show local notification (if app has permission)
      // You could integrate with expo-notifications here
    });

    return () => {
      socket.off('notification:new');
    };
  }, [socket, connected]);

  const markAsRead = useCallback((notificationId: string) => {
    if (!socket) return;

    socket.emit('notification:read', notificationId);
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [socket]);

  const clearAll = useCallback(() => {
    if (!socket) return;

    socket.emit('notification:clear');
    setNotifications([]);
    setUnreadCount(0);
  }, [socket]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll
  };
}

/**
 * Vital Signs Monitoring Hook
 */
export function useVitalSigns(patientId: string | null) {
  const { socket, connected } = useWebSocket();
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [latestVitals, setLatestVitals] = useState<Partial<Record<VitalSign['type'], VitalSign>>>({});

  useEffect(() => {
    if (!socket || !connected || !patientId) return;

    // Subscribe to patient vitals
    socket.emit('vitals:subscribe', patientId);

    // Listen for vital sign updates
    socket.on('vitals:update', (vitalSign: VitalSign) => {
      setVitalSigns(prev => [vitalSign, ...prev].slice(0, 100)); // Keep last 100
      setLatestVitals(prev => ({ ...prev, [vitalSign.type]: vitalSign }));
    });

    return () => {
      socket.emit('vitals:unsubscribe', patientId);
      socket.off('vitals:update');
    };
  }, [socket, connected, patientId]);

  return {
    vitalSigns,
    latestVitals
  };
}

/**
 * User Presence Hook
 */
export function usePresence() {
  const { socket, connected } = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for presence updates
    socket.on('user:presence', (data: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (data.status === 'online') {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });
    });

    return () => {
      socket.off('user:presence');
    };
  }, [socket, connected]);

  const isOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    onlineUsers: Array.from(onlineUsers),
    isOnline
  };
}

/**
 * Generic event listener hook
 */
export function useSocketEvent<T = any>(eventName: string, handler: (data: T) => void) {
  const { socket, connected } = useWebSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, connected, eventName, handler]);
}

/**
 * Emit event
 */
export function useSocketEmit() {
  const { socket } = useWebSocket();

  const emit = useCallback((eventName: string, data?: any) => {
    if (!socket) {
      console.warn('[WS] Cannot emit: socket not connected');
      return;
    }
    socket.emit(eventName, data);
  }, [socket]);

  return emit;
}
