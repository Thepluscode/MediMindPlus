import React, { useState } from 'react';
import type { UserRole, Permission, RolePermissions } from '../../types/auth';

// Mock permissions data
const allPermissions: Permission[] = [
  {
    id: 'users.create',
    name: 'Create Users',
    description: 'Create new user accounts',
    category: 'users',
  },
  {
    id: 'users.read',
    name: 'View Users',
    description: 'View user profiles and information',
    category: 'users',
  },
  {
    id: 'users.update',
    name: 'Update Users',
    description: 'Edit user profiles and settings',
    category: 'users',
  },
  {
    id: 'users.delete',
    name: 'Delete Users',
    description: 'Remove user accounts',
    category: 'users',
  },
  {
    id: 'health_data.read',
    name: 'View Health Data',
    description: 'Access patient health records',
    category: 'health_data',
  },
  {
    id: 'health_data.update',
    name: 'Update Health Data',
    description: 'Modify patient health records',
    category: 'health_data',
  },
  {
    id: 'health_data.delete',
    name: 'Delete Health Data',
    description: 'Remove health records',
    category: 'health_data',
  },
  {
    id: 'analytics.view',
    name: 'View Analytics',
    description: 'Access analytics dashboards',
    category: 'analytics',
  },
  {
    id: 'analytics.export',
    name: 'Export Analytics',
    description: 'Export analytics reports',
    category: 'analytics',
  },
  {
    id: 'settings.view',
    name: 'View Settings',
    description: 'View system settings',
    category: 'settings',
  },
  {
    id: 'settings.manage',
    name: 'Manage Settings',
    description: 'Modify system settings',
    category: 'settings',
  },
  {
    id: 'billing.manage',
    name: 'Manage Billing',
    description: 'Handle billing and subscriptions',
    category: 'billing',
  },
  {
    id: 'audit_logs.view',
    name: 'View Audit Logs',
    description: 'Access audit logs',
    category: 'settings',
  },
  {
    id: 'team.view',
    name: 'View Team',
    description: 'View team members',
    category: 'users',
  },
  {
    id: 'team.manage',
    name: 'Manage Team',
    description: 'Invite and manage team members',
    category: 'users',
  },
];

const rolePermissionsData: RolePermissions[] = [
  {
    role: 'admin',
    permissions: [
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
    description: 'Full system access with all permissions',
  },
  {
    role: 'manager',
    permissions: [
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
    description: 'Manage operations and view analytics',
  },
  {
    role: 'operator',
    permissions: ['users.read', 'health_data.read', 'analytics.view', 'settings.view'],
    description: 'Basic access to view data and analytics',
  },
];

const RolesPermissionsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>(rolePermissionsData);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'manager':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'operator':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'users':
        return 'ri-user-line';
      case 'health_data':
        return 'ri-heart-pulse-line';
      case 'analytics':
        return 'ri-bar-chart-line';
      case 'settings':
        return 'ri-settings-line';
      case 'billing':
        return 'ri-bank-card-line';
      default:
        return 'ri-shield-line';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'users':
        return 'bg-blue-100 text-blue-700';
      case 'health_data':
        return 'bg-red-100 text-red-700';
      case 'analytics':
        return 'bg-teal-100 text-teal-700';
      case 'settings':
        return 'bg-purple-100 text-purple-700';
      case 'billing':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const currentRoleData = rolePermissions.find((rp) => rp.role === selectedRole);
  const hasPermission = (permissionId: string) =>
    currentRoleData?.permissions.includes(permissionId);

  const groupedPermissions = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage role-based access control and permissions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">User Roles</h3>
              <div className="space-y-3">
                {rolePermissions.map((roleData) => (
                  <button
                    key={roleData.role}
                    onClick={() => setSelectedRole(roleData.role)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedRole === roleData.role
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(
                          roleData.role
                        )}`}
                      >
                        {roleData.role.charAt(0).toUpperCase() + roleData.role.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {roleData.permissions.length} permissions
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{roleData.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Role Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Role Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Roles</span>
                  <span className="text-lg font-bold text-gray-900">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Permissions</span>
                  <span className="text-lg font-bold text-gray-900">{allPermissions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Categories</span>
                  <span className="text-lg font-bold text-gray-900">
                    {Object.keys(groupedPermissions).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Permissions
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentRoleData?.permissions.length} of {allPermissions.length} permissions
                    enabled
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${getRoleBadgeColor(
                    selectedRole
                  )}`}
                >
                  {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </span>
              </div>

              {/* Permissions by Category */}
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(
                          category
                        )}`}
                      >
                        <i className={`${getCategoryIcon(category)} text-lg`}></i>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        {category.replace('_', ' ')}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            hasPermission(permission.id)
                              ? 'border-teal-200 bg-teal-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{permission.description}</p>
                            </div>
                            <div className="ml-3">
                              {hasPermission(permission.id) ? (
                                <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                                  <i className="ri-check-line text-white text-sm"></i>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                  <i className="ri-close-line text-white text-sm"></i>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissionsPage;
