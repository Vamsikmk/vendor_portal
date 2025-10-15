// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userType, setUserType] = useState('customer');
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  // const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username and password are required');
      return;
    }

    // For demo purposes, show different behaviors based on user type selection
    if (userType === 'hcp' || userType === 'lab') {
      const message = userType === 'hcp'
        ? 'HCP login requires verification. Please wait for approval email or contact support.'
        : 'Lab accounts require verification. Please wait for approval email or contact support.';

      alert(message);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      // Call login function from auth context - returns user data
      const userData = await login(username, password);

      console.log('Login successful, user role from DB:', userData.role);
      console.log('User ID:', userData.user_id);
      console.log('Selected user type:', userType);

      // VALIDATE: Check if selected user type matches database role
      const dbRole = userData.role; // 'vendor' or 'patient' from database

      // Map selected userType to expected database role
      let expectedRole = '';
      if (userType === 'vendor') {
        expectedRole = 'vendor';
      } else if (userType === 'customer') {
        expectedRole = 'patient'; // customer selection expects 'patient' role in DB
      }

      // Check if roles match
      if (dbRole !== expectedRole) {
        setErrorMessage(
          'Invalid username or password. Please check your credentials and account type.'
        );
        console.error('Role mismatch - Selected:', userType, 'Database:', dbRole);
        return; // Don't redirect
      }

      // ROLE-BASED REDIRECT LOGIC (only if roles match)
      if (userData.role === 'vendor') {
        // Redirect to vendor portal (current app)
        console.log('✅ Vendor login successful - Redirecting to vendor dashboard');
        navigate('/', { replace: true });
      } else if (userData.role === 'patient') {
        // Redirect to customer portal with customer ID
        const customerPortalUrl = `https://d1tq9fhvg45se2.cloudfront.net/?customer=${userData.user_id}`;
        console.log('✅ Customer login successful - Redirecting to customer portal:', customerPortalUrl);
        window.location.href = customerPortalUrl;
      } else {
        // Handle unknown roles
        setErrorMessage(`Unknown user role: ${userData.role}. Please contact support.`);
        console.error('Unknown user role:', userData.role);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <a href="/" className="logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00BFA5" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            MannBiome
          </a>
        </div>
      </nav>

      {/* Login Container */}
      <div className="login-wrapper">
        <div className="login-container">
          <h1 className="login-title">Welcome Back</h1>

          {/* User Type Selection */}
          <div className="user-type-selector">
            <h3 className="user-type-title">I am a:</h3>
            <div className="user-type-options">
              <div className="user-type-option">
                <input
                  type="radio"
                  id="customer"
                  name="userType"
                  value="customer"
                  checked={userType === 'customer'}
                  onChange={() => setUserType('customer')}
                />
                <label htmlFor="customer">Customer/Patient</label>
              </div>
              <div className="user-type-option">
                <input
                  type="radio"
                  id="vendor"
                  name="userType"
                  value="vendor"
                  checked={userType === 'vendor'}
                  onChange={() => setUserType('vendor')}
                />
                <label htmlFor="vendor">Vendor</label>
              </div>
              {/* <div className="user-type-option">
                <input
                  type="radio"
                  id="hcp"
                  name="userType"
                  value="hcp"
                  checked={userType === 'hcp'}
                  onChange={() => setUserType('hcp')}
                />
                <label htmlFor="hcp">HCP (Healthcare Provider)</label>
              </div>
              <div className="user-type-option">
                <input
                  type="radio"
                  id="lab"
                  name="userType"
                  value="lab"
                  checked={userType === 'lab'}
                  onChange={() => setUserType('lab')}
                />
                <label htmlFor="lab">Lab</label>
              </div> */}
            </div>
          </div>

          {/* Approval Messages */}
          {/* {userType === 'vendor' && (
            <div className="approval-message show">
              Note: Vendor accounts require verification before access is granted. Our team will review your credentials within 24-48 hours.
            </div>
          )} */}

          {/* {userType === 'hcp' && (
            <div className="approval-message show">
              Note: Healthcare Provider accounts require verification before access is granted. Please ensure your professional credentials are up to date.
            </div>
          )}

          {userType === 'lab' && (
            <div className="approval-message show">
              Note: Lab accounts require verification before access is granted. Please ensure your laboratory credentials and certifications are up to date.
            </div>
          )} */}

          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>

            <div className="login-footer">
              <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
              <p>Don't have an account? <Link to="/signup" className="signup-link">Sign up</Link></p>
            </div>

            <div className="divider">OR</div>

            <div className="social-login">
              <button type="button" className="social-button" disabled={isLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
                </svg>
                Google
              </button>
              <button type="button" className="social-button" disabled={isLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.49.5.09.682-.218.682-.484 0-.236-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </button>
            </div>
          </form>
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

export default Login;