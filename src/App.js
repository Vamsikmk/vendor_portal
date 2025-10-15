// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupPending from './pages/SignupPending';
import Unauthorized from './pages/Unauthorized';
import MyProducts from './pages/MyProducts';
import Header from './components/layout/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup-pending" element={<SignupPending />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <div className="content">
                      <Dashboard />
                    </div>
                  </>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <div className="content">
                      <MyProducts />
                    </div>
                  </>
                </ProtectedRoute>
              }
            />
            
            {/* Add more protected routes as needed */}
            {/* <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRole="vendor">
                  <>
                    <Header />
                    <div className="content">
                      <Analytics />
                    </div>
                  </>
                </ProtectedRoute>
              }
            /> */}
            
            {/* <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <div className="content">
                      <Settings />
                    </div>
                  </>
                </ProtectedRoute>
              }
            /> */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;