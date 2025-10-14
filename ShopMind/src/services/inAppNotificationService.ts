import { Audio } from 'expo-av';
import { Vibration, Platform } from 'react-native';
import ToastService from './toastService';

export class InAppNotificationService {
  private static soundObject: Audio.Sound | null = null;

  // Initialize audio system
  static async initialize(): Promise<boolean> {
    try {
      // Initialize audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('🔊 Audio system initialized');
      console.log('📱 In-app notifications ready (toast only)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
      return false;
    }
  }

  // Play short notification sound
  static async playNotificationSound() {
    try {
      await this.playSound('notification');
      return true;
    } catch (error) {
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

        console.log(`� Short ${type} notification sound played`);
      } catch (audioError) {
        // Silently fail - vibration is enough
        console.log(`� Using vibration only for ${type} notification`);
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

  // Show in-app toast notification (PRIMARY METHOD)
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
      toastType?: 'success' | 'info' | 'warning' | 'error';
    } = {}
  ) {
    const { sound = true, vibrate = true, toastType = 'info' } = options;

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

      // Show toast notification
      return this.showInAppToast(title, body, toastType);
    } catch (error) {
      console.error('❌ Enhanced notification failed:', error);
      return this.showInAppToast(title, body, 'error');
    }
  }

  // Deprecated methods - kept for backward compatibility but do nothing
  static async setBadgeCount(count: number) {
    console.log(`📱 Badge count would be: ${count} (Expo notifications removed)`);
  }

  static async clearAllNotifications() {
    console.log('📱 Clear notifications called (Expo notifications removed)');
  }
}

export default InAppNotificationService;
