// src/services/apiService.js
import { API_CONFIG } from '../config';
import authService from './authService';

const API_BASE_URL = API_CONFIG.BASE_URL || 'http://localhost:8000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Handle 401 Unauthorized errors
    if (response.status === 401) {
      // Token might be expired, try to refresh or logout
      authService.logout();
      throw new Error('Your session has expired. Please login again.');
    }
    
    const errorMessage = await response.text();
    throw new Error(errorMessage || 'API request failed');
  }
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = authService.getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Dashboard API services
const dashboardApi = {
  // Get dashboard metrics
  getDashboardMetrics: async (dateParams) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard-metrics`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  // Get customer insights
  getCustomerInsights: async (dateParams) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer-insights`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching customer insights:', error);
      throw error;
    }
  },

  // Get recent customers
  getRecentCustomers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recent-customers`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      throw error;
    }
  },

  // Get customer visits
  getCustomerVisits: async (customerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/${customerId}/visits`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching visits for customer ${customerId}:`, error);
      throw error;
    }
  },

  // Get total impressions
  getTotalImpressions: async (dateParams) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/total-impressions`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching total impressions:', error);
      throw error;
    }
  },

  // Get engagement rate
  getEngagementRate: async (dateParams) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/engagement-rate`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching engagement rate:', error);
      throw error;
    }
  },

  // Get customer reach
  getCustomerReach: async (dateParams) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer-reach`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching customer reach:', error);
      throw error;
    }
  },
  
  // Get all tables in the database
  getTables: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  },
  
  // Get columns of a specific table
  getTableColumns: async (tableName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}/columns`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching columns for table ${tableName}:`, error);
      throw error;
    }
  },
  
  // Get data from a specific table
  getTableData: async (tableName, limit = 100, offset = 0) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}/data?limit=${limit}&offset=${offset}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching data for table ${tableName}:`, error);
      throw error;
    }
  },

  // Get all products
  getAllProducts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  }
};

export default dashboardApi;