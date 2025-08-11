import { Order } from '../types/Order';

const BASE_URL = 'http://10.59.35.210:8084/api';

export interface OrdersResponse {
  success: boolean;
  message: string;
  orders: Order[];
  totalOrders: number;
}

export const orderService = {
  /**
   * Fetch all confirmed orders
   */
  async getAllOrders(token: string): Promise<OrdersResponse> {
    try {
      const response = await fetch(`${BASE_URL}/payments/orders/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OrdersResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, status: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  /**
   * Get order statistics
   */
  async getOrderStats(token: string): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/orders/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }
  },
};
