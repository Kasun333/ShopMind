import { Order } from '../types/Order';

const BASE_URL = 'http://192.168.1.7:8090/api';

export interface OrdersResponse {
  success: boolean;
  message: string;
  orders: Order[];
  totalOrders: number;
}

export const orderService = {
  /**
   * Fetch orders by status (Confirmed or Processed)
   */
  async getOrdersByStatus(status: string, token: string): Promise<OrdersResponse> {
    try {
      const response = await fetch(`${BASE_URL}/payments/orders/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: OrdersResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  },
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
   * Mark order as processed
   */
  async processOrder(orderId: number, token: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/payments/update-order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status: 'PROCESSED' }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error processing order:', error);
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
