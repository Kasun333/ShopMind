import { useState, useEffect, useRef } from 'react';
import notificationService, { Notification, NotificationHandler } from '../services/notificationService';

export interface UseNotificationsReturn {
  notifications: Notification[];
  connected: boolean;
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  clearNotification: (notificationId: number) => void;
}

export const useNotifications = (userId: string | null): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef<NotificationHandler | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Add notification to the list
  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      // Check if notification already exists to prevent duplicates
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      // Add new notification to the beginning of the list
      return [notification, ...prev];
    });
  };

  // Mark a specific notification as read
  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
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

    // Create notification handler
    const handleNewNotification: NotificationHandler = (notification: Notification) => {
      console.log('📱 Received notification in hook:', notification);
      addNotification(notification);
    };

    // Store handler reference for cleanup
    handlerRef.current = handleNewNotification;

    // Add the handler
    notificationService.addNotificationHandler(handleNewNotification);

    // Connect to WebSocket
    notificationService.connect(userId)
      .then(() => {
        console.log('✅ Successfully connected to notifications');
        setConnected(true);
      })
      .catch((error) => {
        console.error('❌ Failed to connect to notifications:', error);
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
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearNotification
  };
};

export default useNotifications;
