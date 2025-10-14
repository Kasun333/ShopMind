import { WEBSOCKET_URL, NOTIFICATION_API_URL } from '../config/apiConfig';
import InAppNotificationService from './inAppNotificationService';

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
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private userId: string | null = null;
  private notificationHandlers: NotificationHandler[] = [];
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private receivedNotificationIds: Set<number> = new Set();
  private processedNotifications: Set<number> = new Set(); // Track processed notification IDs

  constructor() {
    this.ws = null;
    this.connected = false;
    this.userId = null;
  }

  // Connect to WebSocket server using native WebSocket
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userId = userId;
      this.connectionAttempts++;

      try {
        // Use native WebSocket - NOT SockJS/STOMP
        // Convert http:// to ws://
        const wsUrl = WEBSOCKET_URL.replace('http://', 'ws://').replace('https://', 'wss://');
        const fullUrl = `${wsUrl}/rn-notifications`;
        
        console.log(`🔌 Attempting to connect to WebSocket: ${fullUrl}`);
        
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to WebSocket notifications');
          this.connected = true;
          this.connectionAttempts = 0;
          
          // Subscribe with userId
          this.ws?.send(JSON.stringify({
            type: 'subscribe',
            userId: userId
          }));
          
          console.log(`👤 Subscribed user ${userId} to notifications`);
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('\n' + '='.repeat(80));
          console.log('📨 WEBSOCKET MESSAGE RECEIVED');
          console.log('🕒 Time: ' + new Date().toLocaleTimeString());
          console.log('-'.repeat(80));
          try {
            console.log('📦 Raw message:', event.data);
            const data = JSON.parse(event.data);
            console.log('📋 Parsed data:', JSON.stringify(data, null, 2));
            if (data.type === 'notification') {
              console.log('🔔 Message Type: NOTIFICATION');
              console.log('👤 Target User ID:', data.userId);
              console.log('👤 Current User ID:', userId);
              // Double-check userId matches
              if (data.userId === userId) {
                if (this.receivedNotificationIds.has(data.id)) {
                  console.log('⚠️ Duplicate notification received, ignoring. ID:', data.id);
                  return;
                }
                this.receivedNotificationIds.add(data.id);
                console.log('✅ User ID Match - Processing notification');
                console.log('💬 Message:', data.message);
                // Convert to Notification format
                const notification: Notification = {
                  id: data.id || Date.now(),
                  userId: data.userId,
                  message: data.message,
                  type: data.notificationType || data.type,
                  createdAt: data.createdAt || new Date().toISOString(),
                  isRead: data.isRead || false
                };
                console.log('📤 Sending to handleNotification:', JSON.stringify(notification, null, 2));
                this.handleNotification(notification);
              } else {
                console.log('⚠️ User ID Mismatch - Ignoring notification');
                console.log(`   Expected: ${userId}`);
                console.log(`   Received: ${data.userId}`);
              }
            } else {
              console.log('ℹ️ Message Type:', data.type || 'unknown');
            }
          } catch (error) {
            console.log('❌ ERROR PARSING MESSAGE');
            console.error('Error details:', error);
          }
          console.log('='.repeat(80) + '\n');
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
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
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket connection closed');
          this.connected = false;
        };

      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Handle incoming notifications
  private async handleNotification(notification: Notification): Promise<void> {
    console.log('🎯 handleNotification called with:', notification);
    console.log('📋 Number of handlers to call:', this.notificationHandlers.length);
    
    try {
      // Determine sound type based on notification type/content
      let soundType: 'notification' | 'success' | 'error' | 'warning' = 'notification';
      let toastType: 'success' | 'info' | 'warning' | 'error' = 'info';
      
      // Map notification types to sound types
      switch (notification.type?.toLowerCase()) {
        case 'order_completed':
        case 'order_delivered':
        case 'success':
          soundType = 'success';
          toastType = 'success';
          break;
        case 'order_cancelled':
        case 'error':
        case 'failed':
          soundType = 'error';
          toastType = 'error';
          break;
        case 'order_delayed':
        case 'warning':
        case 'alert':
          soundType = 'warning';
          toastType = 'warning';
          break;
        default:
          soundType = 'notification';
          toastType = 'info';
      }

      // Show enhanced in-app notification with appropriate sound
      await InAppNotificationService.showEnhancedNotification(
        `${notification.type} Notification`,
        notification.message,
        {
          sound: soundType,
          vibrate: true,
          toastType: toastType
        }
      );
      
      console.log(`✅ Enhanced notification shown with ${soundType} sound`);
    } catch (error) {
      console.error('❌ Failed to show enhanced notification:', error);
    }
    
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
    console.log('🏭 WebSocket exists:', !!this.ws);
    console.log('👤 User ID:', this.userId);
    
    if (this.ws && this.connected) {
      const testNotification = {
        type: 'test',
        userId: this.userId,
        message: message,
        notificationType: type,
        timestamp: new Date().toISOString()
      };
      
      try {
        this.ws.send(JSON.stringify(testNotification));
        console.log('📤 Test notification sent successfully:', testNotification);
      } catch (error) {
        console.error('❌ Error sending test notification:', error);
      }
    } else {
      console.warn('⚠️ Cannot send notification - WebSocket not connected');
      console.warn('  - Connected:', this.connected);
      console.warn('  - WebSocket:', !!this.ws);
    }
  }

  // Method to check connection status and debug info
  getConnectionInfo(): any {
    return {
      connected: this.connected,
      userId: this.userId,
      wsExists: !!this.ws,
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

    if (this.ws && this.connected) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.connectionAttempts = 0;
      this.userId = null;
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
WebSocket: ${this.ws ? 'Initialized' : 'Not Initialized'}
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
