// src/components/ui/RecommendationCard.js
import React from 'react';
import './RecommendationCard.css';

function RecommendationCard({ title, text, primaryAction, secondaryAction }) {
  const handlePrimaryClick = () => {
    // In a real app, this would trigger an action
    alert(`Action triggered: ${primaryAction}`);
  };
  
  const handleSecondaryClick = () => {
    // In a real app, this would trigger an action
    alert(`Action triggered: ${secondaryAction}`);
  };
  
  return (
    <div className="recommendation-card">
      <div className="recommendation-title">{title}</div>
      <div className="recommendation-text">{text}</div>
      <div className="recommendation-actions">
        <button 
          className="recommendation-btn primary"
          onClick={handlePrimaryClick}
        >
          {primaryAction}
        </button>
        <button 
          className="recommendation-btn"
          onClick={handleSecondaryClick}
        >
          {secondaryAction}
        </button>
      </div>
    </div>
  );
}

export default RecommendationCard;