import { DriverApiResponse, DriverAssignmentResponse, VehicleApiResponse } from '../types/Driver';
import { DRIVER_API_URL } from '../config/apiConfig';

const BASE_URL = `${DRIVER_API_URL}/api/resources/drivers`;
const ASSIGNMENTS_URL = `${DRIVER_API_URL}/api/resources/assignments`;
const VEHICLES_URL = `${DRIVER_API_URL}/api/resources/vehicles`;

export const driverService = {
  /**
   * Get driver details by user ID
   */
  async getDriverByUserId(userId: number, token: string): Promise<DriverApiResponse> {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DriverApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching driver details:', error);
      throw error;
    }
  },

  /**
   * Get driver assignments by driver ID
   */
  async getDriverAssignments(driverId: number, token: string): Promise<DriverAssignmentResponse> {
    try {
      const response = await fetch(`${ASSIGNMENTS_URL}/driver/${driverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DriverAssignmentResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching driver assignments:', error);
      throw error;
    }
  },

  /**
   * Get vehicle details by vehicle ID
   */
  async getVehicleDetails(vehicleId: number, token: string): Promise<VehicleApiResponse> {
    try {
      const response = await fetch(`${VEHICLES_URL}/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: VehicleApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      throw error;
    }
  },
};
