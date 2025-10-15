// src/components/ui/ProductModal.js
import React, { useState, useEffect } from 'react';
import './ProductModal.css';

function ProductModal({ mode, product, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    originalPrice: '',
    discountPercent: '0',
    discountedPrice: '',
    imageUrl: '',
    clinicalStatus: 'none',
    description: '',
    ingredients: '',
    benefits: ''
  });

  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData({
        name: product.name || '',
        category: getCategory(product.name) || '',
        originalPrice: product.regular_price?.toString() || '',
        discountPercent: product.discount_percentage?.toString() || '0',
        discountedPrice: product.sale_price?.toString() || '',
        imageUrl: product.image_path || '',
        clinicalStatus: getClinicalStatus(product) || 'none',
        description: product.description || '',
        ingredients: '', // Assuming this isn't in the product data
        benefits: '' // Assuming this isn't in the product data
      });
    }
  }, [mode, product]);

  const getCategory = (productName) => {
    if (!productName) return '';
    const name = productName.toLowerCase();
    if (name.includes('gut')) return 'gut';
    if (name.includes('immune')) return 'immune';
    if (name.includes('brain') || name.includes('cognitive')) return 'cognitive';
    if (name.includes('skin')) return 'skin';
    if (name.includes('heart')) return 'heart';
    return '';
  };

  const getClinicalStatus = (product) => {
    if (!product) return 'none';
    const name = product.name.toLowerCase();
    if (name.includes('gut health pro') || name.includes('immune defense')) {
      return 'proven';
    } else if (name.includes('brain boost') || name.includes('skin radiance')) {
      return 'ongoing';
    }
    return 'none';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate discounted price when original price or discount changes
    if (field === 'originalPrice' || field === 'discountPercent') {
      const originalPrice = field === 'originalPrice' ? parseFloat(value) || 0 : parseFloat(formData.originalPrice) || 0;
      const discountPercent = field === 'discountPercent' ? parseFloat(value) || 0 : parseFloat(formData.discountPercent) || 0;
      
      if (originalPrice > 0 && discountPercent > 0) {
        const discountedPrice = originalPrice * (1 - discountPercent / 100);
        setFormData(prev => ({
          ...prev,
          discountedPrice: discountedPrice.toFixed(2)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          discountedPrice: originalPrice.toFixed(2)
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      regular_price: parseFloat(formData.originalPrice),
      sale_price: parseFloat(formData.discountedPrice),
      discount_percentage: parseFloat(formData.discountPercent),
      image_path: formData.imageUrl,
      description: formData.description,
      // Add other fields as needed
    };

    onSave(productData);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <h2 className="form-title">
          {mode === 'add' ? 'Add New Product' : 'Edit Product'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="productName">Product Name</label>
            <input
              type="text"
              id="productName"
              className="form-control"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="productCategory">Category</label>
            <select
              id="productCategory"
              className="form-control"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
            >
              <option value="">Select a category</option>
              <option value="gut">Gut Health</option>
              <option value="cognitive">Cognitive Health</option>
              <option value="skin">Skin Health</option>
              <option value="immune">Immune Health</option>
              <option value="heart">Heart Health</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="productOriginalPrice">Original Price ($)</label>
            <input
              type="number"
              id="productOriginalPrice"
              className="form-control"
              min="0"
              step="0.01"
              value={formData.originalPrice}
              onChange={(e) => handleInputChange('originalPrice', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="productDiscountPercent">Discount Percentage (%)</label>
            <input
              type="number"
              id="productDiscountPercent"
              className="form-control"
              min="0"
              max="100"
              value={formData.discountPercent}
              onChange={(e) => handleInputChange('discountPercent', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="productDiscountedPrice">Discounted Price ($)</label>
            <input
              type="number"
              id="productDiscountedPrice"
              className="form-control"
              min="0"
              step="0.01"
              value={formData.discountedPrice}
              readOnly
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="productImage">Product Image URL</label>
            <input
              type="text"
              id="productImage"
              className="form-control"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="clinicalTrialStatus">Clinical Trial Status</label>
            <select
              id="clinicalTrialStatus"
              className="form-control"
              value={formData.clinicalStatus}
              onChange={(e) => handleInputChange('clinicalStatus', e.target.value)}
            >
              <option value="proven">Clinically Proven</option>
              <option value="ongoing">Ongoing Trials</option>
              <option value="none">No Trials</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="productDescription">Description</label>
            <textarea
              id="productDescription"
              className="form-control"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="productIngredients">Key Ingredients</label>
            <textarea
              id="productIngredients"
              className="form-control"
              value={formData.ingredients}
              onChange={(e) => handleInputChange('ingredients', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="productBenefits">Key Benefits</label>
            <textarea
              id="productBenefits"
              className="form-control"
              value={formData.benefits}
              onChange={(e) => handleInputChange('benefits', e.target.value)}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {mode === 'add' ? 'Add Product' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;