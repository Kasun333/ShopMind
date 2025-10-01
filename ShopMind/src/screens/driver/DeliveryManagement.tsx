import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryOrder, RouteInfo } from '../../types/Driver';
import { User } from '../../types/User';
import { GOOGLE_MAPS_API_KEY } from '@env';

const { width, height } = Dimensions.get('window');

interface DeliveryManagementProps {
  user: User;
  token: string;
  onBack: () => void;
}

const DeliveryManagement: React.FC<DeliveryManagementProps> = ({ user, token, onBack }) => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
  });
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadDeliveryData();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    // You can integrate with React Native's Geolocation API here
    // For now, using Colombo as default location
    setCurrentLocation({
      latitude: 6.9271,
      longitude: 79.8612,
    });
  };

  // Google Directions API integration
  const getOptimizedRoute = async (destinations: Array<{latitude: number, longitude: number}>) => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        console.warn('Google Maps API key not found. Using mock route data.');
        return generateMockRouteInfo();
      }

      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      const waypoints = destinations.map(dest => `${dest.latitude},${dest.longitude}`).join('|');
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destinations[destinations.length - 1].latitude},${destinations[destinations.length - 1].longitude}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        const route = data.routes[0];
        const optimizedRoute: Array<{latitude: number, longitude: number}> = route.legs.map((leg: any) => ({
          latitude: leg.end_location.lat,
          longitude: leg.end_location.lng,
        }));
        
        const totalDistance = route.legs.reduce((total: number, leg: any) => total + leg.distance.value, 0);
        const totalDuration = route.legs.reduce((total: number, leg: any) => total + leg.duration.value, 0);
        
        return {
          optimizedRoute: [
            { ...currentLocation, orderId: 'driver_location' },
            ...optimizedRoute.map((point: {latitude: number, longitude: number}, index: number) => ({
              ...point,
              orderId: destinations[index] ? orders.find(order => 
                order.coordinates.latitude === destinations[index].latitude && 
                order.coordinates.longitude === destinations[index].longitude
              )?.id || `point_${index}` : `point_${index}`
            }))
          ],
          totalDistance: Math.round(totalDistance / 1000), // Convert to km
          estimatedTime: Math.round(totalDuration / 60), // Convert to minutes
          currentOrderIndex: 0,
          orders: orders,
        };
      } else {
        console.error('Google Directions API error:', data.status);
        return generateMockRouteInfo();
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      return generateMockRouteInfo();
    }
  };

  const generateMockRouteInfo = (): RouteInfo => {
    return {
      optimizedRoute: [
        { ...currentLocation, orderId: 'driver_location' },
        ...orders.map(order => ({ ...order.coordinates, orderId: order.id }))
      ],
      totalDistance: orders.reduce((total, order) => total + order.distance, 0),
      estimatedTime: orders.length * 15, // 15 minutes per delivery
      currentOrderIndex: 0,
      orders: orders,
    };
  };

  const loadDeliveryData = async () => {
    // TODO: Implement API call to fetch driver orders
    // For now, set empty orders
    setOrders([]);
    
    const route: RouteInfo = {
      totalDistance: 0,
      estimatedTime: 0,
      currentOrderIndex: 0,
      orders: [],
      optimizedRoute: []
    };

    setRouteInfo(route);
  };

  const handleOptimizeRoute = async () => {
    if (orders.length === 0) {
      Alert.alert('No Orders', 'There are no orders to optimize.');
      return;
    }

    try {
      const destinations = orders.map(order => order.coordinates);
      const optimizedRoute = await getOptimizedRoute(destinations);
      setRouteInfo(optimizedRoute);
      
      Alert.alert(
        'Route Optimized!', 
        `Total distance: ${optimizedRoute.totalDistance}km\nEstimated time: ${optimizedRoute.estimatedTime} minutes`
      );
    } catch (error) {
      console.error('Error optimizing route:', error);
      Alert.alert('Error', 'Failed to optimize route. Using default route.');
    }
  };

  const handleStartDelivery = (order: DeliveryOrder) => {
    Alert.alert(
      'Start Delivery',
      `Start delivery to ${order.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            const updatedOrders = orders.map(o =>
              o.id === order.id ? { ...o, status: 'in_progress' as const, pickupTime: new Date().toISOString() } : o
            );
            setOrders(updatedOrders);
            
            // Focus map on the order location
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: order.coordinates.latitude,
                longitude: order.coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 1000);
            }
          }
        }
      ]
    );
  };

  const handleCompleteDelivery = (order: DeliveryOrder) => {
    Alert.alert(
      'Complete Delivery',
      `Mark delivery to ${order.customerName} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            const updatedOrders = orders.map(o =>
              o.id === order.id ? { ...o, status: 'delivered' as const, deliveryTime: new Date().toISOString() } : o
            );
            setOrders(updatedOrders);
          }
        }
      ]
    );
  };

  const handleCallCustomer = (phone: string) => {
    Alert.alert('Call Customer', `Call ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => console.log(`Calling ${phone}`) }
    ]);
  };

  const getStatusColor = (status: DeliveryOrder['status']) => {
    switch (status) {
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

  const getStatusText = (status: DeliveryOrder['status']) => {
    switch (status) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getNextDeliveryDistance = () => {
    const nextOrder = orders.find(order => order.status === 'pending');
    return nextOrder ? nextOrder.distance : 0;
  };

  const getCurrentOrderIndex = () => {
    return orders.findIndex(order => order.status === 'in_progress');
  };

  // Calculate derived values for rendering
  const nextDeliveryDistance = getNextDeliveryDistance();
  const currentOrderIndex = getCurrentOrderIndex();
  const nextOrder = orders.find(order => order.status === 'pending');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders & Tasks</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Route Info */}
        {nextOrder && (
          <View style={styles.routeInfoContainer}>
            <Text style={styles.nextDeliveryText}>
              {nextDeliveryDistance}m to deliver Order #{nextOrder.id.slice(-2)}
            </Text>
            <Text style={styles.customerNameText}>
              {nextOrder.customerName}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Current Location Marker */}
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="Current Driver Location"
          >
            <View style={styles.currentLocationMarker}>
              <Ionicons name="car" size={20} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Delivery Markers */}
          {orders.map((order, index) => (
            <Marker
              key={order.id}
              coordinate={order.coordinates}
              title={order.customerName}
              description={order.customerAddress}
              onPress={() => {
                setSelectedOrder(order);
                setShowOrderDetails(true);
              }}
            >
              <View style={[
                styles.deliveryMarker,
                { backgroundColor: getStatusColor(order.status) }
              ]}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}

          {/* Route Polyline */}
          {routeInfo && (
            <Polyline
              coordinates={[
                currentLocation,
                ...routeInfo.optimizedRoute.map(point => ({
                  latitude: point.latitude,
                  longitude: point.longitude
                }))
              ]}
              strokeColor="#3B82F6"
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }, 1000);
              }
            }}
          >
            <Ionicons name="locate" size={20} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current && routeInfo) {
                const coordinates = [currentLocation, ...routeInfo.optimizedRoute];
                mapRef.current.fitToCoordinates(coordinates, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: true,
                });
              }
            }}
          >
            <Ionicons name="resize" size={20} color="#3B82F6" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mapControlButton, styles.optimizeButton]}
            onPress={handleOptimizeRoute}
          >
            <Ionicons name="analytics" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      <View style={styles.ordersContainer}>
        <Text style={styles.ordersTitle}>Assigned Orders ({orders.length})</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.ordersList}
        >
          {orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={[
                styles.orderCard,
                order.status === 'in_progress' && styles.activeOrderCard
              ]}
              onPress={() => {
                setSelectedOrder(order);
                setShowOrderDetails(true);
              }}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{order.id.slice(-2)}</Text>
                <View style={styles.orderHeaderRight}>
                  {order.priority && order.priority !== 'low' && (
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(order.priority) }]}>
                      <Text style={styles.priorityText}>{order.priority.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.orderCustomer} numberOfLines={1}>{order.customerName}</Text>
              <Text style={styles.orderDistance}>{order.distance}m away</Text>
              <Text style={styles.orderTime}>{order.estimatedDeliveryTime}</Text>
              
              {order.specialInstructions && (
                <View style={styles.specialInstructionsContainer}>
                  <Ionicons name="information-circle" size={14} color="#F59E0B" />
                  <Text style={styles.specialInstructions} numberOfLines={2}>
                    {order.specialInstructions}
                  </Text>
                </View>
              )}
              
              {order.status === 'pending' && (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => handleStartDelivery(order)}
                >
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              )}
              
              {order.status === 'in_progress' && (
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => handleCompleteDelivery(order)}
                >
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Orders Assigned</Text>
            <Text style={styles.emptyMessage}>You don't have any delivery orders at the moment. Check back later for new assignments.</Text>
          </View>
        )}
      </View>

      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Order #{selectedOrder.id.slice(-2)}</Text>
                  <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.modalSectionTitle}>Customer Information</Text>
                    <Text style={styles.customerName}>{selectedOrder.customerName}</Text>
                    <Text style={styles.customerAddress}>{selectedOrder.customerAddress}</Text>
                    
                    <TouchableOpacity 
                      style={styles.callButton}
                      onPress={() => handleCallCustomer(selectedOrder.customerPhone)}
                    >
                      <Ionicons name="call" size={20} color="#FFFFFF" />
                      <Text style={styles.callButtonText}>Call Customer</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.orderItems}>
                    <Text style={styles.modalSectionTitle}>Items</Text>
                    {selectedOrder.items.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                        <Text style={styles.itemPrice}>LKR {item.price.toLocaleString()}</Text>
                      </View>
                    ))}
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Amount</Text>
                      <Text style={styles.totalAmount}>LKR {selectedOrder.totalAmount.toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={styles.deliveryInfo}>
                    <Text style={styles.modalSectionTitle}>Delivery Information</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text style={styles.infoText}>{selectedOrder.distance}m away</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text style={styles.infoText}>Est. {selectedOrder.estimatedDeliveryTime}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="checkmark-circle" size={16} color={getStatusColor(selectedOrder.status)} />
                      <Text style={styles.infoText}>{getStatusText(selectedOrder.status)}</Text>
                    </View>
                    {selectedOrder.sequence && (
                      <View style={styles.infoRow}>
                        <Ionicons name="list" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>Sequence: #{selectedOrder.sequence}</Text>
                      </View>
                    )}
                    {selectedOrder.priority && selectedOrder.priority !== 'low' && (
                      <View style={styles.infoRow}>
                        <Ionicons name="flag" size={16} color={getPriorityColor(selectedOrder.priority)} />
                        <Text style={[styles.infoText, { color: getPriorityColor(selectedOrder.priority) }]}>
                          Priority: {selectedOrder.priority.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {selectedOrder.specialInstructions && (
                    <View style={styles.specialInstructionsSection}>
                      <Text style={styles.modalSectionTitle}>Special Instructions</Text>
                      <View style={styles.instructionsContainer}>
                        <Ionicons name="information-circle" size={20} color="#F59E0B" />
                        <Text style={styles.instructionsText}>{selectedOrder.specialInstructions}</Text>
                      </View>
                    </View>
                  )}

                  {selectedOrder.managerNotes && (
                    <View style={styles.managerNotesSection}>
                      <Text style={styles.modalSectionTitle}>Manager Notes</Text>
                      <View style={styles.notesContainer}>
                        <Ionicons name="document-text" size={20} color="#3B82F6" />
                        <Text style={styles.notesText}>{selectedOrder.managerNotes}</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  {selectedOrder.status === 'pending' && (
                    <TouchableOpacity 
                      style={styles.modalStartButton}
                      onPress={() => {
                        handleStartDelivery(selectedOrder);
                        setShowOrderDetails(false);
                      }}
                    >
                      <Text style={styles.modalStartButtonText}>Start Delivery</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedOrder.status === 'in_progress' && (
                    <TouchableOpacity 
                      style={styles.modalCompleteButton}
                      onPress={() => {
                        handleCompleteDelivery(selectedOrder);
                        setShowOrderDetails(false);
                      }}
                    >
                      <Text style={styles.modalCompleteButtonText}>Complete Delivery</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 4,
  },
  routeInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextDeliveryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  customerNameText: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  mapControlButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optimizeButton: {
    backgroundColor: '#10B981',
  },
  currentLocationMarker: {
    backgroundColor: '#3B82F6',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  deliveryMarker: {
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ordersContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  ordersList: {
    flexDirection: 'row',
  },
  orderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeOrderCard: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  specialInstructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  specialInstructions: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderCustomer: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDistance: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    paddingTop: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  customerInfo: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  callButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  orderItems: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 16,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  deliveryInfo: {
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalStartButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalStartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCompleteButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCompleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  specialInstructionsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  instructionsText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  managerNotesSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF4FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  notesText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DeliveryManagement;
