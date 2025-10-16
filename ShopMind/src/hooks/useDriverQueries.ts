import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { 
  getDriverActiveClusters,
  getDriverClustersByStatus,
  updateClusterStatus,
  updateOrderDeliveryStatus
} from '../services/deliveryClusterService';

// Query Keys - centralized for consistency
export const driverQueryKeys = {
  driverProfile: (userId: number) => ['driver', 'profile', userId],
  driverClusters: (driverId: number) => ['driver', 'clusters', driverId],
  driverClustersByStatus: (driverId: number, status: string) => ['driver', 'clusters', driverId, status],
};

// Hook to fetch driver profile by user ID
export const useDriverProfile = (userId: number, token: string) => {
  return useQuery({
    queryKey: driverQueryKeys.driverProfile(userId),
    queryFn: async () => {
      const response = await driverService.getDriverByUserId(userId, token);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch driver profile');
      }
      return response.data;
    },
    enabled: !!userId && !!token, // Only run if we have userId and token
    staleTime: 10 * 60 * 1000, // Driver profile is fresh for 10 minutes
  });
};

// Hook to fetch active clusters for a driver
export const useDriverClusters = (driverId: number | null) => {
  return useQuery({
    queryKey: driverQueryKeys.driverClusters(driverId || 0),
    queryFn: async () => {
      if (!driverId) throw new Error('No driver ID');
      const clusters = await getDriverActiveClusters(driverId);
      return clusters;
    },
    enabled: !!driverId, // Only run if we have a driverId
    staleTime: 3 * 60 * 1000, // Clusters are fresh for 3 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes in background
  });
};

// Hook to fetch clusters by status
export const useDriverClustersByStatus = (
  driverId: number | null,
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
) => {
  return useQuery({
    queryKey: driverQueryKeys.driverClustersByStatus(driverId || 0, status),
    queryFn: async () => {
      if (!driverId) throw new Error('No driver ID');
      const clusters = await getDriverClustersByStatus(driverId, status);
      return clusters;
    },
    enabled: !!driverId,
    staleTime: 3 * 60 * 1000,
  });
};

// Hook to update cluster status (mutation)
export const useUpdateClusterStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clusterId, 
      status 
    }: { 
      clusterId: number; 
      status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' 
    }) => {
      return await updateClusterStatus(clusterId, status);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch all cluster queries
      queryClient.invalidateQueries({ queryKey: ['driver', 'clusters'] });
    },
  });
};

// Hook to update order delivery status (mutation)
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clusterOrderId, 
      status, 
      notes 
    }: { 
      clusterOrderId: number; 
      status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
      notes?: string;
    }) => {
      return await updateOrderDeliveryStatus(clusterOrderId, status, notes);
    },
    onSuccess: () => {
      // Invalidate and refetch all cluster queries to get updated order statuses
      queryClient.invalidateQueries({ queryKey: ['driver', 'clusters'] });
    },
  });
};

// Combined hook for dashboard - fetches both profile and clusters
export const useDriverDashboardData = (userId: number, token: string) => {
  const profileQuery = useDriverProfile(userId, token);
  const clustersQuery = useDriverClusters(profileQuery.data?.driverId || null);

  return {
    profile: profileQuery.data,
    clusters: clustersQuery.data || [],
    isLoading: profileQuery.isLoading || clustersQuery.isLoading,
    isError: profileQuery.isError || clustersQuery.isError,
    error: profileQuery.error || clustersQuery.error,
    refetch: () => {
      profileQuery.refetch();
      clustersQuery.refetch();
    },
  };
};

