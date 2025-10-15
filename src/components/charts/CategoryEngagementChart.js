// src/components/charts/CategoryEngagementChart.js
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './ChartComponents.css';

function CategoryEngagementChart({ categories }) {
  // Safety check for categories data - ADDED
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h2 className="chart-title">Engagement by Category</h2>
        </div>
        <div className="chart-content">
          <div className="no-data-message" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '300px',
            color: '#666',
            fontSize: '14px'
          }}>
            <p>No category data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Colors for each category
  const COLORS = ['#00BFA5', '#2196F3', '#9c27b0', '#ff9800', '#4caf50', '#e91e63', '#795548'];
  
  // Add color and formatted percentage to each category - ENHANCED
  const chartData = categories.map((category, index) => {
    // Handle different possible data structures
    const categoryName = category.category || category.name || `Category ${index + 1}`;
    const categoryValue = category.percentage || category.value || 0;
    
    return {
      ...category,
      category: categoryName,
      percentage: typeof categoryValue === 'number' ? categoryValue : parseFloat(categoryValue) || 0,
      color: COLORS[index % COLORS.length],
      formattedPercentage: `${typeof categoryValue === 'number' ? categoryValue : parseFloat(categoryValue) || 0}%`
    };
  }).filter(item => item.percentage > 0); // Filter out zero values
  
  // Custom tooltip content - ENHANCED
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p className="tooltip-label" style={{ 
            margin: '0 0 5px 0', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            {data.category}
          </p>
          <p className="tooltip-value" style={{ 
            margin: '0',
            color: data.color,
            fontWeight: '600'
          }}>
            {data.formattedPercentage}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label function for pie slices - ADDED
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // Only show label if slice is large enough (>5%)
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2 className="chart-title">Engagement by Category</h2>
      </div>
      
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="percentage"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="vertical" 
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value, entry) => {
                return (
                  <span style={{ color: '#666', fontSize: 12 }}>
                    {value} ({entry.payload.formattedPercentage})
                  </span>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Add summary statistics - NEW */}
      <div className="chart-summary" style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <div className="summary-item">
          <span className="summary-label" style={{ color: '#666' }}>Categories:</span>
          <span className="summary-value" style={{ fontWeight: 'bold', marginLeft: '5px' }}>
            {chartData.length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label" style={{ color: '#666' }}>Top Category:</span>
          <span className="summary-value" style={{ fontWeight: 'bold', marginLeft: '5px' }}>
            {chartData.length > 0 ? chartData.reduce((prev, current) => 
              (prev.percentage > current.percentage) ? prev : current
            ).category : 'N/A'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label" style={{ color: '#666' }}>Total:</span>
          <span className="summary-value" style={{ fontWeight: 'bold', marginLeft: '5px' }}>
            {chartData.reduce((sum, cat) => sum + cat.percentage, 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default CategoryEngagementChart;
