// src/services/authService.js
// import { API_CONFIG } from '../config';
import { API_CONFIG } from '../config.js';
// Add this at the top of your authService.js file, right after imports



const API_BASE_URL = API_CONFIG?.BASE_URL || 'http://localhost:8000';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';
console.log('🔍 API_CONFIG:', API_CONFIG);
console.log('🔍 API_BASE_URL:', API_BASE_URL);
// Parse JWT token to get payload
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

const authService = {
  // Login user and get token
  login: async (username, password) => {
    try {
      // Create form data for the token endpoint
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Make request to get token
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
      }

      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem(TOKEN_KEY, data.access_token);
      
      // Get user info
      await authService.fetchUserInfo();
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register a new user - Added this function
  signup: async (userData) => {
    try {
      // Make request to register user
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  // Fetch current user info
  fetchUserInfo: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If token is invalid, clear storage
        if (response.status === 401) {
          authService.logout();
        }
        throw new Error('Failed to get user info');
      }

      const userInfo = await response.json();
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      
      return userInfo;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Redirect to login page
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = parseJwt(token);
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        // Token is expired, clear it
        authService.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const userJson = localStorage.getItem(USER_KEY);
      if (!userJson) return null;
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Check if user has a specific role
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user && user.role === role;
  },

  // Validate token with backend
  validateToken: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/validate-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }
};

export default authService;