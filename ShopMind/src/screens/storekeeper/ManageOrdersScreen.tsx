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
} from 'react-native';
import { Order, OrderFilters } from '../../types/Order';
import { User } from '../../types/User';
import OrderCard from '../../components/storekeeper/OrderCard';
import OrderFilter from '../../components/storekeeper/OrderFilter';
import ProcessOrderScreen from './ProcessOrderScreen';
import { orderService } from '../../services/orderService';

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

  useEffect(() => {
    loadOrders(orderTab);
  }, [orderTab]);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const loadOrders = async (status: 'CONFIRMED' | 'PROCESSED') => {
    setLoading(true);
    try {
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
    setSelectedOrder(order);
    setShowProcessOrder(true);
  };

  const handleBackFromProcess = () => {
    setShowProcessOrder(false);
    setSelectedOrder(null);
    // Refresh orders to get updated status
    loadOrders(orderTab);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(orderTab).finally(() => setRefreshing(false));
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
      <Text style={styles.emptyIcon}>📋</Text>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {showProcessOrder && selectedOrder ? (
        <ProcessOrderScreen
          user={user}
          token={token}
          order={selectedOrder}
          onBack={handleBackFromProcess}
        />
      ) : (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* Header with Tabs */}
            <View style={styles.header}>
              <Text style={styles.title}>Manage Orders</Text>
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tab, orderTab === 'CONFIRMED' && styles.tabActive]}
                  onPress={() => setOrderTab('CONFIRMED')}
                >
                  <Text style={[styles.tabText, orderTab === 'CONFIRMED' && styles.tabTextActive]}>
                    Confirmed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, orderTab === 'PROCESSED' && styles.tabActive]}
                  onPress={() => setOrderTab('PROCESSED')}
                >
                  <Text style={[styles.tabText, orderTab === 'PROCESSED' && styles.tabTextActive]}>
                    Processed
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>
                {filteredOrders.length} of {orders.length} orders
              </Text>
            </View>

            {/* Filters */}
            <OrderFilter filters={filters} onFiltersChange={setFilters} />

            {/* Orders List */}
            <FlatList
              data={filteredOrders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.orderId.toString()}
              style={styles.list}
              contentContainerStyle={filteredOrders.length === 0 ? styles.emptyListContainer : undefined}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={renderEmptyList}
            />
          </View>
        </SafeAreaView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
});

export default ManageOrdersScreen;