// User roles and permissions types
export type UserRole = 'admin' | 'manager' | 'operator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'health_data' | 'analytics' | 'settings' | 'billing';
}

export interface RolePermissions {
  role: UserRole;
  permissions: string[];
  description: string;
}

export interface TeamMember {
  id: string;
  user: User;
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface InviteRequest {
  email: string;
  role: UserRole;
  department?: string;
  message?: string;
}
