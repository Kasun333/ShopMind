import { useState, useEffect, useRef } from 'react';
import notificationService, { Notification, NotificationHandler } from '../services/notificationService';

export interface UseNotificationsReturn {
  notifications: Notification[];
  connected: boolean;
  isLoading: boolean;
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  clearNotification: (notificationId: number) => void;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = (userId: string | null, token?: string): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handlerRef = useRef<NotificationHandler | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Load existing notifications from API
  const loadNotifications = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const existingNotifications = await notificationService.getUserNotifications(userId, token);
      setNotifications(existingNotifications);
      console.log(`📋 Loaded ${existingNotifications.length} existing notifications`);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add notification to the list
  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      // Check if notification already exists to prevent duplicates
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      // Add new notification to the beginning of the list (newest first)
      const updated = [notification, ...prev];
      
      // Sort to ensure newest notifications are always at the top
      return updated.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  };

  // Mark a specific notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const success = await notificationService.markNotificationAsRead(notificationId, token);
      if (success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      if (unreadIds.length > 0) {
        const success = await notificationService.markMultipleNotificationsAsRead(unreadIds, token);
        if (success) {
          setNotifications(prev => 
            prev.map(n => ({ ...n, isRead: true }))
          );
        }
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Clear a specific notification
  const clearNotification = (notificationId: number) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  useEffect(() => {
    if (!userId) {
      // If no user ID, disconnect and clear notifications
      notificationService.disconnect();
      setConnected(false);
      setNotifications([]);
      return;
    }

    // Load existing notifications from API first
    loadNotifications();

    // Create notification handler for real-time updates
    const handleNewNotification: NotificationHandler = (notification: Notification) => {
      console.log('📱 Received real-time notification:', notification);
      addNotification(notification);
    };

    // Store handler reference for cleanup
    handlerRef.current = handleNewNotification;

    // Add the handler
    notificationService.addNotificationHandler(handleNewNotification);

    // Connect to WebSocket for real-time updates
    notificationService.connect(userId)
      .then(() => {
        console.log('✅ Successfully connected to real-time notifications');
        setConnected(true);
      })
      .catch((error) => {
        console.error('❌ Failed to connect to real-time notifications:', error);
        setConnected(false);
      });

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      const isConnected = notificationService.isConnected();
      setConnected(isConnected);

      // Auto-reconnect if disconnected
      if (!isConnected && userId) {
        console.log('🔄 Attempting to reconnect...');
        notificationService.reconnect()
          .then(() => {
            console.log('✅ Reconnected successfully');
            setConnected(true);
          })
          .catch((error) => {
            console.error('❌ Reconnection failed:', error);
          });
      }
    }, 10000); // Check every 10 seconds

    // Cleanup function
    return () => {
      clearInterval(statusInterval);
      
      if (handlerRef.current) {
        notificationService.removeNotificationHandler(handlerRef.current);
        handlerRef.current = null;
      }
      
      // Don't disconnect here as other components might be using it
      // notificationService.disconnect();
    };
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        notificationService.removeNotificationHandler(handlerRef.current);
      }
    };
  }, []);

  return {
    notifications,
    connected,
    isLoading,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearNotification,
    refreshNotifications: loadNotifications
  };
};

export default useNotifications;
