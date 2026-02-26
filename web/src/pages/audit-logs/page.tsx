import React, { useState, useEffect } from 'react';
import type { AuditLog, UserRole } from '../../types/auth';
import logger from '../../utils/logger';
import { auditService } from '../../services/api';

// Mock audit logs
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Admin User',
    userRole: 'admin',
    action: 'User Created',
    resource: 'User',
    resourceId: 'user_123',
    details: 'Created new user account for sarah.johnson@healthai.com with Manager role',
    ipAddress: '192.168.1.100',
    timestamp: '2024-03-20T10:30:00Z',
    status: 'success',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Sarah Johnson',
    userRole: 'manager',
    action: 'Health Data Accessed',
    resource: 'Patient Record',
    resourceId: 'patient_456',
    details: 'Viewed health analytics dashboard for patient ID: patient_456',
    ipAddress: '192.168.1.101',
    timestamp: '2024-03-20T10:15:00Z',
    status: 'success',
  },
  {
    id: '3',
    userId: '1',
    userName: 'Admin User',
    userRole: 'admin',
    action: 'Settings Updated',
    resource: 'System Settings',
    resourceId: 'settings_001',
    details: 'Updated security settings: enabled two-factor authentication requirement',
    ipAddress: '192.168.1.100',
    timestamp: '2024-03-20T09:45:00Z',
    status: 'success',
  },
  {
    id: '4',
    userId: '3',
    userName: 'Michael Chen',
    userRole: 'operator',
    action: 'Data Export Failed',
    resource: 'Analytics Report',
    resourceId: 'report_789',
    details: 'Attempted to export analytics report but lacked sufficient permissions',
    ipAddress: '192.168.1.102',
    timestamp: '2024-03-20T09:30:00Z',
    status: 'failed',
  },
  {
    id: '5',
    userId: '2',
    userName: 'Sarah Johnson',
    userRole: 'manager',
    action: 'User Role Updated',
    resource: 'User',
    resourceId: 'user_789',
    details: 'Changed user role from Operator to Manager for david.kim@healthai.com',
    ipAddress: '192.168.1.101',
    timestamp: '2024-03-20T09:00:00Z',
    status: 'success',
  },
  {
    id: '6',
    userId: '1',
    userName: 'Admin User',
    userRole: 'admin',
    action: 'User Deleted',
    resource: 'User',
    resourceId: 'user_999',
    details: 'Permanently deleted user account for inactive.user@healthai.com',
    ipAddress: '192.168.1.100',
    timestamp: '2024-03-20T08:30:00Z',
    status: 'success',
  },
  {
    id: '7',
    userId: '4',
    userName: 'Emily Rodriguez',
    userRole: 'manager',
    action: 'Billing Updated',
    resource: 'Subscription',
    resourceId: 'sub_001',
    details: 'Updated payment method for enterprise subscription',
    ipAddress: '192.168.1.103',
    timestamp: '2024-03-19T16:45:00Z',
    status: 'success',
  },
  {
    id: '8',
    userId: '3',
    userName: 'Michael Chen',
    userRole: 'operator',
    action: 'Login Failed',
    resource: 'Authentication',
    details: 'Failed login attempt - incorrect password',
    ipAddress: '192.168.1.102',
    timestamp: '2024-03-19T15:20:00Z',
    status: 'failed',
  },
];

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    auditService.getLogs({ limit: 100 })
      .then((res) => {
        const data = res.data?.logs || res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0) setLogs(data);
      })
      .catch(() => {/* fall back to mock data */})
      .finally(() => setLoading(false));
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes('Created')) return 'ri-add-circle-line';
    if (action.includes('Updated')) return 'ri-edit-line';
    if (action.includes('Deleted')) return 'ri-delete-bin-line';
    if (action.includes('Accessed')) return 'ri-eye-line';
    if (action.includes('Export')) return 'ri-download-line';
    if (action.includes('Login')) return 'ri-login-box-line';
    return 'ri-information-line';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <i className="ri-checkbox-circle-fill"></i>
          Success
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <i className="ri-close-circle-fill"></i>
        Failed
      </span>
    );
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'manager':
        return 'bg-teal-100 text-teal-700';
      case 'operator':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
    return matchesSearch && matchesStatus && matchesAction;
  });

  const exportLogs = async () => {
    logger.info('Exporting audit logs', { service: 'audit-logs', totalLogs: logs.length });
    try {
      const res = await auditService.exportLogs();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fall back to exporting current view as JSON
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track all critical actions and system events
              </p>
            </div>
            <button
              onClick={exportLogs}
              className="px-6 py-3 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-download-line text-lg"></i>
              Export Logs
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <i className="ri-file-list-3-line text-2xl text-teal-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter((l) => l.status === 'success').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter((l) => l.status === 'failed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-close-circle-line text-2xl text-red-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    logs.filter(
                      (l) =>
                        new Date(l.timestamp).toDateString() === new Date().toDateString()
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-line text-2xl text-blue-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'success' | 'failed')}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Actions</option>
                <option value="Created">Created</option>
                <option value="Updated">Updated</option>
                <option value="Deleted">Deleted</option>
                <option value="Accessed">Accessed</option>
                <option value="Login">Login</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <i className="ri-loader-4-line animate-spin text-2xl mr-2"></i> Loading audit logs...
            </div>
          )}
          {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getRoleBadgeColor(
                          log.userRole
                        )}`}
                      >
                        {log.userRole.charAt(0).toUpperCase() + log.userRole.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                          <i className={`${getActionIcon(log.action)} text-teal-600`}></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.action}</div>
                          <div className="text-xs text-gray-500">{log.resource}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-md">{log.details}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-mono">{log.ipAddress}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
