export interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  price: number;
  createdAt: string;
}

export interface Order {
  orderId: number;
  customerId: number;
  orderDate: string;
  status: 'CONFIRMED' | 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  // Additional fields for UI (these might come from other APIs)
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  deliveryDate?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'card' | 'cash' | 'online';
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedDeliveryTime?: string;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
  priority?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayRevenue: number;
  monthRevenue: number;
}
