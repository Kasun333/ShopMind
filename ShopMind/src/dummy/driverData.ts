import { DeliveryOrder } from '../types/Driver';

// Dummy cluster information
export const dummyCluster = {
  clusterId: 'CLU001',
  clusterName: 'Colombo Central Route',
  assignedDate: '2025-10-02',
  status: 'assigned' as const,
  totalOrders: 5,
};

// Simplified dummy order data - only essential fields for display
export const dummyOrders: DeliveryOrder[] = [
  {
    id: '1001',
    customerName: 'Customer #C101',
    customerAddress: '123 Main Street, Colombo 03',
    customerPhone: '+94771234567',
    items: [],
    totalAmount: 0,
    estimatedDeliveryTime: '10:30 AM',
    distance: 500,
    coordinates: { latitude: 6.9271, longitude: 79.8612 },
    status: 'pending',
    sequence: 1,
  },
  {
    id: '1002',
    customerName: 'Customer #C102',
    customerAddress: '456 Galle Road, Colombo 04',
    customerPhone: '+94771234568',
    items: [],
    totalAmount: 0,
    estimatedDeliveryTime: '11:15 AM',
    distance: 1200,
    coordinates: { latitude: 6.8851, longitude: 79.8579 },
    status: 'pending',
    sequence: 2,
  },
  {
    id: '1003',
    customerName: 'Customer #C103',
    customerAddress: '789 Duplication Road, Colombo 05',
    customerPhone: '+94771234569',
    items: [],
    totalAmount: 0,
    estimatedDeliveryTime: '12:00 PM',
    distance: 800,
    coordinates: { latitude: 6.8915, longitude: 79.8588 },
    status: 'pending',
    sequence: 3,
  },
  {
    id: '1004',
    customerName: 'Customer #C104',
    customerAddress: '321 Baseline Road, Colombo 09',
    customerPhone: '+94771234570',
    items: [],
    totalAmount: 0,
    estimatedDeliveryTime: '1:00 PM',
    distance: 1500,
    coordinates: { latitude: 6.9050, longitude: 79.8650 },
    status: 'pending',
    sequence: 4,
  },
  {
    id: '1005',
    customerName: 'Customer #C105',
    customerAddress: '567 Havelock Road, Colombo 06',
    customerPhone: '+94771234571',
    items: [],
    totalAmount: 0,
    estimatedDeliveryTime: '2:00 PM',
    distance: 2000,
    coordinates: { latitude: 6.8795, longitude: 79.8715 },
    status: 'pending',
    sequence: 5,
  }
];

// Driver's starting location (warehouse/depot)
export const driverStartLocation = {
  latitude: 6.9172,
  longitude: 79.8612,
  name: 'ShopMind Warehouse',
  address: 'Central Warehouse, Colombo 10'
};

// Optimized route coordinates (in sequence order)
export const optimizedRouteCoordinates = [
  driverStartLocation, // Start point
  dummyOrders[0].coordinates, // Order 1
  dummyOrders[1].coordinates, // Order 2
  dummyOrders[2].coordinates, // Order 3
  dummyOrders[3].coordinates, // Order 4
  dummyOrders[4].coordinates, // Order 5
];

// Route statistics
export const routeStats = {
  totalDistance: 6000, // in meters (6 km total)
  totalDuration: 90, // in minutes (1.5 hours)
  numberOfStops: 5,
  startTime: '10:00 AM',
  estimatedEndTime: '2:30 PM'
};

