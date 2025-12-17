// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// ❌ REMOVED: import Header from '../components/layout/Header';
import useDashboardData from '../hooks/useDashboardData';
import useDateRange from '../hooks/useDateRange';
import DateRangePicker from '../components/ui/DateRangePicker';
import SearchBar from '../components/ui/SearchBar';
import StatCard from '../components/ui/StatCard';
import SectionHeader from '../components/ui/SectionHeader';
import ProductPerformanceChart from '../components/charts/ProductPerformanceChart';
import CategoryEngagementChart from '../components/charts/CategoryEngagementChart';
import SegmentCard from '../components/ui/SegmentCard';
import RecommendationCard from '../components/ui/RecommendationCard';
import RecentCustomersTable from '../components/ui/RecentCustomersTable';
import ProductPerformanceTable from '../components/ui/ProductPerformanceTable';
import './Dashboard.css';

function Dashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState(null);

  // Add product-related state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // Use custom hooks
  const dateRangeControls = useDateRange();
  const dateRangeParams = {
    ...dateRangeControls.getDateRangeParams(),
    refreshTrigger
  };
  const { data, loading, error } = useDashboardData(dateRangeParams);

  // API Base URL - UPDATED to use deployed API
  // const API_BASE_URL = 'https://3b6akxpfpr.us-east-2.awsapprunner.com';
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';


  // Function to get auth headers - UPDATED with better error handling
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    console.log('🔍 Token found:', token ? `${token.substring(0, 20)}...` : 'None');

    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Handle authentication errors - FIXED: useCallback to prevent useEffect warnings
  const handleAuthError = useCallback(() => {
    console.error('❌ Authentication failed - clearing token and redirecting');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    navigate('/login');
  }, [navigate]);

  // Token validation function - FIXED: useCallback to prevent useEffect warnings
  const validateToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate-token`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        console.error('❌ Token validation failed');
        return false;
      }

      const data = await response.json();
      console.log('✅ Token is valid:', data);
      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  }, [API_BASE_URL]);

  // Fetch recent customers - FIXED: useCallback to prevent useEffect warnings
  const fetchRecentCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    setCustomersError(null);
    try {
      console.log('🔍 Fetching recent customers from:', `${API_BASE_URL}/api/recent-customers`);

      const response = await fetch(`${API_BASE_URL}/api/recent-customers`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      console.log('Recent customers response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to fetch recent customers: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Recent customers data:', data);
      setRecentCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch (error) {
      console.error('❌ Error fetching recent customers:', error);
      setCustomersError(`Failed to load recent customers: ${error.message}`);
      setRecentCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, [API_BASE_URL, handleAuthError]);

  // Fetch products - FIXED: useCallback to prevent useEffect warnings
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      console.log('🔍 Fetching products from:', `${API_BASE_URL}/api/products`);

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      console.log('Products response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Products data:', data);
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setProductsError(`Failed to load products: ${error.message}`);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [API_BASE_URL, handleAuthError]);

  // Fetch data on component mount - FIXED: Added all dependencies to prevent useEffect warnings
  useEffect(() => {
    const initDashboard = async () => {
      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log('❌ User not authenticated, redirecting to login');
        navigate('/login');
        return;
      }

      // Check if token exists
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ No auth token found, redirecting to login');
        navigate('/login');
        return;
      }

      // Validate token before making API calls
      console.log('🔍 Validating token...');
      const isValidToken = await validateToken();
      if (!isValidToken) {
        handleAuthError();
        return;
      }

      // Token is valid, fetch data
      console.log('✅ Token valid, fetching dashboard data...');
      fetchRecentCustomers();
      fetchProducts();
    };

    initDashboard();
  }, [isAuthenticated, navigate, validateToken, handleAuthError, fetchRecentCustomers, fetchProducts]);

  // Handle search
  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm);
    // In a real app, this would filter data based on the search term
  };

  // Handle date range apply - UPDATED with deployed API URLs
  const handleApplyDateRange = () => {
    setIsLoading(true);
    // Trigger a refresh of the data with the new date range
    setRefreshTrigger(prev => prev + 1);

    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      fetchRecentCustomers(); // Also refresh customers when date range changes
      fetchProducts(); // Also refresh products when date range changes
    }, 800);
  };

  // Handle retry on error
  const handleRetry = () => {
    console.log('🔄 Retrying data fetch...');
    setRefreshTrigger(prev => prev + 1);
    fetchRecentCustomers();
    fetchProducts();
  };

  // ✅ FIXED: Removed Header from loading state
  if (loading || isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // ✅ FIXED: Removed Header from error state
  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button
          className="retry-button"
          onClick={handleRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  // If data is not available yet, show nothing
  if (!data) {
    return null;
  }

  // Section actions
  const productSectionActions = [
    { label: 'Export', onClick: () => alert('Export clicked') },
    { label: 'View All Products', onClick: () => navigate('/products'), primary: true }
  ];

  const insightSectionActions = [];

  // Customer section actions
  const customerSectionActions = [
    { label: 'Export', onClick: () => alert('Export clicked') },
    { label: 'View All Customers', onClick: () => alert('View All Customers clicked'), primary: true }
  ];

  // ✅ FIXED: Removed all Header components - Header should only be rendered in App.js
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="dashboard-controls">
          <DateRangePicker
            dateRangeType={dateRangeControls.dateRangeType}
            setDateRangeType={dateRangeControls.setDateRangeType}
            startDate={dateRangeControls.startDate}
            setStartDate={dateRangeControls.setStartDate}
            endDate={dateRangeControls.endDate}
            setEndDate={dateRangeControls.setEndDate}
            isCustomRange={dateRangeControls.isCustomRange}
            formatDate={dateRangeControls.formatDate}
            onApply={handleApplyDateRange}
          />
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="stats-grid">
        <StatCard
          label="Total Impressions"
          value={data.stats.totalImpressions}
          trend="from previous period"
          trendValue={data.stats.impressionChange}
        />
        <StatCard
          label="Engagement Rate"
          value={`${data.stats.engagementRate}%`}
          trend="from previous period"
          trendValue={data.stats.engagementChange}
        />
        <StatCard
          label="Customer Reach"
          value={data.stats.customerReach}
          trend="from previous period"
          trendValue={data.stats.reachChange}
        />
        <StatCard
          label="Average Rating"
          value={data.stats.averageRating}
          trend="from previous period"
          trendValue={data.stats.ratingChange}
        />
      </div>

      {/* Charts */}
      <div className="charts-container">
        <ProductPerformanceChart products={data.productPerformance} />
        <CategoryEngagementChart categories={data.categoryEngagement} />
      </div>

      {/* Customer Insights */}
      <SectionHeader title="Customer Insights" />

      <div className="stats-grid">
        <StatCard
          label="Total Customers"
          value={data.customerInsights.totalCustomers}
          trend="from last month"
          trendValue={data.customerInsights.customerChange}
        />
        <StatCard
          label="New Customers"
          value={data.customerInsights.newCustomers}
          trend="from last month"
          trendValue={data.customerInsights.newCustomerChange}
        />
        <StatCard
          label="Avg. Health Index"
          value={data.customerInsights.avgHealthIndex}
          trend="from last month"
          trendValue={data.customerInsights.healthIndexChange}
        />
        <StatCard
          label="Retention Rate"
          value={`${data.customerInsights.retentionRate}%`}
          trend="from last month"
          trendValue={data.customerInsights.retentionChange}
        />
      </div>

      {/* Customer Profile */}
      <div className="chart-container">
        <div className="chart-header">
          <h2 className="chart-title">Customer Profile</h2>
        </div>
        <div className="segments-container">
          <SegmentCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            }
            title="Age Group"
            value={data.customerProfile.ageGroup.primary}
            text={`${data.customerProfile.ageGroup.percentage}% of total Customer`}
            bgColor="#e3f2fd"
            iconColor="#2196f3"
          />
          <SegmentCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            }
            title="Health Focus"
            value={data.customerProfile.healthFocus.primary}
            text={`${data.customerProfile.healthFocus.percentage}% of total Customer`}
            bgColor="#e8f5e9"
            iconColor="#4caf50"
          />
          <SegmentCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            }
            title="Interaction Rate"
            value={data.customerProfile.interactionRate.value}
            text={data.customerProfile.interactionRate.period}
            bgColor="#f3e5f5"
            iconColor="#9c27b0"
          />
          <SegmentCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            }
            title="Avg. Time to Engage"
            value={data.customerProfile.timeToEngage.value}
            text={data.customerProfile.timeToEngage.description}
            bgColor="#e0f7fa"
            iconColor="#00acc1"
          />
        </div>
      </div>

      {/* Products Section */}
      <SectionHeader title="Product Performance" actions={productSectionActions} />

      {/* Product Performance Table */}
      {loadingProducts ? (
        <div className="table-loading">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : productsError ? (
        <div className="table-error">
          <p>{productsError}</p>
          <button onClick={fetchProducts} className="retry-button">
            Retry
          </button>
        </div>
      ) : (
        <ProductPerformanceTable products={products} />
      )}

      {/* Recent Customers Section */}
      <SectionHeader title="Recent Customers" actions={customerSectionActions} />

      {/* Recent Customers Table */}
      {loadingCustomers ? (
        <div className="table-loading">
          <div className="loading-spinner"></div>
          <p>Loading recent customers...</p>
        </div>
      ) : customersError ? (
        <div className="table-error">
          <p>{customersError}</p>
          <button onClick={fetchRecentCustomers} className="retry-button">
            Retry
          </button>
        </div>
      ) : (
        <RecentCustomersTable customers={recentCustomers} />
      )}

      {/* Insights & Recommendations */}
      <SectionHeader title="Insights & Recommendations" actions={insightSectionActions} />
      <div className="recommendations-container">
        {data.recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={index}
            title={recommendation.title}
            text={recommendation.text}
            primaryAction={recommendation.primaryAction}
            secondaryAction={recommendation.secondaryAction}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;