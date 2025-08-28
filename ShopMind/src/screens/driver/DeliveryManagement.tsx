import React, { useState, useEffect, useRef } from 'react';
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
import { GOOGLE_MAPS_API_KEY } from '@env';

const { width, height } = Dimensions.get('window');

interface DeliveryManagementProps {
  onBack: () => void;
}

const DeliveryManagement: React.FC<DeliveryManagementProps> = ({ onBack }) => {
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

  const loadDeliveryData = () => {
    // Hardcoded delivery data
    const mockOrders: DeliveryOrder[] = [
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
      },
      {
        id: 'DEL004',
        customerName: 'Emma Davis',
        customerAddress: '321 Negombo Road, Colombo 13',
        customerPhone: '+94771234570',
        items: [
          { id: '6', name: 'Sony Headphones', quantity: 1, price: 85000 }
        ],
        totalAmount: 85000,
        estimatedDeliveryTime: '3:30 PM',
        distance: 1500,
        coordinates: { latitude: 6.9750, longitude: 79.9250 },
        status: 'pending'
      }
    ];

    setOrders(mockOrders);

    // Create route info
    const totalDistance = mockOrders.reduce((sum, order) => sum + order.distance, 0);
    const routeCoordinates = mockOrders.map(order => ({
      latitude: order.coordinates.latitude,
      longitude: order.coordinates.longitude,
      orderId: order.id
    }));

    const route: RouteInfo = {
      totalDistance,
      estimatedTime: Math.ceil(totalDistance / 1000 * 3 + mockOrders.length * 15), // 3 min per km + 15 min per stop
      currentOrderIndex: 0,
      orders: mockOrders,
      optimizedRoute: routeCoordinates
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
          <Text style={styles.headerTitle}>Delivery Route</Text>
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
        <Text style={styles.ordersTitle}>Today's Deliveries ({orders.length})</Text>
        
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
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.orderCustomer} numberOfLines={1}>{order.customerName}</Text>
              <Text style={styles.orderDistance}>{order.distance}m away</Text>
              <Text style={styles.orderTime}>{order.estimatedDeliveryTime}</Text>
              
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
                  </View>
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
});

export default DeliveryManagement;
