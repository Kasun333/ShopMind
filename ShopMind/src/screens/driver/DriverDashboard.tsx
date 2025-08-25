import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import { DeliveryOrder, TruckInfo } from '../../types/Driver';

const { width } = Dimensions.get('window');

interface DriverDashboardProps {
  user: User;
  token: string;
  onNavigateToDeliveries: () => void;
  onNavigateToMaintenance: () => void;
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({
  user,
  token,
  onNavigateToDeliveries,
  onNavigateToMaintenance,
  onLogout,
}) => {
  const [todayDeliveries, setTodayDeliveries] = useState<DeliveryOrder[]>([]);
  const [truckInfo, setTruckInfo] = useState<TruckInfo | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'available' | 'on_delivery' | 'off_duty'>('available');

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = () => {
    // Hardcoded data for demo
    const mockDeliveries: DeliveryOrder[] = [
      {
        id: 'DEL001',
        customerName: 'John Smith',
        customerAddress: '123 Main St, Colombo 03',
        customerPhone: '+94771234567',
        items: [
          { id: '1', name: 'Samsung Galaxy S23', quantity: 1, price: 250000 },
          { id: '2', name: 'Phone Case', quantity: 1, price: 5000 }
        ],
        totalAmount: 255000,
        estimatedDeliveryTime: '10:30 AM',
        distance: 500,
        coordinates: { latitude: 6.9271, longitude: 79.8612 },
        status: 'pending'
      },
      {
        id: 'DEL002',
        customerName: 'Sarah Johnson',
        customerAddress: '456 Galle Road, Colombo 06',
        customerPhone: '+94771234568',
        items: [
          { id: '3', name: 'iPhone 15 Pro', quantity: 1, price: 380000 }
        ],
        totalAmount: 380000,
        estimatedDeliveryTime: '11:45 AM',
        distance: 1200,
        coordinates: { latitude: 6.8851, longitude: 79.8579 },
        status: 'pending'
      },
      {
        id: 'DEL003',
        customerName: 'Mike Wilson',
        customerAddress: '789 Kandy Road, Colombo 07',
        customerPhone: '+94771234569',
        items: [
          { id: '4', name: 'MacBook Pro', quantity: 1, price: 450000 },
          { id: '5', name: 'Magic Mouse', quantity: 1, price: 25000 }
        ],
        totalAmount: 475000,
        estimatedDeliveryTime: '2:15 PM',
        distance: 800,
        coordinates: { latitude: 6.9172, longitude: 79.8648 },
        status: 'pending'
      }
    ];

    const mockTruck: TruckInfo = {
      id: 'TRK001',
      licensePlate: 'CAB-1234',
      model: 'Isuzu D-Max',
      year: 2020,
      mileage: 45000,
      lastMaintenanceDate: '2024-07-15',
      nextMaintenanceDate: '2024-08-30',
      maintenanceStatus: 'due_soon',
      fuelLevel: 75,
      engineHours: 2100
    };

    setTodayDeliveries(mockDeliveries);
    setTruckInfo(mockTruck);
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'available':
        return '#16A34A';
      case 'on_delivery':
        return '#F59E0B';
      case 'off_duty':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'available':
        return 'Available';
      case 'on_delivery':
        return 'On Delivery';
      case 'off_duty':
        return 'Off Duty';
      default:
        return 'Unknown';
    }
  };

  const getMaintenanceStatusColor = () => {
    if (!truckInfo) return '#6B7280';
    switch (truckInfo.maintenanceStatus) {
      case 'good':
        return '#16A34A';
      case 'due_soon':
        return '#F59E0B';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getMaintenanceStatusText = () => {
    if (!truckInfo) return 'Unknown';
    switch (truckInfo.maintenanceStatus) {
      case 'good':
        return 'Good';
      case 'due_soon':
        return 'Due Soon';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const totalDistance = todayDeliveries.reduce((sum, order) => sum + order.distance, 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.driverName}>{user.fullName}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.statusChangeButton}
            onPress={() => {
              if (currentStatus === 'available') setCurrentStatus('off_duty');
              else if (currentStatus === 'off_duty') setCurrentStatus('available');
            }}
          >
            <Text style={styles.statusChangeText}>
              {currentStatus === 'available' ? 'Go Off Duty' : 'Go Available'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{todayDeliveries.length}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="map-outline" size={24} color="#16A34A" />
            <Text style={styles.statNumber}>{(totalDistance / 1000).toFixed(1)}km</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>2.5h</Text>
            <Text style={styles.statLabel}>Est. Time</Text>
          </View>
        </View>

        {/* Next Delivery */}
        {todayDeliveries.length > 0 && (
          <View style={styles.nextDeliveryCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="navigate-circle" size={24} color="#3B82F6" />
              <Text style={styles.cardTitle}>Next Delivery</Text>
            </View>
            
            <View style={styles.deliveryInfo}>
              <Text style={styles.customerName}>{todayDeliveries[0].customerName}</Text>
              <Text style={styles.customerAddress}>{todayDeliveries[0].customerAddress}</Text>
              
              <View style={styles.deliveryMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{todayDeliveries[0].distance}m away</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{todayDeliveries[0].estimatedDeliveryTime}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.startDeliveryButton} onPress={onNavigateToDeliveries}>
                <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                <Text style={styles.startDeliveryText}>Start Delivery Route</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Truck Status */}
        {truckInfo && (
          <View style={styles.truckCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="car-sport" size={24} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Truck Status - {truckInfo.licensePlate}</Text>
            </View>
            
            <View style={styles.truckInfo}>
              <View style={styles.truckRow}>
                <View style={styles.truckStat}>
                  <Ionicons name="speedometer" size={20} color="#6B7280" />
                  <Text style={styles.truckStatLabel}>Fuel</Text>
                  <Text style={styles.truckStatValue}>{truckInfo.fuelLevel}%</Text>
                </View>
                
                <View style={styles.truckStat}>
                  <Ionicons name="build" size={20} color={getMaintenanceStatusColor()} />
                  <Text style={styles.truckStatLabel}>Maintenance</Text>
                  <Text style={[styles.truckStatValue, { color: getMaintenanceStatusColor() }]}>
                    {getMaintenanceStatusText()}
                  </Text>
                </View>
                
                <View style={styles.truckStat}>
                  <Ionicons name="analytics" size={20} color="#6B7280" />
                  <Text style={styles.truckStatLabel}>Mileage</Text>
                  <Text style={styles.truckStatValue}>{truckInfo.mileage.toLocaleString()}km</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.maintenanceButton} onPress={onNavigateToMaintenance}>
                <Ionicons name="construct" size={20} color="#FFFFFF" />
                <Text style={styles.maintenanceButtonText}>Truck Maintenance</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={onNavigateToDeliveries}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="map" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>View All Deliveries</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onNavigateToMaintenance}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="build" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Truck Maintenance</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#E0E7FF',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileButton: {
    padding: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusChangeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusChangeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  nextDeliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  deliveryInfo: {
    marginTop: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  deliveryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  startDeliveryButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  startDeliveryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  truckCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  truckInfo: {
    marginTop: 8,
  },
  truckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  truckStat: {
    alignItems: 'center',
    flex: 1,
  },
  truckStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 2,
  },
  truckStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  maintenanceButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  maintenanceButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverDashboard;
