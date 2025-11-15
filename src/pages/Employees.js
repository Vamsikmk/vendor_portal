// src/pages/Employees.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useEmployeePermissions from '../hooks/useEmployeePermissions';
import PermissionGuard from '../components/common/PermissionGuard';
import CreateEmployeeModal from '../components/modals/CreateEmployeeModal';
import EditEmployeeModal from '../components/modals/EditEmployeeModal';
import DeleteModal from '../components/ui/DeleteModal';
import SearchBar from '../components/ui/SearchBar';
import './Employees.css';

function Employees() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const {
        loading: permissionsLoading,
        canCreateEmployees,
        canEditEmployees,
        canDeleteEmployees,
        canDeactivateEmployees,
        isViewerOnly
    } = useEmployeePermissions();

    // State management
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // API Base URL
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

    // Get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    };

    // Fetch employees
    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/vendor/employees`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    navigate('/login');
                    return;
                }
                throw new Error(`Failed to fetch employees: ${response.status}`);
            }

            const data = await response.json();
            console.log('Employees data:', data);
            setEmployees(data.employees || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch employees on component mount
    useEffect(() => {
        if (isAuthenticated && !permissionsLoading) {
            fetchEmployees();
        }
    }, [isAuthenticated, permissionsLoading]);

    // Handle search
    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    // Filter employees
    const filteredEmployees = employees.filter(employee => {
        // Search filter
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            employee.username.toLowerCase().includes(searchLower) ||
            employee.email.toLowerCase().includes(searchLower) ||
            employee.first_name.toLowerCase().includes(searchLower) ||
            employee.last_name.toLowerCase().includes(searchLower) ||
            (employee.department && employee.department.toLowerCase().includes(searchLower));

        // Role filter
        const matchesRole = roleFilter === 'all' || employee.employee_role === roleFilter;

        // Status filter
        const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Handle create employee
    const handleCreateEmployee = () => {
        setShowCreateModal(true);
    };

    // Handle edit employee
    const handleEditEmployee = (employee) => {
        setSelectedEmployee(employee);
        setShowEditModal(true);
    };

    // Handle delete employee
    const handleDeleteEmployee = (employee) => {
        setSelectedEmployee(employee);
        setShowDeleteModal(true);
    };

    // Handle view employee details
    const handleViewEmployee = (employee) => {
        setSelectedEmployee(employee);
        setShowEditModal(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/vendor/employees/${selectedEmployee.employee_id}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete employee: ${response.status}`);
            }

            alert('Employee deleted successfully!');
            setShowDeleteModal(false);
            setSelectedEmployee(null);
            fetchEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert(`Error deleting employee: ${error.message}`);
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (employee) => {
        try {
            const newStatus = employee.status === 'active' ? 'inactive' : 'active';
            const response = await fetch(
                `${API_BASE_URL}/api/vendor/employees/${employee.employee_id}/status`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ status: newStatus })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.status}`);
            }

            alert(`Employee ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
            fetchEmployees();
        } catch (error) {
            console.error('Error updating status:', error);
            alert(`Error updating status: ${error.message}`);
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

    // Get role badge class
    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'manager':
                return 'role-badge role-manager';
            case 'editor':
                return 'role-badge role-editor';
            case 'viewer':
                return 'role-badge role-viewer';
            default:
                return 'role-badge';
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        return status === 'active' ? 'status-badge status-active' : 'status-badge status-inactive';
    };

    if (permissionsLoading) {
        return (
            <div className="employees-container">
                <div className="loading-state">Loading permissions...</div>
            </div>
        );
    }

    return (
        <div className="employees-container">
            {/* Header */}
            <div className="employees-header">
                <div className="header-left">
                    <h1 className="page-title">Employee Management</h1>
                    <p className="page-subtitle">
                        Manage your team members and their access permissions
                    </p>
                </div>
                <div className="header-right">
                    <PermissionGuard permission="can_create_employees">
                        <button className="btn btn-primary" onClick={handleCreateEmployee}>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M8 3v10M3 8h10" />
                            </svg>
                            Add Employee
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Filters */}
            <div className="employees-filters">
                <div className="filter-left">
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Search by name, username, email, or department..."
                    />
                </div>
                <div className="filter-right">
                    <select
                        className="filter-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="manager">Manager</option>
                    </select>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="employees-stats">
                <div className="stat-card">
                    <div className="stat-label">Total Employees</div>
                    <div className="stat-value">{employees.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active</div>
                    <div className="stat-value">
                        {employees.filter(e => e.status === 'active').length}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Inactive</div>
                    <div className="stat-value">
                        {employees.filter(e => e.status === 'inactive').length}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Filtered Results</div>
                    <div className="stat-value">{filteredEmployees.length}</div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-state">Loading employees...</div>
            ) : error ? (
                <div className="error-state">
                    <p>Error: {error}</p>
                    <button className="btn btn-secondary" onClick={fetchEmployees}>
                        Retry
                    </button>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="empty-state">
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 64 64"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="32" cy="20" r="8" />
                        <path d="M16 56c0-8.837 7.163-16 16-16s16 7.163 16 16" />
                    </svg>
                    <h3>No employees found</h3>
                    <p>
                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Get started by adding your first employee'}
                    </p>
                    <PermissionGuard permission="can_create_employees">
                        <button className="btn btn-primary" onClick={handleCreateEmployee}>
                            Add Employee
                        </button>
                    </PermissionGuard>
                </div>
            ) : (
                <div className="employees-table-container">
                    <table className="employees-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Created Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map(employee => (
                                <tr key={employee.employee_id}>
                                    <td>
                                        <div className="employee-name">
                                            <div className="employee-avatar">
                                                {employee.first_name.charAt(0)}
                                                {employee.last_name.charAt(0)}
                                            </div>
                                            <div className="employee-info">
                                                <div className="name">
                                                    {employee.first_name} {employee.last_name}
                                                </div>
                                                {employee.created_by_username && (
                                                    <div className="created-by">
                                                        Added by {employee.created_by_username}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{employee.username}</td>
                                    <td>{employee.email}</td>
                                    <td>
                                        <span className={getRoleBadgeClass(employee.employee_role)}>
                                            {employee.employee_role}
                                        </span>
                                    </td>
                                    <td>{employee.department || '-'}</td>
                                    <td>
                                        <span className={getStatusBadgeClass(employee.status)}>
                                            {employee.status}
                                        </span>
                                    </td>
                                    <td>{formatDate(employee.created_at)}</td>
                                    <td>
                                        <div className="actions-cell">
                                            {/* View button - for viewers */}
                                            {isViewerOnly() && (
                                                <button
                                                    className="action-btn action-view"
                                                    onClick={() => handleViewEmployee(employee)}
                                                    title="View Details"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                        <path d="M8 3C4.5 3 1.5 5.5 1 8c.5 2.5 3.5 5 7 5s6.5-2.5 7-5c-.5-2.5-3.5-5-7-5zm0 8c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm0-5c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z" />
                                                    </svg>
                                                </button>
                                            )}

                                            {/* Edit button - for managers and admins */}
                                            <PermissionGuard permission="can_edit_employees">
                                                <button
                                                    className="action-btn action-edit"
                                                    onClick={() => handleEditEmployee(employee)}
                                                    title="Edit Employee"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                        <path d="M12.854 2.146a.5.5 0 0 1 0 .708l-9 9a.5.5 0 0 1-.708-.708l9-9a.5.5 0 0 1 .708 0zM13 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z" />
                                                    </svg>
                                                </button>
                                            </PermissionGuard>

                                            {/* Status toggle - for managers and admins */}
                                            <PermissionGuard permission="can_deactivate_employees">
                                                <button
                                                    className={`action-btn ${employee.status === 'active' ? 'action-deactivate' : 'action-activate'
                                                        }`}
                                                    onClick={() => handleStatusToggle(employee)}
                                                    title={employee.status === 'active' ? 'Deactivate' : 'Activate'}
                                                >
                                                    {employee.status === 'active' ? (
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </PermissionGuard>

                                            {/* Delete button - only for admins */}
                                            <PermissionGuard permission="can_delete_employees">
                                                <button
                                                    className="action-btn action-delete"
                                                    onClick={() => handleDeleteEmployee(employee)}
                                                    title="Delete Employee"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                                    </svg>
                                                </button>
                                            </PermissionGuard>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            <CreateEmployeeModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchEmployees}
            />

            <EditEmployeeModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                }}
                employee={selectedEmployee}
                onSuccess={fetchEmployees}
                isViewOnly={isViewerOnly()}
            />

            {selectedEmployee && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedEmployee(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete Employee"
                    message={
                        <>
                            Are you sure you want to delete{' '}
                            <strong>
                                {selectedEmployee.first_name} {selectedEmployee.last_name}
                            </strong>
                            ? This action cannot be undone and will permanently remove the employee and their
                            account.
                        </>
                    }
                />
            )}
        </div>
    );
}

export default Employees;