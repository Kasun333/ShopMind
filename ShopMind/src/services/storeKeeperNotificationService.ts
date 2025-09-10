import { InAppNotificationService } from './inAppNotificationService';

export class StoreKeeperNotificationService {
  
  // Send different types of StoreKeeper-specific notifications
  static async sendOrderNotification(orderId: string, type: 'new' | 'ready' | 'completed' | 'cancelled') {
    const notifications = {
      new: {
        title: 'New Order',
        message: `New order #${orderId} received`,
        sound: 'notification' as const,
        priority: 'medium' as const
      },
      ready: {
        title: 'Order Ready',
        message: `Order #${orderId} is ready for pickup`,
        sound: 'success' as const,
        priority: 'low' as const
      },
      completed: {
        title: 'Order Completed',
        message: `Order #${orderId} has been delivered`,
        sound: 'success' as const,
        priority: 'low' as const
      },
      cancelled: {
        title: 'Order Cancelled',
        message: `Order #${orderId} has been cancelled`,
        sound: 'warning' as const,
        priority: 'medium' as const
      }
    };

    const notification = notifications[type];
    
    return await InAppNotificationService.showEnhancedNotification(
      notification.title,
      notification.message,
      {
        sound: notification.sound,
        vibrate: true,
        local: true,
        toastType: type === 'cancelled' ? 'warning' : type === 'new' ? 'info' : 'success'
      }
    );
  }

  static async sendInventoryAlert(productName: string, stockLevel: number) {
    return await InAppNotificationService.showEnhancedNotification(
      'Low Stock Alert',
      `${productName} is running low (${stockLevel} left)`,
      {
        sound: 'warning',
        vibrate: true,
        local: true,
        toastType: 'warning'
      }
    );
  }

  static async sendUserRegistrationNotification(userName: string) {
    return await InAppNotificationService.showEnhancedNotification(
      'New User',
      `${userName} has registered`,
      {
        sound: 'notification',
        vibrate: true,
        local: true,
        toastType: 'info'
      }
    );
  }

  static async sendSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    const soundMap = {
      info: 'notification' as const,
      warning: 'warning' as const,
      error: 'error' as const
    };

    return await InAppNotificationService.showEnhancedNotification(
      'System Notification',
      message,
      {
        sound: soundMap[type],
        vibrate: true,
        local: true,
        toastType: type
      }
    );
  }

  // Demo function to simulate real-time notifications
  static startDemoNotifications() {
    const demoNotifications = [
      () => this.sendOrderNotification('ORD-2025-001', 'new'),
      () => this.sendInventoryAlert('Wireless Headphones', 3),
      () => this.sendOrderNotification('ORD-2025-002', 'ready'),
      () => this.sendUserRegistrationNotification('John Smith'),
      () => this.sendSystemNotification('System backup completed successfully', 'info'),
    ];

    // Send a random demo notification every 30-60 seconds
    const sendRandomNotification = () => {
      const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
      randomNotification();
      
      // Schedule next notification
      setTimeout(sendRandomNotification, Math.random() * 30000 + 30000); // 30-60 seconds
    };

    // Start after 10 seconds
    setTimeout(sendRandomNotification, 10000);
  }
}

export default StoreKeeperNotificationService;
