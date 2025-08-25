import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteInfo, DeliveryOrder } from '../../types/Driver';

interface RouteOptimizerProps {
  routeInfo: RouteInfo;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  onNavigateToOrder: (order: DeliveryOrder) => void;
}

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  routeInfo,
  currentLocation,
  onNavigateToOrder,
}) => {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  const getOrderStatus = (order: DeliveryOrder) => {
    switch (order.status) {
      case 'delivered':
        return { icon: 'checkmark-circle', color: '#16A34A', text: 'Completed' };
      case 'in_progress':
        return { icon: 'car', color: '#3B82F6', text: 'In Progress' };
      case 'pending':
        return { icon: 'time', color: '#F59E0B', text: 'Pending' };
      default:
        return { icon: 'help-circle', color: '#6B7280', text: 'Unknown' };
    }
  };

  const calculateDistanceFromCurrent = (order: DeliveryOrder): number => {
    // Simple distance calculation (in real app, use proper geolocation)
    const lat1 = currentLocation.latitude;
    const lon1 = currentLocation.longitude;
    const lat2 = order.coordinates.latitude;
    const lon2 = order.coordinates.longitude;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  };

  const completedOrders = routeInfo.orders.filter(order => order.status === 'delivered').length;
  const totalOrders = routeInfo.orders.length;
  const progress = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Route Summary */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.summaryCard}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Today's Route</Text>
          <Text style={styles.progressText}>{completedOrders}/{totalOrders} Completed</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Ionicons name="map" size={16} color="#FFFFFF" />
            <Text style={styles.statText}>{formatDistance(routeInfo.totalDistance)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#FFFFFF" />
            <Text style={styles.statText}>{formatTime(routeInfo.estimatedTime)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="location" size={16} color="#FFFFFF" />
            <Text style={styles.statText}>{totalOrders} Stops</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Route Steps */}
      <View style={styles.routeContainer}>
        <Text style={styles.routeTitle}>Delivery Sequence</Text>
        
        <ScrollView style={styles.routeList} showsVerticalScrollIndicator={false}>
          {routeInfo.orders.map((order, index) => {
            const status = getOrderStatus(order);
            const distanceFromCurrent = calculateDistanceFromCurrent(order);
            const isNext = index === routeInfo.currentOrderIndex;
            
            return (
              <TouchableOpacity
                key={order.id}
                style={[
                  styles.routeStep,
                  isNext && styles.nextRouteStep,
                  order.status === 'delivered' && styles.completedRouteStep
                ]}
                onPress={() => onNavigateToOrder(order)}
              >
                <View style={styles.stepNumber}>
                  <Text style={[
                    styles.stepNumberText,
                    order.status === 'delivered' && styles.completedStepText
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                
                <View style={styles.stepContent}>
                  <View style={styles.stepHeader}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {order.customerName}
                    </Text>
                    <View style={[styles.stepStatus, { backgroundColor: status.color }]}>
                      <Ionicons name={status.icon as any} size={12} color="#FFFFFF" />
                    </View>
                  </View>
                  
                  <Text style={styles.stepAddress} numberOfLines={2}>
                    {order.customerAddress}
                  </Text>
                  
                  <View style={styles.stepMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="navigate" size={12} color="#6B7280" />
                      <Text style={styles.metaText}>
                        {formatDistance(distanceFromCurrent)} away
                      </Text>
                    </View>
                    
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={12} color="#6B7280" />
                      <Text style={styles.metaText}>
                        {order.estimatedDeliveryTime}
                      </Text>
                    </View>
                  </View>
                  
                  {isNext && (
                    <View style={styles.nextIndicator}>
                      <Ionicons name="arrow-forward-circle" size={16} color="#3B82F6" />
                      <Text style={styles.nextText}>Next Delivery</Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.navigateButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onNavigateToOrder(order);
                  }}
                >
                  <Ionicons name="navigate" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressText: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  routeContainer: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  routeList: {
    flex: 1,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nextRouteStep: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EBF4FF',
  },
  completedRouteStep: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  completedStepText: {
    color: '#16A34A',
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  stepStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  stepAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  stepMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  nextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  nextText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 6,
  },
  navigateButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default RouteOptimizer;
