export interface DeliveryOrder {
  id: string;
  orderId?: number; // Numeric order ID from the backend
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  estimatedDeliveryTime: string;
  distance: number; // in meters
  coordinates: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'in_progress' | 'delivered' | 'failed';
  pickupTime?: string;
  deliveryTime?: string;
  notes?: string;
  specialInstructions?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  sequence?: number; // Order in the delivery sequence
  managerNotes?: string;
}

export interface TruckInfo {
  id: string;
  licensePlate: string;
  model: string;
  year: number;
  mileage: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceStatus: 'good' | 'due_soon' | 'overdue';
  fuelLevel: number; // percentage
  engineHours: number;
}

export interface MaintenanceSchedule {
  id: string;
  type: 'oil_change' | 'tire_rotation' | 'brake_inspection' | 'engine_check' | 'general_inspection';
  description: string;
  dueDate: string;
  dueMileage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed: boolean;
  completedDate?: string;
}

export interface BreakdownReport {
  id: string;
  truckId: string;
  driverId: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  symptoms: string[];
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  status: 'reported' | 'assistance_requested' | 'being_repaired' | 'resolved';
  aiSuggestions?: string[];
  mechanicAssigned?: boolean;
}

export interface RouteInfo {
  totalDistance: number; // in meters
  estimatedTime: number; // in minutes
  currentOrderIndex: number;
  orders: DeliveryOrder[];
  optimizedRoute: {
    latitude: number;
    longitude: number;
    orderId: string;
  }[];
}

export interface DriverNotification {
  id: string;
  type: 'new_order' | 'route_change' | 'priority_order' | 'route_alert' | 'delivery_reminder' | 'manager_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderId?: string;
  actionRequired?: boolean;
  routeDeviation?: {
    currentLocation: { latitude: number; longitude: number };
    expectedLocation: { latitude: number; longitude: number };
    deviationDistance: number; // in meters
  };
}

export interface DriverDetails {
  driverId: number;
  userId: number;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: string;
  availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'ON_DELIVERY';
  emergencyContact: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverApiResponse {
  success: boolean;
  message: string;
  data: DriverDetails;
  timestamp: string;
  error: null;
}

export interface DriverAssignment {
  assignmentId: number;
  driverId: number;
  vehicleId: number;
  status: string;
  assignedBy: number;
  assignedAt: string;
  unassignedAt: string | null;
  unassignedBy: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverAssignmentResponse {
  success: boolean;
  message: string;
  data: DriverAssignment[];
  timestamp: string;
  error: null;
}

export interface VehicleDetails {
  vehicleId: number;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  status: string;
  assignedDriverId: number | null;
  make: string;
  model: string;
  year: number;
  lastMaintenance: string;
  nextMaintenance: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleApiResponse {
  success: boolean;
  message: string;
  data: VehicleDetails;
  timestamp: string;
  error: null;
}

export interface DriverProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  joinDate: string;
  totalDeliveries: number;
  rating: number;
  status: 'available' | 'on_delivery' | 'off_duty' | 'break';
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  lastLocationUpdate?: string;
}
