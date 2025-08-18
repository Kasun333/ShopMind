import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Stay connected with stores and support</Text>
        </View>
      </LinearGradient>

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
            <Ionicons name="time-outline" size={12} color="#64748B" /> Last updated: 2025-08-18 17:22:44
          </Text>
          <Text style={styles.statusText}>
            <Ionicons name="person-outline" size={12} color="#64748B" /> {user.username}
          </Text>
        </View>
      </ScrollView>

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
});

export default MessagesScreen;