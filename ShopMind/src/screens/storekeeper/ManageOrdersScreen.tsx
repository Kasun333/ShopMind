import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderFilters } from '../../types/Order';
import { User } from '../../types/User';
import OrderCard from '../../components/storekeeper/OrderCard';
import OrderFilter from '../../components/storekeeper/OrderFilter';
import ProcessOrderScreen from './ProcessOrderScreen';
import { orderService } from '../../services/orderService';
import ordersCacheService from '../../services/ordersCacheService';

const { width } = Dimensions.get('window');

interface ManageOrdersScreenProps {
  user: User;
  token: string;
}

const ManageOrdersScreen: React.FC<ManageOrdersScreenProps> = ({ user, token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showProcessOrder, setShowProcessOrder] = useState(false);
  const [orderTab, setOrderTab] = useState<'CONFIRMED' | 'PROCESSED'>('CONFIRMED');
  const [isDataFromCache, setIsDataFromCache] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currentDate = "2025-08-18 18:18:12";
  const username = "Kasun333";

  useEffect(() => {
    loadOrders(orderTab);
  }, [orderTab]);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const loadOrders = async (status: 'CONFIRMED' | 'PROCESSED', forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      console.log(`📋 Loading ${status} orders...`);
      
      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedOrders = await ordersCacheService.getCachedOrdersByStatus(status);
        if (cachedOrders && cachedOrders.length > 0) {
          console.log(`📦 Loading ${status} orders from cache:`, cachedOrders.length);
          
          // Add default properties to cached orders
          const ordersWithDefaults = cachedOrders.map(order => ({
            ...order,
            customerName: order.customerName || `Customer ${order.customerId}`,
            customerPhone: order.customerPhone || '+1234567890',
            customerEmail: order.customerEmail || `customer${order.customerId}@email.com`,
            customerAddress: order.customerAddress || 'Address not available',
            paymentStatus: order.paymentStatus || 'paid' as const,
            paymentMethod: order.paymentMethod || 'card' as const,
            priority: order.priority || 'medium' as const,
            estimatedDeliveryTime: order.estimatedDeliveryTime || '30-45 minutes',
          }));
          
          setOrders(ordersWithDefaults);
          setIsDataFromCache(true);
          setLastUpdated(new Date());
          setLoading(false);
          
          console.log(`✅ ${status} orders loaded from cache`);
          return;
        }
      }
      
      // Fetch fresh data from API
      console.log(`🌐 Fetching fresh ${status} orders from API...`);
      setIsDataFromCache(false);
      
      const response = await orderService.getOrdersByStatus(status, token);
      if (response.success) {
        const ordersWithDefaults = response.orders.map(order => ({
          ...order,
          customerName: `Customer ${order.customerId}`,
          customerPhone: '+1234567890',
          customerEmail: `customer${order.customerId}@email.com`,
          customerAddress: 'Address not available',
          paymentStatus: 'paid' as const,
          paymentMethod: 'card' as const,
          priority: 'medium' as const,
          estimatedDeliveryTime: '30-45 minutes',
        }));
        
        setOrders(ordersWithDefaults);
        setLastUpdated(new Date());
        
        // Cache the fresh data
        await ordersCacheService.cacheOrdersByStatus(status, ordersWithDefaults);
        console.log(`💾 ${status} orders cached successfully`);
        
      } else {
        Alert.alert('Error', 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderId.toString().includes(searchLower) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchLower)) ||
        (order.customerPhone && order.customerPhone.includes(searchLower)) ||
        order.orderItems.some(item => 
          item.productName.toLowerCase().includes(searchLower)
        )
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status.toLowerCase() === filters.status!.toLowerCase());
    }

    // Payment status filter
    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    setFilteredOrders(filtered);
  };

  const handleProcessOrder = (order: Order) => {
    console.log('🔧 Process Order button pressed for order:', order.orderId);
    console.log('🔧 Setting showProcessOrder to true');
    setSelectedOrder(order);
    setShowProcessOrder(true);
    console.log('🔧 State updated - showProcessOrder should be true now');
  };

  const handleBackFromProcess = () => {
    setShowProcessOrder(false);
    setSelectedOrder(null);
    // Refresh orders to get updated status
    loadOrders(orderTab);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(orderTab, true).finally(() => setRefreshing(false)); // Force refresh
  };

  const clearOrdersCache = async () => {
    try {
      await ordersCacheService.clearCache();
      console.log('🗑️ Orders cache cleared manually');
    } catch (error) {
      console.error('❌ Failed to clear orders cache:', error);
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <OrderCard
      order={item}
      onPress={handleProcessOrder}
      onProcessOrder={handleProcessOrder}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={64} color="#059669" />
      </View>
      <Text style={styles.emptyTitle}>No orders found</Text>
      <Text style={styles.emptySubtitle}>
        {Object.keys(filters).length > 0
          ? 'Try adjusting your filters'
          : 'Orders will appear here when customers place them'}
      </Text>
    </View>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <LinearGradient
          colors={['#047857', '#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      {(() => {
        console.log('🔧 Render check - showProcessOrder:', showProcessOrder, 'selectedOrder:', selectedOrder?.orderId);
        return null;
      })()}
      {showProcessOrder && selectedOrder ? (
        <>
          {console.log('🔧 Rendering ProcessOrderScreen for order:', selectedOrder.orderId)}
          <ProcessOrderScreen
            user={user}
            token={token}
            order={selectedOrder}
            onBack={handleBackFromProcess}
          />
        </>
      ) : (
        <View style={styles.rootContainer}>
          {/* Full-screen gradient background for header */}
          <LinearGradient
            colors={['#047857', '#059669', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          />

          <SafeAreaView style={styles.container}>
            <View style={styles.content}>
              {/* Header with Tabs */}
              <View style={styles.header}>
                <View style={styles.headerTop}>
                  <View>
                    <Text style={styles.title}>Manage Orders</Text>
                    <Text style={styles.subtitle}>
                      {filteredOrders.length} of {orders.length} orders
                      {isDataFromCache && (
                        <Text style={styles.cacheIndicator}> 📦</Text>
                      )}
                    </Text>
                    {lastUpdated && (
                      <Text style={styles.lastUpdatedText}>
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </Text>
                    )}
                  </View>

                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={() => {
                        console.log('🔄 Manual refresh triggered');
                        setRefreshing(true);
                        loadOrders(orderTab, true).finally(() => setRefreshing(false));
                      }}
                      disabled={loading || refreshing}
                    >
                      <Ionicons 
                        name="refresh-outline" 
                        size={20} 
                        color={loading || refreshing ? "rgba(255, 255, 255, 0.5)" : "#FFFFFF"} 
                      />
                    </TouchableOpacity>
                    
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateText}>
                        <Ionicons name="time-outline" size={12} color="rgba(255, 255, 255, 0.8)" /> {currentDate}
                      </Text>
                      <Text style={styles.usernameText}>
                        <Ionicons name="person-outline" size={12} color="rgba(255, 255, 255, 0.8)" /> {username}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.tabsContainer}>
                  <TouchableOpacity
                    style={[styles.tab, orderTab === 'CONFIRMED' && styles.tabActive]}
                    onPress={() => setOrderTab('CONFIRMED')}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="timer-outline" 
                      size={18} 
                      color={orderTab === 'CONFIRMED' ? "#FFFFFF" : "rgba(255, 255, 255, 0.8)"} 
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabText, orderTab === 'CONFIRMED' && styles.tabTextActive]}>
                      Confirmed
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, orderTab === 'PROCESSED' && styles.tabActive]}
                    onPress={() => setOrderTab('PROCESSED')}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="checkmark-circle-outline" 
                      size={18} 
                      color={orderTab === 'PROCESSED' ? "#FFFFFF" : "rgba(255, 255, 255, 0.8)"} 
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabText, orderTab === 'PROCESSED' && styles.tabTextActive]}>
                      Processed
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Content Area */}
              <View style={styles.mainContent}>
                {/* Filters */}
                <OrderFilter filters={filters} onFiltersChange={setFilters} />

                {/* Orders List */}
                <FlatList
                  data={filteredOrders}
                  renderItem={renderOrderItem}
                  keyExtractor={(item) => item.orderId.toString()}
                  style={styles.list}
                  contentContainerStyle={[
                    styles.listContentContainer,
                    filteredOrders.length === 0 && styles.emptyListContainer
                  ]}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl 
                      refreshing={refreshing} 
                      onRefresh={onRefresh}
                      colors={['#059669']}
                      tintColor="#059669"
                    />
                  }
                  ListEmptyComponent={renderEmptyList}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '25%',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cacheIndicator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'stretch',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default ManageOrdersScreen;