import React, { useState, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import { OrderStats } from '../../types/Order';
import { useNotifications } from '../../hooks/useNotifications';
import InAppNotificationService from '../../services/inAppNotificationService';
import StoreKeeperNotificationService from '../../services/storeKeeperNotificationService';
import RevenueService, { TodayRevenue, MonthlyRevenue } from '../../services/revenueService';
import dashboardCacheService from '../../services/dashboardCacheService';

const { width } = Dimensions.get('window');

interface Activity {
  id: string;
  text: string;
  time: string;
  type: 'order' | 'status' | 'alert' | 'delivery' | 'inventory' | 'user';
  priority?: 'low' | 'medium' | 'high';
  isNew?: boolean;
  notificationId?: number;
}

interface StoreKeeperDashboardProps {
  user: User;
  token: string;
  setActiveTab?: (tab: 'dashboard' | 'orders' | 'inventory' | 'account') => void;
  onLogout?: () => void;
}

const StoreKeeperDashboard: React.FC<StoreKeeperDashboardProps> = ({ user, token, setActiveTab }) => {
  // State for activities
  const [activities, setActivities] = useState<Activity[]>([
    { id: '1', text: 'New order #ORD-2024-001 received', time: '5 min ago', type: 'order', priority: 'medium' },
    { id: '2', text: 'Order #ORD-2024-002 marked as ready', time: '15 min ago', type: 'status', priority: 'low' },
    { id: '3', text: 'Low stock alert: Wireless Headphones', time: '1 hour ago', type: 'alert', priority: 'high' },
    { id: '4', text: 'Order #ORD-2024-003 delivered', time: '2 hours ago', type: 'delivery', priority: 'low' },
  ]);

  // State for revenue data
  const [todayRevenue, setTodayRevenue] = useState<TodayRevenue | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[] | null>(null);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // State for order counts
  const [processedOrdersCount, setProcessedOrdersCount] = useState<number | null>(null);
  const [confirmedOrdersCount, setConfirmedOrdersCount] = useState<number | null>(null);
  const [orderCountsLoading, setOrderCountsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDataFromCache, setIsDataFromCache] = useState<boolean>(false);

  // Demo mode state
  const [demoMode, setDemoMode] = useState(false);

  // Real-time notifications hook
  const { 
    notifications, 
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications(user.id, token);

  // Fetch revenue and order count data
  const fetchDashboardData = async (forceRefresh: boolean = false) => {
    try {
      setRevenueLoading(true);
      setOrderCountsLoading(true);
      setRevenueError(null);
      
      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = await dashboardCacheService.getCachedDashboardData();
        if (cachedData) {
          console.log('📦 Loading from cache:', cachedData);
          
          // Set data from cache
          setTodayRevenue(cachedData.todayRevenue);
          setMonthlyRevenue(cachedData.monthlyRevenue);
          setProcessedOrdersCount(cachedData.processedOrdersCount);
          setConfirmedOrdersCount(cachedData.confirmedOrdersCount);
          setLastUpdated(cachedData.lastUpdated ? new Date(cachedData.lastUpdated) : null);
          setIsDataFromCache(true);
          
          setRevenueLoading(false);
          setOrderCountsLoading(false);
          
          console.log('✅ Dashboard data loaded from cache');
          return;
        }
      }
      
      // Fetch fresh data from API
      console.log('🌐 Fetching fresh data from API...');
      setIsDataFromCache(false);
      
      console.log('� Fetching dashboard data...');
      
      // Fetch all dashboard data in parallel
      const [todayData, monthlyData, processedCount, confirmedCount] = await Promise.all([
        RevenueService.getTodayRevenue(token),
        RevenueService.getMonthlyRevenue(token),
        RevenueService.getProcessedOrdersCount(token),
        RevenueService.getConfirmedOrdersCount(token)
      ]);

      // Update revenue data
      if (todayData) {
        setTodayRevenue(todayData);
        console.log('✅ Today\'s revenue loaded:', todayData);
      }

      if (monthlyData) {
        setMonthlyRevenue(monthlyData);
        console.log('✅ Monthly revenue loaded:', monthlyData.length, 'months');
      }

      // Update order counts
      if (processedCount !== null) {
        setProcessedOrdersCount(processedCount);
        console.log('✅ Processed orders count loaded:', processedCount);
      }

      if (confirmedCount !== null) {
        setConfirmedOrdersCount(confirmedCount);
        console.log('✅ Confirmed orders count loaded:', confirmedCount);
      }

      // Cache the fresh data
      const dashboardData = {
        todayRevenue: todayData,
        monthlyRevenue: monthlyData,
        processedOrdersCount: processedCount,
        confirmedOrdersCount: confirmedCount,
        lastUpdated: new Date().toISOString()
      };
      
      await dashboardCacheService.cacheDashboardData(dashboardData);
      console.log('💾 Dashboard data cached successfully');

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      setRevenueError('Failed to load dashboard data');
    } finally {
      setRevenueLoading(false);
      setOrderCountsLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Initialize notification system and fetch data
  useEffect(() => {
    const initDashboard = async () => {
      try {
        await InAppNotificationService.initialize();
        console.log('🏪 StoreKeeper dashboard notifications initialized');
        
        // Fetch initial dashboard data
        await fetchDashboardData();
      } catch (error) {
        console.error('❌ Failed to initialize dashboard:', error);
      }
    };

    initDashboard();
  }, [user.id, token]);

  // Convert notifications to activities
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const newActivities = notifications
        .slice(0, 10) // Show only recent 10
        .map(notification => ({
          id: `notif-${notification.id}`,
          text: notification.message,
          time: formatNotificationTime(notification.createdAt),
          type: mapNotificationTypeToActivity(notification.type),
          priority: getNotificationPriority(notification.type),
          isNew: !notification.isRead,
          notificationId: notification.id,
        }));

      // Merge with existing activities, keeping newest first
      setActivities(prevActivities => {
        const existingIds = new Set(prevActivities.map(a => a.notificationId));
        const filteredNew = newActivities.filter(a => !existingIds.has(a.notificationId));
        
        return [...filteredNew, ...prevActivities].slice(0, 15); // Keep max 15 activities
      });
    }
  }, [notifications]);

  // Calculate stats from revenue and order count data
  const stats: OrderStats = useMemo(() => {
    const currentMonthRevenue = monthlyRevenue ? RevenueService.getCurrentMonthRevenue(monthlyRevenue) : null;
    const totalOrders = (processedOrdersCount || 0) + (confirmedOrdersCount || 0);
    
    return {
      totalOrders: totalOrders,
      pendingOrders: confirmedOrdersCount || 0, // Confirmed orders are pending to be processed
      completedOrders: processedOrdersCount || 0, // Processed orders are completed
      cancelledOrders: 0, // We'll need another API for this
      todayRevenue: todayRevenue?.revenue || 0,
      monthRevenue: currentMonthRevenue?.revenue || 0,
    };
  }, [todayRevenue, monthlyRevenue, processedOrdersCount, confirmedOrdersCount]);

  const quickActions = [
    { id: '1', title: 'View Orders', icon: 'receipt-outline', color: '#10B981' },
    { id: '2', title: 'Manage Inventory', icon: 'cube-outline', color: '#059669' },
    { id: '3', title: 'Add Product', icon: 'add-circle-outline', color: '#047857' },
    { id: '4', title: 'Reports', icon: 'bar-chart-outline', color: '#065F46' },
  ];

  // Helper functions
  const formatNotificationTime = (createdAt: string): string => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const mapNotificationTypeToActivity = (type: string): Activity['type'] => {
    switch (type.toLowerCase()) {
      case 'order_new':
      case 'order_received':
      case 'order': 
        return 'order';
      case 'order_completed':
      case 'order_ready':
      case 'status':
        return 'status';
      case 'inventory_low':
      case 'stock_alert':
      case 'alert':
        return 'alert';
      case 'order_delivered':
      case 'delivery':
        return 'delivery';
      case 'inventory_updated':
      case 'product_added':
        return 'inventory';
      case 'user_registered':
      case 'user':
        return 'user';
      default:
        return 'status';
    }
  };

  const getNotificationPriority = (type: string): Activity['priority'] => {
    switch (type.toLowerCase()) {
      case 'inventory_low':
      case 'stock_alert':
      case 'order_cancelled':
        return 'high';
      case 'order_new':
      case 'order_received':
        return 'medium';
      default:
        return 'low';
    }
  };

  // Memoized sorted activities
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      // Sort by priority first, then by newness
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority || 'low'] || 1) - (priorityOrder[a.priority || 'low'] || 1);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by new status
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      
      return 0;
    });
  }, [activities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return 'cart-outline';
      case 'status': return 'checkmark-circle-outline';
      case 'alert': return 'alert-circle-outline';
      case 'delivery': return 'car-outline';
      case 'inventory': return 'cube-outline';
      case 'user': return 'person-outline';
      default: return 'document-text-outline';
    }
  };

  const getActivityIconColor = (activity: Activity) => {
    if (activity.isNew) {
      switch (activity.priority) {
        case 'high': return '#DC2626'; // Red for urgent
        case 'medium': return '#D97706'; // Orange for medium
        case 'low': return '#059669'; // Green for low
        default: return '#059669';
      }
    }
    
    // Non-new activities get muted colors
    switch (activity.type) {
      case 'alert': return '#EF4444';
      case 'order': return '#10B981';
      case 'status': return '#3B82F6';
      case 'delivery': return '#8B5CF6';
      case 'inventory': return '#F59E0B';
      case 'user': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleActivityPress = async (activity: Activity) => {
    // Handle activity press based on type
    console.log('🎯 Activity pressed:', activity);
    
    // Mark as read if it's a new notification
    if (activity.isNew && activity.notificationId) {
      try {
        // Mark as read in backend
        await markAsRead(activity.notificationId);
        console.log('✅ Notification marked as read:', activity.notificationId);
        
        // Update local state
        setActivities(prev => 
          prev.map(a => 
            a.id === activity.id ? { ...a, isNew: false } : a
          )
        );
      } catch (error) {
        console.error('❌ Failed to mark notification as read:', error);
      }
    }

    // Navigate based on activity type
    switch (activity.type) {
      case 'order':
        setActiveTab?.('orders');
        break;
      case 'inventory':
      case 'alert':
        setActiveTab?.('inventory');
        break;
      default:
        // Show more details or navigate to relevant screen
        break;
    }
  };

  // Refresh dashboard data
  const refreshDashboardData = async () => {
    await fetchDashboardData();
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
  const username = user.username || user.fullName || "StoreKeeper";

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
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => fetchDashboardData(true)}
              style={styles.refreshButton}
              disabled={revenueLoading || orderCountsLoading}
            >
              <Ionicons 
                name="refresh-outline" 
                size={20} 
                color="rgba(255,255,255,0.9)" 
              />
              {isDataFromCache && (
                <View style={styles.cacheIndicator}>
                  <Text style={styles.cacheText}>📦</Text>
                </View>
              )}
            </TouchableOpacity>
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
                    <Text style={styles.statNumber}>
                      {orderCountsLoading ? '...' : stats.pendingOrders}
                    </Text>
                    <Text style={styles.statLabel}>To Process</Text>
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
                    <Text style={styles.statNumber}>
                      {orderCountsLoading ? '...' : stats.completedOrders}
                    </Text>
                    <Text style={styles.statLabel}>Processed</Text>
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
                    {revenueLoading ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : revenueError ? (
                      <Text style={styles.statError}>Error</Text>
                    ) : (
                      <>
                        <Text style={styles.statNumber}>
                          {RevenueService.formatCurrency(stats.todayRevenue, todayRevenue?.currency)}
                        </Text>
                        {todayRevenue && (
                          <Text style={styles.statSubtext}>
                            {todayRevenue.count} orders today
                          </Text>
                        )}
                      </>
                    )}
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
                    {revenueLoading ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : revenueError ? (
                      <Text style={styles.statError}>Error</Text>
                    ) : (
                      <>
                        <Text style={styles.statNumber}>
                          {stats.monthRevenue >= 1000 
                            ? `${RevenueService.formatCurrency(stats.monthRevenue / 1000, monthlyRevenue?.[0]?.currency).slice(0, -3)}k`
                            : RevenueService.formatCurrency(stats.monthRevenue, monthlyRevenue?.[0]?.currency)
                          }
                        </Text>
                        {monthlyRevenue && (
                          <Text style={styles.statSubtext}>
                            {RevenueService.getCurrentMonthRevenue(monthlyRevenue)?.count || 0} orders this month
                          </Text>
                        )}
                      </>
                    )}
                    <Text style={styles.statLabel}>This Month</Text>
                  </View>
                  <View style={[
                    styles.statIconContainer,
                    monthlyRevenue && RevenueService.getMonthlyGrowth(monthlyRevenue) && 
                    RevenueService.getMonthlyGrowth(monthlyRevenue)! > 0 
                      ? { backgroundColor: '#10B981' } 
                      : { backgroundColor: '#6B7280' }
                  ]}>
                    <Ionicons name="trending-up-outline" size={26} color="#FFFFFF" />
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
                  <Text style={styles.summaryValue}>
                    {orderCountsLoading ? 'Loading...' : stats.totalOrders}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>To Process:</Text>
                  <View style={styles.valueBadge}>
                    <Text style={[styles.summaryValue, styles.pendingText]}>
                      {orderCountsLoading ? '...' : stats.pendingOrders}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Processed:</Text>
                  <View style={[styles.valueBadge, styles.successBadge]}>
                    <Text style={[styles.summaryValue, styles.successText]}>
                      {orderCountsLoading ? '...' : stats.completedOrders}
                    </Text>
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

          {/* Revenue Insights */}
          {monthlyRevenue && monthlyRevenue.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.titleWithTime}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="analytics-outline" size={20} color="#047857" /> Revenue Insights
                  </Text>
                  {lastUpdated && (
                    <Text style={styles.lastUpdated}>
                      Updated: {lastUpdated.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={refreshDashboardData} style={styles.refreshButton}>
                  <Ionicons name="refresh-outline" size={16} color="#047857" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.insightsContainer}>
                <LinearGradient
                  colors={['#F8FAFC', '#E2E8F0']}
                  style={styles.insightsGradient}
                >
                  {/* Monthly Growth */}
                  {RevenueService.getMonthlyGrowth(monthlyRevenue) !== null && (
                    <View style={styles.insightItem}>
                      <View style={styles.insightIcon}>
                        <Ionicons 
                          name={RevenueService.getMonthlyGrowth(monthlyRevenue)! >= 0 ? "trending-up" : "trending-down"} 
                          size={20} 
                          color={RevenueService.getMonthlyGrowth(monthlyRevenue)! >= 0 ? "#10B981" : "#EF4444"} 
                        />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={styles.insightLabel}>Monthly Growth</Text>
                        <Text style={[
                          styles.insightValue,
                          { color: RevenueService.getMonthlyGrowth(monthlyRevenue)! >= 0 ? "#10B981" : "#EF4444" }
                        ]}>
                          {RevenueService.getMonthlyGrowth(monthlyRevenue)! >= 0 ? "+" : ""}
                          {RevenueService.getMonthlyGrowth(monthlyRevenue)}%
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Year Total */}
                  <View style={styles.insightItem}>
                    <View style={styles.insightIcon}>
                      <Ionicons name="calendar" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightLabel}>Year Total</Text>
                      <Text style={styles.insightValue}>
                        {RevenueService.formatCurrency(
                          RevenueService.getTotalYearRevenue(monthlyRevenue), 
                          monthlyRevenue[0]?.currency
                        )}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Average per Month */}
                  <View style={styles.insightItem}>
                    <View style={styles.insightIcon}>
                      <Ionicons name="bar-chart" size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightLabel}>Avg/Month</Text>
                      <Text style={styles.insightValue}>
                        {RevenueService.formatCurrency(
                          RevenueService.getTotalYearRevenue(monthlyRevenue) / 12, 
                          monthlyRevenue[0]?.currency
                        )}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="time-outline" size={20} color="#047857" /> Recent Activities
              </Text>
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity 
                    onPress={async () => {
                      try {
                        await markAllAsRead();
                        // Update all activities to mark as read
                        setActivities(prev => 
                          prev.map(a => ({ ...a, isNew: false }))
                        );
                        console.log('✅ All notifications marked as read');
                      } catch (error) {
                        console.error('❌ Failed to mark all as read:', error);
                      }
                    }}
                    style={styles.markAllReadButton}
                  >
                    <Ionicons name="checkmark-done" size={14} color="#047857" />
                    <Text style={styles.markAllReadText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.liveIndicator}>
                  <View style={[styles.liveDot, { backgroundColor: isLoading ? '#F59E0B' : '#10B981' }]} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => StoreKeeperNotificationService.sendOrderNotification(`ORD-${Date.now()}`, 'new')}
                  style={styles.demoButton}
                >
                  <Ionicons name="flash" size={12} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.activitiesContainer}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                style={styles.activitiesGradient}
              >
                {/* Real-time connection status */}
                <View style={styles.connectionStatus}>
                  <View style={[
                    styles.connectionIndicator,
                    { backgroundColor: isLoading ? '#F59E0B' : '#10B981' }
                  ]} />
                  <Text style={styles.connectionText}>
                    {isLoading ? 'Connecting...' : 'Live Updates'}
                  </Text>
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>

                {/* Loading state */}
                {isLoading && sortedActivities.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#047857" />
                    <Text style={styles.loadingText}>Loading activities...</Text>
                  </View>
                ) : (
                  <>
                    {sortedActivities.map((activity: Activity, index: number) => (
                      <TouchableOpacity 
                        key={activity.id} 
                        style={[
                          styles.activityItem,
                          index < sortedActivities.length - 1 && styles.activityBorder,
                          activity.isNew && styles.newActivityItem
                        ]}
                        onPress={() => handleActivityPress(activity)}
                      >
                        <View style={[
                          styles.activityIconContainer,
                          { backgroundColor: getActivityIconColor(activity) }
                        ]}>
                          <Ionicons 
                            name={getActivityIcon(activity.type)} 
                            size={18} 
                            color="#FFFFFF" 
                          />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={[
                            styles.activityText,
                            activity.isNew && styles.newActivityText
                          ]}>
                            {activity.text}
                          </Text>
                          <View style={styles.activityMeta}>
                            <Text style={styles.activityTime}>{activity.time}</Text>
                            {activity.priority === 'high' && (
                              <View style={styles.priorityBadge}>
                                <Ionicons name="alert" size={12} color="#DC2626" />
                                <Text style={styles.priorityText}>Urgent</Text>
                              </View>
                            )}
                            {activity.isNew && (
                              <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>NEW</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))}

                    {/* Empty state */}
                    {sortedActivities.length === 0 && !isLoading && (
                      <View style={styles.emptyState}>
                        <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyStateText}>No recent activities</Text>
                        <Text style={styles.emptyStateSubtext}>
                          New notifications will appear here in real-time
                        </Text>
                      </View>
                    )}
                  </>
                )}
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
  // Real-time notification styles
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  notificationBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  newActivityItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  newActivityText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 2,
  },
  newBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  // Section header styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  markAllReadText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
    marginLeft: 4,
  },
  demoButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Revenue specific styles
  statError: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  // Revenue insights styles
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  insightsContainer: {
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
  insightsGradient: {
    padding: 20,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  // Title with time styles
  titleWithTime: {
    flex: 1,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  // Header actions styles
  // Removed duplicate headerActions style to fix object literal error
  cacheIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cacheText: {
    fontSize: 8,
    color: 'white',
  },
});

export default StoreKeeperDashboard;