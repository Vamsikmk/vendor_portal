// src/services/authService.js
import axios from 'axios';
import { API_CONFIG } from '../config';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class AuthService {
  // Login function
  async login(username, password) {
    try {
      // Create form data for OAuth2 password flow
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Call login API
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token } = response.data;

      // Store token
      localStorage.setItem(TOKEN_KEY, access_token);

      // Fetch user details
      const userResponse = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS_ME}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );

      const userData = userResponse.data;

      // Store user data
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.detail || 'Invalid username or password'
      );
    }
  }

  // Signup function
  async signup(userData) {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/register`,
        userData
      );
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(
        error.response?.data?.detail || 'Signup failed'
      );
    }
  }

  // Validate token
  async validateToken() {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VALIDATE_TOKEN}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data.valid === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Logout function
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  }

  // Get token
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Get auth header for API calls
  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

const authService = new AuthService();
export default authService;