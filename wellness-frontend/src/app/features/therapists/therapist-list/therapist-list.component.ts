import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TherapistFormComponent } from '../therapist-form/therapist-form.component';
import { TherapistDetailComponent } from '../therapist-detail/therapist-detail.component';
import { TherapistsService } from '../../../core/services/therapists.service';
import { CentersService } from '../../../core/services/centers.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Center } from '../../../core/models/center.model';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-therapist-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatInputModule, MatDialogModule, MatSelectModule, MatTooltipModule, MatProgressSpinnerModule, ReactiveFormsModule, DataTableComponent, StatusBadgeComponent, HasPermissionDirective, MatSlideToggleModule],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">Therapists</h1>
      <button *hasPermission="['Therapists', 'create']" mat-raised-button color="primary" (click)="openForm()" class="bg-white">
        <mat-icon>add</mat-icon> Add Therapist
      </button>
    </div>

    <div class="filters-bar mb-4">
      <div class="search-group">
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-label>Search Name or Phone Number</mat-label>
          <input matInput [formControl]="searchControl" (keyup.enter)="onSearch()">
          @if (searchControl.value) {
            <button mat-icon-button matSuffix (click)="clearSearch()" aria-label="Clear search">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
        <button mat-raised-button color="primary" class="rounded-btn search-btn" (click)="onSearch()" matTooltip="Search">
           <mat-icon>search</mat-icon> 
        </button>
      </div>

      @if (!isReceptionist()) {
        <div class="right-filters">
          <mat-form-field appearance="outline" class="filter-field" subscriptSizing="dynamic">
            <mat-label>Filter by Center</mat-label>
            <mat-select [formControl]="centerControl">
              <mat-option [value]="null">All Centers</mat-option>
              @for (c of centers(); track c.centerId) {
                <mat-option [value]="c.centerId">{{ c.name }}</mat-option>
              }
            </mat-select>
            <mat-icon matPrefix>storefront</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field status-filter" subscriptSizing="dynamic">
            <mat-label>Status</mat-label>
            <mat-select [formControl]="statusControl">
              <mat-option value="active">Active</mat-option>
              <mat-option value="inactive">Inactive</mat-option>
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
      emptyMessage="No therapists found.">
    </app-data-table>

    <ng-template #nameTpl let-row="row">
      <button class="name-link" (click)="viewDetail(row)" [disabled]="detailLoading()">
        <span>{{ row.firstName }} {{ row.lastName }}</span>
        @if (detailLoading() && activeDetailId() === row.therapistId) {
          <mat-spinner diameter="14" style="display:inline-block"></mat-spinner>
        }
      </button>
    </ng-template>

    <ng-template #statusTpl let-status>
      <app-status-badge [status]="status ? 'Active' : 'Inactive'"></app-status-badge>
    </ng-template>

    <ng-template #centerTpl let-row="row">
      <span class="center-name-tag">
        <mat-icon class="mini-icon">storefront</mat-icon>
        {{ row.center?.name || 'N/A' }}
      </span>
    </ng-template>

    <ng-template #actionsTpl let-row="row">
      <div class="actions-cell">
        <!-- Edit icon for ACTIVE -->
        @if (row.status) {
          <button *hasPermission="['Therapists', 'edit']" mat-icon-button color="accent" matTooltip="Edit Therapist" (click)="openForm(row)">
            <mat-icon>edit</mat-icon>
          </button>
        }

        <!-- Toggle for status -->
        <mat-slide-toggle 
          *hasPermission="['Therapists', 'edit']" 
          [checked]="row.status" 
          (change)="toggleStatus(row)"
          [matTooltip]="row.status ? 'Deactivate Therapist' : 'Activate to edit'"
          class="compact-toggle">
        </mat-slide-toggle>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { color: #1A1A1A; margin: 0; }
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
      flex-wrap: wrap;
      align-items: center;
      @media (max-width: 992px) {
        margin-left: 0;
        width: 100%;
      }
      ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: #fff !important;
      }
    }
    .filter-field { 
      width: 220px;
      @media (max-width: 600px) {
        width: 100%;
      }
    }
    .status-filter { 
      width: 140px;
      @media (max-width: 600px) {
        width: 100%;
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
      overflow: visible !important;
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
    .name-link {
      /* Reset default <button> browser styles */
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      /* Link look */
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #1A73E8;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s;
    }
    .name-link:hover:not([disabled]) { color: #1557B0; text-decoration: underline; }
    .name-link[disabled] { cursor: default; opacity: 0.7; }

    .center-name-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #666;
      background: #F8F9F9;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #EAECEE;
    }

    .mini-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #2C5F5D;
    }
    .bg-white { 
      background-color: #fff !important; 
      color: #2C5F5D !important; 
      border: 1px solid #E2DDD6 !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }
    .actions-cell { 
      display: flex; 
      gap: 12px; 
      align-items: center; 
      justify-content: center;
      width: 100%;
    }
    .compact-toggle {
      transform: scale(0.85);
      margin: 0;
    }
  `]
})
export class TherapistListComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;
  @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
  @ViewChild('centerTpl', { static: true }) centerTpl!: TemplateRef<any>;

  private service = inject(TherapistsService);
  private centersService = inject(CentersService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  detailLoading = signal(false);
  activeDetailId = signal<number | null>(null);
  dataSource = new MatTableDataSource<any>([]);
  totalCount = signal(0);
  searchControl = new FormControl('');
  centerControl = new FormControl<number | null>(null);
  statusControl = new FormControl<string>('active');
  centers = signal<Center[]>([]);

  currentPage = 1;
  currentLimit = 10;
  columns: TableColumn[] = [];

  ngOnInit() {
    this.columns = [
      { key: 'name', label: 'Name', template: this.nameTpl },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'gender', label: 'Gender' },
      { key: 'experienceYears', label: 'Experience (Yrs)' },
      { key: 'status', label: 'Status', template: this.statusTpl }
    ];

    const user = this.authService.getCurrentUser();
    if (user?.role !== 'Receptionist' && user?.role !== 'User') {
      this.columns.push({ key: 'actions', label: 'Actions', template: this.actionsTpl });
    }

    this.loadData();
    this.loadCenters();

    this.searchControl.valueChanges.subscribe(val => {
      if (val) {
        const cleaned = val.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
        if (cleaned !== val) {
          this.searchControl.setValue(cleaned, { emitEvent: false });
        }
      }
    });

    // Center filter
    this.centerControl.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });

    // Status filter
    this.statusControl.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadData();
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.currentPage = 1;
    this.loadData();
  }

  loadCenters() {
    this.centersService.getAll({ limit: 100 }).subscribe((res: ApiResponse<any>) => {
      this.centers.set(res.data?.data || []);
    });
  }

  isReceptionist(): boolean {
    return this.authService.getCurrentUser()?.role === 'Receptionist';
  }

  loadData() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage,
      limit: this.currentLimit,
      search: this.searchControl.value ? this.searchControl.value.trim() : ''
    };

    if (this.centerControl.value) {
      params.centerId = this.centerControl.value;
    }

    // Pass includeInactive to allow fetching all if admin
    params.includeInactive = true;

    if (this.statusControl.value === 'active') {
      params.status = true;
    } else if (this.statusControl.value === 'inactive') {
      params.status = false;
    }

    this.service.getAll(params).subscribe({
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

  openForm(therapist?: any) {
    const ref = this.dialog.open(TherapistFormComponent, { width: '560px', data: therapist });
    ref.afterClosed().subscribe((res: any) => {
      if (res) this.loadData();
    });
  }

  viewDetail(therapist: any) {
    if (this.detailLoading()) return;
    this.detailLoading.set(true);
    this.activeDetailId.set(therapist.therapistId);

    this.service.getById(therapist.therapistId).subscribe({
      next: (res: ApiResponse<any>) => {
        this.detailLoading.set(false);
        this.activeDetailId.set(null);
        this.dialog.open(TherapistDetailComponent, {
          width: '640px',
          data: res.data
        });
      },
      error: () => {
        this.detailLoading.set(false);
        this.activeDetailId.set(null);
        this.notify.error('Failed to load therapist details.');
      }
    });
  }

  toggleStatus(therapist: any) {
    if (therapist.status) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { 
          title: 'Deactivate Therapist', 
          message: `Are you sure you want to deactivate ${therapist.firstName} ${therapist.lastName}?`, 
          confirmLabel: 'Deactivate', 
          confirmColor: 'warn' 
        }
      });
      ref.afterClosed().subscribe((res: any) => {
        if (res) {
          this.performStatusUpdate(therapist, false);
        } else {
          this.loadData();
        }
      });
    } else {
      this.performStatusUpdate(therapist, true);
    }
  }

  private performStatusUpdate(therapist: any, newStatus: boolean) {
    this.service.update(therapist.therapistId, { status: newStatus }).subscribe({
      next: () => {
        const action = newStatus ? 'activated' : 'deactivated';
        this.notify.success(`${therapist.firstName} ${action} successfully`);
        this.loadData();
      },
      error: (err: any) => {
        this.notify.error(err?.error?.message || `Failed to ${newStatus ? 'activate' : 'deactivate'}`);
        this.loadData();
      }
    });
  }
}

