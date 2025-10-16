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
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { DeliveryOrder, RouteInfo } from '../../types/Driver';
import { User } from '../../types/User';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { DeliveryCluster } from '../../services/deliveryClusterService';
import { 
  useDriverProfile,
  useDriverClusters,
  useUpdateClusterStatus,
  useUpdateOrderStatus
} from '../../hooks/useDriverQueries';

const { width, height } = Dimensions.get('window');

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

interface DeliveryManagementProps {
  user: User;
  token: string;
  onBack: () => void;
}

// Helper function to convert cluster to delivery orders
const convertClusterToOrders = (cluster: DeliveryCluster): DeliveryOrder[] => {
    const clusterOrders: DeliveryOrder[] = cluster.orders.map(order => ({
      id: order.orderId.toString(),
      orderId: order.orderId,
      customerName: 'Customer', // This should ideally come from order service
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
      estimatedDeliveryTime: `${Math.round(cluster.estimatedTime / cluster.orders.length)} min`,
      distance: Math.round(cluster.totalDistance / cluster.orders.length), // Distribute distance
      priority: 'medium',
      sequence: order.deliverySequence
    }));

  // Sort by delivery sequence
  return clusterOrders.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
};

// Helper function to create route info
const createRouteInfo = (cluster: DeliveryCluster, clusterOrders: DeliveryOrder[]): RouteInfo => {
  return {
    totalDistance: cluster.totalDistance,
    estimatedTime: cluster.estimatedTime,
    currentOrderIndex: 0,
    orders: clusterOrders,
    optimizedRoute: clusterOrders.map((order) => ({
      latitude: order.coordinates.latitude,
      longitude: order.coordinates.longitude,
      orderId: order.id
    }))
  };
};

const DeliveryManagement: React.FC<DeliveryManagementProps> = ({ user, token, onBack }) => {
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
  });
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [nearbyOrder, setNearbyOrder] = useState<DeliveryOrder | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const mapRef = useRef<MapView>(null);
  const locationWatchId = useRef<any>(null);

  // Use React Query hooks
  const profileQuery = useDriverProfile(parseInt(user.id), token);
  const clustersQuery = useDriverClusters(profileQuery.data?.driverId || null);
  const updateClusterMutation = useUpdateClusterStatus();
  const updateOrderMutation = useUpdateOrderStatus();

  // Get current cluster from cached data
  const currentCluster = clustersQuery.data?.[0] || null;
  const orders: DeliveryOrder[] = currentCluster ? convertClusterToOrders(currentCluster) : [];
  const routeInfo: RouteInfo | null = currentCluster ? createRouteInfo(currentCluster, orders) : null;

  // Check if delivery is in progress when cluster data loads
  useEffect(() => {
    if (currentCluster) {
      if (currentCluster.status === 'IN_PROGRESS') {
        setDeliveryStarted(true);
        // Find current order index (first non-delivered order)
        const currentIndex = orders.findIndex(o => o.status !== 'delivered');
        setCurrentOrderIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  }, [currentCluster]);

  // Auto-fit map when orders load
  useEffect(() => {
    if (currentCluster && orders.length > 0 && mapRef.current) {
      setTimeout(() => {
        const coordinates = [
          currentLocation,
          ...orders.map(order => order.coordinates)
        ];
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }, 1000);
    }
  }, [currentCluster]);

  // Fetch road-based route when delivery starts or current order changes
  useEffect(() => {
    if (deliveryStarted && orders[currentOrderIndex]) {
      const fetchRoute = async () => {
        const destination = orders[currentOrderIndex].coordinates;
        const route = await fetchDirectionsRoute(currentLocation, destination);
        setRouteCoordinates(route);
      };
      fetchRoute();
    }
  }, [deliveryStarted, currentOrderIndex]);

  useEffect(() => {
    getCurrentLocation();
    requestLocationPermissions();
  }, []);

  // Start location tracking when delivery starts
  useEffect(() => {
    if (deliveryStarted && orders.length > 0) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [deliveryStarted, currentOrderIndex]);

  const requestLocationPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is required for navigation and delivery tracking.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        // Use default warehouse/depot location (Colombo, Sri Lanka)
        setCurrentLocation({
          latitude: 6.9271,
          longitude: 79.8612,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      // Fallback to default location
      setCurrentLocation({
        latitude: 6.9271,
        longitude: 79.8612,
      });
    }
  };

  const startLocationTracking = async () => {
    try {
      // Stop existing watch if any
      stopLocationTracking();

      locationWatchId.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newLocation);

          // Check if near current delivery location
          checkProximityToDelivery(newLocation);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationWatchId.current) {
      locationWatchId.current.remove();
      locationWatchId.current = null;
    }
  };

  const checkProximityToDelivery = (driverLocation: { latitude: number; longitude: number }) => {
    if (!deliveryStarted || currentOrderIndex >= orders.length) return;

    const currentOrder = orders[currentOrderIndex];
    if (currentOrder.status !== 'in_progress') return;

    const distance = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      currentOrder.coordinates.latitude,
      currentOrder.coordinates.longitude
    );

    // If within 100 meters (0.1 km) of delivery location, show dialog
    const PROXIMITY_THRESHOLD = 100; // meters

    if (distance <= PROXIMITY_THRESHOLD && !showDeliveryDialog) {
      setNearbyOrder(currentOrder);
      setShowDeliveryDialog(true);
    }
  };

  // Decode Google polyline to coordinates
  const decodePolyline = (encoded: string): Array<{latitude: number, longitude: number}> => {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return poly;
  };

  // Fetch road-based route from Google Directions API
  const fetchDirectionsRoute = async (origin: {latitude: number, longitude: number}, destination: {latitude: number, longitude: number}) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      return [];
    }

    try {
      setFetchingRoute(true);
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destStr = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        return points;
      } else {
        console.error('Google Directions API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      return [];
    } finally {
      setFetchingRoute(false);
    }
  };

  // Open external navigation app
  const openExternalNavigation = async (destination: {latitude: number, longitude: number}, address: string) => {
    const lat = destination.latitude;
    const lng = destination.longitude;
    const label = encodeURIComponent(address);

    const options = [
      {
        name: 'Google Maps',
        url: Platform.select({
          ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
          android: `google.navigation:q=${lat},${lng}`,
        }),
        webUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      },
      {
        name: 'Waze',
        url: `waze://?ll=${lat},${lng}&navigate=yes`,
        webUrl: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
      },
    ];

    Alert.alert(
      'Navigate with',
      'Choose navigation app',
      [
        ...options.map(option => ({
          text: option.name,
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(option.url || '');
              if (supported) {
                await Linking.openURL(option.url || '');
              } else {
                // Fallback to web URL
                await Linking.openURL(option.webUrl);
              }
            } catch (error) {
              console.error(`Error opening ${option.name}:`, error);
              Alert.alert('Error', `Could not open ${option.name}`);
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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


  const handleOptimizeRoute = () => {
    // Route is already optimized by backend clustering algorithm
    Alert.alert(
      'Route Already Optimized', 
      'Your delivery route has been optimized by our TSP algorithm based on distance and priority.'
    );
  };

  const handleCompleteDelivery = async (order: DeliveryOrder) => {
    if (!currentCluster) return;
    
    Alert.alert(
      'Complete Delivery',
      `Mark delivery to ${order.customerName} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              // Find the cluster order ID for this order
              const clusterOrder = currentCluster.orders.find(o => o.orderId === order.orderId);
              if (clusterOrder) {
                // Update delivery status via mutation
                await updateOrderMutation.mutateAsync({
                  clusterOrderId: clusterOrder.clusterOrderId,
                  status: 'DELIVERED'
                });
              }

              // Check if all orders in cluster are delivered (after this one)
              const allCompleted = currentCluster.orders.every(o => 
                o.orderId === order.orderId || o.deliveryStatus === 'DELIVERED'
              );
              
              if (allCompleted) {
                await updateClusterMutation.mutateAsync({
                  clusterId: currentCluster.clusterId,
                  status: 'COMPLETED'
                });
                Alert.alert('Cluster Complete!', 'All deliveries in this cluster have been completed.');
              }
            } catch (error) {
              console.error('Error completing delivery:', error);
              Alert.alert('Error', 'Failed to update delivery status. Please try again.');
            }
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

  const handleStartClusterDelivery = async () => {
    const clusterName = currentCluster?.clusterName || 'Delivery Cluster';
    const totalOrders = orders.length;
    
    Alert.alert(
      'Start Delivery Cluster',
      `Start delivering ${clusterName}?\n${totalOrders} orders to complete`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            if (!currentCluster) return;
            
            try {
              // Update cluster status to IN_PROGRESS using mutation
              await updateClusterMutation.mutateAsync({
                clusterId: currentCluster.clusterId,
                status: 'IN_PROGRESS'
              });

              // Update first order to IN_TRANSIT
              if (orders.length > 0) {
                const firstOrder = currentCluster.orders[0];
                await updateOrderMutation.mutateAsync({
                  clusterOrderId: firstOrder.clusterOrderId,
                  status: 'IN_TRANSIT'
                });
              }

              setDeliveryStarted(true);
              setCurrentOrderIndex(0);
            } catch (error) {
              console.error('Error starting cluster delivery:', error);
              Alert.alert('Error', 'Failed to start delivery. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCompleteCurrentOrder = async () => {
    const currentOrder = orders[currentOrderIndex];
    if (!currentCluster) return;
    
    try {
      // Find the cluster order ID for this order
      const clusterOrder = currentCluster.orders.find(o => o.orderId === currentOrder.orderId);
      if (clusterOrder) {
        // Update delivery status via mutation
        await updateOrderMutation.mutateAsync({
          clusterOrderId: clusterOrder.clusterOrderId,
          status: 'DELIVERED'
        });
      }

      // Close dialog if open
      setShowDeliveryDialog(false);
      setNearbyOrder(null);

      // Check if there are more orders
      if (currentOrderIndex < orders.length - 1) {
        const nextIndex = currentOrderIndex + 1;
        
        // Update next order to IN_TRANSIT via mutation
        const nextClusterOrder = currentCluster.orders[nextIndex];
        if (nextClusterOrder) {
          await updateOrderMutation.mutateAsync({
            clusterOrderId: nextClusterOrder.clusterOrderId,
            status: 'IN_TRANSIT'
          });
        }

        setCurrentOrderIndex(nextIndex);
        
        // Focus map on next delivery
        if (mapRef.current && orders[nextIndex]) {
          mapRef.current.animateToRegion({
            latitude: orders[nextIndex].coordinates.latitude,
            longitude: orders[nextIndex].coordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
        
        Alert.alert('Next Delivery', `Moving to: ${orders[nextIndex].customerAddress}`);
      } else {
        // All orders completed - update cluster status
        await updateClusterMutation.mutateAsync({
          clusterId: currentCluster.clusterId,
          status: 'COMPLETED'
        });
        Alert.alert('🎉 Cluster Complete!', 'All deliveries in this cluster have been completed.');
        setDeliveryStarted(false);
        stopLocationTracking();
      }
    } catch (error) {
      console.error('Error completing order:', error);
      Alert.alert('Error', 'Failed to complete delivery. Please try again.');
    }
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
        {currentCluster && (
          <View style={styles.clusterInfoContainer}>
            <View style={styles.clusterHeader}>
              <Ionicons name="layers" size={20} color="#FFFFFF" />
              <Text style={styles.clusterName}>{currentCluster.clusterName}</Text>
            </View>
            <Text style={styles.clusterMeta}>
              Cluster #{currentCluster.clusterId} • {currentCluster.totalOrders} Orders • {currentCluster.status.toUpperCase()}
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
        )}

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

      {/* Map - Show when there are orders */}
      {orders.length > 0 && (
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

          {/* Route Polyline - Road-based when available, otherwise straight line */}
          {deliveryStarted && routeCoordinates.length > 0 ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#3B82F6"
              strokeWidth={4}
              geodesic={true}
            />
          ) : routeInfo && (
            <Polyline
              coordinates={[
                currentLocation,
                ...routeInfo.optimizedRoute.map(point => ({
                  latitude: point.latitude,
                  longitude: point.longitude
                }))
              ]}
              strokeColor="#9CA3AF"
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

        {/* Floating Start Delivery Button - Show when delivery not started */}
        {!deliveryStarted && currentCluster && (
          <View style={styles.floatingStartButton}>
            <TouchableOpacity 
              style={styles.startDeliveryFloatingButton}
              onPress={handleStartClusterDelivery}
            >
              <Ionicons name="play-circle" size={24} color="#FFFFFF" />
              <Text style={styles.startDeliveryFloatingText}>Start Delivery</Text>
            </TouchableOpacity>
          </View>
        )}
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
            
            {/* Distance to destination */}
            {(() => {
              const distanceToDestination = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                orders[currentOrderIndex].coordinates.latitude,
                orders[currentOrderIndex].coordinates.longitude
              );
              const distanceKm = (distanceToDestination / 1000).toFixed(2);
              const distanceM = Math.round(distanceToDestination);
              
              return (
                <View style={styles.distanceIndicator}>
                  <Ionicons 
                    name="navigate" 
                    size={20} 
                    color={distanceToDestination <= 100 ? '#16A34A' : '#3B82F6'} 
                  />
                  <Text style={styles.distanceText}>
                    {distanceToDestination >= 1000 ? `${distanceKm} km away` : `${distanceM}m away`}
                  </Text>
                  {distanceToDestination <= 100 && (
                    <View style={styles.arrivedBadge}>
                      <Text style={styles.arrivedText}>ARRIVED</Text>
                    </View>
                  )}
                </View>
              );
            })()}
            
            <View style={styles.currentOrderMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{orders[currentOrderIndex].estimatedDeliveryTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="list" size={16} color="#6B7280" />
                <Text style={styles.metaText}>Stop {currentOrderIndex + 1}/{orders.length}</Text>
              </View>
            </View>

            {/* Navigate Button */}
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => openExternalNavigation(
                orders[currentOrderIndex].coordinates,
                orders[currentOrderIndex].customerAddress
              )}
            >
              <Ionicons name="navigate" size={20} color="#FFFFFF" />
              <Text style={styles.navigateButtonText}>Open Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Orders List */}
      <View style={styles.ordersContainer}>
        <View style={styles.ordersHeader}>
          <Text style={styles.ordersTitle}>Assigned Orders ({orders.length})</Text>
          <TouchableOpacity 
            onPress={() => clustersQuery.refetch()}
            disabled={clustersQuery.isRefetching}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={clustersQuery.isRefetching ? '#9CA3AF' : '#3B82F6'} 
            />
          </TouchableOpacity>
        </View>
        
        {clustersQuery.isLoading && !currentCluster ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : (
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
        )}
        
        {!clustersQuery.isLoading && orders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Orders Assigned</Text>
            <Text style={styles.emptyMessage}>You don't have any delivery orders at the moment. Check back later for new assignments.</Text>
          </View>
        )}
      </View>

      {/* Delivery Confirmation Dialog - Auto-shown when near location */}
      <Modal
        visible={showDeliveryDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeliveryDialog(false)}
      >
        <View style={styles.deliveryDialogOverlay}>
          <View style={styles.deliveryDialogContent}>
            <View style={styles.deliveryDialogHeader}>
              <Ionicons name="location" size={48} color="#16A34A" />
              <Text style={styles.deliveryDialogTitle}>You've Arrived!</Text>
              <Text style={styles.deliveryDialogSubtitle}>
                You're at the delivery location
              </Text>
            </View>

            {nearbyOrder && (
              <View style={styles.deliveryDialogBody}>
                <View style={styles.deliveryDialogInfo}>
                  <Text style={styles.deliveryDialogOrderId}>Order #{nearbyOrder.id}</Text>
                  <Text style={styles.deliveryDialogAddress}>
                    📍 {nearbyOrder.customerAddress}
                  </Text>
                </View>

                <View style={styles.deliveryDialogActions}>
                  <TouchableOpacity 
                    style={styles.deliveryDialogCompleteButton}
                    onPress={handleCompleteCurrentOrder}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.deliveryDialogCompleteText}>Mark as Delivered</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.deliveryDialogCancelButton}
                    onPress={() => setShowDeliveryDialog(false)}
                  >
                    <Text style={styles.deliveryDialogCancelText}>Not Yet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
                  
                  {selectedOrder.status === 'pending' && (
                    <View style={styles.modalInfoBox}>
                      <Ionicons name="information-circle" size={20} color="#3B82F6" />
                      <Text style={styles.modalInfoText}>
                        Start the delivery cluster from the main screen to begin deliveries
                      </Text>
                    </View>
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
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
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
  distanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  arrivedBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  arrivedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  currentOrderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  floatingStartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  startDeliveryFloatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startDeliveryFloatingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  modalInfoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  // Delivery Dialog Styles
  deliveryDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deliveryDialogContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  deliveryDialogHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  deliveryDialogTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  deliveryDialogSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  deliveryDialogBody: {
    padding: 24,
  },
  deliveryDialogInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  deliveryDialogOrderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  deliveryDialogAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  deliveryDialogActions: {
    gap: 12,
  },
  deliveryDialogCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deliveryDialogCompleteText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  deliveryDialogCancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  deliveryDialogCancelText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeliveryManagement;
