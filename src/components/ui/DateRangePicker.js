// src/components/ui/DateRangePicker.js
import React from 'react';
import './DateRangePicker.css';

function DateRangePicker({ 
  dateRangeType, 
  setDateRangeType, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  isCustomRange, 
  formatDate, 
  onApply 
}) {
  
  // Handle date range type change
  const handleRangeTypeChange = (e) => {
    setDateRangeType(e.target.value);
  };
  
  // Handle start date change
  const handleStartDateChange = (e) => {
    const date = new Date(e.target.value);
    setStartDate(date);
  };
  
  // Handle end date change
  const handleEndDateChange = (e) => {
    const date = new Date(e.target.value);
    setEndDate(date);
  };
  
  // Handle apply button click
  const handleApply = () => {
    onApply();
  };
  
  return (
    <div className="date-range-picker">
      <span>Date Range:</span>
      <select 
        value={dateRangeType} 
        onChange={handleRangeTypeChange} 
        id="dateRangeSelect"
      >
        <option value="last7days">Last 7 Days</option>
        <option value="last30days">Last 30 Days</option>
        <option value="last90days">Last 90 Days</option>
        <option value="lastyear">Last Year</option>
        <option value="custom">Custom Range</option>
      </select>
      
      <input 
        type="date" 
        id="startDate" 
        value={startDate ? formatDate(startDate) : ''} 
        onChange={handleStartDateChange}
        disabled={!isCustomRange} 
      />
      
      <input 
        type="date" 
        id="endDate" 
        value={endDate ? formatDate(endDate) : ''} 
        onChange={handleEndDateChange}
        disabled={!isCustomRange} 
      />
      
      <button id="applyDateRange" onClick={handleApply}>Apply</button>
    </div>
  );
}

export default DateRangePicker;