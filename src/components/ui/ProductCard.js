// src/components/ui/ProductCard.js
import React from 'react';
import './ProductCard.css';

function ProductCard({ product, onEdit, onDelete, onPromote }) {
  // Get clinical status based on product data or name
  const getClinicalStatus = (product) => {
    // This is a placeholder - adjust based on your actual data structure
    const name = product.name.toLowerCase();
    if (name.includes('gut health pro') || name.includes('immune defense')) {
      return { status: 'proven', label: 'Clinically Proven' };
    } else if (name.includes('brain boost') || name.includes('skin radiance')) {
      return { status: 'ongoing', label: 'Ongoing Trials' };
    } else {
      return { status: 'none' };
    }
  };

  // Calculate discount percentage if not provided
  const getDiscountInfo = (product) => {
    const originalPrice = product.regular_price || 0;
    const salePrice = product.sale_price || 0;
    
    if (salePrice && salePrice < originalPrice) {
      const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
      return {
        hasDiscount: true,
        percentage: discountPercent,
        originalPrice,
        salePrice
      };
    }
    
    return {
      hasDiscount: false,
      originalPrice
    };
  };

  // Generate mock impressions if not provided
  const getImpressions = (product) => {
    return product.impressions || Math.floor(Math.random() * 3000) + 500;
  };

  const clinicalStatus = getClinicalStatus(product);
  const discountInfo = getDiscountInfo(product);
  const impressions = getImpressions(product);

  return (
    <div className="product-card">
      <div className="product-image">
        {product.image_path ? (
          <img 
            src={product.image_path} 
            alt={product.name}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`placeholder ${product.image_path ? 'hidden' : ''}`}>
          {product.name.charAt(0)}
        </div>
        
        <div className="impressions-badge">
          {new Intl.NumberFormat().format(impressions)} Impressions
        </div>
        
        {discountInfo.hasDiscount && (
          <div className="discount-badge">
            {discountInfo.percentage}% OFF
          </div>
        )}
      </div>
      
      <div className="product-details">
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-stats">
          <div className="price-stat">
            {discountInfo.hasDiscount ? (
              <>
                <span className="original-price">${discountInfo.originalPrice.toFixed(2)}</span>
                <span className="discounted-price">${discountInfo.salePrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="regular-price">${discountInfo.originalPrice.toFixed(2)}</span>
            )}
            <span className="stat-label">Price</span>
          </div>
          
          {/* Only show clinical trial badge if status is not 'none' */}
          {clinicalStatus.status !== 'none' && (
            <div className={`clinical-trial-badge ${clinicalStatus.status}`}>
              {clinicalStatus.status === 'proven' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              )}
              {clinicalStatus.status === 'ongoing' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              )}
              {clinicalStatus.label}
            </div>
          )}
        </div>
        
        <p className="product-description">
          {product.description || 'No description available.'}
        </p>
        
        <div className="product-actions">
          <button className="action-btn edit-btn" onClick={() => onEdit(product)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            Edit
          </button>
          <button className="action-btn promote-btn" onClick={() => onPromote(product)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            Promote
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(product)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
