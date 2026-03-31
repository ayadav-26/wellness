import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { PermissionService } from '../../core/services/permission.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { CentersService } from '../../core/services/centers.service';
import { UserFormComponent } from './user-form/user-form.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PermissionManagementComponent } from './permission-management/permission-management.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, 
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    MatSelectModule, MatDialogModule, MatTooltipModule, DataTableComponent,
    MatTabsModule, PermissionManagementComponent
  ],
  template: `
    <div class="max-w-6xl mx-auto pt-6 px-4">
      <div class="page-header">
        <div>
          <h1 class="font-display text-3xl">User Management</h1>
          <p class="text-muted">Manage system administrators and receptionists.</p>
        </div>
        <button mat-raised-button color="primary" (click)="openUserForm()">
          <mat-icon>person_add</mat-icon> Add User
        </button>
      </div>

      <mat-tab-group animationDuration="0ms">
        <!-- Tab 1: Users -->
        <mat-tab label="System Users">
          <div class="filters-bar mb-4 mt-4">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Filter by Center</mat-label>
              <mat-select [formControl]="centerFilter">
                <mat-option [value]="null">All Centers</mat-option>
                @for (c of centers(); track c.centerId) {
                  <mat-option [value]="c.centerId">{{ c.name }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>storefront</mat-icon>
            </mat-form-field>
          </div>

          <div class="list-section">
            <app-data-table
              [columns]="columns"
              [dataSource]="dataSource"
              [loading]="loadingList()"
              [totalCount]="totalCount()"
              emptyMessage="No users found.">
            </app-data-table>
          </div>
        </mat-tab>

        <!-- Tab 2: Permissions (Super Admin Only) -->
        @if (perm.isSuperAdmin()) {
          <mat-tab label="Role Permissions">
            <app-permission-management></app-permission-management>
          </mat-tab>
        }
      </mat-tab-group>
    </div>

    <!-- Templates for Table -->
    <ng-template #roleTpl let-role>
      <span class="role-badge" [ngClass]="role.toLowerCase()">{{ role }}</span>
    </ng-template>

    <ng-template #centerTpl let-row="row">
      {{ row.center?.name || '---' }}
    </ng-template>

    <ng-template #actionsTpl let-row="row">
      <div class="flex gap-1">
        <button mat-icon-button color="accent" matTooltip="Edit User" (click)="openUserForm(row)">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button color="warn" matTooltip="Deactivate User" (click)="deleteUser(row)" [disabled]="row.userId === 1">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; color: #1E3A38; font-weight: 700; }
    .text-muted { color: #666; margin-top: 2px; }
    
    .filter-field { width: 300px; }
    
    .role-badge { 
      padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    }
    .role-badge.admin { background: #e3f2fd; color: #1976d2; }
    .role-badge.receptionist { background: #f3e5f5; color: #7b1fa2; }
    .role-badge.super_admin { background: #fff3e0; color: #ef6c00; }
    
    .list-section { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
  `]
})
export class UserManagementComponent implements OnInit {
  @ViewChild('roleTpl', { static: true }) roleTpl!: TemplateRef<any>;
  @ViewChild('centerTpl', { static: true }) centerTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;

  perm = inject(PermissionService);
  private userService = inject(UserService);
  private centersService = inject(CentersService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  loadingList = signal(true);
  centers = signal<any[]>([]);
  
  dataSource = new MatTableDataSource<any>([]);
  totalCount = signal(0);
  columns: TableColumn[] = [];

  centerFilter = new FormControl<number | null>(null);

  ngOnInit() {
    this.columns = [
      { key: 'firstName', label: 'Name', 
        formatter: (row: any) => `${row.firstName} ${row.lastName || ''}` },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role', template: this.roleTpl },
      { key: 'center', label: 'Center', template: this.centerTpl },
      { key: 'actions', label: 'Actions', template: this.actionsTpl }
    ];

    this.loadData();
    this.loadCenters();

    this.centerFilter.valueChanges.subscribe(() => {
      this.loadData();
    });
  }

  loadData() {
    this.loadingList.set(true);
    const params: any = {};
    if (this.centerFilter.value) {
      params.centerId = this.centerFilter.value;
    }

    this.userService.getAll(params).subscribe({
      next: (res) => {
        this.dataSource.data = res.data || [];
        this.totalCount.set(this.dataSource.data.length);
        this.loadingList.set(false);
      },
      error: () => this.loadingList.set(false)
    });
  }

  loadCenters() {
    this.centersService.getAll({ limit: 100 }).subscribe(res => {
      this.centers.set(res.data?.data || []);
    });
  }

  openUserForm(user?: any) {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '550px',
      data: user,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  deleteUser(row: any) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { 
        title: 'Deactivate User', 
        message: `Are you sure you want to deactivate ${row.firstName}?`, 
        confirmLabel: 'Deactivate', 
        confirmColor: 'warn' 
      }
    });

    ref.afterClosed().subscribe(res => {
      if (res) {
        this.userService.delete(row.userId).subscribe(() => {
          this.notify.success('User deactivated successfully');
          this.loadData();
        });
      }
    });
  }
}
