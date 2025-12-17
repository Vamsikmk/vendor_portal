// src/pages/PatientManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import CreatePatientModal from '../components/modals/CreatePatientModal';
import './PatientManagement.css';

function PatientManagement() {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

    // Fetch patients
    const fetchPatients = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter !== 'all') params.append('status_filter', statusFilter);

            const response = await fetch(
                `${API_BASE_URL}/api/vendor/patients?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || 'Failed to fetch patients';
                
                // Handle "vendor profile not found" gracefully
                if (errorMessage.includes('Vendor profile not found') || errorMessage.includes('vendor_id')) {
                    console.log('No vendor profile found - showing empty state');
                    setPatients([]);
                    setError(null);
                    return;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setPatients(data.patients || []);

        } catch (err) {
            console.error('Error fetching patients:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, searchTerm, statusFilter]);

    // Fetch patients on mount and when filters change
    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    // Handle search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle filter change
    const handleFilterChange = (filter) => {
        setStatusFilter(filter);
    };

    // Handle patient creation success
    const handlePatientCreated = () => {
        // Refresh patient list
        fetchPatients();
    };

    // Handle deactivate patient
    const handleDeactivatePatient = async (patientId, patientName) => {
        if (!window.confirm(`Are you sure you want to deactivate ${patientName}'s account?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');

            const response = await fetch(
                `${API_BASE_URL}/api/vendor/patients/${patientId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to deactivate patient');
            }

            alert('Patient account deactivated successfully');
            fetchPatients(); // Refresh list

        } catch (err) {
            console.error('Error deactivating patient:', err);
            alert(`Failed to deactivate patient: ${err.message}`);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get initials
    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <div className="patient-management">
            <div className="page-header">
                <div className="header-content">
                    <h1>Patient Management</h1>
                    <p className="subtitle">Manage patient accounts created by your organization</p>
                </div>
                <button
                    className="btn-create-patient"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <span className="icon">+</span>
                    Add New Patient
                </button>
            </div>

            <div className="controls-section">
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, username, or email..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('active')}
                    >
                        Active
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('inactive')}
                    >
                        Inactive
                    </button>
                </div>
            </div>

            <div className="patients-section">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading patients...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h3 style={{ marginBottom: '12px', color: '#0f172a' }}>Unable to Load Patients</h3>
                        <p className="error-message" style={{ marginBottom: '24px' }}>{error}</p>
                        <button onClick={fetchPatients} className="btn-retry">
                            🔄 Retry
                        </button>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No Patients Available</h3>
                        <p>
                            {searchTerm || statusFilter !== 'all'
                                ? 'No patients match your search criteria'
                                : 'No patient accounts are currently associated with your organization'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <button
                                className="btn-create-patient"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                Add Your First Patient
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="patients-grid">
                        {patients.map((patient) => (
                            <div key={patient.customer_id} className="patient-card">
                                <div className="patient-header">
                                    <div className="patient-avatar">
                                        {getInitials(patient.first_name, patient.last_name)}
                                    </div>
                                    <div className="patient-info">
                                        <h3>{patient.first_name} {patient.last_name}</h3>
                                        <p className="patient-username">@{patient.username}</p>
                                    </div>
                                    <span className={`status-badge ${patient.status}`}>
                                        {patient.status === 'active' ? '● Active' : '○ Inactive'}
                                    </span>
                                </div>

                                <div className="patient-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Email:</span>
                                        <span className="detail-value">{patient.email}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{patient.phone || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Patient ID:</span>
                                        <span className="detail-value">MB-{patient.user_id}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Created:</span>
                                        <span className="detail-value">{formatDate(patient.created_at)}</span>
                                    </div>
                                </div>

                                <div className="patient-actions">
                                    <button
                                        className="btn-action btn-view"
                                        onClick={() => alert('View patient details - To be implemented')}
                                    >
                                        View Details
                                    </button>
                                    {patient.status === 'active' && (
                                        <button
                                            className="btn-action btn-deactivate"
                                            onClick={() => handleDeactivatePatient(
                                                patient.customer_id,
                                                `${patient.first_name} ${patient.last_name}`
                                            )}
                                        >
                                            Deactivate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Patient count summary */}
            {!loading && !error && patients.length > 0 && (
                <div className="summary-footer">
                    <p>
                        Showing <strong>{patients.length}</strong> patient{patients.length !== 1 ? 's' : ''}
                        {statusFilter !== 'all' && ` with status: ${statusFilter}`}
                    </p>
                </div>
            )}

            {/* Create Patient Modal */}
            <CreatePatientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handlePatientCreated}
            />
        </div>
    );
}

export default PatientManagement;