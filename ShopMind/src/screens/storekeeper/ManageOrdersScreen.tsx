import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Order, OrderFilters } from '../../types/Order';
import { User } from '../../types/User';
import OrderCard from '../../components/storekeeper/OrderCard';
import OrderFilter from '../../components/storekeeper/OrderFilter';
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
  const [showOrderDetails, setShowOrderDetails] = useState(false);

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

  const handleStatusChange = (orderId: number, newStatus: Order['status']) => {
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to mark this order as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order.orderId === orderId ? { ...order, status: newStatus as any } : order
              )
            );
          },
        },
      ]
    );
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders().finally(() => setRefreshing(false));
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <OrderCard
      order={item}
      onPress={handleOrderPress}
      onStatusChange={handleStatusChange}
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
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

      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Information</Text>
                  <Text style={styles.orderNumber}>#ORD-{selectedOrder.orderId}</Text>
                  <Text style={styles.orderDate}>Placed: {formatDate(selectedOrder.orderDate)}</Text>
                  {selectedOrder.deliveryDate && (
                    <Text style={styles.orderDate}>Delivered: {formatDate(selectedOrder.deliveryDate)}</Text>
                  )}
                </View>

                {/* Customer Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <Text style={styles.customerInfo}>{selectedOrder.customerName || `Customer ${selectedOrder.customerId}`}</Text>
                  <Text style={styles.customerInfo}>{selectedOrder.customerPhone || 'Phone not available'}</Text>
                  <Text style={styles.customerInfo}>{selectedOrder.customerEmail || 'Email not available'}</Text>
                  <Text style={styles.customerInfo}>{selectedOrder.customerAddress || 'Address not available'}</Text>
                </View>

                {/* Items */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Items</Text>
                  {selectedOrder.orderItems.map((item) => (
                    <View key={item.orderItemId} style={styles.itemContainer}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.productName}</Text>
                        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                      </View>
                      <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {/* Payment Summary */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>${(selectedOrder.totalAmount * 0.9).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                    <Text style={styles.summaryValue}>${(selectedOrder.totalAmount * 0.1).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>${selectedOrder.totalAmount.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.paymentMethod}>
                    Payment: {selectedOrder.paymentMethod || 'card'} ({selectedOrder.paymentStatus || 'paid'})
                  </Text>
                </View>

                {/* Notes */}
                {selectedOrder.notes && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Special Notes</Text>
                    <Text style={styles.notes}>{selectedOrder.notes}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  customerInfo: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#64748B',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  notes: {
    fontSize: 16,
    color: '#374151',
    fontStyle: 'italic',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
});

export default ManageOrdersScreen;
