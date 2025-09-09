import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Notification } from '../services/notificationService';

interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: number) => void;
  onDelete?: (notificationId: number) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete
}) => {
  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ORDER':
        return 'cube-outline';
      case 'DELIVERY':
        return 'bicycle-outline';
      case 'PAYMENT':
        return 'card-outline';
      case 'SYSTEM':
        return 'settings-outline';
      case 'PROMOTION':
        return 'gift-outline';
      case 'TEST':
        return 'flask-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ORDER':
        return '#2A7CC7';
      case 'DELIVERY':
        return '#10B981';
      case 'PAYMENT':
        return '#F59E0B';
      case 'SYSTEM':
        return '#6B7280';
      case 'PROMOTION':
        return '#EF4444';
      case 'TEST':
        return '#8B5CF6';
      default:
        return '#2A7CC7';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown time';
    }
  };

  const iconName = getTypeIcon(notification.type);
  const typeColor = getTypeColor(notification.type);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unreadContainer
      ]}
      onPress={() => onPress?.(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[`${typeColor}15`, `${typeColor}10`]}
            style={[styles.iconBackground, { borderColor: `${typeColor}30` }]}
          >
            <Ionicons
              name={iconName as any}
              size={24}
              color={typeColor}
            />
          </LinearGradient>
          {!notification.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: typeColor }]} />
          )}
        </View>

        {/* Content */}
        <View style={styles.messageContainer}>
          <View style={styles.header}>
            <Text style={[styles.type, { color: typeColor }]}>
              {notification.type}
            </Text>
            <Text style={styles.time}>
              {formatTime(notification.createdAt)}
            </Text>
          </View>
          
          <Text style={[
            styles.message,
            !notification.isRead && styles.unreadMessage
          ]}>
            {notification.message}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!notification.isRead && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onMarkAsRead?.(notification.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete?.(notification.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadContainer: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#2A7CC7',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContainer: {
    flex: 1,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    color: '#64748B',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#1E293B',
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginVertical: 2,
  },
});

export default NotificationCard;
