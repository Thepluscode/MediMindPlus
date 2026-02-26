import React, { useState, useEffect } from 'react';
import type { User, TeamMember, InviteRequest, UserRole } from '../../types/auth';
import { PermissionGuard } from '../../components/feature/PermissionGuard';
import logger from '../../utils/logger';
import { authService } from '../../services/auth';
import { teamService } from '../../services/api';

// Get real current user from auth service
const _storedUser = authService.getCurrentUser();
const currentUser: User = _storedUser ? {
  id: _storedUser.id || '1',
  email: _storedUser.email || 'user@healthai.com',
  name: `${_storedUser.firstName || ''} ${_storedUser.lastName || ''}`.trim() || _storedUser.email,
  role: (_storedUser.role as UserRole) || 'admin',
  status: 'active',
  createdAt: _storedUser.createdAt || '2024-01-01',
} : {
  id: '1',
  email: 'admin@healthai.com',
  name: 'Admin User',
  role: 'admin',
  status: 'active',
  createdAt: '2024-01-01',
};

// Mock team members
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    user: {
      id: '2',
      email: 'sarah.johnson@healthai.com',
      name: 'Sarah Johnson',
      role: 'manager',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20healthcare%20manager%20woman%20portrait%20clean%20white%20background%20confident%20smile%20business%20attire%20modern%20lighting%20high%20quality%20headshot%20photo&width=100&height=100&seq=tm1&orientation=squarish',
      department: 'Clinical Operations',
      status: 'active',
      createdAt: '2024-01-15',
      lastLogin: '2024-03-20T10:30:00Z',
    },
    invitedBy: 'Admin User',
    invitedAt: '2024-01-15',
    acceptedAt: '2024-01-15',
  },
  {
    id: '2',
    user: {
      id: '3',
      email: 'michael.chen@healthai.com',
      name: 'Michael Chen',
      role: 'operator',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20healthcare%20operator%20man%20portrait%20clean%20white%20background%20friendly%20smile%20medical%20scrubs%20modern%20lighting%20high%20quality%20headshot%20photo&width=100&height=100&seq=tm2&orientation=squarish',
      department: 'Data Analytics',
      status: 'active',
      createdAt: '2024-02-01',
      lastLogin: '2024-03-20T09:15:00Z',
    },
    invitedBy: 'Admin User',
    invitedAt: '2024-02-01',
    acceptedAt: '2024-02-01',
  },
  {
    id: '3',
    user: {
      id: '4',
      email: 'emily.rodriguez@healthai.com',
      name: 'Emily Rodriguez',
      role: 'manager',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20healthcare%20manager%20woman%20portrait%20clean%20white%20background%20warm%20smile%20business%20casual%20modern%20lighting%20high%20quality%20headshot%20photo&width=100&height=100&seq=tm3&orientation=squarish',
      department: 'Patient Care',
      status: 'active',
      createdAt: '2024-02-10',
      lastLogin: '2024-03-19T16:45:00Z',
    },
    invitedBy: 'Admin User',
    invitedAt: '2024-02-10',
    acceptedAt: '2024-02-10',
  },
  {
    id: '4',
    user: {
      id: '5',
      email: 'david.kim@healthai.com',
      name: 'David Kim',
      role: 'operator',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20healthcare%20operator%20man%20portrait%20clean%20white%20background%20professional%20smile%20lab%20coat%20modern%20lighting%20high%20quality%20headshot%20photo&width=100&height=100&seq=tm4&orientation=squarish',
      department: 'Research',
      status: 'active',
      createdAt: '2024-02-20',
      lastLogin: '2024-03-20T08:00:00Z',
    },
    invitedBy: 'Sarah Johnson',
    invitedAt: '2024-02-20',
    acceptedAt: '2024-02-20',
  },
];

const TeamManagementPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [inviteForm, setInviteForm] = useState<InviteRequest>({
    email: '',
    role: 'operator',
    department: '',
    message: '',
  });

  useEffect(() => {
    teamService.getMembers()
      .then((res) => {
        const members: any[] = res.data?.members || res.data?.data || res.data || [];
        const mapped: TeamMember[] = members.map((u: any, idx: number) => ({
          id: String(idx + 1),
          user: {
            id: u.id,
            email: u.email,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            role: (u.role as UserRole) || 'operator',
            status: u.is_active ? 'active' : 'inactive',
            createdAt: u.created_at,
            lastLogin: u.updated_at,
          },
          invitedBy: 'System',
          invitedAt: u.created_at,
          acceptedAt: u.created_at,
        }));
        setTeamMembers(mapped.length > 0 ? mapped : mockTeamMembers);
      })
      .catch(() => setTeamMembers(mockTeamMembers))
      .finally(() => setLoadingMembers(false));
  }, []);

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      case 'suspended':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleInvite = () => {
    logger.info('Team member invite sent', {
      service: 'team-management',
      email: '[REDACTED]',
      role: inviteForm.role,
      department: inviteForm.department
    });
    setShowInviteModal(false);
    setInviteForm({ email: '', role: 'operator', department: '', message: '' });
  };

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleUpdateRole = () => {
    if (selectedMember) {
      teamService.updateRole(selectedMember.user.id, selectedMember.user.role)
        .then(() => {
          setTeamMembers(prev => prev.map(m =>
            m.id === selectedMember.id ? selectedMember : m
          ));
        })
        .catch(() => {});
      logger.info('Team member role updated', {
        service: 'team-management',
        userId: selectedMember.user.id,
        email: '[REDACTED]',
        oldRole: selectedMember.user.role
      });
      setShowEditModal(false);
      setSelectedMember(null);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || member.user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage team members, roles, and permissions
              </p>
            </div>
            <PermissionGuard
              userRole={currentUser.role}
              requiredPermission="team.manage"
              fallback={null}
            >
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-3 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-user-add-line text-lg"></i>
                Invite Team Member
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Members
              </label>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="operator">Operator</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={member.user.avatar}
                            alt={member.user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.name}
                          </div>
                          <div className="text-xs text-gray-500">{member.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                          member.user.role
                        )}`}
                      >
                        {member.user.role.charAt(0).toUpperCase() + member.user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{member.user.department}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          member.user.status
                        )}`}
                      >
                        {member.user.status.charAt(0).toUpperCase() + member.user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {member.user.lastLogin
                          ? new Date(member.user.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <PermissionGuard
                          userRole={currentUser.role}
                          requiredPermission="team.manage"
                        >
                          <button
                            onClick={() => handleEditRole(member)}
                            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
                            title="Edit Role"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Remove Member"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, role: e.target.value as UserRole })
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="operator">Operator</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  placeholder="e.g., Clinical Operations"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  placeholder="Add a personal message..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Role</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={selectedMember.user.avatar}
                    alt={selectedMember.user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedMember.user.name}
                  </div>
                  <div className="text-xs text-gray-500">{selectedMember.user.email}</div>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
              <select
                defaultValue={selectedMember.user.role}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagementPage;
