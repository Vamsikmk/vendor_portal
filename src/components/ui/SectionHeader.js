// src/components/ui/SectionHeader.js
import React from 'react';
import './SectionHeader.css';

function SectionHeader({ title, actions }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      
      {actions && (
        <div className="section-actions">
          {actions.map((action, index) => (
            <button 
              key={index}
              className={`section-btn ${action.primary ? 'primary' : ''}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;