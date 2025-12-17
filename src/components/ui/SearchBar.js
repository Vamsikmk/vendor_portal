// src/components/ui/SearchBar.js
import React, { useState } from 'react';
import './SearchBar.css';

function SearchBar({ placeholder, onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm);
    }
  };
  
  return (
    <div className="search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input 
        type="text" 
        id = "searchId"
        placeholder={placeholder || "Search..."}
        value={searchTerm}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

export default SearchBar;