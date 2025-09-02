// API Configuration
// Change the IP address here when connecting to a different network
export const API_CONFIG = {
  BASE_IP: '192.168.1.11', // Change this IP when network changes
  
  // Service endpoints
  AUTH_SERVICE: {
    PORT: '8080',
    BASE_URL: '',
  },
  ORDER_SERVICE: {
    PORT: '8090', 
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
};

// Auto-generate full URLs
API_CONFIG.AUTH_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.AUTH_SERVICE.PORT}`;
API_CONFIG.ORDER_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.ORDER_SERVICE.PORT}`;
API_CONFIG.PAYMENT_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.PAYMENT_SERVICE.PORT}`;
API_CONFIG.ECOMMERCE_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.ECOMMERCE_SERVICE.PORT}`;

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
