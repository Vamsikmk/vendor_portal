// src/hooks/useEmployeePermissions.js
/**
 * Custom hook to manage and check employee permissions
 * This hook reads permissions from localStorage and provides helper functions
 * to check if the current user has specific permissions
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const useEmployeePermissions = () => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load permissions from localStorage
        const loadPermissions = () => {
            try {
                if (user && user.role === 'employee') {
                    const storedPermissions = localStorage.getItem('employee_permissions');
                    if (storedPermissions) {
                        const parsedPermissions = JSON.parse(storedPermissions);
                        setPermissions(parsedPermissions);
                    }
                } else if (user && user.role === 'vendor') {
                    // Vendor admins have all permissions
                    setPermissions({
                        user_id: user.user_id,
                        vendor_id: user.vendor_id || 'unknown',
                        user_type: 'vendor_admin',
                        can_create_employees: true,
                        can_edit_employees: true,
                        can_delete_employees: true,
                        can_deactivate_employees: true
                    });
                } else {
                    setPermissions(null);
                }
            } catch (error) {
                console.error('Error loading permissions:', error);
                setPermissions(null);
            } finally {
                setLoading(false);
            }
        };

        loadPermissions();
    }, [user]);

    // Helper functions
    const hasPermission = (permissionName) => {
        if (!permissions) return false;
        return permissions[permissionName] === true;
    };

    const isVendorAdmin = () => {
        return user?.role === 'vendor';
    };

    const isEmployee = () => {
        return user?.role === 'employee';
    };

    const getEmployeeRole = () => {
        if (isVendorAdmin()) return 'admin';
        if (!permissions) return null;
        return permissions.employee_role || permissions.user_type;
    };

    const canManageEmployees = () => {
        return hasPermission('can_create_employees') ||
            hasPermission('can_edit_employees') ||
            hasPermission('can_deactivate_employees');
    };

    const canEditContent = () => {
        // Editors and above can edit products/customers
        const role = getEmployeeRole();
        return isVendorAdmin() || role === 'editor' || role === 'manager';
    };

    const isViewerOnly = () => {
        const role = getEmployeeRole();
        return role === 'viewer';
    };

    const canAccessAnalytics = () => {
        // All roles can view analytics
        return user?.role === 'vendor' || user?.role === 'employee';
    };

    return {
        permissions,
        loading,
        hasPermission,
        isVendorAdmin,
        isEmployee,
        getEmployeeRole,
        canManageEmployees,
        canEditContent,
        isViewerOnly,
        canAccessAnalytics,
        // Direct permission checks
        canCreateEmployees: hasPermission('can_create_employees'),
        canEditEmployees: hasPermission('can_edit_employees'),
        canDeleteEmployees: hasPermission('can_delete_employees'),
        canDeactivateEmployees: hasPermission('can_deactivate_employees')
    };
};

export default useEmployeePermissions;