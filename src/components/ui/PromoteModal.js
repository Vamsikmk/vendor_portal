// src/components/ui/PromoteModal.js
import React, { useState } from 'react';
import './Modal.css';

function PromoteModal({ product, onPromote, onClose }) {
  const [formData, setFormData] = useState({
    channel: '',
    budget: 200,
    duration: '14',
    targetAudience: 'all'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPromote(formData);
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
        
        <h2 className="form-title">Promote Product</h2>
        <p className="promotion-product">Promoting: <strong>{product?.name}</strong></p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Promotion Channel</label>
            <div className="channel-grid">
              <label className={`channel-option ${formData.channel === 'instagram' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="channel"
                  value="instagram"
                  checked={formData.channel === 'instagram'}
                  onChange={(e) => handleInputChange('channel', e.target.value)}
                />
                <div className="channel-content">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00BFA5" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <div className="channel-name">Instagram</div>
                </div>
              </label>
              
              <label className={`channel-option ${formData.channel === 'facebook' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="channel"
                  value="facebook"
                  checked={formData.channel === 'facebook'}
                  onChange={(e) => handleInputChange('channel', e.target.value)}
                />
                <div className="channel-content">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00BFA5" strokeWidth="2">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <div className="channel-name">Facebook</div>
                </div>
              </label>
              
              <label className={`channel-option ${formData.channel === 'twitter' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="channel"
                  value="twitter"
                  checked={formData.channel === 'twitter'}
                  onChange={(e) => handleInputChange('channel', e.target.value)}
                />
                <div className="channel-content">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00BFA5" strokeWidth="2">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                  <div className="channel-name">Twitter</div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="promotionBudget">Promotion Budget</label>
            <input
              type="range"
              id="promotionBudget"
              min="50"
              max="1000"
              step="50"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', parseInt(e.target.value))}
              className="budget-slider"
            />
            <div className="budget-range">
              <span>$50</span>
              <span className="budget-value">${formData.budget}</span>
              <span>$1000</span>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="promotionDuration">Duration</label>
            <select
              id="promotionDuration"
              className="form-control"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="targetAudience">Target Audience</label>
            <select
              id="targetAudience"
              className="form-control"
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
            >
              <option value="all">All MannBiome Users</option>
              <option value="gut">Users Interested in Gut Health</option>
              <option value="skin">Users Interested in Skin Health</option>
              <option value="cognitive">Users Interested in Cognitive Health</option>
              <option value="immune">Users Interested in Immune Health</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Start Promotion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PromoteModal;
