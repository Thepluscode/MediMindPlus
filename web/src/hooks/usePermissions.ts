import { useState, useEffect } from 'react';
import type { UserRole, Permission } from '../types/auth';

// Define permissions for each role
const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'health_data.read',
    'health_data.update',
    'health_data.delete',
    'analytics.view',
    'analytics.export',
    'settings.manage',
    'billing.manage',
    'audit_logs.view',
    'team.manage',
  ],
  manager: [
    'users.read',
    'users.update',
    'health_data.read',
    'health_data.update',
    'analytics.view',
    'analytics.export',
    'settings.view',
    'audit_logs.view',
    'team.view',
  ],
  operator: [
    'users.read',
    'health_data.read',
    'analytics.view',
    'settings.view',
  ],
};

export const usePermissions = (userRole: UserRole) => {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    setPermissions(rolePermissions[userRole] || []);
  }, [userRole]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some((perm) => permissions.includes(perm));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every((perm) => permissions.includes(perm));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
