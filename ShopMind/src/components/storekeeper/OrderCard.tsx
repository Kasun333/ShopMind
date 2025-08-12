import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
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
      case 'CONFIRMED': return '#3B82F6';
      case 'PREPARING': return '#8B5CF6';
      case 'READY': return '#10B981';
      case 'DELIVERED': return '#059669';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'CONFIRMED': return '✅';
      case 'PREPARING': return '👨‍🍳';
      case 'READY': return '📦';
      case 'DELIVERED': return '🚚';
      case 'CANCELLED': return '❌';
      default: return '❓';
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
    <TouchableOpacity style={styles.container} onPress={() => onPress(order)}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#ORD-{order.orderId}</Text>
          <Text style={styles.customerName}>{order.customerName || `Customer ${order.customerId}`}</Text>
        </View>
        <View style={styles.priorityBadge}>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(order.priority || 'medium') }]} />
          <Text style={[styles.priorityText, { color: getPriorityColor(order.priority || 'medium') }]}>
            {(order.priority || 'medium').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Status and Payment */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(order.status)}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
        <View style={[
          styles.paymentBadge,
          { backgroundColor: (order.paymentStatus || 'paid') === 'paid' ? '#10B98120' : '#F59E0B20' }
        ]}>
          <Text style={[
            styles.paymentText,
            { color: (order.paymentStatus || 'paid') === 'paid' ? '#10B981' : '#F59E0B' }
          ]}>
            {(order.paymentStatus || 'paid') === 'paid' ? '💳 Paid' : '⏳ Pending'}
          </Text>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>{order.orderItems.length} item(s)</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${order.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(order.orderDate)}</Text>
        </View>
        {order.estimatedDeliveryTime && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Est. Delivery:</Text>
            <Text style={styles.detailValue}>{order.estimatedDeliveryTime}</Text>
          </View>
        )}
      </View>

      {/* Process Order Button */}
      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
          onPress={(e) => {
            e.stopPropagation();
            onProcessOrder(order);
          }}
        >
          <Text style={styles.actionButtonText}>
            📋 Process Order
          </Text>
        </TouchableOpacity>
      )}

      {/* Customer Contact */}
      <View style={styles.footer}>
        <Text style={styles.customerContact}>📞 {order.customerPhone}</Text>
        <Text style={styles.customerContact}>📧 {order.customerEmail}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
    fontSize: 14,
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
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  actionButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    gap: 4,
  },
  customerContact: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
});

export default OrderCard;
