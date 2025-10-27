// src/components/ui/DeleteModal.js
import React from 'react';
import './Modal.css';

function DeleteModal({
  isOpen,
  onConfirm,
  onClose,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel"
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content delete-modal">
        <h2 className="form-title">{title}</h2>
        <p className="delete-message">
          {message}
        </p>
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            {cancelText}
          </button>
          <button type="button" className="delete-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;