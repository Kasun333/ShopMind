import * as Notifications from 'expo-notifications';
import { Vibration, Platform, Alert } from 'react-native';
import ToastService from './toastService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class InAppNotificationService {

  // Initialize notification permissions
  static async initialize(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      console.log('📱 Notification permissions:', finalStatus);
      return finalStatus === 'granted';
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  // Show local notification (works when app is active)
  static async showLocalNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
      
      console.log('🔔 Local notification shown:', title);
    } catch (error) {
      console.error('❌ Failed to show local notification:', error);
    }
  }

  // Play notification sound (system default)
  static async playNotificationSound() {
    try {
      // For now, we'll rely on the system notification sound
      // You can add expo-av later if you want custom sounds
      console.log('📢 System notification sound will play with notification');
      return true;
    } catch (error) {
      console.error('❌ Failed to prepare notification sound:', error);
      return false;
    }
  }

  // Vibrate device
  static vibrate(pattern: number[] = [100, 200, 100]) {
    if (Platform.OS === 'android') {
      Vibration.vibrate(pattern);
    } else {
      Vibration.vibrate();
    }
  }

  // Show in-app toast notification
  static showInAppToast(title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') {
    return ToastService.show(title, message, type, 5000);
  }

  // Enhanced notification with sound and vibration
  static async showEnhancedNotification(
    title: string, 
    body: string, 
    options: {
      sound?: boolean;
      vibrate?: boolean;
      local?: boolean;
      data?: any;
    } = {}
  ) {
    const { sound = true, vibrate = true, local = true, data } = options;

    try {
      // Play sound
      if (sound) {
        await this.playNotificationSound();
      }

      // Vibrate
      if (vibrate) {
        this.vibrate();
      }

      // Show local notification
      if (local) {
        await this.showLocalNotification(title, body, data);
      }

      return this.showInAppToast(title, body, 'info');
    } catch (error) {
      console.error('❌ Enhanced notification failed:', error);
      return this.showInAppToast(title, body, 'error');
    }
  }

  // Check for missed notifications when app becomes active
  static async checkMissedNotifications(userId: string, lastCheckTime: Date): Promise<any[]> {
    try {
      // This would call your notification API to get missed notifications
      const response = await fetch(`YOUR_API/notifications/missed/${userId}?since=${lastCheckTime.toISOString()}`);
      
      if (response.ok) {
        const missedNotifications = await response.json();
        
        // Show local notifications for missed messages
        for (const notification of missedNotifications) {
          await this.showLocalNotification(
            `Missed: ${notification.type}`,
            notification.message,
            notification
          );
        }
        
        return missedNotifications;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to check missed notifications:', error);
      return [];
    }
  }

  // Set app badge count
  static async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  // Clear all notifications
  static async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }
}

export default InAppNotificationService;
