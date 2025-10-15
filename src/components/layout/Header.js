// src/components/layout/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fixed: Helper to determine if a link is active
  const isActiveLink = (path) => {
    // Handle exact path matching
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (path === '/products') {
      return location.pathname === '/products' || location.pathname.startsWith('/products');
    }
    return location.pathname === path;
  };

  // Handle logout function
  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Get user initials with fallback
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get user's full name with fallback
  const getUserFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.username) {
      return user.username;
    }
    return 'User';
  };

  // Get user role display text
  const getUserRole = () => {
    const role = user?.role || 'vendor';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get user email with fallback
  const getUserEmail = () => {
    return user?.email || 'user@mannbiome.com';
  };

  // Handle dropdown toggle
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Handle navigation with dropdown close
  const handleNavigation = (path) => {
    setShowDropdown(false);
    navigate(path);
  };

  // Debug: Log current path to console (remove this in production)
  console.log('Current path:', location.pathname);

  return (
    <header className="header">
      <div className="main-nav">
        <div className="container">
          <div className="brand">
            <Link to="/">
              <img 
                src="/logo.png" 
                alt="MannBiome" 
                className="logo" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzAiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0UwRTBFMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTc1IDMwQzU0LjUgMzAgMzggNDYuNSAzOCA2N0MzOCA3Ny41IDQyLjUgODYuNSA1MCA5Mi41QzUyIDk0IDUzLjUgOTcgNTMuNSAxMDAuNVYxMDVDNTMuNSAxMTAgNTcuNSAxMTQgNjIuNSAxMTRIODcuNUM5Mi41IDExNCA5Ni41IDExMCA5Ni41IDEwNVYxMDAuNUM5Ni41IDk3IDk4IDk0IDEwMCA5Mi41QzEwNy41IDg2LjUgMTEyIDc3LjUgMTEyIDY3QzExMiA0Ni41IDk1LjUgMzAgNzUgMzBaIiBmaWxsPSIjRTFGNUYzIiBzdHJva2U9IiMwMEJGQTUiIHN0cm9rZS13aWR0aD0iMyIvPgogIDxjaXJjbGUgY3g9IjYyIiBjeT0iNjciIHI9IjUiIGZpbGw9IiMwMEJGQTUiLz4KICA8Y2lyY2xlIGN4PSI4OCIgY3k9IjY3IiByPSI1IiBmaWxsPSIjMDBCRkE1Ii8+CiAgPHBhdGggZD0iTTYwIDg1QzY1IDkyIDg1IDkyIDkwIDg1IiBzdHJva2U9IiMwMEJGQTUiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==';
                }}
              />
              {/* <span className="brand-name">MannBiome</span> */}
            </Link>
          </div>
          
          <nav className="nav-links">
            <Link to="/" className={isActiveLink('/') ? 'active' : ''}>
              Dashboard
            </Link>
            <Link to="/products" className={isActiveLink('/products') ? 'active' : ''}>
              Our Products
            </Link>
          </nav>
          
          {/* Compact User profile dropdown */}
          <div className="user-profile" ref={dropdownRef}>
            <button 
              className="avatar-button" 
              onClick={toggleDropdown}
              aria-label="User menu"
              aria-expanded={showDropdown}
              aria-haspopup="true"
            >
              <div className="user-avatar">
                <span className="user-initials">{getUserInitials()}</span>
              </div>
              <div className="user-preview">
                <span className="user-name-preview">{getUserFullName()}</span>
                <span className="user-role-preview">{getUserRole()}</span>
              </div>
              <svg 
                className={`dropdown-chevron ${showDropdown ? 'rotated' : ''}`} 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {showDropdown && (
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-header">
                  <div className="user-avatar-large">
                    <span className="user-initials-large">{getUserInitials()}</span>
                  </div>
                  <div className="user-info">
                    <h4 className="user-name">{getUserFullName()}</h4>
                    <p className="user-email">{getUserEmail()}</p>
                    <span className="user-role-badge">{getUserRole()}</span>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <ul className="dropdown-links">
                  <li>
                    <button 
                      onClick={() => handleNavigation('/profile')} 
                      className="dropdown-link"
                      role="menuitem"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>Your Profile</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleNavigation('/settings')} 
                      className="dropdown-link"
                      role="menuitem"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6"></path>
                        <path d="M1 12h6m6 0h6"></path>
                      </svg>
                      <span>Settings</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleNavigation('/help')} 
                      className="dropdown-link"
                      role="menuitem"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <path d="M12 17h.01"></path>
                      </svg>
                      <span>Help & Support</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleNavigation('/billing')} 
                      className="dropdown-link"
                      role="menuitem"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>Billing & Plans</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleNavigation('/notifications')} 
                      className="dropdown-link"
                      role="menuitem"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                      <span>Notifications</span>
                    </button>
                  </li>
                </ul>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-footer">
                  <button 
                    onClick={handleLogout} 
                    className="logout-button"
                    role="menuitem"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;