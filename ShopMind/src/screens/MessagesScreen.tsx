import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import UserOrdersComponent from '../components/UserOrdersComponent';
import NotificationCard from '../components/NotificationCard';
import NotificationSkeleton from '../components/NotificationSkeleton';
import useNotifications from '../hooks/useNotifications';
import useAppStateNotifications from '../hooks/useAppStateNotifications';
import notificationService, { Notification } from '../services/notificationService';
import InAppNotificationService from '../services/inAppNotificationService';

const { width } = Dimensions.get('window');

interface MessagesScreenProps {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  token: string;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'orders'>('notifications');
  
  // Use notifications hook
  const {
    notifications,
    connected,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearNotification,
    refreshNotifications,
    forceReconnect,
    getDebugInfo
  } = useNotifications(user.id, token);

  // Add debug state
  const [showDebug, setShowDebug] = useState(false);

  // Use app state notifications for background/foreground handling
  const {
    notificationPermissions,
    testLocalNotification,
    clearAllNotifications: clearLocalNotifications,
    manualCheckMissed,
    isAppActive
  } = useAppStateNotifications({
    userId: user.id,
    onMissedNotifications: (missed) => {
      console.log('📬 Received missed notifications:', missed.length);
      // You could add these to your notifications state here
    }
  });
  
  const conversations = [
    {
      id: '1',
      name: 'ShopMind Support',
      lastMessage: 'How can we help you today?',
      time: '2 min ago',
      unread: 2,
      icon: 'headset-outline'
    },
    {
      id: '2',
      name: 'Order #1234',
      lastMessage: 'Your order has been shipped!',
      time: '1 hour ago',
      unread: 0,
      icon: 'cube-outline'
    },
    {
      id: '3',
      name: 'Electronics Store',
      lastMessage: 'New deals available on smartphones',
      time: '3 hours ago',
      unread: 1,
      icon: 'phone-portrait-outline'
    },
    {
      id: '4',
      name: 'Fashion Hub',
      lastMessage: 'Thank you for your purchase!',
      time: '1 day ago',
      unread: 0,
      icon: 'shirt-outline'
    },
  ];

  // Handle notification actions
  const handleNotificationPress = async (notification: Notification) => {
    console.log('Notification pressed:', notification);
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Add logic to navigate based on notification type
    switch (notification.type) {
      case 'ORDER':
        setActiveTab('orders');
        break;
      case 'DELIVERY':
        // Navigate to delivery tracking if available
        break;
      // Add more cases as needed
    }
  };

  const sendTestNotification = () => {
    const connectionInfo = notificationService.getConnectionInfo();
    console.log('🔍 Connection Debug Info:', connectionInfo);
    
    if (connected) {
      const testMessage = `🧪 Test notification sent at ${new Date().toLocaleTimeString()}`;
      notificationService.sendTestNotification(testMessage, 'TEST');
      Alert.alert('Test Sent', 'A test notification has been sent! Check console for details.');
    } else {
      console.log('❌ Cannot send test - not connected');
      console.log('📊 Debug info:', connectionInfo);
      Alert.alert(
        'Not Connected', 
        `WebSocket not connected. Debug info:\n\nConnected: ${connectionInfo.connected}\nHandlers: ${connectionInfo.handlersCount}\nUser ID: ${connectionInfo.userId}`
      );
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearNotifications }
      ]
    );
  };



  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const handleRefreshNotifications = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#072033ff', '#2A7CC7', '#245e91ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Activity Center</Text>
          <Text style={styles.subtitle}>Track your orders and stay updated</Text>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, styles.notificationTab, activeTab === 'notifications' && styles.activeTab]}
            onPress={() => setActiveTab('notifications')}
          >
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name="notifications" 
                size={18} 
                color={activeTab === 'notifications' ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} 
              />
              {unreadCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
              Notifications
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
            onPress={() => setActiveTab('orders')}
          >
            <Ionicons 
              name="receipt" 
              size={18} 
              color={activeTab === 'orders' ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} 
            />
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
              Orders
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content Area */}
      {activeTab === 'notifications' ? (
        <View style={styles.content}>
          {/* Fixed Notifications Header */}
          <View style={styles.notificationsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: 'rgba(42, 124, 199, 0.1)', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <MaterialCommunityIcons name="bell-ring" size={22} color="#2A7CC7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Notifications
                  {notifications.length > 0 && (
                    <Text style={styles.notificationCount}> • {notifications.length}</Text>
                  )}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Stay updated with your activities
                </Text>
              </View>
            </View>
            
            <View style={styles.notificationActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllReadButton}>
                  <Ionicons name="checkmark-done" size={16} color="#10B981" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity onPress={handleRefreshNotifications} style={styles.refreshButton} disabled={isLoading}>
                <Ionicons 
                  name="refresh" 
                  size={18} 
                  color={isLoading ? "#94A3B8" : "#6366F1"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Notifications List */}
          <ScrollView style={styles.notificationsScrollView} showsVerticalScrollIndicator={false}>
            {/* Loading State with Shimmer */}
            {isLoading && (
              <View style={styles.notificationsList}>
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </View>
            )}

            {/* Notifications List */}
            {!isLoading && notifications.length > 0 ? (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onPress={handleNotificationPress}
                    onMarkAsRead={markAsRead}
                    onDelete={clearNotification}
                  />
                ))}
              </View>
            ) : !isLoading && (
              <View style={styles.emptyNotifications}>
                <View style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: 50, 
                  backgroundColor: 'rgba(42, 124, 199, 0.1)', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: 20
                }}>
                  <Ionicons name="notifications-outline" size={50} color="#2A7CC7" />
                </View>
                <Text style={styles.emptyNotificationsTitle}>No Notifications Yet</Text>
                <Text style={styles.emptyNotificationsSubtitle}>
                  You're all caught up! New notifications will appear here.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        <UserOrdersComponent 
          userId={parseInt(user.id)} 
          token={token} 
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <LinearGradient
          colors={['#2A7CC7', '#1E6091']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  notificationTab: {
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -20,
  },
  notificationsScrollView: {
    flex: 1,
  },
  conversationsList: {
    marginBottom: 24,
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationCardUnread: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: '#2A7CC7',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarBackground: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(42, 124, 199, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBackgroundUnread: {
    backgroundColor: '#2A7CC7',
  },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    letterSpacing: -0.2,
  },
  conversationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  unreadMessage: {
    color: '#1F2937',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#1E6091',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '400',
  },
  // Tab styles
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  // Notification styles
  connectionStatus: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  permissionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 2,
  },
  reconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2A7CC7',
    borderRadius: 12,
    marginLeft: 8,
  },
  reconnectText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  debugButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    marginLeft: 8,
  },
  debugInfo: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  markAllReadButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#F8FAFC',
  },
  notificationCount: {
    color: '#64748B',
    fontWeight: '400',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '400',
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(42, 124, 199, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(42, 124, 199, 0.2)',
  },
  testButtonText: {
    fontSize: 12,
    color: '#2A7CC7',
    fontWeight: '600',
    marginLeft: 4,
  },
  localTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  localTestButtonText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  notificationsList: {
    paddingBottom: 16,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyNotificationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyNotificationsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  testNotificationButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  testNotificationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  testNotificationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

});

export default MessagesScreen;