import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

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
      avatar: '🛍️'
    },
    {
      id: '2',
      name: 'Order #1234',
      lastMessage: 'Your order has been shipped!',
      time: '1 hour ago',
      unread: 0,
      avatar: '📦'
    },
    {
      id: '3',
      name: 'Electronics Store',
      lastMessage: 'New deals available on smartphones',
      time: '3 hours ago',
      unread: 1,
      avatar: '📱'
    },
    {
      id: '4',
      name: 'Fashion Hub',
      lastMessage: 'Thank you for your purchase!',
      time: '1 day ago',
      unread: 0,
      avatar: '👕'
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Stay connected with stores and support</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.conversationsList}>
          {conversations.map((conversation) => (
            <TouchableOpacity key={conversation.id} style={styles.conversationCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{conversation.avatar}</Text>
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
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🆘</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Contact Support</Text>
              <Text style={styles.actionSubtitle}>Get help with your orders or account</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Start New Chat</Text>
              <Text style={styles.actionSubtitle}>Connect with stores directly</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  conversationsList: {
    marginBottom: 30,
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    fontSize: 32,
    textAlign: 'center',
    width: 48,
    height: 48,
    lineHeight: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    overflow: 'hidden',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#0F172A',
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default MessagesScreen;
