// src/config.js

// Environment-based configuration
const getApiBaseUrl = () => {
  // Check if we're in production (deployed) or development (local)
  if (process.env.NODE_ENV === 'production') {
    return 'https://3b6akxpfpr.us-east-2.awsapprunner.com';
  }

  // For development, you can still use localhost if running backend locally
  // or use the deployed API for development as well
  return process.env.REACT_APP_API_BASE_URL || 'https://3b6akxpfpr.us-east-2.awsapprunner.com';
};

// API Configuration
const API_CONFIG = {
  // Base URL for API endpoints - now points to your deployed AWS API
  BASE_URL: getApiBaseUrl(),

  // API endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/token',
    REGISTER: '/register',
    USERS_ME: '/users/me',
    VALIDATE_TOKEN: '/validate-token',

    // Products
    PRODUCTS: '/api/products',
    PRODUCTS_PAGINATED: '/api/products/paginated',
    PRODUCT_BY_ID: (productId) => `/api/products/${productId}`,

    // Dashboard metrics
    DASHBOARD_METRICS: '/api/dashboard-metrics',
    CUSTOMER_INSIGHTS: '/api/customer-insights',
    RECENT_CUSTOMERS: '/api/recent-customers',

    // Individual metrics
    TOTAL_IMPRESSIONS: '/api/total-impressions',
    ENGAGEMENT_RATE: '/api/engagement-rate',
    CUSTOMER_REACH: '/api/customer-reach',
    TOTAL_CUSTOMERS: '/api/total-customers',
    NEW_CUSTOMERS: '/api/new-customers',
    AVG_HEALTH_INDEX: '/api/avg-health-index',
    RETENTION_RATE: '/api/retention-rate',

    // Customer details
    CUSTOMER_VISITS: (customerId) => `/api/customer/${customerId}/visits`,

    // Database exploration
    TABLES: '/tables',
    TABLE_COLUMNS: (tableName) => `/tables/${tableName}/columns`,
    TABLE_DATA: (tableName) => `/tables/${tableName}/data`,

    // Health check
    HEALTH_CHECK: '/',
    API_DOCS: '/docs'
  }
};

// App Configuration
const APP_CONFIG = {
  NAME: 'Vendor Portal',
  VERSION: '1.0.0',
  DESCRIPTION: 'MannBiome Vendor Portal Dashboard'
};

// Export configurations
export { API_CONFIG, APP_CONFIG };
export default { API: API_CONFIG, APP: APP_CONFIG };

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to check if we're in production
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

// Console log for debugging (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseUrl: API_CONFIG.BASE_URL,
    environment: process.env.NODE_ENV,
    isProduction: isProduction()
  });
}