// deliveryClusterService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DRIVER_API_URL } from '../config/apiConfig';

export interface ClusterOrder {
  clusterOrderId: number;
  orderId: number;
  deliverySequence: number;
  customerLatitude: number;
  customerLongitude: number;
  customerAddress: string;
  deliveryStatus: string;
  deliveredAt?: string;
  deliveryNotes?: string;
}

export interface DeliveryCluster {
  clusterId: number;
  clusterName: string;
  assignedDriverId: number;
  driverName: string;
  assignmentId: number;
  totalDistance: number;
  estimatedTime: number;
  status: string;
  createdAt: string;
  assignedAt: string;
  completedAt?: string;
  totalOrders: number;
  orders: ClusterOrder[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: string;
}

// Get auth token from AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Get assigned clusters for a driver by status
export const getDriverClustersByStatus = async (
  driverId: number,
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
): Promise<DeliveryCluster[]> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(
      `${DRIVER_API_URL}/api/resources/delivery-clusters/driver/${driverId}/status/${status}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch clusters');
    }

    const result: ApiResponse<DeliveryCluster[]> = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch clusters');
    }
  } catch (error) {
    console.error('Error fetching driver clusters by status:', error);
    throw error;
  }
};

// Get all active clusters for a driver (ASSIGNED and IN_PROGRESS)
export const getDriverActiveClusters = async (
  driverId: number
): Promise<DeliveryCluster[]> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(
      `${DRIVER_API_URL}/api/resources/delivery-clusters/driver/${driverId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch clusters');
    }

    const result: ApiResponse<DeliveryCluster[]> = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch clusters');
    }
  } catch (error) {
    console.error('Error fetching driver active clusters:', error);
    throw error;
  }
};

// Get TSP-optimized delivery sequence for a driver
export const getDriverDeliverySequence = async (
  driverId: number
): Promise<ClusterOrder[]> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(
      `${DRIVER_API_URL}/api/resources/delivery-clusters/driver/${driverId}/delivery-sequence`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch delivery sequence');
    }

    const result: ApiResponse<ClusterOrder[]> = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch delivery sequence');
    }
  } catch (error) {
    console.error('Error fetching delivery sequence:', error);
    throw error;
  }
};

// Update cluster status
export const updateClusterStatus = async (
  clusterId: number,
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
): Promise<DeliveryCluster> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(
      `${DRIVER_API_URL}/api/resources/delivery-clusters/${clusterId}/status?status=${status}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update cluster status');
    }

    const result: ApiResponse<DeliveryCluster> = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to update cluster status');
    }
  } catch (error) {
    console.error('Error updating cluster status:', error);
    throw error;
  }
};

// Update order delivery status
export const updateOrderDeliveryStatus = async (
  clusterOrderId: number,
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED',
  notes?: string
): Promise<void> => {
  try {
    const token = await getAuthToken();
    
    const url = new URL(
      `${DRIVER_API_URL}/api/resources/delivery-clusters/orders/${clusterOrderId}/delivery-status`
    );
    url.searchParams.append('status', status);
    if (notes) {
      url.searchParams.append('notes', notes);
    }
    
    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update order status');
    }
  } catch (error) {
    console.error('Error updating order delivery status:', error);
    throw error;
  }
};

