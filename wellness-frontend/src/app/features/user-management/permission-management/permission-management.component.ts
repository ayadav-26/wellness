import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { finalize } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

interface ModuleConfig {
  rolePermissionId?: number;
  moduleName: string;
  isVisible: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

@Component({
  selector: 'app-permission-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatSelectModule, MatCheckboxModule, 
    MatButtonModule, MatProgressSpinnerModule, MatIconModule
  ],
  template: `
    <div class="permission-container">
      <div class="toolbar">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="role-select">
          <mat-label>Select Role</mat-label>
          <mat-select [(ngModel)]="selectedRole" (selectionChange)="onRoleChange()">
            <mat-option value="Admin">Admin</mat-option>
            <mat-option value="Receptionist">Receptionist</mat-option>
            <mat-option value="User">User</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" [disabled]="!selectedRole || isSaving()" (click)="savePermissions()">
          @if (isSaving()) { <mat-spinner diameter="20"></mat-spinner> }
          @else { <mat-icon>save</mat-icon> Save Changes }
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (selectedRole) {
        <div class="matrix-table">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Visible in Menu</th>
                <th>Create</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              @for (mod of currentPermissions(); track mod.moduleName) {
                <tr>
                  <td class="module-name">{{ mod.moduleName }}</td>
                  <td><mat-checkbox [(ngModel)]="mod.isVisible"></mat-checkbox></td>
                  <td><mat-checkbox [(ngModel)]="mod.canCreate"></mat-checkbox></td>
                  <td><mat-checkbox [(ngModel)]="mod.canEdit"></mat-checkbox></td>
                  <td><mat-checkbox [(ngModel)]="mod.canDelete"></mat-checkbox></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon>lock_person</mat-icon>
          <p>Please select a role to configure its permissions.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .permission-container { margin-top: 24px; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; min-height: 56px; }
    .role-select { width: 250px; }
    
    .matrix-table {
      background: white; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 12px 16px; border-bottom: 1px solid #eee; }
    th { background: #fafafa; font-weight: 600; color: #444; font-size: 0.85rem; text-transform: uppercase; }
    td.module-name { font-weight: 500; color: #222; }
    tr:last-child td { border-bottom: none; }
    tr:hover { background-color: #fcfcfc; }
    
    .empty-state { text-align: center; padding: 48px; color: #888; background: #fafafa; border-radius: 8px; border: 1px dashed #ccc;}
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #bbb; margin-bottom: 16px; }
    .loading-state { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class PermissionManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private notify = inject(NotificationService);
  private base = `${environment.apiBaseUrl}/permissions`;

  rolesData: Record<string, ModuleConfig[]> = {};
  
  selectedRole = '';
  currentPermissions = signal<ModuleConfig[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  ngOnInit() {
    this.fetchPermissions();
  }

  fetchPermissions() {
    this.isLoading.set(true);
    this.http.get<any>(`${this.base}/roles`).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.rolesData = res.data;
          this.onRoleChange();
        }
      },
      error: () => this.notify.error('Failed to load permissions configuration.')
    });
  }

  onRoleChange() {
    if (this.selectedRole && this.rolesData[this.selectedRole]) {
      // Create a deep copy to avoid modifying the original until saved
      this.currentPermissions.set(JSON.parse(JSON.stringify(this.rolesData[this.selectedRole])));
    } else {
      this.currentPermissions.set([]);
    }
  }

  savePermissions() {
    if (!this.selectedRole || this.currentPermissions().length === 0) return;

    this.isSaving.set(true);
    this.http.put<any>(`${this.base}/roles/${this.selectedRole}`, {
      permissions: this.currentPermissions()
    }).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success(`Permissions for ${this.selectedRole} saved successfully.`);
          // Update local cache
          this.rolesData[this.selectedRole] = JSON.parse(JSON.stringify(this.currentPermissions()));
        }
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to save permissions.')
    });
  }
}
