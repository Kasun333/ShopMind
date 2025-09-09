import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import UserOrdersComponent from '../components/UserOrdersComponent';
import NotificationCard from '../components/NotificationCard';
import useNotifications from '../hooks/useNotifications';
import notificationService, { Notification } from '../services/notificationService';

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
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications' | 'orders'>('messages');
  
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
    refreshNotifications
  } = useNotifications(user.id, token);
  
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
    if (connected) {
      const testMessage = `Test notification sent at ${new Date().toLocaleTimeString()}`;
      notificationService.sendTestNotification(testMessage, 'TEST');
      Alert.alert('Test Sent', 'A test notification has been sent!');
    } else {
      Alert.alert('Not Connected', 'Please wait for WebSocket connection to establish.');
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
        colors={['#1E6091', '#2A7CC7', '#3B95E3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Messages & Orders</Text>
          <Text style={styles.subtitle}>Stay connected and track your purchases</Text>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
            onPress={() => setActiveTab('messages')}
          >
            <Ionicons 
              name="chatbubble-outline" 
              size={16} 
              color={activeTab === 'messages' ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} 
            />
            <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
              Messages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, styles.notificationTab, activeTab === 'notifications' && styles.activeTab]}
            onPress={() => setActiveTab('notifications')}
          >
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name="notifications-outline" 
                size={16} 
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
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
            onPress={() => setActiveTab('orders')}
          >
            <Ionicons 
              name="cube-outline" 
              size={16} 
              color={activeTab === 'orders' ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} 
            />
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
              Orders
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content Area */}
      {activeTab === 'messages' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.conversationsList}>
            {conversations.map((conversation) => (
              <TouchableOpacity 
                key={conversation.id} 
                style={[styles.conversationCard, conversation.unread > 0 && styles.conversationCardUnread]}
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  <View style={[
                    styles.avatarBackground,
                    conversation.unread > 0 ? styles.avatarBackgroundUnread : null
                  ]}>
                    <Ionicons 
                      name={conversation.icon as any} 
                      size={24} 
                      color={conversation.unread > 0 ? "#FFFFFF" : "#2A7CC7"} 
                    />
                  </View>
                  {conversation.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{conversation.unread}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{conversation.name}</Text>
                    <Text style={styles.conversationTime}>{conversation.time}</Text>
                  </View>
                  <Text style={[
                    styles.lastMessage,
                    conversation.unread > 0 && styles.unreadMessage
                  ]}>
                    {conversation.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <LinearGradient
                colors={['rgba(42, 124, 199, 0.15)', 'rgba(30, 96, 145, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconContainer}
              >
                <Ionicons name="help-buoy-outline" size={24} color="#2A7CC7" />
              </LinearGradient>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Contact Support</Text>
                <Text style={styles.actionSubtitle}>Get help with your orders or account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <LinearGradient
                colors={['rgba(42, 124, 199, 0.15)', 'rgba(30, 96, 145, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconContainer}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#2A7CC7" />
              </LinearGradient>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Start New Chat</Text>
                <Text style={styles.actionSubtitle}>Connect with stores directly</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>
              <Ionicons name="time-outline" size={12} color="#64748B" /> Last updated: 2025-09-02 10:22:44
            </Text>
          </View>
        </ScrollView>
      ) : activeTab === 'notifications' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <View style={styles.statusRow}>
              <View style={[styles.connectionDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.connectionText}>
                {connected ? '🟢 Connected to notifications' : '🔴 Disconnected'}
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllReadButton}>
                <Text style={styles.markAllReadText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notifications Header */}
          <View style={styles.notificationsHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Real-time Notifications
                {notifications.length > 0 && (
                  <Text style={styles.notificationCount}> ({notifications.length})</Text>
                )}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Stay updated with your orders and activities
              </Text>
            </View>
            
            <View style={styles.notificationActions}>
              <TouchableOpacity onPress={handleRefreshNotifications} style={styles.refreshButton} disabled={isLoading}>
                <Ionicons 
                  name={isLoading ? "refresh" : "refresh-outline"} 
                  size={16} 
                  color={isLoading ? "#94A3B8" : "#10B981"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={sendTestNotification} style={styles.testButton}>
                <Ionicons name="flask-outline" size={16} color="#2A7CC7" />
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
              
              {notifications.length > 0 && (
                <TouchableOpacity onPress={handleClearAllNotifications} style={styles.clearButton}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2A7CC7" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
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
              <Ionicons name="notifications-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyNotificationsTitle}>No Notifications</Text>
              <Text style={styles.emptyNotificationsSubtitle}>
                You're all caught up! New notifications will appear here.
              </Text>
              <TouchableOpacity onPress={sendTestNotification} style={styles.testNotificationButton}>
                <LinearGradient
                  colors={['#2A7CC7', '#1E6091']}
                  style={styles.testNotificationGradient}
                >
                  <Ionicons name="flask-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.testNotificationButtonText}>Send Test Notification</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>
              <Ionicons name="time-outline" size={12} color="#64748B" /> Last updated: {new Date().toLocaleString()}
            </Text>
          </View>
        </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.3,
    paddingHorizontal: 4,
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
  connectionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(42, 124, 199, 0.1)',
    borderRadius: 16,
  },
  markAllReadText: {
    fontSize: 12,
    color: '#2A7CC7',
    fontWeight: '600',
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  notificationCount: {
    color: '#64748B',
    fontWeight: '400',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '400',
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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