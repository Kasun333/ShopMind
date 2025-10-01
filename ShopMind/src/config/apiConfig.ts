// API Configuration
// Change the IP address here when connecting to a different network
export const API_CONFIG = {
  BASE_IP: '192.168.1.101', // Change this IP when network changes
  
  // Service endpoints
  AUTH_SERVICE: {
    PORT: '8080',
    BASE_URL: '',
  },
  ORDER_SERVICE: {
    PORT: '8084', 
    BASE_URL: '',
  },
  PAYMENT_SERVICE: {
    PORT: '8084',
    BASE_URL: '',
  },
  ECOMMERCE_SERVICE: {
    PORT: '8083',
    BASE_URL: '',
  },
  NOTIFICATION_SERVICE: {
    PORT: '8087',
    BASE_URL: '',
    WS_URL: '',
  },
  STOCK_ALERTS_SERVICE: {
    PORT: '8085',
    BASE_URL: '',
  },
  DRIVER_SERVICE: {
    PORT: '8090',
    BASE_URL: '',
  },
};

// Auto-generate full URLs
API_CONFIG.AUTH_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.AUTH_SERVICE.PORT}`;
API_CONFIG.ORDER_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.ORDER_SERVICE.PORT}`;
API_CONFIG.PAYMENT_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.PAYMENT_SERVICE.PORT}`;
API_CONFIG.ECOMMERCE_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.ECOMMERCE_SERVICE.PORT}`;
API_CONFIG.NOTIFICATION_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.NOTIFICATION_SERVICE.PORT}`;
API_CONFIG.NOTIFICATION_SERVICE.WS_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.NOTIFICATION_SERVICE.PORT}/ws`;
API_CONFIG.STOCK_ALERTS_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.STOCK_ALERTS_SERVICE.PORT}`;
API_CONFIG.DRIVER_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.DRIVER_SERVICE.PORT}`;

// External APIs (these don't change with network)
export const EXTERNAL_APIS = {
  EMAIL_VERIFICATION: 'https://emailvalidation.abstractapi.com/v1/',
  CLOUDINARY: 'https://api.cloudinary.com/v1_1/',
};

// Export individual service URLs for easy access
export const AUTH_API_URL = API_CONFIG.AUTH_SERVICE.BASE_URL;
export const ORDER_API_URL = API_CONFIG.ORDER_SERVICE.BASE_URL;
export const PAYMENT_API_URL = API_CONFIG.PAYMENT_SERVICE.BASE_URL;
export const ECOMMERCE_API_URL = API_CONFIG.ECOMMERCE_SERVICE.BASE_URL;
export const NOTIFICATION_API_URL = API_CONFIG.NOTIFICATION_SERVICE.BASE_URL;
export const WEBSOCKET_URL = API_CONFIG.NOTIFICATION_SERVICE.WS_URL;
export const STOCK_ALERTS_API_URL = API_CONFIG.STOCK_ALERTS_SERVICE.BASE_URL;
export const DRIVER_API_URL = API_CONFIG.DRIVER_SERVICE.BASE_URL;

// Revenue API endpoints
export const REVENUE_API_URL = API_CONFIG.ORDER_SERVICE.BASE_URL;
export const REVENUE_ENDPOINTS = {
  TODAY: `${REVENUE_API_URL}/api/revenue/today`,
  MONTHLY: `${REVENUE_API_URL}/api/revenue/monthly`,
};

// Order count API endpoints
export const ORDER_COUNT_ENDPOINTS = {
  PROCESSED: `${ORDER_API_URL}/api/orders/count/processed`,
  CONFIRMED: `${ORDER_API_URL}/api/orders/count/confirmed`,
};

// Paginated orders API endpoints
export const PAGINATED_ORDERS_ENDPOINTS = {
  BASE: `${ORDER_API_URL}/api/orders/all`,
  BY_STATUS: (status: string) => `${ORDER_API_URL}/api/orders/all/${status}`,
  WITH_PAGINATION: (status: string, page: number = 0, size: number = 10) => 
    `${ORDER_API_URL}/api/orders/all/${status}?page=${page}&size=${size}`,
};

// Stock alerts API endpoints
export const STOCK_ALERTS_ENDPOINTS = {
  GET_ALERTS: `${STOCK_ALERTS_API_URL}/api/stock-alerts`,
};

// TypeScript types for paginated orders response
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export interface PaginatedOrdersResponse<T = any> {
  success: boolean;
  message: string;
  orders: T[];
  totalOrders: number;
  pagination: PaginationInfo;
}

// Helper function for building paginated orders URLs
export const buildPaginatedOrdersUrl = (
  status: string, 
  page: number = 0, 
  size: number = 10
): string => {
  // Ensure size doesn't exceed maximum of 100
  const validatedSize = Math.min(size, 100);
  return PAGINATED_ORDERS_ENDPOINTS.WITH_PAGINATION(status, page, validatedSize);
};
