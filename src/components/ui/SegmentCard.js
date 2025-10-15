// src/components/ui/SegmentCard.js
import React from 'react';
import './SegmentCard.css';

function SegmentCard({ icon, title, value, text, bgColor, iconColor }) {
  return (
    <div className="segment-card">
      <div 
        className="segment-icon" 
        style={{ backgroundColor: bgColor || '#e3f2fd', color: iconColor || '#2196f3' }}
      >
        {icon}
      </div>
      <div className="segment-title">{title}</div>
      <div className="segment-value">{value}</div>
      <div className="segment-text">{text}</div>
    </div>
  );
}

export default SegmentCard;