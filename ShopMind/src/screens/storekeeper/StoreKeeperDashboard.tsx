import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { User } from '../../types/User';
import { OrderStats } from '../../types/Order';

const { width } = Dimensions.get('window');

interface StoreKeeperDashboardProps {
  user: User;
  token: string;
  setActiveTab?: (tab: 'dashboard' | 'orders' | 'inventory' | 'account') => void;
  onLogout?: () => void;
}

const StoreKeeperDashboard: React.FC<StoreKeeperDashboardProps> = ({ user, token, setActiveTab }) => {
  // Hardcoded stats for demonstration
  const stats: OrderStats = {
    totalOrders: 156,
    pendingOrders: 12,
    completedOrders: 132,
    cancelledOrders: 12,
    todayRevenue: 1245.67,
    monthRevenue: 23456.89,
  };

  const quickActions = [
    { id: '1', title: 'View Orders', icon: '📋', color: '#3B82F6' },
    { id: '2', title: 'Manage Inventory', icon: '📦', color: '#10B981' },
    { id: '3', title: 'Add Product', icon: '➕', color: '#8B5CF6' },
    { id: '4', title: 'Reports', icon: '📊', color: '#F59E0B' },
  ];

  const recentActivities = [
    { id: '1', text: 'New order #ORD-2024-001 received', time: '5 min ago', type: 'order' },
    { id: '2', text: 'Order #ORD-2024-002 marked as ready', time: '15 min ago', type: 'status' },
    { id: '3', text: 'Low stock alert: Wireless Headphones', time: '1 hour ago', type: 'alert' },
    { id: '4', text: 'Order #ORD-2024-003 delivered', time: '2 hours ago', type: 'delivery' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return '🆕';
      case 'status': return '✅';
      case 'alert': return '⚠️';
      case 'delivery': return '🚚';
      default: return '📝';
    }
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case '1': // View Orders
        setActiveTab?.('orders');
        break;
      case '2': // Manage Inventory
        setActiveTab?.('inventory');
        break;
      case '3': // Add Product
        // TODO: Navigate to add product
        break;
      case '4': // Reports
        // TODO: Navigate to reports
        break;
      default:
        break;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.userName}>{user.fullName}</Text>
        </View>
        <View style={styles.profileBadge}>
          <Text style={styles.profileText}>
            {user.fullName.split(' ').map(name => name[0]).join('').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
            <Text style={styles.statIcon}>⏳</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.statNumber}>{stats.completedOrders}</Text>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statIcon}>✅</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <Text style={styles.statNumber}>${stats.todayRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
            <Text style={styles.statIcon}>💰</Text>
          </View>
          <View style={[styles.statCard, styles.monthCard]}>
            <Text style={styles.statNumber}>${(stats.monthRevenue / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Month Revenue</Text>
            <Text style={styles.statIcon}>📈</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.actionCard}
              onPress={() => handleQuickAction(action.id)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Text style={styles.actionIconText}>{action.icon}</Text>
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.activitiesContainer}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Orders:</Text>
            <Text style={styles.summaryValue}>{stats.totalOrders}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending:</Text>
            <Text style={[styles.summaryValue, styles.pendingText]}>{stats.pendingOrders}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completed:</Text>
            <Text style={[styles.summaryValue, styles.successText]}>{stats.completedOrders}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cancelled:</Text>
            <Text style={[styles.summaryValue, styles.errorText]}>{stats.cancelledOrders}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  monthCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  statIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 24,
    opacity: 0.7,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconText: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  activitiesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  activityIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  pendingText: {
    color: '#F59E0B',
  },
  successText: {
    color: '#10B981',
  },
  errorText: {
    color: '#EF4444',
  },
});

export default StoreKeeperDashboard;
