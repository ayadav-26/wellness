import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[], moduleName?: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const permService = inject(PermissionService);
    const router = inject(Router);
    const user = authService.getCurrentUser();

    if (!user) return router.parseUrl('/login');

    const hasRole = allowedRoles.includes(user.role);
    const canAccessModule = moduleName ? permService.isModuleVisible(moduleName) : true;

    if (hasRole && canAccessModule) {
      return true;
    }

    return router.parseUrl('/profile');
  };
};
