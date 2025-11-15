// src/components/ui/ProductPerformanceTable.js
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './ProductPerformanceTable.css';

function ProductPerformanceTable({ products = [] }) {
  const [expandedProducts, setExpandedProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'impressions',
    direction: 'desc'
  });

  // Category mapping for products
  const categoryMap = {
    'gut health': 'Gut Health',
    'immune': 'Immune Health',
    'brain': 'Cognitive Health',
    'skin': 'Skin Health',
    'heart': 'Heart Health'
  };

  // Get category from product name
  const getCategory = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('gut')) return 'Gut Health';
    if (name.includes('immune')) return 'Immune Health';
    if (name.includes('brain')) return 'Cognitive Health';
    if (name.includes('skin')) return 'Skin Health';
    if (name.includes('heart')) return 'Heart Health';
    return 'General';
  };

  // Get product icon initials
  const getProductIcon = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('gut')) return 'GH';
    if (name.includes('immune')) return 'ID';
    if (name.includes('brain')) return 'BB';
    if (name.includes('skin')) return 'SR';
    if (name.includes('heart')) return 'HH';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Get product icon color
  const getProductIconColor = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('gut')) return { bg: '#e3f2fd', color: '#2196f3' };
    if (name.includes('immune')) return { bg: '#e8f5e9', color: '#4caf50' };
    if (name.includes('brain')) return { bg: '#f3e5f5', color: '#9c27b0' };
    if (name.includes('skin')) return { bg: '#fff8e1', color: '#ff9800' };
    if (name.includes('heart')) return { bg: '#e3f2fd', color: '#2196f3' };
    return { bg: '#f5f5f5', color: '#666' };
  };

  // Calculate engagement rate (mock calculation)
  const calculateEngagementRate = (impressions) => {
    // Mock calculation: engagement rate between 8-20% based on impressions
    const baseRate = Math.random() * 12 + 8;
    const variability = impressions > 50000 ? 1.2 : impressions > 30000 ? 1.0 : 0.8;
    return (baseRate * variability).toFixed(1);
  };

  // Filter products based on active filter
  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') {
      return products;
    }
    return products.filter(product => 
      getCategory(product.name).toLowerCase().includes(activeFilter.toLowerCase())
    );
  }, [products, activeFilter]);

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!sortConfig.key) return filteredProducts;

    return [...filteredProducts].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === 'impressions') {
        aValue = a.impressions || 0;
        bValue = b.impressions || 0;
      } else if (sortConfig.key === 'engagement') {
        aValue = parseFloat(calculateEngagementRate(a.impressions || 0));
        bValue = parseFloat(calculateEngagementRate(b.impressions || 0));
      } else if (sortConfig.key === 'category') {
        aValue = getCategory(a.name);
        bValue = getCategory(b.name);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortConfig]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setExpandedProducts({});
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Toggle product expanded state
  const toggleProductExpanded = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Generate mini trend SVG
  const generateTrendSVG = (impressions) => {
  // Generate trend based on impressions (higher impressions = better trend) - FIXED: Use coordinate points
  const points = impressions > 40000 
    ? "0,15 20,12 40,8 60,5"
    : impressions > 20000
    ? "0,12 20,11 40,9 60,8"
    : "0,10 20,9 40,11 60,12";
  
  const color = impressions > 40000 ? "#4caf50" : impressions > 20000 ? "#ff9800" : "#f44336";
  
  return (
    <svg width="60" height="20" viewBox="0 0 60 20">
      <polyline 
        points={points} 
        fill="none" 
        stroke={color} 
        strokeWidth="2"
      />
    </svg>
  );
};

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m7 10 5 5 5-5"/>
        </svg>
      );
    }
    
    return sortConfig.direction === 'desc' ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m7 14 5-5 5 5"/>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m7 10 5 5 5-5"/>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Top Performing Products</h2>
        <div className="table-filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Products
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'gut' ? 'active' : ''}`}
            onClick={() => handleFilterChange('gut')}
          >
            Gut Health
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'immune' ? 'active' : ''}`}
            onClick={() => handleFilterChange('immune')}
          >
            Immune Health
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'cognitive' ? 'active' : ''}`}
            onClick={() => handleFilterChange('cognitive')}
          >
            Cognitive Health
          </button>
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="no-products">
          <p>No products found for filter: {activeFilter === 'all' ? 'any' : activeFilter}</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              {/* <th onClick={() => handleSort('category')} className="sortable">
                Category
                {getSortIcon('category')}
              </th>
              <th onClick={() => handleSort('impressions')} className="sortable">
                Impressions
                {getSortIcon('impressions')}
              </th>
              <th onClick={() => handleSort('engagement')} className="sortable">
                Engagement
                {getSortIcon('engagement')}
              </th> */}
              <th>Category</th>
              <th>Impressions</th>
              <th>Engagement</th>
              <th>Trend</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => (
              <React.Fragment key={product.product_id}>
                <tr>
                  <td>
                    <div className="product-name">
                      <div 
                        className="product-icon"
                        style={{
                          backgroundColor: getProductIconColor(product.name).bg,
                          color: getProductIconColor(product.name).color
                        }}
                      >
                        {getProductIcon(product.name)}
                      </div>
                      {product.name}
                    </div>
                  </td>
                  <td>{getCategory(product.name)}</td>
                  <td>{product.impressions ? new Intl.NumberFormat().format(product.impressions) : 'N/A'}</td>
                  <td>{calculateEngagementRate(product.impressions)}%</td>
                  <td>{generateTrendSVG(product.impressions)}</td>
                  <td>
                    <button 
                      className="action-btn view"
                      onClick={() => toggleProductExpanded(product.product_id)}
                    >
                      {expandedProducts[product.product_id] ? 'Hide Details' : 'View Details'}
                    </button>
                  </td>
                </tr>

                {/* Expanded product details row */}
                {expandedProducts[product.product_id] && (
                  <tr className="product-details-row">
                    <td colSpan="6">
                      <div className="product-details">
                        <h4>Product Details</h4>
                        <div className="product-metrics-grid">
                          <div className="product-metric-card">
                            <div className="metric-title">Regular Price</div>
                            <div className="metric-value">
                              ${product.regular_price ? product.regular_price.toFixed(2) : 'N/A'}
                            </div>
                          </div>
                          <div className="product-metric-card">
                            <div className="metric-title">Sale Price</div>
                            <div className="metric-value">
                              ${product.sale_price ? product.sale_price.toFixed(2) : 'N/A'}
                            </div>
                          </div>
                          <div className="product-metric-card">
                            <div className="metric-title">Discount</div>
                            <div className="metric-value">
                              {product.discount_percentage ? `${product.discount_percentage}%` : 'N/A'}
                            </div>
                          </div>
                          <div className="product-metric-card">
                            <div className="metric-title">Clinical Status</div>
                            <div className="metric-value">
                              {product.clinical_status_id ? `Status ${product.clinical_status_id}` : 'Pending'}
                            </div>
                          </div>
                        </div>
                        
                        {product.description && (
                          <div className="product-description">
                            <h5>Description</h5>
                            <p>{product.description}</p>
                          </div>
                        )}
                        
                        <div className="product-dates">
                          <div className="date-item">
                            <span className="date-label">Created:</span>
                            <span className="date-value">
                              {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div className="date-item">
                            <span className="date-label">Last Updated:</span>
                            <span className="date-value">
                              {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
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

export default ProductPerformanceTable;
