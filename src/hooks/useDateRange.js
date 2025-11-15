// src/hooks/useDateRange.js
import { useState, useEffect } from 'react';

function useDateRange() {
  const [dateRangeType, setDateRangeType] = useState('last30days');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isCustomRange, setIsCustomRange] = useState(false);

  // Update date range when type changes
  useEffect(() => {
    const today = new Date();
    const end = new Date(today);
    let start = new Date(today);
    
    switch(dateRangeType) {
      case 'last7days':
        start.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(today.getDate() - 30);
        break;
      case 'last90days':
        start.setDate(today.getDate() - 90);
        break;
      case 'lastyear':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        setIsCustomRange(true);
        // Don't change dates for custom, user will set them
        return;
      default:
        start.setDate(today.getDate() - 30); // Default to 30 days
    }
    
    setIsCustomRange(false);
    setStartDate(start);
    setEndDate(end);
  }, [dateRangeType]);

  // Format dates for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Create a date range object for API calls
  const getDateRangeParams = () => {
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      rangeType: dateRangeType
    };
  };

  return {
    dateRangeType,
    setDateRangeType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isCustomRange,
    formatDate,
    getDateRangeParams
  };
}

export default useDateRange;