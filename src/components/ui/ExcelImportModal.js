// src/components/ui/ExcelImportModal.js
import React, { useState, useCallback } from 'react';
import * as XLSX from 'sheetjs-style';
import './ExcelImportModal.css';

function ExcelImportModal({ onImport, onClose }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview

  // Required columns for product import
  const requiredColumns = [
    'name',
    'category',
    'original_price',
    'description'
  ];

  // Optional columns
  const optionalColumns = [
    'discount_percent',
    'discounted_price',
    'image_url',
    'clinical_status',
    'ingredients',
    'benefits'
  ];

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ];
    
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      setValidationErrors(['Please upload a valid Excel file (.xlsx or .xls)']);
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);
    setValidationErrors([]);

    try {
      await parseFile(selectedFile);
    } catch (error) {
      setValidationErrors([`Error reading file: ${error.message}`]);
      setIsValidating(false);
    }
  };

  const parseFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            throw new Error('File is empty');
          }
          
          // Get headers and validate
          const headers = jsonData[0].map(header => 
            header ? header.toString().toLowerCase().trim() : ''
          );
          
          const validation = validateHeaders(headers);
          if (validation.errors.length > 0) {
            setValidationErrors(validation.errors);
            setIsValidating(false);
            return;
          }
          
          // Parse products
          const products = parseProducts(jsonData, headers);
          setParsedData(products);
          setStep(2);
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          setIsValidating(false);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const validateHeaders = (headers) => {
    const errors = [];
    const missingRequired = [];
    
    // Check for required columns
    requiredColumns.forEach(col => {
      if (!headers.includes(col)) {
        missingRequired.push(col);
      }
    });
    
    if (missingRequired.length > 0) {
      errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
    }
    
    return { errors };
  };

  const parseProducts = (data, headers) => {
    const products = [];
    const errors = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(cell => !cell)) continue; // Skip empty rows
      
      const product = {};
      const rowErrors = [];
      
      headers.forEach((header, index) => {
        const value = row[index];
        
        switch (header) {
          case 'name':
            product.name = value || '';
            if (!product.name) rowErrors.push('Name is required');
            break;
          case 'category':
            product.category = value || '';
            if (!product.category) rowErrors.push('Category is required');
            break;
          case 'original_price':
            product.regular_price = parseFloat(value) || 0;
            if (product.regular_price <= 0) rowErrors.push('Original price must be greater than 0');
            break;
          case 'discount_percent':
            product.discount_percentage = Math.min(100, Math.max(0, parseFloat(value) || 0));
            break;
          case 'discounted_price':
            product.sale_price = parseFloat(value) || product.regular_price;
            break;
          case 'description':
            product.description = value || '';
            if (!product.description) rowErrors.push('Description is required');
            break;
          case 'image_url':
            product.image_path = value || '';
            break;
          case 'clinical_status':
            product.clinical_status = value || 'none';
            break;
          case 'ingredients':
            product.ingredients = value || '';
            break;
          case 'benefits':
            product.benefits = value || '';
            break;
        }
      });
      
      // Calculate sale price if discount percentage is provided
      if (product.discount_percentage > 0 && !product.sale_price) {
        product.sale_price = product.regular_price * (1 - product.discount_percentage / 100);
      }
      
      product.rowNumber = i + 1;
      product.errors = rowErrors;
      products.push(product);
    }
    
    return products;
  };

  const downloadTemplate = () => {
    const templateData = [
      ['name', 'category', 'original_price', 'discount_percent', 'description', 'image_url', 'clinical_status', 'ingredients', 'benefits'],
      ['Gut Health Pro', 'gut', '49.99', '15', 'Advanced probiotic supplement for digestive health', '', 'proven', 'Lactobacillus, Bifidobacterium', 'Improved digestion, Better gut health'],
      ['Brain Boost Plus', 'cognitive', '79.99', '20', 'Nootropic supplement for cognitive enhancement', '', 'ongoing', 'Ginkgo Biloba, Phosphatidylserine', 'Enhanced memory, Better focus']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Template");
    XLSX.writeFile(wb, "products-template.xlsx");
  };

  const handleImport = () => {
    const validProducts = parsedData.filter(product => product.errors.length === 0);
    onImport(validProducts);
    onClose();
  };

  const getValidationSummary = () => {
    if (!parsedData) return null;
    
    const total = parsedData.length;
    const valid = parsedData.filter(p => p.errors.length === 0).length;
    const invalid = total - valid;
    
    return { total, valid, invalid };
  };

  const renderStep1 = () => (
    <div className="import-step">
      <h3>Upload Excel File</h3>
      <p>Upload an Excel file with product information. The file should contain the following required columns:</p>
      
      <div className="required-columns">
        <strong>Required columns:</strong>
        <ul>
          {requiredColumns.map(col => (
            <li key={col}>{col}</li>
          ))}
        </ul>
      </div>
      
      <div className="optional-columns">
        <strong>Optional columns:</strong>
        <ul>
          {optionalColumns.map(col => (
            <li key={col}>{col}</li>
          ))}
        </ul>
      </div>
      
      <div 
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        {!file ? (
          <>
            <div className="dropzone-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <p>Drag and drop your Excel file here, or <label htmlFor="file-input" className="file-link">browse</label></p>
            <p className="file-info">Supports .xlsx and .xls files</p>
          </>
        ) : (
          <div className="file-selected">
            <div className="file-icon">📄</div>
            <span>{file.name}</span>
            {isValidating && <div className="spinner-small">⏳</div>}
          </div>
        )}
      </div>
      
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>Validation Errors:</h4>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="template-section">
        <p>Don't have a file? <button type="button" className="link-btn" onClick={downloadTemplate}>Download template</button></p>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const summary = getValidationSummary();
    
    return (
      <div className="import-step">
        <h3>Preview Products</h3>
        
        <div className="import-summary">
          <div className="summary-item">
            <span className="summary-label">Total:</span>
            <span className="summary-value">{summary.total}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Valid:</span>
            <span className="summary-value valid">{summary.valid}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Invalid:</span>
            <span className="summary-value invalid">{summary.invalid}</span>
          </div>
        </div>
        
        <div className="products-preview">
          {parsedData.slice(0, 10).map((product, index) => (
            <div key={index} className={`product-preview-item ${product.errors.length > 0 ? 'invalid' : 'valid'}`}>
              <div className="product-preview-header">
                <span className="product-name">{product.name}</span>
                <span className="product-price">${product.regular_price}</span>
              </div>
              {product.errors.length > 0 && (
                <div className="product-errors">
                  {product.errors.map((error, idx) => (
                    <span key={idx} className="error-text">Row {product.rowNumber}: {error}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {parsedData.length > 10 && (
            <div className="more-products">
              And {parsedData.length - 10} more products...
            </div>
          )}
        </div>
        
        <div className="preview-actions">
          <button type="button" className="cancel-btn" onClick={() => setStep(1)}>
            Back
          </button>
          <button 
            type="button" 
            className="submit-btn" 
            onClick={handleImport}
            disabled={summary.valid === 0}
          >
            Import {summary.valid} Valid Products
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content excel-import-modal">
        <button className="close-btn" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <h2 className="form-title">Import Products from Excel</h2>
        
        <div className="import-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Upload</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Preview</span>
          </div>
        </div>
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>
    </div>
  );
}

export default ExcelImportModal;