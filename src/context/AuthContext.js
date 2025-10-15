// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Create context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        if (authService.isAuthenticated()) {
          // Try to validate token with backend
          const isValid = await authService.validateToken();
          
          if (isValid) {
            // Get user info from local storage
            const storedUser = authService.getCurrentUser();
            setUser(storedUser);
          } else {
            // If token is invalid, logout
            authService.logout();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      await authService.login(username, password);
      const userInfo = authService.getCurrentUser();
      setUser(userInfo);
      return userInfo;
    } catch (err) {
      setError('Login failed: ' + (err.message || 'Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.signup(userData);
      return result;
    } catch (err) {
      setError('Signup failed: ' + (err.message || 'Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    signup, // Add signup to the context
    logout,
    hasRole: (role) => user && user.role === role
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;