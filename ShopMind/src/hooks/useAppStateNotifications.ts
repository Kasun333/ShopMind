import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import InAppNotificationService from '../services/inAppNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseAppStateNotificationsProps {
  userId: string;
  onMissedNotifications?: (notifications: any[]) => void;
}

export const useAppStateNotifications = ({ 
  userId, 
  onMissedNotifications 
}: UseAppStateNotificationsProps) => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [notificationPermissions, setNotificationPermissions] = useState(false);
  const lastActiveTime = useRef<Date>(new Date());
  const LAST_CHECK_KEY = `last_notification_check_${userId}`;

  // Initialize notifications when component mounts
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const hasPermissions = await InAppNotificationService.initialize();
        setNotificationPermissions(hasPermissions);
        console.log('📱 In-app notifications initialized:', hasPermissions);
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed:', appState, '->', nextAppState);
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - check for missed notifications
        console.log('🔄 App came to foreground, checking for missed notifications...');
        await checkForMissedNotifications();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - save timestamp
        console.log('💾 App went to background, saving timestamp');
        lastActiveTime.current = new Date();
        await AsyncStorage.setItem(LAST_CHECK_KEY, lastActiveTime.current.toISOString());
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, userId]);

  // Check for missed notifications
  const checkForMissedNotifications = async () => {
    try {
      // Get last check time from storage
      const lastCheckString = await AsyncStorage.getItem(LAST_CHECK_KEY);
      const lastCheckTime = lastCheckString 
        ? new Date(lastCheckString) 
        : new Date(Date.now() - 30 * 60 * 1000); // Default to 30 minutes ago

      console.log('🕐 Last check time:', lastCheckTime);
      console.log('🕐 Current time:', new Date());

      // Check if enough time has passed (avoid too frequent checks)
      const timeDiff = Date.now() - lastCheckTime.getTime();
      if (timeDiff < 30000) { // Less than 30 seconds
        console.log('⏭️ Skipping check - too soon since last check');
        return;
      }

      // In-app notifications only - no missed notification API call needed
      console.log('� In-app notifications only mode - skipping missed notification check');

      // Update last check time
      await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    } catch (error) {
      console.error('❌ Error checking for missed notifications:', error);
    }
  };

  // Manual check function
  const manualCheckMissed = () => {
    return checkForMissedNotifications();
  };

  // Clear all notifications and reset badge
  const clearAllNotifications = async () => {
    try {
      await InAppNotificationService.clearAllNotifications();
      console.log('🗑️ All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  };

  // Test local notification
  const testLocalNotification = async () => {
    try {
      await InAppNotificationService.showEnhancedNotification(
        'Test Notification',
        'This is a test in-app notification with sound and vibration!',
        {
          sound: true,
          vibrate: true,
          toastType: 'info'
        }
      );
      console.log('🧪 Test notification sent');
    } catch (error) {
      console.error('❌ Test notification failed:', error);
    }
  };

  return {
    appState,
    notificationPermissions,
    manualCheckMissed,
    clearAllNotifications,
    testLocalNotification,
    isAppActive: appState === 'active',
    isAppBackground: appState.match(/inactive|background/) !== null,
  };
};

export default useAppStateNotifications;
