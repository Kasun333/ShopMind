import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import { DeliveryOrder, DriverProfile } from '../../types/Driver';
import { useDriverDashboardData } from '../../hooks/useDriverQueries';

const { width } = Dimensions.get('window');

type DriverStatus = 'available' | 'on_delivery' | 'off_duty';

interface DriverDashboardProps {
  user: User;
  token: string;
  onNavigateToOrders: () => void;
  onNavigateToNotifications: () => void;
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({
  user,
  token,
  onNavigateToOrders,
  onNavigateToNotifications,
  onLogout,
}) => {
  const [currentStatus, setCurrentStatus] = useState<DriverStatus>('available');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Use React Query for data fetching
  const { profile, clusters, isLoading, error, refetch } = useDriverDashboardData(
    parseInt(user.id),
    token
  );

  // Convert profile data to DriverProfile format
  const driverProfile: DriverProfile | null = profile ? {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phoneNumber || '',
    licenseNumber: profile.licenseNumber,
    licenseExpiry: profile.licenseExpiry,
    emergencyContact: '', // Not available in API
    emergencyPhone: profile.emergencyContact,
    address: '', // Not available in API
    joinDate: profile.createdAt,
    totalDeliveries: 0, // Not available in API
    rating: 0, // Not available in API
    status: profile.availabilityStatus.toLowerCase() as DriverStatus,
    currentLocation: undefined, // Not available in API
    lastLocationUpdate: undefined // Not available in API
  } : null;

  // Convert cluster orders to delivery orders for display
  const todayDeliveries: DeliveryOrder[] = clusters.flatMap(cluster => 
    cluster.orders.map(order => ({
      id: order.orderId.toString(),
      orderId: order.orderId,
      customerName: 'Customer', // This should come from order service
      customerAddress: order.customerAddress,
      customerPhone: '', // This should come from order service
      coordinates: {
        latitude: order.customerLatitude,
        longitude: order.customerLongitude
      },
      items: [], // This should come from order service
      totalAmount: 0, // This should come from order service
      status: order.deliveryStatus === 'DELIVERED' ? 'delivered' : 
              order.deliveryStatus === 'IN_TRANSIT' ? 'in_progress' : 'pending',
      pickupTime: cluster.assignedAt,
      estimatedDeliveryTime: `${Math.round(cluster.estimatedTime / 60)}h`,
      distance: 0, // Calculate from coordinates if needed
      priority: 'medium',
      sequence: order.deliverySequence
    }))
  );

  // Update status when profile loads
  useEffect(() => {
    if (profile) {
      setCurrentStatus(profile.availabilityStatus.toLowerCase() as DriverStatus);
    }
  }, [profile]);


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


  // Calculate stats from active clusters
  const totalDistance = clusters.reduce((sum, cluster) => sum + cluster.totalDistance, 0);
  const totalTime = clusters.reduce((sum, cluster) => sum + cluster.estimatedTime, 0);

  // Show loading spinner on initial load
  if (isLoading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{todayDeliveries.length}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="map-outline" size={24} color="#16A34A" />
            <Text style={styles.statNumber}>{totalDistance > 0 ? (totalDistance / 1000).toFixed(1) : '0.0'}km</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{totalTime > 0 ? (totalTime / 60).toFixed(1) : '0.0'}h</Text>
            <Text style={styles.statLabel}>Est. Time</Text>
          </View>
        </View>

        {/* Next Delivery */}
        <View style={styles.nextDeliveryCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="navigate-circle" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>Next Delivery</Text>
          </View>
          
          <View style={styles.deliveryInfo}>
            {todayDeliveries.length > 0 ? (
              <>
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
                
                <TouchableOpacity style={styles.startDeliveryButton} onPress={onNavigateToOrders}>
                  <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.startDeliveryText}>Start Delivery Route</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={styles.emptyStateText}>No deliveries assigned</Text>
                <Text style={styles.emptyStateSubtext}>Check back later for new orders</Text>
              </View>
            )}
          </View>
        </View>

        {/* Truck Status - Coming Soon */}
        <View style={styles.truckCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="car-sport" size={24} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Truck Status</Text>
          </View>
          
          <View style={styles.truckInfo}>
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyStateText}>No truck assigned</Text>
              <Text style={styles.emptyStateSubtext}>Contact manager for truck assignment</Text>
            </View>
            
            <TouchableOpacity style={styles.maintenanceButton} onPress={onNavigateToNotifications}>
              <Ionicons name="construct" size={20} color="#FFFFFF" />
              <Text style={styles.maintenanceButtonText}>View Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={onNavigateToOrders}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="list" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>View All Orders</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onNavigateToNotifications}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Driver Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {driverProfile && (
                <>
                  {/* Profile Header */}
                  <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                      <Ionicons name="person" size={40} color="#3B82F6" />
                    </View>
                    <Text style={styles.profileName}>{driverProfile.fullName}</Text>
                    <Text style={styles.profileEmail}>{driverProfile.email}</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.ratingText}>{driverProfile.rating}</Text>
                      <Text style={styles.deliveriesCount}>({driverProfile.totalDeliveries} deliveries)</Text>
                    </View>
                  </View>

                  {/* Personal Information */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="call" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={styles.infoValue}>{driverProfile.phone || 'Not provided'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="location" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Address:</Text>
                      <Text style={styles.infoValue}>{driverProfile.address || 'Not provided'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Join Date:</Text>
                      <Text style={styles.infoValue}>{new Date(driverProfile.joinDate).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  {/* License Information */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>License Information</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="card" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>License #:</Text>
                      <Text style={styles.infoValue}>{driverProfile.licenseNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="time" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Expiry:</Text>
                      <Text style={styles.infoValue}>{new Date(driverProfile.licenseExpiry).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  {/* Emergency Contact */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Emergency Contact</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-add" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Contact:</Text>
                      <Text style={styles.infoValue}>{driverProfile.emergencyContact || 'Not provided'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="call" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={styles.infoValue}>{driverProfile.emergencyPhone}</Text>
                    </View>
                  </View>

                  {/* Current Status */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current Status</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
                      <Text style={styles.statusLabel}>Status:</Text>
                      <Text style={styles.statusValue}>{getStatusText()}</Text>
                    </View>
                    {driverProfile.currentLocation && (
                      <View style={styles.infoRow}>
                        <Ionicons name="navigate" size={20} color="#6B7280" />
                        <Text style={styles.infoLabel}>Location:</Text>
                        <Text style={styles.infoValue}>
                          {driverProfile.currentLocation.latitude.toFixed(4)}, {driverProfile.currentLocation.longitude.toFixed(4)}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  // TODO: Implement edit profile functionality
                  setShowProfileModal(false);
                }}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Profile Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  profileModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  deliveriesCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 80,
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 80,
  },
  statusValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  editButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  truckPlate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default DriverDashboard;
