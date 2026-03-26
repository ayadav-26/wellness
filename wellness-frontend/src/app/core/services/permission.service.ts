import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PermissionsResponse, ModulePermission } from '../models/permission.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/auth`;

  /** Full structured module permissions */
  modulePermissions = signal<ModulePermission[]>(this.getStoredModules());
  /** Whether the current user is the immutable Super Admin (userId=1) */
  isSuperAdmin = signal<boolean>(this.getStoredIsSuperAdmin());

  /**
   * Check if a module is visible in the UI (Sidebar etc).
   */
  isModuleVisible(moduleName: string): boolean {
    if (this.isSuperAdmin()) return true;
    const perm = this.modulePermissions().find(m => m.module === moduleName);
    return perm ? perm.isVisible : false;
  }

  /**
   * Check specific modular action rights.
   */
  canAction(moduleName: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
    if (this.isSuperAdmin()) return true;
    const perm = this.modulePermissions().find(m => m.module === moduleName);
    if (!perm) return false;
    switch (action) {
      case 'view': return perm.isVisible;
      case 'create': return perm.canCreate;
      case 'edit': return perm.canEdit;
      case 'delete': return perm.canDelete;
      default: return false;
    }
  }

  loadPermissions(): Observable<any> {
    return this.http.get<any>(`${this.base}/me/permissions`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setPermissions(res.data.permissions, res.data.isSuperAdmin);
        }
      })
    );
  }

  setPermissions(modules: ModulePermission[], isSuperAdmin: boolean = false) {
    sessionStorage.setItem('wellness_module_permissions', JSON.stringify(modules));
    sessionStorage.setItem('wellness_is_super_admin', JSON.stringify(isSuperAdmin));
    this.modulePermissions.set(modules);
    this.isSuperAdmin.set(isSuperAdmin);
  }

  clearPermissions() {
    sessionStorage.removeItem('wellness_module_permissions');
    sessionStorage.removeItem('wellness_is_super_admin');
    this.modulePermissions.set([]);
    this.isSuperAdmin.set(false);
  }

  private getStoredModules(): ModulePermission[] {
    const stored = sessionStorage.getItem('wellness_module_permissions');
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredIsSuperAdmin(): boolean {
    const stored = sessionStorage.getItem('wellness_is_super_admin');
    return stored ? JSON.parse(stored) : false;
  }
}
