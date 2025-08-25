import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryOrder } from '../../types/Driver';

interface DeliveryCardProps {
  order: DeliveryOrder;
  onPress: () => void;
  onStartDelivery?: () => void;
  onCompleteDelivery?: () => void;
  isActive?: boolean;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({
  order,
  onPress,
  onStartDelivery,
  onCompleteDelivery,
  isActive = false,
}) => {
  const getStatusColor = () => {
    switch (order.status) {
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'delivered':
        return '#16A34A';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (order.status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending':
        return 'time-outline';
      case 'in_progress':
        return 'car-outline';
      case 'delivered':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order.id.slice(-3)}</Text>
          <Text style={styles.customerName} numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Ionicons name={getStatusIcon() as any} size={12} color="#FFFFFF" />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <Ionicons name="location-outline" size={16} color="#6B7280" />
        <Text style={styles.address} numberOfLines={2}>
          {order.customerAddress}
        </Text>
      </View>

      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Ionicons name="map-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{order.distance}m</Text>
        </View>
        
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{order.estimatedDeliveryTime}</Text>
        </View>
        
        <View style={styles.metaItem}>
          <Ionicons name="cash-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>LKR {order.totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.itemsPreview}>
        <Text style={styles.itemsLabel}>Items ({order.items.length}):</Text>
        <Text style={styles.itemsText} numberOfLines={1}>
          {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {order.status === 'pending' && onStartDelivery && (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={(e) => {
              e.stopPropagation();
              onStartDelivery();
            }}
          >
            <Ionicons name="play-circle-outline" size={16} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'in_progress' && onCompleteDelivery && (
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={(e) => {
              e.stopPropagation();
              onCompleteDelivery();
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'delivered' && (
          <View style={styles.completedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.completedText}>Delivered</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activeContainer: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EBF4FF',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  address: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 18,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  itemsText: {
    fontSize: 11,
    color: '#6B7280',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  startButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  completeButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default DeliveryCard;
