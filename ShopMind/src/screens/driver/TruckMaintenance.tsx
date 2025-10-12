import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DriverNotification } from '../../types/Driver';
import { User } from '../../types/User';

const { width, height } = Dimensions.get('window');

interface TruckMaintenanceProps {
  user: User;
  token: string;
  onBack: () => void;
}

const TruckMaintenance: React.FC<TruckMaintenanceProps> = ({ user, token, onBack }) => {
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<DriverNotification | null>(null);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // TODO: Implement API call to fetch driver notifications
    // For now, set empty notifications
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationPress = (notification: DriverNotification) => {
    setSelectedNotification(notification);
    setShowNotificationDetails(true);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: DriverNotification['type']) => {
    switch (type) {
      case 'new_order':
        return 'cube-outline';
      case 'route_change':
        return 'map-outline';
      case 'priority_order':
        return 'flag-outline';
      case 'delivery_reminder':
        return 'time-outline';
      case 'manager_update':
        return 'person-outline';
      case 'route_alert':
        return 'warning-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: DriverNotification['type'], priority: DriverNotification['priority']) => {
    if (priority === 'urgent') return '#EF4444';
    if (priority === 'high') return '#F59E0B';
    if (priority === 'medium') return '#3B82F6';
    if (priority === 'low') return '#6B7280';
    
    switch (type) {
      case 'route_alert':
        return '#EF4444';
      case 'priority_order':
        return '#F59E0B';
      case 'new_order':
        return '#3B82F6';
      case 'route_change':
        return '#8B5CF6';
      case 'delivery_reminder':
        return '#10B981';
      case 'manager_update':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationTime.toLocaleDateString();
  };

  const getPriorityText = (priority: DriverNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'URGENT';
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'low':
        return 'LOW';
      default:
        return 'NORMAL';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Unread</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Urgent</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsList}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadNotification,
                notification.priority === 'urgent' && styles.urgentNotification
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIconContainer}>
                  <Ionicons 
                    name={getNotificationIcon(notification.type) as any} 
                    size={24} 
                    color={getNotificationColor(notification.type, notification.priority)} 
                  />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadTitle
                    ]} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    {notification.priority !== 'low' && (
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getNotificationColor(notification.type, notification.priority) }
                      ]}>
                        <Text style={styles.priorityText}>
                          {getPriorityText(notification.priority)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <View style={styles.notificationFooter}>
                    <Text style={styles.notificationTime}>
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                    {notification.actionRequired && (
                      <View style={styles.actionRequiredBadge}>
                        <Text style={styles.actionRequiredText}>Action Required</Text>
                      </View>
                    )}
                  </View>
                </View>
                {!notification.read && (
                  <View style={styles.unreadDot} />
                )}
              </View>
                </TouchableOpacity>
          ))}
        </View>

        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyMessage}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Notification Details Modal */}
      <Modal
        visible={showNotificationDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotificationDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
            <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons 
                      name={getNotificationIcon(selectedNotification.type) as any} 
                      size={24} 
                      color={getNotificationColor(selectedNotification.type, selectedNotification.priority)} 
                    />
                    <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotificationDetails(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
                  <View style={styles.notificationMeta}>
                    <Text style={styles.notificationTime}>{formatTimestamp(selectedNotification.timestamp)}</Text>
                    {selectedNotification.priority !== 'low' && (
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getNotificationColor(selectedNotification.type, selectedNotification.priority) }
                      ]}>
                        <Text style={styles.priorityText}>
                          {getPriorityText(selectedNotification.priority)}
                    </Text>
                      </View>
                    )}
              </View>

                  <Text style={styles.notificationFullMessage}>
                    {selectedNotification.message}
                  </Text>

                  {selectedNotification.routeDeviation && (
                    <View style={styles.deviationInfo}>
                      <Text style={styles.sectionTitle}>Route Deviation Details</Text>
                      <View style={styles.deviationItem}>
                        <Ionicons name="location" size={16} color="#EF4444" />
                        <Text style={styles.deviationText}>
                          You are {selectedNotification.routeDeviation.deviationDistance}m off the assigned route
                        </Text>
                      </View>
                      <View style={styles.deviationItem}>
                        <Ionicons name="navigate" size={16} color="#6B7280" />
                        <Text style={styles.deviationText}>
                          Expected location: {selectedNotification.routeDeviation.expectedLocation.latitude.toFixed(4)}, {selectedNotification.routeDeviation.expectedLocation.longitude.toFixed(4)}
                </Text>
                      </View>
                    </View>
                  )}
            </ScrollView>

            <View style={styles.modalActions}>
                  {selectedNotification.actionRequired && (
              <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert('Action Required', 'Navigate to Orders tab to view details');
                        setShowNotificationDetails(false);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Take Action</Text>
              </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.dismissButton}
                    onPress={() => setShowNotificationDetails(false)}
                  >
                    <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 4,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#E0E7FF',
    marginTop: 4,
  },
  markAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#E2E8F0',
  },
  unreadNotification: {
    borderLeftColor: '#3B82F6',
    backgroundColor: '#F8FAFF',
  },
  urgentNotification: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionRequiredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionRequiredText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationFullMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  deviationInfo: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  deviationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TruckMaintenance;