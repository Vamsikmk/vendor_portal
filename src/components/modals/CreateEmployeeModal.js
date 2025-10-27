// src/components/modals/CreateEmployeeModal.js
import React, { useState } from 'react';
import './CreatePatientModal.css'; // Reusing the same styles

function CreateEmployeeModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        employee_role: 'viewer',
        department: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

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

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare data for API (exclude confirmPassword)
            const { confirmPassword, ...employeeData } = formData;

            console.log('Creating employee:', employeeData);

            // Make API call
            const response = await fetch(`${API_BASE_URL}/api/vendor/employees`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(employeeData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to create employee: ${response.status}`);
            }

            const data = await response.json();
            console.log('Employee created:', data);

            // Show success message
            alert(`Employee account created successfully!\n\nUsername: ${data.username}\nEmail: ${data.email}\nRole: ${data.employee_role}\n\nPlease provide these credentials to the employee.`);

            // Reset form
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                first_name: '',
                last_name: '',
                phone: '',
                employee_role: 'viewer',
                department: ''
            });

            // Call success callback
            if (onSuccess) {
                onSuccess(data);
            }

            // Close modal
            onClose();

        } catch (error) {
            console.error('Error creating employee:', error);

            // Handle specific error messages
            if (error.message.includes('Username already exists')) {
                setErrors(prev => ({ ...prev, username: 'Username already exists' }));
            } else if (error.message.includes('Email already exists')) {
                setErrors(prev => ({ ...prev, email: 'Email already exists' }));
            } else {
                alert(`Failed to create employee: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            first_name: '',
            last_name: '',
            phone: '',
            employee_role: 'viewer',
            department: ''
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content create-patient-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Employee Account</h2>
                    <button className="modal-close" onClick={handleCancel}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="patient-form">
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
                            />
                            {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                        </div>
                    </div>

                    {/* Username and Email */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="username">
                                Username <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={errors.username ? 'error' : ''}
                                placeholder="john_doe"
                            />
                            {errors.username && <span className="error-message">{errors.username}</span>}
                            <small className="field-help">3-50 characters, letters, numbers, and underscores only</small>
                        </div>

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
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>
                    </div>

                    {/* Phone and Role */}
                    <div className="form-row">
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
                            />
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>

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
                            >
                                <option value="viewer">Viewer - View only access</option>
                                <option value="editor">Editor - Can edit content</option>
                                <option value="manager">Manager - Can manage employees</option>
                            </select>
                            {errors.employee_role && <span className="error-message">{errors.employee_role}</span>}
                            <small className="field-help">Select the appropriate access level</small>
                        </div>
                    </div>

                    {/* Department */}
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
                        />
                        <small className="field-help">The department this employee belongs to</small>
                    </div>

                    {/* Password Fields */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">
                                Password <span className="required">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'error' : ''}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                            <small className="field-help">Minimum 6 characters</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                Confirm Password <span className="required">*</span>
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'error' : ''}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="info-box">
                        <p>
                            <strong>Note:</strong> After creating the employee account, please provide the username
                            and password to the employee securely. They will be able to log in immediately with their
                            assigned permissions.
                        </p>
                    </div>

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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEmployeeModal;