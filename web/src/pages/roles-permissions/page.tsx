import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { UserRole, Permission, RolePermissions } from '../../types/auth';

const RolesPermissionsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Track unsaved changes per role
  const [pendingChanges, setPendingChanges] = useState<Record<string, string[]>>({});

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/roles');
      const data = res.data;
      setRolePermissions(data.roles);
      setAllPermissions(data.allPermissions);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const currentPermissions = (): string[] => {
    if (pendingChanges[selectedRole] !== undefined) return pendingChanges[selectedRole];
    return rolePermissions.find(r => r.role === selectedRole)?.permissions ?? [];
  };

  const hasPermission = (permissionId: string) => currentPermissions().includes(permissionId);

  const togglePermission = (permissionId: string) => {
    const current = currentPermissions();
    const updated = current.includes(permissionId)
      ? current.filter(p => p !== permissionId)
      : [...current, permissionId];
    setPendingChanges(prev => ({ ...prev, [selectedRole]: updated }));
  };

  const hasPendingChanges = pendingChanges[selectedRole] !== undefined;

  const saveChanges = async () => {
    if (!hasPendingChanges) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      await api.put(`/api/roles/${selectedRole}/permissions`, {
        permissions: pendingChanges[selectedRole],
      });
      // Commit pending changes into rolePermissions state
      setRolePermissions(prev =>
        prev.map(r =>
          r.role === selectedRole ? { ...r, permissions: pendingChanges[selectedRole] } : r
        )
      );
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[selectedRole];
        return next;
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setPendingChanges(prev => {
      const next = { ...prev };
      delete next[selectedRole];
      return next;
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'manager': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'operator': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'users': return 'ri-user-line';
      case 'health_data': return 'ri-heart-pulse-line';
      case 'analytics': return 'ri-bar-chart-line';
      case 'settings': return 'ri-settings-line';
      case 'billing': return 'ri-bank-card-line';
      default: return 'ri-shield-line';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'users': return 'bg-blue-100 text-blue-700';
      case 'health_data': return 'bg-red-100 text-red-700';
      case 'analytics': return 'bg-teal-100 text-teal-700';
      case 'settings': return 'bg-purple-100 text-purple-700';
      case 'billing': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const groupedPermissions = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) acc[permission.category] = [];
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roles & permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-600 mt-1">Manage role-based access control and permissions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <i className="ri-error-warning-line text-red-500 text-xl"></i>
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
        )}

        {/* Success banner */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <i className="ri-checkbox-circle-line text-green-500 text-xl"></i>
            <span className="text-green-700 text-sm">Permissions saved successfully.</span>
          </div>
        )}

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
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(roleData.role)}`}>
                        {roleData.role.charAt(0).toUpperCase() + roleData.role.slice(1)}
                      </span>
                      <div className="flex items-center gap-2">
                        {pendingChanges[roleData.role] !== undefined && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes"></span>
                        )}
                        <span className="text-xs text-gray-500">
                          {(pendingChanges[roleData.role] ?? roleData.permissions).length} permissions
                        </span>
                      </div>
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
                  <span className="text-lg font-bold text-gray-900">{rolePermissions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Permissions</span>
                  <span className="text-lg font-bold text-gray-900">{allPermissions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Categories</span>
                  <span className="text-lg font-bold text-gray-900">{Object.keys(groupedPermissions).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Admin Permissions</span>
                  <span className="text-lg font-bold text-gray-900">
                    {(pendingChanges['admin'] ?? rolePermissions.find(r => r.role === 'admin')?.permissions ?? []).length} of {allPermissions.length} permissions enabled
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
                    {currentPermissions().length} of {allPermissions.length} permissions enabled
                    {hasPendingChanges && <span className="ml-2 text-amber-600 font-medium">(unsaved changes)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getRoleBadgeColor(selectedRole)}`}>
                    {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                  </span>
                  {hasPendingChanges && (
                    <>
                      <button
                        onClick={discardChanges}
                        className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="ri-save-line"></i>
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions by Category */}
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(category)}`}>
                        <i className={`${getCategoryIcon(category)} text-lg`}></i>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        {category.replace('_', ' ')}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => {
                        const enabled = hasPermission(permission.id);
                        return (
                          <button
                            key={permission.id}
                            onClick={() => togglePermission(permission.id)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-sm ${
                              enabled
                                ? 'border-teal-200 bg-teal-50 hover:border-teal-300'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                                <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                              </div>
                              <div className="ml-3 mt-0.5">
                                {enabled ? (
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
                          </button>
                        );
                      })}
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
