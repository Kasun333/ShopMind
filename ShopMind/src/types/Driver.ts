export interface DeliveryOrder {
  id: string;
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
