// src/pages/SignupPending.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Login.css'; // We'll reuse the same CSS from Login

const SignupPending = () => {
  const location = useLocation();
  const { userType, email } = location.state || {};
  
  // Determine user type display text
  const userTypeDisplay = userType === 'doctor' ? 'Doctor' : 'Healthcare Provider';
  
  return (
    <div className="login-page-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div>Call us at: 1-800-MICROBE | Contact Your Health Advisor</div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="main-nav">
        <div className="nav-content">
          <Link to="/" className="logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00BFA5" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            MannBiome
          </Link>
        </div>
      </nav>

      {/* Pending Approval Container */}
      <div className="login-wrapper">
        <div className="login-container">
          <div style={{ textAlign: 'center' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#00BFA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
            
            <h1 className="login-title">Account Pending Approval</h1>
            
            <div style={{ 
              backgroundColor: '#e8f5e9', 
              borderRadius: '8px', 
              padding: '20px', 
              marginBottom: '25px',
              color: '#2e7d32'
            }}>
              <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                Thank you for registering as a <strong>{userTypeDisplay}</strong>!
              </p>
              <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                Your account is currently pending verification. Our team will review your credentials within 24-48 hours.
              </p>
              {email && (
                <p style={{ fontSize: '16px', marginBottom: '0' }}>
                  We'll send a confirmation email to <strong>{email}</strong> once your account is approved.
                </p>
              )}
            </div>
            
            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <Link to="/login" className="login-button" style={{ 
                display: 'inline-block', 
                textDecoration: 'none',
                textAlign: 'center'
              }}>
                Go to Login
              </Link>
              
              <Link to="/" style={{ 
                color: '#00BFA5',
                textDecoration: 'none',
                fontSize: '16px'
              }}>
                Return to Home
              </Link>
            </div>
            
            <div style={{ marginTop: '30px', color: '#666' }}>
              <p>
                If you have any questions or need assistance, please contact our support team at <a href="mailto:support@mannbiome.com" style={{ color: '#00BFA5' }}>support@mannbiome.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="login-page-footer">
        <div className="footer-content">
          <div className="copyright">
            © {new Date().getFullYear()} MannBiome. All rights reserved.
          </div>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/support">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SignupPending;