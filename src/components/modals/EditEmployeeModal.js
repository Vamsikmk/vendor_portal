// src/components/modals/EditEmployeeModal.js
import React, { useState, useEffect } from 'react';
import './CreatePatientModal.css'; // Reusing the same styles

function EditEmployeeModal({ isOpen, onClose, employee, onSuccess, isViewOnly = false }) {
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        employee_role: 'viewer',
        department: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

    // Load employee data when modal opens
    useEffect(() => {
        if (isOpen && employee) {
            setFormData({
                email: employee.email || '',
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                phone: employee.phone || '',
                employee_role: employee.employee_role || 'viewer',
                department: employee.department || ''
            });
            setErrors({});
        }
    }, [isOpen, employee]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // First name validation
        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        // Last name validation
        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        // Phone validation
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
            newErrors.phone = 'Invalid phone number format';
        }

        // Employee role validation
        if (!formData.employee_role) {
            newErrors.employee_role = 'Role is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // If view only, don't submit
        if (isViewOnly) {
            onClose();
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Updating employee:', employee.employee_id, formData);

            // Make API call
            const response = await fetch(
                `${API_BASE_URL}/api/vendor/employees/${employee.employee_id}`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to update employee: ${response.status}`);
            }

            const data = await response.json();
            console.log('Employee updated:', data);

            // Show success message
            alert('Employee updated successfully!');

            // Call success callback
            if (onSuccess) {
                onSuccess(data);
            }

            // Close modal
            onClose();

        } catch (error) {
            console.error('Error updating employee:', error);

            // Handle specific error messages
            if (error.message.includes('Email already exists')) {
                setErrors(prev => ({ ...prev, email: 'Email already exists' }));
            } else {
                alert(`Failed to update employee: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setErrors({});
        onClose();
    };

    if (!isOpen || !employee) return null;

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content create-patient-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isViewOnly ? 'Employee Details' : 'Edit Employee'}</h2>
                    <button className="modal-close" onClick={handleCancel}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="patient-form">
                    {/* Employee Info Display */}
                    <div className="info-box" style={{ background: '#f0f9ff', borderColor: '#bae6fd', marginBottom: '20px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#0369a1' }}>
                            <strong>Username:</strong> {employee.username}<br />
                            <strong>Employee ID:</strong> {employee.employee_id}<br />
                            {employee.created_by_username && (
                                <>
                                    <strong>Created by:</strong> {employee.created_by_username}<br />
                                </>
                            )}
                            {employee.created_at && (
                                <>
                                    <strong>Created on:</strong> {new Date(employee.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </>
                            )}
                        </p>
                    </div>

                    {/* Name Fields */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="first_name">
                                First Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className={errors.first_name ? 'error' : ''}
                                placeholder="John"
                                disabled={isViewOnly}
                            />
                            {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="last_name">
                                Last Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className={errors.last_name ? 'error' : ''}
                                placeholder="Doe"
                                disabled={isViewOnly}
                            />
                            {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                        </div>
                    </div>

                    {/* Email and Phone */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">
                                Email <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'error' : ''}
                                placeholder="john.doe@company.com"
                                disabled={isViewOnly}
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">
                                Phone Number <span className="required">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={errors.phone ? 'error' : ''}
                                placeholder="+1 (555) 123-4567"
                                disabled={isViewOnly}
                            />
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>
                    </div>

                    {/* Role and Department */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="employee_role">
                                Employee Role <span className="required">*</span>
                            </label>
                            <select
                                id="employee_role"
                                name="employee_role"
                                value={formData.employee_role}
                                onChange={handleChange}
                                className={errors.employee_role ? 'error' : ''}
                                disabled={isViewOnly}
                            >
                                <option value="viewer">Viewer - View only access</option>
                                <option value="editor">Editor - Can edit content</option>
                                <option value="manager">Manager - Can manage employees</option>
                            </select>
                            {errors.employee_role && <span className="error-message">{errors.employee_role}</span>}
                            <small className="field-help">Select the appropriate access level</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="department">
                                Department <span className="optional">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="e.g., Marketing, Sales, Operations"
                                disabled={isViewOnly}
                            />
                            <small className="field-help">The department this employee belongs to</small>
                        </div>
                    </div>

                    {/* Status Display */}
                    <div className="form-group">
                        <label>Current Status</label>
                        <div style={{
                            padding: '12px',
                            background: employee.status === 'active' ? '#d1fae5' : '#fee2e2',
                            border: '1px solid ' + (employee.status === 'active' ? '#065f46' : '#991b1b'),
                            borderRadius: '8px',
                            color: employee.status === 'active' ? '#065f46' : '#991b1b',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                        }}>
                            {employee.status}
                        </div>
                        <small className="field-help">
                            Use the activate/deactivate button in the employee list to change status
                        </small>
                    </div>

                    {/* Info Box */}
                    {!isViewOnly && (
                        <div className="info-box">
                            <p>
                                <strong>Note:</strong> Username cannot be changed. To change the employee's password,
                                the employee should use the password reset feature or contact an administrator.
                            </p>
                        </div>
                    )}

                    {/* Role Permissions Info */}
                    <div className="info-box" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#0369a1' }}>
                            <strong>Role Permissions:</strong><br />
                            • <strong>Viewer:</strong> View-only access to all data<br />
                            • <strong>Editor:</strong> Can view and edit products/customers<br />
                            • <strong>Manager:</strong> Can create, edit, and deactivate employees
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            {isViewOnly ? 'Close' : 'Cancel'}
                        </button>
                        {!isViewOnly && (
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Employee'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditEmployeeModal;