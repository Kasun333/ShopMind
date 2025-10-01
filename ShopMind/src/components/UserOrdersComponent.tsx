import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { UserOrderService, Order, OrderItem } from '../services/userOrderService';

const { width } = Dimensions.get('window');

interface UserOrdersProps {
  userId: number;
  token: string;
}

const UserOrdersComponent: React.FC<UserOrdersProps> = ({ userId, token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [availableStatuses, setAvailableStatuses] = useState<string[]>(['ALL']);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    // Reset pagination when userId changes
    setCurrentPage(0);
    setHasNextPage(true);
    setOrders([]);
    fetchOrders(true);
  }, [userId]);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus]);

  const fetchOrders = async (forceRefresh: boolean = false, page: number = 0, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      setError(null);
      console.log(`📋 Loading user orders... Page: ${page}, LoadMore: ${isLoadMore}`);
      
      const result = await UserOrderService.getPaginatedUserOrders(userId, token, page, pageSize);
      
      if (result.success) {
        if (isLoadMore) {
          // Append new orders to existing ones
          setOrders(prevOrders => [...prevOrders, ...result.orders]);
        } else {
          // Replace orders for first load or refresh
          setOrders(result.orders);
          // Update available statuses only on first load
          const statuses = UserOrderService.getUniqueStatuses(result.orders);
          setAvailableStatuses(statuses);
        }
        
        // Update pagination state
        setCurrentPage(result.pagination.currentPage);
        setHasNextPage(result.pagination.hasNext);
        setTotalOrders(result.pagination.totalElements);
        
        console.log(`✅ User orders loaded successfully. Page: ${page}, HasNext: ${result.pagination.hasNext}`);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(0);
    setHasNextPage(true);
    setOrders([]);
    await fetchOrders(true, 0, false);
    setRefreshing(false);
  };

  const loadMoreOrders = () => {
    if (!loadingMore && hasNextPage && !loading) {
      const nextPage = currentPage + 1;
      console.log(`📄 Loading more user orders... Next page: ${nextPage}`);
      fetchOrders(false, nextPage, true);
    }
  };

  const handleRetry = () => {
    setCurrentPage(0);
    setHasNextPage(true);
    setOrders([]);
    fetchOrders(true, 0, false);
  };

  const filterOrders = () => {
    const filtered = UserOrderService.filterOrdersByStatus(orders, selectedStatus);
    setFilteredOrders(filtered);
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{item.orderId}</Text>
          <Text style={styles.orderDate}>
            {UserOrderService.formatOrderDate(item.orderDate)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: UserOrderService.getStatusBackgroundColor(item.status) }
        ]}>
          <Text style={[
            styles.statusText,
            { color: UserOrderService.getStatusColor(item.status) }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <Text style={styles.totalAmount}>${item.totalAmount.toFixed(2)}</Text>
        <Text style={styles.itemCount}>
          {item.orderItems.length} {item.orderItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Order Items Preview */}
      <View style={styles.itemsPreview}>
        {item.orderItems.slice(0, 3).map((orderItem: OrderItem) => (
          <View key={orderItem.orderItemId} style={styles.itemPreview}>
            {orderItem.productImageUrl ? (
              <Image 
                source={{ uri: orderItem.productImageUrl }} 
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={16} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.productName}
              </Text>
              <Text style={styles.itemDetails}>
                Qty: {orderItem.quantity} × ${orderItem.price.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        {item.orderItems.length > 3 && (
          <Text style={styles.moreItems}>
            +{item.orderItems.length - 3} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#2A7CC7" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilter = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.statusFilter,
        selectedStatus === item && styles.statusFilterActive
      ]}
      onPress={() => setSelectedStatus(item)}
    >
      <Text style={[
        styles.statusFilterText,
        selectedStatus === item && styles.statusFilterTextActive
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Orders Found</Text>
      <Text style={styles.emptyMessage}>
        {selectedStatus === 'ALL' 
          ? "You haven't placed any orders yet" 
          : `No orders with status "${selectedStatus}"`
        }
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#2A7CC7" />
        <Text style={styles.footerText}>Loading more orders...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A7CC7" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Orders</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Orders</Text>
        <Text style={styles.orderCount}>
          {filteredOrders.length} of {totalOrders > 0 ? totalOrders : orders.length} orders
          {hasNextPage && (
            <Text style={styles.moreIndicator}> • More available</Text>
          )}
        </Text>
      </View>

      {/* Status Filters */}
      <FlatList
        data={availableStatuses}
        renderItem={renderStatusFilter}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilters}
        contentContainerStyle={styles.statusFiltersContent}
      />

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.orderId.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.1}
        contentContainerStyle={filteredOrders.length === 0 ? styles.emptyList : styles.ordersListContent}
        style={styles.ordersList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#2A7CC7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderCount: {
    fontSize: 14,
    color: '#64748B',
  },
  statusFilters: {
    backgroundColor: '#FFFFFF',
    maxHeight: 60,
    marginBottom: 8, // Add spacing between filters and orders
  },
  statusFiltersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ordersList: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  ordersListContent: {
    paddingTop: 12, // Increased padding to ensure no overlap
    paddingBottom: 20,
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusFilterActive: {
    backgroundColor: '#2A7CC7',
    borderColor: '#2A7CC7',
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 6, // Reduced from 8 to 6 for better spacing
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  orderDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  orderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  itemCount: {
    fontSize: 14,
    color: '#64748B',
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
  },
  placeholderImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemDetails: {
    fontSize: 12,
    color: '#64748B',
  },
  moreItems: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginLeft: 40,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A7CC7',
    marginRight: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  moreIndicator: {
    fontSize: 12,
    color: '#64748B',
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
});

export default UserOrdersComponent;
