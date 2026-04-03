import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TherapyFormComponent } from '../therapy-form/therapy-form.component';
import { SkillsManageComponent } from '../skills/skills.component';
import { TherapiesService } from '../../../core/services/therapies.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { DurationFormatPipe } from '../../../core/pipes/duration-format.pipe';
import { MatTableDataSource } from '@angular/material/table';
import { Therapy } from '../../../core/models/therapy.model';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-therapy-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, ReactiveFormsModule, MatTooltipModule, DataTableComponent, StatusBadgeComponent, HasPermissionDirective, DurationFormatPipe, CurrencyPipe, MatSlideToggleModule],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">Therapy Services</h1>
      <div class="header-actions">
        @if (!isReceptionist()) {
          <button mat-stroked-button color="primary" (click)="openSkills()" class="mr-2 bg-white">
            <mat-icon>psychology</mat-icon> Manage Skills
          </button>
        }
        <button *hasPermission="['Therapies', 'create']" mat-raised-button color="primary" (click)="openForm()" class="bg-white">
          <mat-icon>add</mat-icon> Add Therapy
        </button>
      </div>
    </div>

    <div class="filters-bar mb-4">
      <div class="search-group flex items-center gap-2">
        <mat-form-field appearance="outline" class="search-field flex-1 mb-0" subscriptSizing="dynamic">
          <mat-label>Search Therapy</mat-label>
          <input matInput [formControl]="searchControl" (keyup.enter)="onSearch()">
          @if (searchControl.value) {
            <button matSuffix mat-icon-button aria-label="Clear" (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
        <button mat-raised-button color="primary" class="rounded-btn search-btn" (click)="onSearch()" matTooltip="Search">
           <mat-icon>search</mat-icon> 
        </button>
      </div>

      @if (!isReceptionist()) {
        <div class="right-filters flex items-center gap-4 ml-auto">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width: 160px;">
            <mat-label>Status</mat-label>
            <mat-select [formControl]="statusFilter" (selectionChange)="onSearch()">
              <mat-option value="all">All Status</mat-option>
              <mat-option value="true">Active</mat-option>
              <mat-option value="false">Inactive</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      }
    </div>

    <app-data-table
      [columns]="columns"
      [dataSource]="dataSource"
      [loading]="loading()"
      [totalCount]="totalCount()"
      [pageIndex]="currentPage - 1"
      [pageSize]="currentLimit"
      (pageChange)="onPage($event)"
      emptyMessage="No therapies found.">
    </app-data-table>

    <ng-template #priceTpl let-price>
      {{ price | currency:'INR' }}
    </ng-template>

    <ng-template #durationTpl let-duration>
      {{ duration | durationFormat }}
    </ng-template>

    <ng-template #catTpl let-cat>
      {{ cat?.categoryName || 'N/A' }}
    </ng-template>

    <ng-template #statusTpl let-status>
      <app-status-badge [status]="status ? 'Active' : 'Inactive'"></app-status-badge>
    </ng-template>

    <ng-template #actionsTpl let-row="row">
      <div class="actions-cell">
        <!-- Show Edit only for ACTIVE -->
        @if (row.status) {
          <button *hasPermission="['Therapies', 'edit']" mat-icon-button color="accent" matTooltip="Edit Therapy" (click)="openForm(row)">
            <mat-icon>edit</mat-icon>
          </button>
        }

        <!-- Toggle for Status (Active/Inactive) -->
        <mat-slide-toggle 
          *hasPermission="['Therapies', 'edit']" 
          [checked]="row.status" 
          (change)="toggleStatus(row)"
          [matTooltip]="row.status ? 'Deactivate Therapy' : 'Activate to edit'"
          class="compact-toggle">
        </mat-slide-toggle>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { color: #1A1A1A; margin: 0; font-family: 'Inter', sans-serif; }
    .header-actions { display: flex; gap: 8px; }
    .filters-bar { 
      display: flex; 
      gap: 16px; 
      align-items: center; 
      flex-wrap: wrap; 
      margin-bottom: 24px;
      min-height: 56px;
    }
    .search-group { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      flex: 1; 
      max-width: 500px;
      min-width: 300px;
      @media (max-width: 768px) {
        max-width: 100%;
        min-width: 100%;
      }
    }
    .search-field { 
      flex: 1;
      ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: #fff !important;
        height: 44px !important;
      }
      ::ng-deep .mat-mdc-form-field-infix {
        padding-top: 11px !important;
        padding-bottom: 11px !important;
        min-height: 44px !important;
      }
    }
    .right-filters { 
      display: flex; 
      gap: 12px; 
      margin-left: auto; 
      align-items: center;
      @media (max-width: 768px) {
        margin-left: 0;
        width: 100%;
      }
      ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: #fff !important;
      }
    }
    .rounded-btn { 
      border-radius: 50px !important; 
      height: 44px; 
      padding: 0 20px; 
      font-weight: 600;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 8px;
      &.search-btn {
        min-width: 52px;
        width: 52px;
        height: 44px;
        padding: 0;
        background-color: #2C5F5D !important;
        color: #ffffff !important;
        border: none !important;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 8px !important;
        
        mat-icon {
          margin: 0 !important;
          font-size: 20px !important;
          width: 20px !important;
          height: 20px !important;
          color: #ffffff !important;
        }
      }
    }
    .rounded-btn mat-icon { 
      margin: 0 !important; 
      font-size: 20px !important; 
      width: 20px !important; 
      height: 20px !important;
      line-height: 20px !important;
      display: block !important;
    }
    .actions-cell { 
      display: flex; 
      gap: 12px; 
      align-items: center; 
      justify-content: center;
      width: 100%;
    }
    .compact-toggle {
      transform: scale(0.8);
      transform-origin: center;
    }
    .mr-2 { margin-right: 8px; }
    .bg-white { 
      background-color: #fff !important; 
      color: #2C5F5D !important; 
      border: 1px solid #E2DDD6 !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }
  `]
})
export class TherapyListComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;
  @ViewChild('priceTpl', { static: true }) priceTpl!: TemplateRef<any>;
  @ViewChild('durationTpl', { static: true }) durationTpl!: TemplateRef<any>;
  @ViewChild('catTpl', { static: true }) catTpl!: TemplateRef<any>;

  private service = inject(TherapiesService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  dataSource = new MatTableDataSource<Therapy>([]);
  totalCount = signal(0);
  searchControl = new FormControl('');
  statusFilter = new FormControl('true');
  
  currentPage = 1;
  currentLimit = 10;
  columns: TableColumn[] = [];

  ngOnInit() {
    this.columns = [
      { key: 'therapyName', label: 'Name' },
      { key: 'category', label: 'Category', template: this.catTpl },
      { key: 'price', label: 'Price', template: this.priceTpl },
      { key: 'durationMinutes', label: 'Duration', template: this.durationTpl },
      { key: 'status', label: 'Status', template: this.statusTpl }
    ];

    const user = this.authService.getCurrentUser();
    if (user?.role !== 'Receptionist' && user?.role !== 'User') {
      this.columns.push({ key: 'actions', label: 'Actions', template: this.actionsTpl });
    }

    this.loadData();
    this.searchControl.valueChanges.subscribe(val => {
      if (val) {
        const cleaned = val.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
        if (cleaned !== val) {
          this.searchControl.setValue(cleaned, { emitEvent: false });
        }
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadData();
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.onSearch();
  }

  loadData() {
    this.loading.set(true);
    const searchVal = this.searchControl.value ? this.searchControl.value.trim() : '';
    const statusVal = this.statusFilter.value;
    
    this.service.getAll({ 
      page: this.currentPage, 
      limit: this.currentLimit, 
      search: searchVal, 
      status: statusVal,
      includeInactive: true 
    }).subscribe({
      next: (res: ApiResponse<any>) => {
        this.dataSource.data = res.data?.data || [];
        this.totalCount.set(res.data?.pagination?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPage(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.currentLimit = event.pageSize;
    this.loadData();
  }

  isReceptionist(): boolean {
    return this.authService.getCurrentUser()?.role === 'Receptionist';
  }

  openForm(therapy?: Therapy) {
    const ref = this.dialog.open(TherapyFormComponent, { width: '500px', data: therapy });
    ref.afterClosed().subscribe((res: any) => {
      if (res) this.loadData();
    });
  }

  openSkills() {
    this.dialog.open(SkillsManageComponent, {
      width: '500px'
    });
  }

  toggleStatus(therapy: Therapy) {
    if (therapy.status) {
      // Deactivation: Show confirmation
      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { 
          title: 'Deactivate Therapy', 
          message: `Are you sure you want to deactivate ${therapy.therapyName}?`, 
          confirmLabel: 'Deactivate', 
          confirmColor: 'warn' 
        }
      });
      ref.afterClosed().subscribe((res: any) => {
        if (res) {
          this.performStatusUpdate(therapy, false);
        } else {
          this.loadData(); // Reset toggle state if cancelled
        }
      });
    } else {
      // Activation: Direct update
      this.performStatusUpdate(therapy, true);
    }
  }

  private performStatusUpdate(therapy: Therapy, newStatus: boolean) {
    this.service.update(therapy.therapyId, { status: newStatus }).subscribe({
      next: () => {
        const action = newStatus ? 'activated' : 'deactivated';
        this.notify.success(`Therapy "${therapy.therapyName}" ${action} successfully`);
        this.loadData();
      },
      error: (err: any) => {
        this.notify.error(err?.error?.message || `Failed to ${newStatus ? 'activate' : 'deactivate'}`);
        this.loadData(); // Reset toggle state
      }
    });
  }
}
