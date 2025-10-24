// src/components/common/PermissionGuard.js
/**
 * PermissionGuard Component
 * 
 * A wrapper component that conditionally renders children based on user permissions.
 * Useful for hiding/showing UI elements based on employee roles.
 * 
 * Usage Examples:
 * 
 * 1. Show only to admins:
 *    <PermissionGuard requireAdmin>
 *      <button>Delete Employee</button>
 *    </PermissionGuard>
 * 
 * 2. Show only to editors and above:
 *    <PermissionGuard requireEdit>
 *      <button>Edit Product</button>
 *    </PermissionGuard>
 * 
 * 3. Hide from viewers:
 *    <PermissionGuard hideFromViewers>
 *      <button>Create Product</button>
 *    </PermissionGuard>
 * 
 * 4. Check specific permission:
 *    <PermissionGuard permission="can_create_employees">
 *      <button>Add Employee</button>
 *    </PermissionGuard>
 * 
 * 5. Custom fallback:
 *    <PermissionGuard requireAdmin fallback={<div>Access Denied</div>}>
 *      <AdminPanel />
 *    </PermissionGuard>
 */

import React from 'react';
import useEmployeePermissions from '../../hooks/useEmployeePermissions';

const PermissionGuard = ({
    children,
    requireAdmin = false,
    requireEdit = false,
    requireManageEmployees = false,
    hideFromViewers = false,
    permission = null,
    fallback = null,
    showLoading = false
}) => {
    const {
        loading,
        isVendorAdmin,
        canEditContent,
        canManageEmployees,
        isViewerOnly,
        hasPermission
    } = useEmployeePermissions();

    // Show loading state if requested
    if (loading && showLoading) {
        return <div style={{ opacity: 0.5 }}>{children}</div>;
    }

    // If loading and not showing loading state, show nothing
    if (loading) {
        return null;
    }

    // Check permissions based on props
    let hasAccess = true;

    if (requireAdmin) {
        hasAccess = isVendorAdmin();
    } else if (requireEdit) {
        hasAccess = canEditContent();
    } else if (requireManageEmployees) {
        hasAccess = canManageEmployees();
    } else if (hideFromViewers) {
        hasAccess = !isViewerOnly();
    } else if (permission) {
        hasAccess = hasPermission(permission);
    }

    // Return children if user has access, otherwise return fallback
    return hasAccess ? children : (fallback || null);
};

export default PermissionGuard;