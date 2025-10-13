// API Configuration
// Change the IP address here when connecting to a different network
export const API_CONFIG = {
  BASE_IP: '10.239.254.210', // Change this IP when network changes
  
  // Service endpoints
  AUTH_SERVICE: {
    PORT: '',
    BASE_URL: 'https://userservice-337812374841.us-central1.run.app',
    HOSTED: true, // Flag to indicate this service is hosted
  },
  ORDER_SERVICE: {
    PORT: '', // No port since it's on Cloud Run
    BASE_URL: 'https://order-service-337812374841.us-central1.run.app', // Hosted URL
    HOSTED: true,
  },
  PAYMENT_SERVICE: {
    PORT: '',
    BASE_URL: 'https://order-service-337812374841.us-central1.run.app', // Using same hosted URL as order service
    HOSTED: true,
  },
  ECOMMERCE_SERVICE: {
    PORT: '',
    BASE_URL: 'https://d201c53c-c644-4920-ab04-ef977962e680-dev.e1-us-east-azure.choreoapis.dev/invfentory/productservice-gw/v1.0',
    HOSTED: true,
  },
  NOTIFICATION_SERVICE: {
    PORT: '8087',
    BASE_URL: 'https://shopmindnotification.app',
    WS_URL: 'wss://shopmindnotification.app/ws',
    HOSTED: true,
    // Alternative endpoints available:
    // WS_URL_SOCKJS: 'http://34.136.119.127:8087/notifications', // SockJS fallback
    // WS_URL_RN_PURE: 'http://34.136.119.127:8087/rn-notifications', // Pure WebSocket (no STOMP)
    // WS_URL_PURE_STOMP: 'http://34.136.119.127:8087/websocket', // Pure STOMP
  },
  STOCK_ALERTS_SERVICE: {
    PORT: '8085',
    BASE_URL: '',
  },
  DRIVER_SERVICE: {
    PORT: '',
    BASE_URL: 'https://d201c53c-c644-4920-ab04-ef977962e680-dev.e1-us-east-azure.choreoapis.dev/invfentory/resourseservice/v1.0',
    HOSTED: true,
  },
};

// Auto-generate full URLs for services still using BASE_IP (skip hosted services)
if (!API_CONFIG.AUTH_SERVICE.HOSTED) {
  API_CONFIG.AUTH_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.AUTH_SERVICE.PORT}`;
}
if (!API_CONFIG.ORDER_SERVICE.HOSTED) {
  API_CONFIG.ORDER_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.ORDER_SERVICE.PORT}`;
}
if (!API_CONFIG.PAYMENT_SERVICE.HOSTED) {
  API_CONFIG.PAYMENT_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.PAYMENT_SERVICE.PORT}`;
}
if (!API_CONFIG.ECOMMERCE_SERVICE.HOSTED) {
  API_CONFIG.ECOMMERCE_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.ECOMMERCE_SERVICE.PORT}`;
}
if (!API_CONFIG.NOTIFICATION_SERVICE.HOSTED) {
  API_CONFIG.NOTIFICATION_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.NOTIFICATION_SERVICE.PORT}`;
  API_CONFIG.NOTIFICATION_SERVICE.WS_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.NOTIFICATION_SERVICE.PORT}/ws`;
}
API_CONFIG.STOCK_ALERTS_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.STOCK_ALERTS_SERVICE.PORT}`;
if (!API_CONFIG.DRIVER_SERVICE.HOSTED) {
  API_CONFIG.DRIVER_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.DRIVER_SERVICE.PORT}`;
}

// External APIs (these don't change with network)
export const EXTERNAL_APIS = {
  EMAIL_VERIFICATION: 'https://emailvalidation.abstractapi.com/v1/',
  CLOUDINARY: 'https://api.cloudinary.com/v1_1/',
};

// Export individual service URLs for easy access
export const AUTH_API_URL = API_CONFIG.AUTH_SERVICE.BASE_URL;
export const ORDER_API_URL = API_CONFIG.ORDER_SERVICE.BASE_URL; // ✅ Uses Cloud Run
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

// Discount API endpoints
export const DISCOUNT_API_URL = API_CONFIG.ORDER_SERVICE.BASE_URL; // Using order service for discounts
export const DISCOUNT_ENDPOINTS = {
  GET_ACTIVE: `${DISCOUNT_API_URL}/api/discounts/active`,
  VALIDATE: `${DISCOUNT_API_URL}/api/discounts/validate`,
  APPLY: `${DISCOUNT_API_URL}/api/discounts/apply`,
  HISTORY: (userId: number) => `${DISCOUNT_API_URL}/api/discounts/history/${userId}`,
  SAVINGS: (userId: number) => `${DISCOUNT_API_URL}/api/discounts/savings/${userId}`,
  GET_DETAILS: (discountId: number) => `${DISCOUNT_API_URL}/api/admin/discounts/${discountId}/products`,
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
