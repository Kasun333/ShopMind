import SockJS from 'sockjs-client';
import { Stomp, CompatClient, Frame, Message } from '@stomp/stompjs';
import { WEBSOCKET_URL, NOTIFICATION_API_URL } from '../config/apiConfig';

export interface Notification {
  id: number;
  userId: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export type NotificationHandler = (notification: Notification) => void;

class NotificationService {
  private stompClient: CompatClient | null = null;
  private connected: boolean = false;
  private userId: string | null = null;
  private notificationHandlers: NotificationHandler[] = [];
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.userId = null;
  }

  // Connect to WebSocket server
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userId = userId;
      this.connectionAttempts++;

      try {
        console.log(`🔌 Attempting to connect to WebSocket: ${WEBSOCKET_URL}`);
        
        // Create WebSocket connection using SockJS
        const socket = new SockJS(WEBSOCKET_URL);
        this.stompClient = Stomp.over(socket);

        // Disable debug logging in production
        this.stompClient.debug = (str: string) => {
          console.log('STOMP Debug:', str);
        };

        // Connect to server
        this.stompClient.connect(
          {}, // Headers
          (frame: Frame) => {
            console.log('✅ Connected to WebSocket notifications:', frame);
            this.connected = true;
            this.connectionAttempts = 0;

            // Subscribe to personal notifications
            this.stompClient?.subscribe('/user/queue/notifications', (message: Message) => {
              try {
                const notification: Notification = JSON.parse(message.body);
                console.log('🔔 REAL-TIME NOTIFICATION RECEIVED:', notification);
                console.log('📱 Message body:', message.body);
                console.log('👥 Active handlers:', this.notificationHandlers.length);
                this.handleNotification(notification);
              } catch (error) {
                console.error('❌ Error parsing notification:', error);
                console.error('📨 Raw message:', message);
              }
            });

            // Subscribe to broadcast notifications (optional)
            this.stompClient?.subscribe('/topic/notifications', (message: Message) => {
              try {
                const notification: Notification = JSON.parse(message.body);
                console.log('📢 Received broadcast notification:', notification);
                this.handleNotification(notification);
              } catch (error) {
                console.error('❌ Error parsing broadcast notification:', error);
              }
            });

            // Send user identification to server
            this.stompClient?.send("/app/subscribe", {}, JSON.stringify({
              userId: userId.toString()
            }));

            console.log(`👤 Subscribed user ${userId} to notifications`);
            resolve();
          },
          (error: any) => {
            console.error('❌ WebSocket connection error:', error);
            this.connected = false;
            
            // Retry connection if attempts are within limit
            if (this.connectionAttempts < this.maxConnectionAttempts) {
              console.log(`🔄 Retrying connection in 5 seconds... (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
              this.reconnectTimeout = setTimeout(() => {
                this.connect(userId).then(resolve).catch(reject);
              }, 5000);
            } else {
              reject(new Error(`Failed to connect after ${this.maxConnectionAttempts} attempts`));
            }
          }
        );
      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Handle incoming notifications
  private handleNotification(notification: Notification): void {
    console.log('🎯 handleNotification called with:', notification);
    console.log('📋 Number of handlers to call:', this.notificationHandlers.length);
    
    // Call all registered notification handlers
    this.notificationHandlers.forEach((handler, index) => {
      try {
        console.log(`🔄 Calling handler ${index + 1}/${this.notificationHandlers.length}`);
        handler(notification);
        console.log(`✅ Handler ${index + 1} completed successfully`);
      } catch (error) {
        console.error(`❌ Error in notification handler ${index + 1}:`, error);
      }
    });
  }

  // Add a notification handler
  addNotificationHandler(handler: NotificationHandler): void {
    this.notificationHandlers.push(handler);
  }

  // Remove a notification handler
  removeNotificationHandler(handler: NotificationHandler): void {
    const index = this.notificationHandlers.indexOf(handler);
    if (index > -1) {
      this.notificationHandlers.splice(index, 1);
    }
  }

  // Send a test notification (for development)
  sendTestNotification(message: string, type: string = 'TEST'): void {
    console.log('🧪 Sending test notification...');
    console.log('🔗 Connected:', this.connected);
    console.log('🏭 STOMP Client exists:', !!this.stompClient);
    console.log('👤 User ID:', this.userId);
    
    if (this.stompClient && this.connected) {
      const testNotification = {
        userId: this.userId,
        message: message,
        type: type,
        timestamp: new Date().toISOString()
      };
      
      try {
        this.stompClient.send("/app/test", {}, JSON.stringify(testNotification));
        console.log('📤 Test notification sent successfully:', testNotification);
      } catch (error) {
        console.error('❌ Error sending test notification:', error);
      }
    } else {
      console.warn('⚠️ Cannot send notification - WebSocket not connected');
      console.warn('  - Connected:', this.connected);
      console.warn('  - STOMP Client:', !!this.stompClient);
    }
  }

  // Method to check connection status and debug info
  getConnectionInfo(): any {
    return {
      connected: this.connected,
      userId: this.userId,
      stompClientExists: !!this.stompClient,
      handlersCount: this.notificationHandlers.length,
      connectionAttempts: this.connectionAttempts
    };
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.stompClient && this.connected) {
      this.stompClient.disconnect();
      this.connected = false;
      this.connectionAttempts = 0;
      console.log('🔌 Disconnected from WebSocket notifications');
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.connected;
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.userId;
  }

  // Reconnect if disconnected
  reconnect(): Promise<void> {
    if (!this.userId) {
      return Promise.reject(new Error('No user ID available for reconnection'));
    }
    
    if (this.connected) {
      return Promise.resolve();
    }

    return this.connect(this.userId);
  }

  // Force reconnection (disconnect and reconnect)
  forceReconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.userId) {
        reject(new Error('No user ID available for reconnection'));
        return;
      }

      console.log('🔄 Force reconnecting WebSocket...');
      
      // Disconnect first
      this.disconnect();
      
      // Wait a moment then reconnect
      setTimeout(() => {
        this.connect(this.userId!)
          .then(() => {
            console.log('✅ Force reconnection successful');
            resolve();
          })
          .catch((error) => {
            console.error('❌ Force reconnection failed:', error);
            reject(error);
          });
      }, 1000);
    });
  }

  // Get connection debug info
  getConnectionDebugInfo(): string {
    return `
WebSocket Status: ${this.connected ? 'Connected' : 'Disconnected'}
User ID: ${this.userId || 'None'}
Connection Attempts: ${this.connectionAttempts}/${this.maxConnectionAttempts}
WebSocket URL: ${WEBSOCKET_URL}
Handlers Count: ${this.notificationHandlers.length}
STOMP Client: ${this.stompClient ? 'Initialized' : 'Not Initialized'}
    `.trim();
  }

  // API Methods for fetching and managing notifications
  
  // Get all notifications for a specific user
  async getUserNotifications(userId: string, token?: string): Promise<Notification[]> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`📡 Fetching notifications for user: ${userId}`);
      const response = await fetch(`${NOTIFICATION_API_URL}/api/notifications/user/${userId}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const notifications: Notification[] = await response.json();
        console.log(`✅ Fetched ${notifications.length} notifications`);
        
        // Sort notifications by createdAt (newest first)
        notifications.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        return notifications;
      } else {
        console.error('❌ Failed to fetch notifications:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: number, token?: string): Promise<boolean> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`📖 Marking notification ${notificationId} as read`);
      const response = await fetch(`${NOTIFICATION_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers,
      });

      if (response.ok) {
        console.log(`✅ Notification ${notificationId} marked as read`);
        return true;
      } else {
        console.error('❌ Failed to mark notification as read:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  }

  // Batch mark multiple notifications as read
  async markMultipleNotificationsAsRead(notificationIds: number[], token?: string): Promise<boolean> {
    try {
      const results = await Promise.all(
        notificationIds.map(id => this.markNotificationAsRead(id, token))
      );
      
      return results.every(result => result === true);
    } catch (error) {
      console.error('❌ Error marking multiple notifications as read:', error);
      return false;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
