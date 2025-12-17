// src/components/ui/StatCard.js
import React from 'react';
import './StatCard.css';

function StatCard({ label, value, trend, trendValue }) {
  // Format a number with commas for thousands
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Determine trend direction
  const trendDirection = parseFloat(trendValue) >= 0 ? 'up' : 'down';
  
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      <div className={`stat-trend trend-${trendDirection}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points={trendDirection === 'up' ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
        {trendValue > 0 && '+'}{trendValue} {trend}
      </div>
    </div>
  );
}

export default StatCard;