// src/components/ui/RecentCustomersTable.js
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './RecentCustomersTable.css';

function RecentCustomersTable({ customers = [] }) {
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [visitData, setVisitData] = useState({});
  const [loadingVisits, setLoadingVisits] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter customers based on active filter - FIXED: Moved safeCustomers logic inside useMemo
  const filteredCustomers = useMemo(() => {
    // Ensure customers is always an array - moved inside useMemo to fix ESLint warning
    const safeCustomers = Array.isArray(customers) ? customers : [];
    
    if (activeFilter === 'all') {
      return safeCustomers;
    }
    return safeCustomers.filter(customer => 
      customer?.health_status?.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [customers, activeFilter]);
  
  // Get customer initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return 'N/A';
    const nameArray = fullName.split(' ');
    return nameArray.map(name => name.charAt(0)).join('').toUpperCase();
  };
  
  // Get status badge class based on health status
  const getStatusBadgeClass = (healthStatus) => {
    switch (healthStatus) {
      case 'healthy':
        return 'status-badge status-healthy';
      case 'warning':
        return 'status-badge status-warning';
      case 'critical':
        return 'status-badge status-critical';
      default:
        return 'status-badge';
    }
  };
  
  // Test token validity
  const testTokenValidity = async () => {
    try {
      const token = localStorage.getItem('token') || 
              localStorage.getItem('auth_token') ||  // THIS IS THE ONE YOU NEED!
              localStorage.getItem('authToken') || 
              localStorage.getItem('access_token') ||
              sessionStorage.getItem('token');
      console.log('🔍 Testing token validity...');
      const response = await axios.get('https://3b6akxpfpr.us-east-2.awsapprunner.com/validate-token', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Token is valid:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Token validation failed:', error.response?.data);
      return false;
    }
  };
  
  // Fetch customer visits with enhanced debugging
  const fetchCustomerVisits = async (customerId) => {
    setLoadingVisits(prev => ({ ...prev, [customerId]: true }));
    try {
      // Try multiple possible token storage keys
      const token = localStorage.getItem('token') || 
              localStorage.getItem('auth_token') ||  // THIS IS THE ONE YOU NEED!
              localStorage.getItem('authToken') || 
              localStorage.getItem('access_token') ||
              sessionStorage.getItem('token');
      
      // Enhanced debugging
      console.log('🔍 Fetching visits for customer:', customerId);
      console.log('🔍 Raw token from localStorage:', token);
      console.log('🔍 Token length:', token ? token.length : 'null');
      console.log('🔍 Token starts with:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('🔍 All localStorage keys:', Object.keys(localStorage));
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Test token validity first
      const isValidToken = await testTokenValidity();
      if (!isValidToken) {
        throw new Error('Token is invalid or expired');
      }

      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('🔍 Headers being sent:', headers);
      console.log('🔍 Full request URL:', `https://3b6akxpfpr.us-east-2.awsapprunner.com/api/customer/${customerId}/visits`);

      const response = await axios.get(`https://3b6akxpfpr.us-east-2.awsapprunner.com/api/customer/${customerId}/visits`, {
        headers: headers
      });
      
      console.log('✅ Visits fetched successfully:', response.data);
      setVisitData(prev => ({ ...prev, [customerId]: response.data.visits }));
    } catch (error) {
      console.error('❌ Error fetching customer visits:', error);
      
      if (error.response) {
        console.error('❌ Error status:', error.response.status);
        console.error('❌ Error data:', error.response.data);
        console.error('❌ Error headers:', error.response.headers);
        console.error('❌ Request config:', error.config);
        
        if (error.response.status === 401) {
          console.error('❌ Authentication failed - token may be expired or invalid');
          console.error('❌ Try refreshing the page or logging in again');
        } else if (error.response.status === 404) {
          console.error('❌ Customer visits endpoint not found');
        } else if (error.response.status === 403) {
          console.error('❌ Access forbidden - check user permissions');
        }
      } else if (error.request) {
        console.error('❌ Network error - no response received:', error.request);
      } else {
        console.error('❌ Request setup error:', error.message);
      }
      
      // Set empty array as fallback
      setVisitData(prev => ({ ...prev, [customerId]: [] }));
    } finally {
      setLoadingVisits(prev => ({ ...prev, [customerId]: false }));
    }
  };
  
  // Toggle expanded state for a customer
  const toggleCustomerExpanded = async (customerId) => {
    const wasExpanded = expandedCustomers[customerId];
    
    setExpandedCustomers(prev => ({
      ...prev,
      [customerId]: !wasExpanded
    }));
    
    // Fetch visits if expanding and we don't have data yet
    if (!wasExpanded && !visitData[customerId]) {
      await fetchCustomerVisits(customerId);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // Close any expanded rows when filter changes to avoid confusion
    setExpandedCustomers({});
  };
  
  // Generate mini trend SVG
  const generateTrendSVG = (healthStatus) => {
    // Simple trend based on health status - FIXED: Use coordinate points instead of path commands
    const points = {
      healthy: "0,15 20,14 40,12 60,10",
      warning: "0,10 20,13 40,14 60,17",
      critical: "0,7 20,12 40,16 60,18"
    };
    
    const colors = {
      healthy: "#4caf50",
      warning: "#ff9800",
      critical: "#f44336"
    };
    
    return (
      <svg width="60" height="20" viewBox="0 0 60 20">
        <polyline 
          points={points[healthStatus] || points.healthy} 
          fill="none" 
          stroke={colors[healthStatus] || colors.healthy} 
          strokeWidth="2"
        />
      </svg>
    );
  };

  // Early return if customers is null (still loading)
  if (customers === null) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="loading-spinner"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Recent Customers</h2>
        <div className="table-filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'healthy' ? 'active' : ''}`}
            onClick={() => handleFilterChange('healthy')}
          >
            Healthy
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'warning' ? 'active' : ''}`}
            onClick={() => handleFilterChange('warning')}
          >
            Warning
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'critical' ? 'active' : ''}`}
            onClick={() => handleFilterChange('critical')}
          >
            Critical
          </button>
        </div>
      </div>
      
      {filteredCustomers.length === 0 ? (
        <div className="no-customers">
          <p>No customers found with status: {activeFilter === 'all' ? 'any' : activeFilter}</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Consumer</th>
              <th>ID</th>
              <th>Signup Date</th>
              <th>Overall Health Index</th>
              <th>No. Of Visits</th>
              <th>Status</th>
              <th>Trend</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <React.Fragment key={customer.customer_id}>
                <tr>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {getInitials(customer.full_name)}
                      </div>
                      <div>{customer.full_name}</div>
                    </div>
                  </td>
                  <td>MB-{customer.customer_id}</td>
                  <td>{customer.signup_date || 'N/A'}</td>
                  <td>{customer.overall_health_index || 'N/A'}</td>
                  <td>{customer.visit_count || 0}</td>
                  <td>
                    <span className={getStatusBadgeClass(customer.health_status)}>
                      {customer.health_status?.charAt(0).toUpperCase() + customer.health_status?.slice(1) || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    {generateTrendSVG(customer.health_status)}
                  </td>
                  <td>
                    <button 
                      className="action-btn view"
                      onClick={() => toggleCustomerExpanded(customer.customer_id)}
                    >
                      {expandedCustomers[customer.customer_id] ? 'Hide Details' : 'View Details'}
                    </button>
                  </td>
                </tr>
                
                {/* Expanded visit details row */}
                {expandedCustomers[customer.customer_id] && (
                  <tr className="visit-details-row">
                    <td colSpan="8">
                      <div className="visit-details">
                        <h4>Visit History</h4>
                        {loadingVisits[customer.customer_id] ? (
                          <div className="loading-visits">
                            <div className="loading-spinner small"></div>
                            <p>Loading visit history...</p>
                          </div>
                        ) : (
                          <div className="visit-list">
                            {visitData[customer.customer_id]?.length > 0 ? (
                              visitData[customer.customer_id].map((visit, index) => (
                                <div key={visit.visit_id || index} className="visit-item">
                                  <div className="visit-header">
                                    <span className="visit-name">
                                      Visit {index + 1}: {visit.visit_date}
                                    </span>
                                    <span className="visit-health">
                                      Health Index: {visit.health_index_value || 'N/A'}
                                    </span>
                                    <span className={getStatusBadgeClass(visit.health_status)}>
                                      {visit.health_status?.charAt(0).toUpperCase() + visit.health_status?.slice(1) || 'Unknown'}
                                    </span>
                                    <a 
                                      href={`/reports/MB-${customer.customer_id}-V${index + 1}.pdf`} 
                                      className="report-link"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        alert('Report viewing would be implemented here');
                                      }}
                                    >
                                      View Report
                                    </a>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="no-visits">No visit history available</p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Pagination placeholder */}
      <div className="pagination">
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn">{'>'}</button>
      </div>
    </div>
  );
}

export default RecentCustomersTable;