import { ORDER_API_URL } from '../config/apiConfig';

export interface OrderItem {
  orderItemId: number;
  productId: number | null;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  barcode: string | null;
  price: number;
  createdAt: string;
}

export interface Order {
  orderId: number;
  customerId: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
}

export interface UserOrdersResponse {
  success: boolean;
  message: string;
  orders: Order[];
  totalOrders: number;
}

export class UserOrderService {
  /**
   * Fetch orders for a specific user
   */
  static async getUserOrders(userId: number, token: string): Promise<UserOrdersResponse> {
    try {
      const response = await fetch(`${ORDER_API_URL}/api/orders/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch orders',
          orders: [],
          totalOrders: 0,
        };
      }

      return {
        success: data.success,
        message: data.message,
        orders: data.orders || [],
        totalOrders: data.totalOrders || 0,
      };
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return {
        success: false,
        message: 'Could not connect to server',
        orders: [],
        totalOrders: 0,
      };
    }
  }

  /**
   * Filter orders by status
   */
  static filterOrdersByStatus(orders: Order[], status: string): Order[] {
    if (status === 'ALL') {
      return orders;
    }
    return orders.filter(order => order.status === status);
  }

  /**
   * Get unique order statuses from orders list
   */
  static getUniqueStatuses(orders: Order[]): string[] {
    const statuses = new Set<string>();
    orders.forEach(order => statuses.add(order.status));
    return ['ALL', ...Array.from(statuses).sort()];
  }

  /**
   * Format order date for display
   */
  static formatOrderDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#3B82F6';
      case 'processed':
        return '#8B5CF6';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  }

  /**
   * Get status background color for UI
   */
  static getStatusBackgroundColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FEF3C7';
      case 'confirmed':
        return '#DBEAFE';
      case 'processed':
        return '#EDE9FE';
      case 'delivered':
        return '#D1FAE5';
      case 'cancelled':
        return '#FEE2E2';
      default:
        return '#F3F4F6';
    }
  }
}
