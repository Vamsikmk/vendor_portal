// src/pages/VendorHub.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './VendorHub.css';

const VendorHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get user's full name
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
    return 'Vendor';
  };

  // Navigation cards configuration
  const navigationCards = [
    {
      id: 'clinical-trials',
      icon: '🧪',
      title: 'Clinical Trials',
      description: 'Manage and monitor your clinical trials',
      path: '/clinical-trial'
    },
    {
      id: 'products',
      icon: '📦',
      title: 'Our Products',
      description: 'View and manage your product portfolio',
      path: '/products',
      enabled: process.env.REACT_APP_ENABLE_PRODUCTS !== 'false'
    },
    {
      id: 'employees',
      icon: '👔',
      title: 'Employees',
      description: 'Manage your team members',
      path: '/management/employees'
    },
    {
      id: 'patients',
      icon: '👤',
      title: 'Patients',
      description: 'View and manage patient records',
      path: '/management/patients'
    },
    {
      id: 'billing',
      icon: '💳',
      title: 'Billing',
      description: 'View invoices and payment history',
      path: '/billing'
    }
  ];

  const enabledCards = navigationCards.filter(card => card.enabled !== false);

  return (
    <div className="vendor-hub">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">
            Welcome back, <span className="vendor-name">{getUserFullName()}</span>
          </h1>
          <p className="welcome-subtitle">
            Manage your vendor operations and monitor your clinical trials
          </p>
        </div>
      </div>

      {/* Navigation Cards Section */}
      <div className="navigation-section">
        <h2 className="section-title">Features & Tools</h2>
        <div className="cards-grid">
          {enabledCards.map(card => (
            <button
              key={card.id}
              className="nav-card"
              onClick={() => navigate(card.path)}
              title={card.description}
            >
              <div className="card-icon">{card.icon}</div>
              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-description">{card.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="info-section">
        <div className="info-card">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h3>Need Help?</h3>
            <p>
              Contact our support team at{' '}
              <a href="mailto:support@mannbiome.com">support@mannbiome.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorHub;
