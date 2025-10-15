// src/components/ui/DeleteModal.js
import React from 'react';
import './Modal.css';

function DeleteModal({ product, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content delete-modal">
        <h2 className="form-title">Confirm Deletion</h2>
        <p className="delete-message">
          Are you sure you want to delete <strong>{product?.name}</strong>? This action cannot be undone.
        </p>
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="delete-btn" onClick={onConfirm}>
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;