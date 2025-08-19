import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
    { id: '1', title: 'View Orders', icon: 'receipt-outline', color: '#10B981' },
    { id: '2', title: 'Manage Inventory', icon: 'cube-outline', color: '#059669' },
    { id: '3', title: 'Add Product', icon: 'add-circle-outline', color: '#047857' },
    { id: '4', title: 'Reports', icon: 'bar-chart-outline', color: '#065F46' },
  ];

  const recentActivities = [
    { id: '1', text: 'New order #ORD-2024-001 received', time: '5 min ago', type: 'order' },
    { id: '2', text: 'Order #ORD-2024-002 marked as ready', time: '15 min ago', type: 'status' },
    { id: '3', text: 'Low stock alert: Wireless Headphones', time: '1 hour ago', type: 'alert' },
    { id: '4', text: 'Order #ORD-2024-003 delivered', time: '2 hours ago', type: 'delivery' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return 'cart-outline';
      case 'status': return 'checkmark-circle-outline';
      case 'alert': return 'alert-circle-outline';
      case 'delivery': return 'car-outline';
      default: return 'document-text-outline';
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

  const currentDate = "2025-08-18 18:07:23";
  const username = "Kasun333";

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={['#047857', '#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.mainContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userRole}>Store Manager</Text>
          </View>
          <View style={styles.profileContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.profileBadge}
            >
              <Text style={styles.profileText}>
                {user.fullName.split(' ').map(name => name[0]).join('').toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.statusIndicator} />
          </View>
        </View>
        
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTimeText}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" /> {currentDate}
          </Text>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.statGradient}
                >
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="hourglass-outline" size={26} color="#F59E0B" />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.statGradient}
                >
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>{stats.completedOrders}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="checkmark-circle-outline" size={26} color="#10B981" />
                  </View>
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#FAFBFC']}
                  style={styles.statGradient}
                >
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>${stats.todayRevenue.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>Today Revenue</Text>
                  </View>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="cash-outline" size={26} color="#10B981" />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.statGradient}
                >
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>${(stats.monthRevenue / 1000).toFixed(1)}k</Text>
                    <Text style={styles.statLabel}>Month</Text>
                  </View>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="trending-up-outline" size={26} color="#10B981" />
                  </View>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="analytics-outline" size={20} color="#047857" /> Order Summary
            </Text>
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Orders:</Text>
                  <Text style={styles.summaryValue}>{stats.totalOrders}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pending:</Text>
                  <View style={styles.valueBadge}>
                    <Text style={[styles.summaryValue, styles.pendingText]}>{stats.pendingOrders}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Completed:</Text>
                  <View style={[styles.valueBadge, styles.successBadge]}>
                    <Text style={[styles.summaryValue, styles.successText]}>{stats.completedOrders}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cancelled:</Text>
                  <View style={[styles.valueBadge, styles.errorBadge]}>
                    <Text style={[styles.summaryValue, styles.errorText]}>{stats.cancelledOrders}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="flash-outline" size={20} color="#047857" /> Quick Actions
            </Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity 
                  key={action.id} 
                  style={styles.actionCard}
                  onPress={() => handleQuickAction(action.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ECFDF5', '#D1FAE5']}
                    style={styles.actionGradient}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                      <Ionicons name={action.icon as any} size={24} color={action.color} />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="time-outline" size={20} color="#047857" /> Recent Activities
            </Text>
            <View style={styles.activitiesContainer}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                style={styles.activitiesGradient}
              >
                {recentActivities.map((activity, index) => (
                  <View key={activity.id} style={[
                    styles.activityItem,
                    index < recentActivities.length - 1 && styles.activityBorder
                  ]}>
                    <View style={[
                      styles.activityIconContainer,
                      activity.type === 'alert' ? styles.alertIcon : 
                      activity.type === 'order' ? styles.orderIcon : 
                      activity.type === 'status' ? styles.statusIcon : 
                      styles.deliveryIcon
                    ]}>
                      <Ionicons name={getActivityIcon(activity.type)} size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>{activity.text}</Text>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                ))}
              </LinearGradient>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              <Ionicons name="person-outline" size={12} color="#64748B" /> {username}
            </Text>
            <Text style={styles.footerText}>© 2025 ShopMind</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  mainContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  profileContainer: {
    position: 'relative',
  },
  profileBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
    bottom: 0,
    right: 0,
  },
  dateTimeContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  dateTimeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    paddingBottom: 20,
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
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  statGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryGradient: {
    padding: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(4, 120, 87, 0.1)',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
  },
  pendingText: {
    color: '#F59E0B',
  },
  successText: {
    color: '#059669',
  },
  errorText: {
    color: '#EF4444',
  },
  valueBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  errorBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    height: 110,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    textAlign: 'center',
  },
  activitiesContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activitiesGradient: {
    padding: 6,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(4, 120, 87, 0.1)',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertIcon: {
    backgroundColor: '#F59E0B',
  },
  orderIcon: {
    backgroundColor: '#6366F1',
  },
  statusIcon: {
    backgroundColor: '#10B981',
  },
  deliveryIcon: {
    backgroundColor: '#8B5CF6',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
});

export default StoreKeeperDashboard;