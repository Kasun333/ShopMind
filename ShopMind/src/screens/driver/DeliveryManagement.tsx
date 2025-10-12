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
import { dummyOrders, dummyCluster, driverStartLocation, optimizedRouteCoordinates, routeStats } from '../../dummy/driverData';

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
  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
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
    // Use driver start location (warehouse/depot)
    setCurrentLocation({
      latitude: driverStartLocation.latitude,
      longitude: driverStartLocation.longitude,
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
    // Load dummy orders with optimized route from manager
    setOrders(dummyOrders);
    
    // Create route info with optimized coordinates
    const route: RouteInfo = {
      totalDistance: routeStats.totalDistance,
      estimatedTime: routeStats.totalDuration,
      currentOrderIndex: 0,
      orders: dummyOrders,
      optimizedRoute: optimizedRouteCoordinates.map((coord, index) => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
        orderId: index === 0 ? 'start' : dummyOrders[index - 1]?.id || `stop_${index}`
      }))
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

  const handleStartClusterDelivery = () => {
    Alert.alert(
      'Start Delivery Cluster',
      `Start delivering ${dummyCluster.clusterName}?\n${dummyCluster.totalOrders} orders to complete`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            setDeliveryStarted(true);
            // Mark first order as in progress
            const updatedOrders = orders.map((o, index) =>
              index === 0 ? { ...o, status: 'in_progress' as const, pickupTime: new Date().toISOString() } : o
            );
            setOrders(updatedOrders);
            setCurrentOrderIndex(0);
          }
        }
      ]
    );
  };

  const handleCompleteCurrentOrder = () => {
    const currentOrder = orders[currentOrderIndex];
    Alert.alert(
      'Complete Delivery',
      `Mark Order #${currentOrder.id} as delivered?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            // Mark current order as delivered
            const updatedOrders = [...orders];
            updatedOrders[currentOrderIndex] = {
              ...updatedOrders[currentOrderIndex],
              status: 'delivered',
              deliveryTime: new Date().toISOString()
            };

            // Check if there are more orders
            if (currentOrderIndex < orders.length - 1) {
              // Mark next order as in progress
              const nextIndex = currentOrderIndex + 1;
              updatedOrders[nextIndex] = {
                ...updatedOrders[nextIndex],
                status: 'in_progress',
                pickupTime: new Date().toISOString()
              };
              setCurrentOrderIndex(nextIndex);
              Alert.alert('Next Delivery', `Moving to Order #${updatedOrders[nextIndex].id}`);
            } else {
              // All orders completed
              Alert.alert('Cluster Complete!', 'All deliveries in this cluster have been completed.');
              setDeliveryStarted(false);
            }

            setOrders(updatedOrders);
          }
        }
      ]
    );
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
  const activeOrderIndex = getCurrentOrderIndex();
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

        {/* Cluster Info */}
        <View style={styles.clusterInfoContainer}>
          <View style={styles.clusterHeader}>
            <Ionicons name="layers" size={20} color="#FFFFFF" />
            <Text style={styles.clusterName}>{dummyCluster.clusterName}</Text>
          </View>
          <Text style={styles.clusterMeta}>
            Cluster #{dummyCluster.clusterId} • {dummyCluster.totalOrders} Orders • {dummyCluster.status.toUpperCase()}
          </Text>
          {!deliveryStarted && (
            <TouchableOpacity style={styles.startClusterButton} onPress={handleStartClusterDelivery}>
              <Ionicons name="play-circle" size={20} color="#FFFFFF" />
              <Text style={styles.startClusterButtonText}>Start Delivery Cluster</Text>
            </TouchableOpacity>
          )}
          {deliveryStarted && (
            <View style={styles.deliveryProgress}>
              <Text style={styles.progressText}>
                Delivering: Order {currentOrderIndex + 1} of {orders.length}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentOrderIndex + 1) / orders.length) * 100}%` }]} />
              </View>
            </View>
          )}
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

      {/* Map - Only show when delivery started */}
      {deliveryStarted && (
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
      )}

      {/* Current Order - Show when delivery started */}
      {deliveryStarted && orders[currentOrderIndex] && (
        <View style={styles.currentOrderContainer}>
          <View style={styles.currentOrderHeader}>
            <Text style={styles.currentOrderTitle}>Current Delivery</Text>
            <TouchableOpacity style={styles.deliveryCompleteButton} onPress={handleCompleteCurrentOrder}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.deliveryCompleteButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.currentOrderCard}>
            <Text style={styles.currentOrderId}>Order #{orders[currentOrderIndex].id}</Text>
            <Text style={styles.currentOrderCustomer}>{orders[currentOrderIndex].customerName}</Text>
            <Text style={styles.currentOrderAddress}>{orders[currentOrderIndex].customerAddress}</Text>
            <View style={styles.currentOrderMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{orders[currentOrderIndex].distance}m</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{orders[currentOrderIndex].estimatedDeliveryTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="list" size={16} color="#6B7280" />
                <Text style={styles.metaText}>Stop {currentOrderIndex + 1}/{orders.length}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

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
                <View style={styles.sequenceBadge}>
                  <Text style={styles.sequenceText}>{order.sequence}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.orderIdText}>Order #{order.id}</Text>
              <Text style={styles.orderCustomer} numberOfLines={1}>{order.customerName}</Text>
              <Text style={styles.orderAddress} numberOfLines={2}>{order.customerAddress}</Text>
              
              <View style={styles.orderFooter}>
                <View style={styles.orderMetaItem}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.orderMetaText}>{order.distance}m</Text>
                </View>
                <View style={styles.orderMetaItem}>
                  <Ionicons name="time" size={14} color="#6B7280" />
                  <Text style={styles.orderMetaText}>{order.estimatedDeliveryTime}</Text>
                </View>
              </View>
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
  clusterInfoContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clusterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  clusterMeta: {
    fontSize: 12,
    color: '#E2E8F0',
    marginBottom: 12,
  },
  startClusterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  startClusterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  deliveryProgress: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
  },
  currentOrderContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentOrderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  deliveryCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deliveryCompleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  currentOrderCard: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  currentOrderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  currentOrderCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  currentOrderAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  currentOrderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  sequenceBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  orderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default DeliveryManagement;
