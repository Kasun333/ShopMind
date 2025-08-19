import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/Order';

const { width } = Dimensions.get('window');

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  onProcessOrder: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress, onProcessOrder }) => {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'CONFIRMED': return '#059669';
      case 'PREPARING': return '#8B5CF6';
      case 'READY': return '#10B981';
      case 'DELIVERED': return '#047857';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return 'hourglass-outline';
      case 'CONFIRMED': return 'checkmark-circle-outline';
      case 'PREPARING': return 'restaurant-outline';
      case 'READY': return 'cube-outline';
      case 'DELIVERED': return 'car-outline';
      case 'CANCELLED': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(order)} activeOpacity={0.8}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#ORD-{order.orderId}</Text>
          <Text style={styles.customerName}>{order.customerName || `Customer ${order.customerId}`}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(order.priority || 'medium')}15` }]}>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(order.priority || 'medium') }]} />
          <Text style={[styles.priorityText, { color: getPriorityColor(order.priority || 'medium') }]}>
            {(order.priority || 'medium').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Status and Payment */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
          <Ionicons name={getStatusIcon(order.status)} size={16} color={getStatusColor(order.status)} style={styles.statusIcon} />
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
          </Text>
        </View>
        <View style={[
          styles.paymentBadge,
          { backgroundColor: (order.paymentStatus || 'paid') === 'paid' ? '#10B98120' : '#F59E0B20' }
        ]}>
          <Ionicons 
            name={(order.paymentStatus || 'paid') === 'paid' ? 'card-outline' : 'time-outline'} 
            size={14} 
            color={(order.paymentStatus || 'paid') === 'paid' ? '#10B981' : '#F59E0B'} 
            style={styles.paymentIcon}
          />
          <Text style={[
            styles.paymentText,
            { color: (order.paymentStatus || 'paid') === 'paid' ? '#10B981' : '#F59E0B' }
          ]}>
            {(order.paymentStatus || 'paid') === 'paid' ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.detailsContainer}>
        <LinearGradient
          colors={['#ECFDF5', '#D1FAE5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.detailsGradient}
        >
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              <Ionicons name="list-outline" size={14} color="#059669" style={styles.detailIcon} /> Items:
            </Text>
            <Text style={styles.detailValue}>{order.orderItems.length} item(s)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              <Ionicons name="cash-outline" size={14} color="#059669" style={styles.detailIcon} /> Total:
            </Text>
            <Text style={styles.totalAmount}>${order.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              <Ionicons name="calendar-outline" size={14} color="#059669" style={styles.detailIcon} /> Date:
            </Text>
            <Text style={styles.detailValue}>{formatDate(order.orderDate)}</Text>
          </View>
          {order.estimatedDeliveryTime && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  <Ionicons name="time-outline" size={14} color="#059669" style={styles.detailIcon} /> Est. Delivery:
                </Text>
                <Text style={styles.detailValue}>{order.estimatedDeliveryTime}</Text>
              </View>
            </>
          )}
        </LinearGradient>
      </View>

      {/* Process Order Button: Only show for non-processed, non-delivered, non-cancelled orders */}
      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'PROCESSED' && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            console.log('🔧 OrderCard: Process Order button touched for order:', order.orderId);
            e.stopPropagation();
            console.log('🔧 OrderCard: Calling onProcessOrder function');
            onProcessOrder(order);
            console.log('🔧 OrderCard: onProcessOrder function called');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <Ionicons name="clipboard-outline" size={16} color="#FFFFFF" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Process Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Customer Contact */}
      <View style={styles.footer}>
        <Text style={styles.customerContact}>
          <Ionicons name="call-outline" size={12} color="#64748B" /> {order.customerPhone}
        </Text>
        <Text style={styles.customerContact}>
          <Ionicons name="mail-outline" size={12} color="#64748B" /> {order.customerEmail}
        </Text>
      </View>

      {/* Current timestamp footer */}
      <View style={styles.timestampFooter}>
        <Text style={styles.timestamp}>2025-08-18 18:23:02 • Kasun333</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#047857',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    marginRight: 4,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  detailsGradient: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    marginVertical: 6,
  },
  detailIcon: {
    marginRight: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '700',
  },
  actionButton: {
    height: 42,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionGradient: {
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(5, 150, 105, 0.1)',
    paddingTop: 12,
    gap: 4,
  },
  customerContact: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampFooter: {
    marginTop: 8,
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  }
});

export default OrderCard;