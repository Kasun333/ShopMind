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

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAllOrders(token);
      if (response.success) {
        // Add default values for missing fields to match our UI expectations
        const ordersWithDefaults = response.orders.map(order => ({
          ...order,
          customerName: `Customer ${order.customerId}`, // Fallback until we get customer data
          customerPhone: '+1234567890', // Fallback
          customerEmail: `customer${order.customerId}@email.com`, // Fallback
          customerAddress: 'Address not available', // Fallback
          paymentStatus: 'paid' as const, // Assuming confirmed orders are paid
          paymentMethod: 'card' as const, // Default
          priority: 'medium' as const, // Default
          estimatedDeliveryTime: '30-45 minutes', // Default
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
    loadOrders();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders().finally(() => setRefreshing(false));
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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Manage Orders</Text>
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
});

export default ManageOrdersScreen;
