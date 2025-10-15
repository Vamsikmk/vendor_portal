// src/pages/MyProducts.js
import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ui/ProductCard';
import ProductModal from '../components/ui/ProductModal';
import DeleteModal from '../components/ui/DeleteModal';
import PromoteModal from '../components/ui/PromoteModal';
import ExcelImportModal from '../components/ui/ExcelImportModal';
import './MyProducts.css';

function MyProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    impressions: '',
    clinicalStatus: '',
    sortBy: 'newest'
  });

  // FIXED: Use the correct API URL and add authentication
  const API_BASE_URL = 'https://3b6akxpfpr.us-east-2.awsapprunner.com';

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch products from API - FIXED: Updated URL and added auth
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching products from:', `${API_BASE_URL}/api/products`);
      
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log('Products response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in.');
          return;
        }
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Products data:', data);
      
      setProducts(Array.isArray(data.products) ? data.products : []);
      setFilteredProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(`Failed to load products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => {
        const productName = product.name.toLowerCase();
        return productName.includes(filters.category.toLowerCase());
      });
    }

    // Impressions filter
    if (filters.impressions) {
      filtered = filtered.filter(product => {
        const impressions = product.impressions || 0;
        switch (filters.impressions) {
          case 'high':
            return impressions >= 1000;
          case 'medium':
            return impressions >= 500 && impressions < 1000;
          case 'low':
            return impressions < 500;
          default:
            return true;
        }
      });
    }

    // Clinical status filter
    if (filters.clinicalStatus) {
      // This would depend on how clinical status is stored in your products
      // For now, we'll use product names to infer status
      filtered = filtered.filter(product => {
        // This is a placeholder - adjust based on your actual data structure
        return true;
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'price-high':
          return (b.regular_price || 0) - (a.regular_price || 0);
        case 'price-low':
          return (a.regular_price || 0) - (b.regular_price || 0);
        case 'bestselling':
          return (b.impressions || 0) - (a.impressions || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, filters]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle product actions
  const handleAddProduct = () => {
    setModalMode('add');
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handlePromoteProduct = (product) => {
    setSelectedProduct(product);
    setShowPromoteModal(true);
  };

  const handleImportProducts = () => {
    setShowExcelImportModal(true);
  };

  // Handle product save - FIXED: Added real API calls
  const handleProductSave = async (productData) => {
    try {
      if (modalMode === 'add') {
        // FIXED: Make actual API call to create product
        console.log('Creating product:', productData);
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create product: ${response.status}`);
        }
        
        alert('Product created successfully!');
      } else {
        // FIXED: Make actual API call to update product
        console.log('Updating product:', productData);
        const response = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.product_id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update product: ${response.status}`);
        }
        
        alert('Product updated successfully!');
      }
      setShowProductModal(false);
      fetchProducts(); // Refresh the products list
    } catch (error) {
      console.error('Error saving product:', error);
      alert(`Error saving product: ${error.message}`);
    }
  };

  // Handle Excel import - FIXED: Added real API calls
  const handleExcelImport = async (importedProducts) => {
    try {
      console.log('Importing products:', importedProducts);
      
      // FIXED: Make actual API call to bulk create products
      const response = await fetch(`${API_BASE_URL}/api/products/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ products: importedProducts })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to import products: ${response.status}`);
      }
      
      const result = await response.json();
      alert(`Successfully imported ${result.imported_count || importedProducts.length} products!`);
      setShowExcelImportModal(false);
      fetchProducts(); // Refresh the products list
    } catch (error) {
      console.error('Error importing products:', error);
      // Fallback: Add to local state if API call fails
      const productsWithIds = importedProducts.map((product, index) => ({
        ...product,
        product_id: `temp_${Date.now()}_${index}`,
        created_at: new Date().toISOString(),
        impressions: Math.floor(Math.random() * 3000) + 500 // Mock impressions
      }));
      
      setProducts(prev => [...prev, ...productsWithIds]);
      alert(`Products added locally (${importedProducts.length} products). Note: ${error.message}`);
      setShowExcelImportModal(false);
    }
  };

  // Handle product deletion - FIXED: Added real API calls
  const confirmDelete = async () => {
    try {
      // FIXED: Make actual API call to delete product
      console.log('Deleting product:', selectedProduct.product_id);
      const response = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.product_id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }
      
      alert('Product deleted successfully!');
      setShowDeleteModal(false);
      fetchProducts(); // Refresh the products list
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Error deleting product: ${error.message}`);
    }
  };

  // Handle product promotion - FIXED: Added real API calls
  const handlePromotion = async (promotionData) => {
    try {
      // FIXED: Make actual API call to promote product
      console.log('Promoting product:', selectedProduct.product_id, promotionData);
      const response = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.product_id}/promote`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(promotionData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to promote product: ${response.status}`);
      }
      
      alert('Product promotion started successfully!');
      setShowPromoteModal(false);
    } catch (error) {
      console.error('Error promoting product:', error);
      alert(`Error promoting product: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Products</h2>
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="my-products-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">My Products</h1>
        <div className="header-actions">
          <button onClick={handleImportProducts} className="import-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Import from Excel
          </button>
          <button onClick={handleAddProduct} className="add-product-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Product
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-container">
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select
            className="filter-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="gut">Gut Health</option>
            <option value="cognitive">Cognitive Health</option>
            <option value="skin">Skin Health</option>
            <option value="immune">Immune Health</option>
            <option value="heart">Heart Health</option>
          </select>
          
          <select
            className="filter-select"
            value={filters.impressions}
            onChange={(e) => handleFilterChange('impressions', e.target.value)}
          >
            <option value="">Impressions</option>
            <option value="high">High (1000+)</option>
            <option value="medium">Medium (500-999)</option>
            <option value="low">Low (0-499)</option>
          </select>
          
          <select
            className="filter-select"
            value={filters.clinicalStatus}
            onChange={(e) => handleFilterChange('clinicalStatus', e.target.value)}
          >
            <option value="">Clinical Status</option>
            <option value="proven">Clinically Proven</option>
            <option value="ongoing">Ongoing Trials</option>
            <option value="none">No Trials</option>
          </select>
          
          <select
            className="filter-select"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price-high">Price High to Low</option>
            <option value="price-low">Price Low to High</option>
            <option value="bestselling">Best Selling</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard
              key={product.product_id}
              product={product}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onPromote={handlePromoteProduct}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn">{'>'}</button>
      </div>

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          mode={modalMode}
          product={selectedProduct}
          onSave={handleProductSave}
          onClose={() => setShowProductModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          product={selectedProduct}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {showPromoteModal && (
        <PromoteModal
          product={selectedProduct}
          onPromote={handlePromotion}
          onClose={() => setShowPromoteModal(false)}
        />
      )}

      {showExcelImportModal && (
        <ExcelImportModal
          onImport={handleExcelImport}
          onClose={() => setShowExcelImportModal(false)}
        />
      )}
    </div>
  );
}

export default MyProducts;