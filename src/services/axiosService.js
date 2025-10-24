// src/services/axiosService.js
import axios from 'axios';
import authService from './authService';
import { API_CONFIG } from '../config';

// Create a new Axios instance with custom config
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL || 'http://localhost:8000', // Update with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable cookies if needed
});

// Add a request interceptor to inject the auth token into every request
axiosInstance.interceptors.request.use(
  config => {
    // Get the token from localStorage
    const token = authService.getToken();

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized errors
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // If we get a 401 error, log the user out and redirect to login
    if (error.response && error.response.status === 401) {
      console.log('Session expired. Redirecting to login...');
      authService.logout();
      // The logout function already redirects to login
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;