import { DriverApiResponse } from '../types/Driver';
import { DRIVER_API_URL } from '../config/apiConfig';

const BASE_URL = `${DRIVER_API_URL}/api/resources/drivers`;

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
};
