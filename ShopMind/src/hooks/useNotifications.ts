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
  forceReconnect: () => Promise<void>;
  getDebugInfo: () => string;
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
      
      // Merge with existing real-time notifications (avoid duplicates)
      setNotifications(prev => {
        const existingIds = prev.map(n => n.id);
        const newNotifications = existingNotifications.filter(n => !existingIds.includes(n.id));
        
        const merged = [...prev, ...newNotifications];
        
        // Sort all notifications by timestamp (newest first)
        const sorted = merged.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        console.log(`📋 Loaded ${existingNotifications.length} from API, merged with ${prev.length} real-time. Total: ${sorted.length}`);
        return sorted;
      });
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add notification to the list
  const addNotification = (notification: Notification) => {
    console.log('🔄 Adding notification to state:', notification);
    setNotifications(prev => {
      // Check if notification already exists to prevent duplicates
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        console.log('⚠️ Notification already exists, skipping:', notification.id);
        return prev;
      }
      
      // For real-time notifications, ensure they get a timestamp if missing
      const notificationWithTimestamp = {
        ...notification,
        createdAt: notification.createdAt || new Date().toISOString()
      };
      
      // Add new notification to the beginning of the list (newest first)
      const updated = [notificationWithTimestamp, ...prev];
      
      console.log('✅ Notification added. Total count:', updated.length);
      
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

    // Create notification handler for real-time updates FIRST
    const handleNewNotification: NotificationHandler = (notification: Notification) => {
      console.log('� REAL-TIME notification received:', notification);
      addNotification(notification);
    };

    // Store handler reference for cleanup
    handlerRef.current = handleNewNotification;

    // Add the handler BEFORE connecting
    notificationService.addNotificationHandler(handleNewNotification);

    // Connect to WebSocket for real-time updates FIRST
    notificationService.connect(userId)
      .then(() => {
        console.log('✅ Successfully connected to real-time notifications');
        setConnected(true);
        
        // AFTER WebSocket is connected, load existing notifications
        setTimeout(() => {
          loadNotifications();
        }, 1000); // Small delay to ensure WebSocket is fully established
      })
      .catch((error) => {
        console.error('❌ Failed to connect to real-time notifications:', error);
        setConnected(false);
        // Still load existing notifications even if WebSocket fails
        loadNotifications();
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

  // Force reconnection function
  const forceReconnect = async () => {
    try {
      await notificationService.forceReconnect();
      setConnected(notificationService.isConnected());
    } catch (error) {
      console.error('Failed to force reconnect:', error);
    }
  };

  // Get debug info
  const getDebugInfo = () => {
    return notificationService.getConnectionDebugInfo();
  };

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
    refreshNotifications: loadNotifications,
    forceReconnect,
    getDebugInfo
  };
};

export default useNotifications;
