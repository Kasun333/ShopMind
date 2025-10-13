import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
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
  private static soundObject: Audio.Sound | null = null;

  // Initialize notification permissions and sound system
  static async initialize(): Promise<boolean> {
    try {
      // Initialize audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Preload notification sound
      await this.loadNotificationSound();

      // Setup Android notification channel (required for Android 8.0+)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Create additional channels for different notification types
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('alerts', {
          name: 'Important Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        console.log('📱 Android notification channels configured');
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive important updates.',
          [{ text: 'OK' }]
        );
      }
      
      console.log('📱 Notification permissions:', finalStatus);
      console.log('🔊 Audio system initialized');
      return finalStatus === 'granted';
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  // Load notification sound
  static async loadNotificationSound() {
    try {
      if (this.soundObject) {
        await this.soundObject.unloadAsync();
      }
      
      // Use a built-in system sound or simple beep
      // For Expo Go, we'll create a simple programmatic sound
      console.log('🔊 Sound system ready (using system sounds)');
    } catch (error) {
      console.warn('⚠️ Could not initialize sound system:', error);
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
          ...(Platform.OS === 'android' && {
            channelId: data?.type === 'alert' ? 'alerts' : 
                       data?.type?.includes('order') ? 'orders' : 'default',
          }),
        },
        trigger: null, // Show immediately
      });
      
      console.log('🔔 Local notification shown:', title);
    } catch (error) {
      console.error('❌ Failed to show local notification:', error);
    }
  }

  // Play short notification sound
  static async playNotificationSound() {
    try {
      // Play short, subtle notification sound
      await this.playSound('notification');
      return true;
    } catch (error) {
      // Silent fallback
      return false;
    }
  }

  // Play short, subtle notification sounds
  static async playSound(type: 'notification' | 'success' | 'error' | 'warning' = 'notification') {
    try {
      // Very subtle vibration patterns
      const vibrationPatterns = {
        notification: [50],       // Very short buzz
        success: [30, 30, 30],    // Triple very short buzz
        error: [80],              // Single short buzz
        warning: [50, 30, 50],    // Quick double buzz
      };

      // Short, subtle sound URLs
      const soundUrls = {
        notification: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
        success: 'https://actions.google.com/sounds/v1/cartoon/pop_up_01.ogg',
        error: 'https://actions.google.com/sounds/v1/cartoon/pop_down_01.ogg',
        warning: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
      };

      // Play short vibration
      this.vibrate(vibrationPatterns[type]);

      try {
        // Play very short, quiet sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: soundUrls[type] },
          { 
            shouldPlay: true, 
            volume: 0.08,  // Very quiet
            rate: 1.5,     // Faster = shorter
            shouldCorrectPitch: false,
          }
        );

        // Auto-unload when finished
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });

        console.log(`🔊 Short ${type} notification sound played`);
      } catch (audioError) {
        // Silently fail - vibration is enough
        console.log(`📳 Using vibration only for ${type} notification`);
      }
      
      return true;
    } catch (error) {
      // Minimal error logging for production
      console.log(`📳 Notification ${type} (vibration only)`);
      return false;
    }
  }

  // Vibrate device (subtle)
  static vibrate(pattern: number[] = [50]) {
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
      sound?: boolean | 'notification' | 'success' | 'error' | 'warning';
      vibrate?: boolean;
      local?: boolean;
      data?: any;
      toastType?: 'success' | 'info' | 'warning' | 'error';
    } = {}
  ) {
    const { sound = true, vibrate = true, local = true, data, toastType = 'info' } = options;

    try {
      // Play sound
      if (sound) {
        if (typeof sound === 'string') {
          await this.playSound(sound);
        } else {
          await this.playNotificationSound();
        }
      }

      // Vibrate
      if (vibrate) {
        this.vibrate();
      }

      // Show local notification
      if (local) {
        await this.showLocalNotification(title, body, data);
      }

      return this.showInAppToast(title, body, toastType);
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
