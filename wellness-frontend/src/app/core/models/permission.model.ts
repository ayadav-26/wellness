import { UserRole } from './user.model';

export interface ModulePermission {
  module: string;
  isVisible: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PermissionsResponse {
  user: {
    userId: number;
    firstName: string;
    lastName?: string;
    email: string;
    role: UserRole;
  };
  permissions: ModulePermission[];
  isSuperAdmin: boolean;
}

// Deprecated legacy interfaces removed to clean up build
